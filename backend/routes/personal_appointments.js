// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Route to create a new appointment
// Route to create a new appointment
router.post('/create/personal', async (req, res) => {
  console.log('personal');

  function convertTo24HourFormat(time) {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');

    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else {
      hours = modifier === 'PM' ? (parseInt(hours, 10) + 12).toString() : hours.padStart(2, '0');
    }

    return `${hours}:${minutes}:00`;
  }

  const { aTitle, aDesc, aDate, aTime, rDate, rTime, aLocation, appointmentCreator, pendingParticipants } = req.body;
  const aTime24 = convertTo24HourFormat(aTime);
  const rTime24 = convertTo24HourFormat(rTime);

  console.log(aTitle, aDesc, aDate, aTime24, rDate, rTime24, aLocation, appointmentCreator, pendingParticipants);

  try {
    const [result] = await pool.query(
      `INSERT INTO Appointments (Title, Description, ADate, ATime, RDate, RTime, ALocation, AppointmentCreator, PendingParticipants, AppointmentsType) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [aTitle, aDesc, aDate, aTime24, rDate, rTime24, aLocation, appointmentCreator, JSON.stringify(pendingParticipants), 'personal']
    );

    const appointmentId = result.insertId;

    for (const phoneNumber of pendingParticipants) {
      await pool.query(
        `UPDATE SignUp 
         SET PAppointments = JSON_ARRAY_APPEND(COALESCE(PAppointments, '[]'), '$', ?) 
         WHERE phoneNumber = ?`,
        [appointmentId, phoneNumber]
      );
    }

    // Add pendingParticipants phone numbers to userContacts of appointmentCreator
    const [appointmentCreatorResult] = await pool.query(
      `SELECT userContacts FROM SignUp WHERE phoneNumber = ?`,
      [appointmentCreator]
    );

    if (appointmentCreatorResult.length > 0) {
      let userContacts = [];
      const userContactsRaw = appointmentCreatorResult[0].userContacts;

      if (userContactsRaw && typeof userContactsRaw === 'string' && userContactsRaw.trim() !== '') {
        try {
          userContacts = JSON.parse(userContactsRaw);
        } catch (e) {
          console.error('Error parsing userContacts:', e);
          userContacts = [];
        }
      }

      const newContacts = pendingParticipants.filter(phoneNumber => !userContacts.includes(phoneNumber)); // Filter new contacts

      if (newContacts.length > 0) {
        const updatedContacts = Array.from(new Set([...userContacts, ...newContacts])); // Ensure unique contacts

        await pool.query(
          `UPDATE SignUp 
           SET userContacts = ? 
           WHERE phoneNumber = ?`,
          [JSON.stringify(updatedContacts), appointmentCreator]
        );
      }
    }

    res.status(201).json({ message: 'Appointment created successfully', appointmentId });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});




// Route to get personal appointments for a specific user
router.post('/user-personal-p-appointments', async (req, res) => {
  const { phoneNumber } = req.body;
  console.log(phoneNumber,'lllllllllll');

  try {
    // Get the PAppointments for the user from the SignUp table
    const [userResult] = await pool.query(
      `SELECT PAppointments FROM SignUp WHERE phoneNumber = ?`,
      [phoneNumber]
    );
console.log(userResult[0].PAppointments)

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'not found' });
    }

    let pAppointments = userResult[0].PAppointments;
    

    if (!pAppointments) {
      return res.status(200).json({ appointments: [] });
    }

    // Parse the PAppointments to get the array of appointment IDs
    try {
      //pAppointments = pAppointments;
      pAppointments = pAppointments ? typeof pAppointments === 'string' || null ? JSON.parse(pAppointments) : pAppointments : [];

    } catch (error) {
      console.error('Error parsing PAppointments:', error);
      return res.status(500).json({ message: 'not found' });
    }

    if (!Array.isArray(pAppointments) || pAppointments.length === 0) {

      return res.status(200).json({ appointments: [] });
    }

    // Get the personal appointment details from the Appointments table
    const [appointments] = await pool.query(
      `SELECT * FROM Appointments WHERE id IN (?) AND AppointmentsType = 'personal'`,
      [pAppointments]
    );

    for (let appointment of appointments) {
      let pendingParticipants = appointment.PendingParticipants;
      pendingParticipants = pendingParticipants ? typeof pendingParticipants === 'string' || null ? JSON.parse(pendingParticipants) : pendingParticipants : [];

      const [users] = await pool.query(
        `SELECT name, phoneNumber, img FROM SignUp WHERE phoneNumber IN (?)`,
        [pendingParticipants]
      );
      
      appointment.PendingParticipantsData = users;
    }

    for (let appointment of appointments) {
      let pendingParticipants = appointment.AppointmentCreator;
      //pendingParticipants = pendingParticipants ? typeof pendingParticipants === 'string' || null ? JSON.parse(pendingParticipants) : pendingParticipants : [];

      const [users] = await pool.query(
        `SELECT name, phoneNumber, img FROM SignUp WHERE phoneNumber = (?)`,
        [pendingParticipants]
      );
      console.log(users)
      appointment.AppointmentCreatorData = users;
    }

    console.log(appointments)

    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error retrieving user appointments:', error);
    res.status(500).json({ message: 'Failed to retrieve user appointments' });
  }
});


// Route to move  from PendingParticipants to Participants
router.post('/from-pending-participants-to-participants', async (req, res) => {
  const { appointmentId, phoneNumber } = req.body;
  console.log('Received request:', appointmentId, phoneNumber);

  try {
    // Get the appointment details
    const [appointmentResult] = await pool.query(
      `SELECT PendingParticipants, Participants FROM Appointments WHERE id = ?`,
      [appointmentId]
    );

    if (appointmentResult.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    let { PendingParticipants, Participants } = appointmentResult[0];

    console.log('Raw PendingParticipants from DB:', PendingParticipants);
    console.log('Raw Participants from DB:', Participants); 
    

    // Parse the JSON fields
    try {
      PendingParticipants = PendingParticipants ? typeof PendingParticipants === 'string' || null ? JSON.parse(PendingParticipants) : PendingParticipants : [];
    } catch (error) {
      console.error('Error parsing PendingParticipants:', error);
      PendingParticipants = [];
    }

    try {
      
        Participants = Participants ? typeof Participants === 'string' || null ? JSON.parse(Participants) : Participants : [];
      

    } catch (error) {
      console.error('Error parsing Participants:', error);
      Participants = [];
    }

    console.log('Parsed PendingParticipants:', PendingParticipants);
    console.log('Parsed Participants:', Participants);

    // Remove the phone number from PendingParticipants
    const pendingIndex = PendingParticipants.indexOf(phoneNumber);
    if (pendingIndex > -1) {
      PendingParticipants.splice(pendingIndex, 1);
    }

    // Add the phone number to Participants if it's not already there
    if (!Participants.includes(phoneNumber)) {
      Participants.push(phoneNumber);
    }

    console.log('Updated PendingParticipants:', PendingParticipants);
    console.log('Updated Participants:', Participants);

    // Update the appointment in the database
    await pool.query(
      `UPDATE Appointments 
       SET PendingParticipants = ?, Participants = ? 
       WHERE id = ?`,
      [JSON.stringify(PendingParticipants), JSON.stringify(Participants), appointmentId]
    );

    // Get the user details from SignUp table
    const [userResult] = await pool.query(
      `SELECT PAppointments, Appointments FROM SignUp WHERE phoneNumber = ?`,
      [phoneNumber]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let { PAppointments, Appointments } = userResult[0];

    console.log('Raw PAppointments from DB:', PAppointments);
    console.log('Raw Appointments from DB:', Appointments);

    // Parse the JSON fields
    try {
      PAppointments = PAppointments ? typeof PAppointments === 'string' || null ? JSON.parse(PAppointments) : PAppointments : [];

    } catch (error) {
      console.error('Error parsing PAppointments:', error);
      PAppointments = [];
    }

    try {
      Appointments = Appointments ? typeof Appointments === 'string' || null ? JSON.parse(Appointments) : Appointments : [];

      
    
    } catch (error) {
      console.error('Error parsing Appointments:', error);
      Appointments = [];
    }

    console.log('Parsed PAppointments:', PAppointments);
    console.log('Parsed Appointments:', Appointments);

    // Remove the appointmentId from PAppointments
    const pIndex = PAppointments.indexOf(appointmentId);
    if (pIndex > -1) {
      PAppointments.splice(pIndex, 1);
    }

    // Add the appointmentId to Appointments if it's not already there
    if (!Appointments.includes(appointmentId)) {
      Appointments.push(appointmentId);
    }

    console.log('Updated PAppointments:', PAppointments);
    console.log('Updated Appointments:', Appointments);

    // Update the user in the database
    await pool.query(
      `UPDATE SignUp 
       SET PAppointments = ?, Appointments = ? 
       WHERE phoneNumber = ?`,
      [JSON.stringify(PAppointments), JSON.stringify(Appointments), phoneNumber]
    );

    res.status(200).json({ message: 'appointment approved successfully' });
  } catch (error) {
    console.error('Error updating participants and user appointments:', error);
    res.status(500).json({ message: 'Failed to approve appointment' });
  }
});




// Route to from PendingParticipants

router.post('/remove-from-pending-participants', async (req, res) => {
  const { appointmentId, phoneNumber } = req.body;
  console.log(appointmentId, phoneNumber,'remove');

  try {
    // Get the appointment details
    const [appointmentResult] = await pool.query(
      `SELECT PendingParticipants FROM Appointments WHERE id = ?`,
      [appointmentId]
    );

    if (appointmentResult.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    let { PendingParticipants } = appointmentResult[0];

    // Parse the JSON fields
    PendingParticipants = PendingParticipants ? typeof PendingParticipants === 'string' || null ? JSON.parse(PendingParticipants) : PendingParticipants : [];
    
    // Remove the phone number from PendingParticipants
    const pendingIndex = PendingParticipants.indexOf(phoneNumber);
    if (pendingIndex > -1) {
      PendingParticipants.splice(pendingIndex, 1);
    }

    // Update the appointment in the database
    await pool.query(
      `UPDATE Appointments 
       SET PendingParticipants = ? 
       WHERE id = ?`,
      [JSON.stringify(PendingParticipants), appointmentId]
    );

    // Get the user details from SignUp table
    const [userResult] = await pool.query(
      `SELECT PAppointments FROM SignUp WHERE phoneNumber = ?`,
      [phoneNumber]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let { PAppointments } = userResult[0];

    // Parse the JSON fields

    PAppointments = PAppointments ? typeof PAppointments === 'string' || null ? JSON.parse(PAppointments) : PAppointments : [];

  
    // Remove the appointmentId from PAppointments
    const pIndex = PAppointments.indexOf(appointmentId);
    if (pIndex > -1) {
      PAppointments.splice(pIndex, 1);
    }

    // Update the user in the database
    await pool.query(
      `UPDATE SignUp 
       SET PAppointments = ? 
       WHERE phoneNumber = ?`,
      [JSON.stringify(PAppointments), phoneNumber]
    );

    res.status(200).json({ message: 'Pending participant removed successfully' });
  } catch (error) {
    console.error('Error removing pending participant:', error);
    res.status(500).json({ message: 'Failed to remove pending participant' });
  }
});

// Route to get personal appointments for a specific user using Appointments field

router.post('/user-personal-appointments', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Get the Appointments for the user from the SignUp table
    const [userResult] = await pool.query(
      `SELECT Appointments FROM SignUp WHERE phoneNumber = ?`,
      [phoneNumber]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const appointmentsField = userResult[0].Appointments;

    if (!appointmentsField) {
      return res.status(200).json({ appointments: [] });
    }

    // Parse the Appointments to get the array of appointment IDs
    const appointmentIds = JSON.parse(appointmentsField);

    if (appointmentIds.length === 0) {
      return res.status(200).json({ appointments: [] });
    }

    // Get the personal appointment details from the Appointments table
    const [appointments] = await pool.query(
      `SELECT * FROM Appointments WHERE id IN (?) AND AppointmentsType = 'personal'`,
      [appointmentIds]
    );

   
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error retrieving user appointments:', error);
    res.status(500).json({ message: 'Failed to retrieve user appointments' });
  }
});



router.post('/fetch-creator-personal-appointments', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Get the appointments where the phoneNumber is the AppointmentCreator
    const [appointments] = await pool.query(
      `SELECT * FROM Appointments WHERE AppointmentCreator = ? AND AppointmentsType = 'personal' AND PendingParticipants IS NOT NULL AND JSON_LENGTH(PendingParticipants) > 0 `,
      [phoneNumber]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found' });
    }

    for (let appointment of appointments) {
      let pendingParticipants = appointment.PendingParticipants;
      pendingParticipants = pendingParticipants ? typeof pendingParticipants === 'string' || null ? JSON.parse(pendingParticipants) : pendingParticipants : [];

      const [users] = await pool.query(
        `SELECT name, phoneNumber, img FROM SignUp WHERE phoneNumber IN (?)`,
        [pendingParticipants]
      );
      
      appointment.PendingParticipantsData = users;
    }

    for (let appointment of appointments) {
      if(appointment.Participants != null && appointment.Participants !=[]){
        let pendingParticipants = appointment.Participants;
        console.log(appointment.Participants)
        pendingParticipants = pendingParticipants ? typeof pendingParticipants === 'string' || null ? JSON.parse(pendingParticipants) : pendingParticipants : [];
  
        const [users] = await pool.query(
          `SELECT name, phoneNumber, img FROM SignUp WHERE phoneNumber IN (?)`,
          [pendingParticipants]
        );
        
        appointment.ParticipantsData= users;
      }else{
        appointment.ParticipantsData= [];
      }
      
    }

    

console.log(appointments)
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

module.exports = router;
