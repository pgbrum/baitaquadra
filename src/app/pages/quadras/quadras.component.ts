import { Component, inject, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuadraService } from '../../core/services/quadra.service';
import { SyncService } from '../../core/services/sync.service';
import { Quadra } from '../../core/models/baita-quadra.models';
import { ModalService } from '../../shared/services/ui.service';

@Component({
  selector: 'app-quadras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadras.component.html'
})
export class QuadrasComponent {
  private quadraService = inject(QuadraService);
  private sync = inject(SyncService);
  private modal = inject(ModalService);

  // Converte o BehaviorSubject num Signal automaticamente. O HTML continua a funcionar!
  quadras = toSignal(this.quadraService.quadras$, { initialValue: [] });

  total = computed(() => this.quadras().length);
  disponiveis = computed(() => this.quadras().filter(q => q.status === 'Disponível').length);
  ocupadas = computed(() => this.quadras().filter(q => q.status === 'Ocupada').length);
  manutencao = computed(() => this.quadras().filter(q => q.status === 'Manutenção').length);

  constructor() {
    // Busca os dados ao abrir a tela e sempre que algo for alterado em outro lugar
    effect(() => {
      this.sync.versao();
      untracked(() => this.quadraService.carregarQuadras());
    });
  }

  reservar(quadra: Quadra) {
    this.modal.abrir({ tipo: 'reserva', quadraId: quadra.id });
  }

  editar(quadra: Quadra) {
    this.modal.abrir({ tipo: 'quadra', quadra });
  }

  nova() {
    this.modal.abrir({ tipo: 'quadra' });
  }
}
