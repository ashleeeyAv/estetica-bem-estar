import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Funcionario } from '../models/funcionario';
import { environment } from '../../environments/environment';
import { mapFuncionario, onlyDigits } from '../core/api-mappers';

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Funcionario`;

  listar(): Observable<Funcionario[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(lista => lista.map(mapFuncionario))
    );
  }

  buscarPorId(id: number): Observable<Funcionario> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(mapFuncionario));
  }

  criar(dados: Omit<Funcionario, 'idpessoa' | 'ativo'>): Observable<Funcionario> {
    const corpo = this.paraDTO({ ...dados, ativo: true });

    return this.http.post<any>(this.base, corpo).pipe(map(mapFuncionario));
  }

  atualizar(f: Funcionario): Observable<Funcionario> {
    return this.http.put<void>(`${this.base}/${f.idpessoa}`, this.paraDTO(f)).pipe(
      map(() => f)
    );
  }

  alterarSituacao(id: number, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/situacao`, { ativo });
  }

  // Converte o modelo da tela para o FuncionarioDTO esperado pelo backend.
  private paraDTO(f: Omit<Funcionario, 'idpessoa'> & { idpessoa?: number }) {
    return {
      idPessoa: f.idpessoa ?? 0,
      nome: f.nome,
      cpf: Number(onlyDigits(f.cpf)),
      dataNascimento: f.dataNascimento,
      sexo: f.sexo,
      email: f.email,
      telefone: Number(onlyDigits(f.telefone)),
      ativoPessoa: f.ativo === false ? 'N' : 'S',
      cargo: f.cargo,
      dataAdmissao: f.dataAdmissao,
      enderecos: (f.enderecos ?? []).map(e => ({
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
