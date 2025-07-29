import { Component, OnInit } from '@angular/core';
import { RfqService } from '../../services/rfq.service'; // Adjust path as needed
import { AuthService } from '../../services/auth.service'; // Adjust path as needed

// Define the RFQ interface based on your API response fields
export interface Rfq {
  Lifnr: string;    // Vendor ID (RFQ No)
  Ebelp: string;    // Line Item
  Matnr: string;    // Material Number
  Txz01: string;    // Description
  Ktmng: string;    // Quantity
  Meins: string;    // Unit of Measure
  Netpr: string;    // Net Price per unit
  Waers: string;    // Currency
  Brtwr: string;    // Gross Amount
  Bedat: string;    // Document Date (SAP format)
  [key: string]: any; // allow other properties as well
}

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.css']
})
export class RFQComponent implements OnInit {
  rfqs: Rfq[] = [];
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
      return;
    }

    this.fetchRfqs(vendorId);
  }

  fetchRfqs(vendorId: string) {
    this.isLoading = true;
    this.errorMsg = null;

    this.rfqService.getRfqsByVendor(vendorId).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          // Convert SAP date format for each RFQ record
          this.rfqs = response.data.map(rfq => ({
            ...rfq,
            Bedat: this.convertSapDate(rfq.Bedat)
          }));
          this.noDataFound = false;
        } else {
          this.rfqs = [];
          this.noDataFound = true;
        }
      },
      error: (err) => {
        this.errorMsg = 'Failed to load RFQ data.';
        this.rfqs = [];
        this.noDataFound = false;
        console.error('RFQ fetch error:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Convert SAP OData date string "/Date(1234567890000)/" to 'YYYY-MM-DD' format
   */
  convertSapDate(sapDate: string): string {
    if (!sapDate) return '';
    const matches = sapDate.match(/\/Date\((\d+)\)\//);
    if (matches && matches[1]) {
      const dt = new Date(Number(matches[1]));
      return dt.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    return sapDate;
  }

}
