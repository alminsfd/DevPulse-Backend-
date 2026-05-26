import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post("/signup", authController.createUser)
router.post("/login", authController.checkUser)



export const authRouter = router