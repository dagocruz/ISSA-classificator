const electron = require('electron');
const spawn = require('child_process').spawn;
const path = require('path')
const url = require('url')
var fs = require('fs');
var csvWriter = require('csv-write-stream')

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
var coordenadas = [];

/*
 * Start the recording process
 */

const separatedProcess = spawn(process.execPath, ['./recordings.js', 10000, 'sp'], {stdio: [0, 1, 2, 'ipc']});
const postfilteredProcess = spawn(process.execPath, ['./recordings.js', 10010, 'pf'], {stdio: [0, 1, 2, 'ipc']});

exports.quit = function quit() {
    separatedProcess.kill();
    postfilteredProcess.kill();
}



/* 
* Creaci'on de la ventana para la gabaci'on de audios para ISSA
*/

let recordingISSAWindow;

function createWindowISSA(){
    if(recordingISSAWindow != null)
        recordingISSAWindow.show();

    else{
        recordingISSAWindow = new BrowserWindow({
            width: 900, height: 700,
            webPreferences: {
                nodeIntegration : true
            },
            show:false
        });

        recordingISSAWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'views/recordingISSA.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Emitted when the window is closed.
        recordingISSAWindow.on('closed', function () {
            if(separatedProcess.connected)
                separatedProcess.send({event:'stop-recording'});
            recordingISSAWindow = null;
        });

        recordingISSAWindow.on('ready-to-show', function() {
            recordingISSAWindow.show()

        });

        //recordingISSAWindow.webContents.openDevTools()
    }
};


ipcMain.on('open-recordings-ISSA',createWindowISSA);

/* 
* Pasar los comandos desde el main process y el recording ISSA process
*/

// Recibe datos desde el live al record ISSA window

/*
 * Manage the recordings window
 */

let recordingsWindow;

function createWindow () {

    if(recordingsWindow != null) {
        recordingsWindow.show();
    }

    else {
        recordingsWindow = new BrowserWindow({
            width: 900, height: 700,
            webPreferences: {
                nodeIntegration : true
            },
            show:false
        });
        
        recordingsWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'views/recordings.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Emitted when the window is closed.
        recordingsWindow.on('closed', function () {
            if(separatedProcess.connected)
                separatedProcess.send({event:'stop-recording'});
            recordingsWindow = null;
        });

        recordingsWindow.on('ready-to-show', function() {
            recordingsWindow.show()
        });
    }
}

ipcMain.on('open-recordings-window', createWindow);

/*
 * Pass commands between main process and recording process
 */

// Receive from live and record window
ipcMain.on('available-to-record', (event, index, id, available) =>{
    //console.log('available-to-record',available);
    if(recordingISSAWindow != null)
        recordingISSAWindow.webContents.send('available-to-record',index,id,available);
});


ipcMain.on('new-recording', (event, index, id) => {
    console.log('record.js new-recording');
    coordenadas = [];
    if(separatedProcess.connected)
        separatedProcess.send({event:'new-recording', index:index, id:id});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'new-recording', index:index, id:id});
});

ipcMain.on('end-recording', (event, index) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'end-recording', index:index});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'end-recording', index:index});
});

ipcMain.on('start-recording', (event, workspace) => {
    console.log('record.js start-recording');
    if(separatedProcess.connected)
        separatedProcess.send({event:'start-recording', workspace:workspace});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'start-recording', workspace:workspace});
});

ipcMain.on('stop-recording', (event) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'stop-recording'});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'stop-recording'});
});


ipcMain.on('add-coor', (event,coor) =>{
    coordenadas.push(coor);
});

// Receive from record process

separatedProcess.on('message', m => {
    if(recordingISSAWindow != null) {
        switch(m.event) {
            case 'fuzzy-transcript':
                recordingISSAWindow.webContents.send('fuzzy-transcript', m.filename, m.data);
                break;

            case 'fuzzy-recording':
                recordingISSAWindow.webContents.send('fuzzy-recording', m.filename);
                break;

            case 'add-recording':
                var writerCSV = csvWriter({sendHeaders: false});
                writerCSV.pipe(fs.createWriteStream('data_sounds.csv', {flags: 'a'}))
                let x=0,y=0,z=0;
                if(coordenadas){
                    coordenadas.forEach(function(c){
                        x+=c.x;
                        y+=c.y;
                        z+=c.z;
                    });
                    x/=coordenadas.length;
                    y/=coordenadas.length;
                    z/=coordenadas.length;
                }
                writerCSV.write({name: m.filename, x: x, y: y, z:z});
                writerCSV.end();
                recordingISSAWindow.webContents.send('add-recording', m.filename);
                break;

            default:
                console.warn(`Unhandled recording process message ${m}`);
                break;
        }
    }
});

postfilteredProcess.on('message', m => {
    if(recordingISSAWindow != null) {
        switch(m.event) {
            case 'fuzzy-transcript':
                recordingISSAWindow.webContents.send('fuzzy-transcript', m.filename, m.data);
                break;

            case 'fuzzy-recording':
                recordingISSAWindow.webContents.send('fuzzy-recording', m.filename);
                break;

            case 'add-recording':
                var writerCSV = csvWriter({sendHeaders: false});
                writerCSV.pipe(fs.createWriteStream('data_sounds.csv', {flags: 'a'}))
                let x=0,y=0,z=0;
                if(coordenadas){
                    coordenadas.forEach(function(c){
                        x+=c.x;
                        y+=c.y;
                        z+=c.z;
                    });
                    x/=coordenadas.length;
                    y/=coordenadas.length;
                    z/=coordenadas.length;
                }
                writerCSV.write({name: m.filename, x: x, y: y, z:z});
                writerCSV.end();
                recordingISSAWindow.webContents.send('add-recording', m.filename);
                break;

            default:
                console.warn(`Unhandled recording process message ${m}`);
                break;
        }
    }
});
