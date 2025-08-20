import express from "express"
import {verifyJsonWebToken} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js"
import { getLikedVideos,toggleLikeVideo,toggleLikeComment } from "../controllers/like.controller.js";

// Constents
const likeRouter = express.Router();

likeRouter.route("/likedVideos").post(verifyJsonWebToken,upload.none(),getLikedVideos)
likeRouter.route("/likeVideo").patch(verifyJsonWebToken,upload.none(),toggleLikeVideo);
likeRouter.route("/likeComment").post(verifyJsonWebToken,upload.none(),toggleLikeComment)


export default likeRouter;