import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Funcionario } from '../../../models/funcionario';
import { FuncionarioService } from '../../../services/funcionario.service'; 
import { cpfValido,dataNaoFutura } from '../../../shared/validators/validators'; 

@Component({
  selector: 'app-admin-funcionarios',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-funcionarios.html',
  styleUrl: './admin-funcionarios.css'
})
export class AdminFuncionarios implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(FuncionarioService);

  funcionarios = signal<Funcionario[]>([]);
  resultado = signal<Funcionario | null>(null);
  editando = signal<Funcionario | null>(null);
  mostrandoForm = signal(false);
  carregando = signal(true);
  msg = signal('');
  erro = signal('');

  hoje = new Date().toLocaleDateString('en-CA');
  buscaId = new FormControl('');

  exibidos = computed(() => {
    const r = this.resultado();
    return r ? [r] : this.funcionarios();
  });

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: ['', [Validators.required, dataNaoFutura]],
    sexo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
    cargo: ['', [Validators.required, Validators.maxLength(20)]],
    dataAdmissao: [this.hoje, [Validators.required, dataNaoFutura]],
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: l => { this.funcionarios.set(l); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar os funcionários.'); this.carregando.set(false); }
    });
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  mascaraCpf(v: string): string {
    return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  novo() {
    this.msg.set(''); this.erro.set('');
    this.editando.set(null);
    this.form.reset({ nome: '', cpf: '', dataNascimento: '', sexo: '', email: '', telefone: '', cargo: '', dataAdmissao: this.hoje });
    this.mostrandoForm.set(true);
  }

  editar(f: Funcionario) {
    this.msg.set(''); this.erro.set('');
    this.editando.set(f);
    this.form.reset({
      nome: f.nome, cpf: this.mascaraCpf(f.cpf), dataNascimento: f.dataNascimento, sexo: f.sexo,
      email: f.email, telefone: f.telefone, cargo: f.cargo, dataAdmissao: f.dataAdmissao,
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

    const v = this.form.getRawValue();
    const dados = {
      nome: v.nome.trim(),
      cpf: v.cpf.replace(/\D/g, ''),
      dataNascimento: v.dataNascimento,
      sexo: v.sexo,
      email: v.email.trim(),
      telefone: v.telefone,
      cargo: v.cargo.trim(),
      dataAdmissao: v.dataAdmissao,
    };

    const atual = this.editando();
    const req = atual
      ? this.service.atualizar({ ...atual, ...dados })
      : this.service.criar(dados);

    req.subscribe({
      next: () => {
        this.msg.set(`Funcionário ${atual ? 'atualizado' : 'cadastrado'} com sucesso!`);
        this.cancelar();
        this.limparBusca();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  alternarSituacao(f: Funcionario) {
    this.msg.set(''); this.erro.set('');
    if (f.ativo && !confirm(`Desativar ${f.nome}?`)) return;

    this.service.alterarSituacao(f.idpessoa, !f.ativo).subscribe({
      next: () => {
        this.msg.set(`${f.nome} ${f.ativo ? 'desativado(a)' : 'reativado(a)'}.`);
        this.limparBusca();
      },
      error: e => this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.')
    });
  }

  buscarPorId() {
    this.msg.set(''); this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.service.buscarPorId(id).subscribe({
      next: f => this.resultado.set(f),
      error: e => { this.resultado.set(null); this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.'); }
    });
  }

  limparBusca() {
    this.resultado.set(null);
    this.buscaId.setValue('');
    this.carregar();
  }
}