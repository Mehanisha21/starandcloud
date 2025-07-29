import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService, VendorProfile } from '../../services/profile.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { RfqService } from '../../services/rfq.service'; 

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  userName: string = 'Vendor';
  vendorProfile: VendorProfile | null = null;

  summaryCards = [
    {label: 'Open RFQs',value: 0,icon: 'description',color: 'linear-gradient(120deg,#2d81f7 60%, #72e7fd 100%)'},
    { label: 'Active POs', value: 5, icon: 'assignment', color: 'linear-gradient(120deg,#43a047 70%, #b8f2cc 100%)' },
    { label: 'Goods Receipts', value: 12, icon: 'local_shipping', color: 'linear-gradient(120deg,#fb8c00 70%, #ffe082 100%)' },
    { label: 'Outstanding Invoices', value: 3, icon: 'receipt', color: 'linear-gradient(120deg,#d32f2f 70%, #ffbdbd 100%)' }
  ];

  monthlyRFQs: { name: string, value: number }[] = [];

  constructor(private authService: AuthService, 
              private profileService: ProfileService,
              private rfqService: RfqService) {}

  ngOnInit(): void {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      console.warn('No vendor ID found for logged-in user.');
      return;
    }


  this.rfqService.getRfqsByVendor(vendorId).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.processRfqsForDashboard(res.data);
        }
      },
      error: (err) => {
        console.error('Error loading RFQs:', err);
      }
    });
  }

  private processRfqsForDashboard(rfqs: any[]) {
    // Filter open RFQs if possible - replace condition as per your real data attributes
    // For demo, treat all returned RFQs as open
    const openRfqs = rfqs;

    // Update 'Open RFQs' card dynamically
    this.summaryCards = this.summaryCards.map(card =>
      card.label === 'Open RFQs' ? { ...card, value: openRfqs.length } : card
    );

    // Prepare monthly RFQ counts based on Bedat document date
    const monthlyCounts: { [month: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    rfqs.forEach(rfq => {
      const isoDate = this.convertSapDate(rfq.Bedat);
      if (!isoDate) return;
      const dt = new Date(isoDate);
      const month = monthNames[dt.getMonth()];
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    // Build chart data in month order
    this.monthlyRFQs = monthNames.map(month => ({
      name: month,
      value: monthlyCounts[month] || 0
    }));
  }

  private convertSapDate(sapDate: string): string | null {
    if (!sapDate) return null;
    const match = sapDate.match(/\/Date\((\d+)\)\//);
    if (match && match[1]) {
      const date = new Date(Number(match[1]));
      return date.toISOString();
    }
    return null;
  }

  

  poStatusData = [
    { name: 'Completed', value: 8 },
    { name: 'In Progress', value: 3 },
    { name: 'Cancelled', value: 1 }
  ];

  deliveryLineTrend = [
  {
    name: 'On Time',
    series: [
      { name: 'Jan', value: 26 },
      { name: 'Feb', value: 27 },
      { name: 'Mar', value: 29 },
      { name: 'Apr', value: 31 },
      { name: 'May', value: 28 }
      // add more months/data as needed
    ]
  },
  {
    name: 'Late',
    series: [
      { name: 'Jan', value: 4 },
      { name: 'Feb', value: 6 },
      { name: 'Mar', value: 3 },
      { name: 'Apr', value: 2 },
      { name: 'May', value: 5 }
    ]
  }
];


  invoiceStatusData = [
    { name: 'Paid', value: 18 },
    { name: 'Pending', value: 4 },
    { name: 'Overdue', value: 2 }
  ];

  colorSchemePO: Color = {
    name: 'po',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#43a047', '#fb8c00', '#d32f2f']
  };

  colorSchemeDelivery: Color = {
    name: 'delivery',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#43a047', '#d32f2f']
  };

  colorSchemeInvoice: Color = {
    domain: ['#43a047', '#fcbb03', '#d32f2f'],
    name: 'customInvoice',
    selectable: true,
    group: ScaleType.Ordinal
  };
  colorSchemeRFQ: Color = {
    domain: ['#2d81f7', '#72e7fd'],
    name: 'customRFQ',
    selectable: true,
    group: ScaleType.Ordinal
  };
}
