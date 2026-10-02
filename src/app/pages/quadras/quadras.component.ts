import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaitaQuadraService } from '../../core/services/baita-quadra.service';
import { Quadra } from '../../core/models/baita-quadra.models';

@Component({
  selector: 'app-quadras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadras.component.html'
})
export class QuadrasComponent implements OnInit {
  private service = inject(BaitaQuadraService);
  
  quadras = signal<Quadra[]>([]);

  // O "|| []" protege contra dados nulos evitando que a página quebre
  total = computed(() => (this.quadras() || []).length);
  disponiveis = computed(() => (this.quadras() || []).filter(q => q.status === 'Disponível').length);
  ocupadas = computed(() => (this.quadras() || []).filter(q => q.status === 'Ocupada').length);
  manutencao = computed(() => (this.quadras() || []).filter(q => q.status === 'Manutenção').length);

  async ngOnInit() {
    try {
      const data = await this.service.getQuadras();
      this.quadras.set(data || []);
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    }
  }
}