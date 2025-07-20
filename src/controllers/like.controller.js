import likeModel from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import commentModel from "../models/comment.modle.js";
import asyncHandler from "../utils/asyncHanlder.js";
import mongoose from "mongoose";
import videoModel from "../models/video.model.js";


const likeVideo = asyncHandler( async (req,res) => {
    
    const {videoId} = req.body;

    if(!videoId){
        throw new ApiError(402,"Video id not found");
    }

    const checkLikeThisVideoAlreadyLikes = likeModel.findOne({
        video:videoId,
        likedBy:req.user?.id
    }); 
    if(checkLikeThisVideoAlreadyLikes){
        throw new ApiError(300,"video already liked");
    }

    const likeVideo = await likeModel.create(
        {
            video:videoId,
            likedBy:req.user?._id
        }
    );

    if(!likeVideo){
        throw new ApiError(500,"some thing wrong server busy from likeVideo Proccessing")
    };

    return res.json( new ApiResponse(likeVideo,true,"Video Liked Successfully",200) )

    


});

const likeComment = asyncHandler( async (req,res) => {

    const {commentId} = req.body;

    if(!commentId){
        throw new ApiError(402,"CommentId Not found");
    }

    const comment = await commentModel.findById(commentId);
    
    if(!comment){
        throw new ApiError(404,"Comment not found");
    }

    const checkCommentAlreadyLiked = await commentModel.findOne({_id:comment._id,owner:req.body?.id});

    if(checkCommentAlreadyLiked){
        throw new ApiError(400,"comment already Liked");
    }

    const newLikedComment = await likeModel.create({
        video:comment.video,
        comment:comment._id,
        likedBy:req.user.id
    });
    
    if(!newLikedComment){
        throw new ApiError(500,"some thing wrong server busy");
    }

    return res.json(
        new ApiResponse(newLikedComment,true,"comment liked successfully",200)
    )



} );

const getLikedVideos = asyncHandler( async (req,res) => {
    // Todo: Get All video with current user liked

    const videos = await likeModel.aggregate([
        {
            $match : {
                $expr : {
                    $eq : ["$likedBy",new mongoose.Types.ObjectId(req.user.id)]
                }
            }
        },
        {
            $lookup : {
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $lookup : {
                            from : "users",
                            let:{ownerId:"$owner"},
                            pipeline:[
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$ownerId"]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                },
                            ],
                            as:"owner"
                        }
                    },
                    {
                        $addFields : {
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
        
       
    ]);

    return res.json(
        new ApiResponse(videos,true,"all liked videos",200)
    )
});

const toggleLikeVideo = asyncHandler( async (req,res) => {

    const videoId = req.body?.videoId;

    if(!videoId){
        throw new ApiError(401,"videId not found");
    }

    const video = await videoModel.findById(videoId);


    if(!video){
        throw new ApiError(402,"video not found");
    }

    const checkVideoLikedAlready = await likeModel.findOne({
        likedBy:req.user.id,
        video:video._id
    });

    console.log(checkVideoLikedAlready)

    if(checkVideoLikedAlready){
       const unlikeVideo = await likeModel.findByIdAndDelete(checkVideoLikedAlready._id,);
       if(!unlikeVideo){
            throw new ApiError(500,"some thing wrong video unlike proccess not completed")
       }
       return res.json(
            new ApiResponse("",true,"video unliked successfully",200)
       ) 
    }
    const newLikedVideo = await likeModel.create({
        video:video._id,
        likedBy:req.user.id,
    });

    if(!newLikedVideo){
        throw new ApiError(500,"Some thing wrong server busy liked proccess not completed")
    }

    return res.json(
        new ApiResponse(newLikedVideo,true,"video liked successfully",200)
    )

} )
const toggleLikeComment = asyncHandler( async (req,res) => {

    const commentId = req.body?.commentId;

    console.log(req.body)

    if(!commentId){
        throw new ApiError(401,"commentId not found");
    }

    if(!mongoose.Types.ObjectId.isValid(commentId   )){
        throw new ApiError(402,"comment id is not valid")
    }

    const comment = await commentModel.findById(commentId);

    console.log(comment)

    if(!comment){
        throw new ApiError(401,"Comment not found");
    }

    const findTheVideoCurrentComment = await videoModel.findById(comment.video);

    console.log(findTheVideoCurrentComment)

    if(!findTheVideoCurrentComment){
        throw new ApiError(403,"comment video id not matched");
    }

    const checkLikedComment = await likeModel.findOne({
        comment:commentId,
        likedBy:req.user.id
    });

    if(checkLikedComment){
        const unlikeComment = await likeModel.findByIdAndDelete(checkLikedComment._id);
        if(!unlikeComment){
            throw new ApiError(500,"comment Unliked proccess not completed");
        }

        return res.json(
            new ApiResponse("",true,"comment unliked successfully",200)
        )
    }

    const newCommentLikeNow = await likeModel.create({
        comment:commentId,
        likedBy:req.user.id
    });

    if(!newCommentLikeNow){
        throw new ApiError(500,"comment liked proccess not completed ")
    }

    return res.json(
        new ApiResponse(newCommentLikeNow,true,"comment liked successfully",200)
    )
    
} )


export {
    getLikedVideos,
    toggleLikeVideo,
    toggleLikeComment,
    likeVideo,
    likeComment,
}