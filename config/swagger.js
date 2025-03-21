const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Cyprus Classified API',
            version: '1.0.0',
            description: 'API documentation for Cyprus Classified platform'
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: process.env.NODE_ENV
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;