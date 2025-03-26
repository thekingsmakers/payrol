// Chart configuration and rendering
class ChartManager {
    constructor() {
        this.salaryTrendsChart = null;
        this.expenseChart = null;
        this.initCharts();
    }

    initCharts() {
        // Initialize Salary Trends Chart
        const salaryCtx = document.getElementById('salaryTrendsChart').getContext('2d');
        this.salaryTrendsChart = new Chart(salaryCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Net Salary',
                    data: [],
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Employee Salary Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: context => formatCurrency(context.parsed.y)
                        }
                    }
                }
            }
        });

        // Initialize Expense Chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        this.expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(230, 126, 34, 0.8)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(155, 89, 182, 1)',
                        'rgba(241, 196, 15, 1)',
                        'rgba(230, 126, 34, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expense Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts(monthData) {
        const { salaryData, expenseData } = generateChartData(monthData);

        // Update Salary Trends Chart
        this.salaryTrendsChart.data.labels = salaryData.labels;
        this.salaryTrendsChart.data.datasets[0].data = salaryData.values;
        this.salaryTrendsChart.update();

        // Update Expense Chart
        this.expenseChart.data.labels = expenseData.labels;
        this.expenseChart.data.datasets[0].data = expenseData.values;
        this.expenseChart.update();
    }

    // Destroy charts when needed (e.g., during cleanup)
    destroyCharts() {
        if (this.salaryTrendsChart) {
            this.salaryTrendsChart.destroy();
        }
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }
    }

    // Resize charts when window size changes
    resizeCharts() {
        if (this.salaryTrendsChart) {
            this.salaryTrendsChart.resize();
        }
        if (this.expenseChart) {
            this.expenseChart.resize();
        }
    }
}

// Create global chart manager instance
const chartManager = new ChartManager();

// Handle window resize
window.addEventListener('resize', () => {
    chartManager.resizeCharts();
});