// src/app/services/invoice.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Invoice {
  Belnr: string; // Document Number (Invoice No.)
  Bukrs: string; // Company Code
  Gjahr: string; // Fiscal Year (Year)
  Bldat: string; // Document Date (Date)
  Budat: string; // Posting Date
  Lifnr: string; // Vendor Number (Vendor)
  Waers: string; // Currency
  Vgart: string; // Transaction Type
  Blart: string; // Document Type
  Buzei: string; // Item Number
  Ebelp: string; // PO Item Number
  Matnr: string; // Material Number
  Meins: string; // Unit of Measure
  Lbkum: string; // Delivered Quantity (or some other quantity)
  Matbf: string; // Material Group (or similar field)
  Pstyp: string; // Item Category
  Wrbtr: string; // Amount in document currency (Total Value)
  // Add other fields from your SAP response if needed for display
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'http://localhost:5000/api/invoice'; // Base URL for invoice proxy

  constructor(private http: HttpClient) { }

  getInvoicesByVendor(vendorId: string): Observable<Invoice[]> {
    const url = `${this.apiUrl}/${vendorId}`; // e.g., http://localhost:5000/api/invoice/0000100000

    return this.http.get<Invoice[]>(url).pipe(
      map(invoices => invoices.map(invoice => ({
        ...invoice,
        // Format dates from '/Date(timestamp)/' to something usable by Angular's date pipe
        Bldat: invoice.Bldat ? this.formatODataDate(invoice.Bldat) : '',
        Budat: invoice.Budat ? this.formatODataDate(invoice.Budat) : '',
        // Convert Wrbtr to number if it's used as a number in frontend
        Wrbtr: parseFloat(invoice.Wrbtr || '0').toFixed(2) // Format as 2 decimal places
      })))
    );
  }

  private formatODataDate(odataDate: string): string {
    const timestampMatch = odataDate.match(/\d+/);
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[0], 10);
      return new Date(timestamp).toISOString(); // Return ISO string for Angular's date pipe
    }
    return '';
  }
}