import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Pessoa } from '../models/pessoa';
import { environment } from '../../environments/environment';
import { mapPessoa, onlyDigits } from '../core/api-mappers';

const CHAVE_SESSAO = 'clienteAtual';

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/PessoaEndereco`;

  // A sessão do cliente é local; os dados vêm sempre da API.
  clienteAtual = signal<Pessoa | null>(this.lerSessao());

  private lerSessao(): Pessoa | null {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? 'null');
    } catch {
      return null;
    }
  }

  private definirSessao(p: Pessoa | null) {
    this.clienteAtual.set(p);
    if (p) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(p));
    else localStorage.removeItem(CHAVE_SESSAO);
  }

  cadastrar(p: Pessoa): Observable<Pessoa> {
    return this.http.post<any>(this.base, this.paraDTO(p)).pipe(
      map(mapPessoa),
      tap(novo => this.definirSessao(novo))
    );
  }

  identificar(cpf: string): Observable<Pessoa> {
    const digitos = onlyDigits(cpf);

    return this.http.get<any>(`${this.base}/por-cpf/${digitos}`).pipe(
      map(mapPessoa),
      tap(pessoa => this.definirSessao(pessoa))
    );
  }

  listar(): Observable<Pessoa[]> {
    return this.http.get<any[]>(`${this.base}/clientes`).pipe(
      map(lista => lista.map(mapPessoa))
    );
  }

  buscarPorId(id: number): Observable<Pessoa> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(mapPessoa));
  }

  sair() {
    this.definirSessao(null);
  }

  // Converte o modelo da tela para o PessoaDTO esperado pelo backend.
  private paraDTO(p: Pessoa) {
    return {
      idPessoa: p.idpessoa ?? 0,
      nome: p.nome,
      cpf: Number(onlyDigits(p.cpf)),
      dataNascimento: p.dataNascimento,
      sexo: p.sexo,
      email: p.email,
      telefone: Number(onlyDigits(p.telefone)),
      ativoPessoa: p.ativo === false ? 'N' : 'S',
      enderecos: (p.enderecos ?? []).map(e => ({
        idEndereco: e.idendereco ?? null,
        logradouro: e.logradouro,
        bairro: e.bairro,
        cidade: e.cidade,
        uf: e.uf.toUpperCase(),
        cep: onlyDigits(e.cep),
        numero: e.numero,
        complemento: e.complemento ?? '',
      })),
    };
  }
}
