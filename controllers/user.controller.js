const { User } = require("../models/user.model");

var jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_KEY = process.env.JWT_KEY;
var bcrypt = require("bcrypt");

const { extend } = require("lodash");

const addNewUser = async (req, res) => {
   try {
      const { username, email, password } = req.body;
      const user = { userName: username, email: email, password: password };
      const NewUser = new User(user);
      const salt = await bcrypt.genSalt(10);
      NewUser.password = await bcrypt.hash(NewUser.password, salt);
      await NewUser.save();

      NewUser.__v = undefined;
      NewUser.password = undefined;

      res.status(200).json({ message: "user added", NewUser });
   } catch (error) {
      console.log(error);
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
      const { username, password } = req.body;

      let user = await User.findOne({ userName: username });

      if (user) {
         const verifyPassword = await bcrypt.compare(password, user.password);
         if (verifyPassword) {
            const token = jwt.sign({ userId: user._id }, JWT_KEY, { expiresIn: "24h" });
            user.__v = undefined;
            user.password = undefined;
            return res.status(200).json({ message: "user logged in", user, token });
         }
         return res.status(403).json({ message: "username and password did not match" });
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

const getUserProfile = (req, res) => {
   const { user } = req;
   user.__v = undefined;
   res.status(200).json({ user });
};

const updateUserProfile = async (req, res) => {
   try {
      let { user } = req;
      const { password } = req.body;
      const updateUserPassword = { password: password };
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

const attemptedQuizAndSetHighScore = async (req, res) => {
   try {
      let { user } = req;
      const { attemptedLevel, newScore } = req.body;

      let userHighScore = user.highScore.find(({ level }) => level === attemptedLevel);
      if (!userHighScore) {
         user.highScore.push({ level: attemptedLevel, score: newScore, attempts: 1 });
         await user.save();
         return res
            .status(200)
            .json({
               message: "new high score",
               newHighScore: { level: attemptedLevel, score: newScore, attempts: 1 },
            });
      }

      userHighScore.attempts += 1;
      userHighScore.score = newScore > userHighScore.score ? newScore : userHighScore.score;
      await user.save();
      res.status(200).json({ message: "user high score updated", newHighScore: userHighScore });
   } catch (error) {}
};

const getUserHighScores = async (req, res) => {
   try {
      const { user } = req;
      res.status(200).json({ message: "user highscore found", highScores: user.highScore });
   } catch (error) {
      res.status(400).json({ message: "user highscore not found", errorMessage: error.message });
   }
};

module.exports = {
   addNewUser,
   loginUser,
   resetOrUpdateUserPassword,
   getUserProfile,
   updateUserProfile,
   attemptedQuizAndSetHighScore,
   getUserHighScores,
};
