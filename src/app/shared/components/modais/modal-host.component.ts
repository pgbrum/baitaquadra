import { Component, HostListener, inject } from '@angular/core';
import { ModalService } from '../../services/ui.service';
import { ReservaFormComponent } from './reserva-form.component';
import { ReservaDetalheComponent } from './reserva-detalhe.component';
import { ClienteFormComponent } from './cliente-form.component';
import { QuadraFormComponent } from './quadra-form.component';

// Renderiza o modal aberto no ModalService (fica uma única vez no Layout)
@Component({
  selector: 'app-modal-host',
  standalone: true,
  imports: [ReservaFormComponent, ReservaDetalheComponent, ClienteFormComponent, QuadraFormComponent],
  templateUrl: './modal-host.component.html'
})
export class ModalHostComponent {
  modal = inject(ModalService);

  @HostListener('document:keydown.escape')
  fecharComEsc() {
    this.modal.fechar();
  }
}
