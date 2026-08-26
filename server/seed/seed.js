require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const products = [
  {
    name: 'BD Vacuum Suction Cleaner - Portable Air Duster Wireless',
    description: 'Powerful cordless mini vacuum cleaner for keyboards, cars and desks.',
    brand: 'BD',
    category: 'Home & Kitchen',
    image: img('vacuum1'),
    price: 849,
    mrp: 1899,
    stock: 42,
    rating: 4.0,
    numReviews: 128,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: 'Fabric Stain Remover Spray',
    description: 'Instantly lifts tough stains from any fabric, safe for all colors.',
    category: 'Home & Kitchen',
    image: img('stain1'),
    price: 649,
    mrp: 800,
    stock: 75,
    rating: 4.0,
    numReviews: 64,
    isBestSeller: true,
  },
  {
    name: 'KolorFish Electric Mini Garlic Chopper 250ml',
    description: 'Compact electric chopper for garlic, onion, ginger and vegetables.',
    brand: 'KolorFish',
    category: 'Home & Kitchen',
    image: img('chopper1'),
    price: 650,
    mrp: 1199,
    stock: 30,
    rating: 4.0,
    numReviews: 210,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: 'Travel Portable Mini Juice Blender',
    description: 'USB rechargeable personal blender for smoothies and shakes on the go.',
    category: 'Home & Kitchen',
    image: img('blender1'),
    price: 799,
    mrp: 1266,
    stock: 55,
    rating: 4.0,
    numReviews: 97,
    isBestSeller: true,
  },
  {
    name: 'Women Floral Wrap Dress',
    description: 'Breathable summer wrap dress with floral print, regular fit.',
    category: 'Women Western',
    image: img('dress1'),
    price: 999,
    mrp: 1999,
    stock: 40,
    rating: 4.2,
    numReviews: 58,
    isFeatured: true,
  },
  {
    name: 'Women Satin Nightwear Set',
    description: 'Soft satin nightwear set, breathable and comfortable for everyday wear.',
    category: 'Lingerie',
    image: img('night1'),
    price: 549,
    mrp: 999,
    stock: 60,
    rating: 4.1,
    numReviews: 33,
  },
  {
    name: "Men's Slim Fit Casual Shirt",
    description: 'Premium cotton-blend slim fit shirt, ideal for office and casual wear.',
    brand: 'Urban Threads',
    category: 'Men',
    image: img('shirt1'),
    price: 749,
    mrp: 1499,
    stock: 80,
    rating: 4.3,
    numReviews: 142,
    isFeatured: true,
  },
  {
    name: "Men's Sports Sneakers",
    description: 'Lightweight breathable sneakers with cushioned sole for all-day comfort.',
    brand: 'StrideFit',
    category: 'Bags & Foot',
    image: img('shoes1'),
    price: 1299,
    mrp: 2499,
    stock: 35,
    rating: 4.4,
    numReviews: 201,
    isBestSeller: true,
  },
  {
    name: 'Kids Building Blocks Set (100 Pcs)',
    description: 'Educational building block set to boost creativity and motor skills.',
    category: 'Kids & Toys',
    image: img('toy1'),
    price: 499,
    mrp: 899,
    stock: 90,
    rating: 4.5,
    numReviews: 176,
    isFeatured: true,
  },
  {
    name: 'Remote Control Stunt Car',
    description: 'Rechargeable RC stunt car with 360-degree rotation and LED lights.',
    category: 'Kids & Toys',
    image: img('toy2'),
    price: 899,
    mrp: 1799,
    stock: 45,
    rating: 4.2,
    numReviews: 88,
  },
  {
    name: 'Vitamin C Brightening Face Serum',
    description: 'Lightweight face serum for glowing, even-toned skin.',
    brand: 'GlowLab',
    category: 'Beauty & Health',
    image: img('beauty1'),
    price: 449,
    mrp: 899,
    stock: 120,
    rating: 4.3,
    numReviews: 264,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: 'Herbal Hair Growth Oil',
    description: 'Ayurvedic hair oil blend to reduce hair fall and boost growth.',
    brand: 'GlowLab',
    category: 'Beauty & Health',
    image: img('beauty2'),
    price: 349,
    mrp: 699,
    stock: 150,
    rating: 4.1,
    numReviews: 190,
  },
  {
    name: 'Rose Gold Layered Necklace Set',
    description: 'Elegant rose gold plated layered necklace with matching earrings.',
    brand: 'Aurelia',
    category: 'Jewellery',
    image: img('jewel1'),
    price: 599,
    mrp: 1299,
    stock: 50,
    rating: 4.4,
    numReviews: 72,
    isFeatured: true,
  },
  {
    name: 'American Diamond Stud Earrings',
    description: 'Sparkling AD stud earrings, hypoallergenic and lightweight.',
    brand: 'Aurelia',
    category: 'Jewellery',
    image: img('jewel2'),
    price: 299,
    mrp: 599,
    stock: 100,
    rating: 4.0,
    numReviews: 45,
  },
  {
    name: 'Multipurpose Home Storage Organizer',
    description: 'Foldable fabric storage organizer for wardrobe and home essentials.',
    category: 'Home Items',
    image: img('home1'),
    price: 399,
    mrp: 799,
    stock: 85,
    rating: 4.0,
    numReviews: 54,
  },
  {
    name: 'LED Motion Sensor Night Light',
    description: 'Energy-efficient LED night light with automatic motion sensor.',
    category: 'Home Items',
    image: img('home2'),
    price: 299,
    mrp: 599,
    stock: 110,
    rating: 4.2,
    numReviews: 63,
    isBestSeller: true,
  },
];

async function seed() {
  await connectDB();
  const destroy = process.argv.includes('--destroy');

  if (destroy) {
    await Promise.all([Product.deleteMany({}), Order.deleteMany({})]);
    console.log('[seed] Cleared products and orders');
    process.exit(0);
  }

  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`[seed] Inserted ${products.length} products`);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@retalla.in').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Retalla Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      isAdmin: true,
    });
    console.log(`[seed] Created admin user -> ${adminEmail}`);
  } else {
    console.log(`[seed] Admin user already exists -> ${adminEmail}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
