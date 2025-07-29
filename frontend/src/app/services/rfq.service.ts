import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the expected response structure
export interface RfqResponse {
  success: boolean;
  data: any[]; // You can use Rfq[] if you have an interface for RFQ items
}

@Injectable({
  providedIn: 'root'
})
export class RfqService {
  private apiUrl = 'http://localhost:5000/api/rfq';

  constructor(private http: HttpClient) {}

  /**
   * Fetch RFQs for a given vendor by lifnr (vendor ID)
   * @param lifnr The vendor ID to fetch RFQs for
   */
  getRfqsByVendor(lifnr: string): Observable<RfqResponse> {
    return this.http.get<RfqResponse>(`${this.apiUrl}/${lifnr}`);
  }
}
