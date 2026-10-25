import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from './category.model';
import { CategoryService } from './category.service';

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesApi = inject(CategoryService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    categoryName: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(category: Category): void {
    this.editingId.set(category.categoryId);
    this.pendingDeleteId.set(null);
    this.form.setValue({ categoryName: category.categoryName });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset();
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(categoryId: number): void {
    this.pendingDeleteId.set(categoryId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(category: Category): void {
    this.saving.set(true);
    this.error.set(null);
    this.categoriesApi.deleteCategory(category.categoryId).subscribe({
      next: () => {
        if (this.editingId() === category.categoryId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the category.'));
        this.saving.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const category = { categoryName: this.form.getRawValue().categoryName.trim() };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.categoriesApi.createCategory(category)
        : this.categoriesApi.updateCategory(editingId, category);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not add the category.' : 'Could not update the category.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoriesApi.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load categories.');
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
