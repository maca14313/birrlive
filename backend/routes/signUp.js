const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');

// Helper function to generate random id
function generateRandomId(phoneNumber) {
    const uuid = uuidv4();
    const hash = crypto.createHash('sha256').update(phoneNumber).digest('hex');
    return `${uuid}-${hash}`;
}

router.post('/', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Missing phone number' });
    }

    try {
        // Check if the phone number already exists
        const checkUserSql = 'SELECT name, phoneNumber, userType FROM SignUp WHERE phoneNumber = ?';
        const [existingUser] = await db.query(checkUserSql, [phoneNumber]);

        if (existingUser.length > 0) {
            // If user exists, return their information
            const user = existingUser[0];
            return res.status(200).json({ name: user.name, phoneNumber: user.phoneNumber, userType: user.userType });
        } else {
            // If user doesn't exist, indicate to proceed with additional information
            return res.status(200).json({ newUser: true });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        return res.status(500).json({ error: 'Failed to check user' });
    }
});

router.post('/create', async (req, res) => {
    const { name, phoneNumber, userType, dialCode } = req.body;
  console.log(name, phoneNumber, userType, dialCode)
    if (!name || !phoneNumber || !userType || !dialCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const id = generateRandomId(phoneNumber);
        const insertUserSql = 'INSERT INTO SignUp (id, name, phoneNumber, userType, dialCode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
        const values = [id, name, phoneNumber, userType, dialCode];
        await db.query(insertUserSql, values);

        // Respond with the new user's information
        return res.status(201).json({ name, phoneNumber, userType });
    } catch (error) {
        console.error('Error signing up:', error);
        console.log(error)

        return res.status(500).json({ error: 'Failed to sign up' });
    }
});

module.exports = router;
