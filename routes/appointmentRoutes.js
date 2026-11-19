const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'appointments.json');

function readAppointments() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAppointments(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

router.post('/', (req, res) => {
  const { patientName, provider, date, timeSlot } = req.body;
  if (!patientName || !provider || !date || !timeSlot) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const appointments = readAppointments();
  const conflict = appointments.find(
    (a) => a.provider === provider && a.date === date && a.timeSlot === timeSlot
  );

  if (conflict) {
    return res.status(409).json({
      message: 'This time slot is already booked. Please choose another time.'
    });
  }

  const newAppointment = {
    id: Date.now().toString(),
    patientName,
    provider,
    date,
    timeSlot,
    status: 'Confirmed'
  };

  appointments.push(newAppointment);
  writeAppointments(appointments);

  return res.status(201).json({
    message: 'Appointment booked successfully!',
    appointment: newAppointment
  });
});

router.get('/', (req, res) => {
  const appointments = readAppointments();
  return res.status(200).json(appointments);
});

module.exports = router;
