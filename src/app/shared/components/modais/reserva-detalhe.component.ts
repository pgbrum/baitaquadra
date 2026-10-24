import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reserva, StatusReserva } from '../../../core/models/baita-quadra.models';
import { ReservaService } from '../../../core/services/reserva.service';
import { mensagemErro } from '../../../core/services/sync.service';
import { ModalService, ToastService } from '../../services/ui.service';

@Component({
  selector: 'app-reserva-detalhe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reserva-detalhe.component.html'
})
export class ReservaDetalheComponent {
  @Input({ required: true }) set reserva(r: Reserva) { this.atual.set(r); }

  private reservaService = inject(ReservaService);
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  atual = signal<Reserva | null>(null);
  processando = signal(false);
  confirmarCancelamento = signal(false);

  dataFormatada(iso?: string) {
    if (!iso) return '';
    const texto = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  async status(novo: StatusReserva, mensagem: string) {
    await this.executar(async () => {
      this.atual.set(await this.reservaService.alterarStatus(this.atual()!.id, novo));
      this.toast.sucesso(mensagem);
    });
  }

  async pagar() {
    await this.executar(async () => {
      this.atual.set(await this.reservaService.marcarPago(this.atual()!));
      this.toast.sucesso('Pagamento registrado.');
    });
  }

  async cancelar() {
    if (!this.confirmarCancelamento()) return this.confirmarCancelamento.set(true);
    await this.executar(async () => {
      await this.reservaService.alterarStatus(this.atual()!.id, 'CANCELADO');
      this.toast.sucesso('Reserva cancelada.');
      this.modal.fechar();
    });
  }

  fechar() {
    this.modal.fechar();
  }

  private async executar(acao: () => Promise<void>) {
    this.processando.set(true);
    try {
      await acao();
    } catch (e) {
      this.toast.erro(mensagemErro(e));
    } finally {
      this.processando.set(false);
    }
  }
}
