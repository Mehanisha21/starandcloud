import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { RFQComponent } from './rfq/rfq.component';
import { POComponent } from './po/po.component';
import { GoodsReceiptComponent } from './goods-receipt/goods-receipt.component';
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
      {path: 'goods-receipt', component: GoodsReceiptComponent },  
      {path: 'finance-sheet', component: FinancialSheetComponent },  
      {path: 'profile', component: ProfileComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

