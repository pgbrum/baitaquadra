import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Avisa as telas que algum dado mudou (nova reserva, cliente editado...) para elas recarregarem
@Injectable({ providedIn: 'root' })
export class SyncService {
  versao = signal(0);

  notificar() {
    this.versao.update(v => v + 1);
  }
}

// Extrai uma mensagem legível dos erros da API (ProblemDetails / ValidationProblemDetails)
export function mensagemErro(e: unknown): string {
  const erro = e as HttpErrorResponse;
  if (erro?.status === 0) return 'Não foi possível conectar ao servidor.';
  const corpo = erro?.error;
  const validacao = corpo?.errors ? Object.values(corpo.errors as Record<string, string[]>).flat()[0] : null;
  return validacao ?? corpo?.title ?? 'Ocorreu um erro inesperado.';
}
