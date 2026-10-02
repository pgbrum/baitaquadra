import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaitaQuadraService } from '../../core/services/baita-quadra.service';
import { Reserva } from '../../core/models/baita-quadra.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private service = inject(BaitaQuadraService);
  
  proximosJogos = signal<Reserva[]>([]);

  async ngOnInit() {
    try {
      const jogos = await this.service.getProximosJogos();
      // O || [] garante que mesmo sem dados a tela não quebre
      this.proximosJogos.set(jogos || []);
    } catch (error) {
      console.error('Erro ao carregar próximos jogos:', error);
    }
  }
}