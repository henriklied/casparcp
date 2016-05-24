var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Fortell appen at / skal vise index.html
app.get('/', function(req, res){
  res.sendfile('index.html');
});

// Fortell appen at forespørsler til /show/ skal vise show.html
app.get('/show/', function(req, res){
  res.sendfile('show.html');
});

// Samme med style.css
app.get('/style.css', function(req, res){
  res.sendfile('style.css');
});

// Når biblioteket får en connection, kjør det inni her 
io.on('connection', function(socket){
	// Når den aktuelle connection-en sender en kommando med navnet "cmd",
  socket.on('cmd', function(msg){
  	// emit den kommandoen til alle tilkoblede connections
    io.emit('cmd', msg);
  });
});

// Lytt på localhost:3000
http.listen(3000, function(){
  console.log('listening on *:3000');
});

