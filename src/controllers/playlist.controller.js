import mongoose from "mongoose";
import playlistModel from "../models/playlist.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { isValidObjectId } from "../utils/mongooseObjectId.js";
import userModel from "../models/user.model.js"


const createPlaylist = asyncHandler( async (req,res) => {

    const {title,playlistDescription,videoId,visibility} = req.body;

    
    if ([title, videoId,visibility].some(field => (field?.trim?.() ?? "") === "")) {
        throw new ApiError(404, "title or video ID is missing or empty");
    }

    const playlist = await playlistModel.create({
        videos:videoId,
        name:title,
        visibility:visibility.toUpperCase(),
        description:playlistDescription || "",
        owner:req.user.id
    });

    if(!playlist){
        throw new ApiError(500,"some thing wrong server is busy error from createAPlaylist ");
    }

    return res.json(
        new ApiResponse(playlist,true,"playlist successfully created",200)
    )

} );


const removePlaylist = asyncHandler( async (req,res) => {
    const playlistId = req.params.playlistId;
    if(!playlistId){
        throw new ApiError(404,"playlistId not found");
    }
    const validObjId = await isValidObjectId(playlistId);
    if(validObjId == false){
        throw new ApiError(403,"invalid object id for a playlist ")
    }
    
    const removePlaylist = await playlistModel.findByIdAndDelete(playlistId);
    
    if(!removePlaylist){
        throw new ApiError(500,"playlist removed proccess not successfull")
    }

    return res.json(
        new ApiResponse("",true,"playlist removed Successfully",200)
    )

})

const updatePlaylist = asyncHandler( async (req,res) => {

    const { name, privacy, description, playlistId } = req.body;

    if ([name, privacy,description, playlistId].some(field => (field?.trim?.() ?? "") === "")) {
        throw new ApiError(404, "Playlist name or video ID is missing or empty");
    }
    const validObjId = await isValidObjectId(playlistId);

    if(validObjId == false){
        throw new ApiError(403,"Error: Invalid playlistId Is Required");
    }

    const safeDescription = description?.trim() || null;

    const checkPlaylist = await playlistModel.findOne({_id:new mongoose.Types.ObjectId(playlistId),owner:new mongoose.Types.ObjectId(req.user.id)});

    if(!checkPlaylist){
        throw new ApiError(404,"playlist is not found");
    }

    const updatedPlaylist = await playlistModel.findByIdAndUpdate(checkPlaylist._id,{
        $set : {
            name:name,
            description:safeDescription,
            visibility:privacy,
            owner:new mongoose.Types.ObjectId(req.user.id)
        }
    },{new:true});

    if(!updatedPlaylist){
        throw new ApiError(500,"some thing wrong server is busy error from updateThePlayList");
    }

    return res.json(
        new ApiResponse(updatedPlaylist,true,"playlist updated successfully",200)
    )
} );

const removeVideoFromPlaylist = asyncHandler( async (req,res) => {
    const {playlistId,videoId} = req.params;

    if ([playlistId, videoId].some(field => (field?.trim?.() ?? "") === "")) {
        throw new ApiError(404, "Playlist name or video ID is missing or empty");
    }
    const checkValidObjIdForVideoId = await isValidObjectId(videoId);
    const checkObjIdForPlayListId = await isValidObjectId(playlistId);
    if(checkValidObjIdForVideoId == false || checkObjIdForPlayListId == false){
        throw new ApiError(403,"Error: Invalid mongoose object id Error Location is: removeVideoFromPlaylist")
    }
    const playlist = await playlistModel.findById(new mongoose.Types.ObjectId(playlistId));
    if(!playlist){
        throw new ApiError(404,"Error: Playlist is not find")
    }
    const removeVideoFromPlayList = await playlistModel.findByIdAndUpdate(playlist._id,{
        $pull : {
            videos:videoId
        }
    },{new:true});

    if(!removeVideoFromPlayList){
        throw new ApiError(500,"Error: video remove from playlist is not successfullly tra again");
    }
    return res.json(
        new ApiResponse(removeVideoFromPlayList,true,"video removed from playlist operation is successfull",200)
    )
});

const addVideoToPlaylist = asyncHandler( async (req,res) => {
    const {videoId,playlistId} = req.params;
    console.log(req?.params)

    if ([playlistId, videoId].some(field => (field?.trim?.() ?? "") === "")) {
        throw new ApiError(404, "Playlist name or video ID is missing or empty");
    }
    const checkValidObjIdForVideoId = await isValidObjectId(videoId);
    const checkObjIdForPlayListId = await isValidObjectId(playlistId);
    if(checkValidObjIdForVideoId == false || checkObjIdForPlayListId == false){
        throw new ApiError(403,"Error: Invalid mongoose object id Error Location is: addVideoToPlaylist")
    }

    const checkTheVideoAlreadyExistInPlaylist = await playlistModel.findOne({
        _id:new mongoose.Types.ObjectId(playlistId),
        videos:videoId
    });

    if(checkTheVideoAlreadyExistInPlaylist){
        throw new ApiError(409,"Error: video already exist in playlist")
    }

    const saveVideoInplaylist = await playlistModel.findByIdAndUpdate(new mongoose.Types.ObjectId(playlistId),{
        $addToSet : {
            videos:videoId
        }
    },{new:true});

    if(!saveVideoInplaylist){
        throw new ApiError(500,"Error:some thing wrong try again a few wminutes")

    }
    return res.json(
        new ApiResponse(saveVideoInplaylist,true,"video added successfully in playlist",200)
    )

} );

const getUserChannelPlaylists = asyncHandler( async (req,res) => {
    const {username} = req.params;
    if(!username){
        throw new ApiError(404,"Username is not found");
    }

    const playlist = await userModel.aggregate( [
        {
            $match : {
                username:username
            }
        },
        {
            $lookup : {
                from : "playlists",
                let:{channelId:"$_id"},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $eq : ["$owner","$$channelId"]
                            }
                        }
                    },
                    {
                        $lookup : {
                            from : "videos",
                            let:{videos:"$videos"},
                            pipeline : [
                                {
                                    $match : {
                                        $expr : {
                                            $in : ["$_id","$$videos"]
                                        }
                                    }
                                },
                                {
                                    $sort : {
                                        createdAt : -1
                                    }
                                }
                            ],
                            as:"videos"
                        }
                    }
                ],
                as:"playlists"
            }
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $lookup : {
                
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as: "videos"
            }
        },        
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers",
                },
                totalVideos:{
                    $size : "$videos"
                },
        
                toSubscribedChannel: {
                    $cond: {
                        if: { $in :  [new mongoose.Types.ObjectId(req.user?._id),"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
            }
                          
            }
        },
        {
            $project : {
                _id:1,
                username:1,
                avatar:1,
                coverImage:1,
                email:1,
                fullname:1,
                createdAt:1,
                subscribersCount:1,
                toSubscribedChannel:1,
                totalVideos:1,
                playlists : {
                    $map : {
                        input : "$playlists",
                        as:"p",
                        in : {
                            name:"$$p.name",
                            _id:"$$p._id",
                            description:"$$p.description",
                            visibility:"$$p.visibility",
                            createdAt:"$$p.createdtAt",
                            videos : {
                                $map : {
                                    input : "$$p.videos",
                                    as:"v",
                                    in : {
                                        _id:"$$v._id",
                                        thumbnail:"$$v.thumbnail",
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ] );

    return res.json(
        new ApiResponse(playlist[0],true,"all playlist fetched succesfull",200)
    )
});

const getPlaylistById = asyncHandler( async (req,res) => {
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(404,"Error: Playlistid is undefind");
    }
    const checkObjIdForPlayListId = await isValidObjectId(playlistId);
    if(checkObjIdForPlayListId == false){
        throw new ApiError(403,"Error: Invalid object id");
    }

    const playlist = await playlistModel.aggregate(
        [
            {
                $match : {
                    $expr : {
                        $eq : ["$_id",new mongoose.Types.ObjectId(playlistId)]
                    }
                }
            },
            {
                $lookup : {
                    from : "videos",
                    let:{videoId:"$videos"},
                    pipeline : [
                        {
                            $match : {
                                $expr : {
                                    $in : ["$_id","$$videoId"]
                                }
                            }
                        },
                        {
                            $lookup : {
                                from : "users",
                                let:{owner:"$owner"},
                                pipeline:[
                                    {
                                        $match : {
                                            $expr : {
                                                $eq : ["$_id","$$owner"]
                                            }
                                        }
                                    }
                                ],
                                as:"owner"
                            }
                        }
                    ],
                    as:"videos"
                }
            },
            {
                $lookup : {
                    from : "users",
                    let:{owner:"$owner"},
                    pipeline:[
                        {
                            $match : {
                                $expr : {
                                    $eq:["$_id","$$owner"]
                                }
                            }
                        }
                    ],
                    as:"owner"
                }
            },
            {
                $unwind : "$owner"
            },
            {
                $project : {
                    _id:1,
                    name:1,
                    description:1,
                    visibility:1,
                    videos:{
                        $map : {
                            input : "$videos",
                            as:"video",
                            in : {
                                _id:"$$video._id",
                                thumbnail:"$$video.thumbnail",
                                title:"$$video.title",
                                description:"$$video.description",
                                createdAT:"$$video.createdAT",
                                videoFile:"$$video.videoFile",
                                updatedAt:"$$video.updatedAt",
                                views:"$$video.views",
                                owner : {
                                    $arrayElemAt : [
                                        "$$video.owner",
                                        0
                                    ]
                                }
                            }
                        }
                    },
                    owner:{
                        _id:"$owner._id",
                        username:"$owner.username",
                        fullname:"$owner.fullname",
                        avatar:"$owner.avatar",
                        email:"$owner.email"
                    },
                }
            }

        ]
    );
    if(!playlist){
        throw new ApiError(404,"Error: Playlist is not find")
    }

    return res.json(
        new ApiResponse(playlist[0],true,"Playlist is fetched",200)
    )
});


const getWatchLaterPlaylist = asyncHandler( async (req,res) => {
    const userId = req.user._id;
    const watchLaterPlaylist = await playlistModel.aggregate( [
        {
            $match : {
                $expr : {
                    $and : [
                        {$eq : ["$owner",new mongoose.Types.ObjectId(userId)]},
                        {$eq : ["$name","Watch Later"]} 
                    ]
                }
            }
        },
        {
            $lookup : { 
                from : "users",
                let:{owner:"$owner"},
                pipeline:[
                    {
                        $match : {
                            $expr : {
                                $eq : ["$_id","$$owner"]
                            }
                        }
                    }
                ],
                as:"owner"
            }
        },
        {
            $lookup : {
                from : "videos",
                let:{videosId:"$videos"},
                pipeline: [
                    {
                        $match : {
                            $expr : {
                                $in : ["$_id","$$videosId"]
                            }
                        }
                    },
                    {
                        $lookup : { 
                            from : "users",
                            let:{owner:"$owner"},
                            pipeline:[
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$owner"]
                                        }
                                    }
                                }
                            ],
                            as:"owner"
                        }
                    }       
                ],
                as:"videos"
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $project : {
                _id:1,
                name:1,
                description:1,
                createdAt:1,
                updatedAt:1,
                "owner._id":1,
                "owner.username":1,
                "owner.email":1,
                "owner.avatar":1,
                videos: {
                    $map : {
                        input : "$videos",
                        as:"video",
                        in : {
                            _id:"$$video._id",
                            thumbnail:"$$video.thumbnail",
                            videoFile:"$$video.videoFile",
                            title:"$$video.title",
                            createdAt:"$$video.createdAt",
                            views:"$$video.views",
                            description:"$$video.description",
                            updatedAt:"$$video.updatedAt",
                            duration:"$$video.duration",
                            owner : {
                                fullname: {$arrayElemAt : ["$$video.owner.fullname",0]},
                                email : {$arrayElemAt : ["$$video.owner.email",0]},
                                avatar : {$arrayElemAt : ["$$video.owner.avatar",0]},
                                _id : {$arrayElemAt : ["$$video.owner._id",0]},
                            }
                        }
                    }
                }
                
            }
        }
    ] );
    if(!watchLaterPlaylist){
        throw new ApiError(500,"Error: Server is busy")
    }
    return res.json(
        new ApiResponse(watchLaterPlaylist,true,"Watch later playlist fetched succesfull",200)
    )
});

// tommorrow continue work in this function finaly push into github
const getLikeVideosPlaylist = asyncHandler( async (req,res) => {
    const userId = req.user._id;
    const likeVideos = await userModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "likes",
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$likedBy", "$$userId"] },
                      { $eq: ["$comment", null] } 
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "videos",
                  let:{videoId:"$video"},
                  pipeline:[
                    {
                        $match : {
                            $expr : {
                                $eq : ["$_id","$$videoId"]
                            }
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            let:{owner:"$owner"},
                            pipeline:[
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$owner"]
                                        }
                                    }
                                }
                            ],
                            as:"owner"
                        }
                    },
                    {
                        $unwind : "$owner"
                    }
                  ],
                  as:"video"
                },
              },
              { $unwind: "$video" },
            ],
            as: "likedVideos",
          },
        },
        {
            $project : {
                _id:1,
                fullname:1,
                avatar:1,
                username:1,
                createdAt:1,
                updatedAt:1,
                likeVideos : {
                    $map : {
                        input : "$likedVideos",
                        as:"video",
                        in : {
                            _id:"$$video._id",
                            likedBy:"$$video.likedBy",
                            video : {
                                _id:"$$video.video._id",
                                owner:{
                                    _id:"$$video.video.owner._id",
                                    fullname:"$$video.video.owner.fullname",
                                    avatar:"$$video.video.owner.avatar",
                                    username:"$$video.video.owner.username",
                                    email:"$$video.video.owner.email",
                                },
                                videoFile:"$$video.video.videoFile",
                                thumbnail:"$$video.video.thumbnail",
                                createdAt:"$$video.video.createdAt",
                                title:"$$video.video.title",
                                updatedAT:"$$video.video.updatedAT",
                                duration:"$$video.video.duration",
                                views:"$$video.video.views",
                                description:"$$video.video.description",
                
                            }
                        }
                    }
                }
            }
        }
      ]);      
    if(!likeVideos){
        throw new ApiError(500,"Error: Server is busy")
    }
    return res.json(
        new ApiResponse(likeVideos,true,"Watch later playlist fetched succesfull",200)
    )
});
const getUserPlaylists = asyncHandler( async (req,res) => {
    const userId = req.user._id;
    const allPlaylists = await playlistModel.find({owner:new mongoose.Types.ObjectId(userId)});
    if(!allPlaylists){
        throw new ApiError(500,"Error: Server is busy")
    }
    return res.json(
        new ApiResponse(allPlaylists,true,"all playlist fetched succesfull",200)
    )
});

export {
    createPlaylist,
    removePlaylist,
    updatePlaylist,
    removeVideoFromPlaylist,
    addVideoToPlaylist,
    getUserPlaylists,
    getPlaylistById,
    getWatchLaterPlaylist,
    getLikeVideosPlaylist,
    getUserChannelPlaylists,

}