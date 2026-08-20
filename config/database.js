const mysql = require("mysql2/promise");

/**
 * Tanpa ORM, kita kelola sendiri connection pool mysql2.
 * Pool dibagi ke seluruh app lewat getPool() - jangan buat pool baru di tempat lain.
 */

let pool;

function createPool() {
    pool = mysql.createPool({
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: false,
        decimalNumbers: true, // supaya kolom DECIMAL (mis. price) balik sebagai number, bukan string
    });
    return pool;
}

/**
 * Dipanggil sekali saat server start untuk memastikan kredensial & host valid
 * sebelum aplikasi dianggap "siap" (lihat server.js).
 */
async function connectDB() {
    if (!pool) createPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return pool;
}

function getPool() {
    if (!pool) {
        throw new Error("Database pool has not been initialized. Call connectDB() first.");
    }
    return pool;
}

async function closeDB() {
    if (pool) {
        await pool.end();
    }
}

module.exports = { connectDB, getPool, closeDB };
