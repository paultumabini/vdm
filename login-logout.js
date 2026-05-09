function getUserCredentials() {
  // Read all login rows once so auth operations can work in memory first,
  // then write back only the row(s) that changed.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('login');
  const credentials = ws.getRange(2, 1, ws.getLastRow()-1, ws.getLastColumn()).getValues()
  return {credentials, ws}
}

const AUTH_COL = Object.freeze({
  LEGACY_PASSWORD: 3,
  PASSWORD_PLAIN: 14,
});

function generateSecureToken() {
  // Create an unpredictable token for session use.
  // We combine multiple entropy sources, then hash to a fixed-length hex string.
  const seed = `${Utilities.getUuid()}:${Date.now()}:${Utilities.getUuid()}`;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed);
  return digest.map((b) => {
    const n = b < 0 ? b + 256 : b;
    return (`0${n.toString(16)}`).slice(-2);
  }).join('');
}

function maskPasswordHint(password) {
  // UI/admin hint only (not used for auth): first up-to-4 chars + "***".
  const value = String(password || '');
  if (!value) return '';
  const visible = value.slice(0, Math.min(4, value.length));
  return `${visible}***`;
}

function persistPasswordSimple(ws, rowNumber, password) {
  // Simple security mode requested:
  // - Column C stores a masked hint for readability
  // - Column N stores the real password used for authentication checks
  ws.getRange(rowNumber, AUTH_COL.LEGACY_PASSWORD).setValue(maskPasswordHint(password));
  ws.getRange(rowNumber, AUTH_COL.PASSWORD_PLAIN).setValue(String(password || ''));
}

function getStoredPassword(row) {
  // Current password source is column N.
  // Fallback to column C for older rows that predate this layout.
  const plainInN = String(row[AUTH_COL.PASSWORD_PLAIN - 1] || '');
  const valueInC = String(row[AUTH_COL.LEGACY_PASSWORD - 1] || '');
  return plainInN || valueInC;
}

const getPositionAndSetToken = (id,ids,ws) => {
  // Rotate the session token at login/logout/expiry.
  const position = ids.findIndex(i => i === id)
  const randToken = generateSecureToken();
  ws.getRange(`E${position + 2}:F${position + 2}`).setValues([[randToken, new Date()]]);
  return  { randToken, position };
}

const login = ({username, password, timeStamp}) => { 
  const {credentials, ws} = getUserCredentials();
  const ids = credentials.flatMap(v => v[0]);
  const usernames = credentials.flatMap(v => v[1]).indexOf(username);
  
  for (const [rowIndex, row] of credentials.entries()) {
    // Row schema (relevant fields): [id, username, ..., token, tokenCreated, ...]
    const id = row[0];
    const user = row[1];
    // Authenticate by matching username + stored password.
    if(user === username && getStoredPassword(row) === String(password || '')) {        
        const { randToken, position } = getPositionAndSetToken(id,ids,ws);
        // Save last login timestamp for profile display/audit.
        ws.getRange(`I${position + 2}`).setValue(timeStamp);
        // Backfill simple storage for older rows after successful login.
        persistPasswordSimple(ws, rowIndex + 2, password);
        
        return {
          view: ScriptApp.getService().getUrl()+`?view=main&auth_token=${randToken}`,
          user: id,
        }
      }     
   }

   if(usernames === -1) {
      return { view:'invalid' }
  }
  // Username exists but password mismatch.
  return { view:'invalid' };
}

const logout = ({id, authToken}) => {
  const {credentials, ws} = getUserCredentials();
  const ids = credentials.flatMap(v => v[0]); 
  const tokens = credentials.flatMap(v => v[4]);
  // Fallback path: if caller does not have user id, resolve by auth token.
  if (!id && authToken) {
    const tokenPosition = tokens.findIndex((t) => t === authToken);
    if (tokenPosition !== -1) {
      const rowId = credentials[tokenPosition][0];
      getPositionAndSetToken(rowId,ids,ws);
      return  ScriptApp.getService().getUrl()+`?view=logout`;
    }
  }
  
  // Standard path: invalidate token by known user id.
  for (const [uuid] of credentials) {
    if(id === uuid ) {
        getPositionAndSetToken(id,ids,ws);
        return  ScriptApp.getService().getUrl()+`?view=logout`;  
      }     
   }
  return ScriptApp.getService().getUrl()+`?view=logout`;
}

// session expiration check with token rotation on timeout.
const resetToken = tkn => {   
  const {credentials, ws} = getUserCredentials();
  const tokens = credentials.flatMap(v => v[4]);
  const currentDate = new Date();
  const toSeconds =1000;
  const toMinutes = 60
  const minsLimit = 60;  
  
  const session = {}
  
  for (const [,,,,token,tokenCreated] of credentials) {
    if(tkn === token ) {        
        // Convert elapsed milliseconds to minutes.
        const elapsedTime = (currentDate-tokenCreated)/toSeconds/toMinutes;
        if(elapsedTime >= minsLimit)  {
          // If expired, rotate token so the old one can no longer be reused.
          getPositionAndSetToken(token,tokens,ws);  
           session.isSessionExpired = true;     
        }                 
      }     
   }
   return session
}
