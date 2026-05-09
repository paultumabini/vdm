function notifyContentWriters(e) {
  // Trigger id tells us which scheduled trigger fired this execution.
  const triggerUid = e.triggerUid
  const {data, ws} = getContentWriters(); 
  const htmltemplate = HtmlService.createTemplateFromFile('notify-template');
  // Notify only units that still need hot features/description completion.
  const filteredFeaturesDescription = allVehicleData()
  .filter(({trim_id,hot_features,description}) => trim_id && (hot_features  === 'No' || description === 'No'))  

  // Nothing pending, no email needed.
  if(!filteredFeaturesDescription || !filteredFeaturesDescription.length) return  

  // Sort oldest to newest so recipients see backlog in entry order.
  htmltemplate.vehicleData = filteredFeaturesDescription.sort((a,b) => a.date_added > b.date_added ? 1 : -1);

  // Persist latest trigger id for traceability/debugging.
  ws.getRange(`N3`).setValue(triggerUid) 

  data.forEach(([name,email,notification,triggerId])=>{
    const title =`[VDM-AIM] ${filteredFeaturesDescription.length} units added into AIM`

    // Preferred schedule users receive messages only for their selected trigger.
    if(notification ==='preferred' && triggerId.includes(triggerUid)) {
      //render to template
      htmltemplate.recipientName = name.replace(/\b(\w)/g, c => c.toUpperCase());  
      //send email   
      GmailApp.sendEmail(
        [email],
        title,
        '',    
        {
          htmlBody: htmltemplate.evaluate().getContent(),       
          noReply: false,
          cc:'paul@aimexperts.com',
          replyTo:'paul@aimexperts.com' 
        }
      );  
     } 
  })  
}


function immediateContentNotification() {
  const {data, ws} = getContentWriters(); 
  const htmltemplate = HtmlService.createTemplateFromFile('notify-template');
  // Immediate mode sends right away for all pending units.
  const filteredFeaturesDescription = allVehicleData()
  .filter(({trim_id,hot_features,description}) => trim_id && (hot_features  === 'No' || description === 'No')) 

  const userEmail = []; 

  // Guard clause prevents blank campaign emails.
  if(!filteredFeaturesDescription || !filteredFeaturesDescription.length) return  

  htmltemplate.vehicleData = filteredFeaturesDescription.sort((a,b) => a.date_added > b.date_added ? 1 : -1);


  data.forEach(([name,email,notification])=>{
    const title =`[VDM-AIM] ${filteredFeaturesDescription.length} units added into AIM`

    // Immediate mode users opt into on-demand sends.
    if(notification ==='immediate') {
      userEmail.push(name);
      //render to template
      htmltemplate.recipientName = name.replace(/\b(\w)/g, c => c.toUpperCase());  
      //send email   
      GmailApp.sendEmail(
        [email],
        title,
        '',    
        {
          htmlBody: htmltemplate.evaluate().getContent(),       
          noReply: false,
          cc:'paul@aimexperts.com',
          replyTo:'paul@aimexperts.com' 
        }
      );        
     }    
  })

  // Explicitly report when notification is globally disabled.
  if(data.every(([,,notification])=> notification ==='disabled')) userEmail.push('none')

  // De-duplicate user names in the response payload.
  return [...new Set(userEmail)];  
}