import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    }, 
    description : {
        type:String,
        default:null,
    },
    videos : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"

        }
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    visibility : {
        type:String,
        enum:["PRIVATE","PUBLIC","UNLISTED"],
        default:"PRIVATE"
    }
},{timestamps:true});


const playlistModel = mongoose.model("Playlist",playlistSchema);

export default playlistModel;