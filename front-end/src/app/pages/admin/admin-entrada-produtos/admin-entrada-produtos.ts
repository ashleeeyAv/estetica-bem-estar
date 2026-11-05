import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Item } from '../../../models/item';
import { EntradaProduto } from '../../../models/entrada-produto';
import { ItemService } from '../../../services/item';
import { EntradaProdutoService } from '../../../services/entrada-produto.service'; 

function dataNaoFutura(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  const hoje = new Date().toLocaleDateString('en-CA'); // yyyy-MM-dd no fuso local
  return c.value > hoje ? { futura: true } : null;
}

@Component({
  selector: 'app-admin-entrada-produtos',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './admin-entrada-produtos.html',
  styleUrl: './admin-entrada-produtos.css'
})
export class AdminEntradaProdutos implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private entradaService = inject(EntradaProdutoService);

  produtos = signal<Item[]>([]);
  entradas = signal<EntradaProduto[]>([]);
  salvando = signal(false);
  msg = signal('');
  erro = signal('');

  hoje = new Date().toLocaleDateString('en-CA');

  form = this.fb.nonNullable.group({
    iditem: [0, [Validators.min(1)]],
    dataEntrada: [this.hoje, [Validators.required, dataNaoFutura]],
    quantidadeEntrada: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    unidade: ['', [Validators.required, Validators.maxLength(10)]],
    valorUnitarioEntrada: [0, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit() {
    this.itemService.listar().subscribe(lista =>
      this.produtos.set(lista.filter(i => i.tipoItem === 'P' && i.ativoProdutoServico === 'S'))
    );
    this.carregarEntradas();

    // ao escolher o produto, sugere a unidade cadastrada
    this.form.controls.iditem.valueChanges.subscribe(id => {
      const p = this.produtos().find(x => x.iditem === id);
      if (p?.unidade) this.form.controls.unidade.setValue(p.unidade);
    });
  }

  carregarEntradas() {
    this.entradaService.listar().subscribe(e => this.entradas.set(e));
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  salvar() {
    this.msg.set(''); this.erro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Corrija os campos destacados antes de registrar.');
      return;
    }

    const f = this.form.getRawValue();
    this.salvando.set(true);
    this.entradaService.criar({
      iditem: f.iditem,
      dataEntrada: f.dataEntrada,
      quantidadeEntrada: f.quantidadeEntrada,
      unidade: f.unidade.trim(),
      valorUnitarioEntrada: f.valorUnitarioEntrada,
    }).subscribe({
      next: e => {
        this.salvando.set(false);
        this.msg.set(`Entrada registrada: ${e.quantidadeEntrada} x ${e.item}. Estoque atualizado.`);
        this.form.reset({ iditem: 0, dataEntrada: this.hoje, quantidadeEntrada: 1, unidade: '', valorUnitarioEntrada: 0 });
        this.carregarEntradas();
      },
      error: e => {
        this.salvando.set(false);
        this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.');
      }
    });
  }
}