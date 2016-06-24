var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var net = require('net');
var io = require('socket.io')(http);
var parseString = require('xml2js').parseString;
const fs = require('fs');


var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8001 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
  	io.emit('ws_msg', message);
  });
  console.log('Got connextion');
});

/*
02 Akershus
09 Aust-Agder
06 Buskerud
20 Finnmark
04 Hedmark
12 Hordaland
15 Møre og Romsdal
17 Nord-Trøndelag
18 Nordland
05 Oppland
03 Oslo
11 Rogaland
14 Sogn og Fjordane
16 Sør-Trøndelag
08 Telemark
19 Troms
10 Vest-Agder
07 Vestfold
01 Østfold
*/

var digasPath;

fs.readFile('./static/config.json', function(err, data) {
	data = JSON.parse(data);
	digasPath = data.digasPath;
});

var sombi = 'https://sombi.nrk.no/api/1.3/document?county=01,02&moderation=1&projectId=5760092bfd3cf1f96d07c306'; // 539e98bcafc807ae130000f1';

var publishDigas = true;

var currentDigas;

var digasTimers = {outTimer: null};

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

function clearDigas() {
	clearTimeout(digasTimers.outTimer);
}

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

function sombiGenerator(s) {
	sombi_url = url.parse(s);
	var project_id = sombi_url.search.split('projectId=')[1];
	try {
		request(s, function (error, response, body) {
			if(error != null) {
				console.log("Could not load sombi json");
				console.log(error);
				return true;
			}
		var images = [];
		body = JSON.parse(body);
		for (obj in body._embedded.document) {
			(function(obj, body) {
				obj = body._embedded.document[obj];

				if ((obj.image.standard != null) && (obj.title != null) && (obj.src != "twitter")) {
					var urlp = url.parse(obj.image.standard).pathname+'.jpg';
					urlp = project_id+'_'+urlp.hashCode()+'.jpg';

					var localfp = './static/images/'+urlp;

					fs.open(localfp, 'r', function(error, fd) {
						if (error) {
							request.get({url: obj.image.standard, encoding: 'binary'}, function(error, response, body) {
								if (response.toJSON().headers['content-length'] < 10000) {
									return false;
								}
								var urlp = url.parse(obj.image.standard).pathname+'.jpg';
								urlp = project_id+'_'+urlp.hashCode()+'.jpg';
								
								var localfp = './static/images/'+urlp;
								fs.writeFile(localfp, body, 'binary');
								console.log("Wrote file", localfp);
							});
						} else {
							console.log("File already exists", localfp);
						}
					});
						images.push({url: 'images/'+urlp, title: obj.title, avatar: obj.user.avatar, user: obj.user});
					}
				})(obj, body); 
			}
			fs.writeFile('./static/images.json', JSON.stringify(images));
		});
	} catch (e) {
		console.log("Error in Sombi");
	}
	// setTimeout(sombiGenerator, 30000);
}


// sombiGenerator("https://sombi.nrk.no/api/1.3/document?county=01,02&moderation=1&projectId=5760092bfd3cf1f96d07c306");

function pushCounty() {
	url = 'http://185.62.39.154:8312/nrkcam';
	request.get({url: url}, function(error, response, body) {
		body = JSON.parse(body);
		if (body.error == "") {
			io.emit('county', body.fylke);
		}
	});
	setInterval(pushCounty, 3000);
}


function parseDigas() {
	if (!publishDigas) {
		setTimeout(parseDigas, 1000);
		return true;
	}
	try {
		fs.readFile(digasPath, function(err, data) {
			if (err) {
				console.log("Error reading Digas");
				return true;
			} else {
				parseString(data, function(err, result) {
					for (obj in result.easy_xml.item) {
						item = result.easy_xml.item[obj];
						seq = item['$'].sequence;
						if (seq == "present" && item.Class == "Music") {
							startTime = new Date(item.Time_RealStart[0]);
							endTime = new Date(item.Time_RealStop[0]);
							endTimer = endTime - startTime;
							currentDigas_tmp = {title: item.Title[0], performer: item.Music_Performer[0], composer: item.Music_Composer[0], start: startTime, stop: endTime, recordcc: item['NRK.PLNUMMER'][0].split(';')[0], release_year: item['NRK.RELEASE_YEAR']};
							if (currentDigas && (currentDigas.title == currentDigas_tmp.title)) {
								continue;
							}
							clearTimeout(digasTimers.outTimer);
							currentDigas = currentDigas_tmp;
							digasTimers.outTimer = setTimeout(function() {
								if (!publishDigas) {
									return true;
								}
								io.emit("digassuper", currentDigas);
								console.log("Fired out digas", currentDigas);
								clearTimeout(digasTimers.outTimer);
							}, endTimer-15000);
							setTimeout(function() {
								io.emit("digassuper", currentDigas);
								console.log("Fired digas", currentDigas);
							}, 0);
						}
					}
				});
			}
	});
	} catch (e) {
		console.log("Caught E");
	}
	setTimeout(parseDigas, 1000);
}
setTimeout(function() {console.log("Connecting to DIGAS"); parseDigas();}, 15000);

app.use(express.static('static'));


// Når biblioteket får en connection, kjør det inni her 
io.on('connection', function(socket){

	socket.on('personsuper', function(person) {
		io.emit('personsuper', person);
	});
	socket.on('infobox', function(person) {
		io.emit('infobox', person);
	});
	socket.on('activate_digas', function(b) {
		console.log("Activate Digas", b);
		publishDigas = b;
	});
	socket.on('restart_casparcg', function() {
		loadCaspar();
	});
	socket.on('instagram_refresh', function(s) {
		sombiGenerator(s);
		io.emit('instagram_refresh', 1);
	});
	socket.on('instagram', function(s) {
		fs.readFile('./static/images.json', function(err, data) {
			io.emit("instagram", {action: 'in', id: 'lksad123', images: JSON.parse(data)});
		});
	});
	socket.on('instagram_out', function(s) {
		io.emit("instagram_out", 1);
	});
	socket.on('infosuper', function(person) {
		io.emit('infosuper', person);
	});
	socket.on('playersuper', function(person) {
		io.emit('playersuper', person);
	});
	socket.on('playersuper_info', function(person) {
		io.emit('playersuper_info', person);
	});
	socket.on('somesuper', function(s) {
		io.emit('somesuper', s);
	});
	socket.on('smallmap', function(s) {
		io.emit('smallmap', s);
	});
	socket.on('largemap', function(s) {
		io.emit('largemap', s);
	});
	socket.on('placesuper', function(s) {
		io.emit('placesuper', s);
	});
	socket.on('county', function(s) {
		io.emit('county', s);
	});
	socket.on('all_out', function(e) {
		io.emit('all_out', 1);
	});

	socket.on('list_shared', function(e) {
		fs.readdir('static/shared/', function(err, files) {
			if (!err) {
				io.emit('list_shared', files);
				for (var f in files) {
					f = files[f];
					console.log(f);
				}				
			}
		});
	});

	socket.on('static_image', function(s) {
		console.log(s);
		io.emit('static_image', s);
	});

	socket.on('get_some', function(s) {
		if (s.url.indexOf('facebook.com') > -1) {
			var oembed = 'https://www.facebook.com/plugins/post/oembed.json/?url=';
			var source = 'facebook';
		}
		if (s.url.indexOf('twitter.com') > -1) {
			var oembed = 'https://api.twitter.com/1/statuses/oembed.json?url=';
			var source = 'twitter';
		}
		if (oembed == null) {
			return false;
		}
		request.get({
			url: oembed+s.url,
			headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}}, 
			function(error, response, body) {
				body = JSON.parse(body);
				var b = cheerio.load(body.html);
				var text = cheerio(b.html()).find('blockquote p').text();
				var username = body.author_url.replace('https://facebook.com/', '').replace('https://www.facebook.com/', '').replace('https://twitter.com/', '').replace('/', '');
				socket.emit('get_some', {
					title: body.author_name,
					text: text,
					username: username,
					source: source,
					id: s.id
				});
			});
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

	socket.on('digasstatus', function(msg) {
		var present;
		fs.readFile(digasPath, function(err, data) {
			if (err) {
				return true;
			}
			parseString(data, function(err, result) {
				for (var obj in result.easy_xml.item) {
					item = result.easy_xml.item[obj];
					seq = item['$'].sequence;
					if (seq == "present" && item.Class == "Music") {
						present = {title: item.Title[0]};
					}
				}
				if (!present) {
					io.emit('digas_super', {title: 'Ingenting spiller'});
				} else {
					io.emit('digas_super', present);
				}
			});
		});
	});

});

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});


// Lytt på localhost:3000
http.listen(8000, function(){
	console.log('listening on *:8000 and 8001 (ws)');
});

