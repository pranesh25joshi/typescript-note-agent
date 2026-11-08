import express, { Request, Response } from "express";
import {prisma} from "./lib/prisma.js";
import { authRouter } from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { userRouter } from "./routes/user.route.js";
import {agentRouter} from "./routes/agent.route.js"
export const app = express();


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true 
}));


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/agent", agentRouter);


app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Test home route is working"
    });
});

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notes = await prisma.note.findMany();
        res.status(200).json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error(`Error in test route:`, error);
        next(error);
    }
});


// global error middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler caught:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});