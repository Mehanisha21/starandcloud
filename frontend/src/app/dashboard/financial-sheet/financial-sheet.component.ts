// src/app/dashboard/finance-sheet/financial-sheet.component.ts
import { Component, OnInit } from '@angular/core';
import { FinancialSheetService, Invoice, PaymentAging, Memo } from '../../services/financial-sheet.service';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

@Component({
  selector: 'app-financial-sheet',
  templateUrl: './financial-sheet.component.html',
  styleUrls: ['./financial-sheet.component.css']
})
export class FinancialSheetComponent implements OnInit {
  invoices: Invoice[] = [];
  payments: PaymentAging[] = [];
  memos: Memo[] = [];
  errorMsg = '';
  activeTab: 'invoices' | 'payments' | 'memos' = 'invoices';
  vendorId = '0000100000'; // Consistent vendor ID for all calls. Adjust if dynamic.

  selectedInvoice: Invoice | null = null; // New property to hold the currently selected invoice

  constructor(private financialService: FinancialSheetService) {}

  ngOnInit(): void {
    // Load data for all tabs immediately on component initialization
    this.loadInvoices();
    this.loadPaymentsAndAging();
    this.loadCDMemos();
  }

  loadInvoices() {
    this.financialService.getInvoicesByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.invoices = data;
        console.log('Invoice Component: Invoices data received:', this.invoices);
        if (this.invoices.length === 0) {
          console.warn('Invoice Component: No invoice data found for vendor:', this.vendorId);
        }
        this.selectedInvoice = null; // Clear any previous selection when data reloads
      },
      error: (err: HttpErrorResponse) => { // Type 'err'
        this.errorMsg = 'Failed to load invoices: ' + (err.message || err.statusText || JSON.stringify(err.error));
        console.error('Invoice Component: Error loading invoices:', err);
      }
    });
  }

  loadPaymentsAndAging() {
    this.financialService.getPaymentsAgingByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.payments = data;
        console.log('Payment Component: Payments and Aging data received:', this.payments);
        if (this.payments.length === 0) {
            console.warn('Payment Component: No payments/aging data found for vendor:', this.vendorId);
        }
      },
      error: (err: HttpErrorResponse) => { // Type 'err'
        this.errorMsg = 'Failed to load payments and aging: ' + (err.message || err.statusText || JSON.stringify(err.error));
        console.error('Payment Component: Error loading payments and aging:', err);
      }
    });
  }

  loadCDMemos() {
    this.financialService.getCDMemosByVendor(this.vendorId).subscribe({
      next: (data) => {
        this.memos = data;
        console.log('Memo Component: Credit/Debit Memos data received:', this.memos);
        if (this.memos.length === 0) {
            console.warn('Memo Component: No credit/debit memo data found for vendor:', this.vendorId);
        }
      },
      error: (err: HttpErrorResponse) => { // Type 'err'
        this.errorMsg = 'Failed to load credit/debit memos: ' + (err.message || err.statusText || JSON.stringify(err.error));
        console.error('Memo Component: Error loading credit/debit memos:', err);
        this.memos = [];
      }
    });
  }

  setActiveTab(tab: 'invoices' | 'payments' | 'memos') {
    this.activeTab = tab;
    this.errorMsg = ''; // Clear error message when switching tabs
    // If switching away from invoices, deselect any chosen invoice
    if (tab !== 'invoices') {
      this.selectedInvoice = null;
    }
  }

  /**
   * Toggles the selection of an invoice row.
   * If the clicked invoice is already selected, it deselects it. Otherwise, it selects it.
   * @param invoice The Invoice object corresponding to the clicked row.
   */
  selectInvoiceRow(invoice: Invoice): void {
    // If the clicked invoice is already selected, deselect it (set to null).
    // Otherwise, select it.
    this.selectedInvoice = (this.selectedInvoice === invoice) ? null : invoice;
    this.errorMsg = ''; // Clear error message on selection change
    console.log('Selected Invoice:', this.selectedInvoice ? this.selectedInvoice.invoiceNumber : 'None');
  }

  /**
   * Handles the click event for the "Export PDF" button.
   * Based on whether an invoice is selected, it either triggers a download or shows an alert.
   */
  handleExportPdfClick(): void {
    // Only allow PDF export from the Invoice Details tab
    if (this.activeTab !== 'invoices') {
      this.errorMsg = 'Export PDF is only available for Invoice Details. Please switch to the Invoice Details tab to use this feature.';
      console.warn('Attempted PDF export from non-invoice tab.');
      return;
    }

    if (this.selectedInvoice) {
      console.log('Export PDF button clicked for selected invoice:', this.selectedInvoice.invoiceNumber);
      // Call the method to download the specific Adobe Form PDF
      this.downloadSpecificInvoiceAdobeFormPdf(this.selectedInvoice.vendorId, this.selectedInvoice.invoiceNumber);
    } else {
      // If no invoice is selected, show an alert
      alert('Please select a specific invoice row to download its Adobe Form PDF.');
      this.errorMsg = 'Please select an invoice row to download the PDF.';
      console.warn('Export PDF button clicked, but no invoice was selected.');
    }
  }

  /**
   * Initiates the download of a specific invoice's Adobe Form PDF.
   * Calls the financialService to fetch the PDF as a Blob.
   * @param vendorId The vendor ID (LIFNR) of the invoice.
   * @param invoiceNumber The invoice number (BELNR) of the invoice.
   */
  private downloadSpecificInvoiceAdobeFormPdf(vendorId: string, invoiceNumber: string): void {
    if (!vendorId || !invoiceNumber) {
      this.errorMsg = 'Internal error: Vendor ID or Invoice Number missing for PDF download.';
      console.error('downloadSpecificInvoiceAdobeFormPdf: Missing vendorId or invoiceNumber.');
      return;
    }

    this.errorMsg = ''; // Clear any previous error message

    this.financialService.downloadInvoicePdf(vendorId, invoiceNumber).subscribe({
      next: (responseBlob: Blob) => {
        console.log('Specific invoice PDF download successful. Initiating file download.');
        // Create a URL for the blob and trigger a download
        const url = window.URL.createObjectURL(responseBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_adobe_form_${invoiceNumber}.pdf`; // Recommended filename
        document.body.appendChild(a); // Append to body to make it clickable
        a.click(); // Programmatically click the link to trigger download
        window.URL.revokeObjectURL(url); // Clean up the object URL
        a.remove(); // Remove the temporary link element
        this.selectedInvoice = null; // Deselect the invoice after successful download
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = `Failed to download specific invoice PDF: ${err.status} - ${err.message || 'Unknown network error'}`;
        console.error('Error downloading specific invoice PDF:', err);

        // Attempt to read the error response as text if it's a Blob (e.g., from Node.js error response)
        if (err.error instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                console.error('Backend error details (if any):', reader.result);
                // Optionally update errorMsg with backend details if they are readable
                if (typeof reader.result === 'string') {
                    try {
                        const errorJson = JSON.parse(reader.result);
                        this.errorMsg += ` Details: ${errorJson.message || reader.result}`;
                    } catch (e) {
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