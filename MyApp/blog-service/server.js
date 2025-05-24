const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/myblog", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("Connected to MongoDB"));

const blogSchema = new Schema({
  title: String,
  content: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
const Blog = mongoose.model("Blog", blogSchema);

const viewSchema = new Schema({
  blogId: { type: Schema.Types.ObjectId, ref: "Blog" },
  views: { type: Number, default: 0 },
});
const View = mongoose.model("View", viewSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    bio: String,
    avatar: String,
  },
});
const User = mongoose.model("User", userSchema);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

const createBlog = async (req, res) => {
  const { title, content } = req.body;

  try {
    const blog = new Blog({ title, content, author: req.userId });
    await blog.save();

    const blogView = new View({ blogId: blog._id });
    await blogView.save();

    res.status(201).json({ message: "Blog created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating blog", error });
  }
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "username");
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error });
  }
};

const incrementViews = async (req, res) => {
  const { blogId } = req.params;

  try {
    let view = await View.findOne({ blogId });

    if (view) {
      view.views++;
      await view.save();
    } else {
      view = new View({ blogId, views: 1 });
      await view.save();
    }

    res.status(200).json({ message: "View count incremented" });
  } catch (error) {
    res.status(500).json({ message: "Error incrementing views", error });
  }
};

app.post("/blogs", authMiddleware, createBlog);
app.get("/blogs", getBlogs);

app.post("/blogs/view/:blogId", incrementViews);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
