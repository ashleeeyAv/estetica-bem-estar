import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminEstoque } from './admin-estoque';

describe('AdminEstoque', () => {
  let component: AdminEstoque;
  let fixture: ComponentFixture<AdminEstoque>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEstoque],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEstoque);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
