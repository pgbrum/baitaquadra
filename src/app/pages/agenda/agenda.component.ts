import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent {
  // Horários de funcionamento da quadra
  horas = ['08:00', '09:00', '10:00', '11:00', '12:00'];
  
  // Cabeçalhos das quadras
  quadras = [
    { nome: 'Quadra 1', tipo: 'AREIA FINA', cor: 'text-primary', bg: 'bg-green-100' },
    { nome: 'Quadra 2', tipo: 'AREIA FINA', cor: 'text-primary', bg: 'bg-green-100' },
    { nome: 'Quadra 3', tipo: 'AREIA GROSSA', cor: 'text-primary', bg: 'bg-green-100' },
    { nome: 'Quadra 4', tipo: 'MANUTENÇÃO', cor: 'text-gray-500', bg: 'bg-gray-200' }
  ];
}