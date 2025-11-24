import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import PieChart from '../../components/ui/PieChart';
import BarChart from '../../components/ui/BarChart';
import Select from '../../components/ui/Select';
import api from '../../lib/api';

// Expense categories with colors (matching backend)
const EXPENSE_CATEGORIES = [
    'fuel',
    'maintenance', 
    'equipment',
    'personnel',
    'utilities',
    'office_supplies',
    'transportation',
    'waste_disposal',
    'repairs',
    'insurance',
    'legal',
    'marketing',
    'training',
    'emergency',
    'other'
];

// Income categories with colors (matching backend)
const INCOME_CATEGORIES = [
    'service_fees',
    'waste_collection',
    'recycling_revenue',
    'government_grants',
    'donations',
    'sponsorships',
    'consulting',
    'equipment_sales',
    'rental_income',
    'penalties',
    'licensing',
    'training_fees',
    'other'
];

const EXPENSE_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#8b5cf6', '#ec4899', '#6b7280', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280'
];

const INCOME_COLORS = [
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
    '#0d9488', '#0f766e', '#115e59', '#134e4a', '#f59e0b',
    '#d97706', '#b45309', '#92400e', '#6b7280'
];

function Metric({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
	return (
		<Card className="p-6">
			<div className="flex items-start justify-between">
				<div>
					<p className="text-sm text-gray-500">{label}</p>
					<p className="mt-2 text-3xl font-bold">{value}</p>
				</div>
				<div className={`text-4xl md:text-5xl leading-none ${accent}`}>{icon}</div>
			</div>
			<div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
				<div className={`h-full w-1/3 rounded-full ${accent.includes('emerald') ? 'bg-emerald-400' : accent.includes('sky') ? 'bg-sky-400' : 'bg-amber-400'}`}></div>
			</div>
		</Card>
	);
}

type Expense = { 
    _id: string; 
    title: string;
    description: string;
    amount: number; 
    currency: string;
    category: string; 
    date: string; 
    status: string;
    paymentMethod: string;
    vendor?: {
        name: string;
        contact?: {
            phone?: string;
            email?: string;
        };
    };
};

type Income = { 
    _id: string; 
    title: string;
    description: string;
    amount: number; 
    currency: string;
    category: string; 
    source: string;
    date: string; 
    status: string;
    paymentMethod: string;
    client?: {
        name: string;
        type: string;
    };
};

type FinancialData = {
    overview: {
        totalBudget: number;
        totalSpent: number;
        totalRemaining: number;
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        profitMargin: number;
    };
    expenses: {
        summary: {
            totalAmount: number;
            expenseCount: number;
            pendingAmount: number;
            approvedAmount: number;
            paidAmount: number;
        };
        categoryBreakdown: Array<{
            _id: string;
            totalAmount: number;
            count: number;
            averageAmount: number;
        }>;
    };
    income: {
        summary: {
            totalAmount: number;
            totalNetAmount: number;
            totalTax: number;
            incomeCount: number;
            pendingAmount: number;
            confirmedAmount: number;
            receivedAmount: number;
        };
        categoryBreakdown: Array<{
            _id: string;
            totalAmount: number;
            count: number;
            averageAmount: number;
        }>;
    };
};

export default function FinancialDashboard() {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load comprehensive financial dashboard data
            const dashboardResponse = await api.get('/financial-reports/dashboard');
            setFinancialData(dashboardResponse.data.data);

            // Load individual expenses and incomes for detailed analysis
            const [expensesResponse, incomesResponse] = await Promise.all([
                api.get('/expenses'),
                api.get('/incomes')
            ]);

            setExpenses(expensesResponse.data.data.expenses);
            setIncomes(incomesResponse.data.data.incomes);

        } catch (error: any) {
            console.error('Error loading financial data:', error);
            setError(error.response?.data?.message || 'Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    const totals = useMemo(() => {
        if (!financialData) {
            return { 
                expMonthly: 0, 
                expYearly: 0, 
                incMonthly: 0, 
                incYearly: 0,
                totalBudget: 0,
                totalSpent: 0,
                totalRemaining: 0,
                netIncome: 0
            };
        }

        return {
            expMonthly: financialData.expenses.summary.totalAmount,
            expYearly: financialData.expenses.summary.totalAmount,
            incMonthly: financialData.income.summary.totalAmount,
            incYearly: financialData.income.summary.totalAmount,
            totalBudget: financialData.overview.totalBudget,
            totalSpent: financialData.overview.totalSpent,
            totalRemaining: financialData.overview.totalRemaining,
            netIncome: financialData.overview.netIncome
        };
    }, [financialData]);

    // Expense category breakdown
    const expenseCategories = useMemo(() => {
        if (!financialData?.expenses.categoryBreakdown) return [];

        return financialData.expenses.categoryBreakdown
            .filter(cat => selectedCategory === 'all' || cat._id === selectedCategory)
            .map((cat, index) => ({
                label: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('_', ' '),
                value: cat.totalAmount,
                color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
            }))
            .filter(cat => cat.value > 0);
    }, [financialData, selectedCategory]);

    // Income category breakdown
    const incomeCategories = useMemo(() => {
        if (!financialData?.income.categoryBreakdown) return [];

        return financialData.income.categoryBreakdown
            .map((cat, index) => ({
                label: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('_', ' '),
                value: cat.totalAmount,
                color: INCOME_COLORS[index % INCOME_COLORS.length],
            }))
            .filter(cat => cat.value > 0);
    }, [financialData]);

    // Top expense categories
    const topExpenseCategories = useMemo(() => {
        return [...expenseCategories]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories
    }, [expenseCategories]);

    // Overall totals (all-time)
    const overall = useMemo(() => {
        if (!financialData) {
            return { income: 0, expense: 0, max: 1 };
        }
        
        const income = financialData.overview.totalIncome;
        const expense = financialData.overview.totalExpenses;
        const max = Math.max(1, income, expense);
        return { income, expense, max };
    }, [financialData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Financial Dashboard" description="Loading financial data..." />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading financial data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Financial Dashboard" 
                description="Overview of incomes and expenses with category breakdowns." 
                actions={
                    <div className="flex items-center gap-3">
                        <Select
                            name="categoryFilter"
                            label="Filter by Category"
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            options={[
                                { value: 'all', label: 'All Categories' },
                                ...EXPENSE_CATEGORIES.map(cat => ({ 
                                    value: cat, 
                                    label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')
                                }))
                            ]}
                            className="w-48"
                        />
                    </div>
                }
            />
            
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric icon="💵" label="Total Income" value={`LKR ${totals.incMonthly.toFixed(2)}`} accent="text-emerald-600" />
                <Metric icon="💸" label="Total Expenses" value={`LKR ${totals.expMonthly.toFixed(2)}`} accent="text-sky-600" />
                <Metric icon="🎯" label="Total Budget" value={`LKR ${totals.totalBudget.toFixed(2)}`} accent="text-amber-600" />
                <Metric icon="💰" label="Net Income" value={`LKR ${totals.netIncome.toFixed(2)}`} accent={totals.netIncome >= 0 ? "text-emerald-600" : "text-red-600"} />
            </div>

            {/* Financial Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Summary Card */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            🎯 Budget Summary
                            <span className="text-sm text-gray-500">Current Period</span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {financialData ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Total Budget</p>
                                        <p className="font-semibold text-blue-600">LKR {financialData.overview.totalBudget.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Spent</p>
                                        <p className="font-semibold text-orange-600">LKR {financialData.overview.totalSpent.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-gray-500 text-sm">Remaining</p>
                                    <p className={`font-semibold ${financialData.overview.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        LKR {financialData.overview.totalRemaining.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Loading budget data...</p>
                        )}
                    </CardBody>
                </Card>

                {/* Profit Margin Card */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            📈 Profit Analysis
                            <span className="text-sm text-gray-500">Current Period</span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {financialData ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Total Income</p>
                                        <p className="font-semibold text-emerald-600">LKR {financialData.overview.totalIncome.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Expenses</p>
                                        <p className="font-semibold text-red-600">LKR {financialData.overview.totalExpenses.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-gray-500 text-sm">Profit Margin</p>
                                    <p className={`font-semibold ${financialData.overview.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {financialData.overview.profitMargin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Loading profit data...</p>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Category Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart - Expense Categories */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            🥧 Expense Categories
                            <span className="text-sm text-gray-500">
                                Total: LKR {financialData?.expenses.summary.totalAmount.toFixed(2) || '0.00'}
                                {selectedCategory !== 'all' && ` • ${selectedCategory}`}
                            </span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {expenseCategories.length > 0 ? (
                            <PieChart data={expenseCategories} size={250} />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📊</div>
                                    <p>No expenses recorded</p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Pie Chart - Income Categories */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            💰 Income Categories
                            <span className="text-sm text-gray-500">
                                Total: LKR {financialData?.income.summary.totalAmount.toFixed(2) || '0.00'}
                            </span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {incomeCategories.length > 0 ? (
                            <PieChart data={incomeCategories} size={250} />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">💰</div>
                                    <p>No income recorded</p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Top Categories Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top Expense Categories */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            📊 Top Expense Categories
                            <span className="text-sm text-gray-500">
                                {selectedCategory !== 'all' && ` • ${selectedCategory}`}
                            </span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {topExpenseCategories.length > 0 ? (
                            <BarChart data={topExpenseCategories} maxHeight={200} />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📈</div>
                                    <p>No expense data available</p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Bar Chart - Top Income Categories */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            📈 Top Income Categories
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {incomeCategories.length > 0 ? (
                            <BarChart data={incomeCategories.slice(0, 5)} maxHeight={200} />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📈</div>
                                    <p>No income data available</p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Category Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Categories Summary */}
                {expenseCategories.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="font-medium flex items-center gap-2">
                                💰 Expense Categories Summary
                                <span className="text-sm text-gray-500">
                                    {selectedCategory !== 'all' && ` • ${selectedCategory}`}
                                </span>
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {expenseCategories.map((category, index) => (
                                    <div key={index} className="p-4 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">{category.label}</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    LKR {category.value.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Income Categories Summary */}
                {incomeCategories.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="font-medium flex items-center gap-2">
                                💵 Income Categories Summary
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {incomeCategories.map((category, index) => (
                                    <div key={index} className="p-4 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">{category.label}</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    LKR {category.value.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            {/* Overall Financial Overview */}
            <Card>
                <CardHeader>
                    <h3 className="font-medium">Overall Financial Overview</h3>
                </CardHeader>
                <CardBody>
                    {(() => {
                        const total = Math.max(0, overall.income + overall.expense);
                        const incomePct = total === 0 ? 0.5 : overall.income / total;
                        const expensePct = 1 - incomePct;
                        const gradient = `conic-gradient(#10b981 0 ${incomePct * 360}deg, #ef4444 ${incomePct * 360}deg 360deg)`;
                        return (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                <div className="relative" style={{ width: 220, height: 220 }}>
                                    <div className="rounded-full" style={{ width: '100%', height: '100%', backgroundImage: gradient }} />
                                    <div className="absolute inset-6 rounded-full bg-white/95 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">Net Income</div>
                                            <div className={`text-lg font-semibold ${overall.income - overall.expense >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                LKR {(overall.income - overall.expense).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 rounded bg-emerald-500"></span> 
                                        Income: LKR {overall.income.toFixed(2)} ({(incomePct * 100).toFixed(1)}%)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 rounded bg-red-500"></span> 
                                        Expenses: LKR {overall.expense.toFixed(2)} ({(expensePct * 100).toFixed(1)}%)
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded bg-blue-500"></span> 
                                            Profit Margin: {financialData?.overview.profitMargin.toFixed(1) || '0.0'}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </CardBody>
            </Card>
        </div>
    );
}
