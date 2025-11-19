const conn = require("./connection");

const Tutorial = function (val) {
    this.title = val.title;
    this.description = val.description;
    this.published = val.published;
};

Tutorial.getAll = (page, size, title, result) => {
    page = parseInt(page ?? 0);
    size = parseInt(size ?? 0);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(size) || size < 1) size = 5;

    conn.query("SELECT COUNT(*) AS total FROM tutorials", (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        let total = res[0].total;

        let sql = "SELECT * FROM tutorials";
        if (title) sql += ` WHERE title LIKE "%${title}%"`;
        sql += ` LIMIT ${size} OFFSET ${(page - 1) * size}`;

        conn.query(sql, (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            result(null, {
                pages: size,
                current: page,
                data: res,
                total: total,
            });
        });
    });
};

Tutorial.getById = (id, result) => {
    conn.query(`SELECT * FROM tutorials WHERE id = ${id}`, (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        if (res.length) {
            result(null, res[0]);
            return;
        }

        result({ kind: "not_found" }, null);
    });
};

Tutorial.getPublished = (result) => {
    conn.query("SELECT * FROM tutorials WHERE published = true", (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        result(null, res);
    });
};

Tutorial.create = (val, result) => {
    conn.query("INSERT INTO tutorials SET ?", val, (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        result(null, { id: res.insertId, ...val });
    });
};

Tutorial.update = (id, val, result) => {
    conn.query(
        "UPDATE tutorials SET title = ?, description = ?, published = ? WHERE id = ?",
        [val.title, val.description, val.published, id],
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            result(null, { id: id, ...val });
        }
    );
};

Tutorial.remove = (id, result) => {
    conn.query("DELETE FROM tutorials WHERE id = ?", id, (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }

        result(null, res);
    });
};

Tutorial.removeAll = (result) => {
    conn.query("DELETE FROM tutorials", (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        result(null, res);
    });
};

module.exports = Tutorial;
