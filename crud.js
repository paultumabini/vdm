// @ts-nocheck

//get vehicle data
const getVehicleData = mk => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return { ws: ss.getSheetByName(mk) }
}

// Save new models
const saveNewModels = ({ modelIDs, year, make, models, radioYesNo, submittedBy, dateSubmitted, source}) => { 
  const { ws } = getVehicleData(make); 
  const idArr = [...modelIDs]
  const modelArr = [...models]

  const data = idArr.map((modelID, i) => [
    [modelID],
    [null],
    [year],
    [make],
    [modelArr[i].trim()],
    [null],
    [null],
    [null],
    [radioYesNo],
    [null],
    [null],
    [dateSubmitted],
    [submittedBy],    
    [null],
    [null],
    ['No'],
    [null],
    [null],
    [null],
    [source]
  ])
  ws.getRange(ws.getLastRow() + 1, 1, data.length, data[0].length).setValues(data)
}


// Create ids
const createId = (list, prefix) => { 
  const newID = !list || !list.length ? 1
    : +(list.reduce((a, b) => (/\d/.test(b) ? b = b.replace(/\D/g, '') : b = 0, a > +b ? a : b), 0)) + 1

  return `${prefix}-${newID}`.toUpperCase()
}


// Save new trims
const saveNewTrim = ({ modelID, year, make, models, trims , modelCodes, radioYesNo, packageCodes, submittedBy, dateSubmitted,source }) => {
  const { ws } = getVehicleData(make);
  const modeList = ws.getRange(2, 1, ws.getLastRow() - 1, 1).getValues().flat().filter(v => Boolean(v));
  const trimList = ws.getRange(2, 2, ws.getLastRow() - 1, 1).getValues().flat().filter(v => Boolean(v));
  const posIndex = modeList.indexOf(modelID)
  const rowIndex = posIndex === -1 ? 0 : posIndex + 2;   
  const countModelId = modeList.reduce((acc, val) => (acc[val] = acc[val] + 1 || 1, acc), {})[modelID]

   const newTrimsID = [];
   const existingTrimIDs = trimList;

   for (let i=0; i < trims.length; i++) {
     const returnedID = createId(existingTrimIDs, `${make.slice(0, 3)}-trm`)
     newTrimsID.push(returnedID)
     existingTrimIDs.push(returnedID)
   }
  

    ws.insertRowsAfter(rowIndex + countModelId - 1, trims.length)    

    const ids = newTrimsID.map(trimID => [
      [modelID],
      [trimID]
    ])

    const trimData = trims.map((trim, i) => [
      [year],
      [make],
      [models[0]],
      [trim.trim()],
      [modelCodes[i].trim()],
      [packageCodes[i].trim()],
      [radioYesNo],
      ['No'],
      ['No'],
      [dateSubmitted],
      [submittedBy],
      [null],
      [null],
      ['No'],
      [null],
      [null],
      [null],
      [source]
    ])
 
     ws.getRange(`A${rowIndex + countModelId}:B${rowIndex + countModelId + ids.length - 1}`).setValues(ids)
     ws.getRange(rowIndex + countModelId, 3, trimData.length, trimData[0].length).setValues(trimData)  
}

// save hotfeatures & description changes
const saveHotFeaturesDescriptionStat = (id,col,make,value,user,timestamp) => {
  const { ws } = getVehicleData(make);
  const position =  ws.getRange(2, 2, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === id)

  if(position === -1) return;

  const column = col.toLowerCase() ==='feat' ? 10 : 11;
  ws.getRange(position + 2, column,1,1).setValue(value);
  ws.getRange(position + 2, 14,1,2).setValues([[timestamp,user]]);
}

// save audited changes
const saveAuditedStatus = (id,make,value,user,timestamp,section) => {
  const { ws } = getVehicleData(make);
  const colID = section === 'modelSection' ? 1 : 2
  const position =  ws.getRange(2, colID, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === id)

  if(position === -1) return;

  const colStart = 16
  const colNums = 3
  ws.getRange(position + 2, colStart,1,colNums).setValues([[value,user,timestamp]]);
}

// save model & trim changes
const saveModelTrimChanges = data => {
  const { ws } = getVehicleData(data.make);
  const idCol =  data.column.toLowerCase() ==='model' ? 1 : 2;
  const idPos =  ws.getRange(2, idCol, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === data.id)

  if(idPos === -1) return;

  if (data.column.toLowerCase() ==='model') {
     ws.getRange(`E${idPos + 2}`).setValue(data.model);
     ws.getRange(`I${idPos + 2}`).setValue(data.addedToDB);
     ws.getRange(`N${idPos + 2}:O${idPos + 2}`).setValues([[data.timeStamp,data.user]])
     ws.getRange(`S${idPos + 2}`).setValue(data.note);
  } else {
     ws.getRange(idPos + 2, 6, 1, 6).setValues([[data.trim,data.modelCode,data.packageCode,data.addedToDB,data.hotFeatures,data.description]]);
     ws.getRange(`N${idPos + 2}:O${idPos + 2}`).setValues([[data.timeStamp,data.user]])
     ws.getRange(`S${idPos + 2}`).setValue(data.note);
  }
}

// delete model & trim 
const deleteModelTrimChanges = ({id,make,tableTitle:column}) => {
  const { ws } = getVehicleData(make.trim());
  const idCol =  column.trim().toLowerCase() ==='added models' ? 1 : 2;
  const idPos =  ws.getRange(2, idCol, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === id);  

  if(idPos === -1) return;

  ws.deleteRow(idPos + 2);
}

// save new username and email
const updateNewUsernameEmail = ({id, username, email}) => {
  const {credentials, ws} = getUserCredentials();
  // Locate login row by immutable user id.
  const idIndex = credentials.flatMap(v => v[0]).indexOf(id);   
  
  // Column B=username, D=email in login sheet.
  ws.getRange(`B${idIndex + 2}`).setValue(username)
  ws.getRange(`D${idIndex + 2}`).setValue(email)
  return {username, email}
}

// save password
const updatePassword = ({id, currentPassword, password}) => {
  const {credentials, ws} = getUserCredentials();
  // Find the user's login row once and reuse row index for all writes.
  const idIndex = credentials.flatMap(v => v[0]).indexOf(id);   
  if (idIndex === -1) return { status: 'invalid' };

  const row = credentials[idIndex];
  // Simple mode validation: compare against stored plain password.
  const isCurrentPasswordValid = getStoredPassword(row) === String(currentPassword || '');
  if (!isCurrentPasswordValid) return { status: 'invalid-current-password' };

  // Persist both values used by this simple mode:
  // - masked hint in column C
  // - actual password in column N
  persistPasswordSimple(ws, idIndex + 2, password);
  // Flush writes immediately to minimize chance of delayed updates.
  SpreadsheetApp.flush();
  return { status: 'ok', passwordHint: maskPasswordHint(password) };
}

//save selected notification
const selectedNotification = option => {
  const { credentials, ws } = getUserCredentials();
  const idIndex = credentials.flatMap(v => v[0]).indexOf(option.userId);

  if (option.optionId === 'preferred') {  
     // delete clock trigger first    
    const existingTriggers = ScriptApp.getProjectTriggers();
         if(existingTriggers?.length) existingTriggers.forEach(t =>  ScriptApp.deleteTrigger(t))
    // create new clock trigger
    const {time} = option.selectedDayTime;

    const triggerId = option.selectedDayTime.days.reduce((acc,day) => {
      acc.push (
        ScriptApp.newTrigger('notifyContentWriters')
        .timeBased()
        .atHour(time <= 12 ?  time + 12 : time - 12) //from EST      
        // .nearMinute(30)
        .onWeekDay(ScriptApp.WeekDay[day.toUpperCase()])      
        .create()
        .getUniqueId()
      )
      return acc
    },[]).join(',')

    ws.getRange(`J${idIndex + 2}:M${idIndex + 2}`).setValues([
        [
          option.optionId, 
          option.selectedDayTime.days.join(), 
          option.selectedDayTime.time, 
          triggerId
        ]
      ]);
    
    return { 
      type: option.optionId, 
      days: option.selectedDayTime.days, 
      time: option.selectedDayTime.time, 
      triggerId:triggerId.split(',')
      };

  } else {
    ws.getRange(`J${idIndex + 2}:M${idIndex + 2}`).setValues([[option.optionId, null, null, null]]);
    
    // delete existing matched  clock trigger 
     const existingTriggers = ScriptApp.getProjectTriggers();
     const passedTriggers = option.triggerClockId

      if(existingTriggers?.length) {
        existingTriggers.forEach(t1 =>  {
          passedTriggers.forEach(t2 => {
            if (t1.getUniqueId() === t2)  ScriptApp.deleteTrigger(t1)
          })         
        })    
      }

   return { type: option.optionId };
  }
};


// save Failed Import Data
function saveFailedImport(data) {
   const { ws } = getVehicleData('Failed Import'); 
    ws.appendRow([
      data.id,
      data.dealer_id,
      data.dealer_name,
      data.source_type,
      data.stock_number,
      data.year,
      data.make,
      data.model,
      data.trim,
      data.fail_reason,
      data.status,
      data.date_added,
      data.added_by,
      null,
      null,
      data.audited,
      null,
      null,    
      data.note,
    ]);
}

// save Failed Import Data
const saveFailedImportChanges = ({id, data}) => { 
  const { ws } = getVehicleData('Failed Import'); 
  const idPos =  ws.getRange(2, 1, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === id); 
 
  ws.getRange(idPos + 2, 2, 1, 14)
  .setValues([
    [
      data.dealer_id,
      data.dealer_name,
      data.source_type,
      data.stock_number,
      data.year,
      data.make,
      data.model,
      data.trim,
      data.fail_reason,
      data.status,
      data.date_added,
      data.added_by,
      data.date_edited,
      data.edited_by,
    ]
  ]);

  ws.getRange(`S${idPos + 2}:T${idPos + 2}`).setValues([[data.note,data.solution]])

}

// delete Failed Import Data
const deleteFailedImport = ({id,tab}) => {
  const { ws } = getVehicleData(tab); 
  const idPos =  ws.getRange(2, 1, ws.getLastRow(), 1).getValues().flat().findIndex(v => v === id);  

  if(idPos === -1) return;

  ws.deleteRow(idPos + 2);
}


function testerFunction() {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getTriggerSource() == ScriptApp.TriggerSource.CLOCK) {
        ScriptApp.deleteTrigger(triggers[i])  
      }
    }
 }


const saveNewName = ({newName}) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName("References");
  const numberOfNames =  ws.getRange(2, 3, ws.getLastRow(), 1).getValues().flat().filter(r => Boolean(r)).length;
  
  ws.getRange(`C${numberOfNames + 2}`).setValue(newName)
}






