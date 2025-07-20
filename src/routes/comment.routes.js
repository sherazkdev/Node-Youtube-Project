import express from "express";
import upload from "../middlewares/multer.middleware.js"
import { verifyJsonWebToken } from "../middlewares/auth.middleware.js";
import {
            getVideoComments,
            addComment,
            replyComment,
            deleteComment,
            editComment,
        } from "../controllers/comment.contoller.js";

const commentRouter = express.Router();




commentRouter.route("/video/:videoId").get(getVideoComments);
commentRouter.route("/add-comment").post(verifyJsonWebToken,upload.none(),addComment);
commentRouter.route("/reply-comment").patch(verifyJsonWebToken,replyComment);
commentRouter.route("/delete-comment/:commentId").delete(verifyJsonWebToken,deleteComment);
commentRouter.route("/edit-comment").patch(verifyJsonWebToken,editComment);





export default commentRouter;