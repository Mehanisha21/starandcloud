import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VendorProfile {
  VendorId: string;
  Name1: string;
  Land1: string;
  Ort01: string;
  Pstlz: string;
  Regio: string;
  Stras: string;
  Adrnr: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = 'http://localhost:5000/api/profile';

  constructor(private http: HttpClient) {}

  getVendorProfile(vendorId: string): Observable<{ success: boolean; data: VendorProfile }> {
    return this.http.get<{ success: boolean; data: VendorProfile }>(`${this.apiUrl}/${vendorId}`);
  }
}
