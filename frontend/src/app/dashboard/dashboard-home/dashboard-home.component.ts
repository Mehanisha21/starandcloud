import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService, VendorProfile } from '../../services/profile.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { RfqService } from '../../services/rfq.service';
import { PoService, PurchaseOrder  } from '../../services/po.service'; // Assuming you have a PoService for Purchase Orders 
import { GoodsReceiptService, GoodsReceipt } from '../../services/goods-receipt.service';
import { FinancialSheetService, PaymentAging, Memo } from '../../services/financial-sheet.service';

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
    { label: 'Active POs', value: 0, icon: 'assignment', color: 'linear-gradient(120deg,#43a047 70%, #b8f2cc 100%)' },
    { label: 'Goods Receipts', value: 0, icon: 'local_shipping', color: 'linear-gradient(120deg,#fb8c00 70%, #ffe082 100%)' },
    { label: 'Outstanding Invoices', value: 0, icon: 'receipt', color: 'linear-gradient(120deg,#d32f2f 70%, #ffbdbd 100%)' }
  ];

  monthlyRFQs: { name: string, value: number }[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  poStatusData: { name: string; value: number }[] = [];
  deliveryLineTrend: any[] = [];
  paymentAgingStatusData: { name: string; value: number }[] = [];
  memoTypeData: { name: string; value: number }[] = [];
  dynamicInvoiceStatusData: { name: string; value: number }[] = [];

  constructor(private authService: AuthService, 
              private profileService: ProfileService,
              private rfqService: RfqService,
              private poService: PoService,
              private goodsReceiptService: GoodsReceiptService,
              private financialService: FinancialSheetService
            ) {}

  ngOnInit(): void {
    const vendorId = this.authService.getVendorId();
    if (!vendorId) {
      console.warn('No vendor ID found for logged-in user.');
      return;
    }

    if (vendorId) {
      this.profileService.getVendorProfile(vendorId).subscribe({
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

    if (vendorId) {
      this.loadPurchaseOrders(vendorId);
      this.loadGoodsReceipts(vendorId);
    }

    this.financialService.getInvoicesByVendor(vendorId).subscribe({
    next: invoices => {
      this.summaryCards[3].value = invoices.length;

      // If you want to compute status distribution based on invoice or payment data
      // Here, assuming you use payment status for accuracy:
      this.financialService.getPaymentsAgingByVendor(vendorId).subscribe({
        next: payments => {
          this.processInvoiceStatusChartData(payments);
        },
        error: err => {
          console.error('Error loading payments for invoice status chart:', err);
        }
      });
    },
    error: err => {
      console.error('Error loading invoices for summary:', err);
    }
  });

  // Load payment aging distribution
  this.financialService.getPaymentsAgingByVendor(vendorId).subscribe({
    next: payments => {
      this.processPaymentAgingChartData(payments);
    },
    error: err => {
      console.error('Error loading payments for aging chart:', err);
    }
  });

  // Load memos and process credit/debit memo chart
  this.financialService.getCDMemosByVendor(vendorId).subscribe({
    next: memos => {
      this.processMemoChartData(memos);
    },
    error: err => {
      console.error('Error loading memos for memo chart:', err);
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

  

  loadPurchaseOrders(vendorId: string): void {
  this.poService.getPOByVendor(vendorId).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.purchaseOrders = response.data;
        this.summaryCards[1].value = this.purchaseOrders.length;  // UPDATE SUMMARY CARD HERE
        this.processPoStatusChartData(this.purchaseOrders);
      } else {
        this.purchaseOrders = [];
        this.summaryCards[1].value = 0;  // Reset if no data
        this.poStatusData = [];
      }
    },
    error: (error) => {
      console.error('Error loading purchase orders:', error);
      this.purchaseOrders = [];
      this.summaryCards[1].value = 0;
      this.poStatusData = [];
    }
  });
}


  loadGoodsReceipts(vendorId: string): void {
    this.goodsReceiptService.getGoodsReceipts(vendorId).subscribe({
      next: (receipts) => {
        this.summaryCards[2].value = receipts.length;
        this.deliveryLineTrend = this.buildGoodsReceiptMonthlyTrendData(receipts);

      },
      error: (error) => {
        console.error('Error loading Goods Receipts:', error);
      }
    });
  }


  private processPoStatusChartData(purchaseOrders: PurchaseOrder[]): void {
    const statusCounts: Record<string, number> = {};

    purchaseOrders.forEach(po => {
      const status = po.Statu ? po.Statu : 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    this.poStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }

  private buildGoodsReceiptMonthlyTrendData(goodsReceipts: GoodsReceipt[]): any[] {
    const monthMap: Record<string, number> = {};

    goodsReceipts.forEach(gr => {
      const postingDate = new Date(gr.postingDate);
      const year = postingDate.getFullYear();
      const month = postingDate.getMonth(); // 0-based
      const label = `${postingDate.toLocaleString('default', { month: 'short' })} '${year.toString().slice(-2)}`; // e.g., "Jul '25"
      monthMap[label] = (monthMap[label] || 0) + 1;
    });

    const sortedSeries = Object.entries(monthMap)
      .sort(([a], [b]) => {
        const parse = (label: string) => {
          const [mon, yr] = label.split(" '");
          const monthNum = new Date(`${mon} 1, 20${yr}`).getMonth();
          return parseInt(`20${yr}`) * 100 + monthNum;
        };
        return parse(a) - parse(b);
      })
      .map(([label, value]) => ({ name: label, value }));

    return [{
      name: 'Goods Receipts',
      series: sortedSeries
    }];
  }

private processInvoiceStatusChartData(payments: PaymentAging[]) {
  // Count occurrences of statuses in payments
  const statusMap = payments.reduce((acc, payment) => {
    const status = payment.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to ngx-charts format (name/value)
  this.dynamicInvoiceStatusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
}

private processPaymentAgingChartData(payments: PaymentAging[]) {
  // Define aging buckets (example)
  const buckets = {
    '0-30 Days': 0,
    '31-60 Days': 0,
    '61+ Days': 0,
  };

  payments.forEach(p => {
    if (p.aging <= 30) buckets['0-30 Days']++;
    else if (p.aging <= 60) buckets['31-60 Days']++;
    else buckets['61+ Days']++;
  });

  this.paymentAgingStatusData = Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

private processMemoChartData(memos: Memo[]) {
  // Sum amounts by type
  const typeMap: Record<string, number> = { Credit: 0, Debit: 0, Unknown: 0 };

  memos.forEach(memo => {
    const t = memo.type || 'Unknown';
    typeMap[t] = (typeMap[t] || 0) + (memo.amount || 0);
  });

  this.memoTypeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
}


  










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
