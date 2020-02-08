// osoite: http://localhost:8080/login
// https://expressjs.com/en/starter/static-files.html




const express = require("express");
const PORT = process.env.PORT || 8080;
const body_parser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const note_schema = new Schema({
  text: {
    type: String,
    required: true
  }
});
const note_model = new mongoose.model("note", note_schema);

const user_schema = new Schema({
  name: {
    type: String,
    required: true
  },
  notes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "note",
      req: true
    }
  ]
});
const user_model = mongoose.model("user", user_schema);

let app = express();

app.use(
  body_parser.urlencoded({
    extended: true
  })
);

app.use(
  session({
    secret: "1234qwerty",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000000
    }
  })
);

let users = [];

app.use((req, res, next) => {
  console.log(`path: ${req.path}`);
  next();
});

const is_logged_handler = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

//tyylitiedoston liittäminen
app.use('/css', express.static('css'));

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  user_model
    .findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      console.log(err);
      res.redirect("login");
    });
});

app.get("/", is_logged_handler, (req, res, next) => {
  const user = req.user;
  user
    .populate("notes")
    .execPopulate()
    .then(() => {
      console.log("user:", user);
      res.write(`
        <html>
        <head>
        <link rel="stylesheet" type="text/css" href="css/style2.css">
        <meta charset="UTF-8">
        </head>
        <body>
            <div class="div_tervetuloa">
              Tervetuloa, ${user.name}
            </div>
            <div class="ylapalkki">
            <div class="div_logout"><form action="/logout" method="POST">
            <button class="logoutbtn" type="submit">Kirjaudu ulos</button>
            </form></div>
            </div> 

            <h2>Kauppalistat</h2>
            <div class="listaus">sssdd</div>

            <h2>Listan nimi</h2>
            `);
      user.notes.forEach(note => {
        res.write('<div class="noteline">'+ note.text +'</div>');
      });

      res.write(`
            <form action="/add-note" method="POST">
                <input type="text" name="note">
                <button type="submit">Lisää listaan</button>
            </form>
            
    
        </html>
        </body>
        `);
      res.end();
    });
});

app.post("/add-note", (req, res, next) => {
  const user = req.user;

  let new_note = note_model({
    text: req.body.note
  });
  new_note.save().then(() => {
    console.log("note saved");
    user.notes.push(new_note);
    user.save().then(() => {
      return res.redirect("/");
    });
  });
});

app.post("/logout", (req, res, next) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/login", (req, res, next) => {
  console.log("user: ", req.session.user);
  res.write(`
    <html>
    <head>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <meta charset="UTF-8">
    </head>
    <body>

    <div class="loota">
      <h1>Kauppalista</h1>
        <form action="/login" method="POST">
            <div class="rivi">
              <input type="text" name="user_name" autofocus>
            </div>
            <div class="rivi">
              <button type="submit">Kirjaudu sisään</button>
            </div>
        </form>
        <form action="/register" method="POST">
        <div class="rivi">
        <input type="text" name="user_name">
            </div>
            <div class="rivi">
              <button type="submit">Rekisteröidy</button>
            </div>
        </form>
    </div>
    </body>
    <html>
    `);
  res.end();
});

app.post("/login", (req, res, next) => {
  const user_name = req.body.user_name;
  user_model
    .findOne({
      name: user_name
    })
    .then(user => {
      if (user) {
        req.session.user = user;
        return res.redirect("/");
      }

      res.redirect("/login");
    });
});

app.post("/register", (req, res, next) => {
  const user_name = req.body.user_name;

  user_model
    .findOne({
      name: user_name
    })
    .then(user => {
      if (user) {
        console.log("User name already registered");
        return res.redirect("/login");
      }

      let new_user = new user_model({
        name: user_name,
        notes: []
      });

      new_user.save().then(() => {
        return res.redirect("/login");
      });
    });
});

app.use((req, res, next) => {
  res.status(404);
  res.send(`
        page not found
    `);
});

//Shutdown server CTRL + C in terminal

const mongoose_url =
  "mongodb+srv://db-user:qkv3ezg72PXk2tW@cluster0-drnpu.mongodb.net/test?retryWrites=true&w=majority";

mongoose
  .connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    console.log("Mongoose connected");
    console.log("Start Express server");
    app.listen(PORT);
  });
