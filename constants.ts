
import { Product, Order, OrderStatus, Supplier, Category } from './types';

export const MOCK_SUPPLIERS: Supplier[] = [
  { 
    id: 's1', 
    name: 'Công ty A', 
    phone: '0901234444', 
    email: 'contact@companya.vn',
    website: 'www.companya.vn',
    contactPerson: 'Mr. Tuấn Anh',
    address: 'Kho Tổng Miền Bắc, Hà Nội',
    industry: 'Gia dụng thông minh',
    notes: 'Đối tác chiến lược, chuyên các dòng máy hút bụi và lọc không khí.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200'
  },
  { 
    id: 's2', 
    name: 'Nhà Phân Phối B', 
    phone: '0988777666', 
    email: 'sales@npp-b.com',
    contactPerson: 'Ms. Lan Phương',
    address: 'Kho Miền Nam, TP. HCM',
    industry: 'Thiết bị nhà bếp',
    image: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=200'
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Gia dụng' },
  { id: 'c2', name: 'Nhà bếp' },
  { id: 'c3', name: 'Điện tử' },
  { id: 'c4', name: 'Làm đẹp' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Robot Hút Bụi Thông Minh Gen 3',
    categoryId: 'c1',
    supplierId: 's1',
    dealerPrice: 3500000,
    retailPrice: 4800000,
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p2',
    name: 'Nồi Chiên Không Dầu 5L XL',
    categoryId: 'c2',
    supplierId: 's1',
    dealerPrice: 1200000,
    retailPrice: 1950000,
    image: 'https://images.unsplash.com/photo-1626071494702-420310a20242?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p3',
    name: 'Máy Lọc Không Khí Pro Max',
    categoryId: 'c1',
    supplierId: 's1',
    dealerPrice: 2100000,
    retailPrice: 3200000,
    image: 'https://images.unsplash.com/photo-1585771724684-252ad5058631?auto=format&fit=crop&q=80&w=400'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    customerAddress: '123 Đường Lê Lợi, Q.1, TP.HCM',
    productId: 'p1',
    productName: 'Robot Hút Bụi Thông Minh Gen 3',
    quantity: 1,
    dealerPrice: 3500000,
    retailPrice: 4800000,
    totalProfit: 1300000,
    status: OrderStatus.DELIVERED,
    createdAt: new Date().toISOString(),
    orderDate: new Date().toISOString(),
    staffName: 'Quản trị viên',
    deposit: 500000,
    shippingFee: 30000,
    deliveryDate: '2024-05-18',
    totalToCollect: 4330000,
    note: 'Giao giờ hành chính',
    isSupplierConfirmed: true
  }
];
