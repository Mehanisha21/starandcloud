import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService, VendorProfile } from '../../services/profile.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  userName: string = 'Vendor';
  vendorProfile: VendorProfile | null = null;

  summaryCards = [
    { label: 'Open RFQs', value: 7, icon: 'description', color: 'linear-gradient(120deg,#2d81f7 60%, #72e7fd 100%)' },
    { label: 'Active POs', value: 5, icon: 'assignment', color: 'linear-gradient(120deg,#43a047 70%, #b8f2cc 100%)' },
    { label: 'Goods Receipts', value: 12, icon: 'local_shipping', color: 'linear-gradient(120deg,#fb8c00 70%, #ffe082 100%)' },
    { label: 'Outstanding Invoices', value: 3, icon: 'receipt', color: 'linear-gradient(120deg,#d32f2f 70%, #ffbdbd 100%)' }
  ];

  constructor(private authService: AuthService, private profileService: ProfileService) {}

  ngOnInit(): void {
    const username = this.authService.getVendorId();
    if (username) {
      this.profileService.getVendorProfile(username).subscribe({
        next: (res) => {
          if (res.success && res.data.Name1) {
            this.vendorProfile = res.data;
            this.userName = this.vendorProfile.Name1;
          }
        },
        error: (err) => {
          console.error('Error loading vendor profile:', err);
          this.userName = 'Vendor';
        }
      });
    }
  }

  // monthlyRFQs = [
  //   { name: 'Jan', value: 10 },
  //   { name: 'Feb', value: 14 },
  //   { name: 'Mar', value: 9 },
  //   { name: 'Apr', value: 15 },
  //   { name: 'May', value: 20 },
  //   { name: 'Jun', value: 13 }
  // ];

  // poStatusData = [
  //   { name: 'Completed', value: 8 },
  //   { name: 'In Progress', value: 3 },
  //   { name: 'Cancelled', value: 1 }
  // ];

  // deliveryRateData = [
  //   { name: 'On Time', value: 96 },
  //   { name: 'Late', value: 4 }
  // ];

  // invoiceStatusData = [
  //   { name: 'Paid', value: 18 },
  //   { name: 'Pending', value: 4 },
  //   { name: 'Overdue', value: 2 }
  // ];

  // colorSchemePO: Color = {
  //   name: 'po',
  //   selectable: true,
  //   group: ScaleType.Ordinal,
  //   domain: ['#43a047', '#fb8c00', '#d32f2f']
  // };

  // colorSchemeDelivery: Color = {
  //   name: 'delivery',
  //   selectable: true,
  //   group: ScaleType.Ordinal,
  //   domain: ['#43a047', '#d32f2f']
  // };

  // colorSchemeInvoice: Color = {
  //   domain: ['#43a047', '#fcbb03', '#d32f2f'],
  //   name: 'customInvoice',
  //   selectable: true,
  //   group: ScaleType.Ordinal
  // };
  // colorSchemeRFQ: Color = {
  //   domain: ['#2d81f7', '#72e7fd'],
  //   name: 'customRFQ',
  //   selectable: true,
  //   group: ScaleType.Ordinal
  // };
}
