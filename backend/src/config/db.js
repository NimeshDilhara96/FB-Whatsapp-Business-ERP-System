import mongoose from "mongoose";
import logger from "../utils/logger.js";

export let hasTransactionSupport = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("MongoDB Connected Successfully");

    // Detect if the cluster supports transactions (Replica Set / Sharded)
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      // Dummy operation to trigger the topology check
      await mongoose.connection.db.collection('system.version').findOne({}, { session });
      hasTransactionSupport = true;
      await session.abortTransaction();
      logger.info("MongoDB Transactions are SUPPORTED");
    } catch (err) {
      hasTransactionSupport = false;
      logger.warn("MongoDB Transactions are NOT supported (Local standalone). Using fallback mode.");
    } finally {
      session.endSession();
    }

  } catch (error) {
    logger.error({ err: error }, "DB Connection Error");
    process.exit(1);
  }
};

export default connectDB;