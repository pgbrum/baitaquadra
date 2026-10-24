import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginResponse, Usuario } from '../models/baita-quadra.models';
import { API_URL } from '../api.config';

const CHAVE_SESSAO = 'baitaquadra.sessao';

interface Sessao {
  token: string;
  expiraEm: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private noNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private sessao = signal<Sessao | null>(this.lerSessao());

  usuario = computed(() => this.sessao()?.usuario ?? null);
  autenticado = computed(() => this.sessaoValida(this.sessao()));

  get token(): string | null {
    const s = this.sessao();
    return this.sessaoValida(s) ? s!.token : null;
  }

  // "Lembrar de mim" guarda no localStorage; senão a sessão termina ao fechar o navegador
  async login(email: string, senha: string, lembrar: boolean): Promise<void> {
    const resp = await firstValueFrom(
      this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, senha }, { params: { lembrar } })
    );
    const sessao: Sessao = { token: resp.token, expiraEm: resp.expiraEm, usuario: resp.usuario };
    this.limparArmazenamento();
    if (this.noNavegador) {
      (lembrar ? localStorage : sessionStorage).setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    }
    this.sessao.set(sessao);
  }

  logout() {
    this.limparArmazenamento();
    this.sessao.set(null);
  }

  private sessaoValida(s: Sessao | null): boolean {
    return !!s && new Date(s.expiraEm).getTime() > Date.now();
  }

  private lerSessao(): Sessao | null {
    if (!this.noNavegador) return null;
    try {
      const bruto = localStorage.getItem(CHAVE_SESSAO) ?? sessionStorage.getItem(CHAVE_SESSAO);
      return bruto ? (JSON.parse(bruto) as Sessao) : null;
    } catch {
      return null;
    }
  }

  private limparArmazenamento() {
    if (!this.noNavegador) return;
    try {
      localStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch { /* armazenamento indisponível */ }
  }
}
