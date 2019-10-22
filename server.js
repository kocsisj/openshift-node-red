var http = require('http');
var express = require("express");
var RED = require("node-red");
var path = require("path");
var fs = require("fs");
var when = require("when");

// Create an Express app
var app = express();

// Add a simple route for static content served from 'public'
app.use("/", express.static("public"));

var userDir = process.env.OPENSHIFT_DATA_DIR || path.join(__dirname, ".node-red");
// Ensure userDir exists - something that is normally taken care of by
// localfilesystem storage when running locally
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);

// Create a server
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var settings = {
  httpAdminRoot: "/red",
  httpNodeRoot: "/api",
  userDir: userDir,
  flowFile: "flows.json"
  functionGlobalContext: {}    // enables global context
};

if (!settings.adminAuth) {
  // No user-defined security
  if (process.env.NODE_RED_USERNAME && process.env.NODE_RED_PASSWORD) {
    console.log("Enabling adminAuth using NODE_RED_USERNAME/NODE_RED_PASSWORD");

    settings.adminAuth = {
      type: "credentials",
      users: function (username) {
        if (process.env.NODE_RED_USERNAME == username) {
          return when.resolve({ username: username, permissions: "*" });
        } else {
          return when.resolve(null);
        }
      },
      authenticate: function (username, password) {
        if (process.env.NODE_RED_USERNAME === username && process.env.NODE_RED_PASSWORD === password) {
          return when.resolve({ username: username, permissions: "*" });
        } else {
          return when.resolve(null);
        }
      }
    };
  }
}

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8080);

// Start the runtime
RED.start();