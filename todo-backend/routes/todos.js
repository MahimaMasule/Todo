const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const router = express.Router();

// Middleware for token verification
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get All Todos
router.get('/', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM todos WHERE user_id = ?';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add a Todo
router.post('/', verifyToken, (req, res) => {
  const { task } = req.body;
  const sql = 'INSERT INTO todos (user_id, task) VALUES (?, ?)';
  db.query(sql, [req.user.id, task], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Todo added successfully!' });
  });
});

// Update a Todo
router.put('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { task, completed } = req.body;
  const sql = 'UPDATE todos SET task = ?, completed = ? WHERE id = ? AND user_id = ?';
  db.query(sql, [task, completed, id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Todo updated successfully!' });
  });
});

// Delete a Todo
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM todos WHERE id = ? AND user_id = ?';
  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Todo deleted successfully!' });
  });
});

module.exports = router;
