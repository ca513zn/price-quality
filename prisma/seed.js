import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.vote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("👤 Created admin: admin@example.com / password123");

  const users = [];
  const userNames = [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Brown",
    "Diana Prince",
    "Eve Williams",
    "Frank Miller",
    "Grace Lee",
    "Henry Davis",
    "Ivy Chen",
    "Jack Wilson",
  ];

  for (const name of userNames) {
    const user = await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        password: hashedPassword,
      },
    });
    users.push(user);
  }
  console.log(`👥 Created ${users.length} regular users (password: password123)`);

  // Also add admin to the users pool so they can vote too
  users.push(admin);

  // Create brands
  const apple = await prisma.brand.create({
    data: {
      name: "Apple",
      slug: "apple",
      description: "Premium consumer electronics and software company.",
    },
  });

  const samsung = await prisma.brand.create({
    data: {
      name: "Samsung",
      slug: "samsung",
      description: "South Korean multinational electronics corporation.",
    },
  });

  const sony = await prisma.brand.create({
    data: {
      name: "Sony",
      slug: "sony",
      description: "Japanese multinational conglomerate specializing in electronics.",
    },
  });

  const ikea = await prisma.brand.create({
    data: {
      name: "IKEA",
      slug: "ikea",
      description: "Swedish multinational furniture and home goods retailer.",
    },
  });

  const rolex = await prisma.brand.create({
    data: {
      name: "Rolex",
      slug: "rolex",
      description: "Swiss luxury watch manufacturer.",
    },
  });

  // Create products
  const products = [
    { name: "iPhone 16 Pro", brandId: apple.id, description: "Apple's flagship smartphone." },
    { name: "MacBook Pro M4", brandId: apple.id, description: "Professional laptop with Apple silicon." },
    { name: "Galaxy S25 Ultra", brandId: samsung.id, description: "Samsung's premium flagship phone." },
    { name: "Galaxy A15", brandId: samsung.id, description: "Samsung's budget smartphone." },
    { name: "PlayStation 5", brandId: sony.id, description: "Next-gen gaming console." },
    { name: "Sony WH-1000XM5", brandId: sony.id, description: "Premium noise-cancelling headphones." },
    { name: "KALLAX Shelf", brandId: ikea.id, description: "Versatile storage shelf unit." },
    { name: "MALM Bed Frame", brandId: ikea.id, description: "Simple, clean-design bed frame." },
    { name: "Rolex Submariner", brandId: rolex.id, description: "Iconic luxury dive watch." },
    { name: "Rolex Datejust", brandId: rolex.id, description: "Classic luxury dress watch." },
  ];

  const createdProducts = [];

  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        brandId: product.brandId,
      },
    });
    createdProducts.push(created);
  }

  // Define vote patterns for each product (priceRange, qualityRange)
  // Format: [minPrice, maxPrice, minQuality, maxQuality]
  const votePatterns = {
    "iPhone 16 Pro": [7, 10, 7, 10],         // Premium
    "MacBook Pro M4": [8, 10, 8, 10],         // Premium
    "Galaxy S25 Ultra": [7, 9, 7, 9],         // Premium
    "Galaxy A15": [2, 4, 3, 5],               // Budget
    "PlayStation 5": [5, 7, 7, 9],            // Best Value
    "Sony WH-1000XM5": [6, 8, 8, 10],        // Best Value / Premium
    "KALLAX Shelf": [2, 4, 4, 6],             // Best Value / Budget
    "MALM Bed Frame": [3, 5, 4, 7],           // Best Value
    "Rolex Submariner": [9, 10, 8, 10],       // Premium
    "Rolex Datejust": [9, 10, 7, 9],          // Overpriced edge / Premium
  };

  // Generate votes — each user votes once per product (at most)
  for (const product of createdProducts) {
    const pattern = votePatterns[product.name];
    if (!pattern) continue;

    const [minP, maxP, minQ, maxQ] = pattern;
    // Shuffle users and take a random subset (8-11 users per product)
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    const numVotes = 8 + Math.floor(Math.random() * 4); // 8-11
    const voters = shuffled.slice(0, Math.min(numVotes, shuffled.length));

    let totalPrice = 0;
    let totalQuality = 0;

    for (const voter of voters) {
      const priceScore = Math.floor(Math.random() * (maxP - minP + 1)) + minP;
      const qualityScore = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
      totalPrice += priceScore;
      totalQuality += qualityScore;

      await prisma.vote.create({
        data: {
          productId: product.id,
          userId: voter.id,
          priceScore,
          qualityScore,
        },
      });
    }

    // Update aggregated scores
    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgPriceScore: parseFloat((totalPrice / voters.length).toFixed(2)),
        avgQualityScore: parseFloat((totalQuality / voters.length).toFixed(2)),
        totalVotes: voters.length,
      },
    });
  }

  const finalProducts = await prisma.product.findMany({
    include: { brand: true },
    orderBy: { name: "asc" },
  });

  console.log("\n📊 Seeded products:");
  for (const p of finalProducts) {
    console.log(
      `  ${p.name} (${p.brand.name}) — Price: ${p.avgPriceScore}, Quality: ${p.avgQualityScore}, Votes: ${p.totalVotes}`
    );
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
