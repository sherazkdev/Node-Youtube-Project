import multer from "multer";

const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,"./public/");
    },
    filename : (req,file,cb) => {
        const genrateRandomNameForFile = Date.now() + Math.round(Math.random() * 10) + "-" +  file.originalname;
        cb(null,genrateRandomNameForFile);
    }
})
const upload = multer({storage:storage});
export default upload;