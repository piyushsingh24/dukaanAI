export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', href: '/orders', icon: 'ShoppingCart' },
  { label: 'Customers', href: '/customers', icon: 'Users' },
  { label: 'Conversations', href: '/conversations', icon: 'MessageSquare' },
  { label: 'Inventory', href: '/inventory', icon: 'Package' },
  { label: 'Payments', href: '/payments', icon: 'Wallet' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
