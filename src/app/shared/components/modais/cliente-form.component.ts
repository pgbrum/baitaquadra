import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, NIVEIS, NivelCliente } from '../../../core/models/baita-quadra.models';
import { ClienteService } from '../../../core/services/cliente.service';
import { mensagemErro } from '../../../core/services/sync.service';
import { ModalService, ToastService } from '../../services/ui.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-form.component.html'
})
export class ClienteFormComponent implements OnInit {
  @Input() cliente?: Cliente;

  private clienteService = inject(ClienteService);
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  niveis = NIVEIS;
  nome = '';
  contato = '';
  nivel: NivelCliente = 'Iniciante';
  saldo = 0;

  salvando = signal(false);
  confirmarExclusao = signal(false);
  erro = signal<string | null>(null);

  ngOnInit() {
    if (this.cliente) {
      ({ nome: this.nome, contato: this.contato, nivel: this.nivel, saldo: this.saldo } = this.cliente);
    }
  }

  // Reescreve o campo direto no DOM: com ngModel, um valor formatado igual ao anterior não atualizaria a tela
  mascararContato(evento: Event) {
    const campo = evento.target as HTMLInputElement;
    this.contato = this.formatarContato(campo.value);
    campo.value = this.contato;
  }

  // Máscara simples de telefone: (51) 99999-9999
  formatarContato(valor: string) {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async salvar() {
    this.erro.set(null);
    if (!this.nome.trim()) return this.erro.set('Informe o nome do cliente.');
    this.salvando.set(true);
    const input = { nome: this.nome.trim(), contato: this.contato.trim(), nivel: this.nivel, saldo: Number(this.saldo) || 0 };
    try {
      if (this.cliente) {
        await this.clienteService.atualizar(this.cliente.id, input);
        this.toast.sucesso('Cliente atualizado.');
      } else {
        await this.clienteService.criar(input);
        this.toast.sucesso('Cliente cadastrado com sucesso!');
      }
      this.modal.fechar();
    } catch (e) {
      this.erro.set(mensagemErro(e));
    } finally {
      this.salvando.set(false);
    }
  }

  async excluir() {
    if (!this.confirmarExclusao()) return this.confirmarExclusao.set(true);
    this.salvando.set(true);
    try {
      await this.clienteService.excluir(this.cliente!.id);
      this.toast.sucesso('Cliente removido.');
      this.modal.fechar();
    } catch (e) {
      this.erro.set(mensagemErro(e));
    } finally {
      this.salvando.set(false);
    }
  }

  fechar() {
    this.modal.fechar();
  }
}
