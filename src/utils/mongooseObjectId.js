import mongoose from "mongoose";


const isValidObjectId = async ( objId ) => { 
    try {
        
        return  mongoose.Types.ObjectId.isValid(objId) ? true : false

    } catch (error) {
        return error;
    }
}

export {isValidObjectId}