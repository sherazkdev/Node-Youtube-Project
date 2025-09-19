import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./.env"
});

await connectDB().catch( (error) => throw new Errro(error));

app.listen(process.env.PORT || 5000,() => {
    console.log(`server running at this Port:${process.env.PORT}`);
})
