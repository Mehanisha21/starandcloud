// src/app/dashboard/rfq/rfq.component.ts
import { Component, OnInit } from '@angular/core';
import { RfqService } from '../../services/rfq.service'; // Adjust path if necessary
import { AuthService } from '../../services/auth.service'; // Assuming AuthService for vendor ID

// Define the interface for the RFQ data as it will be displayed in the component.
// This provides strong typing for your 'rfqs' array and improves code readability.
export interface RfqDisplay {
  id: string;      // Mapped from __metadata.uri (RFQ ID) or Lifnr
  item: string;    // Mapped from Txz01 (Short Text / Item Description)
  qtyUnit: string; // Combined from Ktmng (Quantity) and Meins (Unit)
  due: string;     // Mapped and formatted from Bedat (Document Date) as a readable date string
  // status: string; // Removed as per your request
}

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.css']
})
export class RFQComponent implements OnInit {
  rfqs: RfqDisplay[] = []; // Array to hold the formatted RFQ data, strongly typed
  isLoading: boolean = false; // Flag to indicate if data is currently being loaded
  errorMsg: string | null = null; // Holds any error message to display, null if no error
  noDataFound: boolean = false; // Flag for displaying "no data" message

  // IMPORTANT: This vendor ID is hardcoded for demonstration.
  // In a real application, fetch this from a user session, route parameter, or another service.
  // For testing the "no RFQ" scenario, you should dynamically get this from AuthService.
  // private readonly vendorId: string = '0000100000'; // Hardcoded value
  private vendorId: string | null = null; // Will be set from AuthService

  constructor(
    private rfqService: RfqService,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    // Fetch vendor ID from AuthService
    this.vendorId = this.authService.getVendorId();
    this.getRfqs();
  }

  /**
   * Fetches RFQ data for the specified vendor from the RfqService.
   * Handles loading states, data transformation, and error messages.
   */
  getRfqs(): void {
    this.isLoading = true; // Set loading state to true
    this.errorMsg = null;  // Clear any previous error messages
    this.noDataFound = false; // Reset no data found status
    this.rfqs = []; // Clear previous RFQs

    // Use the vendorId obtained from AuthService
    if (!this.vendorId) {
      this.isLoading = false;
      this.errorMsg = 'Vendor ID not found. Please log in to view RFQs.';
      this.noDataFound = true;
      console.warn('RfqComponent: No vendor ID found in AuthService.');
      return;
    }

    console.log(`RfqComponent: Requesting RFQs for Vendor ID: ${this.vendorId}`);
    this.rfqService.getRfqsByVendor(this.vendorId).subscribe({
      next: (res: { success: boolean; data: any[] }) => {
        // Check if the API response indicates success and contains data
        if (res.success && res.data && res.data.length > 0) {
          // Map the raw API data to the desired RfqDisplay structure
          this.rfqs = res.data.map(rfqData => {
            // Extract RFQ ID from the __metadata.uri string using a regular expression
            const rfqIdMatch = rfqData.__metadata?.uri?.match(/VEN_RFQSet\('(\d+)'\)/);
            const rfqId = rfqIdMatch ? rfqIdMatch[1] : (rfqData.Lifnr || 'N/A'); // Fallback to Lifnr if URI not found, then 'N/A'

            // Parse and format the OData date string (e.g., "/Date(1748822400000)/")
            let dueDate = 'N/A';
            if (rfqData.Bedat) {
              try {
                // *** DEBUGGING LOGS START ***
                console.log('Raw Bedat from backend:', rfqData.Bedat);
                // *** DEBUGGING LOGS END ***

                const timestampMatch = rfqData.Bedat.match(/\/Date\((\d+)\)\//);
                if (timestampMatch && timestampMatch[1]) {
                  const timestamp = parseInt(timestampMatch[1], 10);
                  const date = new Date(timestamp); // This creates a Date object in local time

                  // *** DEBUGGING LOGS START ***
                  console.log('Parsed timestamp:', timestamp);
                  console.log('Date object (local time):', date);
                  console.log('Date object (UTC time string):', date.toUTCString()); // Crucial for seeing the UTC date
                  // *** DEBUGGING LOGS END ***

                  // *** CORRECTED DATE FORMATTING FOR UTC DATE ***
                  // Use UTC getters to ensure the date components are from the UTC representation
                  // of the timestamp, preventing local timezone shifts.
                  const year = date.getUTCFullYear();
                  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1
                  const day = date.getUTCDate().toString().padStart(2, '0');

                  dueDate = `${month}/${day}/${year}`; // Format as MM/DD/YYYY

                  // *** DEBUGGING LOGS START ***
                  console.log('Formatted dueDate (using UTC components):', dueDate); // Log the final formatted date
                  // *** DEBUGGING LOGS END ***

                }
              } catch (e) {
                console.warn('Error parsing date:', rfqData.Bedat, e);
                dueDate = 'Invalid Date'; // Indicate if parsing failed
              }
            }

            // Return the transformed RFQ object
            return {
              id: rfqId,
              item: rfqData.Txz01 || 'N/A', // Use 'N/A' if item description is missing
              qtyUnit: `${(parseFloat(rfqData.Ktmng) || 0).toFixed(0)} ${rfqData.Meins || ''}`.trim(), // Combine quantity and unit
              due: dueDate,
            } as RfqDisplay; // Cast to ensure it matches the interface
          });
        } else {
          // If no data or success is false, set an appropriate message
          this.rfqs = []; // Ensure the RFQs array is empty
          this.noDataFound = true; // Set flag for "no data" message
          this.errorMsg = 'No RFQ data found for this vendor or API response was unsuccessful.';
        }
        this.isLoading = false; // Data processing complete, stop loading
      },
      error: (err: any) => {
        // Handle errors from the HTTP request (e.g., network issues, server errors)
        this.errorMsg = 'Failed to load RFQ data. Please check your network or try again later.';
        console.error('Error fetching RFQ data:', err);
        this.isLoading = false; // Stop loading on error
        this.rfqs = []; // Clear any potentially partial data on error
        this.noDataFound = true; // Set flag for "no data" message on error
      },
      complete: () => {
        // This block executes when the Observable sequence finishes (either success or error)
        console.log('RFQ data fetching process completed.');
      }
    });
  }

  /**
   * trackBy function for *ngFor to improve performance.
   * It tells Angular how to identify unique items in the 'rfqs' array.
   * @param index The index of the item in the array.
   * @param rfq The current RfqDisplay object.
   * @returns A unique identifier for the rfq (its 'id').
   */
  trackByRfqId(index: number, rfq: RfqDisplay): string {
    return rfq.id; // Assuming 'id' is unique for each RFQ
  }

  submitQuote(rfqId: string): void {
    alert(`Submitting quote for RFQ ID: ${rfqId}`);
    // Implement actual logic to navigate to a quote submission form
    // or trigger a backend call to change RFQ status/submit details.
  }
}