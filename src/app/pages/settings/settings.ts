import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  protected readonly items = [
    { label: 'Products', path: '/products', detail: 'Products and their categories' },
    { label: 'Categories', path: '/categories', detail: 'Product categories' },
    { label: 'Units', path: '/units', detail: 'Units used on orders' },
    { label: 'Vendors', path: '/vendors', detail: 'Suppliers and balances' },
    { label: 'Customers', path: '/customers', detail: 'Customers and balances' },
    { label: 'Accounts', path: '/accounts', detail: 'Cash and bank accounts' },
  ];
}
