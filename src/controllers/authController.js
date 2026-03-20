const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerSchema, loginSchema } = require("../utils/authValidators");

exports.registerUser = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);
    console.log(validatedData);
    const newUser = new User({
      ...validatedData,
      passwordHash,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.name === "ZodError")
      return res.status(400).json({ errors: error.errors });
    if (error.code === 11000)
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    res.status(500).json({ message: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    if (!email || !password)
      return res.status(400).json({ message: "Invalid Credentials" });
    const user = await User.findOne({ email });
    console.log(email, password);
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    console.log(accessToken);
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        _id: user._id,  
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user?.profilePicture,
        bio: user.bio || "",
        about: user.about || "",  
        friends: user.friends || [],  
      },
    });
  } catch (error) {
    if (error.name === "ZodError")
      return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: "Server Error" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error during logout" });
  }
};
