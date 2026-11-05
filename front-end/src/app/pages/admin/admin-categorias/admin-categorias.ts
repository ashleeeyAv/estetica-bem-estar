import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../../models/categoria';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
  styleUrl: './admin-categorias.css'
})
export class AdminCategorias implements OnInit {
  private service = inject(CategoriaService);

  categorias = signal<Categoria[]>([]);
  resultado = signal<Categoria | null>(null);
  editando = signal<Categoria | null>(null);
  mostrandoForm = signal(false);
  carregando = signal(true);
  msg = signal('');
  erro = signal('');

  nome = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(35)]
  });
  buscaId = new FormControl('');

  exibidas = computed(() => {
    const r = this.resultado();
    return r ? [r] : this.categorias();
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: l => { this.categorias.set(l); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar as categorias.'); this.carregando.set(false); }
    });
  }

  novo() {
    this.msg.set(''); this.erro.set('');
    this.editando.set(null);
    this.nome.reset('');
    this.mostrandoForm.set(true);
  }

  editar(c: Categoria) {
    this.msg.set(''); this.erro.set('');
    this.editando.set(c);
    this.nome.setValue(c.categoria);
    this.mostrandoForm.set(true);
  }

  cancelar() {
    this.mostrandoForm.set(false);
    this.editando.set(null);
  }

  salvar() {
    this.msg.set(''); this.erro.set('');
    const texto = this.nome.value.trim();
    if (this.nome.invalid || !texto) {
      this.nome.markAsTouched();
      this.erro.set('Informe o nome da categoria (até 35 caracteres).');
      return;
    }

    const atual = this.editando();
    const req = atual ? this.service.atualizar(atual.idcategoria, texto) : this.service.criar(texto);
    req.subscribe({
      next: () => {
        this.msg.set(`Categoria ${atual ? 'atualizada' : 'cadastrada'} com sucesso!`);
        this.cancelar();
        this.limparBusca();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  excluir(c: Categoria) {
    this.msg.set(''); this.erro.set('');
    if (!confirm(`Excluir a categoria "${c.categoria}"?`)) return;

    this.service.excluir(c.idcategoria).subscribe({
      next: () => { this.msg.set('Categoria excluída.'); this.limparBusca(); },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  buscarPorId() {
    this.msg.set(''); this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.service.buscarPorId(id).subscribe({
      next: c => this.resultado.set(c),
      error: e => { this.resultado.set(null); this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.'); }
    });
  }

  limparBusca() {
    this.resultado.set(null);
    this.buscaId.setValue('');
    this.carregar();
  }
}