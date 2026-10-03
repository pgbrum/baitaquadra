import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservaService } from '../../core/services/reserva.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private reservaService = inject(ReservaService);
  
  proximosJogos = toSignal(this.reservaService.reservas$, { initialValue: [] });

  ngOnInit() {
    this.reservaService.carregarProximosJogos();
  }
}