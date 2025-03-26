class TableManager {
    constructor() {
        this.tableBody = document.getElementById('employeeTableBody');
        this.currentMonth = payrollData.getCurrentMonth();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle row action buttons
        this.tableBody.addEventListener('click', (e) => {
            const target = e.target;
            const row = target.closest('tr');
            
            if (!row) return;
            
            const employeeId = parseInt(row.dataset.employeeId);
            
            if (target.classList.contains('view-btn')) {
                this.viewEmployee(employeeId);
            } else if (target.classList.contains('edit-btn')) {
                this.editEmployee(employeeId);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteEmployee(employeeId);
            }
        });
    }

    renderTable(month = this.currentMonth) {
        const monthData = payrollData.getMonthData(month);
        this.tableBody.innerHTML = '';

        monthData.employees.forEach(employee => {
            const row = this.createTableRow(employee);
            this.tableBody.appendChild(row);
        });

        // Update summary cards
        this.updateSummaryCards(month);
    }

    createTableRow(employee) {
        const row = document.createElement('tr');
        row.dataset.employeeId = employee.id;

        const totalAllowances = calculateTotalAllowances(employee.allowances);
        const totalDeductions = calculateTotalDeductions(employee.deductions);
        const netSalary = calculateNetSalary(employee);

        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${formatCurrency(employee.basicSalary)}</td>
            <td>${formatCurrency(totalAllowances)}</td>
            <td>${formatCurrency(totalDeductions)}</td>
            <td>${formatCurrency(netSalary)}</td>
            <td class="action-buttons">
                <button class="view-btn">View</button>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        return row;
    }

    viewEmployee(employeeId) {
        const employee = payrollData.getMonthData(this.currentMonth).employees
            .find(emp => emp.id === employeeId);

        if (!employee) return;

        const payslip = generatePayslip(employee, this.currentMonth);
        this.showPayslipModal(payslip);
    }

    editEmployee(employeeId) {
        const employee = payrollData.getMonthData(this.currentMonth).employees
            .find(emp => emp.id === employeeId);

        if (!employee) return;

        this.showEditModal(employee);
    }

    deleteEmployee(employeeId) {
        if (confirm('Are you sure you want to delete this employee?')) {
            const deleted = payrollData.deleteEmployee(this.currentMonth, employeeId);
            
            if (deleted) {
                this.renderTable(this.currentMonth);
                chartManager.updateCharts(payrollData.getMonthData(this.currentMonth));
            }
        }
    }

    showPayslipModal(payslip) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Employee Payslip - ${payslip.month}</h2>
                <div class="payslip-content">
                    <p><strong>Employee Name:</strong> ${payslip.employeeName}</p>
                    <p><strong>Basic Salary:</strong> ${payslip.basicSalary}</p>
                    
                    <h3>Allowances</h3>
                    ${payslip.allowances.map(a => 
                        `<p>${a.type}: ${a.amount}</p>`
                    ).join('')}
                    <p><strong>Total Allowances:</strong> ${payslip.totalAllowances}</p>
                    
                    <h3>Deductions</h3>
                    ${payslip.deductions.map(d => 
                        `<p>${d.type}: ${d.amount}</p>`
                    ).join('')}
                    <p><strong>Total Deductions:</strong> ${payslip.totalDeductions}</p>
                    
                    <h3>Net Salary: ${payslip.netSalary}</h3>
                </div>
                <div class="modal-actions">
                    <button onclick="downloadPDF(${JSON.stringify(payslip)}, 'payslip.pdf')">
                        Download PDF
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

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

    showEditModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Employee</h2>
                <form id="editEmployeeForm">
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value="${employee.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Basic Salary:</label>
                        <input type="number" name="basicSalary" value="${employee.basicSalary}" required>
                    </div>
                    
                    <h3>Allowances</h3>
                    <div class="form-group">
                        <label>Housing:</label>
                        <input type="number" name="allowances.housing" value="${employee.allowances.housing || 0}">
                    </div>
                    <div class="form-group">
                        <label>Transportation:</label>
                        <input type="number" name="allowances.transportation" value="${employee.allowances.transportation || 0}">
                    </div>
                    <div class="form-group">
                        <label>Meal:</label>
                        <input type="number" name="allowances.meal" value="${employee.allowances.meal || 0}">
                    </div>
                    
                    <h3>Deductions</h3>
                    <div class="form-group">
                        <label>Tax:</label>
                        <input type="number" name="deductions.tax" value="${employee.deductions.tax || 0}">
                    </div>
                    <div class="form-group">
                        <label>Insurance:</label>
                        <input type="number" name="deductions.insurance" value="${employee.deductions.insurance || 0}">
                    </div>
                    <div class="form-group">
                        <label>Loan:</label>
                        <input type="number" name="deductions.loan" value="${employee.deductions.loan || 0}">
                    </div>
                    
                    <button type="submit">Save Changes</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#editEmployeeForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const updates = {
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

            const validation = validateEmployee(updates);
            if (!validation.isValid) {
                alert(validation.errors.join('\n'));
                return;
            }

            const updated = payrollData.updateEmployee(this.currentMonth, employee.id, updates);
            
            if (updated) {
                this.renderTable(this.currentMonth);
                chartManager.updateCharts(payrollData.getMonthData(this.currentMonth));
                document.body.removeChild(modal);
            }
        };

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

    updateSummaryCards(month) {
        const totals = payrollData.calculateTotals(month);
        
        document.getElementById('totalPayroll').textContent = formatCurrency(totals.totalPayroll);
        document.getElementById('totalEmployees').textContent = totals.totalEmployees;
        document.getElementById('totalExpenses').textContent = formatCurrency(totals.totalExpenses);
    }
}

// Create global table manager instance
const tableManager = new TableManager();