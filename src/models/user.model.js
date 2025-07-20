import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    username:{
        type:String,
        required:true,
        uniuqe:true,
        lowecase:true,
        trim:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        uniuqe:true,
        lowecase:true,
        trim:true,
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory : [ {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    } ],
    password: {
        type:String,
        required:[true,"Password is Required"],
    },
    refreshToken : {
        type:String,
    }
    
},{timestamps:true})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    const hashedPassword = await bcrypt.hash(this.password,10);
    this.password = hashedPassword;
    next();
});

userSchema.methods.verifyThePassword =  async function(password){
    return await bcrypt.compare(password,this.password);
};

userSchema.methods.genrateAccessToken =  function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullname:this.password,
            avatar:this.avatar,
            username:this.username
        },
        process.env.ACCESS_SECRET_TOKEN,
        {
            expiresIn:process.env.ACCESS_SECRET_TOKEN_EXPIRY
        }
    )
};

userSchema.methods.genrateRefreshToken =  function() {
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_SECRET_EXPIRY
        }
    )
};

const UserModel = mongoose.model("User",userSchema);

export default UserModel;   