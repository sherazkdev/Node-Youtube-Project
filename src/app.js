import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
const app = express();

// MiddleWarse
app.use( express.json() );
app.use( express.urlencoded( { extended : true } ) );
app.use( cookieParser() );
app.use( (req,res,next) => {
  res.setTimeout( 1200000, () => {
    const err = new Error( "Request has timed out." );
    err.status = 408;
    next( err );
  });
  next();
})
app.use(cors({
    origin: process?.env?.CORS_ORIGIN || "https://youtube-streaming-frontend.netlify.app", // React app origin
    credentials: true
  }));

// Declearation Routes
import userRoutes from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js"
import errorHandler from "./middlewares/errorHandler.js";
import {checkUserIsLoggedIn} from "./middlewares/auth.middleware.js";

// Middlewares

app.use(checkUserIsLoggedIn);

// routes
app.use("/api/v1/users",userRoutes);
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/playlists",playlistRouter);

// error Handler
app.use(errorHandler); 

export default app;
