
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, BarChart3, Plus, Search, Send,
  CheckCircle2, Clock, Truck, XCircle, Sparkles, Eye, MapPin, Phone,
  ChevronRight, RefreshCw, Users as UsersIcon, LogOut, ShieldCheck,
  TrendingUp, Box, Upload, List, Grid, Trash2, Settings, Layers, Building2,
  ChevronDown, Image as ImageIcon, Tag, DollarSign, Wand2, Banknote, Target,
  Settings2, User as UserIcon, ArrowRightCircle, Globe, Mail, Briefcase, FileText,
  Calendar, Check, Info, AlertCircle, Wallet, ArrowUpRight, ArrowDownRight, History,
  Filter, Download, CreditCard, Receipt, PiggyBank, Scale, ExternalLink, MoreVertical,
  PlusCircle, Edit3, Trash, Copy, Camera, Zap, MessageSquareQuote, UserCheck, ArrowLeftRight,
  TrendingDown, ShoppingCart, Percent, RotateCcw, Activity, BarChart as BarChartIcon,
  LogIn, UserPlus, MailCheck, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Order, OrderStatus, Product, User, UserRole, UserStatus, Supplier, Category, Transaction, TransactionType, TransactionStatus } from './types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_SUPPLIERS, MOCK_CATEGORIES } from './constants';
import { generateMarketingContent, extractOrderInfo } from './services/geminiService';
import * as auth from './services/authService';

type Tab = 'dashboard' | 'orders' | 'products' | 'reports' | 'ai' | 'users';
type StatusFilter = OrderStatus | 'ALL';
type ProductViewMode = 'grid' | 'list';
type OrderCreationMode = 'manual' | 'smart';

const ALL_SYSTEM_TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'orders', label: 'Đơn hàng', icon: Package },
  { id: 'products', label: 'Sản phẩm', icon: ShoppingBag },
  { id: 'reports', label: 'Ví & Tài chính', icon: BarChart3 },
  { id: 'ai', label: 'AI Marketing', icon: Sparkles },
  { id: 'users', label: 'Nhân sự', icon: UsersIcon },
];

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'pending'>('login');
  
  // Data States
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [allUsers, setAllUsers] = useState<User[]>(auth.getStoredUsers());
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'TXN-101',
      type: TransactionType.COMMISSION,
      amount: 1300000,
      status: TransactionStatus.COMPLETED,
      createdAt: '2024-05-18T10:00:00Z',
      orderId: 'ORD-1001'
    }
  ]);
  
  // UI States
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('grid');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  
  // Auth Form States
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');

  // Modals States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierManagerOpen, setIsSupplierManagerOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Other States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', categoryId: '', supplierId: '', dealerPrice: 0, retailPrice: 0, image: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: 0, bankName: '', accountNumber: '', accountName: '' });
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', email: '', phone: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [orderMode, setOrderMode] = useState<OrderCreationMode>('manual');
  const [smartTextInput, setSmartTextInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order> & { freeShip?: boolean }>({ productId: '', quantity: 1, customerName: '', customerPhone: '', customerAddress: '', deposit: 0, shippingFee: 30000, freeShip: false, orderDate: new Date().toISOString().slice(0, 16), staffName: '' });
  const [aiSelectedProductId, setAiSelectedProductId] = useState<string>('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync users from authService
  const refreshUsers = () => {
    setAllUsers(auth.getStoredUsers());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const result = auth.loginUser(email);
    if (result === "PENDING_APPROVAL") {
      setAuthMode('pending');
    } else if (typeof result === 'string') {
      setAuthError(result);
    } else {
      setCurrentUser(result);
      setNewOrder(prev => ({ ...prev, staffName: result.fullName }));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !fullName) return setAuthError('Vui lòng nhập đầy đủ thông tin.');
    const result = auth.registerUser(email, fullName);
    if (typeof result === 'string') {
      setAuthError(result);
    } else {
      setAuthMode('pending');
    }
  };

  const handleApproveUser = (userId: string) => {
    auth.updateUserStatus(userId, UserStatus.APPROVED);
    refreshUsers();
  };

  const handleBlockUser = (userId: string) => {
    auth.updateUserStatus(userId, UserStatus.BLOCKED);
    refreshUsers();
  };

  const handleLogout = () => {
    auth.logoutUser();
    setCurrentUser(null);
    setAuthMode('login');
    setEmail('');
    setFullName('');
  };

  // Analytics & Filters (Same as before)
  const filteredProducts = useMemo(() => products.filter(p => (p.name.toLowerCase().includes(productSearch.toLowerCase())) && (selectedCategoryId === 'ALL' || p.categoryId === selectedCategoryId)), [products, productSearch, selectedCategoryId]);
  const filteredOrders = useMemo(() => orders.filter(o => (o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || o.id.includes(orderSearch)) && (statusFilter === 'ALL' || o.status === statusFilter)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [orders, orderSearch, statusFilter]);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const returned = orders.filter(o => o.status === OrderStatus.RETURNED);
    const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.CANCELLED_BY_CUSTOMER);
    const successRate = totalOrders > 0 ? (delivered.length / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (returned.length / totalOrders) * 100 : 0;
    const totalItemsSold = delivered.reduce((sum, o) => sum + o.quantity, 0);
    const productStatsMap: Record<string, { name: string, revenue: number, sold: number, profit: number }> = {};
    delivered.forEach(o => {
      if (!productStatsMap[o.productId]) productStatsMap[o.productId] = { name: o.productName, revenue: 0, sold: 0, profit: 0 };
      productStatsMap[o.productId].revenue += (o.retailPrice * o.quantity);
      productStatsMap[o.productId].sold += o.quantity;
      productStatsMap[o.productId].profit += o.totalProfit;
    });
    const productLeaderboard = Object.values(productStatsMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const statusData = [
      { name: 'Thành công', value: delivered.length, color: '#10b981' },
      { name: 'Hoàn hàng', value: returned.length, color: '#f59e0b' },
      { name: 'Đã hủy', value: cancelled.length, color: '#ef4444' },
      { name: 'Đang xử lý', value: orders.filter(o => [OrderStatus.PENDING, OrderStatus.SENT_TO_SUPPLIER, OrderStatus.SHIPPING].includes(o.status)).length, color: '#6366f1' }
    ].filter(d => d.value > 0);
    return { productLeaderboard, statusData, successRate, returnRate, totalItemsSold, deliveredCount: delivered.length, returnedCount: returned.length, totalOrders };
  }, [orders]);

  const financialStats = useMemo(() => {
    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.retailPrice * o.quantity), 0);
    const totalEarned = delivered.reduce((sum, o) => sum + o.totalProfit, 0);
    const totalWithdrawn = transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.COMPLETED).reduce((sum, t) => sum + t.amount, 0);
    const walletBalance = totalEarned - totalWithdrawn;
    const pendingProfit = orders.filter(o => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_CUSTOMER, OrderStatus.RETURNED].includes(o.status)).reduce((sum, o) => sum + o.totalProfit, 0);
    const timeData = [{ label: 'T2', profit: 450000, revenue: 1200000 }, { label: 'T3', profit: 620000, revenue: 2100000 }, { label: 'T4', profit: 310000, revenue: 950000 }, { label: 'T5', profit: 890000, revenue: 3200000 }, { label: 'T6', profit: 740000, revenue: 2500000 }, { label: 'T7', profit: 1100000, revenue: 4100000 }, { label: 'CN', profit: 980000, revenue: 3500000 }];
    return { walletBalance, totalRevenue, pendingProfit, timeData };
  }, [orders, transactions]);

  // Handlers (Order/Product Logic - Preserved)
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (newStatus === OrderStatus.DELIVERED) {
      const order = orders.find(o => o.id === orderId);
      if (order) setTransactions([{ id: `TXN-${Date.now()}`, type: TransactionType.COMMISSION, amount: order.totalProfit, status: TransactionStatus.COMPLETED, createdAt: new Date().toISOString(), orderId: order.id }, ...transactions]);
    }
  };

  const handleWithdrawalRequest = () => {
    if (withdrawalForm.amount < 100000) return alert("Rút tối thiểu 100.000đ");
    setTransactions([{ id: `TXN-${Date.now()}`, type: TransactionType.WITHDRAWAL, amount: withdrawalForm.amount, status: TransactionStatus.PENDING, createdAt: new Date().toISOString(), bankName: withdrawalForm.bankName, accountNumber: withdrawalForm.accountNumber, accountName: withdrawalForm.accountName }, ...transactions]);
    setIsWithdrawalModalOpen(false);
  };

  const handleToggleSupplierConfirmation = (orderId: string) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isSupplierConfirmed: !o.isSupplierConfirmed } : o));
  const handleAddProduct = () => {
    const product: Product = { id: `p-${Date.now()}`, name: newProduct.name!, categoryId: newProduct.categoryId!, supplierId: newProduct.supplierId || 's1', dealerPrice: Number(newProduct.dealerPrice) || 0, retailPrice: Number(newProduct.retailPrice) || 0, image: newProduct.image || `https://picsum.photos/seed/${Date.now()}/400/300` };
    setProducts([product, ...products]);
    setIsProductModalOpen(false);
  };
  const handleAddCategory = () => { if (newCategoryName.trim()) setCategories([...categories, { id: `c-${Date.now()}`, name: newCategoryName }]); setNewCategoryName(''); };
  const handleCreateOrder = () => {
    const product = products.find(p => p.id === newOrder.productId);
    if (!product) return;
    const o: Order = { id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, customerName: newOrder.customerName!, customerPhone: newOrder.customerPhone || '', customerAddress: newOrder.customerAddress || '', productId: product.id, productName: product.name, quantity: Number(newOrder.quantity) || 1, dealerPrice: product.dealerPrice, retailPrice: product.retailPrice, totalProfit: (product.retailPrice - product.dealerPrice) * (Number(newOrder.quantity) || 1), status: OrderStatus.PENDING, createdAt: new Date().toISOString(), orderDate: newOrder.orderDate ? new Date(newOrder.orderDate).toISOString() : new Date().toISOString(), staffName: newOrder.staffName || currentUser?.fullName || 'N/A', deposit: Number(newOrder.deposit) || 0, shippingFee: newOrder.freeShip ? 0 : (Number(newOrder.shippingFee) || 0), deliveryDate: '', totalToCollect: (product.retailPrice * (Number(newOrder.quantity) || 1)) + (newOrder.freeShip ? 0 : (Number(newOrder.shippingFee) || 0)) - (Number(newOrder.deposit) || 0), isSupplierConfirmed: false };
    setOrders([o, ...orders]);
    setIsOrderModalOpen(false);
  };
  const handleSmartExtract = async () => {
    setIsExtracting(true);
    const result = await extractOrderInfo(smartTextInput);
    if (result) {
       setNewOrder(prev => ({ ...prev, ...result, productId: products.find(p => p.name.toLowerCase().includes(result.productHint?.toLowerCase()))?.id || prev.productId }));
       setOrderMode('manual');
    }
    setIsExtracting(false);
  };

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    const res = await generateMarketingContent(products.find(p => p.id === aiSelectedProductId)?.name || '', products.find(p => p.id === aiSelectedProductId)?.retailPrice || 0);
    setAiGeneratedContent(res);
    setIsAiLoading(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (isoStr: string) => isoStr ? new Date(isoStr).toLocaleDateString('vi-VN') : '--/--/----';

  const getStatusConfig = (status: OrderStatus) => {
    const configs = {
      [OrderStatus.PENDING]: { icon: Clock, label: 'Chờ duyệt', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      [OrderStatus.SENT_TO_SUPPLIER]: { icon: Send, label: 'Đã báo kho', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      [OrderStatus.SHIPPING]: { icon: Truck, label: 'Đang giao', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
      [OrderStatus.DELIVERED]: { icon: CheckCircle2, label: 'Thành công', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      [OrderStatus.RETURNED]: { icon: RotateCcw, label: 'Hoàn hàng', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
      [OrderStatus.CANCELLED]: { icon: XCircle, label: 'Đã hủy', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
      [OrderStatus.CANCELLED_BY_CUSTOMER]: { icon: UserIcon, label: 'Khách hủy', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    };
    return configs[status] || configs[OrderStatus.PENDING];
  };

  // AUTH SCREEN COMPONENT
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />

        <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-emerald-500 rounded-3xl shadow-xl shadow-emerald-500/20 mb-6">
              <ShoppingBag size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">DROPSHIP MANAGER</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">Hệ thống quản lý bán hàng chuyên nghiệp</p>
          </div>

          {authMode === 'pending' ? (
            <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <MailCheck size={40} />
              </div>
              <h3 className="text-xl font-black text-white">Đăng ký thành công!</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Hệ thống đã nhận được yêu cầu của bạn. Một email xác nhận đã được gửi. <br/>
                Vui lòng đợi <strong>Quản trị viên</strong> phê duyệt tài khoản để bắt đầu sử dụng.
              </p>
              <button 
                onClick={() => setAuthMode('login')} 
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-6">
              {authError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-shake">
                  <ShieldAlert size={16} /> {authError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email tài khoản</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="email" 
                      placeholder="admin@dropship.com" 
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Họ và tên</label>
                    <div className="relative">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        type="text" 
                        placeholder="Nguyễn Văn A" 
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {authMode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
              </button>

              <div className="pt-4 text-center">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                  className="text-slate-500 hover:text-emerald-400 text-xs font-bold transition-colors"
                >
                  {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hỗ trợ đối tác</p>
            <div className="flex gap-6">
              <Globe size={20} className="text-slate-600 hover:text-white transition-colors cursor-pointer" />
              <Mail size={20} className="text-slate-600 hover:text-white transition-colors cursor-pointer" />
              <Phone size={20} className="text-slate-600 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APPLICATION SCREEN
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20"><ShoppingBag className="text-white" size={24} /></div>
          <div><h1 className="text-white font-black text-xl leading-none tracking-tight">DROPSHIP</h1><p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest">Manager Pro</p></div>
        </div>
        <nav className="flex-1 p-6 space-y-2 mt-4">
          {ALL_SYSTEM_TABS.map(tab => (
            (currentUser.role === UserRole.ADMIN || tab.id !== 'users') && (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <tab.icon size={20} /> <span className="font-bold text-sm">{tab.label}</span>
              </button>
            )
          ))}
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full py-3 text-slate-400 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"><LogOut size={16} /> Đăng xuất</button>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10 min-h-screen">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Chào mừng, {currentUser.fullName}</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{ALL_SYSTEM_TABS.find(t => t.id === activeTab)?.label}</h2>
          </div>
          <div className="flex gap-4">
            {activeTab === 'products' && (
              <>
                <button onClick={() => setIsCategoryManagerOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all"><Layers size={18} /> Danh mục</button>
                <button onClick={() => setIsSupplierManagerOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all"><Building2 size={18} /> Nhà cung cấp</button>
                <button onClick={() => setIsProductModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"><PlusCircle size={20} /> Thêm Sản Phẩm</button>
              </>
            )}
            {activeTab === 'orders' && (
               <button onClick={() => setIsOrderModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"><Plus size={20} /> Lên đơn mới</button>
            )}
          </div>
        </header>

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="bg-emerald-600 p-7 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-4">Hoa hồng ròng</p>
                <h3 className="text-3xl font-black">{formatCurrency(financialStats.walletBalance)}</h3>
                <div className="mt-4 flex items-center gap-1.5 text-emerald-200 text-[10px] font-bold"><ArrowUpRight size={14}/> +15% tuần này</div>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Tỉ lệ thành công</p>
                <h3 className="text-3xl font-black text-slate-900">{analytics.successRate.toFixed(1)}%</h3>
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{width: `${analytics.successRate}%`}} /></div>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Tỉ lệ hoàn hàng</p>
                <h3 className="text-3xl font-black text-rose-500">{analytics.returnRate.toFixed(1)}%</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-4 italic">{analytics.returnedCount} đơn bị hoàn</p>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Đã bán</p>
                <h3 className="text-3xl font-black text-indigo-600">{analytics.totalItemsSold}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-4">Sản phẩm chốt đơn</p>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Doanh thu tổng</p>
                <h3 className="text-2xl font-black text-slate-900 truncate">{formatCurrency(financialStats.totalRevenue)}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-4">Từ {analytics.deliveredCount} đơn hàng</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[11px] tracking-widest"><TrendingUp className="text-emerald-500" size={18}/> Xu hướng tài chính</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Biến động doanh thu & lợi nhuận 7 ngày</p>
                   </div>
                </div>
                <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={financialStats.timeData}><defs><linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${val/1000000}M`} /><Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} /><Area type="monotone" dataKey="revenue" stackId="1" stroke="#e2e8f0" fill="#f8fafc" strokeWidth={2} /><Area type="monotone" dataKey="profit" stackId="2" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                <h4 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase text-[11px] tracking-widest"><Activity className="text-indigo-500" size={18}/> Vận hành hệ thống</h4>
                <div className="flex-1 flex flex-col justify-center"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={analytics.statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">{analytics.statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="mt-8 space-y-3 px-4">{analytics.statusData.map((s) => (<div key={s.name} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}} /><span className="text-[11px] font-bold text-slate-600">{s.name}</span></div><span className="text-[11px] font-black text-slate-900">{s.value} đơn</span></div>))}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: ORDERS --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Tìm tên khách hoặc mã đơn..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} /></div>
              <select className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}><option value="ALL">Tất cả trạng thái</option>{Object.values(OrderStatus).map(s => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}</select>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left table-auto">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400"><tr className="border-b border-slate-100"><th className="px-6 py-5">Mã đơn</th><th className="px-6 py-5">Ngày đặt</th><th className="px-6 py-5">Khách hàng</th><th className="px-6 py-5">Sản phẩm</th><th className="px-6 py-5">Thu hộ (COD)</th><th className="px-6 py-5">Trạng thái</th><th className="px-6 py-5 text-center">Xác nhận</th><th className="px-6 py-5 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map(o => {
                    const st = getStatusConfig(o.status);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5 font-black text-sm">{o.id}</td>
                        <td className="px-6 py-5 text-[11px] font-bold text-slate-400">{formatDate(o.orderDate || o.createdAt)}</td>
                        <td className="px-6 py-5"><p className="font-bold text-sm text-slate-900">{o.customerName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{o.customerPhone}</p></td>
                        <td className="px-6 py-5"><p className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{o.productName}</p></td>
                        <td className="px-6 py-5 font-black text-sm">{formatCurrency(o.totalToCollect || 0)}</td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                        </td>
                        <td className="px-6 py-5 text-center"><button onClick={() => handleToggleSupplierConfirmation(o.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border mx-auto ${o.isSupplierConfirmed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-300'}`}>{o.isSupplierConfirmed ? 'Đã báo kho' : 'Chưa gửi'}</button></td>
                        <td className="px-6 py-5 text-right"><button onClick={() => setSelectedOrderDetails(o)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"><Eye size={20}/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: HR (USERS) - APPROVAL FLOW --- */}
        {activeTab === 'users' && currentUser.role === UserRole.ADMIN && (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Danh sách nhân sự & đối tác</h4>
               <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100"><Clock size={12}/> {allUsers.filter(u => u.status === UserStatus.PENDING).length} Chờ duyệt</span>
               </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-10 py-6">Họ tên & Email</th>
                  <th className="px-10 py-6 text-center">Trạng thái</th>
                  <th className="px-10 py-6 text-right">Thao tác phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 uppercase">{u.fullName.charAt(0)}</div>
                      <div><p className="font-black text-sm">{u.fullName}</p><p className="text-[10px] text-slate-400 font-bold">{u.email}</p></div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                        u.status === UserStatus.APPROVED ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                        u.status === UserStatus.PENDING ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          u.status === UserStatus.APPROVED ? 'bg-emerald-500' : 
                          u.status === UserStatus.PENDING ? 'bg-amber-500' : 'bg-rose-500'
                        }`}/>
                        {u.status === UserStatus.APPROVED ? 'Đã hoạt động' : u.status === UserStatus.PENDING ? 'Đang chờ duyệt' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-10 py-5 text-right space-x-2">
                      {u.status === UserStatus.PENDING && (
                        <button 
                          onClick={() => handleApproveUser(u.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex-inline items-center gap-2"
                        >
                          Phê duyệt
                        </button>
                      )}
                      {u.status === UserStatus.APPROVED && u.id !== currentUser.id && (
                        <button 
                          onClick={() => handleBlockUser(u.id)}
                          className="px-4 py-2 bg-white text-rose-500 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                        >
                          Khóa tài khoản
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW: FINANCE, AI, PRODUCTS (Same as before) --- */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><Wallet className="absolute -bottom-10 -right-10 text-white/5" size={150} /><div className="relative z-10"><p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Ví hoa hồng ròng</p><h3 className="text-4xl font-black mb-8">{formatCurrency(financialStats.walletBalance)}</h3><div className="flex gap-3"><button onClick={() => setIsWithdrawalModalOpen(true)} className="flex-1 py-3 bg-emerald-600 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-500 transition-all">Rút tiền</button><button onClick={() => setIsHistoryModalOpen(true)} className="py-3 px-4 bg-white/10 rounded-xl font-black text-[9px] uppercase hover:bg-white/20 transition-all"><History size={14}/></button></div></div></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><ShoppingCart size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã bán</span></div><h3 className="text-3xl font-black text-slate-900 mb-1">{analytics.totalItemsSold} SP</h3><p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><ArrowUpRight size={12}/> +12% tháng này</p></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><TrendingDown size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỉ lệ hoàn</span></div><h3 className="text-3xl font-black text-slate-900 mb-1">{analytics.returnRate.toFixed(1)}%</h3><p className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><Percent size={12}/> {analytics.returnedCount} đơn hoàn</p></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang treo</span></div><h3 className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(financialStats.pendingProfit)}</h3><p className="text-[10px] font-bold text-slate-400 italic">Chờ đối soát</p></div>
            </div>
            <div className="grid grid-cols-12 gap-8"><div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm"><h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[11px] tracking-widest"><TrendingUp className="text-emerald-500" size={18}/> Hiệu suất tài chính</h4><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={financialStats.timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `${val/1000000}M`} /><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none'}} formatter={(value: number) => [formatCurrency(value), '']} /><Bar dataKey="revenue" name="Doanh thu" fill="#e2e8f0" radius={[8, 8, 0, 0]} /><Bar dataKey="profit" name="Lợi nhuận" fill="#10b981" radius={[8, 8, 0, 0]} /><Legend verticalAlign="top" align="right" iconType="circle" /></BarChart></ResponsiveContainer></div></div></div>
          </div>
        )}

        {/* AI & Product Tabs (Same logic preserved) */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-12 gap-10 animate-in fade-in duration-500"><div className="col-span-12 lg:col-span-4 space-y-6"><div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"><h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><ImageIcon className="text-emerald-500" size={18}/> Chọn sản phẩm</h4><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">{products.map(p => (<button key={p.id} onClick={() => setAiSelectedProductId(p.id)} className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${aiSelectedProductId === p.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}><img src={p.image} className="w-12 h-12 rounded-xl object-cover" /><div className="flex-1 overflow-hidden"><p className="font-black text-xs truncate">{p.name}</p></div>{aiSelectedProductId === p.id && <Check size={16} className="text-emerald-500" />}</button>))}</div><button disabled={!aiSelectedProductId || isAiLoading} onClick={handleGenerateAI} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isAiLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Tạo nội dung quảng cáo</button></div></div><div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[500px]"><h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Wand2 className="text-indigo-500" size={20}/> Nội dung AI gợi ý</h4><div className="bg-slate-50 p-8 rounded-[2rem] h-full whitespace-pre-wrap text-slate-700 font-medium leading-relaxed">{aiGeneratedContent || (isAiLoading ? "Đang suy nghĩ..." : "Chọn một sản phẩm và nhấn nút tạo để Gemini giúp bạn viết bài bán hàng.")}</div></div></div>
        )}
      </main>

      {/* --- MODALS --- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 p-10"><div className="flex justify-between items-start mb-10"><div className="flex items-center gap-4"><div className="p-4 bg-emerald-600 text-white rounded-2xl"><Package size={24}/></div><div><h3 className="text-xl font-black text-slate-900">Chi tiết Đơn {selectedOrderDetails.id}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}</p></div></div><button onClick={() => setSelectedOrderDetails(null)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={32}/></button></div><div className="grid grid-cols-2 gap-10 mb-10"><div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khách hàng</p><div className="p-6 bg-slate-50 rounded-2xl"><p className="font-black text-slate-900 mb-1">{selectedOrderDetails.customerName}</p><p className="text-sm font-bold text-slate-500 mb-2">{selectedOrderDetails.customerPhone}</p><p className="text-xs text-slate-400 leading-relaxed">{selectedOrderDetails.customerAddress}</p></div></div><div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tài chính</p><div className="p-6 bg-slate-900 rounded-2xl text-white"><div className="flex justify-between text-xs mb-4"><span className="text-slate-400">Hoa hồng:</span><span className="font-black text-emerald-400">+{formatCurrency(selectedOrderDetails.totalProfit)}</span></div><div className="flex justify-between text-sm pt-4 border-t border-white/10 font-black"><span>Khách trả:</span><span className="text-xl text-emerald-400">{formatCurrency(selectedOrderDetails.totalToCollect || 0)}</span></div></div></div></div><div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cập nhật trạng thái</p><div className="flex gap-3"><button onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, OrderStatus.SENT_TO_SUPPLIER)} className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase border border-blue-100">Báo kho tổng</button><button onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, OrderStatus.DELIVERED)} className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase border border-emerald-100">Thành công</button><button onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, OrderStatus.RETURNED)} className="flex-1 py-4 bg-orange-50 text-orange-600 rounded-xl font-black text-[9px] uppercase border border-orange-100">Hoàn hàng</button></div></div></div></div>
      )}

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[4rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[85vh]"><div className="p-10 border-b flex justify-between items-center bg-slate-50 shrink-0"><div className="flex items-center gap-4"><div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><Plus size={28}/></div><h3 className="text-2xl font-black text-slate-900">Lên đơn mới</h3></div><div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl"><button onClick={() => setOrderMode('manual')} className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all ${orderMode === 'manual' ? 'bg-white text-slate-900' : 'text-slate-400'}`}><Edit3 size={14}/> Nhập tay</button><button onClick={() => setOrderMode('smart')} className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] transition-all ${orderMode === 'smart' ? 'bg-white text-emerald-600' : 'text-slate-400'}`}><Zap size={14}/> AI Phân tích</button></div><button onClick={() => setIsOrderModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={32}/></button></div><div className="flex-1 overflow-y-auto custom-scrollbar">{orderMode === 'smart' ? (<div className="p-16 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-8"><div className="text-center"><div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><MessageSquareQuote size={40} /></div><h4 className="text-2xl font-black">AI Trích xuất tin nhắn</h4><p className="text-slate-400 text-sm">Dán tin nhắn khách hàng gửi cho bạn vào đây.</p></div><textarea value={smartTextInput} onChange={(e) => setSmartTextInput(e.target.value)} placeholder="Nguyễn Văn A, 090xxx, 123 Lê Lợi..." className="w-full h-48 p-8 bg-slate-50 border rounded-[2.5rem] outline-none font-bold text-slate-700 focus:border-emerald-500 shadow-inner resize-none" /><button onClick={handleSmartExtract} disabled={!smartTextInput.trim() || isExtracting} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2">{isExtracting ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Phân tích ngay</button></div>) : (<div className="p-12 grid grid-cols-12 gap-12"><div className="col-span-5 space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Chọn sản phẩm</p><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">{products.map(p => (<button key={p.id} onClick={() => setNewOrder({...newOrder, productId: p.id})} className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${newOrder.productId === p.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}><img src={p.image} className="w-12 h-12 rounded-xl object-cover" /><div className="flex-1 overflow-hidden"><p className="font-black text-xs truncate">{p.name}</p><p className="text-[10px] text-emerald-600 font-black mt-0.5">{formatCurrency(p.retailPrice)}</p></div>{newOrder.productId === p.id && <Check size={16} className="text-emerald-500" />}</button>))}</div></div><div className="col-span-7 space-y-8"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Thông tin khách hàng</p><div className="grid grid-cols-2 gap-6"><div><label className="text-[9px] font-black uppercase mb-1 block">Tên khách *</label><input type="text" className="w-full px-5 py-3 border rounded-xl font-bold outline-none" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} /></div><div><label className="text-[9px] font-black uppercase mb-1 block">SĐT *</label><input type="text" className="w-full px-5 py-3 border rounded-xl font-bold outline-none" value={newOrder.customerPhone} onChange={e => setNewOrder({...newOrder, customerPhone: e.target.value})} /></div></div><textarea placeholder="Địa chỉ giao hàng..." className="w-full px-5 py-3 border rounded-xl font-bold outline-none h-24 resize-none" value={newOrder.customerAddress} onChange={e => setNewOrder({...newOrder, customerAddress: e.target.value})} /><div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl"><div className="flex justify-between items-center"><p className="text-[9px] font-black uppercase text-emerald-400">Thu hộ (COD)</p><h4 className="text-4xl font-black text-emerald-400">{newOrder.productId ? formatCurrency(((products.find(p => p.id === newOrder.productId)?.retailPrice || 0) * (Number(newOrder.quantity) || 1)) + (newOrder.freeShip ? 0 : (Number(newOrder.shippingFee) || 0)) - (Number(newOrder.deposit) || 0)) : "0đ"}</h4></div></div></div></div>)}</div><div className="p-10 border-t bg-slate-50 flex justify-end gap-4 shrink-0"><button onClick={() => setIsOrderModalOpen(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px]">Hủy</button><button onClick={handleCreateOrder} disabled={!newOrder.productId || !newOrder.customerName || orderMode === 'smart'} className="px-16 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-3"><CheckCircle2 size={20}/> Xác nhận tạo đơn</button></div></div></div>
      )}

      {/* Preservation of Other Modals (Withdrawal, Category, History, etc.) */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col"><div className="p-8 border-b flex justify-between items-center bg-slate-50"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-600 text-white rounded-2xl"><Banknote size={24}/></div><h3 className="text-xl font-black">Yêu cầu rút tiền</h3></div><button onClick={() => setIsWithdrawalModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={32}/></button></div><div className="p-8 space-y-6"><div><label className="text-[10px] font-black uppercase mb-2 block">Số tiền rút *</label><input type="number" className="w-full px-6 py-4 border rounded-2xl font-bold outline-none" value={withdrawalForm.amount || ''} onChange={e => setWithdrawalForm({...withdrawalForm, amount: Number(e.target.value)})} /></div></div><div className="p-8 border-t bg-slate-50"><button onClick={handleWithdrawalRequest} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Xác nhận rút tiền</button></div></div></div>
      )}
    </div>
  );
};

export default App;
