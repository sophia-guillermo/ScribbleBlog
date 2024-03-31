module.exports = function (app) {
    const { body, validationResult } = require('express-validator');

    /** Purpose: Handles user input validation and database operations for user authentication */
    app.post('/login',
        [
            body('username').notEmpty().withMessage('Username is required'),
            body('password').notEmpty().withMessage('Password is required')
        ], (req, res) => {
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('auth/landing', {
                    title: "Landing page",
                    errorMessage_login: errors.array()[0].msg,
                });
            }
            let sqlQuery = `SELECT full_name, user_id, blog_title, blog_subtitle, role FROM users WHERE username = ? AND password = ?`;
            let userDetails = [req.body.username, req.body.password];
            db.get(sqlQuery, userDetails, (err, result) => {
                if (err) { 
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                if (!result) {
                    return res.render('auth/landing', {
                        title: "Landing page",
                        errorMessage_login: 'No registered user with the provided credentials',
                    });
                }
                req.session.full_name = result.full_name;
                req.session.user_id = result.user_id;
                req.session.blog_title = result.blog_title;
                req.session.blog_subtitle = result.blog_subtitle;
                req.session.save();
                if (result.role === 'author') {
                    res.redirect('/author/home');
                } else if (result.role === 'reader') {
                    res.redirect('/reader/home');
                }
            });
        });

    /** Purpose: Handles user input validation and database operations for user registration */
    app.post("/registered", [
        body('full_name', 'Name should have at least 2 characters')
            .notEmpty().withMessage('Full name is required')
            .isLength({ min: 2 }).withMessage('Full name should have at least 2 characters'),
        body('username')
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 5 }).withMessage('Username should have at least 5 characters')
            .matches(/^[a-zA-Z0-9]+$/).withMessage('Username can only contain letters and numbers; no special characters, spaces nor symbols')
            .custom((value, { req }) => {
                /** Purpose: Check if username already exists in the database */
                return new Promise((resolve, reject) => {
                    db.get("SELECT * FROM users WHERE username = ?", value, (err, row) => {
                        if (err) {
                            reject(err);
                        } else if (row) {
                            reject('Username already taken');
                        } else {
                            resolve();
                        }
                    });
                });
            }),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password should have at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/).withMessage('Password should contain at least one uppercase letter, one lowercase letter, one number, and one symbol'),
        body('role')
            .notEmpty().withMessage('Role is required')
    ], (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/register', {
                title: "Home",
                errorMessage_register: errors.array()[0].msg,
                successMessage_register: ""
            });
        }
        let sqlQuery = "INSERT INTO users (full_name, username, password, role) VALUES (?, ?, ?, ?)";
        let sqlQueryUsers = "SELECT * FROM users ORDER BY user_id DESC LIMIT 1;"
        let userDetails = [req.body.full_name, req.body.username, req.body.password, req.body.role];
        db.run(sqlQuery, userDetails, function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            db.get(sqlQueryUsers, (err, comments) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Internal Server Error');
                }
                req.session.full_name = req.body.full_name;
                req.session.user_id = req.body.user_id;
                req.session.save();
                return res.render('auth/register', {
                    title: "Home",
                    errorMessage_register: "",
                    successMessage_register: "Successfully Registered!"
                });
            });
        });
    });
}