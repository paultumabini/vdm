const loadView = view => {
   // Load an HTML template file and return the evaluated HTML string.
   // This keeps the client-side view loader generic.
   const htmlServ = HtmlService.createTemplateFromFile(view);
   return htmlServ.evaluate().getContent();  
}


// Lightweight wrappers consumed by `main-js.html` dynamic view loader.
const loadhomeView = () => loadView('home-view');
const loadDashboardView = () => loadView('dashboard-view');
const loadAddEditView = () => loadView('model-trim-view');
const loadFeaturesDescriptionView = () => loadView('feat-descr-view');
const loadfailedImportView = () => loadView('failed-import-view');

