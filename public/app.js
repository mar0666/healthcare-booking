const bookingForm = document.getElementById('booking-form');
const statusMessage = document.getElementById('status-message');
const appointmentsList = document.getElementById('appointments-list');

function showStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.color = isError ? '#b00020' : '#1b5e20';
}

async function loadAppointments() {
  try {
    const res = await fetch('/api/appointments');
    const appointments = await res.json();
    if (appointments.length === 0) {
      appointmentsList.innerHTML = '<tr><td colspan="5">No appointments scheduled yet.</td></tr>';
      return;
    }
    appointmentsList.innerHTML = appointments.map((appt) => `
      <tr>
        <td>${appt.patientName}</td>
        <td>${appt.provider}</td>
        <td>${appt.date}</td>
        <td>${appt.timeSlot}</td>
        <td><span class="badge">${appt.status}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    appointmentsList.innerHTML = '<tr><td colspan="5">Failed to load appointments.</td></tr>';
  }
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    patientName: document.getElementById('patientName').value,
    provider: document.getElementById('provider').value,
    date: document.getElementById('date').value,
    timeSlot: document.getElementById('timeSlot').value
  };
  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return showStatus(data.message, true);
    showStatus(data.message, false);
    bookingForm.reset();
    loadAppointments();
  } catch (error) {
    showStatus('Could not connect to the server.', true);
  }
});

loadAppointments();
