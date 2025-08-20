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
                            $and : [

                                {$eq : ["$video",new mongoose.Types.ObjectId(videoId)]},
                                {$eq : ["$parentId",null]}

                            ],
                        }
                    }
                },
                {
                    $lookup : {
                        from : "comments",
                        let:{commentId:"$_id"},
                        pipeline : [
                            {
                                $match : {
                                    $expr : {
                                        $eq : ["$parentId","$$commentId"]
                                    }
                                }
                            },
                            {
                                $lookup : {
                                    from : "likes",
                                    let:{replyCommentId:"$_id"},
                                    pipeline:[
                                        {
                                            $match : {
                                                $expr : {
                                                    $eq : ["$comment","$$replyCommentId"]
                                                }
                                            }
                                        }
                                    ],
                                    as:"replyCommentLikes"
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
                        as:"replies"
                    }
                },
                {
                    $lookup : {
                        from:"users",
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
                        from : "likes",
                        let:{commentId:"$_id"},
                        pipeline : [
                            {
                                $match : {
                                    $expr : {
                                        $eq : ["$comment","$$commentId"]
                                    }
                                }
                            }
                        ],
                        as:"commentLikes"
                    }
                },
                {
                    $unwind : "$owner"
                },
                {
                    $addFields : {
                        isLikedComment : {
                            $in : [new mongoose.Types.ObjectId(req?.user?._id),"$commentLikes.likedBy"]
                        },
                        totalCommentLikes : {
                            $size : "$commentLikes"
                        }
                    }
                },
                {
                    $project : {
                        _id:1,
                        content:1,
                        video:1,
                        parentId:1,
                        createdAt:1,
                        updatedAt:1,
                        replies : {
                            
                            $map : {
                                input : "$replies",
                                as:"reply",
                                in : {
                                    content: "$$reply.content",
                                    _id: "$$reply._id",
                                    video: "$$reply.video",
                                    parentId: "$$reply.parentId",
                                    createdAt: "$$reply.createdAt",
                                    updatedAt: "$$reply.updatedAt",
                                    owner: {
                                        
                                        $arrayElemAt: [
                                            { 
                                                $map: {
                                                    input: "$$reply.owner",
                                                    as: "owner",
                                                    in: {
                                                        _id: "$$owner._id",
                                                        email: "$$owner.email",
                                                        username: "$$owner.username",
                                                        fullname: "$$owner.fullname",
                                                        avatar: "$$owner.avatar"
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                      
                                }
                            }
                                  
                        },
                        totalCommentLikes:1,
                        isLikedComment:1,
                        "owner._id" : 1,
                        "owner.email" : 1,
                        "owner.username" : 1,   
                        "owner.fullname" : 1 ,
                        "owner.avatar" : 1,


                        
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
    
    const {content,videoId} = req.body;

    if([content,videoId].some( (field) => String( field ?? "").trim().length < 1)){
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
    const findCreatedComment = await commentModel.findById(new mongoose.Types.ObjectId(newComment?._id)).populate({ path : "owner",select:"-password -refreshToken -watchHistory -updatedAt -createdAt"});

    return res.json(
        new ApiResponse(findCreatedComment,true,"comment successfully uploaded",200)
    )

} );

const replyComment = asyncHandler( async (req,res) => {
    const {content,commentId} = req.body;
    

    if([content,commentId].some( (field) => String(field ?? "").trim().length < 1)){
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
    const findCreatedReply = await commentModel.findById(new mongoose.Types.ObjectId(newCommentForReply?._id)).populate({ path : "owner",select:"-password -refreshToken -watchHistory -updatedAt -createdAt"});

    return res.json(
        new ApiResponse(findCreatedReply,true,"Reply comment successfully uploaded",200)
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