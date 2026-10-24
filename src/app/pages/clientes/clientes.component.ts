import { Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClienteService } from '../../core/services/cliente.service';
import { SyncService } from '../../core/services/sync.service';
import { Cliente, NIVEIS } from '../../core/models/baita-quadra.models';
import { ModalService } from '../../shared/services/ui.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent {
  private clienteService = inject(ClienteService);
  private sync = inject(SyncService);
  private modal = inject(ModalService);

  // Transforma o BehaviorSubject do serviço num Signal automaticamente
  clientes = toSignal(this.clienteService.clientes$, { initialValue: [] });

  niveis = NIVEIS;
  busca = signal('');
  nivel = signal('');
  ordem = signal<'nome' | 'ultimaVisita'>('nome');
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() {
    // Recarrega ao mudar filtros ou quando algum cliente é criado/editado
    effect(() => {
      const filtro = { busca: this.busca(), nivel: this.nivel(), ordem: this.ordem() };
      this.sync.versao();
      untracked(() => this.clienteService.carregarClientes(filtro));
    });
  }

  buscar(valor: string) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.busca.set(valor.trim()), 250);
  }

  alternarOrdem() {
    this.ordem.update(o => (o === 'nome' ? 'ultimaVisita' : 'nome'));
  }

  novo() {
    this.modal.abrir({ tipo: 'cliente' });
  }

  editar(cliente: Cliente) {
    this.modal.abrir({ tipo: 'cliente', cliente });
  }
}
