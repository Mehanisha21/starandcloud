import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router'; // Assuming you use Router for navigation/logout

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() profilePic: string = 'assets/vendor_profile.jpg';
  @Input() userName: string = 'Vendor Name';
  @Input() sidebarOpen: boolean = false;
  @Output() sidebarChanged = new EventEmitter<boolean>();

 
  navLinks = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'RFQs', icon: 'description', route: '/dashboard/rfq' },
    { label: 'Purchase Orders', icon: 'assignment', route: '/dashboard/po' },
    { label: 'Goods Receipt', icon: 'local_shipping', route: '/dashboard/goods-receipt' },
    { label: 'Financial Sheet', icon: 'receipt_long', route: '/dashboard/finance-sheet' },
    { label: 'Logout', icon: 'logout', route: '/login' }
  ];

  

  constructor(private router: Router) { } // Inject Router

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarChanged.emit(this.sidebarOpen); // Emit the new boolean state
  }

  handleLogoutClick(event: MouseEvent, link: { label: string; icon: string; route: string }) {
  if (link.label === 'Logout') {
    event.preventDefault();
    event.stopPropagation();  // add this too

    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      // Clear auth tokens or perform logout logic here
      this.router.navigate([link.route]);
    } 
  }
}

}
