import type { Application, Request, Response } from "express";
import express from 'express'

const app: Application = express()
app.get('/', (req: Request, res: Response) => {
     res.status(200).json({
          server: "Devpulse server",
          message: "A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions"
     })
})


export default app