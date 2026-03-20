const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  username: z.string().min(3, "Username must be at least 3 chars").lowercase(),
  email: z.string()
    .min(1, "Email is required") 
    .pipe(z.email("Invalid email format")),
  password: z.string().min(6, "Password must be at least 6 chars"),
  profilePicture: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .pipe(z.email("Invalid email format")),

  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 chars"),
});

module.exports = { registerSchema, loginSchema };