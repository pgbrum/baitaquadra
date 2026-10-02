import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Cliente, Quadra, Reserva } from '../models/baita-quadra.models';

@Injectable({
  providedIn: 'root'
})
export class BaitaQuadraService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://ixvhzefbcyaqcfcifsil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmh6ZWZiY3lhcWNmY2lmc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODkzNTEsImV4cCI6MjEwNjQ2NTM1MX0.b9Uef1ZDmevX3LJO77SAergMkcsM9TdWH6kiJvY9z-Q';
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  // Busca os clientes reais na tabela 'clientes'
  async getClientes(): Promise<Cliente[]> {
    const { data, error } = await this.supabase.from('clientes').select('*');
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
    return data as Cliente[];
  }

  // Busca as quadras reais na tabela 'quadras'
  async getQuadras(): Promise<Quadra[]> {
    const { data, error } = await this.supabase.from('quadras').select('*').order('nome');
    if (error) {
      console.error('Erro ao buscar quadras:', error);
      return [];
    }
    return data as Quadra[];
  }

  // Busca os jogos reais na tabela 'reservas'
  async getProximosJogos(): Promise<Reserva[]> {
    try {
      const { data, error } = await this.supabase.from('reservas').select('*');
      if (error) {
        console.error('Erro ao buscar reservas do Supabase:', error.message);
        return [];
      }

      // Mapeia para evitar erros caso as colunas tenham nomes diferentes
      return (data || []).map((item: any) => ({
        id: item.id,
        status: item.status || 'CONFIRMADO',
        clienteNome: item.clienteNome || item.cliente_nome || item.nome_cliente || 'Cliente',
        clienteIniciais: item.clienteIniciais || item.cliente_iniciais || 'C',
        quadraInfo: item.quadraInfo || item.quadra_info || item.info_quadra || 'Quadra'
      }));
    } catch (err) {
      console.error('Exceção ao buscar reservas:', err);
      return [];
    }
  }
}