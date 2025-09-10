import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"Comment",
        default:null
    },
    video : {
        type:mongoose.Types.ObjectId,
        ref:"Video",
        default:null
    },
    likedBy : {
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },

},{timestamps:true});


const likeModel = mongoose.model("Like",likeSchema);

export default likeModel;