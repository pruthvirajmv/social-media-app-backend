const mongoose = require("mongoose");
require("mongoose-type-url");

const PostSchema = new mongoose.Schema(
   {
      caption: { type: String },

      content: { type: String, maxLength: [200, "Description is long"] },

      media: { type: mongoose.SchemaTypes.Url },

      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      likedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],

      comments: [
         { user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, comment: { type: String } },
      ],

      createdOn: { type: String },
   },
   {
      timestamps: true,
   }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = {
   Post,
};
