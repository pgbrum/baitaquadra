import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Cliente } from '../models/baita-quadra.models';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private supabase: SupabaseClient;
  
  // O BehaviorSubject guarda o estado atual da lista
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  // O Observable expõe os dados para os componentes lerem de forma segura
  clientes$ = this.clientesSubject.asObservable();

  constructor() {
    const supabaseUrl = 'https://ixvhzefbcyaqcfcifsil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmh6ZWZiY3lhcWNmY2lmc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODkzNTEsImV4cCI6MjEwNjQ2NTM1MX0.b9Uef1ZDmevX3LJO77SAergMkcsM9TdWH6kiJvY9z-Q';
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  // Método que busca no Supabase e atualiza o BehaviorSubject
  async carregarClientes() {
    const { data, error } = await this.supabase.from('clientes').select('*');
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      this.clientesSubject.next([]);
    } else {
      this.clientesSubject.next(data as Cliente[]);
    }
  }
}