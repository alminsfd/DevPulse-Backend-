import type { Application, Request, Response } from "express";
import express from 'express'
import CookieParser from "cookie-parser";
import cors from "cors";

const app: Application = express()
app.get('/', (req: Request, res: Response) => {
     res.status(200).json({
          server: "Devpulse server",
          message: "A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions"
     })
})

//build in middleware
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
     cors({
          origin: "http://localhost:5000",
     }),
);




export default app