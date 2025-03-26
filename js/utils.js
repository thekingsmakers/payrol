// Format currency amounts
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date to locale string
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format month for display
function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
}

// Calculate total allowances for an employee
function calculateTotalAllowances(allowances) {
    return Object.values(allowances).reduce((sum, amount) => sum + amount, 0);
}

// Calculate total deductions for an employee
function calculateTotalDeductions(deductions) {
    return Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
}

// Calculate net salary for an employee
function calculateNetSalary(employee) {
    const totalAllowances = calculateTotalAllowances(employee.allowances);
    const totalDeductions = calculateTotalDeductions(employee.deductions);
    return employee.basicSalary + totalAllowances - totalDeductions;
}

// Generate a PDF payslip
function generatePayslip(employee, month) {
    const totalAllowances = calculateTotalAllowances(employee.allowances);
    const totalDeductions = calculateTotalDeductions(employee.deductions);
    const netSalary = calculateNetSalary(employee);

    return {
        employeeName: employee.name,
        month: formatMonth(month),
        basicSalary: formatCurrency(employee.basicSalary),
        allowances: Object.entries(employee.allowances).map(([key, value]) => ({
            type: key.charAt(0).toUpperCase() + key.slice(1),
            amount: formatCurrency(value)
        })),
        deductions: Object.entries(employee.deductions).map(([key, value]) => ({
            type: key.charAt(0).toUpperCase() + key.slice(1),
            amount: formatCurrency(value)
        })),
        totalAllowances: formatCurrency(totalAllowances),
        totalDeductions: formatCurrency(totalDeductions),
        netSalary: formatCurrency(netSalary)
    };
}

// Generate salary data for charts
function generateChartData(monthData) {
    const employeeData = monthData.employees.map(emp => ({
        name: emp.name,
        netSalary: calculateNetSalary(emp)
    }));

    const expenseData = monthData.expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
            acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
    }, {});

    return {
        salaryData: {
            labels: employeeData.map(emp => emp.name),
            values: employeeData.map(emp => emp.netSalary)
        },
        expenseData: {
            labels: Object.keys(expenseData),
            values: Object.values(expenseData)
        }
    };
}

// Download data as Excel file
function downloadExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Data');
    XLSX.writeFile(wb, filename);
}

// Download data as PDF
function downloadPDF(data, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(12);
    let yPos = 20;
    
    // Add content to PDF
    Object.entries(data).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPos);
        yPos += 10;
    });
    
    doc.save(filename);
}

// Validate employee data
function validateEmployee(employee) {
    const errors = [];

    if (!employee.name || employee.name.trim() === '') {
        errors.push('Employee name is required');
    }

    if (!employee.basicSalary || employee.basicSalary <= 0) {
        errors.push('Basic salary must be greater than 0');
    }

    if (!employee.allowances || typeof employee.allowances !== 'object') {
        errors.push('Invalid allowances data');
    }

    if (!employee.deductions || typeof employee.deductions !== 'object') {
        errors.push('Invalid deductions data');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}