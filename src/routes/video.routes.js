import express from "express";
import { watchVideo,
        getAllVideos,
        publishAVideo,
        deleteVideo,
        updateVideo,
        updateVideoView,
        relatedVideos
        } from "../controllers/video.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJsonWebToken,checkUserIsLoggedIn } from "../middlewares/auth.middleware.js";
const videoRouter = express.Router();


videoRouter.route("/video/:v").get(checkUserIsLoggedIn,watchVideo);
videoRouter.route("/videos").get(getAllVideos);
videoRouter.route("/relatedVideos").get(relatedVideos);
// scured routes
videoRouter.route("/update-video").post(verifyJsonWebToken,upload.single("thumbnail"),updateVideo)
videoRouter.route("/publish-video").post(verifyJsonWebToken,upload.fields([{name:"videoFile",maxCount:1},{name:"thumbnail",maxCount:1}]),publishAVideo);
videoRouter.route("/delete-video/:videoId").delete(verifyJsonWebToken,deleteVideo);


export default videoRouter;