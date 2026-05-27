import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

const createIssues = async (req: Request, res: Response) => {
     const result = await issueService.createIssueIntoDB(req.headers.authorization);
     sendResponse(res, {
          statusCode: 201,
          success: true,
          message: "User registered successfully ",
          data: result.rows[0],
     })
}

export const issuesController = {
     createIssues
}