export type NivelCliente = 'Iniciante' | 'Intermédio' | 'Avançado';
export type StatusQuadra = 'Disponível' | 'Ocupada' | 'Manutenção';
export type StatusReserva = 'CONFIRMADO' | 'ATRASADO' | 'EM ANDAMENTO' | 'CANCELADO';
export type TipoReserva = 'LOCAÇÃO' | 'AULA' | 'TORNEIO';

export const NIVEIS: NivelCliente[] = ['Iniciante', 'Intermédio', 'Avançado'];
export const STATUS_QUADRA: StatusQuadra[] = ['Disponível', 'Ocupada', 'Manutenção'];
export const TIPOS_RESERVA: TipoReserva[] = ['LOCAÇÃO', 'AULA', 'TORNEIO'];

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: Usuario;
}

export interface Cliente {
  id: string;
  nome: string;
  iniciais: string;
  membroDesde: string;
  contato: string;
  nivel: NivelCliente;
  ultimaVisita: string;
  saldo: number;
}

export interface ClienteInput {
  nome: string;
  contato?: string;
  nivel?: NivelCliente;
  saldo?: number;
}

export interface Quadra {
  id: string;
  nome: string;
  tipo: string;
  esporte: string;
  iluminacao: string;
  dimensoes: string;
  status: StatusQuadra;
  valorHora?: number;
}

export type QuadraInput = Omit<Quadra, 'id'>;

export interface Reserva {
  id: string;
  status: string;
  clienteNome?: string;
  cliente_nome?: string;
  clienteIniciais?: string;
  cliente_iniciais?: string;
  quadraInfo?: string;
  quadra_info?: string;
  quadraId?: string;
  quadraNome?: string;
  clienteId?: string | null;
  tipo?: TipoReserva;
  titulo?: string | null;
  descricao?: string | null;
  inicio?: string; // yyyy-MM-ddTHH:mm:ss (horário local)
  fim?: string;
  horario?: string;
  valor?: number;
  pago?: boolean;
  [key: string]: any;
}

export interface ReservaInput {
  quadraId: string;
  clienteId?: string | null;
  tipo: TipoReserva;
  titulo?: string | null;
  descricao?: string | null;
  inicio: string;
  fim: string;
  valor?: number;
  pago?: boolean;
}

export interface AgendaQuadra {
  id: string;
  nome: string;
  tipo: string;
  status: StatusQuadra;
  reservas: Reserva[];
}

export interface Agenda {
  data: string;
  titulo: string;
  horas: string[];
  quadras: AgendaQuadra[];
}

export interface DashboardResumo {
  reservasHoje: number;
  quadrasOcupadas: number;
  novosClientes: number;
  receitaPrevista: number;
}

export interface OcupacaoDia {
  data: string;
  rotulo: string;
  reservas: number;
  horasReservadas: number;
  percentualOcupacao: number;
}
