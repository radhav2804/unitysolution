/**
 * =========================================================================
 * Automated WhatsApp Follow-up Bot
 * Sends Visiting Card Photo + Message to Clients from Google Sheet / Excel
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const xlsx = require('xlsx');
const config = require('./config');

const SENT_HISTORY_FILE = path.join(__dirname, 'sent_history.json');

// -------------------------------------------------------------------------
// Helper: Load or Initialize Sent History
// -------------------------------------------------------------------------
function getSentHistory() {
  if (fs.existsSync(SENT_HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SENT_HISTORY_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveSentHistory(phone, clientName, company) {
  const history = getSentHistory();
  history[phone] = {
    name: clientName,
    company: company,
    sentAt: new Date().toISOString()
  };
  fs.writeFileSync(SENT_HISTORY_FILE, JSON.stringify(history, null, 2));
}

// -------------------------------------------------------------------------
// Helper: Clean & Normalize Indian / International Phone Number
// -------------------------------------------------------------------------
function normalizePhoneNumber(rawNumber, defaultCountryCode = '91') {
  if (!rawNumber) return null;
  let digits = String(rawNumber).replace(/[^\d]/g, '');

  // Strip leading 0
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // 10 digits standard mobile -> prefix defaultCountryCode
  if (digits.length === 10) {
    digits = defaultCountryCode + digits;
  }

  // Ensure minimum valid international length
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}

// -------------------------------------------------------------------------
// 1. Fetch Clients from Google Sheet (via Apps Script Web App)
// -------------------------------------------------------------------------
async function fetchClientsFromGoogleSheet() {
  const url = config.GOOGLE_APPS_SCRIPT_URL + (config.GOOGLE_APPS_SCRIPT_URL.includes('?') ? '&' : '?') + 'action=getClients';
  console.log('📡 Fetching clients from Google Sheet...');

  try {
    const res = await fetch(url, { timeout: 15000 });
    const json = await res.json();

    if (json && json.status === 'success') {
      if (Array.isArray(json.clients)) {
        console.log(`✓ Retrieved ${json.clients.length} client record(s) from Google Sheet:`);
        json.clients.forEach((c) => {
          console.log(`   • [Row ${c.row}] ${c.company} | ${c.contactPerson} | Phone: ${c.phone} (Source: ${c.sourceField || 'Phone'})`);
        });
        return json.clients;
      } else {
        console.log('\n⚠️ Google Apps Script responded, but it returned the previous version of Code.gs.');
        console.log('👉 QUICK FIX (30 seconds):');
        console.log('   1. Open your Google Sheet -> Click Extensions -> Apps Script.');
        console.log('   2. Paste the updated Code.gs.');
        console.log('   3. Click "Deploy" -> "Manage deployments" -> Click the ✏️ (Pencil/Edit) icon.');
        console.log('   4. Set Version dropdown to "New version" -> Click "Deploy".\n');
      }
    } else if (json && json.status === 'error') {
      console.warn('⚠️ Google Sheet returned error:', json.message);
    }
  } catch (err) {
    console.warn('⚠️ Could not connect to Google Sheet Web App:', err.message);
  }
  return null;
}

// -------------------------------------------------------------------------
// 2. Fetch Clients from Local Excel file (leads.xlsx fallback)
// -------------------------------------------------------------------------
function fetchClientsFromLocalExcel() {
  let filePath = path.resolve(__dirname, config.LOCAL_EXCEL_FILE);
  if (!fs.existsSync(filePath)) {
    // Check if any .xlsx or .xls file exists in current folder
    const currentFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    if (currentFiles.length > 0) {
      filePath = path.join(__dirname, currentFiles[0]);
    } else {
      // Check parent directory d:\phone_xls
      const parentDir = path.resolve(__dirname, '..');
      const parentFiles = fs.readdirSync(parentDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
      if (parentFiles.length > 0) {
        filePath = path.join(parentDir, parentFiles[0]);
      } else {
        return null;
      }
    }
  }

  console.log(`📁 Reading client data from Excel file: ${path.basename(filePath)}`);
  try {
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

    const clients = [];
    rows.forEach((row, index) => {
      // Find mobile / whatsapp column flexibly
      const phone = row['WhatsApp'] || row['WhatsApp Number'] || row['Contact Number'] || row['Phone'] || row['Mobile'] || row['Mobile Number'];
      const company = row['Industry Name'] || row['Company Name'] || row['Company'] || 'Industry Partner';
      const contactPerson = row['Contact Person'] || row['Contact Name'] || row['Name'] || 'Sir/Madam';
      const truckType = row['Truck Type'] || row['Vehicle Type'] || 'All Truck Sizes';
      const routes = row['Routes'] || row['Transportation Routes'] || 'Key Corridors';

      if (phone) {
        clients.push({
          row: index + 2,
          company: String(company).trim(),
          contactPerson: String(contactPerson).trim(),
          phone: String(phone).trim(),
          truckType: String(truckType).trim(),
          routes: String(routes).trim()
        });
      }
    });

    console.log(`✓ Loaded ${clients.length} client record(s) from local Excel sheet.`);
    return clients;
  } catch (err) {
    console.error('Error reading local Excel:', err.message);
    return null;
  }
}

// -------------------------------------------------------------------------
// Helper: Random Delay between min & max (Anti-Spam Protection)
// -------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------------------
// MAIN RUNNER
// -------------------------------------------------------------------------
async function startBot() {
  console.log('========================================================');
  console.log('    Logistics Automated WhatsApp Follow-up System       ');
  console.log('========================================================\n');

  // 1. Verify Visiting Card Image Exists
  const cardPath = path.resolve(__dirname, config.VISITING_CARD_PATH);
  if (!fs.existsSync(cardPath)) {
    console.error(`❌ Visiting card image not found at: ${config.VISITING_CARD_PATH}`);
    console.error('👉 Please copy your visiting card photo (e.g. card.jpg) into this folder and run again.\n');
    process.exit(1);
  }
  console.log(`✓ Visiting card image loaded: ${config.VISITING_CARD_PATH}`);

  // 2. Fetch Client Numbers (Google Sheet or Excel)
  let clients = await fetchClientsFromGoogleSheet();
  if (!clients || clients.length === 0) {
    clients = fetchClientsFromLocalExcel();
  }

  if (!clients || clients.length === 0) {
    console.log('⚠️ No clients with phone numbers found in Google Sheet or Excel.');
    console.log('👉 Make sure your Google Sheet has records or place a leads.xlsx file in this folder.\n');
    process.exit(0);
  }

  // 3. Initialize WhatsApp Web Client
  console.log('\n🔄 Initializing WhatsApp Client (Connecting to WhatsApp Web)...');
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // Display QR Code on terminal if not logged in
  client.on('qr', (qr) => {
    console.log('\n========================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP PHONE:');
    console.log('   (WhatsApp > Settings > Linked Devices > Link a Device)');
    console.log('========================================================\n');
    qrcode.generate(qr, { small: true });
  });

  // Client Authenticated
  client.on('authenticated', () => {
    console.log('✓ WhatsApp Authentication successful! Session saved.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
  });

  // When Client is Ready
  client.on('ready', async () => {
    console.log('\n🎉 WhatsApp is Ready & Connected to your phone number!\n');

    const visitingCardMedia = MessageMedia.fromFilePath(cardPath);
    const sentHistory = getSentHistory();

    console.log(`🚀 Starting weekly follow-up batch to ${clients.length} contact(s)...\n`);
    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      const normalizedPhone = normalizePhoneNumber(c.phone, config.COUNTRY_CODE);

      if (!normalizedPhone) {
        console.log(`[${i + 1}/${clients.length}] ⚠️ Invalid phone format: "${c.phone}" for ${c.company}. Skipping.`);
        skippedCount++;
        continue;
      }

      // Check if already sent recently in history
      if (sentHistory[normalizedPhone]) {
        console.log(`[${i + 1}/${clients.length}] ℹ️ Already sent to ${c.contactPerson} (${normalizedPhone}) on ${sentHistory[normalizedPhone].sentAt}. Skipping.`);
        skippedCount++;
        continue;
      }

      const chatId = normalizedPhone + '@c.us';

      // Verify number is registered on WhatsApp
      try {
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
          console.log(`[${i + 1}/${clients.length}] ❌ ${normalizedPhone} is not registered on WhatsApp. Skipping.`);
          skippedCount++;
          continue;
        }
      } catch (err) {
        // If check times out, attempt sending anyway
      }

      // Personalize message
      const personalizedMessage = config.MESSAGE_TEMPLATE
        .replace(/{name}/g, c.contactPerson || 'Sir/Madam')
        .replace(/{company}/g, c.company || 'your esteemed company')
        .replace(/{truckType}/g, c.truckType || 'Open / Container / Trailer')
        .replace(/{routes}/g, c.routes || 'all major routes');

      console.log(`[${i + 1}/${clients.length}] 📤 Sending visiting card to: ${c.contactPerson} | ${c.company} (+${normalizedPhone})...`);

      try {
        // Send Visiting Card Image with Caption Message
        await client.sendMessage(chatId, visitingCardMedia, {
          caption: personalizedMessage
        });

        console.log(`   ✓ Message & card sent successfully to +${normalizedPhone}!`);
        saveSentHistory(normalizedPhone, c.contactPerson, c.company);
        successCount++;

        // Anti-spam safe delay before next message
        if (i < clients.length - 1) {
          const delay = getRandomDelay(config.DELAY_MIN_MS, config.DELAY_MAX_MS);
          console.log(`   ⏳ Pausing ${Math.round(delay / 1000)}s for safety before next message...\n`);
          await sleep(delay);
        }

      } catch (sendError) {
        console.error(`   ❌ Failed to send to +${normalizedPhone}:`, sendError.message);
        failCount++;
      }
    }

    console.log('\n========================================================');
    console.log('               BATCH SUMMARY REPORT                     ');
    console.log('========================================================');
    console.log(`✓ Successfully Sent : ${successCount}`);
    console.log(`ℹ️ Skipped / Existing: ${skippedCount}`);
    console.log(`❌ Failed           : ${failCount}`);
    console.log('========================================================\n');

    console.log('Follow-up task complete. Closing session.');
    setTimeout(() => {
      client.destroy();
      process.exit(0);
    }, 3000);
  });

  client.initialize();
}

startBot();
