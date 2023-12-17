const http = require('http');
const express = require('express')
const app = express();
const ejs = require('ejs')
const path = require("path");
const bodyParser = require("body-parser");
const webServer = http.createServer(app);
const portNumber = process.argv[2];
const axios = require('axios');

webServer.listen(portNumber, () => {
    console.log('Stop to shutdown the server: ');
});
process.stdin.setEncoding('utf8');
console.log(`Server is running at http://localhost:${portNumber}/`);
process.stdin.on('data', (input) => {
    const command = input.trim();

    if (command === 'stop') {
        console.log('Shutting down the server');
        process.exit(0);
    }
});

require("dotenv").config({ path: path.resolve(__dirname, 'public/.env') })
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = { db: "Task_Manager", collection: "users" };
const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get('/', (request, response) => {
    response.render("index");
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.post('/accountcreated', async (request, response) => {
    const username = request.body.username;
    const password = request.body.password;

    const variables = {
        username: username,
        password: password,
    };
    let user = { username: username, password: password };
    await insertUser(client, databaseAndCollection, user).catch(console.error);
    response.render("accountcreated", variables);
});

async function insertUser(client, databaseAndCollection, newUser) {
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newUser);
    } catch (e) {
        console.error(e);

    } finally {
        await client.close();
    }
}

async function validateUser(req, res, next) {
    const username = req.body.siusername;
    const password = req.body.sipassword;

    try {
        await client.connect();
        const user = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne({username: username});
        if (user && user.password === password) { 
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}

app.post('/tasks', validateUser, async (req, res) => {
    res.render("tasks");
});

app.get('/tasks/audio', async (req, res) => {
    const options = {
        method: 'GET',
        url: 'https://text-to-speech27.p.rapidapi.com/speech',
        params: {
            text: 'You want to give me an A+ for this project. You want to give me an A+ for this project. You want to give me an A+ for this project. You want to give me an A+ for this project.',
            lang: 'en-us'
        },
        headers: {
            'X-RapidAPI-Key': 'ab3e46cd51mshbf16882b65a4f97p1cf259jsn323547357e47',
            'X-RapidAPI-Host': 'text-to-speech27.p.rapidapi.com'
        },
        responseType: 'stream' // Add this to get the response as a stream
    };

    try {
        const response = await axios.request(options);
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Disposition', 'inline');
        response.data.pipe(res);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});
