var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var net = require('net');
var io = require('socket.io')(http);
var config;
var parseString = require('xml2js').parseString;
const fs = require('fs');
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8001 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  console.log('Got connextion');
});

var digasPath;

fs.readFile('./static/config.json', function(err, data) {
	data = JSON.parse(data);
	config = data;
	digasPath = data.digasPath;
});

fs.appendFile('logg.csv', 'datetime;tid fra programstart;supertype;innhold\r\n', function(err) {

});


var publishDigas = true;
var nrkPlakatTime;

var tempTime;
var temps = {};
var tempsArray;
changeTemps = false; // Change template output

function mapTemps() {
	tempsArray = Object.keys(temps).map(function (key) { return temps[key]; });
	io.emit('temperatures', tempsArray);
	setTimeout(mapTemps, 1500);
}
mapTemps();

function logTemps() {
	if (!tempTime) {
		tempTime = new Date();
	}
	curTime = new Date();
	diff = parseInt((new Date() - tempTime)/1000);
	if (tempsArray[0]) {
		fs.appendFile('static/temps.csv', ''+diff+','+tempsArray[0]+"\n", function(err) {

		});
	} else {
		console.log("SHIT, no temp info! Not adding to csv.")
	}
	setTimeout(logTemps, 60000);
}



function loadCaspar() {
	var client = new net.Socket();
	client.connect(5250, '127.0.0.1', function() {
		client.write('PLAY 1-10 [HTML] "http://127.0.0.1:8000/viewer.html" CUT 1 Linear RIGHT\r\n');
	});
	client.on('error', function(err) {
		console.log("Could not connect to Caspar CG Server.");
	});	
}

setTimeout(loadCaspar, 8000);


String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function logg(supertype, msg) {
	if (nrkPlakatTime == undefined) {
		plakatDiff = '0';
	} else {
		plakatDiff = parseInt((new Date() - nrkPlakatTime)/1000);
	}
	msg = new Date()+';'+plakatDiff+';'+supertype+';'+msg+'\r\n';
	fs.appendFile('logg.csv', msg, function(err) {

	});
}





app.use(express.static('static'));


// Når biblioteket får en connection, kjør det inni her 
io.on('connection', function(socket){

	socket.on('personsuper', function(person) {
		logg('personsuper '+person.action, person.name+";"+person.title);
		io.emit('personsuper', person);
	});
	socket.on('infobox', function(person) {
		logg('infoboks '+person.action, person.title+";"+person.text);
		io.emit('infobox', person);
	});
	socket.on('run_nrklogo', function(s) {
		nrkPlakatTime = new Date();
		logg('nrkplakat', 'nrkplakat inn');
		io.emit('run_nrklogo', 1);
	});

	socket.on('restart_casparcg', function() {
		loadCaspar();
	});

	socket.on('all_out', function(e) {
		io.emit('all_out', 1);
	});

	socket.on('start_timer', function(e) {
		logTemps();
		io.emit('start_timer', 1);
	});
	socket.on('in_timer', function(e) {
		io.emit('in_timer', 1);
	});
	socket.on('out_timer', function(e) {
		io.emit('stop_timer', 1);
	});
	socket.on('set_timer', function(e) {
		io.emit('set_timer', e);
	});
	socket.on('thermo_inn', function(e) {
		e.temps = tempsArray;
		io.emit('temps_in', e);
	});

	socket.on('get_personsuper', function(url) {
		request.get({url: url}, function(error, response, body) {
			body = body.split("\r\n");
			var data = [];
			for (var line in body) {
				if (line == 0) {
					continue;
				}
				line = body[line].split(",");
				data.push({name: line[0], title: line[1]});
			}
			socket.emit('get_personsuper', data);
		});
	});

	socket.on('list_shared', function(e) {
		fs.readdir('static/shared/', function(err, files) {
			if (!err) {
				io.emit('list_shared', files);
				for (var f in files) {
					f = files[f];
				}				
			}
		});
	});

	socket.on('tempsens', function(s) {
		temps[s.session_id] = s.temp;
	});

});

// process.on('uncaughtException', function(err) {
//   console.log('Caught exception: ' + err);
// });


// Lytt på localhost:3000
http.listen(8000, function(){
	console.log('listening on *:8000 and 8001 (ws)');
});

