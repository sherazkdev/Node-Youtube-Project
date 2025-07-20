import express from "express";
import { getSubscribedChannels,toggleSubscription,getUserChannelSubscribers } from "../controllers/subscription.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJsonWebToken } from "../middlewares/auth.middleware.js";

const subscriptionRouter = express.Router();






// Secured Routes
subscriptionRouter.route("/toggle-subscription/:channelId").get(verifyJsonWebToken,toggleSubscription);
subscriptionRouter.route("/user-channel-subscribers/:channelId").get(verifyJsonWebToken,getUserChannelSubscribers);
subscriptionRouter.route("/user-subscribed-channels/:channelId").get(verifyJsonWebToken,getSubscribedChannels);






export default subscriptionRouter;