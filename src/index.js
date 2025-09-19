import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path:"./.env"
});


await connectDB().then( () => {
    console.log(`\n Database Connected Successfully`);
}).catch( (error) => {
    console.log("error from index js after function colling",error)
})


export default (req,res) => {
    app(req,res);
}