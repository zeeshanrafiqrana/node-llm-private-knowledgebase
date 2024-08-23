import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';
import dbConnect from './db/singleStore.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    await dbConnect();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    app.on('error', (error) => {
      console.log('Error: ', error);
      throw error;
    });
  } catch (error) {
    console.log('MongoDB Connection failed !!!: ', error);
  }
};

startServer();
