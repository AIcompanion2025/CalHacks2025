import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExpenses, saveExpense, deleteExpense } from '@/utils/storage';
import { Expense } from '@/types';
import { ArrowLeft, Plus, Trash2, DollarSign, ShoppingBag, Utensils, Car, Film, Home, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const allExpenses = getExpenses();
    // Sort by date, newest first
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
      notes,
      date: new Date().toISOString()
    };

    saveExpense(newExpense);
    toast.success('Expense added successfully!');
    
    // Reset form
    setAmount('');
    setDescription('');
    setNotes('');
    setCategory('food');
    setShowAddForm(false);
    
    loadExpenses();
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
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
  
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add Expense'}
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Travel Expenses</h1>
          <p className="text-muted-foreground">
            Track your spending during your adventures
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Expense Form */}
          {showAddForm && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Add New Expense</CardTitle>
                  <CardDescription>Log your travel spending</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
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
                    <Label htmlFor="category">Category</Label>
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
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Lunch at Cheese Board"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional details..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <Button className="w-full" onClick={handleAddExpense}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Expenses List and Summary */}
          <div className={showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8" />
                    <div>
                      <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                      <div className="text-sm text-indigo-100">Total Spent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-indigo-600" />
                    <div>
                      <div className="text-2xl font-bold">{expenses.length}</div>
                      <div className="text-sm text-muted-foreground">Transactions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-indigo-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg per Transaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            {Object.keys(expensesByCategory).length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(expensesByCategory).map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(cat as Expense['category'])}>
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(cat as Expense['category'])}
                              <span className="capitalize">{cat}</span>
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${amount.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({((amount / totalExpenses) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} logged
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking your travel spending
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(expense.category)}>
                              <span className="flex items-center gap-1">
                                {getCategoryIcon(expense.category)}
                                <span className="capitalize">{expense.category}</span>
                              </span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{expense.description}</h4>
                          {expense.notes && (
                            <p className="text-sm text-muted-foreground">{expense.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-lg font-bold">${expense.amount.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;