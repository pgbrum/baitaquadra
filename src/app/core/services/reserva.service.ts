import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Reserva } from '../models/baita-quadra.models';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private supabase: SupabaseClient;
  
  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  reservas$ = this.reservasSubject.asObservable();

  constructor() {
    const supabaseUrl = 'https://ixvhzefbcyaqcfcifsil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmh6ZWZiY3lhcWNmY2lmc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODkzNTEsImV4cCI6MjEwNjQ2NTM1MX0.b9Uef1ZDmevX3LJO77SAergMkcsM9TdWH6kiJvY9z-Q';
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  async carregarProximosJogos() {
    const { data, error } = await this.supabase.from('reservas').select('*');
    if (!error && data) {
      const formatado = data.map((item: any) => ({
        id: item.id,
        status: item.status || 'CONFIRMADO',
        clienteNome: item.clienteNome || item.cliente_nome || 'Cliente',
        clienteIniciais: item.clienteIniciais || item.cliente_iniciais || 'C',
        quadraInfo: item.quadraInfo || item.quadra_info || 'Quadra'
      }));
      this.reservasSubject.next(formatado);
    }
  }
}