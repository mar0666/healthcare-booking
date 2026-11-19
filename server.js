require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/appointments', appointmentRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
