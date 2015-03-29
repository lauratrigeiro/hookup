// app/routes.js
var mailchimp = require('./mailchimp');

var subroute = '/tn';

module.exports = function(app, passport) {
	// Landing pages (Mailchimp)
	app.post('/mailchimp/subscribe', mailchimp.subscribe);

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get(subroute + '/', redirectIfLoggedIn, function(req, res) {
		res.render('index.ejs', {
			is_logged_in : false
		});
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get(subroute + '/login', redirectIfLoggedIn, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { 
			message: req.flash('loginMessage'),
			is_logged_in : false
		});
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : subroute + '/home', // redirect to the secure profile section
            failureRedirect : subroute + '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect(subroute + '/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get(subroute + '/signup', redirectIfLoggedIn, function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', {
			message: req.flash('signupMessage'),
			is_logged_in : false
		});
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : subroute + '/home', // redirect to the secure profile section
		failureRedirect : subroute + '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// Site pages
	app.get(subroute + '/home', isLoggedIn, function(req, res) {
		res.render('home.ejs', {
			is_logged_in : true,
			user : req.user // get the user out of session and pass to template
		});
	});

	app.get(subroute + '/ask', isLoggedIn, function(req, res) {
		res.render('ask.ejs', {
			user : req.user,
			is_logged_in : true
		});
	});

	app.get(subroute + '/chat', isLoggedIn, function(req, res) {
		res.render('chat.ejs', {
			user : req.user,
			is_logged_in : true
		});
	});

	app.get(subroute + '/share', isLoggedIn, function(req, res) {
		res.render('share.ejs', {
			user : req.user,
			is_logged_in : true
		});
	});

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get(subroute + '/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			is_logged_in : true,
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect(subroute + '/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect(subroute + '/');
}

function redirectIfLoggedIn(req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated())
		return next();

	// if they are redirect them to the home page
	res.redirect(subroute + '/home');
}
