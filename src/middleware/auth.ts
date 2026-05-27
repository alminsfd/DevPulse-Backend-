import type { NextFunction, Request, Response } from "express"
import sendResponse from "../utils/sendResponse";
import jwt from "jsonwebtoken";
import config from "../config";
import type { JwtPayload } from "jsonwebtoken";
import { pools } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {

     return async (req: Request, res: Response, next: NextFunction) => {

          try {

               const token = req.headers.authorization;
               if (!token) {
                    sendResponse(res, {
                         statusCode: 401,
                         success: false,
                         message: "Unauthorized access!!",
                    })

               }

               const decoded = jwt.verify(token as string, config.jwtkey as string) as JwtPayload;
               const userData = await pools.query(
                    `
               SELECT * FROM users WHERE email=$1  
                    `, [decoded.email]
               )

               const user = userData.rows[0];
               if (!user) {
                    sendResponse(res, {
                         statusCode: 401,
                         success: false,
                         message: " Unauthorized access!! ",
                    })
               }

               if (roles.length && !roles.includes(user.role)) {
                    sendResponse(res, {
                         statusCode: 403,
                         success: false,
                         message: "Forbidden access!!",
                    })
               }

               req.user = decoded;

               next()


          } catch (error) {

               next(error)

          }


     }

}



export default auth