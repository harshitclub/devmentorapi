// ==============================================================================
// VERCEL SERVERLESS ENTRY POINT (backend/api/index.js)
// ==============================================================================
// When hosting on Vercel, Vercel automatically treats any file inside the /api
// folder as a Serverless Function.
//
// This file imports our Express app from index.js and exports it directly so Vercel
// can handle incoming HTTP requests on demand without a persistent server process.
// ==============================================================================

const app = require("../index.js");

// Export the Express app for Vercel Serverless
module.exports = app;
