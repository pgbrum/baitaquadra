import { Injectable } from '@angular/core';
import { Cliente, Quadra, Reserva } from '../models/baita-quadra.models';

@Injectable({
  providedIn: 'root'
})
export class BaitaQuadraService {
  async getClientes(): Promise<Cliente[]> {
    return [
      { id: '1', nome: 'Lucas Silva', iniciais: 'L', membroDesde: 'Mar 2023', contato: '(51) 99876-5432', nivel: 'Intermédio', ultimaVisita: 'Hoje, 19:00', saldo: 150.00 },
      { id: '2', nome: 'Mariana Costa', iniciais: 'M', membroDesde: 'Jun 2023', contato: '(51) 98765-4321', nivel: 'Iniciante', ultimaVisita: 'Ontem, 18:30', saldo: 0.00 },
      { id: '3', nome: 'Pedro Santos', iniciais: 'P', membroDesde: 'Jan 2022', contato: '(11) 97654-3210', nivel: 'Avançado', ultimaVisita: '12 Out, 20:00', saldo: -45.00 }
    ];
  }
}