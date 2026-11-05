import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Pessoa } from '../../../models/pessoa';
import { PessoaService } from '../../../services/pessoa.service'; 

@Component({
  selector: 'app-admin-clientes',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-clientes.html',
  styleUrl: './admin-clientes.css'
})
export class AdminClientes implements OnInit {
  private service = inject(PessoaService);

  clientes = signal<Pessoa[]>([]);
  resultado = signal<Pessoa | null>(null);
  expandido = signal<number | null>(null);
  carregando = signal(true);
  erro = signal('');

  buscaId = new FormControl('');

  exibidos = computed(() => {
    const r = this.resultado();
    return r ? [r] : this.clientes();
  });

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: l => { this.clientes.set(l); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar os clientes.'); this.carregando.set(false); }
    });
  }

  alternar(id?: number) {
    if (id == null) return;
    this.expandido.set(this.expandido() === id ? null : id);
  }

  cpf(v: string): string {
    return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  buscarPorId() {
    this.erro.set('');
    const id = Number(this.buscaId.value);
    if (!id) { this.limparBusca(); return; }

    this.service.buscarPorId(id).subscribe({
      next: p => { this.resultado.set(p); this.expandido.set(p.idpessoa ?? null); },
      error: e => { this.resultado.set(null); this.erro.set(e?.message ?? 'Falha de comunicação com o servidor.'); }
    });
  }

  limparBusca() {
    this.resultado.set(null);
    this.buscaId.setValue('');
    this.erro.set('');
  }
}