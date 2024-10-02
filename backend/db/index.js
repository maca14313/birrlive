
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '0925090339',
    database: 'KETERO_DB',
    waitForConnections: true,
    queueLimit: 0
});

module.exports = pool;
