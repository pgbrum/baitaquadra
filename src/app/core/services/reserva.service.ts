import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Agenda, DashboardResumo, OcupacaoDia, Reserva, ReservaInput, StatusReserva } from '../models/baita-quadra.models';
import { API_URL } from '../api.config';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http = inject(HttpClient);
  private sync = inject(SyncService);

  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  reservas$ = this.reservasSubject.asObservable();

  async carregarProximosJogos() {
    try {
      // A API já devolve clienteNome, clienteIniciais, quadraInfo e status prontos
      const data = await firstValueFrom(this.http.get<Reserva[]>(`${API_URL}/reservas/proximos`));
      this.reservasSubject.next(data);
    } catch (error) {
      console.error('Erro ao buscar próximos jogos:', error);
    }
  }

  obterAgenda(data: string) {
    return firstValueFrom(this.http.get<Agenda>(`${API_URL}/agenda`, { params: { data } }));
  }

  obterResumo() {
    return firstValueFrom(this.http.get<DashboardResumo>(`${API_URL}/dashboard/resumo`));
  }

  obterOcupacao(periodo: 'semana' | 'mes') {
    return firstValueFrom(this.http.get<OcupacaoDia[]>(`${API_URL}/dashboard/ocupacao`, { params: { periodo } }));
  }

  async criar(input: ReservaInput) {
    const r = await firstValueFrom(this.http.post<Reserva>(`${API_URL}/reservas`, input));
    this.sync.notificar();
    return r;
  }

  async alterarStatus(id: string, status: StatusReserva) {
    const r = await firstValueFrom(this.http.patch<Reserva>(`${API_URL}/reservas/${id}/status`, { status }));
    this.sync.notificar();
    return r;
  }

  async marcarPago(reserva: Reserva) {
    const input: ReservaInput = {
      quadraId: reserva.quadraId!, clienteId: reserva.clienteId, tipo: reserva.tipo!, titulo: reserva.titulo,
      descricao: reserva.descricao, inicio: reserva.inicio!, fim: reserva.fim!, valor: reserva.valor, pago: true,
    };
    const r = await firstValueFrom(this.http.put<Reserva>(`${API_URL}/reservas/${reserva.id}`, input));
    this.sync.notificar();
    return r;
  }

  async excluir(id: string) {
    await firstValueFrom(this.http.delete(`${API_URL}/reservas/${id}`));
    this.sync.notificar();
  }
}
