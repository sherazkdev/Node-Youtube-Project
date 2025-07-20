import express from "express";
import { verifyJsonWebToken } from "../middlewares/auth.middleware.js";
import {createPlaylist,
        removePlaylist,
        updatePlaylist,
        removeVideoFromPlaylist,
        addVideoToPlaylist,
        getUserPlaylists,
        getPlaylistById} from "../controllers/playlist.controller.js";

const playlistRouter = express.Router();

playlistRouter.use(verifyJsonWebToken);

playlistRouter.route("/create-playlist").post(createPlaylist);
playlistRouter.route("/remove-playlist/:playlistId").delete(removePlaylist);
playlistRouter.route("/update-playlist").patch(updatePlaylist);
playlistRouter.route("/remove-video-from-playlist/:playlistId/:videoId").get(removeVideoFromPlaylist);
playlistRouter.route("/add-video-to-playlist/:playlistId/:videoId").patch(addVideoToPlaylist);
playlistRouter.route("/my-playlists").get(getUserPlaylists);
playlistRouter.route("/playlist/:playlistId").get(getPlaylistById);




export default playlistRouter;