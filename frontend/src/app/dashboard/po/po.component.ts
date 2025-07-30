import { Component, OnInit } from '@angular/core';
import { PoService } from '../../services/po.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-po',
  templateUrl: './po.component.html',
  styleUrls: ['./po.component.css']
})
export class POComponent implements OnInit {

  isLoading: boolean = false;
  errorMsg: string | null = null;
  noDataFound: boolean = false;

  purchaseOrders: any[] = [];         // Full data from API
  filteredPurchaseOrders: any[] = []; // Filtered data displayed

  filters = {
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  };

  constructor(
    private poService: PoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getPurchaseOrders();
  }

  getPurchaseOrders(): void {
    this.isLoading = true;
    this.errorMsg = null;
    this.noDataFound = false;
    this.purchaseOrders = [];
    this.filteredPurchaseOrders = [];

    const vendorId = this.authService.getVendorId();

    if (!vendorId) {
      this.isLoading = false;
      this.errorMsg = 'Vendor ID not found. Please log in to view purchase orders.';
      this.noDataFound = true;
      console.warn('POComponent: No vendor ID found in AuthService.');
      return;
    }

    this.poService.getPOByVendor(vendorId).subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.purchaseOrders = response.data;
          this.applyFilters();
          if (this.purchaseOrders.length === 0) {
            this.noDataFound = true;
          }
        } else {
          this.errorMsg = response?.message || 'Failed to load purchase orders due to an unexpected response format.';
          this.noDataFound = true;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMsg = 'Error fetching purchase orders. Please check your network or try again later.';
        this.isLoading = false;
        this.purchaseOrders = [];
        this.filteredPurchaseOrders = [];
        this.noDataFound = true;
      }
    });
  }

  applyFilters(): void {
    if (!this.purchaseOrders || this.purchaseOrders.length === 0) {
      this.filteredPurchaseOrders = [];
      this.noDataFound = true;
      return;
    }

    let filtered = [...this.purchaseOrders];
    const term = this.filters.searchTerm?.trim().toLowerCase();

    if (term) {
      filtered = filtered.filter(po =>
        (po.Ebeln && po.Ebeln.toLowerCase().includes(term)) ||
        (po.Lifnr && po.Lifnr.toLowerCase().includes(term)) ||
        (po.Bstyp && po.Bstyp.toLowerCase().includes(term))
      );
    }

    // Parse dateFrom and dateTo inputs
    const from = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
    const to = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

    // Normalize start/end of day
    if (from) {
      from.setHours(0, 0, 0, 0);
    }
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    if (from) {
      filtered = filtered.filter(po => {
        // Parse Bedat properly, you can keep your parse function or simplify if Bedat is ISO string
        // Here assuming Bedat is ISO string or parseable as Date
        const poDate = this.parseODataDate(po.Bedat);
        return poDate >= from;
      });
    }
    if (to) {
      filtered = filtered.filter(po => {
        const poDate = this.parseODataDate(po.Bedat);
        return poDate <= to;
      });
    }

    this.filteredPurchaseOrders = filtered;
    this.noDataFound = filtered.length === 0;
  }

  private parseODataDate(odataDate: string | undefined): Date {
    if (!odataDate) return new Date(0);
    const match = odataDate.match(/\/Date\((\d+)([+-]\d{4})?\)\//);

    if (match) {
      const timestamp = parseInt(match[1], 10);
      if (match[2]) {
        const sign = match[2].startsWith('-') ? -1 : 1;
        const hours = parseInt(match[2].substr(1, 2), 10);
        const minutes = parseInt(match[2].substr(3, 2), 10);
        const offsetMillis = sign * ((hours * 60 + minutes) * 60000);
        return new Date(timestamp + offsetMillis);
      }
      return new Date(timestamp);
    }

    // fallback: try parse as ISO date string
    const parsed = new Date(odataDate);
    if (!isNaN(parsed.getTime())) return parsed;

    return new Date(0);
  }

  formatODataDate(odataDate: string | undefined): string {
    const date = this.parseODataDate(odataDate);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }
}
