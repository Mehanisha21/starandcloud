import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RfqService {
  private apiUrl = 'http://localhost:5000/api/rfq';

  constructor(private http: HttpClient) {}

  // Fetch RFQs by vendor lifnr (ID)
  getRfqsByVendor(lifnr: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/${lifnr}`);
  }
}
