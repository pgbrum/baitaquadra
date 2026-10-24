import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservaService } from '../../core/services/reserva.service';
import { SyncService } from '../../core/services/sync.service';
import { DashboardResumo, OcupacaoDia, Reserva } from '../../core/models/baita-quadra.models';
import { ModalService } from '../../shared/services/ui.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private reservaService = inject(ReservaService);
  private sync = inject(SyncService);
  private modal = inject(ModalService);

  proximosJogos = toSignal(this.reservaService.reservas$, { initialValue: [] });
  resumo = signal<DashboardResumo | null>(null);
  ocupacao = signal<OcupacaoDia[]>([]);
  periodo = signal<'semana' | 'mes'>('semana');

  // Escala do gráfico: a maior barra ocupa a altura toda
  maxHoras = computed(() => Math.max(1, ...this.ocupacao().map(d => d.horasReservadas)));
  hoje = new Date().toLocaleDateString('sv-SE'); // yyyy-MM-dd no fuso local

  constructor() {
    effect(() => {
      this.sync.versao();
      untracked(() => {
        this.reservaService.carregarProximosJogos();
        this.reservaService.obterResumo().then(r => this.resumo.set(r)).catch(() => {});
      });
    });
    effect(() => {
      const periodo = this.periodo();
      this.sync.versao();
      untracked(() => this.reservaService.obterOcupacao(periodo).then(o => this.ocupacao.set(o)).catch(() => {}));
    });
  }

  alturaBarra(dia: OcupacaoDia) {
    return `${Math.max(dia.horasReservadas ? 6 : 2, (dia.horasReservadas / this.maxHoras()) * 100)}%`;
  }

  abrirJogo(jogo: Reserva) {
    this.modal.abrir({ tipo: 'detalheReserva', reserva: jogo });
  }
}
