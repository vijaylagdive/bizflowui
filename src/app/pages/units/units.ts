import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Unit } from './unit.model';
import { UnitService } from './unit.service';

@Component({
  selector: 'app-units',
  imports: [ReactiveFormsModule],
  templateUrl: './units.html',
  styleUrl: './units.scss',
})
export class Units implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly unitsApi = inject(UnitService);

  protected readonly units = signal<Unit[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    unitName: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadUnits();
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(unit: Unit): void {
    this.editingId.set(unit.unitId);
    this.pendingDeleteId.set(null);
    this.form.setValue({ unitName: unit.unitName });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset();
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(unitId: number): void {
    this.pendingDeleteId.set(unitId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(unit: Unit): void {
    this.saving.set(true);
    this.error.set(null);
    this.unitsApi.deleteUnit(unit.unitId).subscribe({
      next: () => {
        if (this.editingId() === unit.unitId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadUnits();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the unit.'));
        this.saving.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const unit = { unitName: this.form.getRawValue().unitName.trim() };
    const editingId = this.editingId();
    const request = editingId === null ? this.unitsApi.createUnit(unit) : this.unitsApi.updateUnit(editingId, unit);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadUnits();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, editingId === null ? 'Could not add the unit.' : 'Could not update the unit.'));
        this.saving.set(false);
      },
    });
  }

  private loadUnits(): void {
    this.loading.set(true);
    this.unitsApi.getUnits().subscribe({
      next: (units) => {
        this.units.set(units);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load units.');
        this.loading.set(false);
      },
    });
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = error.error.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  }
}
