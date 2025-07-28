// src/app/dashboard/po/po.component.ts
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
  purchaseOrders: any[] = [];

  constructor(
    private poService: PoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getPurchaseOrders();
  }

  getPurchaseOrders(): void {
    this.isLoading = true;
    this.errorMsg = null; // Clear previous error messages
    this.noDataFound = false; // Reset noDataFound flag
    this.purchaseOrders = [];

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
        console.log('POComponent: API Response received:', response);

        if (response?.success && Array.isArray(response.data)) {
          this.purchaseOrders = response.data;

          if (this.purchaseOrders.length === 0) {
            this.noDataFound = true;
            // FIX START: Do NOT set errorMsg here. Only set noDataFound.
            // The message for no data will be handled by the 'noDataFound' *ngIf in HTML.
            // this.errorMsg = response.message || `No purchase orders found for Vendor ID: ${vendorId}.`; // REMOVE THIS LINE
            console.log(`POComponent: No POs found for ${vendorId}.`);
            // FIX END
          } else {
            console.log(`POComponent: Successfully loaded ${this.purchaseOrders.length} POs.`);
          }
        } else {
          // This block runs if 'success' is false or 'data' is not an array (or missing)
          this.errorMsg = response?.message || 'Failed to load purchase orders due to an unexpected response format.';
          console.error('POComponent: Backend reported non-success or invalid data format:', response);
          this.noDataFound = true; // Still no valid data found, but it's an error state.
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMsg = 'Error fetching purchase orders. Please check your network or try again later.';
        console.error('POComponent: HTTP error during PO fetch:', err);
        this.isLoading = false;
        this.purchaseOrders = [];
        this.noDataFound = true; // Indicate no data
      },
      complete: () => {
        console.log('POComponent: Purchase Order data fetching process completed.');
      }
    });
  }

  formatODataDate(odataDate: string | undefined): string {
    if (!odataDate) return '—';
    const match = odataDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
        const timestamp = parseInt(match[1], 10);
        const offset = match[2] ? parseInt(match[2], 10) : 0;
        const date = new Date(timestamp + offset);
        return date.toLocaleDateString();
    }
    return '—';
  }
}