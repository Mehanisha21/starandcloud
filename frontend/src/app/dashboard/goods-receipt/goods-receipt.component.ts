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
  filteredGoodsReceipts: GoodsReceipt[] = [];   // List after filtering & sorting
  errorMsg = '';
  isLoading = false;

  // Filters
  filters = {
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  };

  // Sorting
  sortFields = [
    { label: 'Document No', value: 'documentNo' },
    { label: 'Vendor ID', value: 'vendorId' },
    { label: 'Posting Date', value: 'postingDate' },
    { label: 'Document Date', value: 'documentDate' },
    { label: 'Document Type', value: 'documentType' },
    { label: 'Purchase Order No', value: 'purchaseOrderNo' },
    { label: 'Material No', value: 'materialNo' }
  ];
  selectedSortField: string = 'postingDate'; // default sort
  sortDirection: 'asc' | 'desc' = 'asc';

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
        this.applyFilters(); // filters will also call sorting
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

    // Text search filter
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

    // Date range filter
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

    // Apply sorting after filtering
    this.filteredGoodsReceipts = this.sortData(filtered);
  }

  // ------ Sorting Functions --------

  sortData(data: GoodsReceipt[]): GoodsReceipt[] {
    const field = this.selectedSortField;
    const direction = this.sortDirection;

    return data.sort((a, b) => {
      const valA = (a as any)[field];
      const valB = (b as any)[field];

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? -1 : 1;
      if (valB == null) return direction === 'asc' ? 1 : -1;

      // Handle date fields separately
      if (field.includes('Date')) {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // For non-date fields, string/numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      } else {
        return direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }
    });
  }

  onSortFieldChange(): void {
    this.applyFilters(); // re-apply filters and sort
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // re-apply sorting
  }
}


