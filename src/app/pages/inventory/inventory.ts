import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { InventoryService } from './inventory.service';
import { StockItem } from './stock.model';

@Component({
  selector: 'app-inventory',
  imports: [DecimalPipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  private readonly inventoryApi = inject(InventoryService);

  protected readonly items = signal<StockItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.inventoryApi.getStock().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load inventory.');
        this.loading.set(false);
      },
    });
  }
}
