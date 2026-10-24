import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, Quadra, TIPOS_RESERVA, TipoReserva } from '../../../core/models/baita-quadra.models';
import { ClienteService } from '../../../core/services/cliente.service';
import { QuadraService } from '../../../core/services/quadra.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { mensagemErro } from '../../../core/services/sync.service';
import { ModalService, ToastService } from '../../services/ui.service';

const pad = (n: number) => String(n).padStart(2, '0');
const hojeIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva-form.component.html'
})
export class ReservaFormComponent implements OnInit {
  @Input() quadraIdInicial?: string;
  @Input() dataInicial?: string;
  @Input() horaInicial?: string;

  private clienteService = inject(ClienteService);
  private quadraService = inject(QuadraService);
  private reservaService = inject(ReservaService);
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  tipos = TIPOS_RESERVA;
  // Horários de 30 em 30 minutos, das 08:00 às 21:30
  horarios = Array.from({ length: 28 }, (_, i) => `${pad(8 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);
  duracoes = [{ v: 1, r: '1h' }, { v: 1.5, r: '1h30' }, { v: 2, r: '2h' }, { v: 3, r: '3h' }, { v: 4, r: '4h' }];

  clientes = signal<Cliente[]>([]);
  quadras = signal<Quadra[]>([]);
  salvando = signal(false);
  erro = signal<string | null>(null);

  tipo = signal<TipoReserva>('LOCAÇÃO');
  quadraId = signal('');
  duracao = signal(1);
  clienteId = '';
  titulo = '';
  descricao = '';
  data = hojeIso();
  hora = '18:00';
  pago = false;

  quadrasDisponiveis = computed(() => this.quadras().filter(q => q.status !== 'Manutenção'));
  valorEstimado = computed(() => (this.quadras().find(q => q.id === this.quadraId())?.valorHora ?? 0) * this.duracao());

  async ngOnInit() {
    this.data = this.dataInicial ?? this.data;
    if (this.horaInicial && this.horarios.includes(this.horaInicial)) this.hora = this.horaInicial;
    const [clientes, quadras] = await Promise.all([this.clienteService.listarTodos(), this.quadraService.carregarQuadras()]);
    this.clientes.set(clientes);
    this.quadras.set(quadras);
    const inicial = this.quadrasDisponiveis().find(q => q.id === this.quadraIdInicial) ?? this.quadrasDisponiveis()[0];
    this.quadraId.set(inicial?.id ?? '');
  }

  async salvar() {
    this.erro.set(null);
    if (!this.quadraId()) return this.erro.set('Selecione uma quadra.');
    if (this.tipo() === 'LOCAÇÃO' && !this.clienteId) return this.erro.set('Selecione o cliente da locação.');
    if (this.tipo() !== 'LOCAÇÃO' && !this.titulo.trim()) return this.erro.set('Informe um título para a aula/torneio.');

    const [h, m] = this.hora.split(':').map(Number);
    const inicio = new Date(`${this.data}T${this.hora}:00`);
    const fim = new Date(inicio.getTime() + this.duracao() * 3_600_000);
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    if (h + m / 60 + this.duracao() > 22) return this.erro.set('A reserva precisa terminar até as 22:00.');

    this.salvando.set(true);
    try {
      await this.reservaService.criar({
        quadraId: this.quadraId(),
        clienteId: this.clienteId || null,
        tipo: this.tipo(),
        titulo: this.tipo() === 'LOCAÇÃO' ? null : this.titulo.trim(),
        descricao: this.descricao.trim() || null,
        inicio: iso(inicio),
        fim: iso(fim),
        pago: this.pago,
      });
      this.toast.sucesso('Reserva criada com sucesso!');
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
