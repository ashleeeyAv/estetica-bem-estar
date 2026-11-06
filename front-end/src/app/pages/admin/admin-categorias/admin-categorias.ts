import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
  private fb = inject(FormBuilder);

  categorias = signal<Categoria[]>([]);
  resultado = signal<Categoria | null>(null);
  editando = signal<Categoria | null>(null);
  mostrandoForm = signal(false);
  carregando = signal(true);
  msg = signal('');
  erro = signal('');

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(35)]]
  });
  buscaId = new FormControl('');

  get nome() { return this.form.controls.nome; }

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
    this.form.reset({ nome: '' });
    this.mostrandoForm.set(true);
  }

  editar(c: Categoria) {
    this.msg.set(''); this.erro.set('');
    this.editando.set(c);
    this.form.controls.nome.setValue(c.categoria);
    this.mostrandoForm.set(true);
  }

  cancelar() {
    this.mostrandoForm.set(false);
    this.editando.set(null);
  }

  salvar() {
    this.msg.set(''); this.erro.set('');
    const control = this.form.controls.nome;
    const texto = (control.value ?? '').trim();
    if (control.invalid || !texto) {
      control.markAsTouched();
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