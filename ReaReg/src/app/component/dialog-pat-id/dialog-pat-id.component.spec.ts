import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPatIdComponent } from './dialog-pat-id.component.ts';

describe('DialogProtocolIdComponent', () => {
  let component: DialogPatIdComponent;
  let fixture: ComponentFixture<DialogPatIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogPatIdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPatIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
