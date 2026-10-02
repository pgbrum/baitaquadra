export type NivelCliente = 'Iniciante' | 'Intermédio' | 'Avançado';
export type StatusQuadra = 'Disponível' | 'Ocupada' | 'Manutenção';
export type StatusReserva = 'CONFIRMADO' | 'ATRASADO' | 'EM ANDAMENTO';

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

export interface Quadra {
  id: string;
  nome: string;
  tipo: string;
  esporte: string;
  iluminacao: string;
  dimensoes: string;
  status: StatusQuadra;
}

export interface Reserva {
  id: string;
  status: string;
  clienteNome?: string;
  cliente_nome?: string;
  clienteIniciais?: string;
  cliente_iniciais?: string;
  quadraInfo?: string;
  quadra_info?: string;
  [key: string]: any; 
}