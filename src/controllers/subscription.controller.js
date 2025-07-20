import mongoose from "mongoose";
import subscriptionModel from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHanlder.js";
import {isValidObjectId} from "../utils/mongooseObjectId.js";

const toggleSubscription = asyncHandler( async (req,res) => {

    const channelId = req.params.channelId;

    console.log(req.params)

    if(!channelId){
        throw new ApiError(404,"channel id not found")
    }
    const objectIdChecking = await isValidObjectId(channelId);
    if(objectIdChecking == false){
        throw new ApiError(403,"invalid object id");
    }

    const checkTheCurrentUserAlreadySubscribedThisChannel = await subscriptionModel.findOne({subscriber:req.user.id,channel:channelId});

    if(checkTheCurrentUserAlreadySubscribedThisChannel){
        const unsubscribeTheChannel = await subscriptionModel.findByIdAndDelete(new mongoose.Types.ObjectId(checkTheCurrentUserAlreadySubscribedThisChannel._id) );
        if(!unsubscribeTheChannel){
            throw new ApiError(500,"unSubscribed channel proccess is failed")
        }else{
            return res.json(
                new ApiResponse("",true,"channel unSubscribed successfully",200)
            )
        }
    }

    const subscribeTheChannel = await subscriptionModel.create({
        subscriber:req.user.id,
        channel:channelId
    });

    if(!subscribeTheChannel){
        throw new ApiError(500,"some thing wrong server is busy error from subscribed channel")
    }

    return res.json(
        new ApiResponse(subscribeTheChannel,true,"channel Subscribed successfully",200)
    )
} );


const getUserChannelSubscribers = asyncHandler( async (req,res) => {
    const {channelId} = req.params;
    if(!channelId){
        throw new ApiError(404,"channel id not found");
    }

    const objectIdChecking = await isValidObjectId(channelId);
    if(objectIdChecking == false){
        throw new ApiError(403,"invalid object id");
    }

    const subscribers = await subscriptionModel.aggregate(
        [
            {
                $match : {
                    $expr : {
                        $eq : ["$channel",new mongoose.Types.ObjectId(channelId)]
                    }
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscribers"
                }
            },
            {
                $project : {
                    _id:1,
                  subscribers : {
                    $map : {
                        input : "$subscribers",
                        as:"subscriber",
                        in : {
                            fullname : "$$subscriber.fullname",
                            email : "$$subscriber.email",
                            avatar : "$$subscriber.avatar",
                            _id : "$$subscriber._id",
                        }
                    }
                  }
                }
            }
        ]
    );

    if(!subscribers){
        throw new ApiError(500,"some thing wrong try again later error from getUserChannelSubscribers")
    }
    
    return res.json(
        new ApiResponse(subscribers,true,"all subscribers fethed",200)
    )
});

const getSubscribedChannels = asyncHandler( async (req,res) => {
    const {channelId} = req.params;
    if(!channelId){
        throw new ApiError(404,"channel id not found");
    }

    const objectIdChecking = await isValidObjectId(channelId);
    if(objectIdChecking == false){
        throw new ApiError(403,"invalid object id");
    }
    const subscribedChannels  = await subscriptionModel.aggregate(
        [
            {
                $match : {
                    $expr : {
                        $eq : ["$subscriber",new mongoose.Types.ObjectId(channelId)]
                    }
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"subscribedTo"
                }
            },
            {
                $project : {
                    _id:1,
                    subscribedTo : {
                        $map : {
                            input : "$subscribedTo",
                            as:"subscribedTo",
                            in : {
                                fullname : "$$subscribedTo.fullname",
                                email : "$$subscribedTo.email",
                                avatar : "$$subscribedTo.avatar",
                                _id : "$$subscribedTo._id"
                            }
                        }
                    }
                }
            }
        ]
    );

    if(!subscribedChannels){
        throw new ApiError(500,"some thing wrong try again later error from getUserChannelSubscribers")
    }
    
    return res.json(
        new ApiResponse(subscribedChannels,true,"all subscribed channels fetched",200)
    )

} )


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}