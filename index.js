// Express app configuration
const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const { body, validationResult } = require('express-validator');
const app = express();
const port = 8000;

// Database configuration
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.log('Database connected');
    db.run('PRAGMA foreign_keys=ON');
  }
});
global.db = db;

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'cm2040mid-terms-220628448',
  resave: false,
  saveUninitialized: true
}));

// Route registration
require("./routes/landing")(app); 
require("./routes/user")(app); 
require("./routes/author")(app); 
require("./routes/reader")(app); 

// Application settings 
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.listen(port, () => console.log(`ScribbleBlog listening on port ${port}!`));