/**
 * =========================================================================
 * Industry & Truck Opportunity Visit Form - Frontend Logic
 * =========================================================================
 * 
 * Tech Stack: Vanilla JavaScript (ES6+), HTML5, CSS3
 * Compatible with GitHub Pages static hosting.
 */

// =========================================================================
// 1. CONFIGURATION: GOOGLE APPS SCRIPT WEB APP ENDPOINT
// =========================================================================
// Replace this with your deployed Google Apps Script Web App URL:
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"
//const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDJi1XyCFICBuV_YJhFBpIBmysov3xXQ4KB4MKYKMuBq5BdbKaY76edAginiejUQik/exec";
const DEFAULT_GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDJi1XyCFICBuV_YJhFBpIBmysov3xXQ4KB4MKYKMuBq5BdbKaY76edAginiejUQik/exec";

//Library_url: https://script.google.com/macros/library/d/1-gS8S8KT39kbkswe_CbAybSK3VX0cUw2PW901B0DUfpkQ0M4NACmg05z/2


// Local storage keys
const STORAGE_KEYS = {
  API_URL: "logistics_custom_api_url",
  EXECUTIVE_NAME: "logistics_last_executive_name",
  EXECUTIVE_PHONE: "logistics_last_executive_phone",
  VISIT_HISTORY: "logistics_visit_history_v1"
};

// Application State
const state = {
  isSubmitting: false,
  attachedFile: null,
  attachedFileBase64: null,
  lastSubmittedData: null
};

// =========================================================================
// 2. DOM ELEMENT REFERENCES
// =========================================================================
const elements = {
  form: document.getElementById("opportunityForm"),
  submitBtn: document.getElementById("btnSubmitForm"),
  submitText: document.getElementById("submitText"),
  submitSpinner: document.getElementById("submitSpinner"),
  submitIcon: document.getElementById("submitIcon"),
  resetBtn: document.getElementById("btnResetForm"),
  demoBtn: document.getElementById("btnFillDemo"),
  detectGpsBtn: document.getElementById("btnDetectGps"),
  gpsHint: document.getElementById("gpsHint"),
  
  // File Upload
  fileInput: document.getElementById("visitingCardFile"),
  uploadZone: document.getElementById("fileUploadZone"),
  uploadPlaceholder: document.getElementById("uploadPlaceholder"),
  filePreviewCard: document.getElementById("filePreviewCard"),
  previewFileName: document.getElementById("previewFileName"),
  previewFileSize: document.getElementById("previewFileSize"),
  fileThumbnail: document.getElementById("fileThumbnail"),
  removeFileBtn: document.getElementById("btnRemoveFile"),

  // Header & Status
  networkStatus: document.getElementById("networkStatus"),
  networkStatusText: document.getElementById("networkStatusText"),
  executiveWelcomePill: document.getElementById("executiveWelcomePill"),
  executiveDisplayName: document.getElementById("executiveDisplayName"),
  historyCount: document.getElementById("historyCount"),

  // Modals
  successModal: document.getElementById("successModal"),
  closeSuccessModalBtn: document.getElementById("btnCloseSuccessModal"),
  errorModal: document.getElementById("errorModal"),
  closeErrorModalBtn: document.getElementById("btnCloseErrorModal"),
  retrySubmitBtn: document.getElementById("btnRetrySubmit"),
  errorModalSubtitle: document.getElementById("errorModalSubtitle"),
  errorModalMessage: document.getElementById("errorModalMessage"),
  historyModal: document.getElementById("historyModal"),
  openHistoryBtn: document.getElementById("btnOpenHistory"),
  closeHistoryBtn: document.getElementById("btnCloseHistoryModal"),
  footerCloseHistoryBtn: document.getElementById("btnFooterCloseHistory"),
  historyTableBody: document.getElementById("historyTableBody"),
  historySearchInput: document.getElementById("historySearchInput"),
  historyEmptyState: document.getElementById("historyEmptyState"),
  clearHistoryBtn: document.getElementById("btnClearHistory"),
  exportCsvBtn: document.getElementById("btnExportCsv"),
  settingsModal: document.getElementById("settingsModal"),
  openSettingsBtn: document.getElementById("btnOpenSettings"),
  closeSettingsBtn: document.getElementById("btnCloseSettingsModal"),
  settingApiUrl: document.getElementById("settingApiUrl"),
  saveApiUrlBtn: document.getElementById("btnSaveApiUrl"),
  resetApiUrlBtn: document.getElementById("btnResetApiUrl"),
  testApiBtn: document.getElementById("btnTestApiEndpoint"),
  endpointTestResult: document.getElementById("endpointTestResult"),
  toastContainer: document.getElementById("toastContainer"),

  // Summary Elements in Success Modal
  summaryCompany: document.getElementById("summaryCompany"),
  summaryDate: document.getElementById("summaryDate"),
  summaryExecutive: document.getElementById("summaryExecutive"),
  summaryFleet: document.getElementById("summaryFleet"),
  summaryTimestamp: document.getElementById("summaryTimestamp")
};

// =========================================================================
// 3. INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initDefaults();
  setupEventListeners();
  updateNetworkStatus();
  updateHistoryBadge();
});

/**
 * Configure default form values, restore saved executive name
 */
function initDefaults() {
  // 1. Set today's date in Visit Date
  const visitDateInput = document.getElementById("visitDate");
  if (visitDateInput && !visitDateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    visitDateInput.value = today;
  }

  // 2. Restore saved Executive Name
  const savedExecutive = localStorage.getItem(STORAGE_KEYS.EXECUTIVE_NAME);
  const savedPhone = localStorage.getItem(STORAGE_KEYS.EXECUTIVE_PHONE);

  if (savedExecutive) {
    const execInput = document.getElementById("executiveName");
    if (execInput) execInput.value = savedExecutive;
    elements.executiveDisplayName.textContent = savedExecutive;
    elements.executiveWelcomePill.style.display = "inline-flex";
  }

  if (savedPhone) {
    const phoneInput = document.getElementById("executiveContactNumber");
    if (phoneInput && !phoneInput.value) phoneInput.value = savedPhone;
  }

  // 3. Load active API endpoint
  elements.settingApiUrl.value = getActiveApiUrl();
}

/**
 * Gets the configured API URL (localStorage override or default)
 */
function getActiveApiUrl() {
  const customUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
  return (customUrl && customUrl.trim()) ? customUrl.trim() : DEFAULT_GOOGLE_APPS_SCRIPT_URL;
}

// =========================================================================
// 4. EVENT LISTENERS
// =========================================================================
function setupEventListeners() {
  // Form Submission
  elements.form.addEventListener("submit", handleFormSubmit);

  // Form Reset
  elements.resetBtn.addEventListener("click", handleFormReset);

  // Demo Fill
  elements.demoBtn.addEventListener("click", fillDemoData);

  // Geolocation
  elements.detectGpsBtn.addEventListener("click", detectGpsLocation);

  // File Upload Handlers
  elements.fileInput.addEventListener("change", handleFileSelect);
  elements.removeFileBtn.addEventListener("click", handleFileRemove);
  
  // Drag and drop for file
  elements.uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadZone.classList.add("dragover");
  });
  elements.uploadZone.addEventListener("dragleave", () => {
    elements.uploadZone.classList.remove("dragover");
  });
  elements.uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      elements.fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  // Real-time input validation cleanup
  elements.form.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => clearFieldError(field.id));
    field.addEventListener("change", () => clearFieldError(field.id));
  });

  // Modal Closures
  elements.closeSuccessModalBtn.addEventListener("click", () => closeModal(elements.successModal));
  elements.closeErrorModalBtn.addEventListener("click", () => closeModal(elements.errorModal));
  elements.retrySubmitBtn.addEventListener("click", () => {
    closeModal(elements.errorModal);
    if (state.lastSubmittedData) {
      dispatchSubmission(state.lastSubmittedData);
    }
  });

  // History Modal
  elements.openHistoryBtn.addEventListener("click", openHistoryModal);
  elements.closeHistoryBtn.addEventListener("click", () => closeModal(elements.historyModal));
  elements.footerCloseHistoryBtn.addEventListener("click", () => closeModal(elements.historyModal));
  elements.historySearchInput.addEventListener("input", filterHistoryRecords);
  elements.clearHistoryBtn.addEventListener("click", clearHistoryRecords);
  elements.exportCsvBtn.addEventListener("click", exportHistoryToCsv);

  // Settings Modal
  elements.openSettingsBtn.addEventListener("click", () => openModal(elements.settingsModal));
  elements.closeSettingsBtn.addEventListener("click", () => closeModal(elements.settingsModal));
  elements.saveApiUrlBtn.addEventListener("click", saveCustomApiUrl);
  elements.resetApiUrlBtn.addEventListener("click", resetDefaultApiUrl);
  elements.testApiBtn.addEventListener("click", testApiConnection);

  // Network Online/Offline
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  // Close modals on clicking outside or ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(elements.successModal);
      closeModal(elements.errorModal);
      closeModal(elements.historyModal);
      closeModal(elements.settingsModal);
    }
  });

  [elements.successModal, elements.errorModal, elements.historyModal, elements.settingsModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

// =========================================================================
// 5. CLIENT-SIDE VALIDATION
// =========================================================================

/**
 * Validates all form inputs and returns clean payload or null
 */
function validateForm() {
  let isValid = true;
  let firstInvalidElement = null;

  // Clear previous errors
  elements.form.querySelectorAll(".error-feedback").forEach(el => {
    el.textContent = "";
    el.classList.remove("active");
  });
  elements.form.querySelectorAll(".form-control").forEach(el => {
    el.classList.remove("is-invalid");
  });

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const markError = (id, message) => {
    isValid = false;
    const errorEl = document.getElementById(`error-${id}`);
    const inputEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("active");
    }
    if (inputEl) {
      inputEl.classList.add("is-invalid");
      if (!firstInvalidElement) firstInvalidElement = inputEl;
    }
  };

  // 1. Visit Date: Required, valid date format
  const visitDate = getVal("visitDate");
  if (!visitDate) {
    markError("visitDate", "Visit Date is mandatory.");
  }

  // 2. Field Executive Name: Required
  const executiveName = getVal("executiveName");
  if (!executiveName) {
    markError("executiveName", "Field Executive Name is mandatory.");
  } else if (executiveName.length < 2) {
    markError("executiveName", "Executive Name must be at least 2 characters.");
  }

  // 3. Executive Contact Number: Optional, 10-15 digits if present
  const executivePhone = getVal("executiveContactNumber");
  if (executivePhone && !isValidPhone(executivePhone)) {
    markError("executiveContactNumber", "Please enter a valid phone number (10-15 digits).");
  }

  // 4. Industry Name: Required
  const industryName = getVal("industryName");
  if (!industryName) {
    markError("industryName", "Industry / Company Name is mandatory.");
  }

  // 5. Industry Type: Required
  const industryType = getVal("industryType");
  if (!industryType) {
    markError("industryType", "Please select an Industry Sector.");
  }

  // 6. Contact Person Phone: Optional, valid if present
  const contactPersonNumber = getVal("contactPersonNumber");
  if (contactPersonNumber && !isValidPhone(contactPersonNumber)) {
    markError("contactPersonNumber", "Please enter a valid 10-15 digit phone number.");
  }

  // 7. WhatsApp Number: Optional, valid if present
  const whatsapp = getVal("whatsapp");
  if (whatsapp && !isValidPhone(whatsapp)) {
    markError("whatsapp", "Please enter a valid 10-15 digit WhatsApp number.");
  }

  // 8. Email: Optional, valid format if present
  const email = getVal("email");
  if (email && !isValidEmail(email)) {
    markError("email", "Please enter a valid email address (e.g. name@company.com).");
  }

  // 9. Website: Optional, basic URL check
  const website = getVal("website");
  if (website && !isValidUrl(website)) {
    markError("website", "Please enter a valid website URL (e.g. https://company.com).");
  }

  // 10. Trucks Per Day & Month: Must be non-negative numbers
  const trucksPerDay = getVal("trucksPerDay");
  if (trucksPerDay !== "" && (isNaN(trucksPerDay) || Number(trucksPerDay) < 0)) {
    markError("trucksPerDay", "Trucks per day must be a non-negative number.");
  }

  const trucksPerMonth = getVal("trucksPerMonth");
  if (trucksPerMonth !== "" && (isNaN(trucksPerMonth) || Number(trucksPerMonth) < 0)) {
    markError("trucksPerMonth", "Trucks per month must be a non-negative number.");
  }

  if (!isValid && firstInvalidElement) {
    firstInvalidElement.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidElement.focus();
    showToast("Please correct highlighted fields before submitting.", "error");
    return null;
  }

  // Construct complete payload matching Google Sheets columns
  const payload = {
    visitDate: visitDate,
    executiveName: executiveName,
    executiveContactNumber: executivePhone,
    city: getVal("city"),
    area: getVal("area"),
    gpsLocation: getVal("gpsLocation"),
    visitType: getVal("visitType"),
    industryName: industryName,
    industryType: industryType,
    companyAddress: getVal("companyAddress"),
    contactPerson: getVal("contactPerson"),
    designation: getVal("designation"),
    contactPersonNumber: contactPersonNumber,
    whatsapp: whatsapp,
    email: email,
    website: website,
    transportationRequirement: getVal("transportationRequirement"),
    transportationType: getVal("transportationType"),
    requirementFrequency: getVal("requirementFrequency"),
    trucksPerDay: trucksPerDay ? Number(trucksPerDay) : "",
    trucksPerMonth: trucksPerMonth ? Number(trucksPerMonth) : "",
    truckType: getVal("truckType"),
    vehicleBodyType: getVal("vehicleBodyType"),
    loadWeight: getVal("loadWeight"),
    loadingLocation: getVal("loadingLocation"),
    unloadingLocation: getVal("unloadingLocation"),
    routes: getVal("routes"),
    monthlyShipmentVolume: getVal("monthlyShipmentVolume"),
    currentTransporter: getVal("currentTransporter"),
    currentFreightRate: getVal("currentFreightRate"),
    expectedFreightRate: getVal("expectedFreightRate"),
    paymentTerms: getVal("paymentTerms"),
    transporterProblem: getVal("transporterProblem"),
    opportunityPotential: getVal("opportunityPotential"),
    status: "",
    nextFollowUpDate: "",
    followUpPerson: "",
    notes: "",
    additionalRemarks: getVal("additionalRemarks"),
    documentName: state.attachedFile ? state.attachedFile.name : "",
    documentNote: state.attachedFile ? `File attached: ${state.attachedFile.name} (${Math.round(state.attachedFile.size / 1024)} KB)` : "",
    fileBase64: state.attachedFileBase64 || "",
    fileName: state.attachedFile ? state.attachedFile.name : "",
    fileMimeType: state.attachedFile ? state.attachedFile.type : ""
  };

  return payload;
}

function clearFieldError(id) {
  const errorEl = document.getElementById(`error-${id}`);
  const inputEl = document.getElementById(id);
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("active");
  }
  if (inputEl) {
    inputEl.classList.remove("is-invalid");
  }
}

function isValidPhone(phone) {
  // Allows optional +, spaces, dashes, parentheses and 10 to 15 digits
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^(\+?\d{10,15})$/.test(cleaned);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  try {
    const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : "https://" + url;
    new URL(formatted);
    return true;
  } catch (e) {
    return false;
  }
}

// =========================================================================
// 6. FORM SUBMISSION & GOOGLE APPS SCRIPT INTEGRATION
// =========================================================================

async function handleFormSubmit(e) {
  e.preventDefault();

  if (state.isSubmitting) return;

  const payload = validateForm();
  if (!payload) return;

  // Persist Executive details in localStorage for future visits
  if (payload.executiveName) {
    localStorage.setItem(STORAGE_KEYS.EXECUTIVE_NAME, payload.executiveName);
    elements.executiveDisplayName.textContent = payload.executiveName;
    elements.executiveWelcomePill.style.display = "inline-flex";
  }
  if (payload.executiveContactNumber) {
    localStorage.setItem(STORAGE_KEYS.EXECUTIVE_PHONE, payload.executiveContactNumber);
  }

  state.lastSubmittedData = payload;
  await dispatchSubmission(payload);
}

/**
 * Dispatches payload to Google Apps Script Web App
 */
async function dispatchSubmission(payload) {
  setSubmittingState(true);
  const targetUrl = getActiveApiUrl();

  // Always save a local copy in device history first (guarantees zero data loss even if offline)
  saveLocalHistoryRecord(payload, false);

  try {
    // Check if the URL is still placeholder
    if (targetUrl.includes("YOUR_APPS_SCRIPT_ID")) {
      throw new Error("Google Apps Script Web App URL is not configured yet. Please configure the Web App URL in Settings.");
    }

    /**
     * Browser to Google Apps Script Web App:
     * Google Apps Script Web Apps handle cross-origin POST requests smoothly
     * when sent with Content-Type 'text/plain;charset=utf-8' or URL encoded payload,
     * avoiding CORS preflight redirects from failing in browser fetch.
     */
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch (parseErr) {
      // If response text is returned or opaque
      result = { status: response.ok ? "success" : "unknown" };
    }

    if (result && result.status === "error") {
      throw new Error(result.message || "Google Apps Script rejected the submission.");
    }

    // Mark as synced in local history
    markLastHistoryRecordSynced();

    // Show Success Modal
    showSuccessModal(payload, result && result.timestamp ? result.timestamp : new Date().toLocaleString());
    showToast("Visit successfully recorded to Google Sheet!", "success");

    // Reset the form fields while preserving executive details
    resetFormPreservingExecutive();

  } catch (error) {
    console.warn("Submission issue:", error);
    showErrorModal(error.message || "Could not complete network request to Google Apps Script.");
    showToast("Submission cached locally. Check Apps Script URL or network.", "warning");
  } finally {
    setSubmittingState(false);
  }
}

function setSubmittingState(submitting) {
  state.isSubmitting = submitting;
  elements.submitBtn.disabled = submitting;
  if (submitting) {
    elements.submitBtn.classList.add("submitting");
    elements.submitText.textContent = "Saving Opportunity...";
  } else {
    elements.submitBtn.classList.remove("submitting");
    elements.submitText.textContent = "Submit Opportunity";
  }
}

// =========================================================================
// 7. FORM RESET & HELPERS
// =========================================================================

function handleFormReset() {
  if (confirm("Are you sure you want to reset all form fields?")) {
    resetFormPreservingExecutive();
    showToast("Form fields reset to default.", "info");
  }
}

function resetFormPreservingExecutive() {
  const savedExecutive = localStorage.getItem(STORAGE_KEYS.EXECUTIVE_NAME) || "";
  const savedPhone = localStorage.getItem(STORAGE_KEYS.EXECUTIVE_PHONE) || "";

  elements.form.reset();
  handleFileRemove();

  // Restore today's date
  const visitDateInput = document.getElementById("visitDate");
  if (visitDateInput) {
    visitDateInput.value = new Date().toISOString().split("T")[0];
  }

  // Restore Executive
  if (savedExecutive) {
    const execInput = document.getElementById("executiveName");
    if (execInput) execInput.value = savedExecutive;
  }
  if (savedPhone) {
    const phoneInput = document.getElementById("executiveContactNumber");
    if (phoneInput) phoneInput.value = savedPhone;
  }

  // Clear any errors
  elements.form.querySelectorAll(".error-feedback").forEach(el => {
    el.textContent = "";
    el.classList.remove("active");
  });
  elements.form.querySelectorAll(".form-control").forEach(el => {
    el.classList.remove("is-invalid");
  });
}

// =========================================================================
// 8. GPS LOCATION AUTO-DETECT
// =========================================================================

function detectGpsLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", "error");
    return;
  }

  elements.detectGpsBtn.classList.add("locating");
  elements.gpsHint.textContent = "Acquiring GPS coordinates from device...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      elements.detectGpsBtn.classList.remove("locating");
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);
      const accuracy = Math.round(position.coords.accuracy);

      document.getElementById("gpsLocation").value = `${lat}, ${lng} (±${accuracy}m)`;
      elements.gpsHint.textContent = `Coordinates detected (Accuracy: ±${accuracy} meters)`;
      showToast(`GPS located: ${lat}, ${lng}`, "success");
    },
    (error) => {
      elements.detectGpsBtn.classList.remove("locating");
      let msg = "Could not fetch GPS coordinates.";
      if (error.code === error.PERMISSION_DENIED) {
        msg = "Location permission denied. Please allow location access.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = "Location information is unavailable.";
      } else if (error.code === error.TIMEOUT) {
        msg = "Location request timed out. Please retry.";
      }
      elements.gpsHint.textContent = msg;
      showToast(msg, "warning");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// =========================================================================
// 9. FILE UPLOAD & VISITING CARD PREVIEW
// =========================================================================

function handleFileSelect() {
  const file = elements.fileInput.files[0];
  if (!file) return;

  // Max 2MB limit check
  if (file.size > 2 * 1024 * 1024) {
    showToast("File size exceeds 2MB limit. Please upload a smaller photo.", "error");
    elements.fileInput.value = "";
    return;
  }

  state.attachedFile = file;
  elements.previewFileName.textContent = file.name;
  elements.previewFileSize.textContent = `${Math.round(file.size / 1024)} KB`;

  // Read file as base64 for upload to Google Drive
  const reader = new FileReader();
  reader.onload = (e) => {
    state.attachedFileBase64 = e.target.result;
    if (file.type.startsWith("image/")) {
      elements.fileThumbnail.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    } else {
      elements.fileThumbnail.innerHTML = `<i class="fa-solid fa-file-pdf"></i>`;
    }
  };
  reader.readAsDataURL(file);

  elements.uploadPlaceholder.style.display = "none";
  elements.filePreviewCard.style.display = "flex";
}

function handleFileRemove(e) {
  if (e) e.stopPropagation();
  elements.fileInput.value = "";
  state.attachedFile = null;
  state.attachedFileBase64 = null;
  elements.filePreviewCard.style.display = "none";
  elements.uploadPlaceholder.style.display = "flex";
  elements.fileThumbnail.innerHTML = `<i class="fa-solid fa-file-image"></i>`;
}

// =========================================================================
// 10. LOCAL STORAGE VISITS HISTORY & CSV EXPORT
// =========================================================================

function saveLocalHistoryRecord(payload, synced) {
  try {
    const records = getStoredHistory();
    const newRecord = {
      id: "LOG-" + Date.now(),
      timestamp: new Date().toLocaleString(),
      date: payload.visitDate,
      company: payload.industryName,
      city: payload.city || "-",
      executive: payload.executiveName,
      fleet: payload.truckType ? `${payload.truckType} (${payload.vehicleBodyType || "Any"})` : "Trucks Required",
      status: payload.status,
      potential: payload.opportunityPotential,
      synced: synced,
      fullPayload: payload
    };
    records.unshift(newRecord);

    // Keep last 100 entries
    if (records.length > 100) records.pop();

    localStorage.setItem(STORAGE_KEYS.VISIT_HISTORY, JSON.stringify(records));
    updateHistoryBadge();
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

function markLastHistoryRecordSynced() {
  try {
    const records = getStoredHistory();
    if (records.length > 0) {
      records[0].synced = true;
      localStorage.setItem(STORAGE_KEYS.VISIT_HISTORY, JSON.stringify(records));
      updateHistoryBadge();
    }
  } catch (err) {
    console.error(err);
  }
}

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VISIT_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function updateHistoryBadge() {
  const records = getStoredHistory();
  if (elements.historyCount) {
    elements.historyCount.textContent = records.length;
  }
}

function openHistoryModal() {
  renderHistoryTable(getStoredHistory());
  openModal(elements.historyModal);
}

function renderHistoryTable(records) {
  elements.historyTableBody.innerHTML = "";

  if (!records || records.length === 0) {
    elements.historyEmptyState.style.display = "block";
    return;
  }
  elements.historyEmptyState.style.display = "none";

  records.forEach(rec => {
    const tr = document.createElement("tr");
    const syncBadge = rec.synced
      ? `<span style="color: var(--color-success); font-weight: 700;"><i class="fa-solid fa-cloud-check"></i> Synced</span>`
      : `<span style="color: var(--color-accent-amber); font-weight: 700;"><i class="fa-solid fa-clock"></i> Cached</span>`;

    tr.innerHTML = `
      <td>${escapeHtml(rec.date)}</td>
      <td><strong>${escapeHtml(rec.company)}</strong></td>
      <td>${escapeHtml(rec.city)}</td>
      <td>${escapeHtml(rec.fleet)}</td>
      <td>${escapeHtml(rec.potential || "-")}</td>
      <td>${syncBadge}</td>
    `;
    elements.historyTableBody.appendChild(tr);
  });
}

function filterHistoryRecords() {
  const query = elements.historySearchInput.value.toLowerCase().trim();
  const records = getStoredHistory();

  if (!query) {
    renderHistoryTable(records);
    return;
  }

  const filtered = records.filter(r => 
    (r.company && r.company.toLowerCase().includes(query)) ||
    (r.city && r.city.toLowerCase().includes(query)) ||
    (r.executive && r.executive.toLowerCase().includes(query)) ||
    (r.date && r.date.includes(query))
  );

  renderHistoryTable(filtered);
}

function clearHistoryRecords() {
  if (confirm("Are you sure you want to clear locally cached visit logs from this device?")) {
    localStorage.removeItem(STORAGE_KEYS.VISIT_HISTORY);
    renderHistoryTable([]);
    updateHistoryBadge();
    showToast("Local visit history cleared.", "info");
  }
}

function exportHistoryToCsv() {
  const records = getStoredHistory();
  if (!records || records.length === 0) {
    showToast("No records available to export.", "warning");
    return;
  }

  const csvRows = [];
  const headers = [
    "Timestamp", "Visit Date", "Executive Name", "City", "Industry Name", 
    "Truck Type", "Opportunity Potential", "Synced"
  ];
  csvRows.push(headers.join(","));

  records.forEach(r => {
    const p = r.fullPayload || {};
    const row = [
      `"${r.timestamp || ""}"`,
      `"${r.date || ""}"`,
      `"${p.executiveName || r.executive || ""}"`,
      `"${p.city || r.city || ""}"`,
      `"${(r.company || "").replace(/"/g, '""')}"`,
      `"${p.truckType || ""}"`,
      `"${r.potential || ""}"`,
      `"${r.synced ? 'Yes' : 'No'}"`
    ];
    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Logistics_Visits_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV file exported successfully.", "success");
}

// =========================================================================
// 11. DEMO DATA GENERATOR (Rapid Testing)
// =========================================================================

function fillDemoData() {
  const sampleIndustries = [
    { name: "Supreme Auto Parts Pvt Ltd", sector: "Automobile", person: "Sunil Verma", desig: "Dispatch Head", phone: "9823412345", city: "Pune", area: "Chakan MIDC Phase 2" },
    { name: "Gujarat Petrochemicals Ltd", sector: "Chemical", person: "Amitabh Shah", desig: "Logistics Manager", phone: "9879154321", city: "Ahmedabad", area: "Sanand GIDC" },
    { name: "Everest Steel Pipes Corp", sector: "Steel", person: "Vikas Singhal", desig: "Supply Chain Lead", phone: "9810234567", city: "Faridabad", area: "Sector 24 Industrial Area" }
  ];

  const pick = sampleIndustries[Math.floor(Math.random() * sampleIndustries.length)];

  document.getElementById("visitDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("executiveName").value = "Rahul Sharma";
  document.getElementById("executiveContactNumber").value = "9876501234";
  document.getElementById("city").value = pick.city;
  document.getElementById("area").value = pick.area;
  document.getElementById("gpsLocation").value = "18.7521, 73.8052 (Demo GPS)";
  document.getElementById("visitType").value = "First Visit";

  document.getElementById("industryName").value = pick.name;
  document.getElementById("industryType").value = pick.sector;
  document.getElementById("companyAddress").value = `Plot No. 42-B, ${pick.area}, Near Main Highway, ${pick.city}`;
  document.getElementById("contactPerson").value = pick.person;
  document.getElementById("designation").value = pick.desig;
  document.getElementById("contactPersonNumber").value = pick.phone;
  document.getElementById("whatsapp").value = pick.phone;
  document.getElementById("email").value = `logistics@${pick.name.toLowerCase().replace(/[^a-z]/g, "")}.com`;
  document.getElementById("website").value = "https://www.industrialhub-sample.com";

  document.getElementById("transportationRequirement").value = "Yes";
  document.getElementById("transportationType").value = "Outbound";
  document.getElementById("requirementFrequency").value = "Daily";
  document.getElementById("trucksPerDay").value = "4";
  document.getElementById("trucksPerMonth").value = "95";
  document.getElementById("truckType").value = "32 FT";
  document.getElementById("vehicleBodyType").value = "Container";
  document.getElementById("loadWeight").value = "18 Metric Tons";
  document.getElementById("loadingLocation").value = `${pick.city} Factory Plant 1`;
  document.getElementById("unloadingLocation").value = "Delhi NCR / Bhiwandi Central Hub";
  document.getElementById("routes").value = `${pick.city} -> Mumbai -> Delhi Golden Corridor`;
  document.getElementById("monthlyShipmentVolume").value = "1200 Metric Tons / 95 Loads";

  document.getElementById("currentTransporter").value = "VRL Logistics & Local Fleet";
  document.getElementById("currentFreightRate").value = "₹48,000 per 32FT Container";
  document.getElementById("expectedFreightRate").value = "₹45,500 per 32FT Container";
  document.getElementById("paymentTerms").value = "30 Days";
  document.getElementById("transporterProblem").value = "Vehicle Availability";
  document.getElementById("opportunityPotential").value = "High";
  document.getElementById("additionalRemarks").value = "Gate entry passes required for drivers with PUC and fitness certificates.";

  // Clear any existing error highlights
  elements.form.querySelectorAll(".error-feedback").forEach(el => el.classList.remove("active"));
  elements.form.querySelectorAll(".form-control").forEach(el => el.classList.remove("is-invalid"));

  showToast("Demo logistics data filled into all form fields!", "info");
}

// =========================================================================
// 12. MODAL & SETTINGS MANAGEMENT
// =========================================================================

function openModal(modal) {
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showSuccessModal(payload, timestamp) {
  elements.summaryCompany.textContent = payload.industryName || "--";
  elements.summaryDate.textContent = payload.visitDate || "--";
  elements.summaryExecutive.textContent = payload.executiveName || "--";
  elements.summaryFleet.textContent = payload.truckType ? `${payload.truckType} (${payload.vehicleBodyType || "Any"})` : "Requirement Logged";
  elements.summaryTimestamp.textContent = timestamp || new Date().toLocaleTimeString();

  openModal(elements.successModal);
}

function showErrorModal(message) {
  elements.errorModalMessage.textContent = message;
  openModal(elements.errorModal);
}

function saveCustomApiUrl() {
  const url = elements.settingApiUrl.value.trim();
  if (!url) {
    showToast("Please enter a valid Google Apps Script Web App URL.", "error");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.API_URL, url);
  showToast("Google Apps Script Web App URL saved successfully!", "success");
  closeModal(elements.settingsModal);
}

function resetDefaultApiUrl() {
  localStorage.removeItem(STORAGE_KEYS.API_URL);
  elements.settingApiUrl.value = DEFAULT_GOOGLE_APPS_SCRIPT_URL;
  showToast("Reset to default URL defined in script.js.", "info");
}

async function testApiConnection() {
  const url = elements.settingApiUrl.value.trim();
  if (!url || url.includes("YOUR_APPS_SCRIPT_ID")) {
    elements.endpointTestResult.textContent = "Please provide your actual deployed script URL.";
    elements.endpointTestResult.className = "endpoint-test-badge error";
    return;
  }

  elements.endpointTestResult.textContent = "Pinging Web App...";
  elements.endpointTestResult.className = "endpoint-test-badge";

  try {
    const res = await fetch(url + "?ping=1", { method: "GET" });
    if (res.ok) {
      elements.endpointTestResult.textContent = "✓ Connected Successfully!";
      elements.endpointTestResult.className = "endpoint-test-badge success";
    } else {
      elements.endpointTestResult.textContent = `Response status: ${res.status}`;
      elements.endpointTestResult.className = "endpoint-test-badge error";
    }
  } catch (err) {
    elements.endpointTestResult.textContent = "Network error / CORS check. Note: Google Apps Script Web App will accept form POST submissions.";
    elements.endpointTestResult.className = "endpoint-test-badge error";
  }
}

// =========================================================================
// 13. UI UTILITIES: TOAST & NETWORK MONITORING
// =========================================================================

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconClass = "fa-circle-info";
  if (type === "success") iconClass = "fa-circle-check";
  if (type === "error") iconClass = "fa-circle-exclamation";
  if (type === "warning") iconClass = "fa-triangle-exclamation";

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const dot = elements.networkStatus.querySelector(".status-dot");
  if (isOnline) {
    dot.className = "status-dot online";
    elements.networkStatusText.textContent = "Online";
  } else {
    dot.className = "status-dot offline";
    elements.networkStatusText.textContent = "Offline (Local Cache)";
    showToast("Device is offline. Submissions will be saved locally.", "warning");
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
