import { Component, OnInit } from '@angular/core';
import { GoodsReceiptService, GoodsReceipt } from '../../services/goods-receipt.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-goods-receipt',
  templateUrl: './goods-receipt.component.html',
  styleUrls: ['./goods-receipt.component.css']
})
export class GoodsReceiptComponent implements OnInit {
  goodsReceipts: GoodsReceipt[] = [];
  errorMsg = '';
  isLoading = false;
  // This vendor ID should be the one your Node.js backend accepts after normalization.
  // Based on tests, '100000' is the working value for the internal check.
  private vendorLifnr: string = '100000';

  constructor(private goodsReceiptService: GoodsReceiptService) {}

  ngOnInit(): void {
    console.log('[Component] ngOnInit called. Initiating goods receipt fetch for lifnr:', this.vendorLifnr);
    this.fetchGoodsReceipts();
  }

  fetchGoodsReceipts(): void {
    this.isLoading = true; // Set loading to true
    this.errorMsg = ''; // Clear previous errors
    this.goodsReceipts = []; // Clear previous data

    this.goodsReceiptService.getGoodsReceipts(this.vendorLifnr).subscribe({
      next: (receipts: GoodsReceipt[]) => {
        console.log('[Component] Data received in component (after service transformation):', receipts);
        this.goodsReceipts = receipts;
        this.isLoading = false; // Loading finished

        if (this.goodsReceipts.length === 0) {
          this.errorMsg = 'No Goods Receipts available for this vendor ID.';
          console.warn('[Component] Goods receipts array is empty after successful fetch.');
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('[Component] Error during goods receipt fetch:', err);
        this.isLoading = false; // Loading finished, even on error

        // Determine user-friendly error message
        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.errorMsg = err.error.message; // Use message from Node.js backend
        } else if (err.status === 0) {
          this.errorMsg = 'Network error: Could not connect to the server. Please check your connection or server status.';
        } else {
          this.errorMsg = `Failed to load goods receipts. Status: ${err.status} - ${err.statusText || 'Unknown Error'}`;
        }
        this.goodsReceipts = []; // Clear data on error
      }
    });
  }
}
