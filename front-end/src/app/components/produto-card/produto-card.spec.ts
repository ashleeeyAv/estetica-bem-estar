import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProdutoCard } from './produto-card';

describe('ProdutoCard', () => {
  let component: ProdutoCard;
  let fixture: ComponentFixture<ProdutoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProdutoCard]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProdutoCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', {
      iditem: 1,
      item: 'Produto de teste',
      descricaoItem: 'Descrição',
      preco: 10,
      tipoItem: 'P',
      ativoProdutoServico: 'S',
      idcategoria: 1,
      quantidadeEstoque: 5,
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
