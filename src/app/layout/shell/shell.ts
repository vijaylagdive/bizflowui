import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: string;
  path?: string;
  group?: string;
  children?: NavChild[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);

  protected readonly navOpen = signal(false);
  protected readonly openGroups = signal<Record<string, boolean>>({});
  protected readonly pageTitle = signal('Dashboard');

  protected readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    {
      label: 'Purchase',
      icon: 'purchase',
      group: 'purchase',
      children: [
        { label: 'Purchase Orders', path: '/purchase/orders' },
        { label: 'Create Purchase Order', path: '/purchase/create' },
      ],
    },
    {
      label: 'Sales',
      icon: 'sales',
      group: 'sales',
      children: [
        { label: 'Sales Orders', path: '/sales/orders' },
        { label: 'Create Sales Order', path: '/sales/create' },
      ],
    },
    {
      label: 'Masters',
      icon: 'masters',
      group: 'masters',
      children: [
        { label: 'Products', path: '/products' },
        { label: 'Categories', path: '/categories' },
        { label: 'Units', path: '/units' },
        { label: 'Vendors', path: '/vendors' },
        { label: 'Customers', path: '/customers' },
        { label: 'Accounts', path: '/accounts' },
      ],
    },
    { label: 'Inventory', icon: 'inventory', path: '/inventory' },
    { label: 'Cashbook', icon: 'cashbook', path: '/cashbook' },
    {
      label: 'Ledgers',
      icon: 'ledgers',
      group: 'ledgers',
      children: [
        { label: 'Vendor Ledger', path: '/ledgers/vendors' },
        { label: 'Customer Ledger', path: '/ledgers/customers' },
      ],
    },
  ];

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.syncFromUrl(event.urlAfterRedirects);
        this.navOpen.set(false);
      });
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected toggleGroup(group: string): void {
    this.openGroups.update((groups) => ({
      ...groups,
      [group]: !groups[group],
    }));
  }

  protected isGroupOpen(group: string): boolean {
    return !!this.openGroups()[group];
  }

  protected isGroupActive(item: NavItem): boolean {
    return !!item.children?.some((child) => this.router.url.startsWith(child.path));
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    this.pageTitle.set(this.titleFor(path));
    this.openGroups.update((groups) => ({
      ...groups,
      purchase: groups['purchase'] || path.startsWith('/purchase'),
      sales: groups['sales'] || path.startsWith('/sales'),
      masters:
        groups['masters'] ||
        ['/products', '/categories', '/units', '/vendors', '/customers', '/accounts'].some((item) =>
          path.startsWith(item),
        ),
      ledgers: groups['ledgers'] || path.startsWith('/ledgers'),
    }));
  }

  private titleFor(path: string): string {
    for (const item of this.nav) {
      if (item.path === path) {
        return item.label;
      }
      const child = item.children?.find((entry) => entry.path === path);
      if (child) {
        return child.label;
      }
    }
    if (/^\/sales\/orders\/\d+\/edit$/.test(path)) {
      return 'Edit Sales Order';
    }
    return 'Bizflow';
  }
}
