import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

const createIssues = async (req: Request, res: Response) => {
     try {

          if (!req.user) {
               return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "User not authenticated",
               });
          }

          const { id } = req.user;
          const result = await issueService.createIssueIntoDB(id, req.body);
          sendResponse(res, {
               statusCode: 201,
               success: true,
               message: "Issue created successfully",
               data: result.rows[0],
          })

     } catch (error: any) {
          sendResponse(res, {
               statusCode: 500,
               success: false,
               message: error.message,
          });
     }
}

export const issuesController = {
     createIssues
}