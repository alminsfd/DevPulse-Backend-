import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";

const createUser = async (req: Request, res: Response) => {
     try {

          const result = await authService.createUserIntoDB(req.body);
          sendResponse(res, {
               statusCode: 201,
               success: true,
               message: "User registered successfully ",
               data: result.rows[0],
          })

     } catch (error: any) {

          sendResponse(res, {
               statusCode: 500,
               success: false,
               message: error.message,
               error: error,
          })

     }


}

const checkUser = async (req: Request, res: Response) => {

     try {
          const result = await authService.checkedUserIntoDb(req.body)
          sendResponse(res, {
               statusCode: 200,
               success: true,
               message: "Login successful",
               data: result,
          })

     } catch (error: any) {

     }

}

export const authController = {

     createUser,
     checkUser

}