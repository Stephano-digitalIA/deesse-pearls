// localStorage service layer for data persistence

import { products as staticProducts } from '@/data/products';

export interface ProductTranslation {
  name: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';
  name: string;
  description: string;
  price: number;
  images: string[];
  badge: 'new' | 'bestseller' | null;
  rating: number;
  reviews: number;
  variants: {
    sizes?: string[];
    qualities?: string[];
    diameters?: string[];
  } | null;
  in_stock: boolean;
  created_at?: string;
  translations?: {
    en?: ProductTranslation;
    de?: ProductTranslation;
    es?: ProductTranslation;
    pt?: ProductTranslation;
    it?: ProductTranslation;
    nl?: ProductTranslation;
    ja?: ProductTranslation;
    ko?: ProductTranslation;
  };
}

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorEmail: string;
  comment: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
}

export interface CustomizationRequest {
  id: string;
  jewelryType: string;
  pearlType: string;
  metalType: string;
  budget: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettings {
  adminUrlSecret: string;
}

// Access Logs for admin security
export interface AccessLog {
  id: string;
  userId: string | null;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  attemptType: 'unauthorized_admin_access' | 'admin_login_success';
  createdAt: string;
}

// Access Blocks for rate limiting
export interface AccessBlock {
  id: string;
  email: string;
  attemptCount: number;
  blockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'deesse_users',
  PROFILES: 'deesse_profiles',
  ORDERS: 'deesse_orders',
  REVIEWS: 'deesse_reviews',
  CUSTOMIZATION_REQUESTS: 'deesse_customization_requests',
  ADMIN_SETTINGS: 'deesse_admin_settings',
  CURRENT_USER: 'deesse_current_user',
  PRODUCTS: 'deesse_products',
  ACCESS_LOGS: 'deesse_access_logs',
  ACCESS_BLOCKS: 'deesse_access_blocks',
} as const;

// Helper functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, []);
}

export function setUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function createUser(email: string, password: string, role: 'admin' | 'user' = 'user'): User {
  const users = getUsers();
  const newUser: User = {
    id: generateId(),
    email: email.toLowerCase(),
    password,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  setUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  setUsers(users);
  return users[index];
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  setUsers(filtered);
  return true;
}

// Current user session
export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
}

// Profiles
export function getProfiles(): Profile[] {
  return getItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
}

export function setProfiles(profiles: Profile[]): void {
  setItem(STORAGE_KEYS.PROFILES, profiles);
}

export function getProfileByUserId(userId: string): Profile | undefined {
  return getProfiles().find(p => p.userId === userId);
}

export function upsertProfile(profile: Profile): Profile {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.userId === profile.userId);
  if (index === -1) {
    profiles.push(profile);
  } else {
    profiles[index] = { ...profiles[index], ...profile };
  }
  setProfiles(profiles);
  return profile;
}

// Orders
export function getOrders(): Order[] {
  return getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function setOrders(orders: Order[]): void {
  setItem(STORAGE_KEYS.ORDERS, orders);
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}

export function getOrdersByUserId(userId: string): Order[] {
  return getOrders().filter(o => o.userId === userId);
}

export function createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>, providedOrderNumber?: string): Order {
  const orders = getOrders();
  const orderNumber = providedOrderNumber || `DP-${Date.now().toString(36).toUpperCase()}`;
  const newOrder: Order = {
    ...order,
    id: generateId(),
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  setOrders(orders);
  return newOrder;
}

export function updateOrder(id: string, updates: Partial<Order>): Order | null {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
  setOrders(orders);
  return orders[index];
}

// Reviews
export function getReviews(): Review[] {
  return getItem<Review[]>(STORAGE_KEYS.REVIEWS, []);
}

export function setReviews(reviews: Review[]): void {
  setItem(STORAGE_KEYS.REVIEWS, reviews);
}

export function getReviewsByProductId(productId: string, approvedOnly = true): Review[] {
  return getReviews().filter(r =>
    r.productId === productId && (!approvedOnly || r.isApproved)
  );
}

export function createReview(review: Omit<Review, 'id' | 'createdAt' | 'isApproved'>): Review {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: generateId(),
    isApproved: false,
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  setReviews(reviews);
  return newReview;
}

export function updateReview(id: string, updates: Partial<Review>): Review | null {
  const reviews = getReviews();
  const index = reviews.findIndex(r => r.id === id);
  if (index === -1) return null;
  reviews[index] = { ...reviews[index], ...updates };
  setReviews(reviews);
  return reviews[index];
}

export function deleteReview(id: string): boolean {
  const reviews = getReviews();
  const filtered = reviews.filter(r => r.id !== id);
  if (filtered.length === reviews.length) return false;
  setReviews(filtered);
  return true;
}

// Customization Requests
export function getCustomizationRequests(): CustomizationRequest[] {
  return getItem<CustomizationRequest[]>(STORAGE_KEYS.CUSTOMIZATION_REQUESTS, []);
}

export function setCustomizationRequests(requests: CustomizationRequest[]): void {
  setItem(STORAGE_KEYS.CUSTOMIZATION_REQUESTS, requests);
}

export function createCustomizationRequest(
  request: Omit<CustomizationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): CustomizationRequest {
  const requests = getCustomizationRequests();
  const newRequest: CustomizationRequest = {
    ...request,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  setCustomizationRequests(requests);
  return newRequest;
}

export function updateCustomizationRequest(
  id: string,
  updates: Partial<CustomizationRequest>
): CustomizationRequest | null {
  const requests = getCustomizationRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return null;
  requests[index] = { ...requests[index], ...updates, updatedAt: new Date().toISOString() };
  setCustomizationRequests(requests);
  return requests[index];
}

export function deleteCustomizationRequest(id: string): boolean {
  const requests = getCustomizationRequests();
  const filtered = requests.filter(r => r.id !== id);
  if (filtered.length === requests.length) return false;
  setCustomizationRequests(filtered);
  return true;
}

// Products
export function getProducts(): Product[] {
  const stored = getItem<Product[] | null>(STORAGE_KEYS.PRODUCTS, null);
  if (stored === null) {
    // Initialize with static products, converting format
    const initialProducts = staticProducts.map(p => ({
      id: p.id,
      slug: p.slug,
      category: p.category,
      name: p.name,
      description: p.description,
      price: p.price,
      images: p.images,
      badge: p.badge || null,
      rating: p.rating,
      reviews: p.reviews,
      variants: p.variants || null,
      in_stock: p.inStock,
      created_at: new Date().toISOString(),
    }));
    setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
    return initialProducts;
  }
  return stored;
}

export function setProducts(products: Product[]): void {
  setItem(STORAGE_KEYS.PRODUCTS, products);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find(p => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find(p => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return getProducts().filter(p => p.category === category);
}

export function createProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  products.unshift(newProduct); // Add at beginning
  setProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates };
  setProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  setProducts(filtered);
  return true;
}

// Admin Settings
export function getAdminSettings(): AdminSettings {
  return getItem<AdminSettings>(STORAGE_KEYS.ADMIN_SETTINGS, {
    adminUrlSecret: 'admin2025',
  });
}

export function setAdminSettings(settings: AdminSettings): void {
  setItem(STORAGE_KEYS.ADMIN_SETTINGS, settings);
}

export function verifyAdminSecret(secret: string): boolean {
  return getAdminSettings().adminUrlSecret === secret;
}

// Access Logs
export function getAccessLogs(): AccessLog[] {
  return getItem<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS, []);
}

export function setAccessLogs(logs: AccessLog[]): void {
  setItem(STORAGE_KEYS.ACCESS_LOGS, logs);
}

export function createAccessLog(
  log: Omit<AccessLog, 'id' | 'createdAt'>
): AccessLog {
  const logs = getAccessLogs();
  const newLog: AccessLog = {
    ...log,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog); // Add at beginning (most recent first)
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(100);
  }
  setAccessLogs(logs);
  return newLog;
}

export function deleteAccessLog(id: string): boolean {
  const logs = getAccessLogs();
  const filtered = logs.filter(l => l.id !== id);
  if (filtered.length === logs.length) return false;
  setAccessLogs(filtered);
  return true;
}

export function clearAccessLogs(): void {
  setAccessLogs([]);
}

// Access Blocks
export function getAccessBlocks(): AccessBlock[] {
  return getItem<AccessBlock[]>(STORAGE_KEYS.ACCESS_BLOCKS, []);
}

export function setAccessBlocks(blocks: AccessBlock[]): void {
  setItem(STORAGE_KEYS.ACCESS_BLOCKS, blocks);
}

export function getAccessBlockByEmail(email: string): AccessBlock | undefined {
  return getAccessBlocks().find(b => b.email.toLowerCase() === email.toLowerCase());
}

export function createOrUpdateAccessBlock(email: string): AccessBlock {
  const blocks = getAccessBlocks();
  const existingIndex = blocks.findIndex(b => b.email.toLowerCase() === email.toLowerCase());
  const now = new Date();

  if (existingIndex !== -1) {
    // Update existing block
    const existing = blocks[existingIndex];
    const newAttemptCount = existing.attemptCount + 1;
    // Block for 15 minutes after 5 failed attempts
    const blockedUntil = newAttemptCount >= 5
      ? new Date(now.getTime() + 15 * 60 * 1000).toISOString()
      : existing.blockedUntil;

    blocks[existingIndex] = {
      ...existing,
      attemptCount: newAttemptCount,
      blockedUntil,
      updatedAt: now.toISOString(),
    };
    setAccessBlocks(blocks);
    return blocks[existingIndex];
  } else {
    // Create new block entry
    const newBlock: AccessBlock = {
      id: generateId(),
      email: email.toLowerCase(),
      attemptCount: 1,
      blockedUntil: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    blocks.push(newBlock);
    setAccessBlocks(blocks);
    return newBlock;
  }
}

export function deleteAccessBlock(id: string): boolean {
  const blocks = getAccessBlocks();
  const filtered = blocks.filter(b => b.id !== id);
  if (filtered.length === blocks.length) return false;
  setAccessBlocks(filtered);
  return true;
}

export function clearAccessBlocks(): void {
  setAccessBlocks([]);
}

export function isEmailBlocked(email: string): boolean {
  const block = getAccessBlockByEmail(email);
  if (!block || !block.blockedUntil) return false;
  return new Date(block.blockedUntil) > new Date();
}

// Initialize default data
export function initializeDefaultData(): void {
  // Create default admin if no users exist
  const users = getUsers();
  if (users.length === 0) {
    createUser('admin@deesse.com', 'Admin123!', 'admin');
  }

  // Ensure admin settings exist
  const settings = getAdminSettings();
  if (!settings.adminUrlSecret) {
    setAdminSettings({ adminUrlSecret: 'admin2025' });
  }
}
