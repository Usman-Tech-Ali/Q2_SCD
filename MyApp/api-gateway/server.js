const express = require("express");

const httpProxy = require("express-http-proxy");

const app = express();

const blogServiceProxy = httpProxy("http://localhost:3001");
const commentServiceProxy = httpProxy("http://localhost:3002");
const profileServiceProxy = httpProxy("http://localhost:3003");
const authServiceProxy = httpProxy("http://localhost:3004");

app.use(express.json());

app.use("/blog", (req, res, next) => {
  blogServiceProxy(req, res, next);
});

app.use("/comment", (req, res, next) => {
  commentServiceProxy(req, res, next);
});

app.use("/profile", (req, res, next) => {
  profileServiceProxy(req, res, next);
});

app.use("/auth", (req, res, next) => {
  authServiceProxy(req, res, next);
});
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
