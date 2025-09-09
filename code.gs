// Code.gs
const SPREADSHEET_ID = '15Od3nCjaBp3JGbrrAqXyMwBOaXtU7zNUTn7KgPWVGcg'; // <-- UPDATED sheet id
const SHEET_NAME = 'Sheet1';

function doGet(e){
  // Serve index.html (the UI). Make sure filename below is exactly 'index'
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('8 Naturals Attendance')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// This function is called from the client using google.script.run
function processAttendance(payload){
  try{
    // payload: { employeeName, siteName, entryType, timestamp, location, photo }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

    const timestamp = payload.timestamp || new Date().toISOString();
    const name = payload.employeeName || '';
    const site = payload.siteName || '';
    const entryType = payload.entryType || '';
    const loc = payload.location || null;

    let lat = '', lon = '', acc = '';
    if(loc){
      lat = loc.lat || '';
      lon = loc.lon || '';
      acc = loc.accuracy || '';
    }

    let photoUrl = '';
    if(payload.photo){
      // Save photo dataURL to Drive
      const parts = payload.photo.split(',');
      if(parts.length >= 2){
        const meta = parts[0];
        const data = parts[1];
        const contentTypeMatch = meta.match(/data:(.*);base64/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
        const blob = Utilities.newBlob(Utilities.base64Decode(data), contentType, 'attendance_' + new Date().getTime() + '.jpg');

        const folderName = '8Naturals_Attendance_Photos';
        let folders = DriveApp.getFoldersByName(folderName);
        let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        const file = folder.createFile(blob);
        try{ file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }catch(e){ /* ignore permission errors */ }
        photoUrl = file.getUrl();
      }
    }

    // Append a row: Timestamp, Employee Name, Site Name, Entry Type, Latitude, Longitude, Accuracy, Photo URL
    const row = [timestamp, name, site, entryType, lat, lon, acc, photoUrl];
    sheet.appendRow(row);

    return { status: 'OK', message: 'Saved' };
  }catch(err){
    return { status: 'ERROR', message: err.toString() };
  }
}
