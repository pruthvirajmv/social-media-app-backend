const express = require("express");
const router = express.Router();

const {
   getUsersProfile,

   addNewUser,
   loginUser,
   resetOrUpdateUserPassword,
   getUserProfile,
   updateUserProfile,

   toggleUserFromFollowing,

   togglePostFromBookmarks,
} = require("../controllers/user.controller");

const { authentication } = require("../middlewares/authentication.middleware");

router.route("/").get(getUsersProfile);

router.route("/profile").get(authentication, getUserProfile);
router.route("/updateprofile").post(authentication, updateUserProfile);

router.route("/signup").post(addNewUser);
router.route("/login").post(loginUser);

router.route("/resetpassword").post(resetOrUpdateUserPassword);

router.route("/bookmark").post(authentication, togglePostFromBookmarks);
router.route("/follow").post(authentication, toggleUserFromFollowing);

module.exports = router;
