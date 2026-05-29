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
               error: error
          });
     }
}


const getAllIssues = async (req: Request, res: Response) => {
     try {

          const result = await issueService.getAllIssuesFromDB(req.query);

          sendResponse(res, {
               statusCode: 200,
               success: true,
               message: "Issues retrieved successfully",
               data: result,
          });
     } catch (error: any) {
          sendResponse(res, {
               statusCode: 500,
               success: false,
               message: error.message,
               error: error
          });
     }
}

const getSingleIssue = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;
          if (!id || isNaN(Number(id))) {
               return sendResponse(res, {
                    statusCode: 400,
                    success: false,
                    message: "Invalid issue ID",
               });
          }
          const result = await issueService.getSingleIssueFromDB(Number(id));


          sendResponse(res, {
               statusCode: 200,
               success: true,
               message: "Issue retrieved successfully",
               data: result,
          });
     } catch (error: any) {
          sendResponse(res, {
               statusCode: 500,
               success: false,
               message: error.message,
               error: error

          });
     }
};

const updateIssue = async (req: Request, res: Response) => {
     try {
          const { id } = req.params;


          if (!req.user) {
               return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "User not authenticated",
               });
          }

          const result = await issueService.updateIssueInDB(Number(id), req.user, req.body);

          sendResponse(res, {
               statusCode: 200,
               success: true,
               message: "Issue updated successfully",
               data: result,
          });
     } catch (error: any) {
          sendResponse(res, {
               statusCode: 500,
               success: false,
               message: error.message,
               error: error
          });
     }
}
export const issuesController = {
     createIssues,
     getAllIssues,
     getSingleIssue,
     updateIssue
}
