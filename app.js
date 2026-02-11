/**
 * ERP Application - Main Application Logic
 * Clean, Elegant & Minimalist
 */

// API Configuration - Replace with your Xano API URL
const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:IYq9XpCN';

// Application State
const state = {
  user: null,
  authToken: null,
  currentPage: 'dashboard',
  currentModal: null,
  editingId: null,
  currentBusinessId: null,
  data: {
    customers: [],
    suppliers: [],
    items: [],
    orders: [],
    purchases: [],
    expenses: [],
    invoices: [],
    businesses: [],
    employees: [],
    salary_payments: []
  },
  invoiceItems: [],
  viewingSalaryEmployeeId: null
};

// Table IDs from Xano
const TABLE_IDS = {
  customer: 722466,
  supplier: 722467,
  item: 722468,
  order: 722469,
  order_item: 722470,
  purchase: 722471,
  purchase_item: 722472,
  expense: 722473,
  invoice: 722474
};

// Application Class
class ERPApplication {
  constructor() {
    this.init();
  }

  init() {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      state.authToken = token;
      state.user = JSON.parse(user);
      this.showDashboard();
    } else {
      this.showLogin();
    }

    this.setupEventListeners();

    // Apply saved theme (default to dark)
    this.applyTheme(localStorage.getItem('theme') || 'dark');
  }

  setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.navigateTo(page);
      });
    });

    // User info (logout)
    document.getElementById('userInfo').addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        this.logout();
      }
    });

    // Modal close on overlay click
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') {
        this.closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  // Authentication
  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showToast('Please enter email and password', 'error');
      return;
    }

    this.showLoading();

    // Demo mode login (auth API not configured)
    state.authToken = 'demo_token';
    state.user = { email, name: email.split('@')[0] };

    localStorage.setItem('authToken', 'demo_token');
    localStorage.setItem('user', JSON.stringify(state.user));

    this.showDashboard();
    this.showToast('Welcome!', 'success');

    this.hideLoading();
  }

  logout() {
    state.authToken = null;
    state.user = null;
    state.currentBusinessId = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentBusinessId');
    this.showLogin();
    this.showToast('Logged out successfully', 'info');
  }

  // Theme Toggle
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update icons
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

  async handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 8) {
      this.showToast('Password must be at least 8 characters', 'error');
      return;
    }

    this.showLoading();

    // Demo mode registration (auth API not configured)
    state.authToken = 'demo_token';
    state.user = { name, email };

    localStorage.setItem('authToken', 'demo_token');
    localStorage.setItem('user', JSON.stringify(state.user));

    this.showDashboard();
    this.showToast('Account created!', 'success');

    this.hideLoading();
  }

  showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Welcome back';
    document.getElementById('authSubtitle').textContent = 'Sign in to your ERP dashboard';
  }

  showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Create account';
    document.getElementById('authSubtitle').textContent = 'Get started with your ERP dashboard';
  }

  // UI State
  showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Update user display
    if (state.user) {
      const name = state.user.name || state.user.email || 'User';
      document.getElementById('userName').textContent = name;
      document.querySelector('.user-avatar').textContent = name.charAt(0).toUpperCase();
    }

    // Restore saved business selection
    const savedBusinessId = localStorage.getItem('currentBusinessId');
    if (savedBusinessId) {
      state.currentBusinessId = parseInt(savedBusinessId);
    }

    // Load businesses first, then dashboard data
    this.loadBusinesses().then(() => this.loadDashboardData());
  }

  showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
  }

  // Navigation
  navigateTo(page) {
    // Update state
    state.currentPage = page;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      customers: 'Customers',
      suppliers: 'Suppliers',
      items: 'Items',
      orders: 'Orders',
      purchases: 'Purchases',
      expenses: 'Expenses',
      invoices: 'Invoices',
      employees: 'Employees'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('hidden', p.id !== `page-${page}`);
    });

    // Load data for the page
    this.loadPageData(page);
  }

  // Business Switcher
  async loadBusinesses() {
    try {
      const response = await this.apiCall('/business');
      state.data.businesses = response.items || response || [];
    } catch (error) {
      console.log('Could not load businesses');
      state.data.businesses = [];
    }
    this.renderBusinessSwitcher();
  }

  renderBusinessSwitcher() {
    const select = document.getElementById('businessSwitcher');
    if (!select) return;
    select.innerHTML = '<option value="">All Businesses</option>' +
      state.data.businesses.map(b =>
        `<option value="${b.id}" ${state.currentBusinessId == b.id ? 'selected' : ''}>${this.escapeHtml(b.name)}</option>`
      ).join('');
  }

  switchBusiness(value) {
    const businessId = value ? parseInt(value) : null;
    state.currentBusinessId = businessId;

    // Persist selection
    if (businessId) {
      localStorage.setItem('currentBusinessId', businessId);
    } else {
      localStorage.removeItem('currentBusinessId');
    }

    // Reload all data for selected business
    this.loadDashboardData();
    if (state.currentPage !== 'dashboard') {
      this.loadPageData(state.currentPage);
    }

    const businessName = businessId
      ? state.data.businesses.find(b => b.id === businessId)?.name || 'Business'
      : 'All Businesses';
    this.showToast(`Switched to ${businessName}`, 'info');
  }

  getBusinessParam(prefix = '?') {
    if (state.currentBusinessId) {
      return `${prefix}business_id=${state.currentBusinessId}`;
    }
    return '';
  }

  // Data Loading (sequential to avoid rate limiting)
  async loadDashboardData() {
    await this.loadCustomers();
    await this.loadOrders();
    await this.loadItems();
    await this.loadExpenses();
    await this.loadEmployees();

    // Update stats
    document.getElementById('statCustomers').textContent = state.data.customers.length;
    document.getElementById('statOrders').textContent = state.data.orders.length;
    document.getElementById('statItems').textContent = state.data.items.reduce((sum, item) => sum + (item.stock_quantity || 0), 0);

    const totalExpenses = state.data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    document.getElementById('statExpenses').textContent = `₹${this.formatNumber(totalExpenses)}`;
    document.getElementById('statEmployees').textContent = state.data.employees.length;

    // Update recent orders table
    this.renderRecentOrders();
  }

  loadPageData(page) {
    switch (page) {
      case 'customers': this.loadCustomers(); break;
      case 'suppliers': this.loadSuppliers(); break;
      case 'items': this.loadItems(); break;
      case 'orders': this.loadOrders(); break;
      case 'purchases': this.loadPurchases(); break;
      case 'expenses': this.loadExpenses(); break;
      case 'invoices': this.loadInvoices(); break;
      case 'employees': this.loadEmployees(); break;
      case 'account': this.loadAccountPage(); break;
    }
  }

  // API Calls (with retry for rate limiting)
  async apiCall(endpoint, method = 'GET', body = null, retries = 3) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (state.authToken) {
      headers['Authorization'] = `Bearer ${state.authToken}`;
    }

    const options = {
      method,
      headers,
      mode: 'cors'
    };
    if (body) options.body = JSON.stringify(body);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle rate limiting with retry
        if (response.status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(`Rate limited on ${endpoint}, retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt === retries) {
          console.error('API Error:', error);
          throw error;
        }
      }
    }
  }

  // CRUD Operations for each entity
  async loadCustomers() {
    try {
      const response = await this.apiCall(`/customer${this.getBusinessParam()}`);
      state.data.customers = response.items || response || [];
      this.renderCustomersTable();
    } catch (error) {
      console.error('Failed to load customers:', error);
      state.data.customers = [];
      this.renderCustomersTable();
      this.showToast('Failed to load customers', 'error');
    }
  }

  async loadSuppliers() {
    try {
      const response = await this.apiCall(`/supplier${this.getBusinessParam()}`);
      state.data.suppliers = response.items || response || [];
      this.renderSuppliersTable();
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      state.data.suppliers = [];
      this.renderSuppliersTable();
      this.showToast('Failed to load suppliers', 'error');
    }
  }

  async loadItems() {
    try {
      const response = await this.apiCall(`/item${this.getBusinessParam()}`);
      state.data.items = response.items || response || [];
      this.renderItemsTable();
    } catch (error) {
      console.error('Failed to load items:', error);
      state.data.items = [];
      this.renderItemsTable();
      this.showToast('Failed to load items', 'error');
    }
  }

  async loadOrders() {
    try {
      const response = await this.apiCall(`/order${this.getBusinessParam()}`);
      state.data.orders = response.items || response || [];
      this.renderOrdersTable();
    } catch (error) {
      console.error('Failed to load orders:', error);
      state.data.orders = [];
      this.renderOrdersTable();
      this.showToast('Failed to load orders', 'error');
    }
  }

  async loadPurchases() {
    try {
      const response = await this.apiCall(`/purchase${this.getBusinessParam()}`);
      state.data.purchases = response.items || response || [];
      this.renderPurchasesTable();
    } catch (error) {
      console.error('Failed to load purchases:', error);
      state.data.purchases = [];
      this.renderPurchasesTable();
      this.showToast('Failed to load purchases', 'error');
    }
  }

  async loadExpenses() {
    try {
      const response = await this.apiCall(`/expense${this.getBusinessParam()}`);
      state.data.expenses = response.items || response || [];
      this.renderExpensesTable();
    } catch (error) {
      console.error('Failed to load expenses:', error);
      state.data.expenses = [];
      this.renderExpensesTable();
      this.showToast('Failed to load expenses', 'error');
    }
  }

  async loadInvoices() {
    try {
      const response = await this.apiCall(`/invoice${this.getBusinessParam()}`);
      state.data.invoices = response.items || response || [];
      this.renderInvoicesTable();
    } catch (error) {
      console.error('Failed to load invoices:', error);
      state.data.invoices = [];
      this.renderInvoicesTable();
      this.showToast('Failed to load invoices', 'error');
    }
  }

  async loadEmployees() {
    try {
      const response = await this.apiCall(`/employee${this.getBusinessParam()}`);
      state.data.employees = response.items || response || [];
      this.renderEmployeesTable();
    } catch (error) {
      console.error('Failed to load employees:', error);
      state.data.employees = [];
      this.renderEmployeesTable();
      this.showToast('Failed to load employees', 'error');
    }
  }

  async loadSalaryPayments(employeeId) {
    try {
      const bParam = this.getBusinessParam();
      const sep = bParam ? '&' : '?';
      const response = await this.apiCall(`/salary_payment?employee_id=${employeeId}${bParam ? '&business_id=' + state.currentBusinessId : ''}`);
      state.data.salary_payments = response.items || response || [];
    } catch (error) {
      console.error('Failed to load salary payments:', error);
      state.data.salary_payments = [];
      this.showToast('Failed to load salary payments', 'error');
    }
    this.renderSalaryHistoryTable();
  }


  // Table Rendering
  renderCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');
    tbody.innerHTML = state.data.customers.map(c => `
      <tr>
        <td><strong>${this.escapeHtml(c.name)}</strong></td>
        <td>${this.escapeHtml(c.email || '-')}</td>
        <td>${this.escapeHtml(c.phone || '-')}</td>
        <td>₹${this.formatNumber(c.balance || 0)}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.editRecord('customer', ${c.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('customer', ${c.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(5);
  }

  renderSuppliersTable() {
    const tbody = document.querySelector('#suppliersTable tbody');
    tbody.innerHTML = state.data.suppliers.map(s => `
      <tr>
        <td><strong>${this.escapeHtml(s.name)}</strong></td>
        <td>${this.escapeHtml(s.email || '-')}</td>
        <td>${this.escapeHtml(s.phone || '-')}</td>
        <td>₹${this.formatNumber(s.balance || 0)}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.editRecord('supplier', ${s.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('supplier', ${s.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(5);
  }

  renderItemsTable() {
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = state.data.items.map(i => `
      <tr>
        <td><strong>${this.escapeHtml(i.name)}</strong></td>
        <td><code>${this.escapeHtml(i.sku || '-')}</code></td>
        <td>${this.escapeHtml(i.description || '-')}</td>
        <td>₹${this.formatNumber(i.sale_price || 0)}</td>
        <td>₹${this.formatNumber(i.purchase_price || 0)}</td>
        <td>
          <span class="badge ${i.stock_quantity < 20 ? 'badge-error' : 'badge-success'}">
            ${i.stock_quantity || 0} ${this.escapeHtml(i.unit || 'pcs')}
          </span>
        </td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.editRecord('item', ${i.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('item', ${i.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(7);
  }

  renderOrdersTable() {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = state.data.orders.map(o => {
      // Look up customer name from customers array
      const customer = state.data.customers.find(c => c.id === o.customer_id);
      const customerName = customer ? customer.name : '-';

      return `
        <tr>
          <td><strong>${this.escapeHtml(o.order_number)}</strong></td>
          <td>${this.escapeHtml(customerName)}</td>
          <td>${this.formatDate(o.order_date)}</td>
          <td>₹${this.formatNumber(o.total_amount || 0)}</td>
          <td><span class="badge badge-${this.getStatusColor(o.status)}">${o.status}</span></td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="app.editRecord('order', ${o.id})">Edit</button>
            <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('order', ${o.id})">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || this.renderEmptyRow(6);
  }

  renderPurchasesTable() {
    const tbody = document.querySelector('#purchasesTable tbody');
    tbody.innerHTML = state.data.purchases.map(p => {
      // Look up supplier name from suppliers array
      const supplier = state.data.suppliers.find(s => s.id === p.supplier_id);
      const supplierName = supplier ? supplier.name : '-';

      return `
        <tr>
          <td><strong>${this.escapeHtml(p.purchase_number)}</strong></td>
          <td>${this.escapeHtml(supplierName)}</td>
          <td>${this.formatDate(p.purchase_date)}</td>
          <td>₹${this.formatNumber(p.total_amount || 0)}</td>
          <td><span class="badge badge-${this.getStatusColor(p.status)}">${p.status}</span></td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="app.editRecord('purchase', ${p.id})">Edit</button>
            <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('purchase', ${p.id})">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || this.renderEmptyRow(6);
  }

  renderExpensesTable() {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = state.data.expenses.map(e => `
      <tr>
        <td><strong>${this.escapeHtml(e.expense_number)}</strong></td>
        <td>${this.escapeHtml(e.category)}</td>
        <td>₹${this.formatNumber(e.amount || 0)}</td>
        <td>${this.formatDate(e.expense_date)}</td>
        <td><span class="badge badge-gray">${e.payment_method}</span></td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.editRecord('expense', ${e.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('expense', ${e.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(6);
  }

  renderInvoicesTable() {
    const tbody = document.querySelector('#invoicesTable tbody');
    tbody.innerHTML = state.data.invoices.map(i => {
      // Look up customer name from customers array
      const customer = state.data.customers.find(c => c.id === i.customer_id);
      const customerName = customer ? customer.name : '-';

      return `
        <tr>
          <td><strong>${this.escapeHtml(i.invoice_number)}</strong></td>
          <td>${this.escapeHtml(customerName)}</td>
          <td>${this.formatDate(i.invoice_date)}</td>
          <td>₹${this.formatNumber(i.total_amount || 0)}</td>
          <td><span class="badge badge-${this.getStatusColor(i.status)}">${i.status}</span></td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="app.editRecord('invoice', ${i.id})" title="Edit">Edit</button>
            <button class="btn btn-ghost btn-sm" onclick="app.printInvoice(${i.id})" title="Print">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="app.exportInvoicePDF(${i.id})" title="Export PDF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('invoice', ${i.id})" title="Delete">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || this.renderEmptyRow(6);
  }

  renderEmployeesTable() {
    const tbody = document.querySelector('#employeesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = state.data.employees.map(e => `
      <tr>
        <td><strong>${this.escapeHtml(e.name)}</strong></td>
        <td>${this.escapeHtml(e.email || '-')}</td>
        <td>${this.escapeHtml(e.phone || '-')}</td>
        <td>${this.escapeHtml(e.department || '-')}</td>
        <td>${this.escapeHtml(e.designation || '-')}</td>
        <td>₹${this.formatNumber(e.monthly_salary || 0)}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.editRecord('employee', ${e.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="app.openSalaryHistory(${e.id})">Salary</button>
          <button class="btn btn-ghost btn-sm" onclick="app.deleteRecord('employee', ${e.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(7);
  }

  renderSalaryHistoryTable() {
    const tbody = document.querySelector('#salaryHistoryTable tbody');
    if (!tbody) return;
    tbody.innerHTML = state.data.salary_payments.map(sp => `
      <tr>
        <td>${this.formatDate(sp.payment_date)}</td>
        <td><strong>₹${this.formatNumber(sp.amount || 0)}</strong></td>
        <td>${this.escapeHtml(sp.month || '-')} ${sp.year || ''}</td>
        <td><span class="badge badge-gray">${this.escapeHtml(sp.payment_method || '-')}</span></td>
        <td>${this.escapeHtml(sp.notes || '-')}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="app.deleteSalaryPayment(${sp.id})">Delete</button>
        </td>
      </tr>
    `).join('') || this.renderEmptyRow(6);
  }

  openSalaryHistory(employeeId) {
    const employee = state.data.employees.find(e => e.id === employeeId);
    if (!employee) return;

    state.viewingSalaryEmployeeId = employeeId;
    const card = document.getElementById('salaryHistoryCard');
    const title = document.getElementById('salaryHistoryTitle');
    title.textContent = `Salary History — ${employee.name}`;
    card.classList.remove('hidden');
    this.loadSalaryPayments(employeeId);
  }

  closeSalaryHistory() {
    state.viewingSalaryEmployeeId = null;
    document.getElementById('salaryHistoryCard').classList.add('hidden');
  }

  async deleteSalaryPayment(id) {
    if (!confirm('Are you sure you want to delete this salary payment?')) return;
    this.showLoading();
    try {
      await this.apiCall(`/salary_payment/${id}`, 'DELETE');
      this.showToast('Salary payment deleted', 'success');
    } catch (error) {
      console.error('Failed to delete salary payment:', error);
      this.showToast(`Failed to delete salary payment: ${error.message}`, 'error');
    }
    this.hideLoading();
    if (state.viewingSalaryEmployeeId) {
      this.loadSalaryPayments(state.viewingSalaryEmployeeId);
    }
  }

  renderRecentOrders() {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    const recentOrders = state.data.orders.slice(0, 5);

    tbody.innerHTML = recentOrders.map(o => {
      // Look up customer name from customers array
      const customer = state.data.customers.find(c => c.id === o.customer_id);
      const customerName = customer ? customer.name : '-';

      return `
        <tr>
          <td><strong>${this.escapeHtml(o.order_number)}</strong></td>
          <td>${this.escapeHtml(customerName)}</td>
          <td>${this.formatDate(o.order_date)}</td>
          <td>₹${this.formatNumber(o.total_amount || 0)}</td>
          <td><span class="badge badge-${this.getStatusColor(o.status)}">${o.status}</span></td>
        </tr>
      `;
    }).join('') || this.renderEmptyRow(5);
  }

  renderEmptyRow(colspan) {
    return `<tr><td colspan="${colspan}" class="text-center text-muted" style="padding: 40px;">No records found</td></tr>`;
  }

  // Modal
  openModal(type, editData = null) {
    state.currentModal = type;
    state.editingId = editData?.id || null;

    const titles = {
      customer: editData ? 'Edit Customer' : 'Add Customer',
      supplier: editData ? 'Edit Supplier' : 'Add Supplier',
      item: editData ? 'Edit Item' : 'Add Item',
      order: editData ? 'Edit Order' : 'New Order',
      purchase: editData ? 'Edit Purchase' : 'New Purchase',
      expense: editData ? 'Edit Expense' : 'Add Expense',
      invoice: editData ? 'Edit Invoice' : 'Create Invoice',
      business: editData ? 'Edit Business' : 'Create New Business',
      employee: editData ? 'Edit Employee' : 'Add Employee',
      salary_payment: editData ? 'Edit Salary Payment' : 'Record Salary Payment'
    };

    document.getElementById('modalTitle').textContent = titles[type];
    document.getElementById('modalBody').innerHTML = this.getFormHtml(type, editData);
    document.getElementById('modalOverlay').classList.add('active');

    // Wide modal for invoice
    const modal = document.getElementById('modal');
    if (type === 'invoice') {
      modal.classList.add('modal-wide');
      // Initialize invoice line items
      state.invoiceItems = editData?.items || [{ id: Date.now(), item_id: '', item_name: '', hsn_code: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, tax_percent: 18, amount: 0 }];
      this.renderInvoiceItems();
    } else {
      modal.classList.remove('modal-wide');
    }
  }

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('modal').classList.remove('modal-wide');
    state.currentModal = null;
    state.editingId = null;
    state.invoiceItems = [];
  }

  getFormHtml(type, data) {
    data = data || {}; // Handle null/undefined
    const forms = {
      customer: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" name="name" class="form-input" value="${this.escapeHtml(data.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" value="${this.escapeHtml(data.email || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" name="phone" class="form-input" value="${this.escapeHtml(data.phone || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea name="address" class="form-textarea" rows="2">${this.escapeHtml(data.address || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">GSTIN</label>
            <input type="text" name="gstin" class="form-input" value="${this.escapeHtml(data.gstin || '')}">
          </div>
        </form>
      `,
      supplier: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" name="name" class="form-input" value="${this.escapeHtml(data.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" value="${this.escapeHtml(data.email || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" name="phone" class="form-input" value="${this.escapeHtml(data.phone || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea name="address" class="form-textarea" rows="2">${this.escapeHtml(data.address || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">GSTIN</label>
            <input type="text" name="gstin" class="form-input" value="${this.escapeHtml(data.gstin || '')}">
          </div>
        </form>
      `,
      item: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" name="name" class="form-input" value="${this.escapeHtml(data.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input type="text" name="sku" class="form-input" value="${this.escapeHtml(data.sku || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-textarea" rows="2">${this.escapeHtml(data.description || '')}</textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Sale Price *</label>
              <input type="number" name="sale_price" class="form-input"
                value="${data.sale_price !== undefined && data.sale_price !== null ? data.sale_price : ''}"
                placeholder="e.g., 100.00"
                min="0"
                step="0.01"
                required>
            </div>
            <div class="form-group">
              <label class="form-label">Purchase Price</label>
              <input type="number" name="purchase_price" class="form-input"
                value="${data.purchase_price !== undefined && data.purchase_price !== null ? data.purchase_price : ''}"
                placeholder="e.g., 80.00"
                min="0"
                step="0.01">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Stock Quantity *</label>
              <input type="number" name="stock_quantity" class="form-input"
                value="${data.stock_quantity !== undefined && data.stock_quantity !== null ? data.stock_quantity : ''}"
                placeholder="e.g., 50"
                min="0"
                required>
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <input type="text" name="unit" class="form-input" value="${this.escapeHtml(data.unit || 'pcs')}">
            </div>
          </div>
        </form>
      `,
      expense: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Expense Number *</label>
            <input type="text" name="expense_number" class="form-input" value="${this.escapeHtml(data.expense_number || this.generateNumber('EXP'))}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select name="category" class="form-select" required>
              <option value="">Select Category</option>
              <option value="Office Supplies" ${data.category === 'Office Supplies' ? 'selected' : ''}>Office Supplies</option>
              <option value="Utilities" ${data.category === 'Utilities' ? 'selected' : ''}>Utilities</option>
              <option value="Rent" ${data.category === 'Rent' ? 'selected' : ''}>Rent</option>
              <option value="Travel" ${data.category === 'Travel' ? 'selected' : ''}>Travel</option>
              <option value="Marketing" ${data.category === 'Marketing' ? 'selected' : ''}>Marketing</option>
              <option value="Other" ${data.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount *</label>
            <input type="number" name="amount" class="form-input" value="${data.amount || 0}" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" name="expense_date" class="form-input" value="${data.expense_date || new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select name="payment_method" class="form-select">
              <option value="cash" ${data.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
              <option value="bank" ${data.payment_method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
              <option value="card" ${data.payment_method === 'card' ? 'selected' : ''}>Card</option>
              <option value="upi" ${data.payment_method === 'upi' ? 'selected' : ''}>UPI</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-textarea" rows="2">${this.escapeHtml(data.description || '')}</textarea>
          </div>
        </form>
      `,
      order: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Order Number *</label>
            <input type="text" name="order_number" class="form-input" value="${this.escapeHtml(data.order_number || this.generateNumber('ORD'))}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Customer *</label>
            <select name="customer_id" class="form-select" required>
              <option value="">Select Customer</option>
              ${state.data.customers.map(c => `<option value="${c.id}" ${data.customer_id === c.id ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Order Date</label>
            <input type="date" name="order_date" class="form-input" value="${data.order_date || new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-select">
              <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="confirmed" ${data.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="shipped" ${data.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${data.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Total Amount</label>
            <input type="number" name="total_amount" class="form-input" value="${data.total_amount || 0}" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" rows="2">${this.escapeHtml(data.notes || '')}</textarea>
          </div>
        </form>
      `,
      purchase: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Purchase Number *</label>
            <input type="text" name="purchase_number" class="form-input" value="${this.escapeHtml(data.purchase_number || this.generateNumber('PUR'))}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select name="supplier_id" class="form-select" required>
              <option value="">Select Supplier</option>
              ${state.data.suppliers.map(s => `<option value="${s.id}" ${data.supplier_id === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input type="date" name="purchase_date" class="form-input" value="${data.purchase_date || new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-select">
              <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="confirmed" ${data.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="received" ${data.status === 'received' ? 'selected' : ''}>Received</option>
              <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Total Amount</label>
            <input type="number" name="total_amount" class="form-input" value="${data.total_amount || 0}" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" rows="2">${this.escapeHtml(data.notes || '')}</textarea>
          </div>
        </form>
      `,
      invoice: `
        <form id="recordForm">
          <!-- Invoice Header -->
          <div class="invoice-header-grid">
            <div>
              <div class="form-group">
                <label class="form-label">Invoice Number *</label>
                <input type="text" name="invoice_number" class="form-input" value="${this.escapeHtml(data.invoice_number || this.generateNumber('INV'))}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Customer *</label>
                <select name="customer_id" class="form-select" required>
                  <option value="">Select Customer</option>
                  ${state.data.customers.map(c => `<option value="${c.id}" ${data.customer_id === c.id ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div>
              <div class="form-group">
                <label class="form-label">Invoice Date</label>
                <input type="date" name="invoice_date" class="form-input" value="${data.invoice_date || new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-select">
                  <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                  <option value="sent" ${data.status === 'sent' ? 'selected' : ''}>Sent</option>
                  <option value="paid" ${data.status === 'paid' ? 'selected' : ''}>Paid</option>
                  <option value="overdue" ${data.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                  <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Line Items Section -->
          <div style="margin-bottom: 16px;">
            <h4 style="margin-bottom: 12px; font-weight: 600;">Line Items</h4>
            <table class="invoice-items-table" id="invoiceItemsTable">
              <thead>
                <tr>
                  <th class="col-item">Item</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-price">Price</th>
                  <th class="col-discount">Disc %</th>
                  <th class="col-tax">Tax %</th>
                  <th class="col-amount">Amount</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody id="invoiceItemsBody">
                <!-- Items will be rendered dynamically -->
              </tbody>
            </table>
            <button type="button" class="btn-add-row" onclick="app.addInvoiceItem()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Item
            </button>
          </div>
          
          <!-- Totals Section -->
          <div class="invoice-totals">
            <table class="invoice-totals-table">
              <tr>
                <td>Subtotal:</td>
                <td id="invoiceSubtotal">₹0.00</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td id="invoiceDiscount">-₹0.00</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td id="invoiceTax">₹0.00</td>
              </tr>
              <tr class="grand-total">
                <td>Total:</td>
                <td id="invoiceTotal">₹0.00</td>
              </tr>
            </table>
          </div>
          
          <!-- Hidden fields for form submission -->
          <input type="hidden" name="total_amount" id="invoiceTotalInput" value="${data.total_amount || 0}">
          <input type="hidden" name="order_id" value="${data.order_id || 0}">
          <input type="hidden" name="subtotal" id="invoiceSubtotalInput" value="${data.subtotal || 0}">
          <input type="hidden" name="tax_amount" id="invoiceTaxInput" value="${data.tax_amount || 0}">
          
          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" rows="2">${this.escapeHtml(data.notes || '')}</textarea>
          </div>
        </form>
      `,
      business: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Business Name *</label>
            <input type="text" name="name" class="form-input" value="${this.escapeHtml(data.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Legal Name</label>
            <input type="text" name="legal_name" class="form-input" value="${this.escapeHtml(data.legal_name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Business Type</label>
            <select name="business_type" class="form-select">
              <option value="">Select Type</option>
              <option value="Retail" ${data.business_type === 'Retail' ? 'selected' : ''}>Retail</option>
              <option value="Manufacturing" ${data.business_type === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
              <option value="Service" ${data.business_type === 'Service' ? 'selected' : ''}>Service</option>
              <option value="Wholesale" ${data.business_type === 'Wholesale' ? 'selected' : ''}>Wholesale</option>
              <option value="Other" ${data.business_type === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">GSTIN</label>
              <input type="text" name="gstin" class="form-input" value="${this.escapeHtml(data.gstin || '')}" placeholder="22AAAAA0000A1Z5">
            </div>
            <div class="form-group">
              <label class="form-label">PAN</label>
              <input type="text" name="pan" class="form-input" value="${this.escapeHtml(data.pan || '')}" placeholder="AAAAA0000A">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-input" value="${this.escapeHtml(data.email || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" name="phone" class="form-input" value="${this.escapeHtml(data.phone || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea name="address" class="form-textarea" rows="2">${this.escapeHtml(data.address || '')}</textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" name="city" class="form-input" value="${this.escapeHtml(data.city || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" name="state" class="form-input" value="${this.escapeHtml(data.state || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Pincode</label>
              <input type="text" name="pincode" class="form-input" value="${this.escapeHtml(data.pincode || '')}">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Country</label>
              <input type="text" name="country" class="form-input" value="${this.escapeHtml(data.country || 'India')}">
            </div>
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select name="currency" class="form-select">
                <option value="INR" ${data.currency === 'INR' || !data.currency ? 'selected' : ''}>INR - Indian Rupee</option>
                <option value="USD" ${data.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                <option value="EUR" ${data.currency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                <option value="GBP" ${data.currency === 'GBP' ? 'selected' : ''}>GBP - British Pound</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Logo URL</label>
            <input type="url" name="logo_url" class="form-input" value="${this.escapeHtml(data.logo_url || '')}" placeholder="https://...">
          </div>
        </form>
      `,
      employee: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" name="name" class="form-input" value="${this.escapeHtml(data.name || '')}" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" name="email" class="form-input" value="${this.escapeHtml(data.email || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" name="phone" class="form-input" value="${this.escapeHtml(data.phone || '')}">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Department</label>
              <select name="department" class="form-select">
                <option value="">Select Department</option>
                <option value="Engineering" ${data.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
                <option value="Marketing" ${data.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
                <option value="Sales" ${data.department === 'Sales' ? 'selected' : ''}>Sales</option>
                <option value="Finance" ${data.department === 'Finance' ? 'selected' : ''}>Finance</option>
                <option value="HR" ${data.department === 'HR' ? 'selected' : ''}>HR</option>
                <option value="Operations" ${data.department === 'Operations' ? 'selected' : ''}>Operations</option>
                <option value="Admin" ${data.department === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="Other" ${data.department === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Designation</label>
              <input type="text" name="designation" class="form-input" value="${this.escapeHtml(data.designation || '')}">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Date of Joining</label>
              <input type="date" name="date_of_joining" class="form-input" value="${data.date_of_joining || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label">Monthly Salary (₹)</label>
              <input type="number" name="monthly_salary" class="form-input" value="${data.monthly_salary || 0}" min="0" step="100">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Bank Account</label>
            <input type="text" name="bank_account" class="form-input" value="${this.escapeHtml(data.bank_account || '')}" placeholder="Bank-XXXX1234">
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea name="address" class="form-textarea" rows="2">${this.escapeHtml(data.address || '')}</textarea>
          </div>
        </form>
      `,
      salary_payment: `
        <form id="recordForm" class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Employee *</label>
            <select name="employee_id" class="form-select" required>
              <option value="">Select Employee</option>
              ${state.data.employees.map(e => `<option value="${e.id}" ${data.employee_id == e.id ? 'selected' : ''}>${this.escapeHtml(e.name)}</option>`).join('')}
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Amount (₹) *</label>
              <input type="number" name="amount" class="form-input" value="${data.amount || 0}" min="0" step="100" required>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input type="date" name="payment_date" class="form-input" value="${data.payment_date || new Date().toISOString().split('T')[0]}">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Month</label>
              <select name="month" class="form-select">
                <option value="January" ${data.month === 'January' ? 'selected' : ''}>January</option>
                <option value="February" ${data.month === 'February' ? 'selected' : ''}>February</option>
                <option value="March" ${data.month === 'March' ? 'selected' : ''}>March</option>
                <option value="April" ${data.month === 'April' ? 'selected' : ''}>April</option>
                <option value="May" ${data.month === 'May' ? 'selected' : ''}>May</option>
                <option value="June" ${data.month === 'June' ? 'selected' : ''}>June</option>
                <option value="July" ${data.month === 'July' ? 'selected' : ''}>July</option>
                <option value="August" ${data.month === 'August' ? 'selected' : ''}>August</option>
                <option value="September" ${data.month === 'September' ? 'selected' : ''}>September</option>
                <option value="October" ${data.month === 'October' ? 'selected' : ''}>October</option>
                <option value="November" ${data.month === 'November' ? 'selected' : ''}>November</option>
                <option value="December" ${data.month === 'December' ? 'selected' : ''}>December</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Year</label>
              <input type="number" name="year" class="form-input" value="${data.year || new Date().getFullYear()}" min="2020" max="2030">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select name="payment_method" class="form-select">
              <option value="bank" ${data.payment_method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
              <option value="cash" ${data.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
              <option value="upi" ${data.payment_method === 'upi' ? 'selected' : ''}>UPI</option>
              <option value="cheque" ${data.payment_method === 'cheque' ? 'selected' : ''}>Cheque</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" rows="2">${this.escapeHtml(data.notes || '')}</textarea>
          </div>
        </form>
      `
    };

    return forms[type] || '<p>Form not available</p>';
  }

  async saveRecord() {
    const form = document.getElementById('recordForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Additional validation for item prices
    if (state.currentModal === 'item') {
      const salePriceInput = form.querySelector('[name="sale_price"]');
      const salePrice = parseFloat(salePriceInput.value);

      if (isNaN(salePrice) || salePrice <= 0) {
        this.showToast('Please enter a valid Sale Price greater than 0', 'error');
        salePriceInput.focus();
        return;
      }
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields
    ['amount', 'total_amount', 'sale_price', 'purchase_price', 'stock_quantity', 'tax', 'price', 'cost', 'stock', 'subtotal', 'tax_amount', 'monthly_salary', 'year'].forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        data[field] = parseFloat(data[field]) || 0;
      }
    });
    ['customer_id', 'supplier_id', 'order_id', 'item_id', 'employee_id'].forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        data[field] = parseInt(data[field]) || 0;
      }
    });

    // Remove order_id if it's 0 or empty (for standalone invoices)
    if (!data.order_id || data.order_id === 0) {
      delete data.order_id;
    }

    const type = state.currentModal;
    const dataKey = type + 's';
    const endpoint = `/${type}`;

    // Attach business_id to new records (not business entity itself)
    if (!state.editingId && type !== 'business' && state.currentBusinessId) {
      data.business_id = state.currentBusinessId;
    }

    this.showLoading();

    try {
      if (state.editingId) {
        // Update existing via API
        await this.apiCall(`${endpoint}/${state.editingId}`, 'PATCH', data);
        this.showToast(`${this.capitalize(type)} updated successfully`, 'success');
      } else {
        // Add new via API
        await this.apiCall(endpoint, 'POST', data);
        this.showToast(`${this.capitalize(type)} added successfully`, 'success');
      }
    } catch (error) {
      console.error('Failed to save record:', error);
      this.showToast(`Failed to save ${type}: ${error.message}`, 'error');
      this.hideLoading();
      return;
    }

    this.hideLoading();
    this.loadPageData(state.currentPage);
    // Refresh salary history if viewing
    if (type === 'salary_payment' && state.viewingSalaryEmployeeId) {
      this.loadSalaryPayments(state.viewingSalaryEmployeeId);
    }
    this.closeModal();
  }

  editRecord(type, id) {
    const dataKey = type + 's';
    const record = state.data[dataKey].find(item => item.id === id);
    if (record) {
      this.openModal(type, record);
    }
  }

  async deleteRecord(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    const dataKey = type + 's';
    const endpoint = `/${type}/${id}`;

    this.showLoading();

    try {
      await this.apiCall(endpoint, 'DELETE');
      this.showToast(`${this.capitalize(type)} deleted successfully`, 'success');
    } catch (error) {
      console.error('Failed to delete record:', error);
      this.showToast(`Failed to delete ${type}: ${error.message}`, 'error');
    }

    this.hideLoading();
    this.loadPageData(state.currentPage);
  }

  // Account Page
  loadAccountPage() {
    const user = state.user || {};
    const name = user.name || user.email || 'User';
    const email = user.email || '';

    const avatarEl = document.getElementById('accountAvatar');
    const nameEl = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    const nameInput = document.getElementById('accountNameInput');
    const emailInput = document.getElementById('accountEmailInput');

    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = email;
  }

  saveAccountSettings() {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (newPassword && newPassword !== confirmPassword) {
      this.showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      this.showToast('Password must be at least 8 characters', 'error');
      return;
    }

    const nameInput = document.getElementById('accountNameInput');
    if (nameInput && nameInput.value) {
      if (state.user) state.user.name = nameInput.value;
      localStorage.setItem('user', JSON.stringify(state.user));
      document.getElementById('userName').textContent = nameInput.value;
      document.querySelector('.user-avatar').textContent = nameInput.value.charAt(0).toUpperCase();
      this.loadAccountPage();
    }

    this.showToast('Account settings saved', 'success');

    // Clear password fields
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  // Invoice Print & Export
  generateInvoiceHTML(invoice) {
    const business = state.data.businesses.find(b => b.id === invoice.business_id) || { name: 'My Business' };
    const customer = state.data.customers.find(c => c.id === invoice.customer_id) || {};
    const items = invoice.items || [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
          .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
          .inv-header h1 { font-size: 28px; color: #4f46e5; }
          .inv-header .company { font-size: 20px; font-weight: bold; }
          .inv-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .inv-meta-box { }
          .inv-meta-box h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.05em; }
          .inv-meta-box p { margin: 4px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          tbody tr:last-child td { border-bottom: 2px solid #e5e7eb; }
          .text-right { text-align: right; }
          .totals { display: flex; justify-content: flex-end; }
          .totals table { width: 280px; }
          .totals td { padding: 6px 12px; font-size: 14px; }
          .totals .grand-total td { font-size: 18px; font-weight: bold; color: #4f46e5; border-top: 2px solid #4f46e5; }
          .inv-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-sent { background: #dbeafe; color: #1e40af; }
          .status-draft { background: #f3f4f6; color: #6b7280; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="inv-header">
          <div>
            <div class="company">${this.escapeHtml(business.name)}</div>
          </div>
          <div style="text-align: right;">
            <h1>INVOICE</h1>
            <p style="font-size:14px; margin-top:4px;">${this.escapeHtml(invoice.invoice_number)}</p>
            <span class="status-badge status-${invoice.status || 'draft'}">${invoice.status || 'draft'}</span>
          </div>
        </div>
        
        <div class="inv-meta">
          <div class="inv-meta-box">
            <h3>Bill To</h3>
            <p><strong>${this.escapeHtml(customer.name || invoice.customer_name || '-')}</strong></p>
            ${customer.email ? `<p>${this.escapeHtml(customer.email)}</p>` : ''}
            ${customer.phone ? `<p>${this.escapeHtml(customer.phone)}</p>` : ''}
            ${customer.address ? `<p>${this.escapeHtml(customer.address)}</p>` : ''}
          </div>
          <div class="inv-meta-box" style="text-align: right;">
            <h3>Invoice Details</h3>
            <p><strong>Date:</strong> ${this.formatDate(invoice.invoice_date)}</p>
            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${this.escapeHtml(item.item_name || item.name || '-')}</td>
                <td class="text-right">${item.quantity || 1}</td>
                <td class="text-right">₹${this.formatNumber(item.price || 0)}</td>
                <td class="text-right">₹${this.formatNumber(item.amount || (item.quantity || 1) * (item.price || 0))}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align:center; color:#9ca3af;">Invoice total</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="totals">
          <table>
            ${invoice.subtotal ? `<tr><td>Subtotal:</td><td class="text-right">₹${this.formatNumber(invoice.subtotal)}</td></tr>` : ''}
            ${invoice.tax_amount ? `<tr><td>Tax:</td><td class="text-right">₹${this.formatNumber(invoice.tax_amount)}</td></tr>` : ''}
            <tr class="grand-total">
              <td>Total:</td>
              <td class="text-right">₹${this.formatNumber(invoice.total_amount || 0)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `<div style="margin-top:30px;"><strong>Notes:</strong><p style="color:#6b7280; font-size:14px; margin-top:4px;">${this.escapeHtml(invoice.notes)}</p></div>` : ''}
        
        <div class="inv-footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;
  }

  printInvoice(id) {
    const invoice = state.data.invoices.find(i => i.id === id);
    if (!invoice) return this.showToast('Invoice not found', 'error');

    const html = this.generateInvoiceHTML(invoice);
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  exportInvoicePDF(id) {
    const invoice = state.data.invoices.find(i => i.id === id);
    if (!invoice) return this.showToast('Invoice not found', 'error');

    const html = this.generateInvoiceHTML(invoice);
    const pdfWindow = window.open('', '_blank', 'width=800,height=900');
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    pdfWindow.focus();
    // Prompt print dialog — user can choose "Save as PDF" from the print destination
    setTimeout(() => {
      pdfWindow.print();
      this.showToast('Use "Save as PDF" in the print dialog to export', 'info');
    }, 300);
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
  }

  // Utility Functions
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusColor(status) {
    const colors = {
      draft: 'gray',
      confirmed: 'primary',
      shipped: 'warning',
      delivered: 'success',
      received: 'success',
      sent: 'primary',
      paid: 'success',
      overdue: 'error',
      cancelled: 'error'
    };
    return colors[status] || 'gray';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateNumber(prefix) {
    const num = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    return `${prefix}-${num}`;
  }

  // Invoice Line Items Management
  renderInvoiceItems() {
    const tbody = document.getElementById('invoiceItemsBody');
    if (!tbody) return;

    tbody.innerHTML = state.invoiceItems.map((item, index) => `
      <tr data-index="${index}">
        <td class="col-item">
          <select onchange="app.updateInvoiceItem(${index}, 'item_id', this.value)" class="form-select">
            <option value="">Select Item</option>
            ${state.data.items.map(i => `<option value="${i.id}" ${item.item_id == i.id ? 'selected' : ''}>${this.escapeHtml(i.name)} (${this.escapeHtml(i.sku || '')})</option>`).join('')}
          </select>
        </td>
        <td class="col-qty">
          <input type="number" value="${item.quantity}" min="1" onchange="app.updateInvoiceItem(${index}, 'quantity', this.value)">
        </td>
        <td class="col-price">
          <input type="number" value="${item.unit_price}" min="0" step="0.01" onchange="app.updateInvoiceItem(${index}, 'unit_price', this.value)">
        </td>
        <td class="col-discount">
          <input type="number" value="${item.discount_percent}" min="0" max="100" step="0.1" onchange="app.updateInvoiceItem(${index}, 'discount_percent', this.value)">
        </td>
        <td class="col-tax">
          <input type="number" value="${item.tax_percent}" min="0" step="0.1" onchange="app.updateInvoiceItem(${index}, 'tax_percent', this.value)">
        </td>
        <td class="col-amount amount-cell">
          ₹${this.formatNumber(item.amount.toFixed(2))}
        </td>
        <td class="col-action">
          ${state.invoiceItems.length > 1 ? `
            <button type="button" class="btn-remove-row" onclick="app.removeInvoiceItem(${index})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');

    this.calculateInvoiceTotals();
  }

  addInvoiceItem() {
    state.invoiceItems.push({
      id: Date.now(),
      item_id: '',
      item_name: '',
      hsn_code: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 18,
      amount: 0
    });
    this.renderInvoiceItems();
  }

  removeInvoiceItem(index) {
    if (state.invoiceItems.length > 1) {
      state.invoiceItems.splice(index, 1);
      this.renderInvoiceItems();
    }
  }

  updateInvoiceItem(index, field, value) {
    const item = state.invoiceItems[index];
    if (!item) return;

    // Handle item selection - auto-fill price
    if (field === 'item_id') {
      const selectedItem = state.data.items.find(i => i.id == value);
      if (selectedItem) {
        item.item_id = selectedItem.id;
        item.item_name = selectedItem.name;
        item.hsn_code = selectedItem.hsn_code || '';
        item.unit_price = parseFloat(selectedItem.sale_price) || 0;
      } else {
        item.item_id = '';
        item.item_name = '';
        item.hsn_code = '';
        item.unit_price = 0;
      }
    } else {
      item[field] = field === 'quantity' ? parseInt(value) || 1 : parseFloat(value) || 0;
    }

    // Calculate line amount
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = taxableAmount * (item.tax_percent / 100);
    item.amount = taxableAmount + taxAmount;

    this.renderInvoiceItems();
  }

  calculateInvoiceTotals() {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    state.invoiceItems.forEach(item => {
      const baseAmount = item.quantity * item.unit_price;
      const discountAmount = baseAmount * (item.discount_percent / 100);
      const taxableAmount = baseAmount - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percent / 100);

      subtotal += baseAmount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    // Update display
    const subtotalEl = document.getElementById('invoiceSubtotal');
    const discountEl = document.getElementById('invoiceDiscount');
    const taxEl = document.getElementById('invoiceTax');
    const totalEl = document.getElementById('invoiceTotal');
    const totalInput = document.getElementById('invoiceTotalInput');
    const subtotalInput = document.getElementById('invoiceSubtotalInput');
    const taxInput = document.getElementById('invoiceTaxInput');

    if (subtotalEl) subtotalEl.textContent = `₹${this.formatNumber(subtotal.toFixed(2))}`;
    if (discountEl) discountEl.textContent = `-₹${this.formatNumber(totalDiscount.toFixed(2))}`;
    if (taxEl) taxEl.textContent = `₹${this.formatNumber(totalTax.toFixed(2))}`;
    if (totalEl) totalEl.textContent = `₹${this.formatNumber(grandTotal.toFixed(2))}`;
    if (totalInput) totalInput.value = grandTotal.toFixed(2);
    if (subtotalInput) subtotalInput.value = subtotal.toFixed(2);
    if (taxInput) taxInput.value = totalTax.toFixed(2);
  }
}

// Initialize application
const app = new ERPApplication();
