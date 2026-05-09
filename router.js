const routes = {}

function doGet(e) { 
  // Read active auth tokens from login sheet (column E in current schema).
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('login');
  const tokens = ws.getRange(2, 1,  ws.getLastRow()-1, 5).getValues().flatMap(v => v[4])
  const isTokenExist = tokens.indexOf(e.parameter.auth_token);
  
  
  // Query `view` drives which page template should render.
  routes.qString = e.parameter.view;
  routes.view = function(view) {
    return HtmlService.createTemplateFromFile(view)  
    .evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
    
  routes.renderView = function() {
    // Rotate expired tokens before view routing.
    const {isSessionExpired} = resetToken(e.parameter.auth_token)
    
    if(isSessionExpired){
       return this.view('page-session-expired-view'); 
    }

    // Main view requires a valid token; other views are public.
    if (this.qString === 'main' && isTokenExist !== -1) { 
        return this.view('main-view');
    } else if (this.qString === 'login' || !e.queryString) {
        return this.view('login-view');
    } else if (this.qString === 'logout') {
        return this.view('logout-view');    
    } else if (this.qString === 'password-reset') {
        return this.view('password-reset-view');    
    } else {
        return this.view('page-error-view');
    }
  }
 
 return routes.renderView()  
}



function createMenu() {
  // Adds a lightweight Spreadsheet UI menu when file is opened in Sheets UI.
  const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu('Vehicle Dataset');
    menu.addItem('Open Web App','doNothingMenuAction');
    menu.addToUi();    
}
function doNothingMenuAction() {}
    
function onOpen(){
  createMenu();
}


// import css and js
function include(filename) {
  // Used by HTML templates to include partial files (style/script snippets).
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

