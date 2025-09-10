import express from "express";
import { verifyJsonWebToken } from "../middlewares/auth.middleware.js";
import {createPlaylist,
        removePlaylist,
        updatePlaylist,
        removeVideoFromPlaylist,
        addVideoToPlaylist,
        getWatchLaterPlaylist,
        getUserPlaylists,
        getLikeVideosPlaylist,
        getPlaylistById} from "../controllers/playlist.controller.js";
// Middlewares

const playlistRouter = express.Router();


playlistRouter.route("/create-playlist").post(verifyJsonWebToken,createPlaylist);
playlistRouter.route("/remove-playlist/:playlistId").delete(removePlaylist);
playlistRouter.route("/update-playlist").patch(updatePlaylist);
playlistRouter.route("/remove-video-from-playlist/:playlistId/:videoId").patch(removeVideoFromPlaylist);
playlistRouter.route("/add-video-to-playlist/:playlistId/:videoId").patch(addVideoToPlaylist);
playlistRouter.route("/my-playlists").get(getUserPlaylists);
playlistRouter.route("/get-watch-later-playlist").get(verifyJsonWebToken,getWatchLaterPlaylist);
playlistRouter.route("/get-liked-videos-playlist").get(verifyJsonWebToken,getLikeVideosPlaylist);
playlistRouter.route("/playlist/:playlistId").get(getPlaylistById);




export default playlistRouter;