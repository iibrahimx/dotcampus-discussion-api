const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "DotCampus Discussion API",
    version: "1.0.0",
    description:
      "Secure discussion platform API for Dot Campus learning community. Includes auth, roles, discussions, and comments.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/**/*.js"], // reads JSDoc comments in your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
