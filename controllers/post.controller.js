const { Post } = require("../models/post.model");
const { User } = require("../models/user.model");

const loadSelectedUserPosts = async (req, res) => {
   try {
      const { username } = req.params;
      const user = await User.findOne({ userName: username });
      const userPosts = await Post.find({ author: user._id })
         .populate({
            path: "author",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "likedBy.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "comments.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .exec();

      res.status(200).json({ message: "user posts loaded", userPosts });
   } catch (error) {
      res.status(500).json({
         message: "could not load user posts",
         errorMessage: error.message,
      });
   }
};
const loadUserPosts = async (req, res) => {
   try {
      const { user } = req;
      let userPosts = await Post.find({})
         .populate({
            path: "author",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "likedBy.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "comments.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .exec();

      res.status(200).json({ message: "user posts loaded", userPosts });
   } catch (error) {
      res.status(500).json({
         message: "could not load user posts",
         errorMessage: error.message,
      });
   }
};

const addNewPost = async (req, res) => {
   try {
      const { user } = req;

      let { addPost } = req.body;
      addPost.author = user._id;
      addPost.createdOn = Date.now();

      let newPost = new Post(addPost);
      await newPost.save();
      newPost = await newPost
         .populate({
            path: "likedBy.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "comments.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      res.status(200).json({ message: "new post added", newPost });
   } catch (error) {
      console.log(error);
      res.status(500).json({
         message: "could not add post",
         errorMessage: error.message,
      });
   }
};

const deletePost = async (req, res) => {
   try {
      let { postId } = req.body;

      const deletedPost = await Post.findByIdAndDelete(postId);

      res.status(200).json({ message: "post deleted", postId });
   } catch (error) {
      res.status(500).json({
         message: "could not delete post",
         errorMessage: error.message,
      });
   }
};

const toggleLike = async (req, res) => {
   try {
      const { user } = req;

      let { postId } = req.body;

      let likedPost = await Post.findById(postId);
      const isLiked = likedPost.likedBy.find(
         (likedUser) => likedUser.user.toString() === user._id.toString()
      );
      if (isLiked) {
         likedPost.likedBy = likedPost.likedBy.filter(
            (likedUser) => likedUser.user.toString() !== user._id.toString()
         );
      } else {
         likedPost.likedBy.push({ user: user._id });
      }

      await likedPost.save();

      likedPost = await likedPost
         .populate({
            path: "likedBy.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      res.status(200).json({ message: "post liked", likedPost });
   } catch (error) {
      res.status(500).json({
         message: "could not like the post",
         errorMessage: error.message,
      });
   }
};

const addComment = async (req, res) => {
   try {
      const { user } = req;

      let { postId, comment } = req.body;

      let commentedPost = await Post.findById(postId);
      commentedPost.comments.push({ user: user._id, comment });

      await commentedPost.save();

      commentedPost = await commentedPost
         .populate({
            path: "comments.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      res.status(200).json({ message: "post liked", commentedPost });
   } catch (error) {
      res.status(500).json({
         message: "could not like the post",
         errorMessage: error.message,
      });
   }
};

module.exports = {
   loadSelectedUserPosts,
   loadUserPosts,
   addNewPost,
   deletePost,
   toggleLike,
   addComment,
};
