const { getPool } = require("../config/database");

/**
 * Tanpa ORM, tidak ada Model class - "model" di sini adalah kumpulan fungsi
 * yang menjalankan raw SQL (parameterized query, aman dari SQL injection)
 * terhadap tabel `users`, plus helper kecil (buang password).
 */

const SAFE_COLUMNS = "id, name, email, role, created_at AS createdAt, updated_at AS updatedAt";

async function findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    return rows[0] || null;
}

async function findById(id) {
    const pool = getPool();
    const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
}

async function create({ name, email, password, role }) {
    const pool = getPool();
    const [result] = await pool.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role === "admin" ? "user" : role || "user"]);
    return findById(result.insertId);
}

/**
 * Buang field password dari row user sebelum dikirim ke client.
 * @param {object} user
 */
function toSafeUser(user) {
    if (!user) return user;
    const { password, ...safeUser } = user;
    return safeUser;
}

module.exports = { findByEmail, findById, create, toSafeUser };
