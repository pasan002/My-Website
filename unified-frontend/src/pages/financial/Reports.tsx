import { useEffect, useState, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import jsPDF from 'jspdf';

type ReportData = {
    monthly: { expenses: number; incomes: number };
    yearly: { expenses: number; incomes: number };
};

type Expense = { 
    _id: string; 
    date: string; 
    category: string; 
    description: string; 
    amount: number; 
    documentPath?: string;
    status: string;
};

type Income = { 
    _id: string; 
    date: string; 
    category: string; 
    description: string; 
    amount: number; 
    source: string;
    status: string;
};

export default function FinancialReports() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<string>('All Categories');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        loadReportData();
    }, []);

    // Reload data when month or year changes
    useEffect(() => {
        if (expenses.length > 0 || incomes.length > 0) {
            loadReportData();
        }
    }, [selectedMonth, selectedYear]);

    const loadReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch expenses and incomes from backend
            const [expensesResponse, incomesResponse] = await Promise.all([
                api.get('/expenses'),
                api.get('/incomes')
            ]);

            const expensesData = expensesResponse.data.data.expenses;
            const incomesData = incomesResponse.data.data.incomes;

            setExpenses(expensesData);
            setIncomes(incomesData);

            // Calculate monthly and yearly totals using selected month/year
                // Calculate monthly totals for selected month and year
                const monthlyExpenses = expensesData
                    .filter((expense: any) => {
                        const expenseDate = new Date(expense.date);
                        return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
                    })
                    .reduce((sum: number, expense: any) => sum + expense.amount, 0);

                const monthlyIncomes = incomesData
                    .filter((income: any) => {
                        const incomeDate = new Date(income.date);
                        return incomeDate.getMonth() === selectedMonth && incomeDate.getFullYear() === selectedYear;
                    })
                    .reduce((sum: number, income: any) => sum + income.amount, 0);

                // Calculate yearly totals for selected year
                const yearlyExpenses = expensesData
                    .filter((expense: any) => {
                        const expenseDate = new Date(expense.date);
                        return expenseDate.getFullYear() === selectedYear;
                    })
                    .reduce((sum: number, expense: any) => sum + expense.amount, 0);

                const yearlyIncomes = incomesData
                    .filter((income: any) => {
                        const incomeDate = new Date(income.date);
                        return incomeDate.getFullYear() === selectedYear;
                    })
                    .reduce((sum: number, income: any) => sum + income.amount, 0);

            setReportData({
                monthly: { expenses: monthlyExpenses, incomes: monthlyIncomes },
                yearly: { expenses: yearlyExpenses, incomes: yearlyIncomes }
            });

        } catch (e: any) {
            console.error('Error loading report data:', e);
            setError(e?.response?.data?.message || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories from expenses
    const expenseCategories = useMemo(() => {
        return [...new Set(expenses.map(e => e.category))];
    }, [expenses]);

    // Filter expenses by category and selected month/year
    const filteredExpenses = useMemo(() => {
        let filtered = expenses;
        
        // Filter by category
        if (category !== 'All Categories') {
            filtered = filtered.filter(expense => expense.category === category);
        }
        
        // Filter by selected month and year
        filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
        });
        
        return filtered;
    }, [expenses, category, selectedMonth, selectedYear]);

    const generateDetailedReport = async (type: 'monthly' | 'yearly') => {
        setIsGeneratingPDF(true);
        try {
            // Refresh the data to get latest information
            await loadReportData();
            
            const period = type === 'monthly' 
                ? new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : selectedYear.toString();
            
            const reportSummary = type === 'monthly' ? reportData?.monthly : reportData?.yearly;
            
            if (!reportSummary) {
                alert('No data available for the selected period');
                return;
            }

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Add header with logo
            pdf.setFontSize(20);
            pdf.setTextColor(0, 128, 128); // Teal color
            pdf.text('WasteWise Financial Report', pageWidth / 2, 20, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${period}`, pageWidth / 2, 30, { align: 'center' });
            
            // Add report date
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
            
            // Add financial summary
            pdf.setFontSize(16);
            pdf.text('Financial Summary', 20, 60);
            
            pdf.setFontSize(12);
            const netAmount = reportSummary.incomes - reportSummary.expenses;
            const profitMargin = reportSummary.incomes > 0 ? ((netAmount / reportSummary.incomes) * 100).toFixed(1) : '0.0';
            
            pdf.text(`Total Income: LKR ${reportSummary.incomes.toFixed(2)}`, 20, 75);
            pdf.text(`Total Expenses: LKR ${reportSummary.expenses.toFixed(2)}`, 20, 85);
            pdf.text(`Net Income: LKR ${netAmount.toFixed(2)}`, 20, 95);
            pdf.text(`Profit Margin: ${profitMargin}%`, 20, 105);
            
            // Add visual indicators
            pdf.setDrawColor(0, 128, 128);
            pdf.setLineWidth(0.5);
            pdf.line(20, 110, pageWidth - 20, 110);
            
            // Add expense breakdown with categories
            if (type === 'monthly') {
                const monthlyExpenses = expenses.filter((expense: any) => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
                });
                
                if (monthlyExpenses.length > 0) {
                    pdf.setFontSize(14);
                    pdf.text('Expense Breakdown', 20, 125);
                    
                    // Category summary
                    const categoryTotals: { [key: string]: number } = {};
                    monthlyExpenses.forEach((expense: any) => {
                        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
                    });
                    
                    pdf.setFontSize(10);
                    let yPos = 135;
                    Object.entries(categoryTotals)
                        .sort(([,a], [,b]) => b - a)
                        .forEach(([category, total]) => {
                            if (yPos > pageHeight - 20) {
                                pdf.addPage();
                                yPos = 20;
                            }
                            pdf.text(`${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}: LKR ${total.toFixed(2)}`, 20, yPos);
                            yPos += 6;
                        });
                    
                    // Detailed expenses
                    pdf.setFontSize(12);
                    pdf.text('Detailed Expenses', 20, yPos + 10);
                    
                    pdf.setFontSize(8);
                    yPos += 20;
                    monthlyExpenses.slice(0, 15).forEach((expense: any, index: number) => {
                        if (yPos > pageHeight - 20) {
                            pdf.addPage();
                            yPos = 20;
                        }
                        pdf.text(`${index + 1}. ${expense.description} - LKR ${expense.amount.toFixed(2)} (${expense.category})`, 20, yPos);
                        yPos += 5;
                    });
                }
            } else {
                // Yearly report - show monthly breakdown
                pdf.setFontSize(14);
                pdf.text('Monthly Breakdown', 20, 125);
                
                pdf.setFontSize(10);
                let yPos = 135;
                for (let month = 0; month < 12; month++) {
                    const monthExpenses = expenses.filter((expense: any) => {
                        const expenseDate = new Date(expense.date);
                        return expenseDate.getMonth() === month && expenseDate.getFullYear() === selectedYear;
                    });
                    
                    const monthIncomes = incomes.filter((income: any) => {
                        const incomeDate = new Date(income.date);
                        return incomeDate.getMonth() === month && incomeDate.getFullYear() === selectedYear;
                    });
                    
                    const monthTotalExpenses = monthExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
                    const monthTotalIncomes = monthIncomes.reduce((sum: number, income: any) => sum + income.amount, 0);
                    const monthNet = monthTotalIncomes - monthTotalExpenses;
                    
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    const monthName = new Date(0, month).toLocaleDateString('en-US', { month: 'long' });
                    pdf.text(`${monthName}: Income LKR ${monthTotalIncomes.toFixed(2)}, Expenses LKR ${monthTotalExpenses.toFixed(2)}, Net LKR ${monthNet.toFixed(2)}`, 20, yPos);
                    yPos += 6;
                }
            }
            
            // Add summary statistics
            pdf.setFontSize(12);
            let yPos = 20; // Initialize yPos for summary section
            pdf.text('Key Statistics', 20, yPos + 20);
            
            pdf.setFontSize(10);
            const avgMonthlyIncome = type === 'yearly' ? reportSummary.incomes / 12 : reportSummary.incomes;
            const avgMonthlyExpense = type === 'yearly' ? reportSummary.expenses / 12 : reportSummary.expenses;
            
            pdf.text(`Average Monthly Income: LKR ${avgMonthlyIncome.toFixed(2)}`, 20, yPos + 35);
            pdf.text(`Average Monthly Expense: LKR ${avgMonthlyExpense.toFixed(2)}`, 20, yPos + 45);
            pdf.text(`Total Transactions: ${type === 'monthly' ? expenses.filter((e: any) => {
                const d = new Date(e.date);
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
            }).length : expenses.filter((e: any) => new Date(e.date).getFullYear() === selectedYear).length}`, 20, yPos + 55);
            
            // Add footer
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Generated by WasteWise Smart Waste Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Download the PDF
            const fileName = `WasteWise_${type}_Report_${period.replace(' ', '_')}.pdf`;
            pdf.save(fileName);
            
        } catch (e: any) {
            console.error('Error generating PDF:', e);
            setError('Failed to generate PDF report');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 p-6 text-white">
                <h2 className="text-2xl font-semibold">Financial Reports</h2>
                <p className="mt-1 text-sm text-emerald-50">Generate and export monthly and yearly financial summaries.</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Report */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center gap-2">
                                📊 Monthly Report
                                <span className="text-sm text-gray-500">
                                    ({new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                                </span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded border px-2 py-1 text-sm"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="rounded border px-2 py-1 text-sm"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : reportData ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Income</p>
                                        <p className="font-semibold text-emerald-600">LKR {reportData.monthly.incomes.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Expenses</p>
                                        <p className="font-semibold text-sky-600">LKR {reportData.monthly.expenses.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-gray-500 text-sm">Net</p>
                                    <p className={`font-semibold ${reportData.monthly.incomes - reportData.monthly.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        LKR {(reportData.monthly.incomes - reportData.monthly.expenses).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 pt-2">
                                    <Button 
                                        onClick={() => generateDetailedReport('monthly')}
                                        disabled={loading || isGeneratingPDF}
                                    >
                                        {isGeneratingPDF ? 'Generating PDF...' : 'Download Monthly PDF'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </CardBody>
                </Card>

                {/* Yearly Report */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center gap-2">
                                📈 Yearly Report
                                <span className="text-sm text-gray-500">({selectedYear})</span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded border px-2 py-1 text-sm"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : reportData ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Income</p>
                                        <p className="font-semibold text-emerald-600">LKR {reportData.yearly.incomes.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Expenses</p>
                                        <p className="font-semibold text-sky-600">LKR {reportData.yearly.expenses.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-gray-500 text-sm">Net</p>
                                    <p className={`font-semibold ${reportData.yearly.incomes - reportData.yearly.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        LKR {(reportData.yearly.incomes - reportData.yearly.expenses).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 pt-2">
                                    <Button 
                                        onClick={() => generateDetailedReport('yearly')}
                                        disabled={loading || isGeneratingPDF}
                                    >
                                        {isGeneratingPDF ? 'Generating PDF...' : 'Download Yearly PDF'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Financial Summary */}
            {reportData && (
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Financial Summary</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-lg">
                                <h4 className="text-sm font-medium text-emerald-800">Monthly Net</h4>
                                <p className={`text-2xl font-bold ${reportData.monthly.incomes - reportData.monthly.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    LKR {(reportData.monthly.incomes - reportData.monthly.expenses).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800">Yearly Net</h4>
                                <p className={`text-2xl font-bold ${reportData.yearly.incomes - reportData.yearly.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    LKR {(reportData.yearly.incomes - reportData.yearly.expenses).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h4 className="text-sm font-medium text-purple-800">Monthly Profit Margin</h4>
                                <p className="text-2xl font-bold text-purple-600">
                                    {reportData.monthly.incomes > 0 
                                        ? (((reportData.monthly.incomes - reportData.monthly.expenses) / reportData.monthly.incomes) * 100).toFixed(1)
                                        : '0.0'
                                    }%
                                </p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                                <h4 className="text-sm font-medium text-orange-800">Yearly Profit Margin</h4>
                                <p className="text-2xl font-bold text-orange-600">
                                    {reportData.yearly.incomes > 0 
                                        ? (((reportData.yearly.incomes - reportData.yearly.expenses) / reportData.yearly.incomes) * 100).toFixed(1)
                                        : '0.0'
                                    }%
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <h3 className="font-medium">Quick Actions</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex flex-wrap gap-3 items-center">
                        <select
                            className="rounded border px-3 py-2 text-sm"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            <option>All Categories</option>
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</option>
                            ))}
                        </select>
                        <Button 
                            onClick={() => {
                                generateDetailedReport('monthly');
                                generateDetailedReport('yearly');
                            }}
                            disabled={loading || isGeneratingPDF}
                        >
                            {isGeneratingPDF ? 'Generating PDFs...' : 'Download All PDFs'}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={loadReportData}
                            disabled={loading}
                        >
                            Refresh Data
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Expense Details by Category */}
            {filteredExpenses.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">
                            Expense Details 
                            {category !== 'All Categories' && ` - ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}`}
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {filteredExpenses.slice(0, 10).map(expense => (
                                <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{expense.description}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString()} • {expense.category}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">LKR {expense.amount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 capitalize">{expense.status}</p>
                                    </div>
                                </div>
                            ))}
                            {filteredExpenses.length > 10 && (
                                <p className="text-sm text-gray-500 text-center">
                                    Showing first 10 of {filteredExpenses.length} expenses
                                </p>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
