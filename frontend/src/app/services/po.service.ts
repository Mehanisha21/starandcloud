import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PurchaseOrder {
  Ebeln: string;
  Lifnr: string;
  Bedat: string;
  Ebelp: string;
  Matnr: string;
  Txz01: string;
  Ktmng: number;
  Meins: string;
  Netpr: number;
  Peinh: number;
  Netwr: number;
  Brtwr: number;
  Waers: string;
  Statu: string;
  Bstyp: string;
  Bsart: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: PurchaseOrder[];
}

@Injectable({ providedIn: 'root' })
export class PoService {
  // FIX: This needs to be just the base API path as defined in server.js
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  getPOByVendor(lifnr: string): Observable<ApiResponse> {
    // FIX: Concatenate the full path including 'purchase-orders'
    // This will form: http://localhost:5000/api/purchase-orders/0000100001
    console.log(`PoService: Making GET request to ${this.apiUrl}/purchase-orders/${lifnr}`); // Added for debugging
    return this.http.get<ApiResponse>(`${this.apiUrl}/purchase-orders/${lifnr}`);
  }
}