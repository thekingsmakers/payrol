class App {
    constructor() {
        this.currentMonth = payrollData.getCurrentMonth();
        this.initializeTheme();
        this.setupEventListeners();
        this.initializeApp();
    }

    initializeTheme() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    setupEventListeners() {
        // Month selection
        const monthList = document.getElementById('monthList');
        monthList.addEventListener('click', (e) => {
            const monthItem = e.target.closest('li');
            if (monthItem) {
                this.switchMonth(monthItem.dataset.month);
            }
        });

        // Working days update
        const updateWorkingDaysBtn = document.getElementById('updateWorkingDays');
        const workingDaysInput = document.getElementById('workingDaysInput');
        
        updateWorkingDaysBtn.addEventListener('click', () => {
            const days = parseInt(workingDaysInput.value);
            if (days > 0 && days <= 31) {
                payrollData.setWorkingDays(this.currentMonth, days);
                tableManager.renderTable(this.currentMonth);
            } else {
                alert('Please enter a valid number of working days (1-31)');
            }
        });

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Add buttons
        document.getElementById('addEmployee').addEventListener('click', () => {
            this.showAddModal('employee');
        });

        document.getElementById('addExpense').addEventListener('click', () => {
            this.showAddModal('expense');
        });

        document.getElementById('addFixedExpense').addEventListener('click', () => {
            this.showAddModal('fixedExpense');
        });

        document.getElementById('addPurchase').addEventListener('click', () => {
            this.showAddModal('purchase');
        });

        // Mobile navigation toggle
        const navToggle = document.createElement('button');
        navToggle.className = 'nav-toggle';
        navToggle.innerHTML = '☰';
        document.body.appendChild(navToggle);

        navToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
        });
    }

    showAddModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        let content = '';
        switch (type) {
            case 'employee':
                content = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Add New Employee</h2>
                        <form id="addEmployeeForm">
                            <div class="form-group">
                                <label>Name:</label>
                                <input type="text" name="name" required>
                            </div>
                            <div class="form-group">
                                <label>Basic Salary:</label>
                                <input type="number" name="basicSalary" required>
                            </div>
                            
                            <h3>Allowances</h3>
                            <div class="form-group">
                                <label>Housing:</label>
                                <input type="number" name="allowances.housing" value="0">
                            </div>
                            <div class="form-group">
                                <label>Transportation:</label>
                                <input type="number" name="allowances.transportation" value="0">
                            </div>
                            <div class="form-group">
                                <label>Meal:</label>
                                <input type="number" name="allowances.meal" value="0">
                            </div>
                            
                            <h3>Deductions</h3>
                            <div class="form-group">
                                <label>Tax:</label>
                                <input type="number" name="deductions.tax" value="0">
                            </div>
                            <div class="form-group">
                                <label>Insurance:</label>
                                <input type="number" name="deductions.insurance" value="0">
                            </div>
                            <div class="form-group">
                                <label>Loan:</label>
                                <input type="number" name="deductions.loan" value="0">
                            </div>
                            
                            <button type="submit">Add Employee</button>
                        </form>
                    </div>
                `;
                break;

            case 'expense':
                content = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Add New Expense</h2>
                        <form id="addExpenseForm">
                            <div class="form-group">
                                <label>Category:</label>
                                <input type="text" name="category" required>
                            </div>
                            <div class="form-group">
                                <label>Amount:</label>
                                <input type="number" name="amount" required>
                            </div>
                            <div class="form-group">
                                <label>Date:</label>
                                <input type="date" name="date" required value="${this.currentMonth}-01">
                            </div>
                            <button type="submit">Add Expense</button>
                        </form>
                    </div>
                `;
                break;

            case 'fixedExpense':
                content = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Add Fixed Expense</h2>
                        <form id="addFixedExpenseForm">
                            <div class="form-group">
                                <label>Category:</label>
                                <input type="text" name="category" required>
                            </div>
                            <div class="form-group">
                                <label>Amount:</label>
                                <input type="number" name="amount" required>
                            </div>
                            <div class="form-group">
                                <label>Recurring:</label>
                                <input type="checkbox" name="recurring">
                            </div>
                            <button type="submit">Add Fixed Expense</button>
                        </form>
                    </div>
                `;
                break;

            case 'purchase':
                content = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Add New Purchase</h2>
                        <form id="addPurchaseForm">
                            <div class="form-group">
                                <label>Item:</label>
                                <input type="text" name="item" required>
                            </div>
                            <div class="form-group">
                                <label>Amount:</label>
                                <input type="number" name="amount" required>
                            </div>
                            <div class="form-group">
                                <label>Category:</label>
                                <input type="text" name="category" required>
                            </div>
                            <div class="form-group">
                                <label>Date:</label>
                                <input type="date" name="date" required value="${this.currentMonth}-01">
                            </div>
                            <button type="submit">Add Purchase</button>
                        </form>
                    </div>
                `;
                break;
        }

        modal.innerHTML = content;
        document.body.appendChild(modal);

        // Set up form submission
        const form = modal.querySelector('form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            let data = {};
            switch (type) {
                case 'employee':
                    data = {
                        name: formData.get('name'),
                        basicSalary: parseFloat(formData.get('basicSalary')),
                        allowances: {
                            housing: parseFloat(formData.get('allowances.housing')),
                            transportation: parseFloat(formData.get('allowances.transportation')),
                            meal: parseFloat(formData.get('allowances.meal'))
                        },
                        deductions: {
                            tax: parseFloat(formData.get('deductions.tax')),
                            insurance: parseFloat(formData.get('deductions.insurance')),
                            loan: parseFloat(formData.get('deductions.loan'))
                        }
                    };
                    payrollData.addEmployee(this.currentMonth, data);
                    break;

                case 'expense':
                    data = {
                        category: formData.get('category'),
                        amount: parseFloat(formData.get('amount')),
                        date: formData.get('date')
                    };
                    payrollData.addExpense(this.currentMonth, data);
                    break;

                case 'fixedExpense':
                    data = {
                        category: formData.get('category'),
                        amount: parseFloat(formData.get('amount')),
                        recurring: formData.get('recurring') === 'on'
                    };
                    payrollData.addFixedExpense(this.currentMonth, data);
                    break;

                case 'purchase':
                    data = {
                        item: formData.get('item'),
                        amount: parseFloat(formData.get('amount')),
                        category: formData.get('category'),
                        date: formData.get('date')
                    };
                    payrollData.addPurchase(this.currentMonth, data);
                    break;
            }

            this.refreshAllTables(this.currentMonth);
            document.body.removeChild(modal);
        };

        // Set up modal close
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    calculateDailyNet(employeeId, date) {
        const dailySalary = payrollData.calculateDailySalary(this.currentMonth, employeeId, date);
        const monthData = payrollData.getMonthData(this.currentMonth);
        
        // Get expenses for this employee on this date
        const dailyExpenses = monthData.expenses.filter(exp => 
            exp.date === date && exp.employeeId === employeeId
        ).reduce((sum, exp) => sum + exp.amount, 0);

        return dailySalary - dailyExpenses;
    }

    initializeApp() {
        // Render month list
        this.updateMonthList();
        
        // Initialize current month view
        this.switchMonth(this.currentMonth);

        // Set working days input
        const monthData = payrollData.getMonthData(this.currentMonth);
        document.getElementById('workingDaysInput').value = monthData.workingDays || 22;
    }

    updateMonthList() {
        const monthList = document.getElementById('monthList');
        const months = payrollData.getMonthList();
        
        monthList.innerHTML = months.map(month => `
            <li data-month="${month}" class="${month === this.currentMonth ? 'active' : ''}">
                ${formatMonth(month)}
            </li>
        `).join('');
    }

    switchMonth(month) {
        this.currentMonth = month;
        
        // Update UI elements
        document.getElementById('currentMonth').textContent = formatMonth(month);
        
        // Update month list selection
        const monthItems = document.querySelectorAll('#monthList li');
        monthItems.forEach(item => {
            item.classList.toggle('active', item.dataset.month === month);
        });
        
        // Update working days input
        const monthData = payrollData.getMonthData(month);
        document.getElementById('workingDaysInput').value = monthData.workingDays || 22;
        
        // Update tables and charts
        this.refreshAllTables(month);
        chartManager.updateCharts(payrollData.getMonthData(month));
    }

    switchTab(tabId) {
        // Update button states
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content visibility
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });

        // Refresh the active table
        this.refreshAllTables(this.currentMonth);
    }

    refreshAllTables(month) {
        tableManager.renderTable(month);
        this.updateExpenseTable(month);
        this.updateFixedExpenseTable(month);
        this.updatePurchaseTable(month);
    }

    updateExpenseTable(month) {
        const tbody = document.getElementById('expenseTableBody');
        const monthData = payrollData.getMonthData(month);
        
        tbody.innerHTML = (monthData.expenses || []).map(expense => `
            <tr data-id="${expense.id}">
                <td>${expense.category}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${formatDate(expense.date)}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    updateFixedExpenseTable(month) {
        const tbody = document.getElementById('fixedExpenseTableBody');
        const monthData = payrollData.getMonthData(month);
        
        tbody.innerHTML = (monthData.fixedExpenses || []).map(expense => `
            <tr data-id="${expense.id}">
                <td>${expense.category}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${expense.recurring ? 'Yes' : 'No'}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    updatePurchaseTable(month) {
        const tbody = document.getElementById('purchaseTableBody');
        const monthData = payrollData.getMonthData(month);
        
        tbody.innerHTML = (monthData.purchases || []).map(purchase => `
            <tr data-id="${purchase.id}">
                <td>${purchase.item}</td>
                <td>${formatCurrency(purchase.amount)}</td>
                <td>${purchase.category}</td>
                <td>${formatDate(purchase.date)}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// Initialize the application
const app = new App();