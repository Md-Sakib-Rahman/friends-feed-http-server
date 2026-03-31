const { z } = require('zod');

const postSchema = z.object({
  content: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
}).refine((data) => data.content || data.image, {
  message: "Post must contain either text content or an image",
  path: ["content"],  
});;

module.exports = { postSchema };  