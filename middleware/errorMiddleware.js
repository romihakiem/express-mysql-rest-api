const { error } = require("../utils/response");

/**
 * 404 handler - dipasang setelah semua route terdaftar.
 */
function notFound(req, res, next) {
    error(res, { statusCode: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error handler.
 * Tanpa ORM, tidak ada ValidationError otomatis - validasi input sudah
 * dilakukan manual di middleware/validate.js. Di sini kita tangani kode
 * error MySQL (mysql2) yang paling umum muncul dari raw query.
 */
function errorHandler(err, req, res, next) {
    // eslint-disable-line no-unused-vars
    console.error(err);

    // Duplicate entry (mis. email sudah terdaftar - unique key uq_users_email)
    if (err.code === "ER_DUP_ENTRY") {
        return error(res, { statusCode: 409, message: "Duplicate value for a unique field" });
    }

    // Foreign key constraint gagal (mis. owner_id tidak ada di tabel users)
    if (err.code === "ER_NO_REFERENCED_ROW" || err.code === "ER_NO_REFERENCED_ROW_2") {
        return error(res, { statusCode: 400, message: "Invalid reference (foreign key constraint)" });
    }

    // Data terlalu panjang untuk kolom (mis. VARCHAR(191) kelebihan karakter)
    if (err.code === "ER_DATA_TOO_LONG") {
        return error(res, { statusCode: 422, message: "One of the fields exceeds the allowed length" });
    }

    // Nilai tidak sesuai enum kolom (mis. status di luar 'active'/'inactive')
    if (err.code === "WARN_DATA_TRUNCATED" || err.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
        return error(res, { statusCode: 422, message: "One of the fields has an invalid value" });
    }

    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    return error(res, {
        statusCode,
        message: err.message || "Internal Server Error",
        errors: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}

module.exports = { notFound, errorHandler };
