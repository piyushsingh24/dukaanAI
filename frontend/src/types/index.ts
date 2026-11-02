export interface Merchant {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  preferredLanguage: string;
  totalOrders: number;
  outstandingAmount: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  merchantId: string;
  customerId: string;
  customer: Customer;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'MERCHANT' | 'AI';
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT';
  content: string;
  aiProcessed: boolean;
  intent?: string;
  confidence?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  categoryId?: string;
  productName: string;
  sku?: string;
  sellingPrice: number;
  purchasePrice?: number;
  unit: string;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  product: Product;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
}

export interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  customer: Customer;
  status: 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  source: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  merchantId: string;
  customerId: string;
  customer: Customer;
  orderId?: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  paymentDate: string;
  referenceNumber?: string;
}

export interface AIInsight {
  id: string;
  merchantId: string;
  insightType: string;
  title: string;
  description?: string;
  confidence: number;
  generatedAt: string;
}

export interface DashboardData {
  ordersToday: number;
  revenue: number;
  pendingPayments: number;
  lowStockItems: number;
  revenueTrend: { date: string; amount: number }[];
  orderStatusDistribution: { status: string; count: number }[];
  recentActivity: ActivityItem[];
  aiSuggestions: AIInsight[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  description: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
