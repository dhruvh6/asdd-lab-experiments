// Demo data loaded into a fresh store. Passwords are for local demos only.
const DEMO_USERS = [
  { name: 'Canteen Admin', email: 'admin@campuseats.local', password: 'admin123', role: 'admin' },
  { name: 'Kitchen Staff', email: 'staff@campuseats.local', password: 'staff123', role: 'staff' },
  { name: 'Demo Student', email: 'student@campuseats.local', password: 'student123', role: 'student' },
];

const MENU = [
  { name: 'Masala Dosa', category: 'South Indian', price: 60, isVeg: true },
  { name: 'Idli Sambar', category: 'South Indian', price: 40, isVeg: true },
  { name: 'Medu Vada', category: 'South Indian', price: 45, isVeg: true },
  { name: 'Vada Pav', category: 'Snacks', price: 20, isVeg: true },
  { name: 'Samosa', category: 'Snacks', price: 18, isVeg: true },
  { name: 'Veg Sandwich', category: 'Snacks', price: 50, isVeg: true },
  { name: 'Chicken Frankie', category: 'Snacks', price: 80, isVeg: false },
  { name: 'Veg Thali', category: 'Meals', price: 110, isVeg: true },
  { name: 'Paneer Fried Rice', category: 'Meals', price: 120, isVeg: true },
  { name: 'Chicken Biryani', category: 'Meals', price: 150, isVeg: false },
  { name: 'Hakka Noodles', category: 'Meals', price: 90, isVeg: true },
  { name: 'Cutting Chai', category: 'Beverages', price: 12, isVeg: true },
  { name: 'Cold Coffee', category: 'Beverages', price: 55, isVeg: true },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 35, isVeg: true },
];

module.exports = { DEMO_USERS, MENU };
