const express = require("express");
require("body-parser");
const app = express();
const cors = require("cors");

const dbConnect = require("./db/db.connect");
const { authentication } = require("./middlewares/authentication.middleware");
const errorHandler = require("./middlewares/error-handler.middleware");
const routeNotFound = require("./middlewares/route-not-found-handler.middleware");

const user = require("./routes/user.route");
const post = require("./routes/post.route");

app.use(express.json());

app.use(cors());

dbConnect();

app.get("/", (req, res) => {
   res.json("Welcome to BaddyBuzz backend!");
});

app.use("/user", user);

app.use("/post", post);

// must stay last
app.use(errorHandler);
app.use(routeNotFound);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
   console.log("Server Started");
});
