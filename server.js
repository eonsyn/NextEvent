const express = require("express");
const path = require("path");
const adminRoutes = require("./Routes/adminRoutes");
const authRoutes = require("./Routes/authRoute");
const publicRoutes = require("./Routes/publicRoutes");
const superadmin = require("./Routes/superRoutes");
const connectdb = require("./config/dbConeect");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const userRoute = require("./Routes/userRoutes");

const app = express();

//for cors
// var corsOptions = {
//   origin: "http://example.com",
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// };

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

//middleware

app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true, // Allow cookies
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//mongodb connection
connectdb();

//routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/user", userRoute);
app.use("/api/superadmin", superadmin); //done

//server start
app.listen(3000, () => {
  console.log("server is running at 3000");
});
