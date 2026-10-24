import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Cliente, ClienteInput } from '../models/baita-quadra.models';
import { API_URL } from '../api.config';
import { SyncService } from './sync.service';

export interface FiltroClientes {
  busca?: string;
  nivel?: string;
  ordem?: 'nome' | 'ultimaVisita';
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private sync = inject(SyncService);

  // O BehaviorSubject guarda o estado atual da lista
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  // O Observable expõe os dados para os componentes lerem de forma segura
  clientes$ = this.clientesSubject.asObservable();

  // Método que busca na API e atualiza o BehaviorSubject
  async carregarClientes(filtro: FiltroClientes = {}) {
    const params: Record<string, string> = {};
    if (filtro.busca) params['busca'] = filtro.busca;
    if (filtro.nivel) params['nivel'] = filtro.nivel;
    if (filtro.ordem) params['ordem'] = filtro.ordem;
    try {
      const data = await firstValueFrom(this.http.get<Cliente[]>(`${API_URL}/clientes`, { params }));
      this.clientesSubject.next(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      this.clientesSubject.next([]);
    }
  }

  // Lista completa (sem filtros), usada nos selects de reserva
  listarTodos() {
    return firstValueFrom(this.http.get<Cliente[]>(`${API_URL}/clientes`));
  }

  async criar(input: ClienteInput) {
    const c = await firstValueFrom(this.http.post<Cliente>(`${API_URL}/clientes`, input));
    this.sync.notificar();
    return c;
  }

  async atualizar(id: string, input: ClienteInput) {
    const c = await firstValueFrom(this.http.put<Cliente>(`${API_URL}/clientes/${id}`, input));
    this.sync.notificar();
    return c;
  }

  async excluir(id: string) {
    await firstValueFrom(this.http.delete(`${API_URL}/clientes/${id}`));
    this.sync.notificar();
  }
}
