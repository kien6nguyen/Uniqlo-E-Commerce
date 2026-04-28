const mongoose = require("mongoose");
require("dotenv").config();

const productSeed = require("./productSeed");
const userSeed = require("./userSeed");
const discountSeed = require("./discountSeed");
const orderSeed = require("./orderSeed");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";

async function runSeed() {
  try {
    console.log("Starting database seeding process...");

    console.log("\n--- 1. SEEDING PRODUCTS ---");
    await productSeed();

    console.log("\n--- 2. SEEDING USERS ---");
    await userSeed();

    console.log("\n--- 3. SEEDING DISCOUNTS ---");
    await discountSeed();

    console.log("\n--- 4. SEEDING ORDERS ---");
    await orderSeed();

    console.log("\n ALL SEEDS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("Seed Master Error:", error);
    throw error;
  }
}

if (require.main === module) {
  (async () => {
    try {
      console.log("Connecting to MongoDB for manual seeding...");
      await mongoose.connect(MONGO_URI);
      console.log("MongoDB Connected!");
      await runSeed();
      console.log("Seeding finished, exiting...");
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = runSeed;