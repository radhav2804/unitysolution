/**
 * =========================================================================
 * WhatsApp Follow-up Bot - Configuration
 * =========================================================================
 */

module.exports = {
  // Your Google Apps Script Web App URL (Fetches client numbers directly from Google Sheets)
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyDJi1XyCFICBuV_YJhFBpIBmysov3xXQ4KB4MKYKMuBq5BdbKaY76edAginiejUQik/exec",

  // Optional: Local Excel file fallback if you prefer loading directly from a file (e.g., "leads.xlsx")
  LOCAL_EXCEL_FILE: "./leads.xlsx",

  // Path to your visiting card or company brochure image (placed inside this folder)
  VISITING_CARD_PATH: "./card.jpg",

  // Default Country Code for phone numbers (e.g. "91" for India)
  COUNTRY_CODE: "91",

  // Anti-Spam Safety Delays (in milliseconds)
  // WhatsApp accounts can be flagged if messages are sent too fast.
  // 10 to 15 seconds between each client is safe and natural.
  DELAY_MIN_MS: 8000,   // 8 seconds
  DELAY_MAX_MS: 15000,  // 15 seconds

  // Follow-up message template. Available tags:
  // {name}      - Contact Person Name
  // {company}   - Industry / Company Name
  // {truckType} - Preferred Truck Type (or Fleet)
  // {routes}    - Key transportation routes
  MESSAGE_TEMPLATE: `Hello {name} ji,

Greetings from our Logistics & Fleet Operations team!

Following up regarding your truck and transportation requirements for {company}.

Please find our visiting card attached for your reference. We specialize in {truckType} vehicle placements across your key corridors ({routes}) with dedicated tracking, fast placement, and competitive freight rates.

Feel free to contact us for your daily dispatches or upcoming shipments.

Best Regards,
Dispatch & Operations Team`
};
