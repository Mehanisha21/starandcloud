import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// No environment import here as per your request to avoid environment.ts

@Injectable({
  providedIn: 'root' // This registers the service for dependency injection
})
export class VendorService {
  // Hardcode your Node.js API base URL directly here.
  // This is the URL that your Angular app will use to talk to your Node.js backend.
  private apiUrl = 'http://localhost:5000/api'; // Make sure this matches your Node.js server's address and API prefix

  constructor(private http: HttpClient) { }

  /**
   * Fetches specific vendor data from the backend API.
   * This method is called after successful login to retrieve vendor profile details.
   * @param vendorId The ID of the vendor whose data is to be fetched.
   * @returns An Observable of the API response containing vendor data.
   */
  getVendorData(vendorId: string): Observable<any> {
    // This constructs the full URL for your Node.js GET /api/vendor-data/:vendorId endpoint
    return this.http.get<any>(`${this.apiUrl}/vendor-data/${vendorId}`);
  }
}