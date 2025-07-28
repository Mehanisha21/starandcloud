// src/app/services/financial-sheet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Ensure HttpHeaders is imported if you'll use it for other methods
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// --- INTERFACES FOR RAW SAP DATA (as received from Node.js) ---
export interface SapInvoiceRaw {
  __metadata?: any;
  Belnr: string; // Document Number (Invoice Number)
  Bukrs: string; // Company Code
  Gjahr: string; // Fiscal Year
  Bldat: string; // Document Date (Billing Date) - SAP Date String, e.g., "/Date(1748924800000)/"
  Budat: string; // Posting Date - SAP Date String, e.g., "/Date(1748924800000)/"
  Lifnr: string; // Vendor ID
  Waers: string; // Currency
  Vgart: string; // Document Type / Description type (e.e.g., 'RD')
  Blart: string; // Document Type (e.g., 'RE')
  Buzei: string; // Line Item Number
  Ebelp: string; // PO Item Number
  Matnr: string; // Material Number
  Meins: string; // Unit of Measure
  Lbkum: string; // Quantity (numerical value as string from SAP)
  Matbf: string; // Material Batch or similar
  Pstyp: string; // Item Category
  Wrbtr: string; // Amount (numerical value as string from SAP)
}

export interface SapPaymentAgingRaw {
  __metadata?: any;
  Bukrs: string; // Company Code
  Lifnr: string; // Vendor ID
  Belnr: string; // Document Number (e.g., Invoice Number for payment)
  Buzei: string; // Line Item Number
  Budat: string; // Posting Date - SAP Date String
  Bldat: string; // Document Date (Billing Date) - SAP Date String
  Waers: string; // Currency
  Blart: string; // Document Type (e.g., 'RE')
  Monat: string; // Month
  Bschl: string; // Posting Key
  Shkzg: string; // Debit/Credit indicator
  Mwskz: string; // Tax Code
  Wrbtr: string; // Amount - numerical value as string from SAP
  Zfbdt: string; // Baseline date for payment
  Zterm: string; // Payment terms
  DueDate: string; // Due Date - SAP Date String (e.g., "/Date(1748924800000)/")
  Aging: string; // Aging value from SAP - likely a string of days (e.g., "0" or "5")
  Status: string; // Payment Status (e.g., "Payment slightly del")
}

export interface SapMemoRaw {
  __metadata?: any;
  Lifnr: string;    // Vendor ID
  Belnr: string;    // Document Number (Memo ID)
  Gjahr: string;    // Fiscal Year
  Buzei: string;    // Line Item Number
  HBlart: string;   // Document Type (e.g., 'WE')
  HBudat: string;   // Posting Date - SAP Date String
  HBldat: string;   // Document Date - SAP Date String
  Dmbtr: string;    // Amount
  HWaers: string;   // Currency
  Menge: string;    // Quantity
  Meins: string;    // Unit of Measure
  Matnr: string;    // Material Number
  Hkont: string;    // G/L Account
  Shkzg: string;    // Debit/Credit Indicator ('H' for Credit, 'S' for Debit)
  Bschl: string;    // Posting Key
  Rebzg: string;    // Reference Key for Invoice
  Zuonr: string;    // Assignment Number
  Usnam: string;    // User Name
  Bukrs: string;    // Company Code
  Tcode: string;    // Transaction Code
}

// --- INTERFACES FOR FRONTEND DISPLAY (transformed data) ---
export interface Invoice {
  invoiceNumber: string;
  companyCode: string;
  fiscalYear: string;
  billingDate: Date | null;
  postingDate: Date | null;
  vendorId: string;
  currency: string;
  documentType: string;
  poItemNumber: string;
  materialNumber: string;
  unitOfMeasure: string;
  quantity: number;
  amount: number;
  description: string;
}

export interface PaymentAging {
  documentNumber: string;
  vendorId: string;
  billingDate: Date | null;
  postingDate: Date | null;
  dueDate: Date | null;
  amount: number;
  currency: string;
  aging: number;
  status: string;
}

export interface Memo {
  memoId: string;
  vendorId: string;
  type: 'Credit' | 'Debit' | 'Unknown';
  amount: number;
  currency: string;
  description: string;
  postingDate: Date | null;
  documentDate: Date | null;
  fiscalYear: string;
  lineNumber: string;
  documentTypeRaw: string;
  quantity: number;
  unitOfMeasure: string;
  materialNumber: string;
  glAccount: string;
  postingKey: string;
  userName: string;
  companyCode: string;
  transactionCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialSheetService {
  private baseUrl = 'http://localhost:5000/api'; // Your Node.js backend URL

  constructor(private http: HttpClient) {}

  public parseSapDate(sapDateString: string | undefined): Date | null {
    if (!sapDateString) {
      return null;
    }
    const match = sapDateString.match(/\/Date\((\d+)(?:[+-]\d{4})?\)\//);
    if (match && match[1]) {
      const timestamp = parseInt(match[1], 10);
      return new Date(timestamp);
    }
    console.warn('FinancialSheetService: Could not parse SAP date string:', sapDateString);
    return null;
  }

  getInvoicesByVendor(lifnr: string): Observable<Invoice[]> {
    return this.http.get<SapInvoiceRaw[]>(`${this.baseUrl}/invoice/${lifnr}`).pipe(
      map(rawInvoices => {
        console.log('Invoice Service: Raw Invoices received:', rawInvoices);
        if (!Array.isArray(rawInvoices)) {
          const data = (rawInvoices as any).d && (rawInvoices as any).d.results ? (rawInvoices as any).d.results : (rawInvoices ? [rawInvoices] : []);
          if (!Array.isArray(data)) {
            console.error('Invoice Service: API response for invoices is not an array (after handling d.results/single object):', rawInvoices);
            return [];
          }
          rawInvoices = data;
        }
        const transformedData = rawInvoices.map(raw => ({
          invoiceNumber: raw.Belnr || 'N/A',
          companyCode: raw.Bukrs || 'N/A',
          fiscalYear: raw.Gjahr || 'N/A',
          billingDate: this.parseSapDate(raw.Bldat),
          postingDate: this.parseSapDate(raw.Budat),
          vendorId: raw.Lifnr || 'N/A',
          currency: raw.Waers || 'N/A',
          documentType: raw.Blart || 'N/A',
          poItemNumber: raw.Ebelp || 'N/A',
          materialNumber: raw.Matnr || 'N/A',
          unitOfMeasure: raw.Meins || 'N/A',
          quantity: parseFloat(raw.Lbkum || '0'),
          amount: parseFloat(raw.Wrbtr || '0'),
          description: raw.Vgart || 'N/A'
        }));
        console.log('Invoice Service: Transformed Invoices:', transformedData);
        return transformedData;
      })
    );
  }

  getPaymentsAgingByVendor(lifnr: string): Observable<PaymentAging[]> {
    return this.http.get<SapPaymentAgingRaw[]>(`${this.baseUrl}/payage/aging/${lifnr}`).pipe(
      map(rawPayments => {
        console.log('Payment Service: Raw Payments received:', rawPayments);
        if (!Array.isArray(rawPayments)) {
          const data = (rawPayments as any).d && (rawPayments as any).d.results ? (rawPayments as any).d.results : (rawPayments ? [rawPayments] : []);
          if (!Array.isArray(data)) {
            console.error('Payment Service: API response for payments is not an array (after handling d.results/single object):', rawPayments);
            return [];
          }
          rawPayments = data;
        }
        const transformedData = rawPayments.map(raw => ({
          documentNumber: raw.Belnr || 'N/A',
          vendorId: raw.Lifnr || 'N/A',
          billingDate: this.parseSapDate(raw.Bldat),
          postingDate: this.parseSapDate(raw.Budat),
          dueDate: this.parseSapDate(raw.DueDate),
          amount: parseFloat(raw.Wrbtr || '0'),
          currency: raw.Waers || 'N/A',
          aging: parseInt(raw.Aging || '0', 10),
          status: raw.Status || 'N/A'
        }));
        console.log('Payment Service: Transformed Payments:', transformedData);
        return transformedData;
      })
    );
  }

  getCDMemosByVendor(lifnr: string): Observable<Memo[]> {
    return this.http.get<SapMemoRaw[]>(`${this.baseUrl}/memo/${lifnr}`).pipe(
      map(rawMemos => {
        console.log('Memo Service: Raw Memos received:', rawMemos);
        if (!Array.isArray(rawMemos)) {
          const data = (rawMemos as any).d && (rawMemos as any).d.results ? (rawMemos as any).d.results : (rawMemos ? [rawMemos] : []);
          if (!Array.isArray(data)) {
            console.error('Memo Service: API response for memos is not an array (after handling d.results/single object):', rawMemos);
            return [];
          }
          rawMemos = data;
        }
        const transformedData = rawMemos.map(raw => {
          let memoType: 'Credit' | 'Debit' | 'Unknown' = 'Unknown';
          if (raw.Shkzg === 'H') {
            memoType = 'Credit';
          } else if (raw.Shkzg === 'S') {
            memoType = 'Debit';
          } else {
            console.warn('Memo Service: Unknown Shkzg value for memo:', raw.Belnr, raw.Shkzg);
          }
          return {
            memoId: raw.Belnr || 'N/A',
            vendorId: raw.Lifnr || 'N/A',
            type: memoType,
            amount: parseFloat(raw.Dmbtr?.replace(/,/g, '') || '0'),
            currency: raw.HWaers || 'N/A',
            description: raw.Tcode || raw.Zuonr || 'N/A',
            postingDate: this.parseSapDate(raw.HBudat),
            documentDate: this.parseSapDate(raw.HBldat),
            fiscalYear: raw.Gjahr || 'N/A',
            lineNumber: raw.Buzei || 'N/A',
            documentTypeRaw: raw.HBlart || 'N/A',
            quantity: parseFloat(raw.Menge || '0'),
            unitOfMeasure: raw.Meins || 'N/A',
            materialNumber: raw.Matnr || 'N/A',
            glAccount: raw.Hkont || 'N/A',
            postingKey: raw.Bschl || 'N/A',
            userName: raw.Usnam || 'N/A',
            companyCode: raw.Bukrs || 'N/A',
            transactionCode: raw.Tcode || 'N/A'
          };
        });
        console.log('Memo Service: Transformed Memos:', transformedData);
        return transformedData;
      })
    );
  }

  /**
   * NEW METHOD: Downloads a specific invoice Adobe Form PDF from the Node.js backend.
   * Node.js URL should be configured to handle GET /api/invoicepdf/:lifnr/:belnr
   * @param lifnr Vendor ID.
   * @param belnr Invoice Number.
   * @returns An Observable of a Blob containing the PDF data.
   */
  downloadInvoicePdf(lifnr: string, belnr: string): Observable<Blob> {
    const url = `${this.baseUrl}/invoicepdf/${lifnr}/${belnr}`; // *** Ensure your Node.js backend has this route ***
    console.log(`FinancialSheetService: Requesting specific invoice PDF from: ${url}`);
    // responseType: 'blob' is crucial for receiving binary data like PDFs
    return this.http.get(url, { responseType: 'blob' });
  }

  // You might have an exportInvoicesToPdf for a "Download All" functionality,
  // but it's not directly used by the current button logic as per your request.
  // Example (if needed for future use, ensure corresponding Node.js endpoint exists):
  // exportInvoicesToPdf(invoices: Invoice[]): Observable<Blob> {
  //   const url = `${this.baseUrl}/export-all-invoices-pdf`; // Example URL
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   console.log(`FinancialSheetService: Requesting export of all invoices to PDF from: ${url}`);
  //   return this.http.post(url, { invoices: invoices }, { headers: headers, responseType: 'blob' });
  // }
}