import { Component, OnInit } from '@angular/core';
import { GoodsReceiptService, GoodsReceipt } from '../../services/goods-receipt.service';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-goods-receipt',
  templateUrl: './goods-receipt.component.html',
  styleUrls: ['./goods-receipt.component.css']
})
export class GoodsReceiptComponent implements OnInit {
  goodsReceipts: GoodsReceipt[] = [];           // All goods receipts loaded from API
  filteredGoodsReceipts: GoodsReceipt[] = [];   // Receipt list after filtering
  errorMsg = '';
  isLoading = false;
  filters = {
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  };
  vendorLifnr: string | null = null;

  constructor(
    private goodsReceiptService: GoodsReceiptService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.vendorLifnr = this.authService.getVendorId();
    if (!this.vendorLifnr) {
      this.errorMsg = 'Vendor ID not found. Please log in.';
      return;
    }
    this.fetchGoodsReceipts();
  }

  fetchGoodsReceipts(): void {
    if (!this.vendorLifnr) {
      this.errorMsg = 'Vendor ID not found. Please log in.';
      this.goodsReceipts = [];
      this.filteredGoodsReceipts = [];
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.goodsReceipts = [];
    this.filteredGoodsReceipts = [];

    this.goodsReceiptService.getGoodsReceipts(this.vendorLifnr).subscribe({
      next: (receipts: GoodsReceipt[]) => {
        this.goodsReceipts = receipts || [];
        this.applyFilters();
        this.isLoading = false;
        if (this.goodsReceipts.length === 0) {
          this.errorMsg = 'No Goods Receipts available for this vendor ID.';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.errorMsg = err.error.message;
        } else if (err.status === 0) {
          this.errorMsg = 'Network error: Could not connect to the server. Please check your connection or server status.';
        } else {
          this.errorMsg = `Failed to load goods receipts. Status: ${err.status} - ${err.statusText || 'Unknown Error'}`;
        }
        this.goodsReceipts = [];
        this.filteredGoodsReceipts = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.goodsReceipts];
    const term = this.filters.searchTerm?.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(gr =>
        (gr.documentNo && gr.documentNo.toLowerCase().includes(term)) ||
        (gr.vendorId && gr.vendorId.toLowerCase().includes(term)) ||
        (gr.documentType && gr.documentType.toLowerCase().includes(term)) ||
        (gr.materialNo && gr.materialNo.toLowerCase().includes(term)) ||
        (gr.description && gr.description.toLowerCase().includes(term)) ||
        (gr.purchaseOrderNo && gr.purchaseOrderNo.toLowerCase().includes(term))
      );
    }

    const from = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
    const to   = this.filters.dateTo ? new Date(this.filters.dateTo) : null;
    if (from) {
      filtered = filtered.filter(gr => {
        const postingDate = typeof gr.postingDate === 'string' ? new Date(gr.postingDate) : gr.postingDate;
        return postingDate >= from;
      });
    }
    if (to) {
      filtered = filtered.filter(gr => {
        const postingDate = typeof gr.postingDate === 'string' ? new Date(gr.postingDate) : gr.postingDate;
        return postingDate <= to;
      });
    }

    this.filteredGoodsReceipts = filtered;
  }
}
