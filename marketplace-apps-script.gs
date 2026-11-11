const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1oRsi0zzlnds_xLIz2gYcxfA8seZsaWdQNrU2gQhxYRI/edit?usp=sharing';
const MARKETPLACE_SHEET_NAME = 'Marketplace';
const MARKETPLACE_IMAGE_FOLDER_NAME = 'KPAOS Marketplace Images';
const MARKETPLACE_HEADERS = [
  'id', 'title', 'price', 'category', 'description', 'condition', 'image',
  'sellerName', 'sellerClass', 'fb', 'ig', 'phone', 'status', 'submittedAt'
];
const MARKETPLACE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function doGet(e) {
  if (e && e.parameter && e.parameter.admin === '1') {
    return HtmlService.createHtmlOutputFromFile('MarketplaceAdmin')
      .setTitle('อนุมัติรายการตลาดนัด KPAOS');
  }
  try {
    if (e && e.parameter && e.parameter.action === 'checkSubmission') {
      const found = readAllMarketplaceItems().some(function (item) {
        return String(item.id) === String(e.parameter.id);
      });
      return outputResponse({
        status: found ? 'success' : 'error',
        found: found,
        message: found ? '' : 'ไม่พบรายการที่ส่งในระบบออนไลน์'
      }, e.parameter.callback);
    }
    const items = readMarketplaceItems().filter(function (item) {
      return item.status === 'approved';
    });
    return outputResponse({ status: 'success', items: items }, e && e.parameter && e.parameter.callback);
  } catch (error) {
    return outputResponse({ status: 'error', message: error.toString(), items: [] }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'marketplace') {
      return handleMarketplaceRequest(data);
    }

    const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getActiveSheet();
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString('th-TH'),
      data.ticketId,
      data.category,
      data.priority,
      data.subject,
      data.message,
      data.name || 'ไม่ระบุตัวตน',
      data.studentId || '-',
      'อยู่ระหว่างการพิจารณา'
    ]);

    return outputResponse({ status: 'success' });
  } catch (error) {
    return outputResponse({ status: 'error', message: error.toString() });
  }
}

function handleMarketplaceRequest(data) {
  const sheet = getMarketplaceSheet();
  if (data.action === 'submit') {
    const item = data.item;
    if (!item || !item.id || !item.title || !item.sellerName) {
      throw new Error('ข้อมูลประกาศขายไม่ครบถ้วน');
    }
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      if (existingIds.some(function (row) { return row[0] === String(item.id); })) {
        throw new Error('รายการนี้ถูกเผยแพร่แล้ว');
      }
    }
    item.image = saveMarketplaceImage(item.image, item.id);
    item.status = 'pending';
    const values = MARKETPLACE_HEADERS.map(function (key) {
      return item[key] === undefined || item[key] === null ? '' : item[key];
    });
    sheet.appendRow(values);
    return outputResponse({ status: 'success', id: item.id, itemStatus: item.status });
  }

  throw new Error('ไม่รู้จักคำสั่งตลาดนัด');
}

function getPendingMarketplaceItems(adminPin) {
  verifyMarketplaceAdminPin(adminPin);
  return readAllMarketplaceItems().filter(function (item) {
    return item.status === 'pending';
  });
}

function setMarketplaceItemStatus(id, status, adminPin) {
  verifyMarketplaceAdminPin(adminPin);
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('สถานะรายการไม่ถูกต้อง');
  }

  const sheet = getMarketplaceSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('ไม่พบรายการสินค้า');
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const rowIndex = ids.findIndex(function (row) {
    return row[0] === String(id);
  });
  if (rowIndex < 0) throw new Error('ไม่พบรายการสินค้านี้');
  sheet.getRange(rowIndex + 2, 13).setValue(status);
  return { status: 'success' };
}

function verifyMarketplaceAdminPin(adminPin) {
  const expectedPin = PropertiesService.getScriptProperties().getProperty('MARKETPLACE_ADMIN_PIN');
  if (!expectedPin || String(adminPin) !== expectedPin) {
    throw new Error('รหัสอนุมัติไม่ถูกต้อง หรือยังไม่ได้ตั้งค่า MARKETPLACE_ADMIN_PIN');
  }
}

function getMarketplaceSheet() {
  const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  let sheet = spreadsheet.getSheetByName(MARKETPLACE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(MARKETPLACE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(MARKETPLACE_HEADERS);
  }
  return sheet;
}

function readMarketplaceItems() {
  return readAllMarketplaceItems().filter(function (item) {
    return item.status === 'approved';
  });
}

function readAllMarketplaceItems() {
  const sheet = getMarketplaceSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, MARKETPLACE_HEADERS.length).getValues()
    .map(function (row) {
      const item = {};
      MARKETPLACE_HEADERS.forEach(function (key, index) {
        item[key] = row[index];
      });
      return item;
    });
}

function saveMarketplaceImage(dataUrl, itemId) {
  if (!dataUrl) return '';
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!match) throw new Error('ไฟล์รูปภาพไม่ถูกต้อง');

  const bytes = Utilities.base64Decode(match[2]);
  if (bytes.length > MARKETPLACE_MAX_IMAGE_BYTES) {
    throw new Error('รูปภาพมีขนาดใหญ่เกิน 5 MB');
  }

  const folders = DriveApp.getFoldersByName(MARKETPLACE_IMAGE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(MARKETPLACE_IMAGE_FOLDER_NAME);
  const mimeType = match[1].toLowerCase();
  const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
  const blob = Utilities.newBlob(bytes, mimeType, 'marketplace-' + itemId + '.' + extension);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function outputResponse(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      throw new Error('ชื่อ callback ไม่ถูกต้อง');
    }
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
