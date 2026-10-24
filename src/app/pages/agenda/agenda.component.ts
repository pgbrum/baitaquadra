import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservaService } from '../../core/services/reserva.service';
import { SyncService } from '../../core/services/sync.service';
import { Agenda, AgendaQuadra, Reserva } from '../../core/models/baita-quadra.models';
import { ModalService } from '../../shared/services/ui.service';

// Altura de 1 hora na grade (h-24 = 96px)
const ALTURA_HORA = 96;

const dataLocal = (d: Date) => d.toLocaleDateString('sv-SE'); // yyyy-MM-dd

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent {
  private reservaService = inject(ReservaService);
  private sync = inject(SyncService);
  private modal = inject(ModalService);

  data = signal(dataLocal(new Date()));
  agenda = signal<Agenda | null>(null);
  carregando = signal(true);
  agora = signal(new Date());

  // Horários de funcionamento da quadra
  horas = computed(() => this.agenda()?.horas ?? []);
  quadras = computed(() => this.agenda()?.quadras ?? []);
  abertura = computed(() => Number(this.horas()[0]?.slice(0, 2) ?? 8));
  colunas = computed(() => `80px repeat(${Math.max(this.quadras().length, 1)}, minmax(160px, 1fr))`);
  ehHoje = computed(() => this.data() === dataLocal(this.agora()));

  // Linha vermelha do horário atual
  linhaAgora = computed(() => {
    const a = this.agora();
    const h = a.getHours() + a.getMinutes() / 60 - this.abertura();
    return this.ehHoje() && h >= 0 && h <= this.horas().length ? h * ALTURA_HORA : null;
  });

  constructor() {
    effect(() => {
      const data = this.data();
      this.sync.versao();
      untracked(() => this.carregar(data));
    });
    const relogio = setInterval(() => this.agora.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(relogio));
  }

  private async carregar(data: string) {
    this.carregando.set(true);
    try {
      this.agenda.set(await this.reservaService.obterAgenda(data));
    } catch {
      this.agenda.set(null);
    } finally {
      this.carregando.set(false);
    }
  }

  mudarDia(delta: number) {
    const d = new Date(`${this.data()}T12:00:00`);
    d.setDate(d.getDate() + delta);
    this.data.set(dataLocal(d));
  }

  irParaHoje() {
    this.data.set(dataLocal(new Date()));
  }

  // Posição/altura do card proporcionais ao horário (top-0 = abertura)
  estiloCard(r: Reserva) {
    const inicio = new Date(r.inicio!);
    const fim = new Date(r.fim!);
    const h0 = inicio.getHours() + inicio.getMinutes() / 60 - this.abertura();
    const dur = (fim.getTime() - inicio.getTime()) / 3_600_000;
    return { top: `${h0 * ALTURA_HORA + 2}px`, height: `${dur * ALTURA_HORA - 4}px` };
  }

  corCard(r: Reserva) {
    if (r.tipo === 'AULA') return 'bg-tertiary text-yellow-900 border border-yellow-400';
    if (r.tipo === 'TORNEIO') return 'bg-secondary text-white';
    return r.status === 'ATRASADO' ? 'bg-primary text-white ring-2 ring-secondary' : 'bg-primary text-white';
  }

  novaReserva(quadra: AgendaQuadra, hora: string) {
    if (quadra.status === 'Manutenção') return;
    this.modal.abrir({ tipo: 'reserva', quadraId: quadra.id, data: this.data(), hora });
  }

  abrir(reserva: Reserva) {
    this.modal.abrir({ tipo: 'detalheReserva', reserva });
  }
}
