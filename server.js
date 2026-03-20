const app = require('./src/app');
const connectDB = require('./src/config/db');
 
const PORT = process.env.PORT || 8080;
connectDB();


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
