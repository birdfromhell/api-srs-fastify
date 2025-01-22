const fastify = require('fastify')({ logger: true });
const mysql = require('mysql2/promise');

// Database connection configuration
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Define route schemas
const healthSchema = {
  schema: {
    tags: ['health'],
    summary: 'Health check endpoint',
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          status: { type: 'string' }
        }
      }
    }
  }
};

const dbHealthSchema = {
  schema: {
    tags: ['health'],
    summary: 'Database connection check endpoint',
    response: {
      200: {
        description: 'Database connection status',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }
};

const usersSchema = {
  schema: {
    tags: ['users'],
    summary: 'Get all users',
    response: {
      200: {
        description: 'List of users',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            username: { type: 'string' }
          }
        }
      }
    }
  }
};

const imagesSchema = {
  schema: {
    tags: ['images'],
    summary: 'Get all images',
    response: {
      200: {
        description: 'List of images',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            image_url: { type: 'string' },
            orientation: { type: 'string' },
            user_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

const faqsSchema = {
  schema: {
    tags: ['faqs'],
    summary: 'Get all FAQs with categories',
    response: {
      200: {
        description: 'List of FAQs with categories',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            text: { type: 'string' },
            category_id: { type: 'integer' },
            category_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

const menuItemsSchema = {
  schema: {
    tags: ['menu'],
    summary: 'Get all menu items with categories',
    response: {
      200: {
        description: 'List of menu items with categories',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            price: { type: 'number' },
            currency: { type: 'string' },
            rating: { type: 'integer' },
            text: { type: 'string' },
            image_url: { type: 'string' },
            badge: { type: 'string' },
            category_id: { type: 'integer' },
            category_name: { type: 'string' }
          }
        }
      }
    }
  }
};

const reviewsSchema = {
  schema: {
    tags: ['reviews'],
    summary: 'Get all reviews',
    response: {
      200: {
        description: 'List of reviews',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            name: { type: 'string' },
            rating: { type: 'integer' },
            image: { type: 'string' },
            text: { type: 'string' }
          }
        }
      }
    }
  }
};

const menuCategoriesSchema = {
  schema: {
    tags: ['menu'],
    summary: 'Get all menu categories',
    response: {
      200: {
        description: 'List of menu categories',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    }
  }
};

// Register Swagger
fastify.register(require('@fastify/swagger'), {
  openapi: {
    info: {
      title: 'Selerara Dashboard API',
      description: 'API documentation for Selerara Dashboard',
      version: '1.0.0'
    },
    servers: [{
      url: 'http://localhost:3000'
    }],
    tags: [
      { name: 'health', description: 'Health check endpoints' },
      { name: 'users', description: 'User endpoints' },
      { name: 'images', description: 'Image endpoints' },
      { name: 'faqs', description: 'FAQ endpoints' },
      { name: 'menu', description: 'Menu related endpoints' },
      { name: 'reviews', description: 'Review endpoints' }
    ]
  }
});

// Register Swagger UI
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  staticCSP: true
});

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Routes
fastify.get('/health', healthSchema, async () => {
  return { status: 'OK' };
});

fastify.get('/db-health', dbHealthSchema, async (request, reply) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { status: 'OK', message: 'Database connection is successful' };
  } catch (error) {
    reply.code(500).send({ status: 'ERROR', message: error.message });
  }
});

fastify.get('/users', usersSchema, async (request, reply) => {
  try {
    const [rows] = await pool.query('SELECT id, email, username FROM user');
    return rows;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

fastify.get('/images', imagesSchema, async (request, reply) => {
  try {
    const [rows] = await pool.query('SELECT * FROM image');
    return rows;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

fastify.get('/faqs', faqsSchema, async (request, reply) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, c.name as category_name 
      FROM faq f 
      JOIN category_faq c ON f.category_id = c.id
    `);
    return rows;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

fastify.get('/menu-items', menuItemsSchema, async (request, reply) => {
  try {