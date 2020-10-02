'use strict';

// Chat application dependencies
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

// Chat application components
const routes = require('./app/routes');
const session = require('./app/session');
const passport = require('./app/auth');
const ioServer = require('./app/socket')(app);

// Set the port number
const port = process.env.PORT || 2019;

// View engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use('/modules', express.static(__dirname + '/node_modules/'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', routes);

// Middleware to catch 404 errors
app.use(function(req, res, next) {
  res.status(404).sendFile(process.cwd() + '/app/views/404.htm');
});

ioServer.listen(port , () => {
  ioServer.close(function(){
    ioServer.listen(port,'localhost')
});
  console.log('Server is runing on port ' + port);
});
