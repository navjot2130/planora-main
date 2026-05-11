const { z } = require('zod');

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  category: z.string().min(1).max(50).default('Work'),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  completed: z.boolean().optional().default(false)
});

module.exports = { taskSchema };

