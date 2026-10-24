import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quadra, QuadraInput, STATUS_QUADRA } from '../../../core/models/baita-quadra.models';
import { QuadraService } from '../../../core/services/quadra.service';
import { mensagemErro } from '../../../core/services/sync.service';
import { ModalService, ToastService } from '../../services/ui.service';

@Component({
  selector: 'app-quadra-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quadra-form.component.html'
})
export class QuadraFormComponent implements OnInit {
  @Input() quadra?: Quadra;

  private quadraService = inject(QuadraService);
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  statusOpcoes = STATUS_QUADRA;
  pisos = ['Areia Fina', 'Areia Grossa', 'Grama Sintética', 'Saibro', 'Cimento'];
  esportes = ['Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Tênis', 'Futebol Society'];

  form: QuadraInput = {
    nome: '', tipo: 'Areia Fina', esporte: 'Beach Tennis', iluminacao: 'Iluminação LED',
    dimensoes: '16m x 8m', status: 'Disponível', valorHora: 100,
  };

  salvando = signal(false);
  confirmarExclusao = signal(false);
  erro = signal<string | null>(null);

  ngOnInit() {
    if (this.quadra) {
      const { id, ...dados } = this.quadra;
      this.form = { ...this.form, ...dados };
    }
  }

  async salvar() {
    this.erro.set(null);
    if (!this.form.nome.trim()) return this.erro.set('Informe o nome da quadra.');
    this.salvando.set(true);
    const input = { ...this.form, nome: this.form.nome.trim(), valorHora: Number(this.form.valorHora) || 0 };
    try {
      if (this.quadra) {
        await this.quadraService.atualizar(this.quadra.id, input);
        this.toast.sucesso('Quadra atualizada.');
      } else {
        await this.quadraService.criar(input);
        this.toast.sucesso('Quadra cadastrada com sucesso!');
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
      await this.quadraService.excluir(this.quadra!.id);
      this.toast.sucesso('Quadra removida.');
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
