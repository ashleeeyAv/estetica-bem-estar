import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PessoaService } from '../../services/pessoa.service'; 
import { Pessoa } from '../../models/pessoa';

function cpfValido(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '').replace(/\D/g, '');
  if (!v) return null;
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return { cpf: true };
  const digito = (base: number) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(v[i]) * (base + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(v[9]) && digito(10) === Number(v[10]) ? null : { cpf: true };
}

function dataNaoFutura(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  return new Date(c.value) > new Date() ? { futura: true } : null;
}

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class Cadastro {
  private fb = inject(FormBuilder);
  private pessoaService = inject(PessoaService);

  enviando = signal(false);
  sucesso = signal('');
  erro = signal('');

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: ['', [Validators.required, dataNaoFutura]],
    sexo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
    cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    logradouro: ['', Validators.required],
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    complemento: [''],
    bairro: ['', Validators.required],
    cidade: ['', Validators.required],
    uf: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
  });

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  salvar() {
    this.sucesso.set('');
    this.erro.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Corrija os campos destacados antes de salvar.');
      return;
    }

    const f = this.form.getRawValue();
    const pessoa: Pessoa = {
      nome: f.nome.trim(),
      cpf: f.cpf.replace(/\D/g, ''),
      dataNascimento: f.dataNascimento,
      sexo: f.sexo,
      email: f.email.trim(),
      telefone: f.telefone,
      enderecos: [{
        cep: f.cep,
        logradouro: f.logradouro.trim(),
        numero: f.numero.trim(),
        complemento: f.complemento.trim(),
        bairro: f.bairro.trim(),
        cidade: f.cidade.trim(),
        uf: f.uf.toUpperCase(),
      }],
    };

    this.enviando.set(true);
    this.pessoaService.cadastrar(pessoa).subscribe({
      next: () => {
        this.enviando.set(false);
        this.sucesso.set('Cadastro realizado com sucesso! Agora é só escolher seus itens.');
        this.form.reset();
      },
      error: (e) => {
        this.enviando.set(false);
        this.erro.set(e?.message ?? 'Falha de comunicação com o servidor. Tente novamente.');
      }
    });
  }

  limpar() {
    this.form.reset();
    this.sucesso.set('');
    this.erro.set('');
  }
}