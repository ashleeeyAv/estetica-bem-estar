import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ItemService } from '../../../services/item'; 
import { PessoaService } from '../../../services/pessoa.service';
import { PedidoService } from '../../../services/pedido.service';

interface Resumo {
  clientes: number;
  produtos: number;
  servicos: number;
  pedidosAbertos: number;
  semEstoque: number;
}

@Component({
  selector: 'app-admin-inicio',
  imports: [RouterLink],
  templateUrl: './admin-inicio.html',
  styleUrl: './admin-inicio.css'
})
export class AdminInicio implements OnInit {
  private itemService = inject(ItemService);
  private pessoaService = inject(PessoaService);
  private pedidoService = inject(PedidoService);

  resumo = signal<Resumo | null>(null);
  erro = signal('');

  ngOnInit() {
    forkJoin({
      itens: this.itemService.listar(),
      pessoas: this.pessoaService.listar(),
      pedidos: this.pedidoService.listar(),
    }).subscribe({
      next: ({ itens, pessoas, pedidos }) => {
        const ativos = itens.filter(i => i.ativoProdutoServico === 'S');
        this.resumo.set({
          clientes: pessoas.length,
          produtos: ativos.filter(i => i.tipoItem === 'P').length,
          servicos: ativos.filter(i => i.tipoItem === 'S').length,
          pedidosAbertos: pedidos.filter(p => p.status === 'Aberto').length,
          semEstoque: ativos.filter(i => i.tipoItem === 'P' && (i.quantidadeEstoque ?? 0) <= 0).length,
        });
      },
      error: () => this.erro.set('Não foi possível carregar o resumo.')
    });
  }
}