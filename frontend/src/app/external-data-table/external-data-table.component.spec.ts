import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalDataTableComponent } from './external-data-table.component';

describe('ExternalDataTableComponent', () => {
  let component: ExternalDataTableComponent;
  let fixture: ComponentFixture<ExternalDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
