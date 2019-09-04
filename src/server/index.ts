const http = require('http');
import * as Express from 'express';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as https from 'https';
//setup
let app = Express();
app.use(bodyParser.json({type:'*/*',limit:'50mb'}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000"); //allow backend access when using the dev server
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/api/proxy', function (req, res, next) {
    let url: string = req.query.url;
    delete req.query.url;
    console.log(url);
    url += '?'+Object.keys(req.query).map(x=>`${x}=${req.query[x]}`).join('&');
    console.log(url);
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            res.send(data);
        });
    }).on("error", (err) => {
        console.log(err.message);
        res.status(500).send();
    });
});

//file related
app.get('/api/files', function (req, res, next) {
    let name: string = req.query.name;
    let list: boolean = req.query.list==='true';
    if(list == false && (typeof name != 'string' || !(/^[a-zA-Z0-9_\-]+\.json$/.test(name)))){
        res.status(400).send('Invalid file name provided');
        return;
    }
    if(list){
        res.send(JSON.stringify(fs.readdirSync(`data`)));
    } else {
        try {
            res.send(fs.readFileSync(`data/${name}`).toString());
        } catch(e){
            res.status(404).send('File not found');
        }
    }
});
app.post('/api/files', function (req, res, next) {
    let name: string = req.body.name;
    let body: string = req.body.body;
    if(typeof name != 'string' || !(/^[a-zA-Z0-9_\-]+\.json$/.test(name))){
        res.status(400).send('Invalid file name provided');
        return;
    }
    if(typeof body != 'string'){
        res.status(400).send('Invalid file body provided');
        return;
    }
    try {
        fs.writeFileSync(`data/${name}`,body);
        res.status(200).send();
    } catch(e){
        console.log(e);
        res.status(500).send();
    }
});


//static server setup
app.use(Express.static('build/client'));

//start server
http.createServer(app).listen(8081);
console.log('Server is running on Port: 8081');
