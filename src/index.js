import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./.env"
});

const MongooseConnection = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

await MongooseConnection();

export default app;