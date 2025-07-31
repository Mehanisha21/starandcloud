import { Component, OnInit } from '@angular/core';
import { FinancialSheetService, Invoice, PaymentAging, Memo } from '../../services/financial-sheet.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';  // Import AuthService

@Component({
  selector: 'app-financial-sheet',
  templateUrl: './financial-sheet.component.html',
  styleUrls: ['./financial-sheet.component.css']
})
export class FinancialSheetComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];

  payments: PaymentAging[] = [];
  filteredPayments: PaymentAging[] = [];

  memos: Memo[] = [];
  filteredMemos: Memo[] = [];

  errorMsg = '';
  activeTab: 'invoices' | 'payments' | 'memos' = 'invoices';

  selectedInvoice: Invoice | null = null;

  // Filters object for reuse across tabs
  filters: {
  dateFrom: string | null,
  dateTo: string | null,
  searchTerm: string
} = {
  dateFrom: null,
  dateTo: null,
  searchTerm: ''
};


  vendorId: string | null = null;

  constructor(
    private financialService: FinancialSheetService,
    private authService: AuthService  // Inject AuthService
  ) {}

  ngOnInit(): void {
    // Get vendorId dynamically from AuthService
    this.vendorId = this.authService.getVendorId();

    if (!this.vendorId) {
      this.errorMsg = 'Vendor ID not found. Please log in.';
      return;
    }

    this.loadAllData();
  }

  loadAllData() {
    if (!this.vendorId) {
      this.errorMsg = 'Vendor ID not found. Please log in.';
      return;
    }

    this.loadInvoices();
    this.loadPaymentsAndAging();
    this.loadCDMemos();
  }

  loadInvoices() {
    if (!this.vendorId) return;
    this.financialService.getInvoicesByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.invoices = data;
        this.applyFilters('invoices');
        this.selectedInvoice = null;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = 'Failed to load invoices: ' + (err.message || err.statusText || JSON.stringify(err.error));
      }
    });
  }

  loadPaymentsAndAging() {
    if (!this.vendorId) return;
    this.financialService.getPaymentsAgingByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.payments = data;
        this.applyFilters('payments');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = 'Failed to load payments and aging: ' + (err.message || err.statusText || JSON.stringify(err.error));
      }
    });
  }

  loadCDMemos() {
    if (!this.vendorId) return;
    this.financialService.getCDMemosByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.memos = data;
        this.applyFilters('memos');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = 'Failed to load credit/debit memos: ' + (err.message || err.statusText || JSON.stringify(err.error));
        this.memos = [];
      }
    });
  }

  /**
   * Applies filters (dateFrom, dateTo, searchTerm) to the selected tab's data.
   * @param tab The active tab to filter ('invoices' | 'payments' | 'memos')
   */
  applyFilters(tab: 'invoices' | 'payments' | 'memos'): void {
  const term = this.filters.searchTerm.trim().toLowerCase();
  const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
  const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

  if (tab === 'invoices') {
    let filtered = [...this.invoices];

    if (term) {
      filtered = filtered.filter(inv =>
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
        (inv.companyCode && inv.companyCode.toLowerCase().includes(term)) ||
        (inv.vendorId && inv.vendorId.toLowerCase().includes(term)) ||
        (inv.currency && inv.currency.toLowerCase().includes(term)) ||
        (inv.documentType && inv.documentType.toLowerCase().includes(term)) ||
        (inv.description && inv.description.toLowerCase().includes(term)) ||
        (inv.materialNumber && inv.materialNumber.toLowerCase().includes(term)) ||
        (inv.poItemNumber && inv.poItemNumber.toLowerCase().includes(term))
      );
    }

    if (fromDate) {
      filtered = filtered.filter(inv => {
        if (!inv.postingDate) return false;
        const postingDate = new Date(inv.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(inv => {
        if (!inv.postingDate) return false;
        const postingDate = new Date(inv.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate <= toDate;
      });
    }

    this.filteredInvoices = filtered;
  } else if (tab === 'payments') {
    let filtered = [...this.payments];

    if (term) {
      filtered = filtered.filter(payment =>
        (payment.documentNumber && payment.documentNumber.toLowerCase().includes(term)) ||
        (payment.vendorId && payment.vendorId.toLowerCase().includes(term)) ||
        (payment.status && payment.status.toLowerCase().includes(term))
      );
    }

    if (fromDate) {
      filtered = filtered.filter(payment => {
        if (!payment.postingDate) return false;
        const postingDate = new Date(payment.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(payment => {
        if (!payment.postingDate) return false;
        const postingDate = new Date(payment.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate <= toDate;
      });
    }

    this.filteredPayments = filtered;
  } else if (tab === 'memos') {
    let filtered = [...this.memos];

    if (term) {
      filtered = filtered.filter(memo =>
        (memo.memoId && memo.memoId.toLowerCase().includes(term)) ||
        (memo.vendorId && memo.vendorId.toLowerCase().includes(term)) ||
        (memo.type && memo.type.toLowerCase().includes(term)) ||
        (memo.description && memo.description.toLowerCase().includes(term))
      );
    }

    if (fromDate) {
      filtered = filtered.filter(memo => {
        if (!memo.postingDate) return false;
        const postingDate = new Date(memo.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(memo => {
        if (!memo.postingDate) return false;
        const postingDate = new Date(memo.postingDate);
        if (isNaN(postingDate.getTime())) return false; // invalid date
        return postingDate <= toDate;
      });
    }


    this.filteredMemos = filtered;
  }
}


  setActiveTab(tab: 'invoices' | 'payments' | 'memos') {
    this.activeTab = tab;
    this.errorMsg = '';

    // Apply filters immediately to show filtered data on tab switch
    this.applyFilters(tab);

    if (tab !== 'invoices') {
      this.selectedInvoice = null;
    }
  }

  selectInvoiceRow(invoice: Invoice): void {
    this.selectedInvoice = (this.selectedInvoice === invoice) ? null : invoice;
    this.errorMsg = '';
  }

  handleExportPdfClick(): void {
    if (this.activeTab !== 'invoices') {
      this.errorMsg = 'Export PDF is only available for Invoice Details. Please switch to that tab.';
      return;
    }

    if (this.selectedInvoice) {
      this.downloadSpecificInvoiceAdobeFormPdf(this.selectedInvoice.vendorId, this.selectedInvoice.invoiceNumber);
    } else {
      alert('Please select an invoice to download its PDF.');
      this.errorMsg = 'Please select an invoice row to download the PDF.';
    }
  }

  private downloadSpecificInvoiceAdobeFormPdf(vendorId: string, invoiceNumber: string): void {
    if (!vendorId || !invoiceNumber) {
      this.errorMsg = 'Internal error: Vendor ID or Invoice Number missing for PDF download.';
      return;
    }

    this.errorMsg = '';

    this.financialService.downloadInvoicePdf(vendorId, invoiceNumber).subscribe({
      next: (responseBlob: Blob) => {
        const url = window.URL.createObjectURL(responseBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_adobe_form_${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.selectedInvoice = null;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = `Failed to download specific invoice PDF: ${err.status} - ${err.message || 'Unknown error'}`;

        // Parse backend error blob if available for better message
        if (err.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              try {
                const errorJson = JSON.parse(reader.result);
                this.errorMsg += ` Details: ${errorJson.message || reader.result}`;
              } catch {
                this.errorMsg += ` Details: ${reader.result}`;
              }
            }
          };
          reader.readAsText(err.error);
        }
      }
    });
  }
}
