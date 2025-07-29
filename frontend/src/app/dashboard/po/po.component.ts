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

  purchaseOrders: any[] = [];        // Full data from API
  filteredPurchaseOrders: any[] = []; // Filtered data displayed in table

  // Filters object holding dateFrom, dateTo, and searchTerm
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

    console.log(`POComponent: Requesting POs for Vendor ID: ${vendorId}`);
    this.poService.getPOByVendor(vendorId).subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.purchaseOrders = response.data;
          this.filteredPurchaseOrders = [...this.purchaseOrders]; // Initially show full list

          if (this.purchaseOrders.length === 0) {
            this.noDataFound = true;
            console.log(`POComponent: No POs found for ${vendorId}.`);
          } else {
            console.log(`POComponent: Successfully loaded ${this.purchaseOrders.length} POs.`);
          }
        } else {
          this.errorMsg = response?.message || 'Failed to load purchase orders due to an unexpected response format.';
          console.error('POComponent: Backend reported non-success or invalid data format:', response);
          this.noDataFound = true;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMsg = 'Error fetching purchase orders. Please check your network or try again later.';
        console.error('POComponent: HTTP error during PO fetch:', err);
        this.isLoading = false;
        this.purchaseOrders = [];
        this.filteredPurchaseOrders = [];
        this.noDataFound = true;
      },
      complete: () => {
        console.log('POComponent: Purchase Order data fetching process completed.');
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

    // Filter by search term (case-insensitive)
    if (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') {
      const term = this.filters.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(po =>
        // Adjust fields to search as needed
        (po.Ebeln && po.Ebeln.toLowerCase().includes(term)) ||  // PO Number
        (po.Lifnr && po.Lifnr.toLowerCase().includes(term)) ||  // Vendor ID
        (po.Bstyp && po.Bstyp.toLowerCase().includes(term))     // Order Type
      );
    }

    // Filter by date range if valid
    const from = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
    const to = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

    if (from) {
      filtered = filtered.filter(po => {
        const date = this.parseODataDate(po.Bedat);
        return date >= from;
      });
    }
    if (to) {
      filtered = filtered.filter(po => {
        const date = this.parseODataDate(po.Bedat);
        return date <= to;
      });
    }

    this.filteredPurchaseOrders = filtered;
    this.noDataFound = filtered.length === 0;
  }

  // Helper function to parse OData date string into Date object
  private parseODataDate(odataDate: string | undefined): Date {
    if (!odataDate) return new Date(0);
    const match = odataDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      const offset = match[2] ? parseInt(match[2], 10) : 0;
      return new Date(timestamp + offset);
    }
    return new Date(0); // fallback date
  }

  formatODataDate(odataDate: string | undefined): string {
    const date = this.parseODataDate(odataDate);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }
}
