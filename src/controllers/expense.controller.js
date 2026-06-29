import Expense from '../models/expense.model.js';

// Get all expenses for logged in user
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new expense
export const addExpense = async (req, res) => {
  try {
    const { title, amount, type, category, description, date } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount,
      type,
      category,
      description,
      date
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get summary (balance, total income, total expenses)
export const getSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id });

    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((acc, e) => acc + e.amount, 0);

    const totalExpenses = expenses
      .filter(e => e.type === 'expense')
      .reduce((acc, e) => acc + e.amount, 0);

    const balance = totalIncome - totalExpenses;

    res.json({ balance, totalIncome, totalExpenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 