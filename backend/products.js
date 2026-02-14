const db = require('./database');

const createProduct = (req, res) => {
  const { supplierId, name, sku, price, stock, imageUrl, description } = req.body;
  db.run(`INSERT INTO products (supplierId, name, sku, price, stock, imageUrl, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [supplierId, name, sku, price, stock, imageUrl, description],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, message: "Product added" });
    }
  );
};

const getProductsBySupplier = (req, res) => {
  const supplierId = req.params.supplierId;
  db.all(`SELECT * FROM products WHERE supplierId = ?`, [supplierId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const searchProducts = (req, res) => {
  const { query, supplierId } = req.query;
  db.all(`SELECT * FROM products WHERE supplierId = ? AND (name LIKE ? OR sku LIKE ?)`,
    [supplierId, `%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

module.exports = { createProduct, getProductsBySupplier, searchProducts };
