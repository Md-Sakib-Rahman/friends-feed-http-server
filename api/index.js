const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB(); 
    
    return app(req, res); 
  } catch (error) {
    console.error("Vercel Entry Error:", error);
    res.status(500).json({ message: "Database Connection Failed", error: error.message });
  }
};