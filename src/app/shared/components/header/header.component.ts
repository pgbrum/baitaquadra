import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../services/ui.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private modal = inject(ModalService);
  auth = inject(AuthService);

  novaReserva() {
    this.modal.abrir({ tipo: 'reserva' });
  }
}
