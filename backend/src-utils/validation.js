const z = require('zod');

// User validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'AGENT', 'TECH', 'ADMIN']).optional().default('CLIENT'),
  region: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'AGENT', 'TECH', 'ADMIN']).optional(),
  region: z.string().optional()
});

// Ticket validation schemas
const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['ADSL', 'FIBRE', 'MOBILE', 'BILLING', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  region: z.string().optional(),
  contactPhone: z.string().optional()
});

const updateTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  category: z.enum(['ADSL', 'FIBRE', 'MOBILE', 'BILLING', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  region: z.string().optional(),
  contactPhone: z.string().optional(),
  assignedToId: z.number().int().positive().optional()
});

const ticketFilterSchema = z.object({
  status: z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['ADSL', 'FIBRE', 'MOBILE', 'BILLING', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  region: z.string().optional(),
  assignedToId: z.number().int().positive().optional(),
  createdById: z.number().int().positive().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
});

const ticketUpdateSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').optional(),
  newStatus: z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional()
});

const assignTicketSchema = z.object({
  assignedToId: z.number().int().positive('Assigned user ID must be a positive number')
});

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   req.params;
      
      const validatedData = schema.parse(data);
      
      // Replace the request data with validated data
      if (source === 'body') req.body = validatedData;
      else if (source === 'query') req.query = validatedData;
      else req.params = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  createTicketSchema,
  updateTicketSchema,
  ticketFilterSchema,
  ticketUpdateSchema,
  assignTicketSchema,
  validate
};
