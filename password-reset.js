const passwordReset = ({email}) => { 
  const {credentials, ws} = getUserCredentials();  
  const emails = credentials.flatMap(v => v[3]).indexOf(email);
  
  for (const [id,user,pass,emyl] of credentials) {
    // Match user by email; current implementation only returns view/email payload.
    // (No tokenized reset workflow is implemented here yet.)
    if(emyl === email) {       
        return {
          view: ScriptApp.getService().getUrl()+`?view=login`,
          email: emyl
        }
      }     
   }

   // Explicit invalid response shape consumed by password-reset view.
   if(emails === -1) {
      return {
        view:'invalid'
     }
  } 
}
