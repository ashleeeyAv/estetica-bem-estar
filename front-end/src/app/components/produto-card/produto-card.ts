import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Item } from '../../models/item';

@Component({
  selector: 'app-produto-card',
  imports: [CurrencyPipe],
  templateUrl: './produto-card.html',
  styleUrl: './produto-card.css'
})
export class ProdutoCard {
  item = input.required<Item>();
  adicionar = output<Item>();

  get esgotado(): boolean {
    return this.item().tipoItem === 'P' && (this.item().quantidadeEstoque ?? 0) <= 0;
  }
}