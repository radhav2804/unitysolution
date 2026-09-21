/**
 * =========================================================================
 * Industry & Truck Opportunity Visit Form - Google Apps Script Backend
 * =========================================================================
 * 
 * This script serves as the backend Web App for receiving logistics opportunity
 * form submissions from the static frontend and recording them into Google Sheets.
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet
 * 2. Click "Extensions" > "Apps Script"
 * 3. Paste this code into Code.gs
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type "Web app"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone" (Crucial for public form submission)
 * 8. Click "Deploy" and copy the Web App URL into script.js (GOOGLE_SHEET_WEB_APP_URL)
 */

// Target Sheet Name (Default: first sheet or named "Visits")
var SHEET_NAME = "Opportunity Visits";

// Header columns exactly matching the business requirements
var HEADERS = [
  "Timestamp",
  "Visit Date",
  "Executive Name",
  "Executive Contact Number",
  "City",
  "Area",
  "GPS Location",
  "Visit Type",
  "Industry Name",
  "Industry Type",
  "Company Address",
  "Contact Person",
  "Designation",
  "Contact Person Number",
  "WhatsApp",
  "Email",
  "Website",
  "Transportation Requirement",
  "Transportation Type",
  "Requirement Frequency",
  "Trucks Per Day",
  "Trucks Per Month",
  "Truck Type",
  "Vehicle Body Type",
  "Load Weight",
  "Loading Location",
  "Unloading Location",
  "Routes",
  "Monthly Shipment Volume",
  "Current Transporter",
  "Current Freight Rate",
  "Expected Freight Rate",
  "Payment Terms",
  "Transporter Problem",
  "Opportunity Potential",
  "Status",
  "Next Follow-up Date",
  "Follow-up Person",
  "Notes",
  "Additional Remarks",
  "Visiting Card / Document Note"
];

/**
 * Handle HTTP GET request (used for testing and health check)
 */
function doGet(e) {
  var response = {
    status: "success",
    message: "Industry & Truck Opportunity Web App API is active and ready to accept submissions.",
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST request from the form
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for any concurrent request to finish
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server is busy processing another request. Please try again in a moment."
    });
  }

  try {
    var rawData = e.postData && e.postData.contents ? e.postData.contents : null;
    if (!rawData) {
      return createJsonResponse({
        status: "error",
        message: "No data received in POST request body."
      });
    }

    var data;
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      // If submitted via URL-encoded form data
      if (e.parameter) {
        data = e.parameter;
      } else {
        return createJsonResponse({
          status: "error",
          message: "Invalid JSON data payload: " + parseErr.message
        });
      }
    }

    // Basic server-side validation of mandatory fields
    if (!data.visitDate || !data.executiveName || !data.industryName || !data.industryType) {
      return createJsonResponse({
        status: "error",
        message: "Validation failed: Missing required fields (Visit Date, Executive Name, Industry Name, or Industry Type)."
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // If sheet doesn't exist, create it
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Ensure header row exists and format it if empty
    if (sheet.getLastRow() === 0) {
      initializeSheetHeaders(sheet);
    }

    // Format submission timestamp in local spreadsheet timezone
    var tz = ss.getSpreadsheetTimeZone() || "GMT";
    var formattedTimestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");

    // Handle File / Visiting Card upload to Google Drive
    var fileUrlOrNote = "";
    if (data.fileBase64 && data.fileName) {
      try {
        var folderName = "Logistics Opportunity Documents";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        var base64Content = data.fileBase64;
        if (base64Content.indexOf("base64,") > -1) {
          base64Content = base64Content.split("base64,")[1];
        }

        var decodedBytes = Utilities.base64Decode(base64Content);
        var mimeType = data.fileMimeType || "image/jpeg";
        var blob = Utilities.newBlob(decodedBytes, mimeType, data.fileName);
        var driveFile = folder.createFile(blob);
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        fileUrlOrNote = driveFile.getUrl();
      } catch (fileErr) {
        fileUrlOrNote = (data.documentNote || data.fileName) + " (Drive upload note: " + fileErr.message + ")";
      }
    } else {
      fileUrlOrNote = data.documentNote || data.documentName || "";
    }

    // Assemble row values in exact header order
    var row = [
      formattedTimestamp,
      data.visitDate || "",
      data.executiveName || "",
      data.executiveContactNumber || "",
      data.city || "",
      data.area || "",
      data.gpsLocation || "",
      data.visitType || "",
      data.industryName || "",
      data.industryType || "",
      data.companyAddress || "",
      data.contactPerson || "",
      data.designation || "",
      data.contactPersonNumber || "",
      data.whatsapp || "",
      data.email || "",
      data.website || "",
      data.transportationRequirement || "",
      data.transportationType || "",
      data.requirementFrequency || "",
      data.trucksPerDay !== undefined && data.trucksPerDay !== null ? data.trucksPerDay : "",
      data.trucksPerMonth !== undefined && data.trucksPerMonth !== null ? data.trucksPerMonth : "",
      data.truckType || "",
      data.vehicleBodyType || "",
      data.loadWeight || "",
      data.loadingLocation || "",
      data.unloadingLocation || "",
      data.routes || "",
      data.monthlyShipmentVolume || "",
      data.currentTransporter || "",
      data.currentFreightRate || "",
      data.expectedFreightRate || "",
      data.paymentTerms || "",
      data.transporterProblem || "",
      data.opportunityPotential || "",
      data.status || "",
      data.nextFollowUpDate || "",
      data.followUpPerson || "",
      data.notes || "",
      data.additionalRemarks || "",
      fileUrlOrNote
    ];

    // Append the row
    sheet.appendRow(row);

    // Apply auto-format to new row
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(lastRow, 1, 1, row.length);
    range.setFontFamily("Arial");
    range.setFontSize(10);
    range.setVerticalAlignment("middle");

    return createJsonResponse({
      status: "success",
      message: "Opportunity record successfully saved to Google Sheet!",
      rowNumber: lastRow,
      timestamp: formattedTimestamp
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Server error occurred: " + error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Initializes header styling, freezes top row, and sets column widths
 */
function initializeSheetHeaders(sheet) {
  sheet.appendRow(HEADERS);
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(11);
  headerRange.setBackground("#1e293b"); // Slate Navy
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
}

/**
 * Helper to build JSON HTTP response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
