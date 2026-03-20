const { z } = require('zod');

const postSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty").max(2000),
  image: z.string().url().optional().or(z.literal("")),
});

module.exports = { postSchema };  