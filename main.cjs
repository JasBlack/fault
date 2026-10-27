const {app,BrowserWindow,Menu}=require('electron');
const path=require('node:path');
function createWindow(){
 const win=new BrowserWindow({width:1360,height:980,minWidth:800,minHeight:650,backgroundColor:'#121314',title:'FAULT by JAS.BLACK',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.loadFile(path.join(__dirname,'FAULT.html'));
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event)=>event.preventDefault());
}
app.whenReady().then(()=>{Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'FAULT',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]},{role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}]));createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
