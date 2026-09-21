# Industry & Truck Opportunity Visit Form

A fast, mobile-friendly, production-ready static web application built for trucking and logistics enterprises. Field executives and sales teams use this tool to log industrial visits, capture freight requirements, identify truck placement opportunities, evaluate competitors, and automatically record leads into a **Google Sheet** via a free Google Apps Script Web App backend.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│                     Field Executive                     │
│      (Smartphone / Tablet / Desktop Web Browser)        │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTPS POST (JSON Payload)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             GitHub Pages (Static Hosting)               │
│          HTML5  •  Vanilla CSS3  •  Vanilla JS          │
│        (No Node.js, No DB, No Paid Infrastructure)      │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ fetch()
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Google Apps Script Web App API              │
│                (google-apps-script/Code.gs)             │
│            • Validates incoming opportunity data        │
│            • Server-side timestamping                   │
│            • Script lock for concurrency safety         │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ SpreadsheetApp API
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 Google Sheet Database                   │
│             Tab: "Opportunity Visits"                   │
│         40 Organized Columns with Auto-Headers          │
└─────────────────────────────────────────────────────────┘
```

---

## Features

- **100% Free & Serverless**: Zero hosting costs on GitHub Pages and zero backend maintenance.
- **Pure Web Standards**: Built strictly with HTML5, CSS3, and modern vanilla JavaScript (no npm build step or heavy frameworks required).
- **Responsive Industrial Logistics UI**:
  - Two-column grid on desktop, single-column touch layout on mobile devices.
  - Form organized into 5 clear section cards with step numbers, category badges, and icons.
- **Smart Field Automation**:
  - Automatically sets today's date on form load.
  - Automatically remembers the Field Executive's Name & Contact Number using browser `localStorage`.
  - One-tap **GPS Location Auto-Detector** (`navigator.geolocation`).
  - Visiting card / document photo selector with instant thumbnail preview and size validation (< 2MB).
- **Client-Side Validation**:
  - Real-time inline feedback for mandatory fields, phone numbers, emails, URLs, and truck volumes.
  - Duplicate submission prevention with spinner state and disabled button during active requests.
- **Built-in Offline Resilience & Device History**:
  - Submissions are cached locally in device memory so data is never lost even if mobile data drops.
  - In-app **Recent Logs Drawer** with instant search, filter, and one-click **CSV Export**.
- **Quick Demo Fill Button**: One-click mock data injector to test the complete flow immediately.

---

## Project Structure

```text
logistics-opportunity-form/
│
├── index.html                 # Core semantic HTML5 form structure & modals
├── style.css                  # Responsive design, theme variables, micro-animations
├── script.js                  # Validation, geolocation, localStorage, and API integration
├── README.md                  # Comprehensive setup & deployment documentation
└── google-apps-script/
    └── Code.gs                # Google Apps Script Web App backend (doPost/doGet)
```

---

## Step-by-Step Setup Guide

### Step 1: Create Your Google Sheet

1. Open [Google Sheets](https://sheets.new) in your web browser.
2. Rename the spreadsheet to **"Logistics Opportunity Database"** (or any preferred title).
3. Name the first tab/sheet **"Opportunity Visits"** (the script will automatically create it if named differently).
4. *Optional*: You do not need to manually type the headers — the Apps Script code automatically creates and styles all 40 headers with a dark navy theme on the first submission!

---

### Step 2: Add the Google Apps Script Backend

1. In your Google Sheet, click the top menu: **Extensions** > **Apps Script**.
2. A new tab will open with an editor showing a default `Code.gs` file.
3. Delete any default code in `Code.gs`.
4. Open [`google-apps-script/Code.gs`](file:///d:/phone_xls/google-apps-script/Code.gs) from this repository, copy the complete code, and paste it into the Apps Script editor.
5. Click the **Save** icon (diskette) or press `Ctrl + S` (`Cmd + S` on Mac).

---

### Step 3: Deploy Apps Script as a Public Web App

> [!IMPORTANT]
> To allow field staff to submit the form without requiring Google sign-in permissions, the Web App must be deployed with **"Who has access: Anyone"**.

1. In the upper-right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the **gear icon** (Select type) next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `Logistics Form v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Must be set to "Anyone")*
4. Click **Deploy**.
5. If prompted by Google for authorization:
   - Click **Authorize access**.
   - Choose your Google Account.
   - If an "unverified app" screen appears, click **Advanced** > **Go to Untitled project (unsafe)**.
   - Click **Allow**.
6. Google will display your **Web App URL** ending in `/exec`.
   - Example: `https://script.google.com/macros/s/AKfycbxAbC123...XYZ/exec`
7. **Copy this Web App URL**.

---

### Step 4: Configure the Web App URL in `script.js`

1. Open [`script.js`](file:///d:/phone_xls/script.js).
2. Locate line 17:
   ```javascript
   const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec";
   ```
3. Replace `"https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec"` with your copied Web App URL:
   ```javascript
   const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAbC123...XYZ/exec";
   ```
4. Save `script.js`.

> [!TIP]
> You can also test or override this URL on any browser without modifying the code by clicking the **Gear icon (Settings)** in the top right corner of the form!

---

### Step 5: Test the Form Locally

1. Open `index.html` directly in your web browser (or use VS Code Live Server / python `-m http.server`).
2. Click the amber **"Fill Demo"** button in the top bar to auto-populate sample field data.
3. Click **"Submit Opportunity"**.
4. Check your Google Sheet — a new row will appear instantly with all 40 columns filled and formatted!

---

### Step 6: Push the Project to GitHub

Initialize git and push the files to your GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit: Logistics truck opportunity tracking form"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY-NAME>.git
git push -u origin main
```

---

### Step 7: Enable GitHub Pages

1. Navigate to your repository on [GitHub](https://github.com).
2. Click **Settings** (gear tab at the top).
3. In the left navigation menu, click **Pages**.
4. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/(root)`
5. Click **Save**.
6. Wait 1-2 minutes. Refresh the page to see your live URL:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPOSITORY-NAME>/`

---

## Google Sheet Data Columns (Exact Mapping)

The script maps incoming form data directly into these 40 columns:

| # | Column Header | Data Source / Description |
|---|---|---|
| 1 | `Timestamp` | Server-generated timestamp of submission |
| 2 | `Visit Date` | Form visit date (YYYY-MM-DD) |
| 3 | `Executive Name` | Field executive name (remembered in browser) |
| 4 | `Executive Contact Number` | Field executive phone number |
| 5 | `City` | City / District |
| 6 | `Area` | Industrial estate / Zone |
| 7 | `GPS Location` | Auto-detected coordinates (`Lat, Long (±Accuracy)`) |
| 8 | `Visit Type` | First Visit / Follow-up / Existing / Referral |
| 9 | `Industry Name` | Target company name (Mandatory) |
| 10 | `Industry Type` | Sector (Manufacturing, Auto, Steel, FMCG, etc.) |
| 11 | `Company Address` | Factory / Plant address |
| 12 | `Contact Person` | Decision maker name |
| 13 | `Designation` | Decision maker job title |
| 14 | `Contact Person Number` | Official contact phone |
| 15 | `WhatsApp` | WhatsApp contact for rate quotes |
| 16 | `Email` | Official company email |
| 17 | `Website` | Company website |
| 18 | `Transportation Requirement` | Yes / No / Potential Future |
| 19 | `Transportation Type` | Inbound / Outbound / Both |
| 20 | `Requirement Frequency` | Daily / Weekly / Monthly / Occasional / Seasonal |
| 21 | `Trucks Per Day` | Daily truck placement estimate |
| 22 | `Trucks Per Month` | Monthly truck requirement |
| 23 | `TruckType` | 14FT, 17FT, 19FT, 20FT, 22FT, 24FT, 32FT, Trailer, Container, etc. |
| 24 | `Vehicle Body Type` | Open, Closed, Container, Reefer, Tanker, Flatbed |
| 25 | `Load Weight` | Tonnage / Payload specification |
| 26 | `Loading Location` | Origin pickup location |
| 27 | `Unloading Location` | Destination / Unloading point |
| 28 | `Routes` | Major transport lanes & corridors |
| 29 | `Monthly Shipment Volume` | Estimated monthly tonnage / loads |
| 30 | `Current Transporter` | Existing logistics service provider |
| 31 | `Current Freight Rate` | Benchmark freight pricing |
| 32 | `Expected Freight Rate` | Client target rate |
| 33 | `Payment Terms` | Advance, 7, 15, 30, 45, 60 Days |
| 34 | `Transporter Problem` | Vehicle availability, pricing, delays, tracking |
| 35 | `Opportunity Potential` | High, Medium, Low |
| 36 | `Status` | New Lead, Quotation Required, Negotiation, Converted, etc. |
| 37 | `Next Follow-up Date` | Scheduled follow-up date |
| 38 | `Follow-up Person` | Assigned sales executive |
| 39 | `Notes` | Discussion insights & deal notes |
| 40 | `Additional Remarks` | Operational constraints / special notes |
| 41 | `Visiting Card / Document Note` | Attached file name & metadata |

---

## Security & Architecture Considerations

- **No Secrets in Frontend**: The frontend contains **no API keys, no Google Cloud Service Account JSON credentials, and no passwords**. Only the public Web App URL is exposed.
- **Read/Write Boundary**: The Google Apps Script acts as an isolated gateway. It only accepts `POST` insertions and does **not** expose your Google Sheet's internal spreadsheet ID or any read queries to the public web.
- **CORS Handling**: Form payloads are sent with `Content-Type: text/plain;charset=utf-8` using JSON serialization, which avoids browser CORS preflight blocks with Google Apps Script Web App endpoints.
- **LockService Concurrency**: The Google Apps Script utilizes `LockService.getScriptLock()` to queue concurrent requests for up to 30 seconds, preventing race conditions when multiple field executives submit forms simultaneously.

---

## Troubleshooting & FAQ

#### 1. Why do I see a CORS warning or "Failed to fetch"?
- Check that your Google Apps Script is deployed with **Who has access: Anyone**. If set to "Only myself", browsers will block cross-origin requests.
- Verify that your URL ends in `/exec` and not `/dev` or `/edit`.

#### 2. How do I update the Apps Script code after making changes?
- When you update `Code.gs`, click **Deploy** > **Manage deployments**.
- Click the edit icon (pencil) next to your deployment.
- Set the **Version** dropdown to **New version**.
- Click **Deploy**. (The URL stays the same).

#### 3. How do field executives use it on smartphones?
- Send the live GitHub Pages URL to staff via WhatsApp or SMS.
- Field executives can tap **"Add to Home screen"** in Chrome/Safari to install it as an app shortcut with an icon on their home screen!


https://script.google.com/macros/s/AKfycbyDJi1XyCFICBuV_YJhFBpIBmysov3xXQ4KB4MKYKMuBq5BdbKaY76edAginiejUQik/exec
AKfycbyDJi1XyCFICBuV_YJhFBpIBmysov3xXQ4KB4MKYKMuBq5BdbKaY76edAginiejUQik