import express, { Request, Response } from "express";
import {prisma} from "./lib/prisma.js"
import { success } from "zod";
import { RegisterInput } from "./validations/auth.schema.js";
import { userRouter } from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors"


export const app = express();


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use(cors(
    {
        origin:"http://localhost:5173"
    }
));


app.use("api/v1/users", userRouter);



app.get("/", (req,res) =>{
    return res.json({
        message:"this is  test home route"
    })
});


app.get("/test", async (req:Request, res:Response) => {
    try {
        const notes = await prisma.note.findMany();
        return res.status(200).json({
            success : true,
            data : notes
        });
    } catch (error) {
        console.log(`this is the error in test route ${ error}`)
    }
});


app.post("/register", (req , res)=>{
    try {
        const {name, email, password} = req.body;
    } catch (error) {
        console.log("their is an error in register user route")
    }
});