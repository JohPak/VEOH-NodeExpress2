const express = require('express');
const PORT = process.env.PORT || 8080;
const body_parser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

let app = express();

app.use(body_parser.urlencoded({
    extended: true
}));

app.use(session({
    secret: '1234qwerty',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000000
    }
}));

let users = [];

app.use((req, res, next) => {
    console.log(`path: ${req.path}`);
    next();
});

const is_logged_handler = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

app.get('/', is_logged_handler, (req, res, next) => {
    const user = req.session.user;
    res.write(`
    <html>
    <body>
        Logged in as user: ${user}
        <form action="/logout" method="POST">
            <button type="submit">Log out</button>
        </form>
    </html>
    </body>
    `);
    res.end();
});

app.post('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/login', (req, res, next) => {
    console.log('user: ', req.session.user)
    res.write(`
    <html>
    <body>
        <form action="/login" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Log in</button>
        </form>
        <form action="/register" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Register</button>
        </form>
    </body>
    <html>
    `);
    res.end();
});

app.post('/login', (req, res, next) => {
    const user_name = req.body.user_name;
    let user = users.find((name) => {
        return user_name == name;
    });
    if (user) {
        console.log('User logged in: ', user);
        req.session.user = user;
        return res.redirect('/');
    }
    console.log('User name not registered: ', user);
    res.redirect('/login');
});

app.post('/register', (req, res, next) => {
    const user_name = req.body.user_name;
    let user = users.find((name) => {
        return user_name == name;
    });
    if (user) {
        return res.send('User name already registered');
    }
    users.push(user_name);
    console.log('users:', users);
    res.redirect('/login');
});

app.use((req, res, next) => {
    res.status(404);
    res.send(`
        page not found
    `);
});

//Shutdown server CTRL + C in terminal

const mongoose_url = 'mongodb+srv://db-user:qkv3ezg72PXk2tW@cluster0-drnpu.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Mongoose connected');
    console.log('Start Express server');
    app.listen(PORT);
});