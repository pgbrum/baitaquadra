import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Quadra, QuadraInput, StatusQuadra } from '../models/baita-quadra.models';
import { API_URL } from '../api.config';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class QuadraService {
  private http = inject(HttpClient);
  private sync = inject(SyncService);

  private quadrasSubject = new BehaviorSubject<Quadra[]>([]);
  quadras$ = this.quadrasSubject.asObservable();

  async carregarQuadras() {
    try {
      // A API já devolve ordenado por nome
      const data = await firstValueFrom(this.http.get<Quadra[]>(`${API_URL}/quadras`));
      this.quadrasSubject.next(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
      return [];
    }
  }

  async criar(input: QuadraInput) {
    const q = await firstValueFrom(this.http.post<Quadra>(`${API_URL}/quadras`, input));
    this.sync.notificar();
    return q;
  }

  async atualizar(id: string, input: QuadraInput) {
    const q = await firstValueFrom(this.http.put<Quadra>(`${API_URL}/quadras/${id}`, input));
    this.sync.notificar();
    return q;
  }

  async alterarStatus(id: string, status: StatusQuadra) {
    const q = await firstValueFrom(this.http.patch<Quadra>(`${API_URL}/quadras/${id}/status`, { status }));
    this.sync.notificar();
    return q;
  }

  async excluir(id: string) {
    await firstValueFrom(this.http.delete(`${API_URL}/quadras/${id}`));
    this.sync.notificar();
  }
}
