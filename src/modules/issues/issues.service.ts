import { pools } from "../../db";
import type { IIssueQuery, Issue } from "./issues.interface"


const createIssueIntoDB = async (reporter_id: number, issueData: Issue) => {
     const { title, description, type } = issueData
     if (!title || !description || !type) {
          throw new Error(" title, description, type must be required ")
     }
     if (description.trim().length < 20) {
          throw new Error("description must be at least 20 characters");
     }
     if (type !== "bug" && type !== "feature_request") {
          throw new Error("type must be either 'bug' or 'feature_request'");
     }
     try {
          const result = await pools.query(
               `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at;
    `,
               [title, description, type, reporter_id]
          );

          return result;
     } catch (error: any) {
          throw new Error("Error creating issue");
     }
}


const getAllIssuesFromDB = async (query: IIssueQuery) => {
     const { sort = "newest", type, status } = query;

     const queryValues: any[] = [];
     const filterConditions: string[] = [];

     if (type) {
          queryValues.push(type);
          filterConditions.push(`type = $${queryValues.length}`);
     }
     if (status) {
          queryValues.push(status);
          filterConditions.push(`status = $${queryValues.length}`);
     }

     let baseQuery = `SELECT * FROM issues`;

     if (filterConditions.length > 0) {
          baseQuery += ` WHERE ` + filterConditions.join(" AND ");
     }

     const orderDirection = sort === "oldest" ? "ASC" : "DESC";
     baseQuery += ` ORDER BY created_at ${orderDirection}`;

     const issueResult = await pools.query(baseQuery, queryValues);
     const issues = issueResult.rows;
     if (issues.length === 0) {
          return [];
     }

     const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
     const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(", ");
     const userQuery = `SELECT id, name, role FROM users WHERE id IN (${placeholders})`;
     const userResult = await pools.query(userQuery, reporterIds);
     const users = userResult.rows;
     const userMap = users.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
     }, {});

     const formattedIssues = issues.map((issue) => {
          const { reporter_id, ...restOfIssue } = issue;
          return {
               ...restOfIssue,
               reporter: userMap[reporter_id] || null,
          };
     });

     return formattedIssues;





}



export const issueService = {

     createIssueIntoDB,
     getAllIssuesFromDB

} 