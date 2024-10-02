// backend/routes/filterUsers.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Route to get personal user by phone number
router.post('/personal/', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM SignUp WHERE phoneNumber = ? AND userType = 'personal'`,
      [phoneNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching personal user:', error);
    res.status(500).json({ message: 'Failed to fetch' });
  }
});

// Route to get corporate user by phone number
router.post('/corporate/', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM SignUp WHERE phoneNumber LIKE ? AND userType = 'corporate'`,
      [`%${phoneNumber}%`]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Corporate not found' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching corporate:', error);
    res.status(500).json({ message: 'Failed to fetch corporate ' });
  }
});

module.exports = router;
