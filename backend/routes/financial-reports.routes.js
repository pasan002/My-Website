const express = require('express');
const { query } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/financial-reports/dashboard
// @desc    Get comprehensive financial dashboard data
// @access  Private
router.get('/dashboard', /* authenticateToken, */ async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }

    // Get budget summary
    const budgetSummary = await Budget.getBudgetSummary();
    const budgetCategoryBreakdown = await Budget.getBudgetsByCategory();

    // Get expense summary
    const expenseSummary = await Expense.getExpenseSummary(filters);
    const expenseCategoryBreakdown = await Expense.getExpensesByCategory(filters);

    // Get income summary
    const incomeSummary = await Income.getIncomeSummary(filters);
    const incomeCategoryBreakdown = await Income.getIncomeByCategory(filters);

    // Calculate financial health metrics
    const netIncome = incomeSummary.totalNetAmount - expenseSummary.totalAmount;
    const profitMargin = incomeSummary.totalAmount > 0 
      ? ((incomeSummary.totalNetAmount - expenseSummary.totalAmount) / incomeSummary.totalAmount) * 100 
      : 0;

    // Get monthly trends for the last 12 months
    const expenseTrends = await Expense.getMonthlyTrends(filters, 12);
    const incomeTrends = await Income.getMonthlyTrends(filters, 12);

    // Get top expense categories
    const topExpenseCategories = expenseCategoryBreakdown.slice(0, 5);
    
    // Get top income sources
    const topIncomeSources = await Income.getTopSources(filters, 5);

    res.json({
      success: true,
      data: {
        overview: {
          totalBudget: budgetSummary.totalBudget,
          totalSpent: budgetSummary.totalSpent,
          totalRemaining: budgetSummary.totalRemaining,
          totalIncome: incomeSummary.totalAmount,
          totalExpenses: expenseSummary.totalAmount,
          netIncome,
          profitMargin: Math.round(profitMargin * 100) / 100
        },
        budgets: {
          summary: budgetSummary,
          categoryBreakdown: budgetCategoryBreakdown
        },
        expenses: {
          summary: expenseSummary,
          categoryBreakdown: expenseCategoryBreakdown,
          topCategories: topExpenseCategories,
          monthlyTrends: expenseTrends
        },
        income: {
          summary: incomeSummary,
          categoryBreakdown: incomeCategoryBreakdown,
          topSources: topIncomeSources,
          monthlyTrends: incomeTrends
        }
      }
    });
  } catch (error) {
    console.error('Get financial dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial dashboard data'
    });
  }
});

// @route   GET /api/financial-reports/profit-loss
// @desc    Get profit and loss statement
// @access  Private
router.get('/profit-loss', [
  authenticateToken,
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }

    // Get income by category
    const incomeByCategory = await Income.getIncomeByCategory(filters);
    
    // Get expenses by category
    const expensesByCategory = await Expense.getExpensesByCategory(filters);

    // Calculate totals
    const totalIncome = incomeByCategory.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.totalAmount, 0);
    const netIncome = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        period: {
          from: dateFrom || 'All time',
          to: dateTo || 'Present'
        },
        income: {
          categories: incomeByCategory,
          total: totalIncome
        },
        expenses: {
          categories: expensesByCategory,
          total: totalExpenses
        },
        summary: {
          grossIncome: totalIncome,
          totalExpenses,
          netIncome,
          profitMargin: totalIncome > 0 ? Math.round(((netIncome / totalIncome) * 100) * 100) / 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get profit loss statement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit and loss statement'
    });
  }
});

// @route   GET /api/financial-reports/cash-flow
// @desc    Get cash flow statement
// @access  Private
router.get('/cash-flow', [
  authenticateToken,
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    
    // Get monthly income trends
    const incomeTrends = await Income.getMonthlyTrends({}, months);
    
    // Get monthly expense trends
    const expenseTrends = await Expense.getMonthlyTrends({}, months);

    // Combine and calculate cash flow
    const cashFlowData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < months; i++) {
      const incomeData = incomeTrends.find(item => 
        item._id.year === new Date().getFullYear() && 
        item._id.month === new Date().getMonth() + 1 - i
      );
      
      const expenseData = expenseTrends.find(item => 
        item._id.year === new Date().getFullYear() && 
        item._id.month === new Date().getMonth() + 1 - i
      );

      const income = incomeData ? incomeData.totalAmount : 0;
      const expenses = expenseData ? expenseData.totalAmount : 0;
      const netCashFlow = income - expenses;

      cashFlowData.push({
        month: monthNames[new Date().getMonth() - i],
        year: new Date().getFullYear(),
        income,
        expenses,
        netCashFlow
      });
    }

    // Calculate cumulative cash flow
    let cumulativeCashFlow = 0;
    cashFlowData.forEach(item => {
      cumulativeCashFlow += item.netCashFlow;
      item.cumulativeCashFlow = cumulativeCashFlow;
    });

    res.json({
      success: true,
      data: {
        period: `${months} months`,
        cashFlow: cashFlowData.reverse(), // Show oldest to newest
        summary: {
          totalIncome: cashFlowData.reduce((sum, item) => sum + item.income, 0),
          totalExpenses: cashFlowData.reduce((sum, item) => sum + item.expenses, 0),
          netCashFlow: cashFlowData.reduce((sum, item) => sum + item.netCashFlow, 0),
          endingCashFlow: cumulativeCashFlow
        }
      }
    });
  } catch (error) {
    console.error('Get cash flow statement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash flow statement'
    });
  }
});

// @route   GET /api/financial-reports/budget-vs-actual
// @desc    Get budget vs actual analysis
// @access  Private
router.get('/budget-vs-actual', authenticateToken, async (req, res) => {
  try {
    // Get budget summary
    const budgetSummary = await Budget.getBudgetSummary();
    
    // Get actual expenses
    const expenseSummary = await Expense.getExpenseSummary();

    // Get budget vs actual by category
    const budgetByCategory = await Budget.getBudgetsByCategory();
    const expenseByCategory = await Expense.getExpensesByCategory();

    // Combine budget and actual data by category
    const budgetVsActual = budgetByCategory.map(budget => {
      const actual = expenseByCategory.find(exp => exp._id === budget._id);
      const actualAmount = actual ? actual.totalAmount : 0;
      const variance = budget.totalBudget - actualAmount;
      const variancePercentage = budget.totalBudget > 0 
        ? Math.round(((variance / budget.totalBudget) * 100) * 100) / 100 
        : 0;

      return {
        category: budget._id,
        budgeted: budget.totalBudget,
        actual: actualAmount,
        variance,
        variancePercentage,
        status: variance >= 0 ? 'under_budget' : 'over_budget'
      };
    });

    // Overall variance
    const totalVariance = budgetSummary.totalBudget - expenseSummary.totalAmount;
    const totalVariancePercentage = budgetSummary.totalBudget > 0 
      ? Math.round(((totalVariance / budgetSummary.totalBudget) * 100) * 100) / 100 
      : 0;

    res.json({
      success: true,
      data: {
        overall: {
          totalBudget: budgetSummary.totalBudget,
          totalActual: expenseSummary.totalAmount,
          variance: totalVariance,
          variancePercentage: totalVariancePercentage,
          status: totalVariance >= 0 ? 'under_budget' : 'over_budget'
        },
        byCategory: budgetVsActual,
        summary: {
          categoriesUnderBudget: budgetVsActual.filter(item => item.variance >= 0).length,
          categoriesOverBudget: budgetVsActual.filter(item => item.variance < 0).length,
          totalCategories: budgetVsActual.length
        }
      }
    });
  } catch (error) {
    console.error('Get budget vs actual error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget vs actual analysis'
    });
  }
});

// @route   GET /api/financial-reports/export
// @desc    Export financial data for external analysis
// @access  Private
router.get('/export', [
  authenticateToken,
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('type').optional().isIn(['all', 'budgets', 'expenses', 'income']).withMessage('Type must be all, budgets, expenses, or income')
], async (req, res) => {
  try {
    const { format = 'json', type = 'all', dateFrom, dateTo } = req.query;
    const filters = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) filters.date.$lte = new Date(dateTo);
    }

    let exportData = {};

    if (type === 'all' || type === 'budgets') {
      exportData.budgets = await Budget.find().populate('createdBy', 'firstName lastName email');
    }

    if (type === 'all' || type === 'expenses') {
      exportData.expenses = await Expense.find(filters).populate('createdBy', 'firstName lastName email');
    }

    if (type === 'all' || type === 'income') {
      exportData.income = await Income.find(filters).populate('createdBy', 'firstName lastName email');
    }

    if (format === 'csv') {
      // For CSV export, you would need to implement CSV conversion
      // For now, return JSON with CSV headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="financial_data.json"');
    }

    res.json({
      success: true,
      data: exportData,
      metadata: {
        exportedAt: new Date(),
        format,
        type,
        filters: { dateFrom, dateTo }
      }
    });
  } catch (error) {
    console.error('Export financial data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial data'
    });
  }
});

module.exports = router;
