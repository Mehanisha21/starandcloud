// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    vendorId: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api'; // Hardcoded URL

  private vendorIdSubject = new BehaviorSubject<string | null>(this.getVendorIdFromStorage());
  vendorId$ = this.vendorIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(vendorId: string, vendorPassword: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { vendorId, vendorPassword }).pipe(
      tap(res => {
        if (res.success && res.data?.vendorId) {
          this.setVendorId(res.data.vendorId);
        }
      })
    );
  }

  private setVendorId(vendorId: string) {
    this.vendorIdSubject.next(vendorId);
    localStorage.setItem('vendorId', vendorId);
  }
  
  private getVendorIdFromStorage(): string | null {
    return localStorage.getItem('vendorId');
  }

  // This is the method that invoice.component.ts (and other components) should call
  getVendorId(): string | null {
    return this.vendorIdSubject.value;
  }

  logout() {
    this.vendorIdSubject.next(null);
    localStorage.removeItem('vendorId');
  }
}