import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from './account.model';
import { AccountService } from './account.service';

@Component({
  selector: 'app-accounts',
  imports: [ReactiveFormsModule],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class Accounts implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly accountsApi = inject(AccountService);

  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    accountType: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.pendingDeleteId.set(null);
    this.form.reset({ name: '', accountType: '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(account: Account): void {
    this.editingId.set(account.accountId);
    this.pendingDeleteId.set(null);
    this.form.setValue({
      name: account.accountName,
      accountType: account.accountType.toLowerCase(),
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset({ name: '', accountType: '' });
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(accountId: number): void {
    this.pendingDeleteId.set(accountId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(account: Account): void {
    this.saving.set(true);
    this.error.set(null);
    this.accountsApi.deleteAccount(account.accountId).subscribe({
      next: () => {
        if (this.editingId() === account.accountId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadAccounts();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the account.'));
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
    const account = {
      accountName: value.name.trim(),
      accountType: value.accountType,
    };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.accountsApi.createAccount(account)
        : this.accountsApi.updateAccount(editingId, account);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadAccounts();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not create the account.' : 'Could not update the account.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private loadAccounts(): void {
    this.loading.set(true);
    this.accountsApi.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load accounts.');
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
