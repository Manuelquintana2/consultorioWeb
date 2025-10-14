import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacientesPdfComponent } from './pacientes-pdf.component';

describe('PacientesPdfComponent', () => {
  let component: PacientesPdfComponent;
  let fixture: ComponentFixture<PacientesPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesPdfComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacientesPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
