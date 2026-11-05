import { Injectable, computed, signal } from '@angular/core';
import { CarrinhoItem, Item } from '../models/item';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private _itens = signal<CarrinhoItem[]>([]);

  itens = this._itens.asReadonly();
  total = computed(() =>
    this._itens().reduce((s, i) => s + i.item.preco * i.quantidade, 0));
  quantidadeTotal = computed(() =>
    this._itens().reduce((s, i) => s + i.quantidade, 0));

  adicionar(item: Item) {
    const lista = [...this._itens()];
    const existente = lista.find(i => i.item.iditem === item.iditem);

    if (existente) {
      // serviço não tem estoque: mantém quantidade 1
      if (item.tipoItem === 'S') return;
      // produto: respeita o estoque
      if (item.quantidadeEstoque != null && existente.quantidade >= item.quantidadeEstoque) return;
      existente.quantidade++;
    } else {
      lista.push({ item, quantidade: 1 });
    }
    this._itens.set(lista);
  }

  alterarQuantidade(id: number, qtd: number) {
    this._itens.update(l => l.map(i => {
      if (i.item.iditem !== id) return i;
      const max = i.item.quantidadeEstoque ?? Infinity;
      return { ...i, quantidade: Math.max(1, Math.min(qtd, max)) };
    }));
  }

  remover(id: number) {
    this._itens.update(l => l.filter(i => i.item.iditem !== id));
  }

  limpar() { this._itens.set([]); }
}