import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();


const cloud = cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY 
});



const uploadFile = async ( localFile ) => {
    try{

        console.log(localFile);

        if(!localFile) return null;

        const fileUploadResponse = await cloudinary.uploader.upload(localFile,{
            resource_type:"auto"
        });

        // file uploaded successfull
        const delFile = await fs.unlinkSync(localFile);
        
        return fileUploadResponse;

    }catch(error){
        await fs.unlinkSync(localFile);
        return error;
    }
}

const deleteFromCloudinary = async (fileUrl) => {
    try {
        const deleteFromCloudinary = await cloudinary.uploader.destroy(fileUrl,{resource_type:"auto"});
        return deleteFromCloudinary;
    } catch (error) {
        return error;
    }
}

export {uploadFile,deleteFromCloudinary};