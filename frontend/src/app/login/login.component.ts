import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { VendorService } from '../services/vendor.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  apiError: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private vendorService: VendorService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      vendorId: ['', [Validators.required]],
      vendorPassword: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.apiError = null;
      this.loading = true;

      const vendorId = this.loginForm.value.vendorId;
      const vendorPassword = this.loginForm.value.vendorPassword;

      this.authService.login(vendorId, vendorPassword).subscribe({
        next: (response: any) => {
          this.loading = false;

          if (response.success) {
            console.log('Login successful:', response.message);

            // We no longer need loggedInVendorId from response.data directly for routing
            // as profile.component.ts will get it from AuthService.getVendorId()

            // --- Step 2: Immediately fetch vendor data using the VendorService ---
            // This call is still important to populate data in the profile service or cache,
            // even if the routing doesn't directly depend on its success for navigation.
            this.vendorService.getVendorData(vendorId).subscribe({ // Use vendorId from form
              next: (vendorDataResponse: any) => {
                console.log('Vendor data fetched successfully:', vendorDataResponse);
                // FIX: Navigate to the correct dashboard profile route
                this.router.navigate(['/dashboard/profile']); // <-- CHANGED THIS LINE
              },
              error: (error: HttpErrorResponse) => {
                this.loading = false;
                console.error('Error fetching vendor data after login:', error);
                this.apiError = 'Login successful, but failed to load vendor data. Please try again later.';
                // FIX: Still navigate to dashboard/profile even on error to show the page
                this.router.navigate(['/dashboard/profile']); // <-- CHANGED THIS LINE
              }
            });

          } else {
            this.apiError = response.message || 'Login failed. Please check your credentials.';
            console.error('Login failed (API response):', response.message);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          console.error('API Error during login:', error);

          if (error.status === 401) {
            this.apiError = (error.error as any)?.message || 'Invalid username or password.';
          } else {
            this.apiError = 'An unexpected error occurred during login. Please try again later.';
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
      this.apiError = 'Please fill in all required fields.';
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  get vendorId() {
    return this.loginForm.get('vendorId');
  }

  get vendorPassword() {
    return this.loginForm.get('vendorPassword');
  }
}