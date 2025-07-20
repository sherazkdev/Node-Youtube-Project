import mongoose from "mongoose";
import commentModel from "../models/comment.modle.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHanlder.js";
import { isValidObjectId } from "../utils/mongooseObjectId.js";


const getVideoComments = asyncHandler( async (req,res) => {
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(404,"Error: videoId is undefind");
    }
    const checkTheObjIdForVideoId = isValidObjectId(videoId);
    if(checkTheObjIdForVideoId == false){
        throw new ApiError(403,"Error: Invalid Object Id")
    }
    const comments = await commentModel.aggregate(
        [
            {
                $match : {
                    $expr : {
                        $eq : ["$video",new mongoose.Types.ObjectId(videoId)]
                    }
                }
            },
            {
                $lookup : {
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"comments"
                    
                }
            },
            {
                $project : {
                    _id:1,
                    comments:{
                        $map : {
                            input : "$comments",
                            as:"comments",
                            in : {
                                _id:"$$comments._id",
                                email:"$$comments.email",
                                username:"$$comments.username",
                                fullname:"$$comments.fullname",
                                avatar:"$$comments.avatar",
                            }
                        }
                    }
                }
            }
        ]
    );

    if(!comments){
        throw new ApiError(500,"Error : server busy");
    }

    return res.json(
        new ApiResponse(comments,true,"comments fetched successfully",200)
    )
}) 

const addComment = asyncHandler( async (req,res) => {
    console.log(req.body)
    const {content,videoId} = req.body;

    if([content,videoId].some( (field) => (field?.trim?.() ?? "") === "" )){
        throw new ApiError(404,"Error: Content and VideoId Is required");
    }

    const checkObjIdIsValidId = await isValidObjectId(videoId);
    if(checkObjIdIsValidId == false){
        throw new ApiError(403,"Error: Invalid Object Id");
    }

    const newComment = await commentModel.create({
        content:content,
        video:new mongoose.Types.ObjectId(videoId),
        parent:null,
        owner:new mongoose.Types.ObjectId(req.user.id),
    });

    if(!newComment){
        throw new ApiError(500,"Error: newComment is no created server down")
    }

    return res.json(
        new ApiResponse(newComment,true,"comment successfully uploaded",200)
    )

} );

const replyComment = asyncHandler( async (req,res) => {
    const {content,commentId} = req.body;

    if([content,commentId].some( (field) => (field?.trim?.() ?? "") === "" )){
        throw new ApiError(404,"Error: Content and VideoId Is required");
    }

    const checkObjIdIsValidId = await isValidObjectId(commentId);
    
    if(checkObjIdIsValidId == false){
        throw new ApiError(403,"Error: Invalid Object Id");
    }

    const comment = await commentModel.findById(commentId);
    if(!comment){
        throw new ApiError(404,"Error: Comment not found");
    }
    const newCommentForReply = await commentModel.create({
        content:content,
        video:comment.video,
        parentId:commentId,
        owner:req.user._id,
        
    })

    if(!newCommentForReply){
        throw new ApiError(500,"Error: server is down ");
    }
    return res.json(
        new ApiResponse(newCommentForReply,true,"Reply comment successfully uploaded",200)
    )
} );

const deleteComment = asyncHandler( async (req,res) => {
    const {commentId,} = req.params;

    if(!commentId){
        throw new ApiError(404,"Error: commentId is undefind");
    }

    const checkTheCommentCurrentyLoggedInUserComment = await commentModel.findOne({
        _id:new mongoose.Types.ObjectId(commentId),
        owner:new mongoose.Types.ObjectId(req.user.id)
    });
    if(!checkTheCommentCurrentyLoggedInUserComment){
        throw new ApiError(404,"Error: your comment is not find and your id is not matched")
    }

    const deleteComment = await commentModel.findByIdAndDelete({
        _id:new mongoose.Types.ObjectId(commentId),
    });
    if(!deleteComment){
        throw new ApiError(500,"Error: Server is busy");
    }
    return res.json(
        new ApiResponse("",true,"Comment Deleted",200)
    )
} )

const editComment = asyncHandler( async (req,res) => {

    const {content,commentId} = req.body;

    if([content,commentId].some( (field) => (field?.trim?.() ?? "" )=== "" )){
        throw new ApiError(404,"Error: Content and VideoId Is required");
    }

    const checkObjIdIsValidId = await isValidObjectId(commentId);
    if(checkObjIdIsValidId == false){
        throw new ApiError(403,"Error: Invalid Object Id");
    }
    const comment = await commentModel.findOne({
        _id:new mongoose.Types.ObjectId(commentId),
        owner:new mongoose.Types.ObjectId(req.user.id)
    });
    if(!comment){
        throw new ApiError(404,"Error: Invalid Comment Id userId and Comment Id is not mathced")
    }
    comment.content  = content;

    const newComment = await comment.save();

    if(!newComment){
        throw new ApiError(500,"Error: Server Busy")
    }
    return res.json(
        new ApiResponse(newComment,true,"Comment Updated",200)
    )
} )



export {
    getVideoComments,
    addComment,
    replyComment,
    deleteComment,
    editComment,
};