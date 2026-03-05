import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BATCH_SIZE = 500; // Prisma createMany batch size
const VOTE_BATCH_SIZE = 1000; // Larger batches for votes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadDataset(name) {
  const filePath = join(__dirname, "datasets", `${name}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deduplicate slugs by appending -2, -3, etc. */
function deduplicateSlugs(items) {
  const seen = new Map();
  return items.map((item) => {
    let slug = slugify(item.name);
    const count = (seen.get(slug) || 0) + 1;
    seen.set(slug, count);
    if (count > 1) slug = `${slug}-${count}`;
    return { ...item, slug };
  });
}

/** Insert in batches using createMany with skipDuplicates */
async function batchCreateMany(model, records, batchSize = BATCH_SIZE) {
  let created = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    created += result.count;
  }
  return created;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    clean: args.includes("--clean"),
    categoriesOnly: args.includes("--categories-only"),
    brandsOnly: args.includes("--brands-only"),
    productsOnly: args.includes("--products-only"),
    votesOnly: args.includes("--votes-only"),
    usersOnly: args.includes("--users-only"),
    help: args.includes("--help") || args.includes("-h"),
  };

  // Determine if we should seed everything
  const hasSpecificFlag =
    flags.categoriesOnly ||
    flags.brandsOnly ||
    flags.productsOnly ||
    flags.votesOnly ||
    flags.usersOnly;

  // --all is true if: explicitly passed, OR no specific seed flags were given
  // (--clean alone still seeds everything, --help alone does not)
  flags.all = args.includes("--all") || (!hasSpecificFlag && !flags.help);

  return flags;
}

function printHelp() {
  console.log(`
📖 Seed Script Usage:
  node prisma/seed.js [options]

Options:
  --all               Seed everything (default if no flags)
  --clean             Delete ALL existing data first (destructive!)
  --categories-only   Seed categories only
  --brands-only       Seed brands (and categories) only
  --products-only     Seed products only (brands must exist)
  --users-only        Seed users only
  --votes-only        Generate votes only (users & products must exist)
  --help, -h          Show this help message

Examples:
  node prisma/seed.js                     # Seed everything (additive)
  node prisma/seed.js --clean             # Wipe and reseed everything
  node prisma/seed.js --brands-only       # Add new brands from dataset
  node prisma/seed.js --votes-only        # Generate votes for existing products
`);
}

// ---------------------------------------------------------------------------
// Seeders
// ---------------------------------------------------------------------------

async function seedCategories() {
  console.log("\n📂 Seeding categories...");
  const categoriesData = loadDataset("categories");
  const records = deduplicateSlugs(categoriesData).map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description || null,
  }));

  const created = await batchCreateMany(prisma.category, records);
  console.log(`   ✅ ${created} categories created (${records.length - created} skipped as duplicates)`);

  // Return lookup map
  const allCategories = await prisma.category.findMany();
  return new Map(allCategories.map((c) => [c.name, c.id]));
}

async function seedBrands(categoryMap) {
  console.log("\n🏷️  Seeding brands...");
  const brandsData = loadDataset("brands");

  // If we don't have a category map yet, build one
  if (!categoryMap || categoryMap.size === 0) {
    const allCategories = await prisma.category.findMany();
    categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));
  }

  const brandsWithSlugs = deduplicateSlugs(brandsData);

  // Step 1: createMany for brands (without categories — M2M can't be done in createMany)
  const brandRecords = brandsWithSlugs.map((b) => ({
    name: b.name,
    slug: b.slug,
    description: b.description || null,
  }));

  const created = await batchCreateMany(prisma.brand, brandRecords);
  console.log(`   ✅ ${created} brands created (${brandRecords.length - created} skipped as duplicates)`);

  // Step 2: Link categories via update (M2M connect)
  if (categoryMap.size > 0) {
    const allBrands = await prisma.brand.findMany();
    const brandNameToId = new Map(allBrands.map((b) => [b.name, b.id]));

    let linked = 0;
    for (const brandData of brandsWithSlugs) {
      const brandId = brandNameToId.get(brandData.name);
      if (!brandId || !brandData.categories || brandData.categories.length === 0) continue;

      const categoryIds = brandData.categories
        .map((catName) => categoryMap.get(catName))
        .filter(Boolean);

      if (categoryIds.length > 0) {
        await prisma.brand.update({
          where: { id: brandId },
          data: {
            categories: {
              set: categoryIds.map((id) => ({ id })),
            },
          },
        });
        linked++;
      }
    }
    console.log(`   🔗 ${linked} brands linked to categories`);
  }

  // Return lookup map
  const allBrands = await prisma.brand.findMany();
  return new Map(allBrands.map((b) => [b.name, b.id]));
}

async function seedProducts(brandMap) {
  console.log("\n📦 Seeding products...");
  const productsData = loadDataset("products");

  // If we don't have a brand map yet, build one
  if (!brandMap || brandMap.size === 0) {
    const allBrands = await prisma.brand.findMany();
    brandMap = new Map(allBrands.map((b) => [b.name, b.id]));
  }

  // Resolve brand references and filter out products with missing brands
  const resolved = [];
  let skippedMissing = 0;
  for (const p of productsData) {
    const brandId = brandMap.get(p.brand);
    if (!brandId) {
      skippedMissing++;
      continue;
    }
    resolved.push({ ...p, brandId });
  }

  if (skippedMissing > 0) {
    console.log(`   ⚠️  ${skippedMissing} products skipped (brand not found in DB)`);
  }

  const productsWithSlugs = deduplicateSlugs(resolved);
  const productRecords = productsWithSlugs.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: p.description || null,
    brandId: p.brandId,
  }));

  const created = await batchCreateMany(prisma.product, productRecords);
  console.log(`   ✅ ${created} products created (${productRecords.length - created} skipped as duplicates)`);

  // Return products with vote patterns for vote generation
  const allProducts = await prisma.product.findMany();
  const productNameToId = new Map(allProducts.map((p) => [p.name, p.id]));

  return productsWithSlugs
    .filter((p) => productNameToId.has(p.name))
    .map((p) => ({
      id: productNameToId.get(p.name),
      name: p.name,
      votePattern: p.votePattern || null,
    }));
}

async function seedUsers() {
  console.log("\n👥 Seeding users...");
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Admin user
  const adminData = {
    name: "Admin User",
    email: "admin@example.com",
    password: hashedPassword,
    role: "ADMIN",
  };

  // Regular users — pool of 50 for vote diversity
  const userNames = [
    "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince",
    "Eve Williams", "Frank Miller", "Grace Lee", "Henry Davis",
    "Ivy Chen", "Jack Wilson", "Karen Taylor", "Leo Martinez",
    "Mia Anderson", "Noah Thomas", "Olivia Jackson", "Paul White",
    "Quinn Harris", "Rachel Clark", "Sam Lewis", "Tina Robinson",
    "Uma Walker", "Victor Young", "Wendy Allen", "Xavier King",
    "Yara Scott", "Zane Hill", "Amy Green", "Ben Adams",
    "Clara Baker", "David Nelson", "Elena Carter", "Felix Mitchell",
    "Gina Perez", "Hugo Roberts", "Iris Turner", "James Phillips",
    "Kate Campbell", "Liam Parker", "Maya Evans", "Nathan Edwards",
    "Ophelia Collins", "Peter Stewart", "Ruby Sanchez", "Steve Morris",
    "Tara Rogers", "Ulysses Reed", "Viola Cook", "Walter Morgan",
    "Xena Bailey", "Yuri Rivera",
  ];

  const userRecords = [
    adminData,
    ...userNames.map((name) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      password: hashedPassword,
      role: "USER",
    })),
  ];

  const created = await batchCreateMany(prisma.user, userRecords);
  console.log(`   ✅ ${created} users created (${userRecords.length - created} skipped as duplicates)`);
  console.log("   🔑 Admin: admin@example.com / password123");
  console.log("   🔑 Users: <firstname>.<lastname>@example.com / password123");

  // Return user IDs
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  return allUsers.map((u) => u.id);
}

async function seedVotes(productsWithPatterns, userIds) {
  console.log("\n🗳️  Generating votes...");

  // If no product data passed, load from DB + dataset for patterns
  if (!productsWithPatterns || productsWithPatterns.length === 0) {
    const allProducts = await prisma.product.findMany({ select: { id: true, name: true } });
    const productsData = loadDataset("products");
    const patternMap = new Map(
      productsData.filter((p) => p.votePattern).map((p) => [p.name, p.votePattern])
    );
    productsWithPatterns = allProducts
      .filter((p) => patternMap.has(p.name))
      .map((p) => ({ id: p.id, name: p.name, votePattern: patternMap.get(p.name) }));
  }

  // If no user IDs passed, load from DB
  if (!userIds || userIds.length === 0) {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    userIds = allUsers.map((u) => u.id);
  }

  if (userIds.length === 0) {
    console.log("   ⚠️  No users found — skipping vote generation");
    return;
  }

  // Check which (productId, userId) pairs already have votes
  const existingVotes = await prisma.vote.findMany({
    select: { productId: true, userId: true },
  });
  const existingSet = new Set(existingVotes.map((v) => `${v.productId}:${v.userId}`));

  const allVoteRecords = [];

  for (const product of productsWithPatterns) {
    if (!product.votePattern) continue;
    const [minP, maxP, minQ, maxQ] = product.votePattern;

    // Each product gets votes from 60-90% of users
    const shuffledUsers = shuffle(userIds);
    const numVoters = Math.max(1, Math.floor(shuffledUsers.length * (0.6 + Math.random() * 0.3)));
    const voters = shuffledUsers.slice(0, numVoters);

    for (const userId of voters) {
      const key = `${product.id}:${userId}`;
      if (existingSet.has(key)) continue; // Skip existing votes

      const priceScore = randomInt(minP, maxP);
      const qualityScore = randomInt(minQ, maxQ);

      allVoteRecords.push({
        productId: product.id,
        userId,
        priceScore,
        qualityScore,
      });
    }
  }

  // Batch insert votes
  if (allVoteRecords.length > 0) {
    const created = await batchCreateMany(prisma.vote, allVoteRecords, VOTE_BATCH_SIZE);
    console.log(`   ✅ ${created} votes created (${allVoteRecords.length - created} skipped as duplicates)`);
  } else {
    console.log("   ℹ️  No new votes to create");
  }

  // Update aggregated scores — recalculate from ALL votes (existing + new)
  console.log("   📊 Updating aggregated scores...");
  const productsToUpdate = productsWithPatterns.filter((p) => p.votePattern);

  let updated = 0;
  for (let i = 0; i < productsToUpdate.length; i += BATCH_SIZE) {
    const batch = productsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (product) => {
        const votes = await prisma.vote.findMany({
          where: { productId: product.id },
          select: { priceScore: true, qualityScore: true },
        });
        if (votes.length === 0) return;

        const totalPrice = votes.reduce((s, v) => s + v.priceScore, 0);
        const totalQuality = votes.reduce((s, v) => s + v.qualityScore, 0);

        await prisma.product.update({
          where: { id: product.id },
          data: {
            avgPriceScore: parseFloat((totalPrice / votes.length).toFixed(2)),
            avgQualityScore: parseFloat((totalQuality / votes.length).toFixed(2)),
            totalVotes: votes.length,
          },
        });
        updated++;
      })
    );
  }
  console.log(`   ✅ ${updated} product scores updated`);
}

async function cleanDatabase() {
  console.log("\n🧹 Cleaning database (destructive)...");
  const t0 = performance.now();

  // Delete in dependency order
  await prisma.vote.deleteMany();
  console.log("   🗑️  Votes deleted");
  await prisma.product.deleteMany();
  console.log("   🗑️  Products deleted");
  await prisma.brand.deleteMany();
  console.log("   🗑️  Brands deleted");
  await prisma.category.deleteMany();
  console.log("   🗑️  Categories deleted");
  await prisma.user.deleteMany();
  console.log("   🗑️  Users deleted");

  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.log(`   ✅ Database cleaned in ${elapsed}s`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const flags = parseArgs();

  if (flags.help) {
    printHelp();
    return;
  }

  const t0 = performance.now();
  console.log("🌱 Price-Quality Seed Script");
  console.log("─".repeat(50));

  // Clean if requested
  if (flags.clean) {
    await cleanDatabase();
  }

  let categoryMap = null;
  let brandMap = null;
  let productsWithPatterns = null;
  let userIds = null;

  if (flags.all || flags.categoriesOnly || flags.brandsOnly) {
    categoryMap = await seedCategories();
  }

  if (flags.all || flags.brandsOnly) {
    brandMap = await seedBrands(categoryMap);
  }

  if (flags.all || flags.productsOnly) {
    productsWithPatterns = await seedProducts(brandMap);
  }

  if (flags.all || flags.usersOnly) {
    userIds = await seedUsers();
  }

  if (flags.all || flags.votesOnly) {
    await seedVotes(productsWithPatterns, userIds);
  }

  // Summary
  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.log("\n" + "─".repeat(50));

  if (flags.all) {
    const counts = await Promise.all([
      prisma.category.count(),
      prisma.brand.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.vote.count(),
    ]);
    console.log(`📊 Database totals:`);
    console.log(`   Categories: ${counts[0]}`);
    console.log(`   Brands:     ${counts[1]}`);
    console.log(`   Products:   ${counts[2]}`);
    console.log(`   Users:      ${counts[3]}`);
    console.log(`   Votes:      ${counts[4]}`);
  }

  console.log(`\n✅ Seed complete in ${elapsed}s`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
