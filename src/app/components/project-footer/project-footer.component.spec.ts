import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectFooterComponent } from './project-footer.component';

describe('ProjectFooterComponent', () => {
  let component: ProjectFooterComponent;
  let fixture: ComponentFixture<ProjectFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProjectFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
