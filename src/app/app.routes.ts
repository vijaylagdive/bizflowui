import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'purchase/orders',
        title: 'Purchase Orders',
        loadComponent: () =>
          import('./pages/purchase/purchase-orders/purchase-orders').then((m) => m.PurchaseOrders),
      },
      {
        path: 'purchase/orders/:id/edit',
        title: 'Edit Purchase Order',
        loadComponent: () =>
          import('./pages/purchase/create-purchase-order/create-purchase-order').then(
            (m) => m.CreatePurchaseOrder,
          ),
      },
      {
        path: 'purchase/create',
        title: 'Create Purchase Order',
        loadComponent: () =>
          import('./pages/purchase/create-purchase-order/create-purchase-order').then(
            (m) => m.CreatePurchaseOrder,
          ),
      },
      {
        path: 'sales/orders',
        title: 'Sales Orders',
        loadComponent: () =>
          import('./pages/sales/sales-orders/sales-orders').then((m) => m.SalesOrders),
      },
      {
        path: 'sales/orders/:id/edit',
        title: 'Edit Sales Order',
        loadComponent: () =>
          import('./pages/sales/create-sales-order/create-sales-order').then((m) => m.CreateSalesOrder),
      },
      {
        path: 'sales/create',
        title: 'Create Sales Order',
        loadComponent: () =>
          import('./pages/sales/create-sales-order/create-sales-order').then((m) => m.CreateSalesOrder),
      },
      {
        path: 'products',
        title: 'Products',
        loadComponent: () => import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'categories',
        title: 'Categories',
        loadComponent: () => import('./pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'units',
        title: 'Units',
        loadComponent: () => import('./pages/units/units').then((m) => m.Units),
      },
      {
        path: 'vendors',
        title: 'Vendors',
        loadComponent: () => import('./pages/vendors/vendors').then((m) => m.Vendors),
      },
      {
        path: 'customers',
        title: 'Customers',
        loadComponent: () =>
          import('./pages/customers/customers').then((m) => m.Customers),
      },
      {
        path: 'accounts',
        title: 'Accounts',
        loadComponent: () => import('./pages/accounts/accounts').then((m) => m.Accounts),
      },
      {
        path: 'cashbook',
        title: 'Cashbook',
        loadComponent: () => import('./pages/cashbook/cashbook').then((m) => m.Cashbook),
      },
      {
        path: 'inventory',
        title: 'Inventory',
        loadComponent: () => import('./pages/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'ledgers/vendors',
        title: 'Vendor Ledger',
        loadComponent: () =>
          import('./pages/ledgers/vendor-ledger/vendor-ledger').then((m) => m.VendorLedger),
      },
      {
        path: 'ledgers/customers',
        title: 'Customer Ledger',
        loadComponent: () =>
          import('./pages/ledgers/customer-ledger/customer-ledger').then((m) => m.CustomerLedger),
      },
    ],
  },
];
