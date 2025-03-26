class DailyWorkManager {
    constructor() {
        this.currentMonth = payrollData.getCurrentMonth();
        this.currentDate = payrollData.getCurrentDate();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('viewDailyWork').addEventListener('click', () => {
            this.showDailyWorkModal();
        });
    }

    showDailyWorkModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const monthData = payrollData.getMonthData(this.currentMonth);
        const employees = monthData.employees;
        
        modal.innerHTML = `
            <div class="modal-content daily-work-modal">
                <span class="close">&times;</span>
                <h2>Daily Work Management - ${formatMonth(this.currentMonth)}</h2>
                
                <div class="date-selector">
                    <label>Select Date:</label>
                    <input type="date" id="workDate" value="${this.currentDate}">
                </div>

                <div class="work-records">
                    <table id="dailyWorkTable">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Present</th>
                                <th>Hours</th>
                                <th>Overtime</th>
                                <th>Bonus</th>
                                <th>Daily Salary</th>
                                <th>Daily Expenses</th>
                                <th>Net Earnings</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.map(emp => {
                                const workData = payrollData.getDailyWork(this.currentMonth, emp.id, this.currentDate) || {};
                                const dailyNetData = this.calculateDailyNetEarnings(emp.id, this.currentDate);
                                return `
                                    <tr data-employee-id="${emp.id}">
                                        <td>${emp.name}</td>
                                        <td>
                                            <input type="checkbox" class="work-present" 
                                                ${workData.worked ? 'checked' : ''}>
                                        </td>
                                        <td>
                                            <input type="number" class="work-hours" value="${workData.hours || 8}" 
                                                min="0" max="24" step="0.5">
                                        </td>
                                        <td>
                                            <input type="number" class="work-overtime" 
                                                value="${workData.overtimeHours || 0}" min="0" max="12" step="0.5">
                                        </td>
                                        <td>
                                            <input type="number" class="work-bonus" 
                                                value="${workData.bonus || 0}" min="0">
                                        </td>
                                        <td>${formatCurrency(dailyNetData.dailySalary)}</td>
                                        <td>${formatCurrency(dailyNetData.dailyExpenses)}</td>
                                        <td class="net-earnings">${formatCurrency(dailyNetData.netEarnings)}</td>
                                        <td>
                                            <input type="text" class="work-notes" 
                                                value="${workData.notes || ''}">
                                        </td>
                                        <td>
                                            <button class="save-work-btn">Save</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="daily-summary">
                    <h3>Daily Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Present Employees:</label>
                            <span id="presentCount">0</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Hours:</label>
                            <span id="totalHours">0</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Overtime:</label>
                            <span id="totalOvertime">0</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Daily Salary:</label>
                            <span id="totalDailySalary">$0</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Daily Expenses:</label>
                            <span id="totalDailyExpenses">$0</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Net Earnings:</label>
                            <span id="totalNetEarnings">$0</span>
                        </div>
                    </div>
                </div>

                <div class="expense-entry">
                    <h3>Add Daily Expense</h3>
                    <form id="dailyExpenseForm">
                        <div class="form-group">
                            <label>Employee:</label>
                            <select name="employeeId" required>
                                ${employees.map(emp => `
                                    <option value="${emp.id}">${emp.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Category:</label>
                            <input type="text" name="category" required>
                        </div>
                        <div class="form-group">
                            <label>Amount:</label>
                            <input type="number" name="amount" required min="0" step="0.01">
                        </div>
                        <button type="submit">Add Expense</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event Listeners
        const dateInput = modal.querySelector('#workDate');
        dateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.refreshDailyWorkTable(modal);
        });

        const workTable = modal.querySelector('#dailyWorkTable');
        workTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-work-btn')) {
                const row = e.target.closest('tr');
                this.saveWorkRecord(row);
            }
        });

        workTable.addEventListener('change', () => {
            this.updateDailySummary(modal);
        });

        const expenseForm = modal.querySelector('#dailyExpenseForm');
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDailyExpense(e.target, modal);
        });

        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };

        // Initial summary update
        this.updateDailySummary(modal);
    }

    calculateDailyNetEarnings(employeeId, date) {
        const workData = payrollData.getDailyWork(this.currentMonth, employeeId, date) || {};
        const monthData = payrollData.getMonthData(this.currentMonth);
        const employee = monthData.employees.find(emp => emp.id === employeeId);

        if (!employee || !workData.worked) {
            return { dailySalary: 0, dailyExpenses: 0, netEarnings: 0 };
        }

        // Calculate daily salary
        const dailySalary = payrollData.calculateDailySalary(this.currentMonth, employeeId, date);

        // Calculate daily expenses
        const dailyExpenses = (monthData.expenses || [])
            .filter(exp => exp.date === date && exp.employeeId === employeeId)
            .reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate net earnings
        const netEarnings = dailySalary - dailyExpenses;

        return { dailySalary, dailyExpenses, netEarnings };
    }

    addDailyExpense(form, modal) {
        const formData = new FormData(form);
        const expense = {
            employeeId: parseInt(formData.get('employeeId')),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            date: this.currentDate
        };

        payrollData.addExpense(this.currentMonth, expense);
        form.reset();
        this.refreshDailyWorkTable(modal);
    }

    refreshDailyWorkTable(modal) {
        const tbody = modal.querySelector('#dailyWorkTable tbody');
        const monthData = payrollData.getMonthData(this.currentMonth);
        
        tbody.innerHTML = monthData.employees.map(emp => {
            const workData = payrollData.getDailyWork(this.currentMonth, emp.id, this.currentDate) || {};
            const dailyNetData = this.calculateDailyNetEarnings(emp.id, this.currentDate);
            return `
                <tr data-employee-id="${emp.id}">
                    <td>${emp.name}</td>
                    <td>
                        <input type="checkbox" class="work-present" 
                            ${workData.worked ? 'checked' : ''}>
                    </td>
                    <td>
                        <input type="number" class="work-hours" value="${workData.hours || 8}" 
                            min="0" max="24" step="0.5">
                    </td>
                    <td>
                        <input type="number" class="work-overtime" 
                            value="${workData.overtimeHours || 0}" min="0" max="12" step="0.5">
                    </td>
                    <td>
                        <input type="number" class="work-bonus" 
                            value="${workData.bonus || 0}" min="0">
                    </td>
                    <td>${formatCurrency(dailyNetData.dailySalary)}</td>
                    <td>${formatCurrency(dailyNetData.dailyExpenses)}</td>
                    <td class="net-earnings">${formatCurrency(dailyNetData.netEarnings)}</td>
                    <td>
                        <input type="text" class="work-notes" 
                            value="${workData.notes || ''}">
                    </td>
                    <td>
                        <button class="save-work-btn">Save</button>
                    </td>
                </tr>
            `;
        }).join('');

        this.updateDailySummary(modal);
    }

    saveWorkRecord(row) {
        const employeeId = parseInt(row.dataset.employeeId);
        const present = row.querySelector('.work-present').checked;
        const hours = parseFloat(row.querySelector('.work-hours').value) || 0;
        const overtime = parseFloat(row.querySelector('.work-overtime').value) || 0;
        const bonus = parseFloat(row.querySelector('.work-bonus').value) || 0;
        const notes = row.querySelector('.work-notes').value;

        const workData = {
            worked: present,
            hours: hours,
            overtimeHours: overtime,
            bonus: bonus,
            notes: notes
        };

        const success = payrollData.addDailyWork(this.currentMonth, employeeId, this.currentDate, workData);
        
        if (success) {
            this.showNotification('Work record saved successfully');
            const dailyNetData = this.calculateDailyNetEarnings(employeeId, this.currentDate);
            row.querySelector('td:nth-child(6)').textContent = formatCurrency(dailyNetData.dailySalary);
            row.querySelector('td:nth-child(7)').textContent = formatCurrency(dailyNetData.dailyExpenses);
            row.querySelector('td:nth-child(8)').textContent = formatCurrency(dailyNetData.netEarnings);
            
            this.updateDailySummary(row.closest('.modal'));
            tableManager.renderTable(this.currentMonth);
            chartManager.updateCharts(payrollData.getMonthData(this.currentMonth));
        } else {
            this.showNotification('Error saving work record', 'error');
        }
    }

    updateDailySummary(modal) {
        const rows = modal.querySelectorAll('#dailyWorkTable tbody tr');
        let presentCount = 0;
        let totalHours = 0;
        let totalOvertime = 0;
        let totalDailySalary = 0;
        let totalDailyExpenses = 0;
        let totalNetEarnings = 0;

        rows.forEach(row => {
            const employeeId = parseInt(row.dataset.employeeId);
            const present = row.querySelector('.work-present').checked;
            const hours = parseFloat(row.querySelector('.work-hours').value) || 0;
            const overtime = parseFloat(row.querySelector('.work-overtime').value) || 0;

            if (present) {
                presentCount++;
                totalHours += hours;
                totalOvertime += overtime;

                const dailyNetData = this.calculateDailyNetEarnings(employeeId, this.currentDate);
                totalDailySalary += dailyNetData.dailySalary;
                totalDailyExpenses += dailyNetData.dailyExpenses;
                totalNetEarnings += dailyNetData.netEarnings;
            }
        });

        modal.querySelector('#presentCount').textContent = presentCount;
        modal.querySelector('#totalHours').textContent = totalHours.toFixed(1);
        modal.querySelector('#totalOvertime').textContent = totalOvertime.toFixed(1);
        modal.querySelector('#totalDailySalary').textContent = formatCurrency(totalDailySalary);
        modal.querySelector('#totalDailyExpenses').textContent = formatCurrency(totalDailyExpenses);
        modal.querySelector('#totalNetEarnings').textContent = formatCurrency(totalNetEarnings);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Create global instance
const dailyWorkManager = new DailyWorkManager();