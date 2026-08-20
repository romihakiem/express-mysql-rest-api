require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

/**
 * Migration runner sederhana tanpa ORM/CLI tambahan.
 * Menjalankan sql/schema.sql apa adanya terhadap database yang dituju.
 * Untuk proyek production yang butuh versioning migration bertahap,
 * pertimbangkan tool seperti db-migrate atau Flyway - ini cukup untuk skeleton.
 */
async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true, // dibutuhkan karena schema.sql berisi banyak statement
    });

    try {
        const dbName = process.env.DB_NAME;
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.changeUser({ database: dbName });

        const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
        await connection.query(schemaSql);

        console.log(`✅ Migration completed. Database "${dbName}" is up to date.`);
    } finally {
        await connection.end();
    }
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
