
export enum OrderStatus {
  PENDING = 'PENDING',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED', // New status for returns tracking
  CANCELLED = 'CANCELLED',
  CANCELLED_BY_CUSTOMER = 'CANCELLED_BY_CUSTOMER'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  PARTNER = 'PARTNER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED'
}

export enum TransactionType {
  COMMISSION = 'COMMISSION',
  WITHDRAWAL = 'WITHDRAWAL'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  orderId?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  note?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  permissions?: string[];
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  industry?: string;
  notes?: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  supplierId: string;
  dealerPrice: number;
  retailPrice: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productId: string;
  productName: string;
  quantity: number;
  dealerPrice: number;
  retailPrice: number;
  totalProfit: number;
  status: OrderStatus;
  createdAt: string;
  orderDate: string; // New field: Explicit order date/time
  staffName: string; // New field: Staff who placed the order
  createdByUserId?: string;
  deposit: number;
  shippingFee: number;
  deliveryDate: string;
  note?: string;
  totalToCollect?: number; // (retailPrice * quantity) + shippingFee - deposit
  isSupplierConfirmed?: boolean;
}

export interface DailyStat {
  date: string;
  revenue: number;
  profit: number;
  orderCount: number;
}
