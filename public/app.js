const API = 'http://localhost:5000/api';

// ===== HELPER FUNCTIONS =====
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user'));

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ===== TAB SWITCHING =====
const showTab = (tab) => {
  document.querySelectorAll('.form-section').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
};

// ===== REGISTER =====
const register = async () => {
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  if (!username || !email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || 'Registration failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorEl.textContent = 'Server error. Please try again.';
  }
};

// ===== LOGIN =====
const login = async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || 'Login failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email }));
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorEl.textContent = 'Server error. Please try again.';
  }
};

// ===== LOGOUT =====
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

// ===== LOAD DASHBOARD =====
const loadDashboard = async () => {
  if (!getToken()) {
    window.location.href = 'index.html';
    return;
  }

  const user = getUser();
  if (user) {
    document.getElementById('welcome-msg').textContent = `👋 Hello, ${user.username}`;
  }

  // Set today's date as default
  document.getElementById('date').valueAsDate = new Date();

  await loadSummary();
  await loadTransactions();
};

// ===== LOAD SUMMARY =====
const loadSummary = async () => {
  try {
    const res = await fetch(`${API}/expenses/summary`, { headers: authHeaders() });
    const data = await res.json();

    document.getElementById('balance').textContent = `$${data.balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `$${data.totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${data.totalExpenses.toFixed(2)}`;
  } catch (err) {
    console.error('Error loading summary:', err);
  }
};

// ===== LOAD TRANSACTIONS =====
const loadTransactions = async () => {
  try {
    const res = await fetch(`${API}/expenses`, { headers: authHeaders() });
    const data = await res.json();

    const list = document.getElementById('transactions-list');

    if (data.length === 0) {
      list.innerHTML = '<p class="empty-msg">No transactions yet. Add one!</p>';
      return;
    }

    const icons = {
      salary: '💼', food: '🍔', transport: '🚗',
      entertainment: '🎮', health: '💊', shopping: '🛍️', other: '💰'
    };

    list.innerHTML = data.map(t => `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="transaction-icon ${t.type}">
            ${icons[t.category] || '💰'}
          </div>
          <div>
            <div class="transaction-title">${t.title}</div>
            <div class="transaction-category">${t.category} • ${new Date(t.date).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${t.type}">
            ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
          </span>
          <button class="btn-delete" onclick="deleteExpense('${t._id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading transactions:', err);
  }
};

// ===== ADD EXPENSE =====
const addExpense = async () => {
  const title = document.getElementById('title').value;
  const amount = document.getElementById('amount').value;
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const date = document.getElementById('date').value;
  const errorEl = document.getElementById('form-error');

  if (!title || !amount || !date) {
    errorEl.textContent = 'Please fill in title, amount and date';
    return;
  }

  try {
    const res = await fetch(`${API}/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, amount: parseFloat(amount), type, category, description, date })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || 'Failed to add transaction';
      return;
    }

    // Clear form
    document.getElementById('title').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    errorEl.textContent = '';

    await loadSummary();
    await loadTransactions();
  } catch (err) {
    errorEl.textContent = 'Server error. Please try again.';
  }
};

// ===== DELETE EXPENSE =====
const deleteExpense = async (id) => {
  if (!confirm('Delete this transaction?')) return;

  try {
    await fetch(`${API}/expenses/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    await loadSummary();
    await loadTransactions();
  } catch (err) {
    console.error('Error deleting transaction:', err);
  }
};

// ===== INIT =====
if (window.location.pathname.includes('dashboard')) {
  loadDashboard();
}