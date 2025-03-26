// Sample data structure
const initialData = {
    employees: [
        {
            id: 1,
            name: "John Doe",
            basicSalary: 5000,
            allowances: {
                housing: 1000,
                transportation: 500,
                meal: 200
            },
            deductions: {
                tax: 300,
                insurance: 200,
                loan: 0
            },
            dailyWork: {} // Will store daily work records
        }
    ],
    expenses: [
        {
            id: 1,
            category: "Office Supplies",
            amount: 1500,
            date: "2025-03-01"
        }
    ],
    fixedExpenses: [
        {
            id: 1,
            category: "Rent",
            amount: 2000,
            recurring: true
        }
    ],
    purchases: [
        {
            id: 1,
            item: "Office Equipment",
            amount: 1000,
            date: "2025-03-15",
            category: "Assets"
        }
    ],
    workingDays: 22 // Default working days per month
};

class PayrollData {
    constructor() {
        this.loadData();
    }

    loadData() {
        const savedData = localStorage.getItem('payrollData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            this.data = {
                [this.getCurrentMonth()]: { ...initialData }
            };
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('payrollData', JSON.stringify(this.data));
    }

    getCurrentMonth() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    getCurrentDate() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getMonthList() {
        return Object.keys(this.data).sort((a, b) => b.localeCompare(a));
    }

    getMonthData(month = this.getCurrentMonth()) {
        return this.data[month] || {
            employees: [],
            expenses: [],
            fixedExpenses: [],
            purchases: [],
            workingDays: 22
        };
    }

    setWorkingDays(month, days) {
        if (!this.data[month]) {
            this.data[month] = {
                employees: [],
                expenses: [],
                fixedExpenses: [],
                purchases: [],
                workingDays: days
            };
        } else {
            this.data[month].workingDays = days;
        }
        this.saveData();
    }

    addDailyWork(month, employeeId, date, workData) {
        const employee = this.data[month].employees.find(emp => emp.id === employeeId);
        if (employee) {
            if (!employee.dailyWork) {
                employee.dailyWork = {};
            }
            employee.dailyWork[date] = {
                ...workData,
                timestamp: new Date().toISOString()
            };
            this.saveData();
            return true;
        }
        return false;
    }

    getDailyWork(month, employeeId, date) {
        const employee = this.data[month].employees.find(emp => emp.id === employeeId);
        return employee?.dailyWork?.[date] || null;
    }

    calculateDailySalary(month, employeeId, date) {
        const employee = this.data[month].employees.find(emp => emp.id === employeeId);
        const workData = this.getDailyWork(month, employeeId, date);
        
        if (!employee || !workData) return 0;

        const dailyRate = employee.basicSalary / this.data[month].workingDays;
        const overtime = workData.overtimeHours * (dailyRate / 8) * 1.5; // Assuming 8-hour workday
        
        return workData.worked ? dailyRate + overtime + (workData.bonus || 0) : 0;
    }

    addEmployee(month, employee) {
        if (!this.data[month]) {
            this.data[month] = {
                employees: [],
                expenses: [],
                fixedExpenses: [],
                purchases: [],
                workingDays: 22
            };
        }
        
        const newEmployee = {
            ...employee,
            id: Date.now(),
            dailyWork: {}
        };
        
        this.data[month].employees.push(newEmployee);
        this.saveData();
        return newEmployee;
    }

    updateEmployee(month, employeeId, updates) {
        const employeeIndex = this.data[month].employees.findIndex(emp => emp.id === employeeId);
        if (employeeIndex !== -1) {
            this.data[month].employees[employeeIndex] = {
                ...this.data[month].employees[employeeIndex],
                ...updates,
                dailyWork: this.data[month].employees[employeeIndex].dailyWork || {}
            };
            this.saveData();
            return true;
        }
        return false;
    }

    addExpense(month, expense) {
        if (!this.data[month]) {
            this.data[month] = {
                employees: [],
                expenses: [],
                fixedExpenses: [],
                purchases: [],
                workingDays: 22
            };
        }
        
        const newExpense = {
            ...expense,
            id: Date.now()
        };
        
        this.data[month].expenses.push(newExpense);
        this.saveData();
        return newExpense;
    }

    addFixedExpense(month, expense) {
        if (!this.data[month].fixedExpenses) {
            this.data[month].fixedExpenses = [];
        }
        
        const newExpense = {
            ...expense,
            id: Date.now()
        };
        
        this.data[month].fixedExpenses.push(newExpense);
        this.saveData();
        return newExpense;
    }

    addPurchase(month, purchase) {
        if (!this.data[month].purchases) {
            this.data[month].purchases = [];
        }
        
        const newPurchase = {
            ...purchase,
            id: Date.now()
        };
        
        this.data[month].purchases.push(newPurchase);
        this.saveData();
        return newPurchase;
    }

    calculateTotals(month) {
        const monthData = this.getMonthData(month);
        const employees = monthData.employees;
        
        const totalPayroll = employees.reduce((sum, emp) => {
            let monthlySalary = 0;
            const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
            
            // Calculate salary based on daily work records
            for (let day = 1; day <= daysInMonth; day++) {
                const date = `${month}-${String(day).padStart(2, '0')}`;
                monthlySalary += this.calculateDailySalary(month, emp.id, date);
            }
            
            return sum + monthlySalary;
        }, 0);

        const totalExpenses = (monthData.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
        const totalFixedExpenses = (monthData.fixedExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);
        const totalPurchases = (monthData.purchases || []).reduce((sum, pur) => sum + pur.amount, 0);

        return {
            totalPayroll,
            totalEmployees: employees.length,
            totalExpenses,
            totalFixedExpenses,
            totalPurchases,
            grandTotal: totalPayroll + totalExpenses + totalFixedExpenses + totalPurchases
        };
    }
}

// Create global instance
const payrollData = new PayrollData();