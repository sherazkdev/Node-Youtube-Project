import express from "express";
import upload from "../middlewares/multer.middleware.js"
import { checkUserIsLoggedIn, verifyJsonWebToken } from "../middlewares/auth.middleware.js";
import {
            getVideoComments,
            addComment,
            replyComment,
            deleteComment,
            editComment,
            getCommentReplies
        } from "../controllers/comment.contoller.js";
import commentModel from "../models/comment.modle.js";

const commentRouter = express.Router();




commentRouter.route("/video/:videoId").get(getVideoComments);
commentRouter.route("/add-comment").post(verifyJsonWebToken,upload.none(),addComment);
commentRouter.route("/reply-comment").patch(verifyJsonWebToken,replyComment);
commentRouter.route("/delete-comment/:commentId").delete(verifyJsonWebToken,deleteComment);
commentRouter.route("/edit-comment").patch(verifyJsonWebToken,editComment);
commentRouter.route("/comment-replies").get(getCommentReplies);





export default commentRouter;