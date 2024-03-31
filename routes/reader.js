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
    URL: localhost:8000/reader/home
    Purpose: Rendering reader's home page display
    */
    app.get('/reader/home', authorizeUser, (req, res) => {
        let full_name = req.session.full_name;
        let sqlQuery = `SELECT articles.*, users.full_name, STRFTIME('%d/%m/%Y %H:%M', published) as formatted_published
                        FROM articles 
                        INNER JOIN users ON articles.user_id = users.user_id 
                        WHERE status = 1 ORDER BY articles.published DESC`;
        db.all(sqlQuery, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            } else {
                res.render('reader/home', {
                    website_title: "Home",
                    full_name: full_name,
                    articles: result,
                });
            }
        });
    });

    /**
    URL: localhost:8000/reader/article/2
    Purpose: Rendering the individual article display
    */
    app.get("/reader/article/:article_id", authorizeUser, (req, res) => {
        let article_id = req.params.article_id;
        let full_name = req.session.full_name;
        console.log(article_id);
        let sqlQuery = "SELECT articles.*, STRFTIME('%d/%m/%Y', articles.published) as formatted_published, users.full_name FROM articles INNER JOIN users ON articles.user_id = users.user_id WHERE article_id = ?";
        let commentsQuery = "SELECT comments.*, users.full_name, (substr(full_name, 1, 1) || '.' || CASE WHEN instr(full_name, ' ') > 0 THEN substr(full_name, instr(full_name, ' ') + 1, 1) || '.' ELSE '' END) as user_initials, STRFTIME('%d/%m/%Y %H:%M', posted) as formatted_posted FROM comments INNER JOIN users ON comments.user_id = users.user_id WHERE article_id = ? ORDER BY formatted_posted DESC";
        db.get(sqlQuery, article_id, (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            if (!result) {
                return res.status(404).send('Article not found');
            }
            db.all(commentsQuery, article_id, (err, comments) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Internal Server Error');
                }
                res.render('reader/article', {
                    website_title: "Article",
                    full_name: full_name,
                    article_id: req.params.article_id,
                    article_title: result.title,
                    author_name: result.full_name,
                    article_subtitle: result.subtitle,
                    article_body: result.article_body,
                    article_published: result.formatted_published,
                    likes: result.likes,
                    comments: comments
                });
            });
        });
    });

    /** Purpose: Redirects user back to individual article page with newly posted comment displayed */ 
    app.post("/reader/article/:article_id",authorizeUser, (req, res) => {
        let article_id = req.params.article_id;
        let user_id = req.session.user_id;
        let sqlQuery = "INSERT INTO comments(article_id, user_id, comment_body, posted) VALUES(?, ?, ?, CURRENT_TIMESTAMP)";
        let details = [article_id, user_id, req.body.comment_body];
        db.run(sqlQuery, details, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect(`/reader/article/${article_id}`);
        });
    });

    /** Purpose: Redirects user back to individual article page with like counter incremented */ 
    app.post('/toggle-like/:article_id', authorizeUser, (req, res) => {
        const article_id = req.params.article_id;
        const updateQuery = `UPDATE articles SET likes = likes + 1 WHERE article_id = ?`;
        db.run(updateQuery, [article_id], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect(`/reader/article/${article_id}`);
        });
    });

    /** Purpose: Redirects user back to individual article page with like counter decremented */ 
    app.post('/toggle-dislike/:article_id', authorizeUser, (req, res) => {
        const article_id = req.params.article_id;
        const updateQuery = `UPDATE articles SET likes = likes - 1 WHERE article_id = ?`;
        db.run(updateQuery, [article_id], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect(`/reader/article/${article_id}`);
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
