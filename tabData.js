const getReferenceData = () => {
  // References tab provides year/make/dealer metadata used by UI dropdowns.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('References');
  return ws.getRange(2, 1, ws.getLastRow() - 1, ws.getLastColumn()).getValues();
}


// array of objects
const arrayOfObjects = (headArr, allDataArr) => {
  // Convert row arrays into objects keyed by header names.
  // Date objects are normalized into a consistent string format for client-side rendering.
    return allDataArr.reduce((acc,cur) => {  
    const obj = {}  
      headArr.forEach((make,i) => {     
      obj[make] = typeof cur[i] ==='object'
      ? `${cur[i].getFullYear()}-${`${cur[i].getMonth() + 1}`.padStart(2, '0')}-${`${cur[i].getDate()}`.padStart(2,'0')} ${cur[i].toLocaleTimeString('en-US', { hour12: false })}`
      : cur[i]
   })
      acc.push(obj)
    return acc
  },[])
}


const allVehicleData = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabNames = ss.getSheets().map(s => s.getSheetName());
  // Last tab currently contains header structure reused for all vehicle tabs.
  const ws = ss.getSheetByName(tabNames[tabNames.length -1 ])  
  const header = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues().flat()

  // remove tabs that are not mfg:
  Array.from({length:3},(_,i) => tabNames.shift());
 
  const vehicleData = tabNames.flatMap(tab => {    
    const ws = ss.getSheetByName(tab)
    // Skip fully empty rows so table rendering and stats stay accurate.
    return ws.getRange(2, 1, ws.getLastRow(),ws.getLastColumn()).getValues().filter(rows => rows.some(val => val !== ''));
  }) 
  return (arrayOfObjects(header, vehicleData)); 
}


const failedImportData = () => {
  // Build object records for Failed Import tab used by failed-import UI modules.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('Failed Import');  
  const header = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues().flat()    
  const data =  ws.getRange(2, 1, ws.getLastRow(),ws.getLastColumn()).getValues().filter(rows => rows.some(val => val !== ''));
  const objData = (arrayOfObjects(header, data)); 
  return objData;
}



const getContentWriters = () => {
 // Build recipient config payload from login credentials rows.
 const {credentials, ws} = getUserCredentials();
  const data = credentials
  .filter(([name,,email]) => Boolean(name) || Boolean(email))
  .map(([,name,,email,,,,,,notification,,,triggerID]) => [name,email,notification,triggerID.split(',')])
  return {data, ws}
}


const createTabs = () => {
  // Utility helper for setup: freezes/unfreezes and verifies manufacturer tabs.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mfg = getReferenceData().map(([_,m]) => m);
  mfg.forEach(m => {
    // ss.insertSheet(m);
    ws = ss.getSheetByName(m);
   const range = ws.getDataRange().getValues().length;
    ws.setFrozenRows(0);
  })
}



