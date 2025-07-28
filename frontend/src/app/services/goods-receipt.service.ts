import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interface for the raw data received directly from your Node.js backend (which comes from SAP)
// These field names MUST EXACTLY match what your Node.js API sends in its JSON response.
export interface SapGoodsReceiptRaw {
  __metadata?: { type: string; uri: string; }; // OData metadata - optional
  Lifnr: string;        // SAP: Vendor ID (e.g., "100000")
  Mblnr: string;        // SAP: Material Document Number (e.g., "5000000000")
  Vgart?: string;       // SAP: Goods Movement Type Text (e.g., "WE") - Used for Description
  Blart?: string;       // SAP: Document Type (e.g., "WE")
  Bldat?: string;       // SAP: Document Date (e.g., "/Date(1748822400000)/")
  Budat: string;        // SAP: Posting Date (e.g., "/Date(1748822400000)/")
  Ebeln?: string;       // SAP: Purchase Order Number (e.g., "4500000000")
  Ebelp?: string;       // SAP: Purchase Order Item Number (e.g., "00010")
  Bwart?: string;       // SAP: Movement Type Code (e.g., "101")
  Meins?: string;       // SAP: Unit of Measure (e.g., "KG")
  Matnr: string;        // SAP: Material Number (e.g., "13")
  // Note: There is NO numerical quantity field (like Menge or Metrz) in your provided raw data.
}

// Interface for the frontend-friendly GoodsReceipt object used in your components
// These are the names you want to display in your table columns.
export interface GoodsReceipt {
  documentNo: string;        // Mapped from Mblnr
  vendorId: string;          // Mapped from Lifnr
  postingDate: Date;         // Mapped from Budat, transformed to Date object
  documentDate: Date | null; // Mapped from Bldat, transformed to Date object
  documentType: string;      // Mapped from Blart
  purchaseOrderNo: string;   // Mapped from Ebeln
  purchaseOrderItem: string; // Mapped from Ebelp
  materialNo: string;        // Mapped from Matnr (renamed for clarity)
  description: string;       // Mapped from Vgart
  movementType: string;      // Mapped from Bwart
  unitOfMeasure: string;     // Mapped from Meins
  // Note: The 'quantity' field is removed as no numerical quantity is provided by the API.
  // If your Node.js API *does* start providing a numerical quantity,
  // you would add 'quantity: number;' back here and map it accordingly.
}

@Injectable({ providedIn: 'root' })
export class GoodsReceiptService {
  private apiUrl = 'http://localhost:5000/api/goods-receipt'; // Verify this matches your Node.js server URL

  constructor(private http: HttpClient) {}

  /**
   * Fetches goods receipts for a specific vendor ID from the Node.js backend.
   * Includes data transformation from raw SAP format to frontend-friendly format.
   *
   * @param lifnr The vendor ID to filter goods receipts.
   * @returns An Observable of GoodsReceipt array.
   */
  getGoodsReceipts(lifnr: string): Observable<GoodsReceipt[]> {
    let params = new HttpParams().set('lifnr', lifnr);
    console.log(`[Angular Service] Making GET request to ${this.apiUrl} with params:`, params.toString());

    return this.http.get<SapGoodsReceiptRaw[]>(this.apiUrl, { params: params }).pipe(
      map(rawReceipts => {
        console.log('[Angular Service] Raw data received from backend:', rawReceipts);

        // Ensure rawReceipts is an array.
        if (!Array.isArray(rawReceipts)) {
          console.error('[Angular Service] Backend response is not an array. Actual:', rawReceipts);
          if (rawReceipts === null || rawReceipts === undefined || Object.keys(rawReceipts).length === 0) {
              console.warn('[Angular Service] Received empty/null/undefined response.');
              return [];
          }
          if (typeof rawReceipts === 'object') {
              rawReceipts = [rawReceipts as SapGoodsReceiptRaw];
          } else {
              return [];
          }
        }

        const transformedReceipts = rawReceipts.map(raw => {
          const parseSapDate = (sapDateString: string | undefined): Date | null => {
            if (!sapDateString) return null;
            const match = sapDateString.match(/\/Date\((\d+)\)\//);
            return match ? new Date(parseInt(match[1], 10)) : null;
          };

          const parsedBudat = parseSapDate(raw.Budat);
          const parsedBldat = parseSapDate(raw.Bldat);

          return {
            documentNo: raw.Mblnr || 'N/A',
            vendorId: raw.Lifnr || 'N/A',
            // Year is derived from posting date, it's not a direct field in raw data,
            // so we don't display it explicitly as a separate column for "all fields as is".
            postingDate: parsedBudat || new Date(),
            documentDate: parsedBldat,
            documentType: raw.Blart || 'N/A',
            purchaseOrderNo: raw.Ebeln || 'N/A',
            purchaseOrderItem: raw.Ebelp || 'N/A',
            materialNo: raw.Matnr || 'N/A', // Using 'materialNo' for clarity
            description: raw.Vgart || 'N/A',
            movementType: raw.Bwart || 'N/A',
            unitOfMeasure: raw.Meins || 'N/A' // Displaying the Unit of Measure
          };
        });
        console.log('[Angular Service] Transformed data for component:', transformedReceipts);
        return transformedReceipts;
      }),
      catchError(error => {
        console.error('[Angular Service] Error during HTTP request or data transformation:', error);
        return throwError(() => error);
      })
    );
  }
}