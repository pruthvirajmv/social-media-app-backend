const mongoose = require("mongoose");
// const { Post } = require("./post.model");
require("mongoose-type-url");

const UserSchema = new mongoose.Schema(
   {
      firstName: {
         type: String,
         required: "First name is required",
      },
      lastName: {
         type: String,
         required: "Last name is required",
      },
      fullName: {
         type: String,
      },
      userName: {
         type: String,
         required: "User name is required",
         unique: true,
      },

      email: {
         type: String,
         required: "email is required",
         unique: true,
         validate: {
            validator: function (value) {
               return /^([^@]+)([@]{1})([a-z]+)\.com$/.test(value);
            },
            message: (props) => `${props.value} is not email!`,
         },
      },

      password: {
         type: String,
         required: "password is required",
      },
      token: { type: String, default: "" },

      profilePic: {
         type: mongoose.SchemaTypes.Url,
         default: "",
      },

      profilePicName: {
         type: String,
      },

      website: { type: String, default: "" },

      bio: { type: String, default: "" },

      following: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],

      followers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],

      bookmarks: [{ post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" } }],

      notifications: [
         {
            notificationType: { type: String, enum: ["LIKED", "FOLLOWED"] },
            activityByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            notify: { type: String },
            likedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
            isRead: { type: Boolean },
            createdOn: { type: Date },
         },
      ],
   },
   {
      timestamps: true,
   }
);

const User = mongoose.model("User", UserSchema);

module.exports = {
   User,
};
