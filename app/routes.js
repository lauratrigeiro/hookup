// app/routes.js
var admin = require('./admin');
var chats = require('./chats');
var mailchimp = require('./mailchimp');
var stories = require('./stories');

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

	app.get(subroute + '/privacy', function(req, res) {
		var data_to_send;
		if (req.isAuthenticated()) {
			data_to_send = {
				user : req.user,
				is_logged_in : true
			};
		} else {
			data_to_send = { is_logged_in : false };
		}
		res.render('privacy.ejs', data_to_send);
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
		successRedirect : subroute + '/home?new=1', // redirect to the secure profile section
		failureRedirect : subroute + '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// ASK A SEXPERT
	app.post('/chats/create', isLoggedIn, chats.create);
	app.post('/chats/new', isLoggedIn, chats.new_message);
	app.post('/chats/connect', isSexpert, chats.connect);
	app.get('/chats/sexpert', isLoggedIn, chats.sexpert);
	app.get('/chats/waiting', isSexpert, chats.waiting);
	app.get('/chats/first', isLoggedIn, chats.first);

	// SHARE YOUR STORY
	app.post('/stories/create', isLoggedIn, stories.create);
	app.post('/stories/approve', isSexpert, stories.approve);
	app.post('/stories/upvote', isLoggedIn, stories.upvote);
	app.get('/stories/approved', isLoggedIn, stories.get_approved);
	app.get('/stories/unapproved', isSexpert, stories.get_unapproved);

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

	// SEXPERT
	app.get(subroute + '/sexpert', isSexpert, function(req, res) {
		res.render('sexpert.ejs', {
			is_logged_in : true,
			user : req.user
		});
	});

	app.get(subroute + '/approve', isSexpert, function(req, res) {
		res.render('approve.ejs', {
			is_logged_in : true,
			user : req.user
		});
	});

	// ADMIN
	app.get(subroute + '/admin', isEmployee, function(req, res) {
		res.render('admin.ejs', {
			is_logged_in : true,
			user : req.user
		});
	});

	app.get('/admin/users', isAdmin, admin.get_user);
	app.post('/admin/users', isAdmin, admin.upgrade_user);
	app.post('/admin/sexperts', isAdmin, admin.add_profile);
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

function isSexpert(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.sexpert) {
			return next();
		} else {
			res.redirect(subroute + '/home');
		}
	}

	res.redirect(subroute + '/');
}

function isEmployee(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.employee) {
			return next();
		} else {
			res.redirect(subroute + '/home');
		}
	}

	res.redirect(subroute + '/');
}

function isAdmin(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.admin) {
			return next();
		} else {
			res.redirect(subroute + '/home');
		}
	}

	res.redirect(subroute + '/');
}
