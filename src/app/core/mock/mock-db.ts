import { Cliente, NivelCliente, Quadra, Reserva, StatusQuadra, TipoReserva } from '../models/baita-quadra.models';

// "Banco" do modo demonstração: fica em memória e é copiado para o sessionStorage,
// então sobrevive a um F5 e é descartado ao fechar o navegador.

export const MOCK_USUARIO = { id: 'u-1', nome: 'Administrador', email: 'admin@baitaquadra.com' };
export const MOCK_SENHA = 'admin123';

const CHAVE = 'baitaquadra.demo';
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface ClienteRow {
  id: string; nome: string; contato: string; nivel: NivelCliente;
  membroDesde: string; ultimaVisita: string | null; saldo: number; // datas yyyy-MM-dd
}

export type QuadraRow = Quadra & { valorHora: number };

export interface ReservaRow {
  id: string; quadraId: string; clienteId: string | null; tipo: TipoReserva;
  titulo: string | null; descricao: string | null;
  inicio: string; fim: string; // yyyy-MM-ddTHH:mm:ss local
  status: string; valor: number; pago: boolean;
}

interface Estado {
  clientes: ClienteRow[];
  quadras: QuadraRow[];
  reservas: ReservaRow[];
}

// ---------- utilitários de data ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const dataIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dataHoraIso = (d: Date) => `${dataIso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
export const parseLocal = (s: string) => new Date(s.length === 10 ? `${s}T00:00:00` : s);

function hoje(desloc = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + desloc);
  return d;
}

const emHoras = (dia: number, h: number) => dataHoraIso(new Date(hoje(dia).getTime() + h * 3_600_000));

export const mesAno = (d: Date) => `${MESES[d.getMonth()]} ${d.getFullYear()}`;
export const diaMes = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`;

export function iniciais(nome: string): string {
  const p = nome.split(' ').filter(Boolean);
  if (p.length === 0) return '?';
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function dataRelativa(iso: string | null): string {
  if (!iso) return '—';
  if (iso === dataIso(hoje())) return 'Hoje';
  if (iso === dataIso(hoje(-1))) return 'Ontem';
  return parseLocal(iso).toLocaleDateString('pt-BR');
}

export const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------- dados iniciais (mesmos do seed do backend) ----------
function estadoInicial(): Estado {
  return {
    quadras: [
      { id: 'q-1', nome: 'Quadra 1', tipo: 'Areia Fina', esporte: 'Beach Tennis', iluminacao: 'Iluminação LED', dimensoes: '16m x 8m', status: 'Disponível', valorHora: 120 },
      { id: 'q-2', nome: 'Quadra 2', tipo: 'Areia Fina', esporte: 'Futevôlei', iluminacao: 'Iluminação LED', dimensoes: '18m x 9m', status: 'Ocupada', valorHora: 120 },
      { id: 'q-3', nome: 'Quadra 3', tipo: 'Areia Grossa', esporte: 'Vôlei de Praia', iluminacao: 'Iluminação Halógena', dimensoes: '16m x 8m', status: 'Disponível', valorHora: 100 },
      { id: 'q-4', nome: 'Quadra 4', tipo: 'Areia Fina', esporte: 'Beach Tennis', iluminacao: 'Sem iluminação', dimensoes: '16m x 8m', status: 'Manutenção', valorHora: 90 },
    ],
    clientes: [
      { id: 'c-1', nome: 'Ana Souza', contato: '(51) 98123-4567', nivel: 'Avançado', membroDesde: '2022-08-01', ultimaVisita: dataIso(hoje(-3)), saldo: -40 },
      { id: 'c-2', nome: 'Carlos Silva', contato: '(51) 99812-3344', nivel: 'Intermédio', membroDesde: '2023-03-01', ultimaVisita: dataIso(hoje(-1)), saldo: 150 },
      { id: 'c-3', nome: 'Júlia Ferreira', contato: '(51) 98877-1122', nivel: 'Intermédio', membroDesde: dataIso(hoje(-5)), ultimaVisita: dataIso(hoje()), saldo: 80 },
      { id: 'c-4', nome: 'Marcos Lima', contato: '(51) 99654-7788', nivel: 'Iniciante', membroDesde: '2024-01-01', ultimaVisita: dataIso(hoje(-10)), saldo: 0 },
      { id: 'c-5', nome: 'Rafael Costa', contato: '(51) 99321-6655', nivel: 'Avançado', membroDesde: '2023-05-01', ultimaVisita: dataIso(hoje(-2)), saldo: 220 },
      { id: 'c-6', nome: 'Beatriz Martins', contato: '(51) 98456-2233', nivel: 'Iniciante', membroDesde: '2023-11-01', ultimaVisita: dataIso(hoje(-6)), saldo: -25 },
    ],
    reservas: [
      { id: 'r-1', quadraId: 'q-1', clienteId: null, tipo: 'AULA', titulo: 'Iniciante - Prof. João', descricao: '4 alunos', inicio: emHoras(0, 8), fim: emHoras(0, 9.5), status: 'CONFIRMADO', valor: 160, pago: true },
      { id: 'r-2', quadraId: 'q-2', clienteId: 'c-2', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(0, 9), fim: emHoras(0, 10.5), status: 'CONFIRMADO', valor: 180, pago: true },
      { id: 'r-3', quadraId: 'q-3', clienteId: null, tipo: 'TORNEIO', titulo: 'Copa Outono', descricao: 'Fase de Grupos - Chave A', inicio: emHoras(0, 8), fim: emHoras(0, 12), status: 'CONFIRMADO', valor: 400, pago: true },
      { id: 'r-4', quadraId: 'q-1', clienteId: 'c-5', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(0, 17), fim: emHoras(0, 18), status: 'CONFIRMADO', valor: 120, pago: false },
      { id: 'r-5', quadraId: 'q-1', clienteId: 'c-1', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(0, 18), fim: emHoras(0, 19.5), status: 'CONFIRMADO', valor: 180, pago: false },
      { id: 'r-6', quadraId: 'q-2', clienteId: 'c-4', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(0, 19), fim: emHoras(0, 20), status: 'ATRASADO', valor: 120, pago: false },
      { id: 'r-7', quadraId: 'q-3', clienteId: 'c-6', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(0, 20), fim: emHoras(0, 21), status: 'CONFIRMADO', valor: 100, pago: true },
      { id: 'r-8', quadraId: 'q-3', clienteId: 'c-3', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(1, 10), fim: emHoras(1, 11), status: 'CONFIRMADO', valor: 100, pago: false },
      { id: 'r-9', quadraId: 'q-2', clienteId: 'c-2', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(1, 18), fim: emHoras(1, 19.5), status: 'CONFIRMADO', valor: 180, pago: false },
      { id: 'r-10', quadraId: 'q-1', clienteId: 'c-3', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(-1, 18), fim: emHoras(-1, 19), status: 'CONFIRMADO', valor: 120, pago: true },
      { id: 'r-11', quadraId: 'q-3', clienteId: 'c-5', tipo: 'LOCAÇÃO', titulo: null, descricao: null, inicio: emHoras(-2, 19), fim: emHoras(-2, 21), status: 'CONFIRMADO', valor: 200, pago: true },
    ],
  };
}

// ---------- persistência ----------
function carregar(): Estado {
  try {
    const bruto = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(CHAVE) : null;
    if (bruto) return JSON.parse(bruto) as Estado;
  } catch { /* sessionStorage indisponível ou corrompido */ }
  return estadoInicial();
}

export const db: Estado = carregar();

export function salvar() {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(db));
  } catch { /* segue só em memória */ }
}

// ---------- conversão para o formato da API ----------
export function clienteDto(c: ClienteRow): Cliente {
  return {
    id: c.id, nome: c.nome, iniciais: iniciais(c.nome), membroDesde: mesAno(parseLocal(c.membroDesde)),
    contato: c.contato, nivel: c.nivel, ultimaVisita: dataRelativa(c.ultimaVisita), saldo: c.saldo,
  };
}

export function reservaDto(r: ReservaRow, agora = new Date()): Reserva {
  const inicio = parseLocal(r.inicio);
  const fim = parseLocal(r.fim);
  const cliente = db.clientes.find(c => c.id === r.clienteId);
  const quadra = db.quadras.find(q => q.id === r.quadraId);
  const nome = cliente?.nome ?? r.titulo ?? 'Cliente';
  const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const horario = `${hhmm(inicio)} - ${hhmm(fim)}`;
  const dia = dataIso(inicio) === dataIso(new Date()) ? '' : `${pad(inicio.getDate())}/${pad(inicio.getMonth() + 1)} `;
  const emAndamento = r.status === 'CONFIRMADO' && agora >= inicio && agora < fim;
  return {
    id: r.id,
    status: emAndamento ? 'EM ANDAMENTO' : r.status,
    clienteNome: nome,
    clienteIniciais: iniciais(nome),
    quadraInfo: `${quadra?.nome ?? 'Quadra'} • ${dia}${horario}`,
    quadraId: r.quadraId,
    quadraNome: quadra?.nome ?? 'Quadra',
    clienteId: r.clienteId,
    tipo: r.tipo,
    titulo: r.titulo,
    descricao: r.descricao,
    inicio: r.inicio,
    fim: r.fim,
    horario,
    valor: r.valor,
    pago: r.pago,
  };
}

export const statusQuadraValido = (s: string): s is StatusQuadra => ['Disponível', 'Ocupada', 'Manutenção'].includes(s);
