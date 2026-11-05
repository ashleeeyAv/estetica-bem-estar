import { FormControl } from '@angular/forms';
import { cpfValido, dataNaoFutura } from './validators';

describe('validators', () => {
  it('cpfValido aceita um CPF válido', () => {
    expect(cpfValido(new FormControl('52998224725'))).toBeNull();
  });

  it('cpfValido rejeita um CPF inválido', () => {
    expect(cpfValido(new FormControl('11111111111'))).toEqual({ cpf: true });
  });

  it('dataNaoFutura rejeita uma data futura', () => {
    const amanha = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA');
    expect(dataNaoFutura(new FormControl(amanha))).toEqual({ futura: true });
  });

  it('dataNaoFutura aceita a data de hoje', () => {
    const hoje = new Date().toLocaleDateString('en-CA');
    expect(dataNaoFutura(new FormControl(hoje))).toBeNull();
  });
});
