import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuadraService } from '../../core/services/quadra.service';

@Component({
  selector: 'app-quadras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadras.component.html'
})
export class QuadrasComponent implements OnInit {
  private quadraService = inject(QuadraService);
  
  // Converte o BehaviorSubject num Signal automaticamente. O HTML continua a funcionar!
  quadras = toSignal(this.quadraService.quadras$, { initialValue: [] });

  total = computed(() => this.quadras().length);
  disponiveis = computed(() => this.quadras().filter(q => q.status === 'Disponível').length);
  ocupadas = computed(() => this.quadras().filter(q => q.status === 'Ocupada').length);
  manutencao = computed(() => this.quadras().filter(q => q.status === 'Manutenção').length);

  ngOnInit() {
    // Apenas manda o serviço ir buscar os dados. O BehaviorSubject reage e atualiza o ecrã sozinho.
    this.quadraService.carregarQuadras();
  }
}