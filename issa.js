const EventEmitter = require('events');
//const tjbot = require('tjbot');
const spawn = require('child_process').spawn;
var fs = require('fs');
var csvWriter = require('csv-write-stream')
const path = require('path')


var hardware = ['microphone', 'speaker'];

var configuration = {
    robot: {
        gender: 'female'
    },
    listen: {
        language: 'es-ES'
    },
    speak: {
        language: 'es-LA'
    }
};

var credentials = {
    speech_to_text: {
        username: 'ebe1dcc4-4714-4080-ac83-017c062b8755',
        password: 'sYMtWgxQ0V0X'
    },
    text_to_speech: {
        username: '06c03dd2-c5a7-435c-b0f8-37e3d504ceca',
        password: 'juab61RuvmcB'
    }
}


exports.ISSA = class ISSA extends EventEmitter{

  constructor(){
    super()
    //this.agent = new tjbot(hardware,configuration,credentials);
  }

  speak(message) {
    //return this.agent.speak(message);
  }

  extractFeatures(filename) {
    let extractApp = spawn('./extractFeatures', [filename, 'salida.txt']);

    extractApp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    extractApp.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    extractApp.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

  }

  classifyAudio(filename,x,y,z,testingWindow,fileNameTest){
    console.log('Run issa.classifyAudio: ',filename,x,y,z,fileNameTest);
    console.log('./classifier/classify_one_sound_with_location_Marcela.py','--input-file ',filename,'--xCoor ',x,'--yCoor ',y,'--zCoor ',z);
    
    let classifierApp = spawn('python3',['./classifier/classify_one_sound_with_location_Marcela.py','--input-file',filename,'--xCoor',x,'--yCoor',y,'--zCoor',z]);
    //let classifierApp = spawn('python3',['./classifier/black_box.py']);
    let _self = this;


    console.log(`Coordenadas: (${x},${y},${z})`);
    classifierApp.stdout.on('data', (data) => {
      /*_self.speak('Hola').then(function() {
          return _self.speak(data.toString());
      }).then(function () {
          console.log('termino de hablar');
      });*/
      console.log('Data: ',data.toString());
      testingWindow.webContents.send('testing-process', 'audio classifies as: '+data.toString());
      let now = new Date()

      let dateString = ""
      dateString += now.getFullYear() + "-"
      dateString += (now.getMonth()+1) + "-"
      dateString += now.getDate()

      let timeString = ""
      timeString += now.getHours() + "-"
      timeString += now.getMinutes() + "-"
      timeString += now.getSeconds() + "-"
      timeString += now.getMilliseconds()

      var writerCSV = csvWriter({sendHeaders: false});
      writerCSV.pipe(fs.createWriteStream(fileNameTest+'.csv', {flags: 'a'}));
      writerCSV.write({date: dateString, time:timeString, file:filename, x: x, y: y, z:z,predictedClass:data.toString()});
      writerCSV.end();


    });

    classifierApp.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    classifierApp.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}
