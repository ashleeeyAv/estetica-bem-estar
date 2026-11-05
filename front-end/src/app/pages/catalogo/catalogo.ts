import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Item } from '../../models/item';
import { ItemService } from '../../services/item';
import { CarrinhoService } from '../../services/carrinho';
import { ProdutoCard } from '../../components/produto-card/produto-card';

@Component({
  selector: 'app-catalogo',
  imports: [ProdutoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  private itemService = inject(ItemService);
  private carrinho = inject(CarrinhoService);

  itens = signal<Item[]>([]);
  carregando = signal(true);
  erro = signal('');
  aviso = signal('');

  busca = signal('');
  categoria = signal('Todas');
  tipo = signal<'T' | 'P' | 'S'>('T');

  categorias = computed(() => {
    const cats = new Set(
      this.itens().map(i => i.categoria).filter((c): c is string => !!c)
    );
    return ['Todas', ...cats];
  });

  filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.itens().filter(i =>
      i.ativoProdutoServico === 'S' &&
      (this.categoria() === 'Todas' || i.categoria === this.categoria()) &&
      (this.tipo() === 'T' || i.tipoItem === this.tipo()) &&
      (!termo || i.item.toLowerCase().includes(termo))
    );
  });

  ngOnInit() {
    this.itemService.listar().subscribe({
      next: lista => { this.itens.set(lista); this.carregando.set(false); },
      error: () => {
        this.erro.set('Não foi possível carregar o catálogo. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  adicionar(item: Item) {
    this.carrinho.adicionar(item);
    this.aviso.set(`"${item.item}" adicionado ao carrinho!`);
    setTimeout(() => this.aviso.set(''), 2000);
  }

  limparFiltros() {
    this.busca.set('');
    this.categoria.set('Todas');
    this.tipo.set('T');
  }
}