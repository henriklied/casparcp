var request = require('request');
var url = require('url');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var parseString = require('xml2js').parseString;
const fs = require('fs');

var digasPath = './digas.xml';

var sombi = 'http://sombi.nrk.no/api/1.2/data/?limit=30&moderation=1&starred=true&metadataQuery=true&project_id=539e98bcafc807ae130000f1'; // 539e98bcafc807ae130000f1';

var publishDigas = true;

var currentDigas;

var digasTimers = {outTimer: null};

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


function sombiGenerator(project_id) {
	project_id = '539e98bcafc807ae130000f1';
	try {
		request(sombi, function (error, response, body) {
			if(error != null) {
				console.log("Could not load sombi json");
				console.log(error);
				return true;
			}
		var images = [];
		var tweets = []
		body = JSON.parse(body);
		for (obj in body.results) {
			(function(obj, body) {
				obj = body.results[obj];
				if (obj.project_metadata[0].starred) {
					if ((obj.image.standard != null) && (obj.src != 'twitter')) {
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
								});
							}
						});
						var data = 'images/'+urlp;
						images.push({url: data, title: obj.title, avatar: obj.user.avatar, user: obj.user});
					} 
					else if (obj.src == 'twitter') {
						var data = '<div class="ticker__item">'+obj.title+'<span>'+obj.user.username+'</span></div>';
						tweets.push({src: data});
					}
				}
				})(obj, body); 
			}
			fs.writeFile('./static/images.json', JSON.stringify(images));
			fs.writeFile('./static/tweets.json', JSON.stringify(tweets));
		});
	} catch (e) {
		console.log("Error in Sombi");
	}
	setTimeout(sombiGenerator, 30000);
}

sombiGenerator();

function parseDigas() {
	if (!publishDigas) {
		return true;
	}
	try {
		fs.readFile(digasPath, function(err, data) {
			if (err) {
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
							currentDigas_tmp = {title: item.Title[0], performer: item.Music_Performer[0], composer: item.Music_Composer[0], start: startTime, stop: endTime};
							if (currentDigas && (currentDigas.title == currentDigas_tmp.title)) {
								continue;
							}
							clearTimeout(digasTimers.outTimer);
							currentDigas = currentDigas_tmp;
							digasTimers.outTimer = setTimeout(function() {
								io.emit("digassuper", currentDigas);
								console.log("Fired out");
								clearTimeout(digasTimers.outTimer);
							}, endTimer-15000);
							setTimeout(function() {
								io.emit("digassuper", currentDigas);
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
setTimeout(parseDigas, 3000);

app.use(express.static('static'));


// Når biblioteket får en connection, kjør det inni her 
io.on('connection', function(socket){

	socket.on('personsuper', function(person) {
		io.emit('personsuper', person);
	});
	socket.on('infobox', function(person) {
		io.emit('infobox', person);
	});
	socket.on('instagram', function(s) {
		fs.readFile('./static/images.json', function(err, data) {
			io.emit("instagram", {action: 'in', id: 'lksad123', images: JSON.parse(data)});
		});
	});
	socket.on('infosuper', function(person) {
		io.emit('infosuper', person);
	});
	socket.on('all_out', function(e) {
		io.emit('all_out', 1);
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
	console.log('listening on *:8000');
});

