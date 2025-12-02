import mongoose from "mongoose";
import { User } from "../db/models/index.js";

const MONGODB_URI = process.env.MONGODB_URI!;

async function createTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const testPassword = "Test@123";

    // Delete existing test accounts to recreate with correct password
    await User.deleteOne({ email: "admin@grandhorizon.com" });
    await User.deleteOne({ email: "manager@grandhorizon.com" });
    await User.deleteOne({ email: "guest@grandhorizon.com" });

    // Admin account - password will be hashed by pre-save hook
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@grandhorizon.com",
      password: testPassword,
      role: "admin"
    });
    console.log(`Created admin: ${admin.email}`);

    // Manager account
    const manager = await User.create({
      firstName: "Manager",
      lastName: "User",
      email: "manager@grandhorizon.com",
      password: testPassword,
      role: "manager"
    });
    console.log(`Created manager: ${manager.email}`);

    // Customer account
    const customer = await User.create({
      firstName: "Guest",
      lastName: "User",
      email: "guest@grandhorizon.com",
      password: testPassword,
      role: "customer"
    });
    console.log(`Created customer: ${customer.email}`);

    console.log("\n========================================");
    console.log("Test accounts created successfully!");
    console.log("========================================");
    console.log("\nAll accounts use password: Test@123");
    console.log("\nAdmin:    admin@grandhorizon.com");
    console.log("Manager:  manager@grandhorizon.com");
    console.log("Customer: guest@grandhorizon.com");
    console.log("========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestUsers();
