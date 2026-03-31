const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
 

const app = express();

// Middleware
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:5173",
//   credentials: true
// }));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint 
app.get("/", (req, res) => {
  res.send("Friends Feed API is Running... 🚀");
});
// Routes
app.use('/api/auth', authRoutes);  // Login, Register, Refresh, Logout
app.use('/api/posts', postRoutes); // Feed, Create/Edit/Delete, Likes, Comments
app.use('/api/users', userRoutes); // Search, Friend Requests, Pending List
app.use('/api/notifications', notificationRoutes); 
app.use('/api/messages', messageRoutes);
// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

module.exports = app;