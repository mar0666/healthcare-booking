const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'appointments.json');

function readAppointments() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAppointments(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Feature 3: View Appointments
router.get('/', (req, res) => {
  const appointments = readAppointments();
  const { email } = req.query;
  if (email) {
    return res.json(appointments.filter((a) => a.userEmail === email.trim().toLowerCase()));
  }
  res.json(appointments);
});

// Feature 5: Appointment Reminder Notifications
router.get('/reminders', (req, res) => {
  const appointments = readAppointments();
  const { email } = req.query;
  const todayStr = new Date().toISOString().split('T');

  const reminders = appointments.filter((appt) => {
    const matchesUser = email ? appt.userEmail === email.trim().toLowerCase() : true;
    const isActive = appt.status === 'Confirmed' || appt.status === 'Rescheduled';
    return matchesUser && isActive && appt.date >= todayStr;
  });

  res.json(reminders);
});

// Feature 2: Book an Appointment
router.post('/', (req, res) => {
  const { userEmail, patientName, provider, date, time } = req.body;
  if (!patientName || !provider || !date || !time) {
    return res.status(400).json({ error: 'All appointment fields are required.' });
  }

  const appointments = readAppointments();
  const conflict = appointments.find(
    (a) =>
      a.provider === provider &&
      a.date === date &&
      a.time === time &&
      a.status !== 'Cancelled'
  );

  if (conflict) {
    return res.status(409).json({ error: 'That time slot is already booked for this provider.' });
  }

  const newAppointment = {
    id: Date.now().toString(),
    userEmail: (userEmail || 'guest@clinic.ca').trim().toLowerCase(),
    patientName: patientName.trim(),
    provider,
    date,
    time,
    status: 'Confirmed'
  };

  appointments.push(newAppointment);
  writeAppointments(appointments);
  res.status(201).json(newAppointment);
});

// Feature 4: Reschedule or Cancel an Appointment
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { date, time, status } = req.body;
  const appointments = readAppointments();
  const index = appointments.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  if (status === 'Cancelled') {
    appointments[index].status = 'Cancelled';
  } else if (date && time) {
    const conflict = appointments.find(
      (a) =>
        a.id !== id &&
        a.provider === appointments[index].provider &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Cancelled'
    );
    if (conflict) {
      return res.status(409).json({ error: 'The selected new time slot is unavailable.' });
    }
    appointments[index].date = date;
    appointments[index].time = time;
    appointments[index].status = 'Rescheduled';
  }

  writeAppointments(appointments);
  res.json(appointments[index]);
});

module.exports = router;
