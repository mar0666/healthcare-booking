let currentUser = JSON.parse(localStorage.getItem('hc_user')) || null;

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const userNav = document.getElementById('userNav');
const welcomeText = document.getElementById('welcomeText');
const alertBox = document.getElementById('alertBox');

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 4500);
}

function updateView() {
  if (currentUser) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userNav.classList.remove('hidden');
    welcomeText.textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('patientName').value = currentUser.name;
    loadAppointments();
    loadReminders();
  } else {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userNav.classList.add('hidden');
  }
}

// Feature 1: Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value
  };

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return showAlert(data.error);

  currentUser = data.user;
  localStorage.setItem('hc_user', JSON.stringify(currentUser));
  showAlert('Account created and logged in.');
  updateView();
});

// Feature 1: Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return showAlert(data.error);

  currentUser = data.user;
  localStorage.setItem('hc_user', JSON.stringify(currentUser));
  showAlert('Logged in successfully.');
  updateView();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('hc_user');
  updateView();
});

// Feature 2: Book Appointment
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    userEmail: currentUser.email,
    patientName: document.getElementById('patientName').value,
    provider: document.getElementById('provider').value,
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value
  };

  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return showAlert(data.error);

  showAlert('Appointment confirmed.');
  loadAppointments();
  loadReminders();
});

// Feature 3 & Feature 4: View, Reschedule & Cancel Appointments
async function loadAppointments() {
  const res = await fetch(`/api/appointments?email=${encodeURIComponent(currentUser.email)}`);
  const appointments = await res.json();
  const tbody = document.getElementById('appointmentsTableBody');
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No appointments scheduled yet.</td></tr>';
    return;
  }

  appointments.forEach((appt) => {
    const tr = document.createElement('tr');
    const isCancelled = appt.status === 'Cancelled';
    tr.innerHTML = `
      <td>${appt.patientName}</td>
      <td>${appt.provider}</td>
      <td>${appt.date}</td>
      <td>${appt.time}</td>
      <td><strong>${appt.status}</strong></td>
      <td>
        ${
          isCancelled
            ? '—'
            : `<button type="button" class="btn btn-primary btn-small" onclick="rescheduleAppt('${appt.id}')">Reschedule</button>
               <button type="button" class="btn btn-danger btn-small" onclick="cancelAppt('${appt.id}')">Cancel</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Feature 4: Reschedule
window.rescheduleAppt = async function (id) {
  const newDate = prompt('Enter new date (YYYY-MM-DD):');
  if (!newDate) return;
  const newTime = prompt('Enter new time slot (e.g., 01:30 PM):');
  if (!newTime) return;

  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: newDate.trim(), time: newTime.trim() })
  });
  const data = await res.json();
  if (!res.ok) return showAlert(data.error);

  showAlert('Appointment rescheduled.');
  loadAppointments();
  loadReminders();
};

// Feature 4: Cancel
window.cancelAppt = async function (id) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Cancelled' })
  });
  if (res.ok) {
    showAlert('Appointment cancelled.');
    loadAppointments();
    loadReminders();
  }
};

// Feature 5: Load Reminder Notifications
async function loadReminders() {
  const res = await fetch(`/api/appointments/reminders?email=${encodeURIComponent(currentUser.email)}`);
  const reminders = await res.json();
  const banner = document.getElementById('reminderBanner');
  const list = document.getElementById('reminderList');

  if (reminders.length === 0) {
    banner.classList.add('hidden');
    return;
  }

  list.innerHTML = reminders
    .map((r) => `<li><strong>${r.date} at ${r.time}</strong> — ${r.provider} (${r.status})</li>`)
    .join('');
  banner.classList.remove('hidden');
}

updateView();
