const Tutorial = require("../models/tutorial");

// Display all resources from storage.
exports.findAll = (req, res) => {
    const title = req.query.title;
    const page = req.query.page;
    const size = req.query.size;

    Tutorial.getAll(page, size, title, (err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Error retrieving data.",
            });
        else res.send(data);
    });
};

// Display the specified resource.
exports.findOne = (req, res) => {
    Tutorial.getById(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Data not found with id ${req.params.id}.`,
                });
            } else {
                res.status(500).send({
                    message: `Error retrieving data with id ${req.params.id}.`,
                });
            }
        } else res.send(data);
    });
};

// Display all published resources.
exports.findPublished = (req, res) => {
    Tutorial.getPublished((err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Error retrieving data.",
            });
        else res.send(data);
    });
};

// Store a newly created resource in storage.
exports.create = (req, res) => {
    if (!req.body.title) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return;
    }

    const val = new Tutorial({
        title: req.body.title,
        description: req.body.description,
        published: req.body.published || false,
    });

    Tutorial.create(val, (err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Error creating data.",
            });
        else res.send({ message: "Successfully created.", data: data });
    });
};

// Update the specified resource in storage.
exports.update = (req, res) => {
    if (!req.body.title) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return;
    }

    Tutorial.update(req.params.id, new Tutorial(req.body), (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Data not updated with id ${req.params.id}.`,
                });
            } else {
                res.status(500).send({
                    message: `Error updating data with id ${req.params.id}.`,
                });
            }
        } else res.send({ message: "Successfully updated.", data: data });
    });
};

// Remove the specified resource from storage.
exports.delete = (req, res) => {
    Tutorial.remove(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Data not deleted with id ${req.params.id}.`,
                });
            } else {
                res.status(500).send({
                    message: `Error deleting data with id ${req.params.id}.`,
                });
            }
        } else res.send({ message: "Successfully deleted." });
    });
};

// Remove all resources from storage.
exports.deleteAll = (req, res) => {
    Tutorial.removeAll((err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Error deleting data.",
            });
        else res.send({ message: "Successfully deleted." });
    });
};
