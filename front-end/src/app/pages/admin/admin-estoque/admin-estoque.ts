import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Item } from '../../../models/item'; 
import { ItemService } from '../../../services/item'; 

@Component({
  selector: 'app-admin-estoque',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './admin-estoque.html',
  styleUrl: './admin-estoque.css'
})
export class AdminEstoque implements OnInit {
  private itemService = inject(ItemService);

  itens = signal<Item[]>([]);
  resultado = signal<Item | null>(null);
  carregando = signal(true);
  erro = signal('');

  buscaId = new FormControl('');

  exibidos = computed(() => {
    const r = this.resultado();
    return r ? [r] : this.itens();
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    this.itemService.listar().subscribe({
      next: lista => {
        this.itens.set(lista.filter(i => i.tipoItem === 'P'));
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o estoque.');
        this.carregando.set(false);
      }
    });
  }

  buscarPorId() {
    this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.itemService.buscarPorId(id).subscribe({
      next: i => {
        if (i.tipoItem !== 'P') {
          this.resultado.set(null);
          this.erro.set(`O item ${id} é um serviço e não possui estoque.`);
        } else {
          this.resultado.set(i);
        }
      },
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
    this.carregar();
  }

  nivel(i: Item): 'zerado' | 'baixo' | 'ok' {
    const q = i.quantidadeEstoque ?? 0;
    return q <= 0 ? 'zerado' : q <= 5 ? 'baixo' : 'ok';
  }
}