import dbConnect from "../db/singleStore.js";
import { ApiError } from "../utils/ApiError.js";

export const dbMiddleware = async (req, res, next) => {
  try {
    const connection = await dbConnect();
    req.singleStoreConnection = connection;
    next();
  } catch (error) {
    next(new ApiError(500, 'Database connection failed'));
  }
};
