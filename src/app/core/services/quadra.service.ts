import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Quadra } from '../models/baita-quadra.models';

@Injectable({ providedIn: 'root' })
export class QuadraService {
  private supabase: SupabaseClient;
  
  private quadrasSubject = new BehaviorSubject<Quadra[]>([]);
  quadras$ = this.quadrasSubject.asObservable();

  constructor() {
    const supabaseUrl = 'https://ixvhzefbcyaqcfcifsil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmh6ZWZiY3lhcWNmY2lmc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODkzNTEsImV4cCI6MjEwNjQ2NTM1MX0.b9Uef1ZDmevX3LJO77SAergMkcsM9TdWH6kiJvY9z-Q';
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  async carregarQuadras() {
    const { data, error } = await this.supabase.from('quadras').select('*').order('nome');
    if (!error) {
      this.quadrasSubject.next(data as Quadra[]);
    }
  }
}