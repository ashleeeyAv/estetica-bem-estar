import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PessoaService } from '../../services/pessoa.service'; 
import { PedidoService } from '../../services/pedido.service'; 
import { Pedido } from '../../models/pedido';

@Component({
  selector: 'app-meus-pedidos',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.css'
})
export class MeusPedidos implements OnInit {
  private pessoaService = inject(PessoaService);
  private pedidoService = inject(PedidoService);

  cliente = this.pessoaService.clienteAtual;
  cpf = '';
  erro = signal('');
  carregando = signal(false);
  pedidos = signal<Pedido[]>([]);
  aberto = signal<number | null>(null);

  ngOnInit() {
    if (this.cliente()) this.carregar();
  }

  identificar() {
    this.erro.set('');
    if (!this.cpf.trim()) { this.erro.set('Informe seu CPF.'); return; }
    this.pessoaService.identificar(this.cpf).subscribe({
      next: () => this.carregar(),
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  carregar() {
    const id = this.cliente()?.idpessoa;
    if (!id) return;
    this.carregando.set(true);
    this.pedidoService.listarPorPessoa(id).subscribe({
      next: lista => { this.pedidos.set(lista); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar seus pedidos.'); this.carregando.set(false); }
    });
  }

  alternar(id: number) {
    this.aberto.set(this.aberto() === id ? null : id);
  }

  sair() {
    this.pessoaService.sair();
    this.pedidos.set([]);
    this.cpf = '';
  }
}