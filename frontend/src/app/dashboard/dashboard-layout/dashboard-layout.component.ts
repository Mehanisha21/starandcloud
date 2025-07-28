import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css'],
  
})
export class DashboardLayoutComponent {
  sidebarOpen = false;
  vendorName: string = 'Vendor';

  constructor(
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    const username = this.authService.getVendorId();
    if (username) {
      this.profileService.getVendorProfile(username).subscribe({
        next: (res) => {
          if (res.success && res.data && res.data.Name1) {
            this.vendorName = res.data.Name1;
          }
        }
      });
    }
  }

 
  onSidebarToggle(open: boolean) {
    this.sidebarOpen = open;
  }
}
