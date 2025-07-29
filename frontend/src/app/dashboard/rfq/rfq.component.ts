import { Component, OnInit } from '@angular/core';
import { RfqService } from '../../services/rfq.service';    // Adjust import path if needed
import { AuthService } from '../../services/auth.service';  // Adjust import path if needed

export interface Rfq {
  Lifnr: string;
  Ebelp: string;
  Matnr: string;
  Txz01: string;
  Ktmng: number;
  Meins: string;
  Netpr: number;
  Waers: string;
  Brtwr: number;
  Bedat: string;
  [key: string]: any;
}

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.css']
})
export class RFQComponent implements OnInit {
  rfqs: Rfq[] = [];
  filteredRfqs: Rfq[] = [];

  filters = {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
  };

  isLoading = false;
  errorMsg: string | null = null;
  noDataFound = false;

  constructor(
    private rfqService: RfqService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      this.errorMsg = 'No logged-in vendor found.';
      this.noDataFound = true;
      return;
    }
    this.fetchRfqs(vendorId);
  }

  fetchRfqs(vendorId: string) {
    this.isLoading = true;
    this.errorMsg = null;
    this.noDataFound = false;

    this.rfqService.getRfqsByVendor(vendorId).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          this.rfqs = response.data.map(rfq => ({
            ...rfq,
            Bedat: this.convertSapDate(rfq.Bedat),
            Ktmng: Number(rfq.Ktmng),
            Netpr: Number(rfq.Netpr),
            Brtwr: Number(rfq.Brtwr)
          }));

          this.applyFilters();
          this.noDataFound = false;
        } else {
          this.rfqs = [];
          this.filteredRfqs = [];
          this.noDataFound = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load RFQ data.';
        this.isLoading = false;
        this.rfqs = [];
        this.filteredRfqs = [];
        this.noDataFound = false;
        console.error('RFQ fetch error:', err);
      }
    });
  }

  convertSapDate(sapDate: string): string {
    if (!sapDate) return '';
    const matches = sapDate.match(/\/Date\((\d+)\)\//);
    if (matches && matches[1]) {
      const dt = new Date(Number(matches[1]));
      return dt.toISOString().split('T')[0];
    }
    return sapDate;
  }

  applyFilters() {
    let filtered = [...this.rfqs];

    const term = this.filters.searchTerm.trim().toLowerCase();
    const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
    const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

    // Global text search filter
    if (term) {
      filtered = filtered.filter(rfq =>
        Object.values(rfq).some(val =>
          val != null && val.toString().toLowerCase().includes(term)
        )
      );
    }

    // Date range filter on document date
    if (fromDate || toDate) {
      filtered = filtered.filter(rfq => {
        if (!rfq.Bedat) return false;
        const docDate = new Date(rfq.Bedat);
        if (fromDate && docDate < fromDate) return false;
        if (toDate && docDate > toDate) return false;
        return true;
      });
    }

    this.filteredRfqs = filtered;
    this.noDataFound = this.filteredRfqs.length === 0;
  }
}
