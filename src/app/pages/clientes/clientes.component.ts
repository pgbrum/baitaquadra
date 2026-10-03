import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClienteService } from '../../core/services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  
  // Transforma o BehaviorSubject do serviço num Signal automaticamente
  clientes = toSignal(this.clienteService.clientes$, { initialValue: [] });

  ngOnInit() {
    // Manda o serviço buscar os dados no Supabase. O ecrã atualiza sozinho!
    this.clienteService.carregarClientes();
  }
}