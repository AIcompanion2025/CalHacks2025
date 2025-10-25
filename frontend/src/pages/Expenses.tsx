import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExpenses, saveExpense, deleteExpense } from '@/utils/storage';
import { Expense } from '@/types';
import { Plus, Trash2, DollarSign, Utensils, Car, ShoppingBag, Film, Home, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const allExpenses = getExpenses();
    allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(allExpenses);
  };

  const handleAddExpense = () => {
    if (!amount || !description) {
      toast.error('Please fill in amount and description');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      description,
      notes: '',
      date: new Date().toISOString()
    };

    saveExpense(newExpense);
    toast.success('Expense added!');
    
    setAmount('');
    setDescription('');
    setCategory('food');
    setShowAddForm(false);
    
    loadExpenses();
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Delete this expense?')) {
      deleteExpense(expenseId);
      toast.success('Expense deleted');
      loadExpenses();
    }
  };

  const getCategoryIcon = (cat: Expense['category']) => {
    switch (cat) {
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4" />;
      case 'entertainment': return <Film className="w-4 h-4" />;
      case 'accommodation': return <Home className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (cat: Expense['category']) => {
    switch (cat) {
      case 'food': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'transport': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shopping': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'entertainment': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'accommodation': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Expenses</h1>
              <p className="text-xs text-muted-foreground">
                ${totalExpenses.toFixed(2)} total
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-1" />
              {showAddForm ? 'Cancel' : 'Add'}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Expense</CardTitle>
              <CardDescription className="text-xs">Track your spending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="amount" className="text-sm">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as Expense['category'])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Drinks</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Lunch at cafe"
                  className="mt-1"
                />
              </div>

              <Button className="w-full" onClick={handleAddExpense} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8" />
                <div>
                  <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                  <div className="text-xs text-indigo-100">Total Spent</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{expenses.length}</div>
                <div className="text-xs text-indigo-100">Transactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your spending
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${getCategoryColor(expense.category)} text-xs`}>
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(expense.category)}
                            <span className="capitalize">{expense.category}</span>
                          </span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm truncate">{expense.description}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-base font-bold">${expense.amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;