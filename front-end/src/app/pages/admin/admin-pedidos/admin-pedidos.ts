import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Pedido, StatusPedido, TRANSICOES } from '../../../models/pedido';
import { PedidoService } from '../../../services/pedido.service'; 
import { PessoaService } from '../../../services/pessoa.service'; 

type Filtro = 'Todos' | StatusPedido;

@Component({
  selector: 'app-admin-pedidos',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './admin-pedidos.html',
  styleUrl: './admin-pedidos.css'
})
export class AdminPedidos implements OnInit {
  private pedidoService = inject(PedidoService);
  private pessoaService = inject(PessoaService);

  filtros: Filtro[] = ['Aberto', 'Em processamento', 'Concluído', 'Cancelado', 'Todos'];

  pedidos = signal<Pedido[]>([]);
  nomes = signal<Record<number, string>>({});
  filtro = signal<Filtro>('Aberto');
  resultado = signal<Pedido | null>(null);
  expandido = signal<number | null>(null);
  carregando = signal(true);
  msg = signal('');
  erro = signal('');

  buscaId = new FormControl('');

  exibidos = computed(() => {
    const r = this.resultado();
    if (r) return [r];
    const f = this.filtro();
    return f === 'Todos' ? this.pedidos() : this.pedidos().filter(p => p.status === f);
  });

  contagem = computed(() => {
    const c: Record<string, number> = { Todos: this.pedidos().length };
    for (const p of this.pedidos()) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    forkJoin({
      pedidos: this.pedidoService.listar(),
      pessoas: this.pessoaService.listar(),
    }).subscribe({
      next: ({ pedidos, pessoas }) => {
        const mapa: Record<number, string> = {};
        for (const p of pessoas) if (p.idpessoa) mapa[p.idpessoa] = p.nome;
        this.nomes.set(mapa);
        this.pedidos.set(pedidos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os pedidos.');
        this.carregando.set(false);
      }
    });
  }

  nomeCliente(id: number): string {
    return this.nomes()[id] ?? `Cliente #${id}`;
  }

  proximos(p: Pedido): StatusPedido[] {
    return TRANSICOES[p.status];
  }

  alternar(id: number) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  mudarStatus(p: Pedido, novo: StatusPedido) {
    this.msg.set(''); this.erro.set('');
    if (novo === 'Cancelado' && !confirm(`Cancelar o pedido #${p.idatendimento}?`)) return;

    this.pedidoService.atualizarStatus(p.idatendimento, novo).subscribe({
      next: () => {
        this.msg.set(`Pedido #${p.idatendimento} agora está "${novo}".`);
        this.resultado.set(null);
        this.buscaId.setValue('');
        this.carregar();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  buscarPorId() {
    this.msg.set(''); this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.pedidoService.buscarPorId(id).subscribe({
      next: p => { this.resultado.set(p); this.expandido.set(p.idatendimento); },
      error: e => {
        this.resultado.set(null);
        this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.');
      }
    });
  }

  limparBusca() {
    this.resultado.set(null);
    this.buscaId.setValue('');
    this.erro.set('');
  }
}