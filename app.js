const express = require('express');
const PORT = process.env.PORT || 8080;

let app = express();

//nuolisyntaksilla käsittelijäfunktio
// next-parametri tarkoittaa "jatka vielä seuraavaankin kuuntelijaan"
app.use((req, res, next) => {
    console.log(`path: ${req.path}`);
    next();
});

app.get('/', (req, res, next) => {
    res.send(`Moro`);
    //res.write
    //res.end()
});

app.use((req, res, next) => {
    res.status(404);
    res.send('page not found');
});
//app.post()
 app.listen(PORT);
