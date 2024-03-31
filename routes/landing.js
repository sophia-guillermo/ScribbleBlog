module.exports = function (app) {
    /**
    URL: localhost:8000/
    Purpose: Rendering Landing page display
    */
    app.get("/", (req, res) => {
        res.render("auth/landing", {
            title: "ScribbleBlog",
            errorMessage_login: "",
        });
    });

    /**
    URL: localhost:8000/register
    Purpose: Rendering Registration page display
    */
    app.get("/register", function (req, res) {
        res.render("auth/register", {
            title: "Home",
            errorMessage_register: "",
            successMessage_register: ""
        });
    });
}