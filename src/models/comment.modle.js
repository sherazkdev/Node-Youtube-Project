import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content:{
        type:String,
        required:true,
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    parentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
        default:null,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }


});

const commentModel = mongoose.model("Comment",commentSchema);
export default commentModel;