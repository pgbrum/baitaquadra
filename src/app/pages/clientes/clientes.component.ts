import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaitaQuadraService } from '../../core/services/baita-quadra.service';
import { Cliente } from '../../core/models/baita-quadra.models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  private service = inject(BaitaQuadraService);
  clientes = signal<Cliente[]>([]);

  async ngOnInit() {
    const data = await this.service.getClientes();
    this.clientes.set(data);
  }
}