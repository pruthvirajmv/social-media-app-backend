const express = require("express");
const router = express.Router();

const {
   loadSelectedUserPosts,
   loadUserPosts,
   addNewPost,
   deletePost,
   toggleLike,
   addComment,
} = require("../controllers/post.controller");
const { authentication } = require("../middlewares/authentication.middleware");

router.route("/:username").get(loadSelectedUserPosts);

router.use(authentication);

router.route("/").get(loadUserPosts);

router.route("/add").post(addNewPost);

router.route("/delete").post(deletePost);

router.route("/like").post(toggleLike);

router.route("/comment").post(addComment);

module.exports = router;
