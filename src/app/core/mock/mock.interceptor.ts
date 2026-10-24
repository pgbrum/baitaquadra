import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, switchMap, throwError, timer } from 'rxjs';
import { API_URL } from '../api.config';
import { ClienteInput, NIVEIS, QuadraInput, ReservaInput, TIPOS_RESERVA } from '../models/baita-quadra.models';
import {
  MOCK_SENHA, MOCK_USUARIO, ReservaRow, clienteDto, dataIso, db, diaMes, novoId, parseLocal, reservaDto, salvar,
  statusQuadraValido,
} from './mock-db';

// Modo demonstração: responde às chamadas da API com o "banco" local (mock-db.ts),
// seguindo as mesmas rotas, formatos e regras do backend .NET. Ativado por USE_MOCK em api.config.ts.

const LATENCIA_MS = 250;
const ABERTURA = 8;
const FECHAMENTO = 22;
const STATUS_RESERVA = ['CONFIRMADO', 'ATRASADO', 'EM ANDAMENTO', 'CANCELADO'];

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);
  const rota = req.url.slice(API_URL.length).split('?')[0];
  try {
    return responder(req, rota);
  } catch (e) {
    return falha(500, `Erro no modo demonstração: ${(e as Error).message}`);
  }
};

function ok<T>(body: T, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ status, body })).pipe(delay(LATENCIA_MS));
}

function falha(status: number, title: string, errors?: Record<string, string[]>): Observable<never> {
  return timer(LATENCIA_MS).pipe(
    switchMap(() => throwError(() => new HttpErrorResponse({ status, error: { title, status, errors }, url: '' })))
  );
}

const invalido = (campo: string, msg: string) =>
  falha(400, 'One or more validation errors occurred.', { [campo]: [msg] });

function responder(req: HttpRequest<unknown>, rota: string): Observable<HttpResponse<unknown>> {
  const { method } = req;

  if (method === 'POST' && rota === '/auth/login') {
    const { email, senha } = (req.body ?? {}) as { email?: string; senha?: string };
    if (email?.trim().toLowerCase() !== MOCK_USUARIO.email || senha !== MOCK_SENHA) {
      return falha(401, 'E-mail ou senha inválidos.');
    }
    const horas = req.params.get('lembrar') === 'true' ? 24 * 7 : 8;
    return ok({ token: `mock-${Date.now()}`, expiraEm: new Date(Date.now() + horas * 3_600_000).toISOString(), usuario: MOCK_USUARIO });
  }

  if (!req.headers.get('Authorization')?.startsWith('Bearer mock-')) return falha(401, 'Não autenticado.');

  if (rota === '/auth/me' && method === 'GET') return ok(MOCK_USUARIO);

  // ---------------- Clientes ----------------
  if (rota === '/clientes') {
    if (method === 'GET') {
      const busca = req.params.get('busca')?.trim().toLowerCase();
      const nivel = req.params.get('nivel');
      const lista = db.clientes
        .filter(c => !busca || c.nome.toLowerCase().includes(busca) || c.contato.includes(busca))
        .filter(c => !nivel || c.nivel === nivel)
        .sort((a, b) => req.params.get('ordem') === 'ultimaVisita'
          ? (b.ultimaVisita ?? '').localeCompare(a.ultimaVisita ?? '')
          : a.nome.localeCompare(b.nome));
      return ok(lista.map(clienteDto));
    }
    if (method === 'POST') {
      const input = req.body as ClienteInput;
      const erro = validarCliente(input);
      if (erro) return erro;
      const c = {
        id: novoId('c'), nome: input.nome.trim(), contato: input.contato?.trim() ?? '', nivel: input.nivel ?? 'Iniciante',
        membroDesde: dataIso(new Date()), ultimaVisita: null, saldo: input.saldo ?? 0,
      };
      db.clientes.push(c);
      salvar();
      return ok(clienteDto(c), 201);
    }
  }

  const mCliente = rota.match(/^\/clientes\/([\w-]+)$/);
  if (mCliente) {
    const c = db.clientes.find(x => x.id === mCliente[1]);
    if (!c) return falha(404, 'Cliente não encontrado.');
    if (method === 'GET') return ok(clienteDto(c));
    if (method === 'PUT') {
      const input = req.body as ClienteInput;
      const erro = validarCliente(input);
      if (erro) return erro;
      Object.assign(c, { nome: input.nome.trim(), contato: input.contato?.trim() ?? '', nivel: input.nivel ?? c.nivel, saldo: input.saldo ?? c.saldo });
      salvar();
      return ok(clienteDto(c));
    }
    if (method === 'DELETE') {
      db.clientes.splice(db.clientes.indexOf(c), 1);
      db.reservas.forEach(r => { if (r.clienteId === c.id) r.clienteId = null; }); // on delete set null
      salvar();
      return ok(null, 204);
    }
  }

  // ---------------- Quadras ----------------
  if (rota === '/quadras') {
    if (method === 'GET') {
      const status = req.params.get('status');
      return ok(db.quadras.filter(q => !status || q.status === status).sort((a, b) => a.nome.localeCompare(b.nome)));
    }
    if (method === 'POST') {
      const input = req.body as QuadraInput;
      const erro = validarQuadra(input);
      if (erro) return erro;
      const q = { ...normalizarQuadra(input), id: novoId('q') };
      db.quadras.push(q);
      salvar();
      return ok(q, 201);
    }
  }

  if (rota === '/quadras/resumo' && method === 'GET') {
    return ok({
      total: db.quadras.length,
      disponiveis: db.quadras.filter(q => q.status === 'Disponível').length,
      ocupadas: db.quadras.filter(q => q.status === 'Ocupada').length,
      manutencao: db.quadras.filter(q => q.status === 'Manutenção').length,
    });
  }

  const mQuadraStatus = rota.match(/^\/quadras\/([\w-]+)\/status$/);
  if (mQuadraStatus && method === 'PATCH') {
    const q = db.quadras.find(x => x.id === mQuadraStatus[1]);
    if (!q) return falha(404, 'Quadra não encontrada.');
    const { status } = req.body as { status: string };
    if (!statusQuadraValido(status)) return invalido('status', 'Valores aceitos: Disponível, Ocupada, Manutenção');
    q.status = status;
    salvar();
    return ok(q);
  }

  const mQuadra = rota.match(/^\/quadras\/([\w-]+)$/);
  if (mQuadra) {
    const q = db.quadras.find(x => x.id === mQuadra[1]);
    if (!q) return falha(404, 'Quadra não encontrada.');
    if (method === 'GET') return ok(q);
    if (method === 'PUT') {
      const input = req.body as QuadraInput;
      const erro = validarQuadra(input);
      if (erro) return erro;
      Object.assign(q, normalizarQuadra(input));
      salvar();
      return ok(q);
    }
    if (method === 'DELETE') {
      db.quadras.splice(db.quadras.indexOf(q), 1);
      db.reservas = db.reservas.filter(r => r.quadraId !== q.id); // on delete cascade
      salvar();
      return ok(null, 204);
    }
  }

  // ---------------- Reservas ----------------
  if (rota === '/reservas') {
    if (method === 'GET') {
      const data = req.params.get('data');
      const lista = db.reservas
        .filter(r => !data || r.inicio.slice(0, 10) === data)
        .filter(r => !req.params.get('quadraId') || r.quadraId === req.params.get('quadraId'))
        .filter(r => !req.params.get('clienteId') || r.clienteId === req.params.get('clienteId'))
        .filter(r => !req.params.get('status') || r.status === req.params.get('status'))
        .sort((a, b) => a.inicio.localeCompare(b.inicio));
      return ok(lista.map(r => reservaDto(r)));
    }
    if (method === 'POST') {
      const r: ReservaRow = { id: novoId('r'), quadraId: '', clienteId: null, tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: '', fim: '', status: 'CONFIRMADO', valor: 0, pago: false };
      const erro = aplicarReserva(r, req.body as ReservaInput);
      if (erro) return erro;
      db.reservas.push(r);
      salvar();
      return ok(reservaDto(r), 201);
    }
  }

  if (rota === '/reservas/proximos' && method === 'GET') {
    const agora = new Date();
    const limite = Number(req.params.get('limite') ?? 10);
    return ok(db.reservas
      .filter(r => parseLocal(r.fim) > agora && r.status !== 'CANCELADO')
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .slice(0, limite)
      .map(r => reservaDto(r, agora)));
  }

  const mReservaStatus = rota.match(/^\/reservas\/([\w-]+)\/status$/);
  if (mReservaStatus && method === 'PATCH') {
    const r = db.reservas.find(x => x.id === mReservaStatus[1]);
    if (!r) return falha(404, 'Reserva não encontrada.');
    const { status } = req.body as { status: string };
    if (!STATUS_RESERVA.includes(status)) return invalido('status', `Valores aceitos: ${STATUS_RESERVA.join(', ')}`);
    r.status = status;
    salvar();
    return ok(reservaDto(r));
  }

  const mReserva = rota.match(/^\/reservas\/([\w-]+)$/);
  if (mReserva) {
    const r = db.reservas.find(x => x.id === mReserva[1]);
    if (!r) return falha(404, 'Reserva não encontrada.');
    if (method === 'GET') return ok(reservaDto(r));
    if (method === 'PUT') {
      const erro = aplicarReserva(r, req.body as ReservaInput);
      if (erro) return erro;
      salvar();
      return ok(reservaDto(r));
    }
    if (method === 'DELETE') {
      db.reservas.splice(db.reservas.indexOf(r), 1);
      salvar();
      return ok(null, 204);
    }
  }

  // ---------------- Agenda ----------------
  if (rota === '/agenda' && method === 'GET') {
    const data = req.params.get('data') ?? dataIso(new Date());
    const dia = parseLocal(data);
    const agora = new Date();
    const doDia = db.reservas
      .filter(r => r.inicio.slice(0, 10) === data && r.status !== 'CANCELADO')
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
    return ok({
      data,
      titulo: data === dataIso(agora) ? `Agenda de Hoje, ${diaMes(dia)}` : `Agenda de ${diaMes(dia)}`,
      horas: Array.from({ length: FECHAMENTO - ABERTURA }, (_, i) => `${String(ABERTURA + i).padStart(2, '0')}:00`),
      quadras: [...db.quadras].sort((a, b) => a.nome.localeCompare(b.nome)).map(q => ({
        id: q.id, nome: q.nome,
        tipo: q.status === 'Manutenção' ? 'MANUTENÇÃO' : q.tipo.toUpperCase(),
        status: q.status,
        reservas: doDia.filter(r => r.quadraId === q.id).map(r => reservaDto(r, agora)),
      })),
    });
  }

  // ---------------- Dashboard ----------------
  if (rota === '/dashboard/resumo' && method === 'GET') {
    const hoje = dataIso(new Date());
    const inicioMes = hoje.slice(0, 8) + '01';
    const deHoje = db.reservas.filter(r => r.inicio.slice(0, 10) === hoje && r.status !== 'CANCELADO');
    return ok({
      reservasHoje: deHoje.length,
      quadrasOcupadas: db.quadras.filter(q => q.status === 'Ocupada').length,
      novosClientes: db.clientes.filter(c => c.membroDesde >= inicioMes).length,
      receitaPrevista: deHoje.reduce((s, r) => s + r.valor, 0),
    });
  }

  if (rota === '/dashboard/ocupacao' && method === 'GET') {
    const mensal = req.params.get('periodo') === 'mes';
    const hoje = parseLocal(dataIso(new Date()));
    const inicio = mensal
      ? new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      : new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
    const fim = mensal ? new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1) : new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7);
    const capacidade = Math.max(db.quadras.filter(q => q.status !== 'Manutenção').length * (FECHAMENTO - ABERTURA), 1);
    const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dias = [];
    for (let d = new Date(inicio); d < fim; d.setDate(d.getDate() + 1)) {
      const iso = dataIso(d);
      const doDia = db.reservas.filter(r => r.inicio.slice(0, 10) === iso && r.status !== 'CANCELADO');
      const horas = doDia.reduce((s, r) => s + (parseLocal(r.fim).getTime() - parseLocal(r.inicio).getTime()) / 3_600_000, 0);
      dias.push({
        data: iso,
        rotulo: mensal ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : SEMANA[d.getDay()],
        reservas: doDia.length,
        horasReservadas: horas,
        percentualOcupacao: Math.round((horas / capacidade) * 1000) / 10,
      });
    }
    return ok(dias);
  }

  return falha(404, `Rota não simulada no modo demonstração: ${method} ${rota}`);
}

// ---------------- validações (mesmas regras do backend) ----------------
function validarCliente(input: ClienteInput) {
  if (!input?.nome?.trim()) return invalido('nome', 'Informe o nome do cliente.');
  if (input.nivel && !NIVEIS.includes(input.nivel)) return invalido('nivel', `Valores aceitos: ${NIVEIS.join(', ')}`);
  return null;
}

function validarQuadra(input: QuadraInput) {
  if (!input?.nome?.trim()) return invalido('nome', 'Informe o nome da quadra.');
  if (input.status && !statusQuadraValido(input.status)) return invalido('status', 'Valores aceitos: Disponível, Ocupada, Manutenção');
  return null;
}

function normalizarQuadra(input: QuadraInput) {
  return {
    nome: input.nome.trim(), tipo: input.tipo ?? '', esporte: input.esporte ?? '', iluminacao: input.iluminacao ?? '',
    dimensoes: input.dimensoes ?? '', status: input.status ?? 'Disponível', valorHora: Number(input.valorHora ?? 0),
  } as const;
}

function aplicarReserva(r: ReservaRow, input: ReservaInput) {
  const inicio = parseLocal(input.inicio);
  const fim = parseLocal(input.fim);
  if (!(fim > inicio)) return invalido('fim', 'O horário final deve ser maior que o inicial.');
  if (!TIPOS_RESERVA.includes(input.tipo)) return invalido('tipo', `Valores aceitos: ${TIPOS_RESERVA.join(', ')}`);

  const quadra = db.quadras.find(q => q.id === input.quadraId);
  if (!quadra) return invalido('quadraId', 'Quadra não encontrada.');
  if (quadra.status === 'Manutenção') return invalido('quadraId', 'A quadra está em manutenção.');
  if (input.clienteId && !db.clientes.some(c => c.id === input.clienteId)) return invalido('clienteId', 'Cliente não encontrado.');
  if (!input.clienteId && input.tipo === 'LOCAÇÃO') return invalido('clienteId', 'Locações precisam de um cliente.');

  const conflito = db.reservas.some(x =>
    x.id !== r.id && x.quadraId === input.quadraId && x.status !== 'CANCELADO' &&
    parseLocal(x.inicio) < fim && parseLocal(x.fim) > inicio);
  if (conflito) return falha(409, 'Já existe uma reserva nesse horário para esta quadra.');

  Object.assign(r, {
    quadraId: input.quadraId,
    clienteId: input.clienteId ?? null,
    tipo: input.tipo,
    titulo: input.titulo ?? null,
    descricao: input.descricao ?? null,
    inicio: input.inicio,
    fim: input.fim,
    pago: input.pago ?? r.pago,
    valor: input.valor ?? Math.round(quadra.valorHora * ((fim.getTime() - inicio.getTime()) / 3_600_000) * 100) / 100,
  });
  return null;
}
