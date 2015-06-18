// app/routes.js
var admin = require('./admin');
var chats = require('./chats');
var mailchimp = require('./mailchimp');
var sexperts = require('./sexperts');
var stories = require('./stories');
var users = require('./users');

var subroutes = '^(\/tn|\/launch)';
var admin_default_subroute = '/launch';

module.exports = function(app, passport) {
	// Landing pages (Mailchimp)
	app.post('/mailchimp/subscribe', mailchimp.subscribe);

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get(new RegExp(subroutes + '$'), getSubroute, redirectIfLoggedIn, function(req, res) {
		var welcome_message;
		if (req.subroute === '/tn') {
			welcome_message = "We're Hookup, and we'll answer all your sex-related questions. \
				We're in a beta testing period, and we chose our Tennessee home for first dibs. Go Vols!";
		} else if (req.subroute === '/launch') {
			welcome_message = "We're Hookup, and we'll answer all your sex-related questions. \
				Snoop to see what others are saying about sex and relationships. We're in a beta testing period. \
				Check us out and let us know what you think!";
		} else {
			welcome_message = "We're Hookup, and we'll answer all your sex-related questions.";
		}

		res.render('index.ejs', {
			is_logged_in    : false,
			route           : req.subroute,
			welcome_message : welcome_message
		});
	});

	app.get(new RegExp(subroutes + '\/privacy$'), getSubroute, function(req, res) {
		var data_to_send;
		if (req.isAuthenticated()) {
			data_to_send = {
				user : req.user,
				is_logged_in : true,
				route        : req.subroute
			};
		} else {
			data_to_send = { is_logged_in : false, route : req.subroute };
		}
		res.render('privacy.ejs', data_to_send);
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get(new RegExp(subroutes + '\/login$'), getSubroute, redirectIfLoggedIn, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', {
			message: req.flash('loginMessage'),
			is_logged_in : false,
			route        : req.subroute
		});
	});

	// process the login form
	app.post('/login/tn', passport.authenticate('local-login', {
            successRedirect : '/tn/home', // redirect to the secure profile section
            failureRedirect : '/tn/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
    function(req, res) {
      if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 3;
      } else {
        req.session.cookie.expires = false;
      }
    }
  );

	app.post('/login/launch', passport.authenticate('local-login', {
   //         successRedirect : '/launch/home', // redirect to the secure profile section
            failureRedirect : '/launch/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
		function(req, res) {
			if (req.body.remember) {
				req.session.cookie.maxAge = 1000 * 60 * 3;
			} else {
				req.session.cookie.expires = false;
			}

			if (req.body.redirect_url) {
				res.redirect('/launch/chat?id=' + req.body.redirect_url);
			} else {
				res.redirect('/launch/home');
			}
		}
	);

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get(new RegExp(subroutes + '\/signup$'), getSubroute, redirectIfLoggedIn, function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', {
			message: req.flash('signupMessage'),
			is_logged_in : false,
			route        : req.subroute
		});
	});

	// process the signup form
	app.post('/signup/tn', passport.authenticate('local-signup', {
		successRedirect : '/tn/home?new=1', // redirect to the secure profile section
		failureRedirect : '/tn/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	app.post('/signup/launch', passport.authenticate('local-signup', {
		successRedirect : '/launch/home?new=1', // redirect to the secure profile section
		failureRedirect : '/launch/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// ASK A SEXPERT
	app.post('/chats/create', isLoggedIn, chats.create);
	app.post('/chats/new', isLoggedIn, chats.new_message);
	app.post('/chats/connect', isSexpert, chats.connect);
	app.post('/chats/select_sexpert', isLoggedIn, chats.select_sexpert);
  app.post('/chats/approve', isSexpert, chats.approve_chat);
  app.post('/chats/deny', isSexpert, chats.deny_chat);
  app.put('/chats/display_username', isSexpert, chats.set_display_username);
	app.get('/chats/sexpert', isLoggedIn, chats.sexpert);
	app.get('/chats/waiting', isSexpert, chats.waiting);
	app.get('/chats/me', isLoggedIn, chats.get_open_chats_by_user);
	app.get('/chats/open', isSexpert, chats.get_open_chats_by_sexpert);
	app.get('/chats/first', isLoggedIn, chats.first);
	app.get('/chats/:id', isLoggedIn, chats.get_chat_messages);
	app.get('/chats', isEmployee, chats.get_all_chats);
	app.get('/chats-approved', isLoggedIn, chats.get_approved_chats);
	app.get('/chats-pending', isSexpert, chats.get_pending_chats);

	// SHARE YOUR STORY
	app.post('/stories/create', isLoggedIn, stories.create);
	app.post('/stories/approve', isSexpert, stories.approve);
	app.post('/stories/deny', isSexpert, stories.deny);
	app.post('/stories/edit', isSexpert, stories.edit);
	app.post('/stories/upvote', isLoggedIn, stories.upvote);
	app.get('/stories/approved', isLoggedIn, stories.get_approved);
	app.get('/stories/unapproved', isSexpert, stories.get_unapproved);

	// Site pages
	app.get(new RegExp(subroutes + '\/home$'), getSubroute, isLoggedIn, function(req, res) {
		var home_message;
		if (req.subroute === '/tn') {
			home_message = "Thanks for being our Hookup virgins! \
				And shout out to Sex Week UT for supporting our beta test launch.";
		} else if (req.subroute === '/launch') {
			home_message = "Thanks for being our Hookup virgins! \
				Follow us and tell your bestie, the bae, people on the street — basically anyone except your mother.";
		} else {
			home_message = "Thanks for being our Hookup virgins!";
		}

		res.render('home.ejs', {
			is_logged_in : true,
			user : req.user, // get the user out of session and pass to template
			route        : req.subroute,
			home_message : home_message
		});
	});

	app.get(new RegExp(subroutes + '\/ask$'), getSubroute, isLoggedIn, function(req, res) {
		res.render('ask.ejs', {
			user : req.user,
			is_logged_in : true,
			route        : req.subroute
		});
	});

	app.get(new RegExp(subroutes + '\/chat$'), getSubroute, isLoggedInAndRedirectBack, function(req, res) {
		res.render('chat.ejs', {
			user : req.user,
			is_logged_in : true,
			route        : req.subroute
		});
	});

	app.get(new RegExp(subroutes + '\/share$'), getSubroute, isLoggedIn, function(req, res) {
		res.render('share.ejs', {
			user : req.user,
			is_logged_in : true,
			route        : req.subroute
		});
	});

	app.get(new RegExp(subroutes + '\/select$'), getSubroute, isLoggedIn, function(req, res) {
		res.render('select_sexpert.ejs', {
			user         : req.user,
			is_logged_in : true,
			route        : req.subroute
		});
	});

  app.get(new RegExp(subroutes + '\/feed$'), getSubroute, isLoggedIn, function(req, res){
    res.render('feed.ejs', {
      user: req.user,
      is_logged_in : true,
      route: req.subroute,
      status: "approved"
    });
  });

  app.get(new RegExp(subroutes + '\/feed-pending$'), getSubroute, isSexpert, function(req, res){
    res.render('feed.ejs', {
      user: req.user,
      is_logged_in : true,
      route: req.subroute,
      status: "pending"
    });
  });

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get(new RegExp(subroutes + '\/profile$'), getSubroute, isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			is_logged_in : true,
			user : req.user, // get the user out of session and pass to template
			route        : req.subroute
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		var base_url_length = ('http://' + req.headers.host + '/').length;
		var path = '/' + req.headers.referer.slice(base_url_length).split('/')[0];
		req.logout();
		res.redirect(path);
	});

	// SEXPERT
	app.get(new RegExp(subroutes + '\/sexpert$'), getSubroute, isSexpert, function(req, res) {
		res.render('sexpert.ejs', {
			is_logged_in : true,
			user : req.user,
			route        : req.subroute
		});
	});

	app.get(new RegExp(subroutes + '\/approve$'), getSubroute, isSexpert, function(req, res) {
		res.render('approve.ejs', {
			is_logged_in : true,
			user : req.user,
			route        : req.subroute
		});
	});

	app.get('/sexperts',/* isLoggedIn,*/ sexperts.get);
	app.get('/sexperts/active', isLoggedIn, sexperts.get_active);
	app.put('/sexperts/active', isSexpert, sexperts.change_active_status);

	// ADMIN
	app.get('/admin', isEmployee, function(req, res) {
		res.render('admin.ejs', {
			is_logged_in : true,
			user : req.user,
			route        : admin_default_subroute
		});
	});

	app.get('/admin/chats', isEmployee, function(req, res) {
		res.render('chats_list.ejs', {
			is_logged_in : true,
			user : req.user,
			route        : admin_default_subroute
		});
	});

	app.get('/admin/chats/:id', isEmployee, function(req, res) {
		res.render('chat_messages.ejs', {
			is_logged_in : true,
			user : req.user,
			route        : admin_default_subroute
		});
	});

	app.get('/admin/users', isAdmin, admin.get_user);
	app.post('/admin/users', isAdmin, admin.upgrade_user);
	app.post('/admin/sexperts', isAdmin, admin.add_profile);

	app.get('/users', isAdmin, users.get);
};

// route middleware to make sure
function getSubroute(req, res, next) {
	req.subroute = '/' + req.originalUrl.slice(1).split('/')[0];
	next();
}

function isLoggedInAndRedirectBack(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	var redirect_url = '';
	if (req.query && req.query.id) {
		redirect_url = req.query.id;
	}

	// if they aren't redirect them to the home page
	res.redirect(req.subroute + '/login?id=' + redirect_url || admin_default_subroute + '/login?id=' + redirect_url);
}

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect(req.subroute || admin_default_subroute + '/login');
}

function redirectIfLoggedIn(req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated())
		return next();

	// if they are redirect them to the home page
	res.redirect(req.subroute + '/home');
}

function isSexpert(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.sexpert) {
			return next();
		} else {
			res.redirect(req.subroute + '/home');
		}
	}

	res.redirect(req.subroute);
}

function isEmployee(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.employee) {
			return next();
		} else {
			res.redirect(admin_default_subroute + '/home');
		}
	}

	res.redirect(admin_default_subroute);
}

function isAdmin(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.admin) {
			return next();
		} else {
			res.redirect(admin_default_subroute + '/home');
		}
	}

	res.redirect(admin_default_subroute);
}
