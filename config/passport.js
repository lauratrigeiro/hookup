// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var bcrypt = require('bcrypt-nodejs');
var db = require('../config/database');
var mailchimp = require('../app/mailchimp');
var utils = require('../app/utils')
//var connection = mysql.createConnection(dbconfig.connection);

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        db.get_connection(function(error, conn) {
            if (error) {
                conn.release();
                return done(error);
            }
            
            conn.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
                conn.release();
                done(err, rows[0]);
            });
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            if (!username || username.length < 3) {
                return done(null, false, req.flash('signupMessage', 'Password must be at least 3 characters.'));
            }

            if (!password || password.length < 6) {
                return done(null, false, req.flash('signupMessage', 'Password must be at least 6 characters.'));
            }

            if (password !== req.body.confirm_password) {
                return done(null, false, req.flash('signupMessage', 'Passwords need to match.'));
            }

            if (!req.body.email || !req.body.birthday || !req.body.zip || !req.body.gender) {
                return done(null, false, req.flash('signupMessage', 'All fields are required.'));
            }

            var email = req.body.email;
            var birthday = req.body.birthday;
            var zip = req.body.zip;
            var gender = req.body.gender;

            if (email.indexOf('@') < 0) {
                return done(null, false, req.flash('signupMessage', 'Email must be valid.'));
            }

            // iso_date could be yyyy-mm-dd or yyyy/mm/dd
            var is_iso_date = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(birthday);
            if (!is_iso_date) {
                return done(null, false, req.flash('signupMessage', 'Birthday must be valid.'));
            }

            if (zip.length !== 5 || isNaN(parseInt(zip))) {
                return done(null, false, req.flash('signupMessage', 'Zip code must be valid.'));
            }

            var genders = ['Female', 'Male', 'Trans', 'Other'];
            if (genders.indexOf(gender) < 0) {
                return done(null, false, req.flash('signupMessage', 'Gender must be valid.'));
            }

            // find a user whose username is the same as the forms username
            // we are checking to see if the user trying to login already exists
            db.get_connection(function(error, conn) {
                if (error) {
                    conn.release();
                    return done(error);
                }

                conn.query("SELECT * FROM users WHERE username = ?", [username], function(err, rows) {
                    if (err) {
                        conn.release();
                        return done(err);
                    }

                    if (rows.length) {
                        conn.release();
                        return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    } else {
                        // if there is no user with that username
                        // create the user
                        var id = utils.uuid();
                        var new_user = {
                            id       : id,
                            username : username,
                            password : bcrypt.hashSync(password, bcrypt.genSaltSync(10), null),  // use the generateHash function in our user model
                            email    : email,
                            birthday : birthday,
                            zip      : zip,
                            gender   : gender
                        };

                        var insertQuery = "INSERT INTO users \
                            ( id, username, password, email, birthday, zip, gender) \
                            values (?,?,?,?,?,?,?)";

                        var params = [new_user.id, new_user.username, new_user.password, new_user.email, new_user.birthday, new_user.zip, new_user.gender];

                        conn.query(insertQuery, params, function(err, rows) {
                            conn.release();
                            mailchimp.subscribe_new_user(new_user.username, new_user.email, function(err) {
                                if (err) {
                                    console.log(err);
                                }

                                return done(null, new_user);
                            });
                        });
                    }
                });
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            db.get_connection(function(error, conn) {
                if (error) {
                    conn.release();
                    return done(error);
                }

                conn.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                    conn.release();
                    if (err)
                        return done(err);
                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                    }

                    // if the user is found but the password is wrong
                    if (!bcrypt.compareSync(password, rows[0].password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                    // all is well, return successful user
                    return done(null, rows[0]);
                });
            });
        })
    );
};
