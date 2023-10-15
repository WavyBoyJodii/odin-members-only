var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

/* GET home/login page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

// Handle post login page
router.post(
  '/',
  passport.authenticate('local', {
    successRedirect: '/secret-entrance',
    failureRedirect: '/',
  })
);

// Get sign up Page
router.get('/sign-up', function (req, res, next) {
  res.render('sign_up');
});

//Handle Sign up
router.post(
  '/sign-up',
  [
    // validate and sanitize the fields
    body('firstName', 'field cant be empty')
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body('lastName', 'field cant be empty')
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body('username')
      .trim()
      .isLength({ min: 3 })
      .escape()
      .withMessage('username must be atleast 3 characters long'),
    body('password')
      .trim()
      .isLength({ min: 7 })
      .escape()
      .withMessage('password must be atleast 7 characters long'),
  ],
  asyncHandler(async (req, res, next) => {
    //Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('sign_up', { errors: errors.array() });
      return;
    }
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      res.render('sign_up', { exists: true });
      return;
    }

    // Hash the password with bcryptjs
    const hashedPass = await bcrypt.hash(req.body.password, 10);

    // Create and save the new user
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      password: hashedPass,
    });
    await newUser.save();
    // redirect to login page
    res.redirect('/');
  })
);

// Get secret Entrance page
router.get('/secret-entrance', function (req, res, next) {
  if (req.user.membership === true) {
    res.redirect('/message-board');
    return;
  }
  res.render('secret_entrance');
});

// Handle Secret Entrance page on POST
router.post(
  '/secret-entrance',
  [
    // validate and sanitize the fields
    body('codeWord', 'field cant be empty')
      .trim()
      .isLength({ min: 1 })
      .escape(),
  ],
  asyncHandler(async (req, res, next) => {
    // if codeword is correct update user membership and render messageboard
    if (req.body.codeWord === 'Jodii') {
      const { firstName, lastName, username, password, _id } = req.user;
      const user = new User({
        firstName,
        lastName,
        username,
        password,
        membership: true,
        _id,
      });
      const updatedUser = await User.findByIdAndUpdate(req.user._id, user, {});
      res.redirect('/message-board');
    } else {
      res.redirect('/message-board');
    }
  })
);

module.exports = router;
