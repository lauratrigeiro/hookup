// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;

var passport = require('passport');
var flash    = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var socket_io = require('./app/socket_io');

// configuration ===============================================================
// connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({ extended: false })); // get information from html forms
app.use(bodyParser.json());
app.use(methodOverride());
app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
	secret : 'SECRET', // session secret
	resave : true,
	saveUninitialized : true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Assets
app.use('/public', express.static(__dirname + '/public'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap'));

// routes ======================================================================
// Landing pages
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/landing.html');
});

app.get('/early', function(req, res) {
	res.sendFile(__dirname + '/public/early.html');
});

require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
// launch ======================================================================
var server = app.listen(port);
console.log('The magic happens on port ' + port);
socket_io.init(server);
