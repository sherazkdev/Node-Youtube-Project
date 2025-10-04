import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./.env"
});

const Port = process.env.PORT || process.env.PORT + 1 || process.env.PORT + 2;

const MongooseConnection = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

await MongooseConnection();

// app.listen(Port,() => console.log(` Port at running this port http://localhost:${Port}`));

export default app;