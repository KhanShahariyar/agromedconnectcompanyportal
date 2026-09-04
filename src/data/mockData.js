// Mock/sample data for the AgroMED Connect company portal.
// Replace with real API calls when wiring this up to a backend.

export const company = {
  name: 'Bengal AgroCare Ltd.',
  category: 'Crop Inputs & Farm Services',
  verified: true,
  trustScore: 92,
  logoInitials: 'BA',
  address: 'Plot 14, Tejgaon Industrial Area, Dhaka',
  since: 2016,
}

export const kpis = [
  { label: 'Revenue', value: '৳342,800', delta: '+18.4%', trend: 'up' },
  { label: 'Orders', value: '128', delta: '+12.6%', trend: 'up' },
  { label: 'Active Products', value: '87', delta: null, trend: 'flat' },
  { label: 'Farmers Served', value: '486', delta: '+21.4%', trend: 'up' },
  { label: 'Farmer Requests', value: '24', delta: '+5', trend: 'up' },
  { label: 'Customer Rating', value: '4.7 ★', delta: null, trend: 'flat' },
]

export const opportunities = [
  {
    id: 'OP-3391',
    crop: 'Rice',
    icon: '🌾',
    title: 'Rice Seed',
    demandChange: 28,
    location: 'Khulna',
    need: 'Farmers preparing for Aman season are sourcing high-yield seed varieties earlier than usual.',
    interestedFarmers: 214,
    suggested: ['BR-29 Hybrid Rice Seed', 'Seed Treatment Kit'],
    level: 'high',
  },
  {
    id: 'OP-3392',
    crop: 'Multiple',
    icon: '🧪',
    title: 'Organic Fertilizer',
    demandChange: 21,
    location: 'Rajshahi',
    need: 'Search volume for organic and slow-release fertilizer has risen ahead of the planting window.',
    interestedFarmers: 168,
    suggested: ['Organic Compost 25kg', 'Vermicompost Bag'],
    level: 'high',
  },
  {
    id: 'OP-3393',
    crop: 'Tomato',
    icon: '🍅',
    title: 'Tomato Disease Solution',
    demandChange: 34,
    location: 'Jashore',
    need: '127 farmers searched for early blight and leaf spot treatment this month.',
    interestedFarmers: 127,
    suggested: ['Fungicide Pro 500ml', 'Crop Consultation'],
    level: 'high',
  },
  {
    id: 'OP-3394',
    crop: 'Jute',
    icon: '🌿',
    title: 'Jute Fiber Retting Support',
    demandChange: 12,
    location: 'Faridpur',
    need: 'Moderate rise in queries about retting tanks and fiber quality improvement.',
    interestedFarmers: 54,
    suggested: ['Retting Enzyme Solution'],
    level: 'medium',
  },
  {
    id: 'OP-3395',
    crop: 'Vegetables',
    icon: '🐛',
    title: 'Pest Control — Cutworm',
    demandChange: 19,
    location: 'Barishal',
    need: 'Reports of cutworm damage rising across vegetable plots this week.',
    interestedFarmers: 96,
    suggested: ['Bio Pesticide 250ml', 'Farm Inspection'],
    level: 'medium',
  },
]

export const farmerRequests = [
  {
    id: 'FR-1024',
    farmer: 'Abdul Karim',
    location: 'Khulna',
    crop: 'Tomato',
    problem: 'Leaves are developing black spots and plants are becoming weak.',
    hasImages: true,
    status: 'open',
    priority: 'high',
    submitted: '2 hours ago',
    history: [
      { at: '2 hours ago', text: 'Farmer submitted request with 3 photos.' },
    ],
  },
  {
    id: 'FR-1023',
    farmer: 'Rehana Begum',
    location: 'Rajshahi',
    crop: 'Rice',
    problem: 'Need recommendation for a high-yield seed variety for the upcoming Aman season.',
    hasImages: false,
    status: 'open',
    priority: 'medium',
    submitted: '5 hours ago',
    history: [
      { at: '5 hours ago', text: 'Farmer submitted request.' },
    ],
  },
  {
    id: 'FR-1022',
    farmer: 'Mofizul Islam',
    location: 'Jashore',
    crop: 'Tomato',
    problem: 'Fruit is cracking before ripening — looking for a cause and fix.',
    hasImages: true,
    status: 'in-progress',
    priority: 'medium',
    submitted: '1 day ago',
    history: [
      { at: '1 day ago', text: 'Farmer submitted request with 2 photos.' },
      { at: '20 hours ago', text: 'Company recommended Calcium Spray 500ml.' },
    ],
  },
  {
    id: 'FR-1021',
    farmer: 'Salma Aktar',
    location: 'Barishal',
    crop: 'Vegetables',
    problem: 'Cutworms damaging seedlings overnight, needs urgent pest control advice.',
    hasImages: true,
    status: 'in-progress',
    priority: 'high',
    submitted: '1 day ago',
    history: [
      { at: '1 day ago', text: 'Farmer submitted request with photos.' },
      { at: '18 hours ago', text: 'Company scheduled a farm visit for Sept 6.' },
    ],
  },
  {
    id: 'FR-1018',
    farmer: 'Jasim Uddin',
    location: 'Faridpur',
    crop: 'Jute',
    problem: 'Retted fiber quality has dropped this season, looking for guidance.',
    hasImages: false,
    status: 'resolved',
    priority: 'low',
    submitted: '4 days ago',
    history: [
      { at: '4 days ago', text: 'Farmer submitted request.' },
      { at: '3 days ago', text: 'Company offered a consultation call.' },
      { at: '2 days ago', text: 'Marked resolved — farmer confirmed improvement.' },
    ],
  },
]

export const solutions = [
  {
    id: 'SOL-01',
    title: 'Tomato Disease Protection Package',
    crop: 'Tomato',
    includes: ['Fungicide Pro 500ml', 'Crop consultation call', 'Usage instructions (Bangla + English)', '7-day follow-up check'],
    price: 1850,
    target: 'Tomato farmers, Khulna & Jashore',
    status: 'active',
    farmersEnrolled: 63,
  },
  {
    id: 'SOL-02',
    title: 'Aman Rice Season Starter Kit',
    crop: 'Rice',
    includes: ['BR-29 Hybrid Seed 5kg', 'Basal fertilizer dose plan', 'Seed treatment kit', 'Planting guidance sheet'],
    price: 2400,
    target: 'Rice farmers, Rajshahi & Khulna',
    status: 'active',
    farmersEnrolled: 118,
  },
  {
    id: 'SOL-03',
    title: 'Vegetable Pest Shield Bundle',
    crop: 'Vegetables',
    includes: ['Bio pesticide 250ml', 'Farm inspection visit', 'Monitoring schedule'],
    price: 1350,
    target: 'Vegetable farmers, Barishal',
    status: 'draft',
    farmersEnrolled: 0,
  },
]

export const products = [
  { id: 'PRD-101', name: 'BR-29 Hybrid Rice Seed 5kg', category: 'Seeds', price: 850, stock: 42, views: 2140, orders: 118, revenue: 100300, rating: 4.8, demand: 'high', image: '🌾' },
  { id: 'PRD-102', name: 'Organic Compost 25kg', category: 'Fertilizer', price: 620, stock: 12, views: 1870, orders: 96, revenue: 59520, rating: 4.6, demand: 'high', image: '🧪' },
  { id: 'PRD-103', name: 'Fungicide Pro 500ml', category: 'Crop Protection', price: 480, stock: 58, views: 1520, orders: 74, revenue: 35520, rating: 4.7, demand: 'high', image: '🍅' },
  { id: 'PRD-104', name: 'Bio Pesticide 250ml', category: 'Crop Protection', price: 390, stock: 21, views: 980, orders: 41, revenue: 15990, rating: 4.5, demand: 'medium', image: '🐛' },
  { id: 'PRD-105', name: 'Vermicompost Bag 20kg', category: 'Fertilizer', price: 540, stock: 76, views: 640, orders: 22, revenue: 11880, rating: 4.4, demand: 'medium', image: '🪱' },
  { id: 'PRD-106', name: 'Drip Irrigation Kit (Small Plot)', category: 'Equipment', price: 3200, stock: 6, views: 410, orders: 6, revenue: 19200, rating: 4.9, demand: 'low', image: '💧' },
  { id: 'PRD-107', name: 'Calcium Spray 500ml', category: 'Crop Protection', price: 310, stock: 3, views: 260, orders: 9, revenue: 2790, rating: 4.3, demand: 'medium', image: '🧴' },
]

export const orders = [
  { id: 'ORD-8841', customer: 'Abdul Karim', products: 'Fungicide Pro 500ml ×2', amount: 960, payment: 'Paid', delivery: 'Khulna Sadar', status: 'Processing', date: '2026-09-03' },
  { id: 'ORD-8840', customer: 'Rehana Begum', products: 'BR-29 Hybrid Rice Seed 5kg ×3', amount: 2550, payment: 'Paid', delivery: 'Puthia, Rajshahi', status: 'Shipped', date: '2026-09-02' },
  { id: 'ORD-8839', customer: 'Mofizul Islam', products: 'Calcium Spray 500ml ×1', amount: 310, payment: 'Pending', delivery: 'Jashore Sadar', status: 'Confirmed', date: '2026-09-02' },
  { id: 'ORD-8838', customer: 'Salma Aktar', products: 'Bio Pesticide 250ml ×2', amount: 780, payment: 'Paid', delivery: 'Barishal Sadar', status: 'Delivered', date: '2026-09-01' },
  { id: 'ORD-8837', customer: 'Jasim Uddin', products: 'Organic Compost 25kg ×4', amount: 2480, payment: 'Paid', delivery: 'Faridpur Sadar', status: 'Delivered', date: '2026-08-30' },
  { id: 'ORD-8836', customer: 'Nasrin Sultana', products: 'Vermicompost Bag 20kg ×1', amount: 540, payment: 'Refunded', delivery: 'Bogura', status: 'Placed', date: '2026-08-29' },
]

export const services = [
  { id: 'SRV-01', name: 'Crop Consultation', description: 'One-on-one advice on crop selection, disease and nutrient issues.', price: '৳300 / session', area: 'Khulna, Jashore, Rajshahi', capacity: '12 slots / week', rating: 4.8, served: 214 },
  { id: 'SRV-02', name: 'Soil Testing', description: 'On-site soil sample collection and lab-grade nutrient analysis.', price: '৳500 / sample', area: 'Rajshahi, Bogura', capacity: '20 samples / week', rating: 4.7, served: 132 },
  { id: 'SRV-03', name: 'Pest Diagnosis', description: 'Rapid identification of pest and disease issues from field visits or photos.', price: '৳250 / diagnosis', area: 'Khulna, Barishal', capacity: '30 requests / week', rating: 4.6, served: 187 },
  { id: 'SRV-04', name: 'Farm Inspection', description: 'Full-plot inspection covering soil, irrigation, and crop health.', price: '৳800 / visit', area: 'Khulna, Jashore', capacity: '8 visits / week', rating: 4.9, served: 76 },
  { id: 'SRV-05', name: 'Drone Monitoring', description: 'Aerial crop-health imaging for early stress and pest detection.', price: '৳1,500 / plot', area: 'Rajshahi', capacity: '4 plots / week', rating: 4.8, served: 29 },
  { id: 'SRV-06', name: 'Irrigation Services', description: 'Design and setup support for drip and sprinkler irrigation.', price: 'From ৳2,000', area: 'Faridpur, Bogura', capacity: '6 jobs / week', rating: 4.5, served: 41 },
  { id: 'SRV-07', name: 'Equipment Rental', description: 'Short-term rental of power tillers, sprayers, and threshers.', price: 'From ৳600 / day', area: 'All service areas', capacity: '15 units', rating: 4.4, served: 98 },
  { id: 'SRV-08', name: 'Agricultural Training', description: 'Group workshops on modern farming techniques and safe input use.', price: '৳150 / farmer', area: 'All service areas', capacity: '4 sessions / month', rating: 4.9, served: 340 },
]

export const revenueTrend = [
  { month: 'Mar', revenue: 198000, orders: 74 },
  { month: 'Apr', revenue: 214000, orders: 81 },
  { month: 'May', revenue: 231000, orders: 88 },
  { month: 'Jun', revenue: 256000, orders: 97 },
  { month: 'Jul', revenue: 289000, orders: 109 },
  { month: 'Aug', revenue: 342800, orders: 128 },
]

export const regionalDemand = [
  { region: 'Khulna', value: 92 },
  { region: 'Rajshahi', value: 84 },
  { region: 'Jashore', value: 67 },
  { region: 'Barishal', value: 58 },
  { region: 'Faridpur', value: 41 },
  { region: 'Bogura', value: 36 },
]

export const cropTrends = [
  { crop: 'Rice', growth: 28 },
  { crop: 'Vegetables', growth: 19 },
  { crop: 'Jute', growth: 8 },
  { crop: 'Wheat', growth: 14 },
  { crop: 'Fruits', growth: 6 },
]

export const farmerProblems = [
  { problem: 'Leaf spot / blight in tomato', count: 127 },
  { problem: 'Low soil fertility', count: 98 },
  { problem: 'Cutworm & pest damage', count: 84 },
  { problem: 'Irrigation water shortage', count: 61 },
  { problem: 'Seed germination issues', count: 47 },
]

export const seasonalOpportunities = [
  {
    title: 'Aman Rice Season',
    window: 'Peak demand in 3–4 weeks',
    items: ['Fertilizer', 'Rice seed', 'Pest control'],
    recommendation: 'Consider increasing inventory by 20% before peak demand.',
  },
  {
    title: 'Post-Monsoon Vegetable Planting',
    window: 'Peak demand in 5–6 weeks',
    items: ['Compost', 'Seedling trays', 'Fungicide'],
    recommendation: 'Regional searches for compost are already up 14% in Barishal.',
  },
]

export const inventory = products.map((p) => ({
  ...p,
  turnover: p.orders > 60 ? 'Fast-moving' : p.orders > 20 ? 'Steady' : 'Slow-moving',
  stockValue: p.price * p.stock,
}))

export const lowStock = products.filter((p) => p.stock <= 15)

export const promotions = [
  {
    id: 'PRM-01',
    title: 'Monsoon Farming Campaign',
    discount: '15% OFF',
    product: 'Organic Fertilizer',
    target: 'Vegetable Farmers',
    location: 'Khulna + Barishal',
    status: 'active',
    reach: 8400,
    views: 3120,
    orders: 214,
    revenue: 132800,
    conversion: '6.9%',
  },
  {
    id: 'PRM-02',
    title: 'Aman Season Seed Offer',
    discount: '10% OFF',
    product: 'BR-29 Hybrid Rice Seed',
    target: 'Rice Farmers',
    location: 'Rajshahi',
    status: 'active',
    reach: 6100,
    views: 2480,
    orders: 168,
    revenue: 142800,
    conversion: '6.8%',
  },
  {
    id: 'PRM-03',
    title: 'Tomato Season Wrap-up',
    discount: '20% OFF',
    product: 'Fungicide Pro',
    target: 'Tomato Farmers',
    location: 'Jashore',
    status: 'ended',
    reach: 4200,
    views: 1690,
    orders: 91,
    revenue: 43680,
    conversion: '5.4%',
  },
]

export const reviews = [
  { id: 'REV-01', farmer: 'Abdul Karim', product: 'Fungicide Pro 500ml', rating: 5, text: 'Worked well on my tomato plants within a week. Clear instructions.', date: '2026-08-29', replied: true },
  { id: 'REV-02', farmer: 'Rehana Begum', product: 'BR-29 Hybrid Rice Seed', rating: 4, text: 'Good germination rate, delivery took a bit longer than expected.', date: '2026-08-27', replied: true },
  { id: 'REV-03', farmer: 'Mofizul Islam', product: 'Crop Consultation', rating: 5, text: 'The agronomist explained everything clearly and followed up after a week.', date: '2026-08-24', replied: false },
  { id: 'REV-04', farmer: 'Salma Aktar', product: 'Bio Pesticide 250ml', rating: 3, text: 'Helped, but I needed a second application. Would like clearer dosage guidance.', date: '2026-08-20', replied: false },
]

export const transactions = [
  { id: 'TXN-5521', order: 'ORD-8841', amount: 960, method: 'bKash', status: 'Completed', date: '2026-09-03' },
  { id: 'TXN-5520', order: 'ORD-8840', amount: 2550, method: 'Bank Transfer', status: 'Completed', date: '2026-09-02' },
  { id: 'TXN-5519', order: 'ORD-8839', amount: 310, method: 'Cash on Delivery', status: 'Pending', date: '2026-09-02' },
  { id: 'TXN-5518', order: 'ORD-8838', amount: 780, method: 'Nagad', status: 'Completed', date: '2026-09-01' },
  { id: 'TXN-5517', order: 'ORD-8836', amount: 540, method: 'bKash', status: 'Refunded', date: '2026-08-29' },
]

export const team = [
  { id: 'TM-01', name: 'Farhan Ahmed', role: 'Owner', email: 'farhan@bengalagrocare.com', status: 'active' },
  { id: 'TM-02', name: 'Nusrat Jahan', role: 'Manager', email: 'nusrat@bengalagrocare.com', status: 'active' },
  { id: 'TM-03', name: 'Kamal Hossain', role: 'Sales', email: 'kamal@bengalagrocare.com', status: 'active' },
  { id: 'TM-04', name: 'Dr. Shirin Akter', role: 'Agricultural Expert', email: 'shirin@bengalagrocare.com', status: 'active' },
  { id: 'TM-05', name: 'Rakibul Islam', role: 'Inventory Manager', email: 'rakibul@bengalagrocare.com', status: 'invited' },
]

export const notifications = [
  { id: 'N1', type: 'request', title: 'New farmer request', text: 'Abdul Karim reported black spots on tomato leaves.', time: '2h ago', unread: true },
  { id: 'N2', type: 'order', title: 'New order placed', text: 'ORD-8841 — 2× Fungicide Pro 500ml.', time: '3h ago', unread: true },
  { id: 'N3', type: 'demand', title: 'High product demand', text: 'Rice seed demand up 28% in Khulna.', time: '6h ago', unread: true },
  { id: 'N4', type: 'stock', title: 'Low stock alert', text: 'Hybrid Rice Seed — 12 units remaining.', time: '1d ago', unread: false },
  { id: 'N5', type: 'review', title: 'New review', text: 'Rehana Begum left a 4-star review.', time: '1d ago', unread: false },
  { id: 'N6', type: 'payment', title: 'Payment received', text: '৳2,550 credited for ORD-8840.', time: '2d ago', unread: false },
  { id: 'N7', type: 'verification', title: 'Verification update', text: 'Business license re-verification due in 30 days.', time: '3d ago', unread: false },
]

export const insights = [
  '💡 Demand for organic fertilizer is rising in your area — up 21% in Rajshahi this month.',
  '💡 Your Hybrid Rice Seed has 32% higher conversion than similar products on the platform.',
  '💡 18 farmers are currently looking for tomato disease solutions near Jashore.',
  '💡 Your average response time to farmer requests improved by 14% this month.',
  '💡 Vegetable Pest Shield Bundle is ready to publish — 96 farmers matched its target profile last week.',
]

export const trustFactors = [
  { label: 'Profile completeness', score: 96 },
  { label: 'Response rate', score: 90 },
  { label: 'Product quality', score: 93 },
  { label: 'Customer reviews', score: 88 },
  { label: 'Farmer satisfaction', score: 91 },
  { label: 'Order completion', score: 95 },
]
