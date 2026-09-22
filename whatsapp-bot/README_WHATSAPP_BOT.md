# Automated WhatsApp Follow-up Bot (Free)

This tool automatically sends your **company's visiting card image + personalized follow-up message** to industrial clients directly from your **own WhatsApp phone number** for **100% free**.

It captures client mobile numbers automatically from your **Google Sheet** (or a local Excel file `leads.xlsx`).

---

## How It Works

1. **Captures Numbers**: Fetches client numbers, company names, and contact persons directly from your Google Sheet (or Excel sheet).
2. **Connects to your WhatsApp**: Uses WhatsApp Web authentication (you scan a QR code once on your phone; your login is saved securely on your PC).
3. **Sends Card + Message**: Attaches your `card.jpg` photo and sends it with a customized message addressing the contact person and company by name.
4. **Anti-Spam Safety**: Includes built-in human-like delays (8–15 seconds between messages) and tracks `sent_history.json` to prevent sending duplicate messages.
5. **Weekly Scheduling**: Can be scheduled to run every Monday (or any day) automatically using Windows Task Scheduler for free.

---

## 3-Minute Setup Guide

### Step 1: Place Your Visiting Card Image
Copy your visiting card photo into this `whatsapp-bot` folder and name it:
```text
card.jpg
```
*(Supports JPG, JPEG, or PNG formats)*.

---

### Step 2: Install Required Free Packages
Open your terminal (PowerShell or Command Prompt) and navigate to the `whatsapp-bot` folder:

```powershell
cd d:\phone_xls\whatsapp-bot
npm install
```

---

### Step 3: Run the Bot & Scan QR Code

Run the bot with:
```powershell
node send_followups.js
```

1. A **QR code** will appear directly in your terminal.
2. Open **WhatsApp** on your phone:
   - Go to **Settings** (or 3 dots in upper right) > **Linked Devices**.
   - Tap **Link a Device**.
   - Point your phone camera at the QR code in the terminal.
3. The bot will connect and say:  
   `✓ WhatsApp Authentication successful! Session saved.`
4. It will immediately fetch your clients from the Google Sheet and send your visiting card photo + message to each client automatically!

*(Note: You only need to scan the QR code once. Future runs will log in automatically without scanning again).*

---

### Step 4: Automate to Run Every Week (Windows Task Scheduler)

To make it run automatically every week without touching anything:

1. Press `Windows Key` and type **Task Scheduler**, then press Enter.
2. In the right sidebar, click **Create Basic Task...**
3. Set **Name**: `Weekly WhatsApp Followup` -> Click **Next**.
4. Set **Trigger**: Select **Weekly** -> Click **Next**.
5. Pick your schedule: e.g., **Every Monday at 10:00 AM** -> Click **Next**.
6. Set **Action**: Select **Start a program** -> Click **Next**.
7. In the program settings:
   - **Program/script**: `node`
   - **Add arguments**: `send_followups.js`
   - **Start in**: `d:\phone_xls\whatsapp-bot\`
8. Click **Next** -> Click **Finish**.

Now, every Monday at 10:00 AM, your computer will automatically open the bot and send your visiting card and follow-up message to all new clients for free!

---

## How to Customize the Message

Open [config.js](file:///d:/phone_xls/whatsapp-bot/config.js) to customize your message template:

```javascript
MESSAGE_TEMPLATE: `Hello {name} ji,

Greetings from our Logistics & Fleet Operations team!

Following up regarding your truck and transportation requirements for {company}.

Please find our visiting card attached for your reference. We specialize in {truckType} vehicle placements across your key corridors ({routes}) with dedicated tracking, fast placement, and competitive freight rates.

Feel free to contact us for your daily dispatches or upcoming shipments.

Best Regards,
Dispatch & Operations Team`
```

Available tags automatically replaced for each client:
- `{name}` — Contact Person Name
- `{company}` — Company / Industry Name
- `{truckType}` — Truck size required (e.g., 32 FT, Container)
- `{routes}` — Transportation corridor (e.g., Ahmedabad -> Mumbai)

---

## Using Local Excel Sheet (Optional)

If you ever want to send messages from a downloaded Excel sheet instead of Google Sheets:
1. Save your Excel file as **`leads.xlsx`** inside this `whatsapp-bot` folder.
2. The bot will automatically detect it and read numbers from columns named `WhatsApp`, `Contact Number`, `Phone`, or `Mobile`.
