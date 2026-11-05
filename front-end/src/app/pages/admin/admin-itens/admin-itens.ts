import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item } from '../../../models/item';
import { Categoria } from '../../../models/categoria';
import { ItemService } from '../../../services/item'; 
import { CategoriaService } from '../../../services/categoria.service'; 

@Component({
  selector: 'app-admin-itens',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './admin-itens.html',
  styleUrl: './admin-itens.css'
})
export class AdminItens implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);

  // 'P' ou 'S', vem da rota (data)
  tipo: 'P' | 'S' = this.route.snapshot.data['tipo'];
  titulo = this.tipo === 'P' ? 'Produtos' : 'Serviços';
  nomeSingular = this.tipo === 'P' ? 'produto' : 'serviço';

  itens = signal<Item[]>([]);
  categorias = signal<Categoria[]>([]);
  carregando = signal(true);
  mostrandoForm = signal(false);
  editando = signal<Item | null>(null);
  resultado = signal<Item | null>(null);
  msg = signal('');
  erro = signal('');

  buscaId = new FormControl('');

  exibidos = computed(() => {
    const r = this.resultado();
    return r ? [r] : this.itens();
  });

  form = this.fb.nonNullable.group({
    item: ['', [Validators.required, Validators.maxLength(40)]],
    idcategoria: [0, [Validators.min(1)]],
    descricaoItem: ['', [Validators.required, Validators.maxLength(200)]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    codigoPreco: [1, [Validators.required, Validators.min(0)]],
    unidade: ['', [Validators.maxLength(10)]],
  });

  ngOnInit() {
    if (this.tipo === 'P') {
      this.form.controls.unidade.addValidators(Validators.required);
    }
    this.categoriaService.listar().subscribe(c => this.categorias.set(c));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.itemService.listar().subscribe({
      next: lista => {
        this.itens.set(lista.filter(i => i.tipoItem === this.tipo));
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a listagem.');
        this.carregando.set(false);
      }
    });
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  novo() {
    this.msg.set(''); this.erro.set('');
    this.editando.set(null);
    this.form.reset({ item: '', idcategoria: 0, descricaoItem: '', preco: 0, codigoPreco: 1, unidade: '' });
    this.mostrandoForm.set(true);
  }

  editar(i: Item) {
    this.msg.set(''); this.erro.set('');
    this.editando.set(i);
    this.form.reset({
      item: i.item,
      idcategoria: i.idcategoria,
      descricaoItem: i.descricaoItem,
      // No formulário, "preço" é o custo do produto (ou o valor do serviço).
      preco: i.tipoItem === 'P' ? (i.precoCusto ?? i.preco) : i.preco,
      codigoPreco: i.codigoPreco ?? 1,
      unidade: i.unidade ?? '',
    });
    this.mostrandoForm.set(true);
  }

  cancelar() {
    this.mostrandoForm.set(false);
    this.editando.set(null);
  }

  salvar() {
    this.msg.set(''); this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Corrija os campos destacados antes de salvar.');
      return;
    }

    const f = this.form.getRawValue();
    const cat = this.categorias().find(c => c.idcategoria === f.idcategoria);
    const dados: Omit<Item, 'iditem'> = {
      item: f.item.trim(),
      descricaoItem: f.descricaoItem.trim(),
      preco: f.preco,
      precoCusto: this.tipo === 'P' ? f.preco : undefined,
      idcategoria: f.idcategoria,
      categoria: cat?.categoria,
      tipoItem: this.tipo,
      ativoProdutoServico: 'S',
      codigoPreco: this.tipo === 'P' ? f.codigoPreco : undefined,
      unidade: this.tipo === 'P' ? f.unidade.trim() : undefined,
    };

    const atual = this.editando();
    const requisicao = atual
      ? this.itemService.atualizar({ ...atual, ...dados, ativoProdutoServico: atual.ativoProdutoServico })
      : this.itemService.criar(dados);

    requisicao.subscribe({
      next: () => {
        this.msg.set(`${this.nomeSingular[0].toUpperCase()}${this.nomeSingular.slice(1)} ${atual ? 'atualizado' : 'cadastrado'} com sucesso!`);
        this.cancelar();
        this.limparBusca();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  alternarSituacao(i: Item) {
    const desativar = i.ativoProdutoServico === 'S';
    if (desativar && !confirm(`Desativar "${i.item}"? Ele deixa de aparecer na loja.`)) return;

    this.itemService.alterarSituacao(i.iditem, !desativar).subscribe({
      next: () => {
        this.msg.set(`"${i.item}" ${desativar ? 'desativado' : 'reativado'}.`);
        this.erro.set('');
        this.limparBusca();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  buscarPorId() {
    this.msg.set(''); this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.itemService.buscarPorId(id).subscribe({
      next: i => {
        if (i.tipoItem !== this.tipo) {
          this.resultado.set(null);
          this.erro.set(`Não existe ${this.nomeSingular} com o ID ${id}.`);
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
    this.carregar();
  }
}