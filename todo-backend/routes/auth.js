const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const router = express.Router();

router.post('/register', async (req, res) => {
 const { firstName, lastName, phone, email, password } = req.body;
  
 if (!firstName || !lastName || !phone || !email || !password) {
   return res.status(400).json({ error: 'All fields are required' });
 }

 try {
   const hashedPassword = await bcrypt.hash(password, 10);

   const sql = `
  INSERT INTO users (first_name, last_name, phone, email, password)
  VALUES (?, ?, ?, ?, ?)
`;

db.query(sql, [firstName, lastName, phone, email, hashedPassword], (err, result) => {
  if (err) {
    console.error('Error inserting user: ', err);
    return res.status(500).json({ error: err.message });
  }
  res.status(201).json({ message: 'User registered successfully!' });
});

  
 } catch (error) {
   res.status(500).json({ error: 'Server error during registration' });
 }
});



router.post('/login', (req, res) => {
 const { email, password } = req.body;

 if (!email || !password) {
   return res.status(400).json({ error: 'Email and password are required' });
 }

 const sql = 'SELECT * FROM users WHERE email = ?';
 db.query(sql, [email], async (err, results) => {
   if (err) return res.status(500).json({ error: err.message });
   if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

   const user = results[0];
   const isValid = await bcrypt.compare(password, user.password);

   if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

   // Generate a JWT token with the user's id
   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

   res.json({ 
     message: 'Login successful!', 
     token, 
     user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
   });
 });
});

router.get('/user/details', async (req, res) => {
  const userId = req.user.id; // Assuming the user id is stored in the token payload

  try {
    const sql = 'SELECT first_name, last_name, email FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch user details' });
      }
      if (result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result[0]);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
