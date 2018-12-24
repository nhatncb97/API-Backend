var User = require('../../models/user');
var async = require('async');
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var xoauth2 = require('xoauth2');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var config = require('../../passport-jwt/config');
const gravatar = require('gravatar');
module.exports.register = function (req, res) {
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var dateOfBirth = req.body.dateOfBirth;
	var gender = req.body.gender;
	var lastname = req.body.lastname;
	var firstname = req.body.firstname;
	var phone = req.body.phone;
	console.log(req.body.username);
	//Validation
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('phone', 'Phone is required').notEmpty();
	req.checkBody('lastname', 'lastname is required').notEmpty();
	req.checkBody('firstname', 'Firstname is required').notEmpty();
	req.checkBody('password2', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	var errors = req.validationErrors();

	if (errors) {
		console.log('User register has errors')
		res.status(404).json('Dữ liệu không hợp lệ');
		// res.render('register', {
		// 	errors: errors
		// });
	}
	else {
		//checking for email and username are already taken
		User.findOne({
			username: {
				"$regex": "^" + username + "\\b", "$options": "i"
			}
		}, function (err, user) {
			User.findOne({
				email: {
					"$regex": "^" + email + "\\b", "$options": "i"
				}
			}, function (err, mail) {
				if (user || mail) {
					res.json('Existed');
				}
				else {
					const avatar = gravatar.url(email, {
						s: '200', // Size
						r: 'pg', // Rating
						d: 'mm' // Default
					  });
					var newUser = new User({
						email: email,
						username: username,
						password: password,
						avatar,
						lastname: lastname,
						firstname: firstname,
						dateOfBirth: dateOfBirth,
						gender: gender,
						phone: phone
					});
					var result = User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
						res.status(200).json('ĐĂNG KÝ THÀNH CÔNG');
					});
				}
			});
		});
	}
}
module.exports.changePass = function (req, res) {
	console.log('Here' + req.body);
	User.findOne({ username: req.params.username }).then(function (user) {
		User.comparePassword(req.body.password, user.password, function (err, isMatch) {
			if (err) throw err;
			if (isMatch) {
				bcrypt.genSalt(10, function (err, salt) {
					bcrypt.hash(req.body.newPassword, salt, function (err, hash) {
						User.findOneAndUpdate({ username: req.params.username }, { password: hash }).then(function () {
								res.json(user);
						
						});
					});
				});
			}
			else {
				res.status(404).json('Invalid password');
			}
		})
	})

};
module.exports.resetPassword = function (req, res) {
	async.waterfall([
		function (done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
				if (!user) {
					// req.flash('error', 'Password reset token is invalid or has expired.');
					// return res.redirect('back');
					return res.json('Password reset token is invalid or has expired.')
				}

				bcrypt.genSalt(10, function (err, salt) {
					bcrypt.hash(req.body.newPassword, salt, function (err, hash) {
						User.findOneAndUpdate({ resetPasswordToken: req.params.token }, { password: hash, resetPasswordToken: undefined, resetPasswordExpires: undefined }).then(function () {
							User.findOne({ username: user.username }).then(function (user) {
								res.json(user);
							})
						});
					});
				});
			});
		},], function (err) {
			// res.redirect('/');
			res.json('Lỗi');
		});
}
module.exports.sendMailToken = function (req, res, next) {
	async.waterfall([
		function (done) {
			crypto.randomBytes(20, function (err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function (token, done) {
			User.findOne({ email: req.body.email }, function (err, user) {
				if (!user) {
					// req.flash('error', 'No account with that email address exists.');
					// return res.redirect('/forgot');
					return res.status(404).json("No account with that email address exists.");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function (err) {
					done(err, token, user);
				});
			});
		},
		function (token, user, done) {
			var smtpTransport = nodemailer.createTransport(/*'SMTP',*/ {
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					type: 'OAuth2',
					user: '15520579@gm.uit.edu.vn',
					clientId: '1084231637210-5s064d297c3enbsfhshjdiq74pjdab7a.apps.googleusercontent.com',
					clientSecret: 'N_UDvg3p_N3B8A2tO8eCinLa',
					refreshToken: '1/hYs8fnGIEHiBXMzz9m-VC5CWwAfsGQJb1q5yRTClkao',
					accessToken: 'ya29.Gls7BrzkosyRcDTkCShI7GRG8hQ7aifSM4Cyr9W-BC8vehOrHI5vDW6hhzU-IPPa-uQMgZWq2urxJFnHlJE-01EA4ZNax6seEa_KLdY8xE7IMRBtMybk1PQ-uOUc'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'passwordreset@uitcinema.demo.com',
				subject: 'UIT Cinema Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://' + req.headers.origin + '/api/users/reset/' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function (err) {
				// req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				res.json('http://' + req.headers.origin + '/api/users/reset/' + token);
				done(err, 'done');
			});
		}
	], function (err) {
		if (err) return next(err);
		// res.redirect('/forgot');
		res.json("Lỗi");
	});
}
module.exports.delAccount = function (req, res) {
	User.findOne({ username: req.params.username }, function (err, user) {
		if (!user) {
			// req.flash('error', 'No account with that email address exists.');
			// return res.redirect('/forgot');
			return res.json("No account with that username exists.");
		}
		User.deleteOne({ username: req.params.username }, function (err) { })
		res.json('Deleted')
	})
}
module.exports.Login = function (req, res, next) {
	passport.authenticate('local', { session: false }, (err, user, info) => {
		if (err || !user) {
			return res.status(400).json({
				message: 'Không tồn tại user'
			});
		}
		req.login(user, { session: false }, (err) => {
			if (err) {
				res.send(err);
			}
			console.log(user.username + " logged in");
			//Tạo Token
			const token = jwt.sign(user.toJSON(), config.secret, { expiresIn: 1800 });
			console.log(token);
			User.findOne({ email: req.body.email }, function (err, user) {
				// user.token = token;
				// user.save();
				var data = {
					avatar: user.avatar,
					username: user.username,
					email: user.email,
					lastname: user.lastname,
					firstname: user.firstname,
					phone: user.phone,
					dateOfBirth: user.dateOfBirth,
					token: token
				}
				return res.status(200).json({ data });
			});
		});
	})(req, res);
};
module.exports.checkToken = function (req, res) {
		if (req.user!=null) {
			var data = {
				username : req.user.username,
				email: req.user.email,
				lastname: req.user.lastname,
				firstname: req.user.firstname,
				dateOfBirth: req.user.dateOfBirth,
				gender: req.user.gender,
				phone: req.user.phone,
				avatar: req.user.avatar
			}
			console.log(data);
			res.status(200).json(req.user);
		}
		else {
			console.log('Not found');
			res.status(404).json('Not found');
		}

}
module.exports.logOut = (req, res) => {
	User.findOneAndUpdate({ email: req.body.email }, { token: null }, function (error, doc) { });
}
module.exports.edit = function (req, res) {
	User.findOneAndUpdate({ username: req.params.username}, 
	{
	  
		
		avatar : req.body.avatar
	},
		function(err, result) {
		  if(!err) 
			console.log('update thanh cong!!!!!!');
			
		  
		
	  
	}).then(function () {
		User.findOne({ username: req.params.username }).then(function (user) {
			res.json(user);
		})
	});
	
	
  };