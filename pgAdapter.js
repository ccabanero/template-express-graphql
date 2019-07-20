require('dotenv').config()
const pgPromise = require('pg-promise');

const pgp = pgPromise({});

const config = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

const db = pgp(config);

// test db connection via ... node pgAdaptor.js
db.one('select title from book where id=1')
.then(res => {
    console.log(res);
}, (e) => {
    console.log(e)
});

exports.db = db;