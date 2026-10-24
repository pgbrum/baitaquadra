import { Injectable, signal } from '@angular/core';
import { Cliente, Quadra, Reserva } from '../../core/models/baita-quadra.models';

export type Modal =
  | { tipo: 'reserva'; quadraId?: string; data?: string; hora?: string }
  | { tipo: 'detalheReserva'; reserva: Reserva }
  | { tipo: 'cliente'; cliente?: Cliente }
  | { tipo: 'quadra'; quadra?: Quadra };

// Controla qual modal está aberto (renderizado uma vez no Layout)
@Injectable({ providedIn: 'root' })
export class ModalService {
  atual = signal<Modal | null>(null);

  abrir(modal: Modal) {
    this.atual.set(modal);
  }

  fechar() {
    this.atual.set(null);
  }
}

export interface Toast {
  id: number;
  mensagem: string;
  tipo: 'sucesso' | 'erro';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private seq = 0;

  sucesso(mensagem: string) {
    this.mostrar(mensagem, 'sucesso');
  }

  erro(mensagem: string) {
    this.mostrar(mensagem, 'erro');
  }

  private mostrar(mensagem: string, tipo: Toast['tipo']) {
    const id = ++this.seq;
    this.toasts.update(t => [...t, { id, mensagem, tipo }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 3500);
  }
}
