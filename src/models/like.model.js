import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    },
    video : {
        type:mongoose.Types.ObjectId,
        ref:"Video"
    },
    likedBy : {
        type:mongoose.Types.ObjectId,
        ref:"User"
    },

},{timestamps:true});


const likeModel = mongoose.model("Like",likeSchema);

export default likeModel;