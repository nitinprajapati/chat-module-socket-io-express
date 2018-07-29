var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var session = require('express-session');
var app = express();

app.use(logger('common'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'ChatApp',
    secret: 'ChatAppKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
  }));
  
  app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
  });

app.use('/', require('./routes/index'));

module.exports = app;
