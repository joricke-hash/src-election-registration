/**
 * SRC Vote Registration Auto-Responder
 * ---------------------------------------------------
 * Watches a Gmail inbox for new registration emails, logs each unique
 * sender to a Google Sheet, and sends back a confirmation reply.
 *
 * SETUP:
 * 1. Create a new Google Sheet (this will hold your registration list).
 * 2. In that Sheet, go to Extensions > Apps Script.
 * 3. Delete any starter code and paste this whole script in.
 * 4. Update the CONFIG section below if you want a different subject
 *    line, label name, or reply text.
 * 5. In the Apps Script editor, select the "setup" function from the
 *    function dropdown at the top and click Run. The first run will
 *    ask you to authorize Gmail + Sheets access — allow it. This
 *    creates the Gmail label used to track processed emails and adds
 *    the header row to your Sheet.
 * 6. Click the clock icon (Triggers) on the left, then "Add Trigger":
 *      Function to run:      checkForNewRegistrations
 *      Event source:         Time-driven
 *      Type of time trigger: Minutes timer
 *      Interval:             Every 5 or 10 minutes
 *    Save.
 * 7. Done. Tell students to reply to this Gmail account with the
 *    subject line below to register. Each new one gets logged and
 *    auto-replied to; duplicates are skipped automatically.
 *
 * When registration closes: open the Sheet, download it as CSV
 * (File > Download > CSV), and upload that into TapVoter's voter
 * import wizard.
 */

const CONFIG = {
  // Only emails with this exact subject (not case sensitive) get processed.
  // Tell students to use this subject line when they email in to register.
  SUBJECT_KEYWORD: "SRC Vote Registration",

  // Name of the Gmail label used to mark processed threads, so a thread
  // is never logged or replied to twice even if it's checked again.
  PROCESSED_LABEL: "SRC-Vote-Processed",

  // Name of the Sheet tab where registrations are logged.
  SHEET_NAME: "Registrations",

  // Subject and body of the confirmation auto-reply students receive.
  REPLY_SUBJECT: "You're registered for the SRC vote",
  REPLY_BODY:
    "Thanks, you're registered for the SRC vote.\n\n" +
    "You'll receive your personal voting link by email once voting opens. " +
    "It can only be used once, so don't share it.\n\n" +
    "If you didn't request this, you can ignore this email.",
};

function setup() {
  if (!GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL)) {
    GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Name", "Email", "Timestamp"]);
  }
  Logger.log("Setup complete. Label and sheet header are ready.");
}

function checkForNewRegistrations() {
  const label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    throw new Error('Run "setup" once before adding the trigger.');
  }

  const query =
    'subject:"' + CONFIG.SUBJECT_KEYWORD + '" -label:"' + CONFIG.PROCESSED_LABEL + '"';
  const threads = GmailApp.search(query, 0, 50);

  if (threads.length === 0) return;

  const sheet = getSheet_();
  const existingEmails = getExistingEmails_(sheet);

  threads.forEach(function (thread) {
    const messages = thread.getMessages();
    const latest = messages[messages.length - 1];
    const senderEmail = extractEmail_(latest.getFrom());
    const senderName = extractName_(latest.getFrom());

    if (!existingEmails.has(senderEmail.toLowerCase())) {
      sheet.appendRow([senderName, senderEmail, new Date()]);
      existingEmails.add(senderEmail.toLowerCase());

      latest.reply(CONFIG.REPLY_BODY, {
        subject: CONFIG.REPLY_SUBJECT,
      });
    }

    thread.addLabel(label);
  });

  Logger.log("Processed " + threads.length + " thread(s).");
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  return sheet;
}

function getExistingEmails_(sheet) {
  const lastRow = sheet.getLastRow();
  const set = new Set();
  if (lastRow < 2) return set;
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  values.forEach(function (row) {
    if (row[0]) set.add(String(row[0]).toLowerCase());
  });
  return set;
}

function extractEmail_(fromHeader) {
  const match = fromHeader.match(/<(.+)>/);
  return match ? match[1] : fromHeader;
}

function extractName_(fromHeader) {
  const match = fromHeader.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : fromHeader;
}
