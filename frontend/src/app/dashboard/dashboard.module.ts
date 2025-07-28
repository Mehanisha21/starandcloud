// src/app/dashboard/dashboard.module.ts

import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common'; // Correct import for CommonModule
import { RouterModule, Routes } from '@angular/router';

// Import all components that belong to this dashboard module
import { TopNavComponent } from './top-nav/top-nav.component';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { RFQComponent } from './rfq/rfq.component';
import { POComponent } from './po/po.component';
import { GoodsReceiptComponent } from './goods-receipt/goods-receipt.component'; // Ensure this is imported
import { FinancialSheetComponent } from './financial-sheet/financial-sheet.component';
import { ProfileComponent } from './profile/profile.component';


const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'rfq', component: RFQComponent },
      { path: 'po', component: POComponent },
      { path: 'goods-receipt', component: GoodsReceiptComponent },
      { path: 'finance-sheet', component: FinancialSheetComponent },
      { path: 'profile', component: ProfileComponent },
      // ...other feature child routes
    ]
  }
];

@NgModule({
  declarations: [
    // Declare all components, directives, and pipes that belong to this dashboard module
    // CommonModule MUST NOT be here. It belongs only in 'imports'.
    RFQComponent,
    POComponent,
    SidebarComponent,
    TopNavComponent,
    DashboardLayoutComponent,
    DashboardHomeComponent,
    FinancialSheetComponent,
    ProfileComponent,
    GoodsReceiptComponent // Ensure GoodsReceiptComponent is declared here
  ],
  imports: [
    CommonModule, // <--- Correct place for CommonModule
    RouterModule.forChild(routes),
    NgxChartsModule,
    // FormsModule, ReactiveFormsModule, etc. if needed
  ]
})
export class DashboardModule { }
