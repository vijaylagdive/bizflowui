import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../categories/category.model';
import { CategoryService } from '../categories/category.service';
import { Product } from './product.model';
import { ProductService } from './product.service';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingCategories = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    productName: ['', Validators.required],
    categoryId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.categoriesApi.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loadingCategories.set(false);
      },
      error: () => {
        this.error.set('Could not load categories.');
        this.loadingCategories.set(false);
      },
    });
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(product: Product): void {
    this.editingId.set(product.productId);
    this.pendingDeleteId.set(null);
    this.form.setValue({
      productName: product.productName,
      categoryId: product.categoryId,
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset();
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(productId: number): void {
    this.pendingDeleteId.set(productId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(product: Product): void {
    this.saving.set(true);
    this.error.set(null);
    this.productsApi.deleteProduct(product.productId).subscribe({
      next: () => {
        if (this.editingId() === product.productId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the product.'));
        this.saving.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const product = {
      productName: value.productName?.trim() ?? '',
      categoryId: Number(value.categoryId),
    };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.productsApi.createProduct(product)
        : this.productsApi.updateProduct(editingId, product);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not add the product.' : 'Could not update the product.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.productsApi.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load products.');
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
