class ExportManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('exportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
    }

    exportToExcel() {
        const month = payrollData.getCurrentMonth();
        const monthData = payrollData.getMonthData(month);
        
        // Prepare employee data
        const employeeData = monthData.employees.map(employee => {
            const totalAllowances = calculateTotalAllowances(employee.allowances);
            const totalDeductions = calculateTotalDeductions(employee.deductions);
            const netSalary = calculateNetSalary(employee);

            return {
                'Employee Name': employee.name,
                'Basic Salary': employee.basicSalary,
                'Housing Allowance': employee.allowances.housing || 0,
                'Transportation Allowance': employee.allowances.transportation || 0,
                'Meal Allowance': employee.allowances.meal || 0,
                'Total Allowances': totalAllowances,
                'Tax': employee.deductions.tax || 0,
                'Insurance': employee.deductions.insurance || 0,
                'Loan': employee.deductions.loan || 0,
                'Total Deductions': totalDeductions,
                'Net Salary': netSalary
            };
        });

        // Prepare expense data
        const expenseData = monthData.expenses.map(expense => ({
            'Category': expense.category,
            'Amount': expense.amount,
            'Date': expense.date
        }));

        // Create workbook with multiple sheets
        const wb = XLSX.utils.book_new();
        
        // Add employee sheet
        const wsEmployees = XLSX.utils.json_to_sheet(employeeData);
        XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employees');
        
        // Add expense sheet
        const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
        
        // Add summary sheet
        const totals = payrollData.calculateTotals(month);
        const summaryData = [{
            'Total Payroll': totals.totalPayroll,
            'Total Employees': totals.totalEmployees,
            'Total Expenses': totals.totalExpenses
        }];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Generate filename with month and year
        const filename = `Payroll_${formatMonth(month).replace(' ', '_')}.xlsx`;
        
        // Save the file
        XLSX.writeFile(wb, filename);
    }

    exportToPDF() {
        const month = payrollData.getCurrentMonth();
        const monthData = payrollData.getMonthData(month);
        const { jsPDF } = window.jspdf;

        // Create PDF document
        const doc = new jsPDF();
        let yPos = 20;

        // Add title
        doc.setFontSize(16);
        doc.text(`Payroll Report - ${formatMonth(month)}`, 20, yPos);
        yPos += 15;

        // Add summary section
        doc.setFontSize(12);
        const totals = payrollData.calculateTotals(month);
        doc.text(`Total Payroll: ${formatCurrency(totals.totalPayroll)}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Employees: ${totals.totalEmployees}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Expenses: ${formatCurrency(totals.totalExpenses)}`, 20, yPos);
        yPos += 20;

        // Add employee table
        doc.setFontSize(14);
        doc.text('Employee Details', 20, yPos);
        yPos += 10;

        // Table headers
        doc.setFontSize(10);
        const headers = ['Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary'];
        let xPos = 20;
        headers.forEach(header => {
            doc.text(header, xPos, yPos);
            xPos += 35;
        });
        yPos += 10;

        // Table rows
        doc.setFontSize(9);
        monthData.employees.forEach(employee => {
            if (yPos > 270) {
                // Add new page if content exceeds page height
                doc.addPage();
                yPos = 20;
            }

            const totalAllowances = calculateTotalAllowances(employee.allowances);
            const totalDeductions = calculateTotalDeductions(employee.deductions);
            const netSalary = calculateNetSalary(employee);

            xPos = 20;
            doc.text(employee.name, xPos, yPos);
            xPos += 35;
            doc.text(formatCurrency(employee.basicSalary), xPos, yPos);
            xPos += 35;
            doc.text(formatCurrency(totalAllowances), xPos, yPos);
            xPos += 35;
            doc.text(formatCurrency(totalDeductions), xPos, yPos);
            xPos += 35;
            doc.text(formatCurrency(netSalary), xPos, yPos);
            
            yPos += 10;
        });

        // Add expense section
        if (monthData.expenses.length > 0) {
            // Add new page for expenses
            doc.addPage();
            yPos = 20;

            doc.setFontSize(14);
            doc.text('Expense Details', 20, yPos);
            yPos += 15;

            // Expense headers
            doc.setFontSize(10);
            const expenseHeaders = ['Category', 'Amount', 'Date'];
            xPos = 20;
            expenseHeaders.forEach(header => {
                doc.text(header, xPos, yPos);
                xPos += 50;
            });
            yPos += 10;

            // Expense rows
            doc.setFontSize(9);
            monthData.expenses.forEach(expense => {
                xPos = 20;
                doc.text(expense.category, xPos, yPos);
                xPos += 50;
                doc.text(formatCurrency(expense.amount), xPos, yPos);
                xPos += 50;
                doc.text(formatDate(expense.date), xPos, yPos);
                yPos += 10;
            });
        }

        // Save the PDF
        const filename = `Payroll_${formatMonth(month).replace(' ', '_')}.pdf`;
        doc.save(filename);
    }
}

// Create global export manager instance
const exportManager = new ExportManager();