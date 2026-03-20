const mongoose = require('mongoose');

let isConnected = false; // Track connection state

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  if (isConnected) {
    console.log('=> Using existing database connection');
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error; 
  }
};

module.exports = connectDB;