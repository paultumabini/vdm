const getActiveUser = (tkn) => {   
  const {credentials, ws} = getUserCredentials();
  // Find the currently authenticated user by matching session token from URL.
  const user = credentials.reduce((acc,[
    id,
    name,
    password,
    email,
    token,
    tokenCreated,
    isAuthorized,
    isRestricted,
    lastLoggedIn,
    notification,
    notificationDay,
    notificationTime,
    triggerClockId
    ]) => {
    if(token === tkn) acc = {
      id,
      name,
      email,
      isAuthorized,
      isRestricted,
      // Normalize to string for reliable front-end date formatting.
      lastLoggedIn:lastLoggedIn.toString(),
      notification,
      // CSV fields are expanded into arrays for UI multi-select usage.
      notificationDay:notificationDay.split(','),
      notificationTime,
      triggerClockId: triggerClockId.split(',')
      } 
    return acc;
  },{})

  return {...user}
}


function createUser() {
  const {credentials, ws} = getUserCredentials();
  const username = 'michelle' 
  const password = 'Password1'
  const id = Utilities.getUuid();

   // Minimal seed row used for manual testing.
   ws.appendRow([id, username,password])
}  
