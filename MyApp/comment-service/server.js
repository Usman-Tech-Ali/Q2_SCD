// --- Imports ---
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/mycomment", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { Schema } = mongoose;

const commentSchema = new Schema({
  blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model("Comment", commentSchema);

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

const addComment = async (req, res) => {
  const { blogId, content } = req.body;

  try {
    const comment = new Comment({
      blogId,
      content,
      author: req.userId,
    });

    await comment.save();
    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId }).populate(
      "author",
      "username"
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error });
  }
};

app.post("/comments", authMiddleware, addComment);
app.get("/comments/:blogId", getComments);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
