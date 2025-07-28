import { Component, OnInit } from '@angular/core';
import { ProfileService, VendorProfile } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';   // import your auth service

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  vendorProfile: VendorProfile | null = null;
  errorMessage = '';

  constructor(
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // FIX: Changed getUsername() to getVendorId() to match the AuthService update
    const vendorId = this.authService.getVendorId();

    if (!vendorId) {
      alert('No logged-in user found.');
      return;
    }

    this.profileService.getVendorProfile(vendorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.vendorProfile = res.data;
        } else {
          this.errorMessage = 'Failed to load vendor profile.';
        }
      },
      error: (err) => {
        this.errorMessage = 'Error occurred while fetching vendor profile.';
        console.error(err);
      }
    });
  }
}