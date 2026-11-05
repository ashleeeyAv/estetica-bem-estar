import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminItens } from './admin-itens';

describe('AdminItens', () => {
  let component: AdminItens;
  let fixture: ComponentFixture<AdminItens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItens],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminItens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
