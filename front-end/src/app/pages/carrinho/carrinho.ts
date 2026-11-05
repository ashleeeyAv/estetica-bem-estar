import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarrinhoService } from '../../services/carrinho'; 
import { PessoaService } from '../../services/pessoa.service'; 
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-carrinho',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class Carrinho {
  carrinho = inject(CarrinhoService);
  private pessoaService = inject(PessoaService);
  private pedidoService = inject(PedidoService);

  cliente = this.pessoaService.clienteAtual;
  enviando = signal(false);
  erro = signal('');
  numeroPedido = signal<number | null>(null);

  alterarQtd(id: number, event: Event) {
    const valor = Number((event.target as HTMLInputElement).value);
    this.carrinho.alterarQuantidade(id, valor || 1);
  }

  finalizar() {
    this.erro.set('');
    const cli = this.cliente();
    if (!cli?.idpessoa) {
      this.erro.set('Para finalizar, cadastre-se ou identifique-se em "Meus pedidos".');
      return;
    }
    this.enviando.set(true);
    this.pedidoService.criar(cli.idpessoa, this.carrinho.itens()).subscribe({
      next: p => {
        this.enviando.set(false);
        this.carrinho.limpar();
        this.numeroPedido.set(p.idatendimento);
      },
      error: e => {
        this.enviando.set(false);
        this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.');
      }
    });
  }
}