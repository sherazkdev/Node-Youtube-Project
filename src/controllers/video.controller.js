
import ApiError from "../utils/ApiError.js";
import UserModel from "../models/user.model.js";
import {uploadFile as uploadCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import apiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/AsyncHandler.js";
import subscriptionModel from "../models/subscription.model.js";
import mongoose from "mongoose";
import videoModel from "../models/video.model.js";

const getAllVideos = asyncHandler( async (req,res) => {
    
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;


    const videos = await videoModel.aggregate(
        [
            {
                $sort : {
                    createdAt:-1
                }
            }, 
            {
                $skip : skip
            },
            {
                $limit : limitNumber
            },
            {
                $lookup : {
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                }
            },
            {
                $addFields : {
                    owner : {$first : "$owner"}
                }
            },
            {
                $project : {
                    _id:1,
                    videoFile:1,
                    thumbnail:1,
                    description:1,
                    duration:1,
                    views:1,
                    isPublished:1,
                    title:1,
                    "owner._id":1,
                    "owner.avatar":1,
                    "owner.username":1,
                    "owner.fullname":1,
                }
            },

        ]
    );

    if(!videos){
        throw new ApiError(401,"error from videos fetching")
    }

    setTimeout( () => {
        return res.json(
            new ApiResponse(videos,true,"Videos Successfully Feteched",200)
        )
    },3000 )

    
});

const watchVideo = asyncHandler( async (req,res) => {
    
    const { v } = req.params;
    console.log(v)

    // const video = await videoModel.aggregate(
    //     [
    //         {
    //             $match : {
    //                 $expr : {
    //                     $eq : ["$_id",new mongoose.Types.ObjectId(v)]
    //                 }
    //             }
    //         },
    //         {
    //             $lookup : {
    //                 from:"users",
    //                 localField:"owner",
    //                 foreignField:"_id",
    //                 as:"owner",
    //                 pipeline : [
    //                     {
    //                         $lookup : {
    //                             from:"subscriptions",
    //                             let:{userId : "$_id"},
    //                             pipeline : [
    //                                 {
    //                                     $match : {
    //                                         $expr : {
    //                                             $eq : ["$channel","6845319ce92552d1087219c4"]
    //                                         }
    //                                     }
    //                                 }
    //                             ],
    //                             as:"subscribers"
    //                         }
    //                     },
    //                     {
    //                         $lookup : {
    //                             from:"subscriptions",
    //                             let:{userId : "$_id"},
    //                             pipeline : [
    //                                 {
    //                                     $match : {
    //                                         $expr : {
    //                                             $eq : ["$channel","$$userId"]
    //                                         }
    //                                     }
    //                                 }
    //                             ],
    //                             as:"subscribedTo",
    //                             pipeline:[
    //                                 {
    //                                     $lookup : {
    //                                         from : "users",
    //                                         let:{userId:"$subscriber"},
    //                                         pipeline : [
    //                                             {
    //                                                 $match : {
    //                                                     $expr : {
                                                                
    //                                                         $eq : ["$_id","$$userId"]
    //                                                     }
    //                                                 }
    //                                             }
    //                                         ],
    //                                         as:"subscribers"
    //                                     }
    //                                 }
    //                             ]
    //                         }
    //                     },
    //                     {
    //                         $addFields : {
    //                             subscribers : {
    //                                 $first : "$subscribers"
    //                             },
    //                             toSubscribed : {
    //                                 $first : "$subscribedTo"
    //                             },
    //                             totalSubscribersSize : {
    //                                 $size: "$subscribers"
    //                             },
    //                             toSubscribedSize : {
    //                                 $size: "$subscribedTo"
    //                             }, 
    //                         }
    //                     }
    //                 ]
    //             }
    //         }, 
    //         {
    //             $addFields : {
    //                 owner : {
    //                     $first : "$owner"
    //                 }
    //             }
    //         },

    //     ]
    // );


    // const video = await videoModel.aggregate( [
    //     {
    //         $match : {
    //             $expr : {
    //                 $eq : ["$_id",new mongoose.Types.ObjectId(v)]
    //             }
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "users",
    //             let:{ownerId:"$owner"},
    //             pipeline : [
    //                 {
    //                     $match : {
    //                         $expr : {
    //                             $eq : ["$_id","$$ownerId"]
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $lookup : {
    //                         from : "subscriptions",
    //                         let:{ownerId:"$_id"},
    //                         pipeline : [
    //                             {
    //                                 $match : {
    //                                     $expr : {
    //                                         $eq : ["$channel","$$ownerId"]
    //                                     }
    //                                 }
    //                             },
    //                             {
    //                                 $lookup : {
    //                                     from : "users",
    //                                     let:{subscriberId:"$subscriber"},
    //                                     pipeline : [
    //                                         {
    //                                             $match : {
    //                                                 $expr : {
    //                                                     $eq : ["$_id","$$subscriberId"]
    //                                                 }
    //                                             }
    //                                         }
    //                                     ],
    //                                     as:"subscriber"
    //                                 }
    //                             }
    //                         ],
    //                         as:"subscribers"
    //                     }
    //                 }
    //             ],
    //             as:"owner"
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "likes",
    //             let : {videoId:"$_id"},
    //             pipeline : [
    //                 {
    //                     $match : {
    //                         $expr : {
    //                             $eq : ["$video","$$videoId"]
    //                         }
    //                     }
    //                 }
    //             ],
    //             as:"videoLikes"
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "comments",
    //             let:{videoId:"$_id"},
    //             pipeline : [
    //                 {
    //                     $match : {
    //                         $expr : {
    //                             $and : [

    //                                 {
    //                                     $eq : ["$video","$$videoId"] 
    //                                 },
    //                                 {
    //                                     $eq : ["$parentId",null] 
    //                                 }

    //                             ]
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $lookup : {
    //                         from : "comments",
    //                         let : {commentId:"$_id"},
    //                         pipeline : [
    //                             {
    //                                 $match : {
    //                                     $expr : {
    //                                         $eq : ["$parentId","$$commentId"]
    //                                     }
    //                                 }
    //                             },
    //                             {
    //                                 $lookup : {
    //                                     from : "likes",
    //                                     let:{commentId:"$_id"},
    //                                     pipeline : [
    //                                         {
    //                                             $match : {
    //                                                 $expr : {
    //                                                     $eq : ["$comment","$$commentId"]
    //                                                 }
    //                                             }
    //                                         }
    //                                     ],
    //                                     as:"likes"
    //                                 }
    //                             }
    //                         ],
    //                         as:"replies"
    //                     }
    //                 },
    //                 {
    //                     $lookup : {
    //                         from : "likes",
    //                         let:{commentId:"$_id"},
    //                         pipeline : [
    //                             {
    //                                 $match : {
    //                                     $expr : {
    //                                         $eq : ["$comment","$$commentId"]
    //                                     }
    //                                 }
    //                             }
    //                         ],
    //                         as:"likes"
    //                     }
    //                 },
    //             ],
    //             as:"comments"
    //         }
    //     },
    //     {
    //        $addFields : {
    //             totalLikes : {
    //                 $size : "$videoLikes"
    //             }
    //        }
    //     }
    // ] )

    const video = await videoModel.aggregate( [
        {
            $match : {
                $expr : {
                    $eq : ["$_id",new mongoose.Types.ObjectId(v)]
                }
            }
        },
        {
            $lookup : {
                from : "users",
                let:{ownerId:"$owner"},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $eq : ["$_id","$$ownerId"]
                            }
                        }
                    },
                    {
                        $lookup : {
                            from : "subscriptions",
                            let:{ownerId:"$_id"},
                            pipeline : [
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$channel","$$ownerId"]
                                        }
                                    }
                                },
                                {
                                    $lookup : {
                                        from : "users",
                                        let:{subscriberId:"$subscriber"},
                                        pipeline : [
                                            {
                                                $match : {
                                                    $expr : {
                                                        $eq : ["$_id","$$subscriberId"]
                                                    }
                                                }
                                            }
                                        ],
                                        as:"subscriber"
                                    }
                                }
                            ],
                            as:"subscribers"
                        }
                    }
                ],
                as:"owner"
            }
        },
        {
            $lookup : {
                from : "likes",
                let : {videoId:"$_id"},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $eq : ["$video","$$videoId"]
                            }
                        }
                    }
                ],
                as:"videoLikes"
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $lookup : {
                from : "subscriptions",
                let:{ownerId:"$owner._id",currentUser : new mongoose.Types.ObjectId(req?.user?._id)},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $and : {
                                    $eq : ["$channel","$$ownerId"],
                                    $eq : ["$subscriber","$$currentUser"]

                                }
                            }
                        }
                    }
                ],
                as:"isSubscribed"
            }
        },
        {
            $addFields : {
                isSubscribed : {
                    $gt : [ {$size : "$isSubscribed"},0 ]
                },
                totalSubscribers : {
                    $size : "$owner.subscribers"
                },
                totalVideoLikes : {
                    $size : "$videoLikes"
                },
                isLiked : {
                    // $map : {
                    //     input : "$videoLikes",
                    //     as:"like",
                    //     in : {
                    //         $cond : {
                    //             if : { $in : [new mongoose.Types.ObjectId(req?.user?._id),"$$like.likedBy"] },
                    //             then:true,
                    //             else:false
                    //         }
                    //     }
                    // }

                    // $reduce : {
                    //     input:"$videoLikes",
                    //     initialValue : false,
                    //     in : {
                    //         $cond : {
                    //             if : {$in : [new mongoose.Types.ObjectId(req?.user?._id),"$$value"]},
                    //             then:true,
                    //             else:false
                    //         }
                    //     }
                    // }
                    $in: [ new mongoose.Types.ObjectId(req?.user?._id), "$videoLikes.likedBy" ]
                    
                      
                } 
            }
        },
        {
            $project : {
                _id:1,
                videoFile:1,
                description:1,
                thumbnail:1,
                isSubscribed:1,
                totalSubscribers:1,
                totalVideoLikes:1,
                views:1,
                duration:1,
                title:1,
                createdAt:1,
                owner : {
                    avatar : "$owner.avatar",
                    avausernametar : "$owner.username",
                    _id : "$owner._id",
                    fullname : "$owner.fullname",
                    email : "$owner.email",

                },
                isLiked:1,
                videoLikes:1
            }
        }
              
    ] )
   
    if(req?.user){

        const updateWatchHistory = await UserModel.findByIdAndUpdate(new mongoose.Types.ObjectId(req.user._id),{
            $addToSet : {
                watchHistory:new mongoose.Types.ObjectId(v)
            }
        },{new:true})
        console.log(updateWatchHistory)
    }

    
    if(!video){
        throw new ApiError(404,"Video Not Found")
    }

    return res.json(new ApiResponse(video,true,"",200))


});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,publishNow} = req.body;

    // 1. check title is required
    if (!title?.trim()) {
        throw new ApiError(402, "title is missing");
    }

    // 2. get Video localPath
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
   
    let thumbnailLocalPath;
    if (
        !req.files?.thumbnail ||
        !Array.isArray(req.files.thumbnail) ||
        req.files.thumbnail.length < 1
      ) {
        throw new ApiError(402, "Thumbnail is required");
      }
      
    // 3. get Thumbnail localPath
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    
    // 4. video local Path is required
    if(!videoLocalPath){
        throw new ApiError(404,"video local path no found");
    }
    
    // 5. upload video and thumnail on cloudniray
    const uplodeTheVideo = await uploadCloudinary(videoLocalPath);
    const uplodeTheThumbnail = await uploadCloudinary(thumbnailLocalPath);


    // 6. video and thumnail is succceffully uploaded conditions
    if(!uplodeTheVideo || !uplodeTheThumbnail){
        throw new ApiError(400,"Video and Thumbnail Not Uploaded");
    }

    // 7 upload video in db is last step
    const video = await videoModel.create({
        videoFile:uplodeTheVideo.url,
        thumbnail:uplodeTheThumbnail.url,
        views:0,
        title:title.trim(),
        description:description,
        duration:uplodeTheVideo.duration,
        isPublished:publishNow || true,
        owner:req.user?._id
    });

    // 8 video uploaded successfull
    if(!video){
        throw new ApiError(500,"Video not updated in db error from sever try again");
    }

    // 8 response sending proccess
    return res.json(
        new ApiResponse(video,true,"video uploaded successfully",200)
    )
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await videoModel.findById(new mongoose.Types.ObjectId(videoId));
    if(!video){
        throw new ApiError(404,"video not found");
    }
    const deleteVideoFromCloudinary = await deleteFromCloudinary(video.videoFile);

    if(!deleteVideoFromCloudinary){
        throw new ApiError(400,"Video Not Deleted From cloudinary")
    };
    const deleteFromDbCurrentVideo = await videoModel.findByIdAndDelete(new mongoose.Types.ObjectId(video._id));

    if(!deleteFromDbCurrentVideo){
        throw new ApiError(500,"Bad Request Server Problem try gain a few minutes")
    }

    return res.json(
        new ApiResponse([],true,"Video Deleted successfully",200)
    )

});

const togglePublishStatus = asyncHandler( async (req,res) => {
    const {videoId} = req.params;
    const video = await videoModel.findById(mongoose.Types.ObjectId(videoId));
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(video.isPublished == true){
        video.isPublished = false
    }else {
        video.isPublished = true;
    }
    const newVideo = await video.save({new:true});
    if(!newVideo){
        throw new ApiError(500,"isPublished Status not successfully Changed")
    }
    return res.json(
        new ApiResponse(newVideo,true,"video status updated",200)
    )
} );

const updateVideo = asyncHandler( async (req,res) => {
    const { title, description,videoId} = req.body;

    
    const updateData = {};

    if(!videoId){
        throw new ApiError(404,"video id is not found")
    }
    if(title?.trim()) updateData.title = title.trim();
    if(description?.trim()) updateData.description = description.trim();

    const video = await videoModel.findById(new mongoose.Types.ObjectId(videoId));

    if(!video){
        throw new ApiError(404,"video not found")
    }
    // checking the the video thumnail reciving from front-end

    if(req.file){
        const updateThumbnail = await uploadCloudinary(req.file.path);
        updateData.thumbnail = updateThumbnail.url;
    }
    const saveVideoData = await videoModel.findByIdAndUpdate(new mongoose.Types.ObjectId(video._id),updateData,{new:true});
    if(!saveVideoData){
        throw new ApiError(500,"video not updated");
    } 
    return res.json(
        new ApiResponse(saveVideoData,true,"video updated successfully",200)
    )

} );

const updateVideoView = asyncHandler( async (req,res) => {

    const videoId = req.body.videoId;

    if(!videoId){
        throw new ApiError(402,"video id not found");
    }

    const video = await videoModel.findById(new mongoose.Types.ObjectId(videoId) );

    if(!video){
        throw new ApiError(403,"video not found in db");
    }

    video.views += 1;

    const newView = await video.save({new:true});
    if(!newView){
        throw new ApiError(500,"some thing wrong server busy error from watch count");
    }
    return res.json(
        new ApiResponse(newView,true,"video views successfully changed",200)
    )
} );

const relatedVideos = asyncHandler(async (req,res) => { 

    const {_id,page=1,limit=5} = req.query;
    if(!_id){
        throw new ApiError(404,"Error: Title Is not definde");
    }

    const video = await videoModel.findById(new mongoose.Types.ObjectId(_id));

    const query = video.title.split("  ").slice(0,10).join("|");

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const relatedVideos = await videoModel.aggregate( [
        {
            $match : {
                title:{$regex : query,$options:"i"}
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
            $limit : limit
        },
        {
            $skip : skip
        },
        {
            $sort : {
                createdAt:-1
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $project : {
                _id:1,
                videoFile:1,
                description:1,
                thumbnail:1,
                isSubscribed:1,
                totalSubscribers:1,
                totalVideoLikes:1,
                views:1,
                duration:1,
                title:1,
                createdAt:1,
                owner : {
                    avatar : "$owner.avatar",
                    avausernametar : "$owner.username",
                    _id : "$owner._id",
                    fullname : "$owner.fullname",
                    email : "$owner.email",

                }
            }
        }
    ] );
    
    // return res.json(relatedVideos)
    return res.json( new ApiResponse(relatedVideos,true,"RelatedVideo SuccessfullyFetched",200) )


})

const searchVideos = asyncHandler(async (req,res) => {
    const {query} = req.query;
    const findMatchedVideosByTitleAndDescription = await videoModel.find(
        {
            $or : [
                { title : {$regex : query,$options:"i"}},
                { description : {$regex : query,$options:"i"}},
            ]
        },
    ).sort({createdAt:-1}).select("title description");
    return res.json(new ApiResponse(findMatchedVideosByTitleAndDescription,true,"Matched video successfully featched",200));
}) 

const searchVideoWithFullDetails = asyncHandler( async (req,res) => {
    
    const {q,page=1,limit=10} = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // const findMatchedVideosByTitleAndDescription = await videoModel.find(
    //     {
    //         $or : [
    //             { title : {$regex : query,$options:"i"}},
    //             { description : {$regex : query,$options:"i"}},
    //         ]
    //     },
    // ).sort({createdAt:-1}).select("title description");

    const findMatchedVideosByTitleAndDescription = await videoModel.aggregate( [
        {
            $match : {
                $expr : {
                    $or : [
                        { $regexMatch: { input: "$title", regex: q, options: "i" } } ,
                        { $regexMatch: { input: "$description", regex: q, options: "i" } } 
                    ]
                }
            }
        },
        {
            $sort : {
                createdAt:-1,
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
        { $skip: skip },
        { $limit: limitNumber },
        { $unwind: "$owner" },
        {
            $project : {
                _id:1,
                videoFile:1,
                thumbnail:1,
                views:1,
                duration:1,
                createdAt:1,
                updatedAt:1,
                title:1,
                description:1,
                "owner.fullname":1,
                "owner.avatar":1,
                "owner.username":1,
                "owner._id":1,

            }
        }
    ] );

    return res.json(new ApiResponse(findMatchedVideosByTitleAndDescription,true,"Successfully fetched videos",200));

})

export {
    watchVideo,
    getAllVideos,
    publishAVideo,
    deleteVideo,
    updateVideo,
    updateVideoView,
    relatedVideos,
    searchVideos,
    searchVideoWithFullDetails
}
