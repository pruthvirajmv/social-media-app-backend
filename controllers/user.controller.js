const { User } = require("../models/user.model");

var jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_KEY = process.env.JWT_KEY;
var bcrypt = require("bcrypt");

const { extend } = require("lodash");

const addNewUser = async (req, res) => {
   try {
      const { addUser } = req.body;
      addUser.fullName = `${addUser.firstName} ${addUser.lastName}`;
      addUser.profilePicName = (addUser.firstName[0] + (addUser?.lastName[0] || "")).toUpperCase();
      const NewUser = new User(addUser);
      const salt = await bcrypt.genSalt(10);
      NewUser.password = await bcrypt.hash(NewUser.password, salt);
      await NewUser.save();

      NewUser.__v = undefined;
      NewUser.password = undefined;

      res.status(200).json({ message: "user added", NewUser });
   } catch (error) {
      if (error.name === "MongoError" && error.code === 11000) {
         if (error.keyPattern.userName) {
            return res.status(422).json({
               message: "user name is already taken",
               errorMessage: error.message,
            });
         } else if (error.keyPattern.email) {
            return res.status(422).json({
               message: "account already exists with this email",
               errorMessage: error.message,
            });
         }
      }
      res.status(500).json({
         message: "could not add user",
         errorMessage: error.message,
      });
   }
};

const loginUser = async (req, res) => {
   try {
      const { email, password } = req.body;

      let user = await User.findOne({ email: email });

      if (user) {
         const verifyPassword = await bcrypt.compare(password, user.password);
         if (verifyPassword) {
            const token = jwt.sign({ userId: user._id }, JWT_KEY, { expiresIn: "24h" });
            user.token = token;
            await user.save();
            user.__v = undefined;
            user.password = undefined;
            return res.status(200).json({ message: "user logged in", user });
         }
         return res.status(403).json({ message: "email and password did not match" });
      }
      res.status(404).json({ message: "user does not exist " });
   } catch (error) {
      res.status(500).json({
         message: "cannot retrieve user",
         errorMessage: error.message,
      });
   }
};

const resetOrUpdateUserPassword = async (req, res) => {
   try {
      const { email, password } = req.body;
      const updateUserPassword = { password: password };
      let user = await User.findOne({ email: email });

      if (!user) {
         return res.status(404).json({ message: "user does not exist" });
      }
      user = extend(user, updateUserPassword);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user = await user.save();
      res.status(200).json({ message: "user credentials updated", user });
   } catch (error) {
      res.status(500).json({
         message: "cannot retrieve user",
         errorMessage: error.message,
      });
   }
};

const getUsersProfile = async (req, res) => {
   try {
      let users = await User.find({}, "userName fullName profilePic profilePicName")
         .populate({
            path: "followers.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .populate({
            path: "following.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .exec();

      res.status(200).json({ users });
   } catch (error) {
      res.status(500).json({
         message: "cannot retrieve users details",
         errorMessage: error.message,
      });
   }
};

const getUserProfile = async (req, res) => {
   try {
      let { user } = req;
      user.password = undefined;
      user.__v = undefined;

      user = await user
         .populate({
            path: "followers.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      user = await user
         .populate({
            path: "following.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      user = await user.populate("bookmarks.post").execPopulate();

      user.bookmarks = user.bookmarks.filter(({ post }) => !post.isRemoved);

      user.notifications = user.notifications.filter(({ isRead }) => !isRead);

      res.status(200).json({ user });
   } catch (error) {
      res.status(500).json({
         message: "cannot retrieve user details",
         errorMessage: error.message,
      });
   }
};

const updateUserProfile = async (req, res) => {
   try {
      let { user } = req;
      const { updateUser } = req.body;
      user = extend(user, updateUser);
      user = await user.save();
      user.__v = undefined;
      user.password = undefined;
      user = await user
         .populate({
            path: "followers.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      user = await user
         .populate({
            path: "following.user",
            select: "_id userName fullName profilePicName profilePic ",
         })
         .execPopulate();

      user = await user.populate("bookmarks.post").execPopulate();

      user.bookmarks = user.bookmarks.filter(({ post }) => !post.isRemoved);

      res.status(200).json({ message: "user profile updated", user });
   } catch (error) {
      res.status(500).json({
         message: "something went wrong, please try again",
         errorMessage: error.message,
      });
   }
};

const togglePostFromBookmarks = async (req, res) => {
   try {
      let { user } = req;
      const { postId } = req.body;
      const isBookmarked = user.bookmarks.find((bookmark) => bookmark.post.toString() === postId);
      if (!isBookmarked) {
         user.bookmarks.push({ post: postId });
         await user.save();
         user = await user.populate("bookmarks.post").execPopulate();
         res.status(200).json({ message: "post bookmarked", bookmarks: user.bookmarks });
      } else {
         user.bookmarks = user.bookmarks.filter((bookmark) => bookmark.post.toString() !== postId);
         await user.save();
         user = await user.populate("bookmarks.post").execPopulate();

         res.status(200).json({ message: "post removed from bookmark", bookmarks: user.bookmarks });
      }
   } catch (error) {
      res.status(500).json({
         message: "something went wrong, please try again",
         errorMessage: error.message,
      });
   }
};

const toggleUserFromFollowing = async (req, res) => {
   try {
      let { user } = req;
      const { userId } = req.body;
      let toggleFollowersOfUser = await User.findById(userId);
      const isFollowing = user.following.findIndex(
         (following) => following.user.toString() === userId
      );
      if (isFollowing >= 0) {
         user.following = user.following.filter(
            (following) => following.user.toString() !== userId
         );
         toggleFollowersOfUser.followers = toggleFollowersOfUser.followers.filter(
            (follower) => follower.user.toString() !== user._id.toString()
         );
         toggleFollowersOfUser.notifications = toggleFollowersOfUser.notifications.filter(
            ({ notificationType, activityByUser }) =>
               !(
                  notificationType === "FOLLOWED" &&
                  activityByUser.toString() === user._id.toString()
               )
         );
         await user.save();
         await toggleFollowersOfUser.save();

         user = await user
            .populate({
               path: "following.user",
               select: "_id userName fullName profilePicName profilePic ",
            })
            .execPopulate();

         res.status(200).json({
            message: "user removed from following list",
            following: user.following,
         });
      } else {
         user.following.push({ user: userId });
         toggleFollowersOfUser.followers.push({ user: user._id });
         const setNotification = {
            notificationType: "FOLLOWED",
            activityByUser: user._id,
            notify: "started to follow you",
            isRead: false,
            createdOn: Date.now(),
         };
         toggleFollowersOfUser.notifications.push(setNotification);
         await user.save();
         await toggleFollowersOfUser.save();

         user = await user
            .populate({
               path: "following.user",
               select: "_id userName fullName profilePicName profilePic ",
            })
            .execPopulate();
         res.status(200).json({
            message: "user added to following list",
            following: user.following,
         });
      }
   } catch (error) {
      res.status(500).json({
         message: "something went wrong, please try again",
         errorMessage: error.message,
      });
   }
};

const readNotification = (req, res) => {
   try {
      let { user } = req;
      const { notificationId } = req.body;
      user.notifications = user.notifications.map((notification) => {
         if (notification._id.toString() === notificationId) {
            notification.isRead = true;
         }
         return notification;
      });
      user.save();
      user.notifications = user.notifications.filter(({ isRead }) => !isRead);
      res.status(200).json({
         message: "notification read",
         notifications: user.notifications,
      });
   } catch (error) {
      res.status(500).json({
         message: "something went wrong, please try again",
         errorMessage: error.message,
      });
   }
};
const clearNotifications = (req, res) => {
   try {
      let { user } = req;
      user.notifications = user.notifications.map((notification) => {
         notification.isRead = true;
         return notification;
      });
      user.save();
      res.status(200).json({
         message: "notifications cleared",
         notifications: user.notifications,
      });
   } catch (error) {
      res.status(500).json({
         message: "something went wrong, please try again",
         errorMessage: error.message,
      });
   }
};

module.exports = {
   getUsersProfile,

   addNewUser,
   loginUser,
   resetOrUpdateUserPassword,
   getUserProfile,
   updateUserProfile,

   toggleUserFromFollowing,
   togglePostFromBookmarks,

   readNotification,
   clearNotifications,
};
