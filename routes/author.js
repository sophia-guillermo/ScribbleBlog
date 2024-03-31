module.exports = function (app) {
    /** Purpose: Middleware that handles and manages access control */
    const authorizeUser = (req, res, next) => {
        const isAuthenticated = req.session.user_id !== undefined;
        if (isAuthenticated) {
            next();
        } else {
            res.redirect('/');
        }
    };

    /**
    URL: localhost:8000/author/home
    Purpose: Rendering author's home page display
    */
    app.get('/author/home', authorizeUser, (req, res) => {
        let full_name = req.session.full_name;
        let user_id = req.session.user_id;
        let sqlQuery = `SELECT articles.*, users.blog_title, users.blog_subtitle 
                    FROM articles
                    INNER JOIN users ON articles.user_id = users.user_id
                    WHERE users.user_id = ?
                    ORDER BY articles.creation DESC`;
        db.all(sqlQuery, [user_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            } else {
                if (result.length === 0) {
                    res.render('author/home', {
                        title: "Home",
                        full_name: full_name,
                        blog_title: req.session.blog_title,
                        blog_subtitle: req.session.blog_subtitle,
                        articles: []
                    });
                } else {
                    req.session.blog_title = result[0].blog_title;
                    req.session.blog_subtitle = result[0].blog_subtitle;
                    req.session.save();
                    res.render('author/home', {
                        title: "Home",
                        full_name: full_name,
                        blog_title: req.session.blog_title,
                        blog_subtitle: req.session.blog_subtitle,
                        articles: result
                    });
                }
            }
        });
    });

    /**
    URL: localhost:8000/author/settings
    Purpose: Rendering author's settings page display
    */
    app.get('/author/settings', authorizeUser, (req, res) => {
        let full_name = req.session.full_name;
        let blog_title = req.session.blog_title;
        let blog_subtitle = req.session.blog_subtitle;
        req.session.save();
        res.render('author/settings', {
            title: "Settings",
            full_name: full_name,
            successMessage_settings: "",
            blog_title: blog_title,
            blog_subtitle: blog_subtitle
        })
    });

    /** Purpose: Redirects user back to home page with updated blog title and subtitle displayed */
    app.post("/blogSaved", (req, res) => {
        let user_id = req.session.user_id;
        let sqlQuery = "UPDATE users SET blog_title = ? , blog_subtitle = ? WHERE user_id = ?";
        let details = [req.body.blog_title, req.body.blog_subtitle, user_id]
        db.run(sqlQuery, details, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            req.session.blog_title = req.body.blog_title;
            req.session.blog_subtitle = req.body.blog_subtitle;
            req.session.save();
            res.redirect('/author/home');
        });
    });

    /** Purpose: Redirects user back to home page with dynamic population of newly created article */
    app.post("/createDraft", (req, res) => {
        let user_id = req.session.user_id;
        let sqlQuery = "INSERT INTO articles(user_id, title, subtitle, article_body, status, creation, likes) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, 0)";
        let details = [user_id, req.body.title, req.body.subtitle, req.body.article_body]
        db.run(sqlQuery, details, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/author/home');
        });
    });

    /** Purpose: Redirects user back to home page with dynamic population of edited article */
    app.post("/editDraft/:article_id", (req, res) => {
        let article_id = req.params.article_id;
        let sqlQuery = "UPDATE articles SET title = ? , subtitle = ?, article_body = ?, last_modified = CURRENT_TIMESTAMP WHERE article_id = ?";
        let details = [req.body.title, req.body.subtitle, req.body.article_body, article_id]
        db.run(sqlQuery, details, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/author/home');
        });
    });

    /** Purpose: Handles publishing of article with UPDATE query*/
    app.post("/publish/:article_id", (req, res) => {
        let article_id = req.params.article_id;
        let sqlQuery = "UPDATE articles SET status = 1, published = CURRENT_TIMESTAMP WHERE article_id = ?";
        db.run(sqlQuery, article_id, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/author/home');
        });
    });

    /** Purpose: Handles deleting of articles*/
    app.post("/delete/:article_id", (req, res) => {
        let article_id = req.params.article_id;
        // SELECT statement to count the likes and comments count for the article the author wants to delete
        let selectQuery = "SELECT COUNT(*) as like_count, (SELECT COUNT(*) FROM comments WHERE article_id = ?) as comment_count FROM articles WHERE article_id = ?";
        db.get(selectQuery, [article_id, article_id], (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            // If the count tally for likes and comments are 0, proceed to DELETE article
            if (result.like_count === 0 && result.comment_count === 0) {
                let deleteQuery = "DELETE FROM articles WHERE article_id = ?";
                db.run(deleteQuery, article_id, (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Internal Server Error');
                    }
                    res.redirect('/author/home');
                });
            } else {
                /**
                [The following steps are done to prevent FOREIGN KEY constraints errors]
                If either one of the count tally are not 0,
                1. DELETE all existing comment records associated with the article
                2. UPDATE the likes field for the associated article to 0
                3. Finally, DELETE the article
                 */
                let deleteCommentsQuery = "DELETE FROM comments WHERE article_id = ?";
                db.run(deleteCommentsQuery, article_id, (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Internal Server Error');
                    }
                    let resetLikesQuery = "UPDATE articles SET likes = 0 WHERE article_id = ?";
                    db.run(resetLikesQuery, article_id, (err) => {
                        if (err) {
                            console.error(err.message);
                            return res.status(500).send('Internal Server Error');
                        }
                        let deleteArticleQuery = "DELETE FROM articles WHERE article_id = ?";
                        db.run(deleteArticleQuery, article_id, (err) => {
                            if (err) {
                                console.error(err.message);
                                return res.status(500).send('Internal Server Error');
                            }
                            res.redirect('/author/home');
                        });
                    });
                });
            }
        });
    });

    /** Purpose: Clears session data and logs user out */
    app.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/');
        });
    });
}