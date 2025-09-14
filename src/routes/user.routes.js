import express from "express";
import { loginUser, registerUser,logoutUser,getUserChannelProfile,getChannelVideos,getSidebarLatestSubscriptions, getSubscribedNotifications, searchWatchHistory, removeVideoFromWatchHistory,changeAvatarImage, changeCoverImage,changeAccountDetails, changeUserPassword, getWatchHistory,getCurrentUser, getAllNotification, checkUserByEmail} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import {verifyJsonWebToken} from "../middlewares/auth.middleware.js"

const userRoute = express.Router();


userRoute.route("/register").post(upload.fields(
                    [
                        {
                            name:"avatar",
                            maxCount:1
                        },
                        {
                            name:"coverImage",
                            maxCount:1
                        }
                    ]
                ),registerUser);

userRoute.route("/login").post(upload.none(),loginUser);
// Secured Routes

userRoute.route("/logout").get(upload.none(),verifyJsonWebToken,logoutUser);
userRoute.route("/checkUserByEmail").post(upload.none(),checkUserByEmail);

userRoute.route("/channel/:username").get(getUserChannelProfile);
userRoute.route("/change-avatar").patch(verifyJsonWebToken,upload.single("avatar"),changeAvatarImage);
userRoute.route("/change-coverImage").patch(verifyJsonWebToken,upload.single("coverImage"),changeCoverImage);
userRoute.route("/change-account-details").patch(verifyJsonWebToken,upload.none(),changeAccountDetails);
userRoute.route("/change-password").patch(verifyJsonWebToken,upload.none(),changeUserPassword);
userRoute.route("/watch-hisory").get(verifyJsonWebToken,getWatchHistory);
userRoute.route("/current-user").get(verifyJsonWebToken,getCurrentUser);
userRoute.route("/my-notification").post(verifyJsonWebToken,upload.none(),getAllNotification);
userRoute.route("/remove-video-from-watch-history/:videoId").get(verifyJsonWebToken,removeVideoFromWatchHistory)
userRoute.route("/search-history").get(verifyJsonWebToken,searchWatchHistory)
userRoute.route("/latest-notifications").get(verifyJsonWebToken,getSubscribedNotifications);
userRoute.route("/channel-videos/:username").get(getChannelVideos);
userRoute.route("/sidebar-notifications").get(verifyJsonWebToken,getSidebarLatestSubscriptions);


export default userRoute;



