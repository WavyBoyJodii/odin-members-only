var createError = require('http-errors');
var express = require('express');
var path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
});
const User = require('./models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// connect to mongoDb with mongoose
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const mongoDB = mongoUrl;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(limiter);
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
    },
  })
);
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
