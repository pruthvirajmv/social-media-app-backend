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

      userPosts = userPosts.filter((post) => !post.isRemoved);

      res.status(200).json({ message: "user posts loaded", userPosts });
   } catch (error) {
      res.status(500).json({
         message: "could not load user posts",
         errorMessage: error.message,
      });
   }
};
const loadAllPosts = async (req, res) => {
   try {
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
         .sort({ createdOn: "desc" });

      userPosts = userPosts.filter((post) => !post.isRemoved);

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

      let newPost = new Post(addPost);
      await newPost.save();
      newPost = await newPost
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
         .execPopulate();

      res.status(200).json({ message: "new post added", newPost });
   } catch (error) {
      res.status(500).json({
         message: "could not add post",
         errorMessage: error.message,
      });
   }
};

const deletePost = async (req, res) => {
   try {
      let { postId } = req.body;

      let deletedPost = await Post.findById(postId);
      deletedPost.isRemoved = true;
      await deletedPost.save();

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
      let notifyPostAuthor = await User.findById(likedPost.author);

      const isLiked = likedPost.likedBy.find(
         (likedUser) => likedUser.user.toString() === user._id.toString()
      );
      if (isLiked) {
         likedPost.likedBy = likedPost.likedBy.filter(
            (likedUser) => likedUser.user.toString() !== user._id.toString()
         );
         notifyPostAuthor.notifications = notifyPostAuthor.notifications.filter(
            ({ notificationType, activityByUser }) =>
               !(notificationType === "LIKED" && activityByUser.toString() === user._id.toString())
         );
      } else {
         likedPost.likedBy.push({ user: user._id });
         const setNotification = {
            notificationType: "LIKED",
            activityByUser: user._id,
            notify: "liked your post",
            likedPost: postId,
            isRead: false,
            createdOn: Date.now(),
         };
         notifyPostAuthor.notifications.push(setNotification);
      }

      await likedPost.save();
      await notifyPostAuthor.save();

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
   loadAllPosts,
   addNewPost,
   deletePost,
   toggleLike,
   addComment,
};
