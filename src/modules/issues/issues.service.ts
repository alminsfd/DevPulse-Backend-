import type { JwtPayload } from "jsonwebtoken";
import { pools } from "../../db";
import type { IIssueQuery, Issue, IUpdateIssueInput } from "./issues.interface"


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

const getSingleIssueFromDB = async (issueId: number) => {

     const issueResult = await pools.query(
          `SELECT * FROM issues 
     WHERE id = $1`,
          [issueId]
     );

     const issue = issueResult.rows[0];

     if (!issue) {
          throw new Error("Issue not found!");
     }

     const userResult = await pools.query(
          `SELECT id, name, role FROM users WHERE id = $1`,
          [issue.reporter_id]
     );

     const user = userResult.rows[0];


     const { reporter_id, ...restOfIssue } = issue;

     const formattedIssue = {
          ...restOfIssue,
          reporter: user || null,
     };

     return formattedIssue;
};

const updateIssueInDB = async (issueId: number, user: JwtPayload, payload: IUpdateIssueInput) => {
     const { title, description, type } = payload;


     const issueResult = await pools.query(
          `SELECT id, status, reporter_id FROM issues WHERE id = $1`,
          [issueId]
     );
     const issue = issueResult.rows[0];

     if (!issue) {
          throw new Error("Issue not found!");
     }

     if (user.role === "contributor") {
          if (issue.reporter_id !== user.id) {
               throw new Error("You can only update your own issues!");
          }
          if (issue.status !== "open") {
               throw new Error("You can only update issues when they are open!");
          }
     }


     const queryValues: any[] = [];
     const updateFields: string[] = [];

     if (title) {
          queryValues.push(title);
          updateFields.push(`title = $${queryValues.length}`);
     }
     if (description) {
          queryValues.push(description);
          updateFields.push(`description = $${queryValues.length}`);
     }
     if (type) {
          queryValues.push(type);
          updateFields.push(`type = $${queryValues.length}`);
     }


     if (updateFields.length === 0) {
          throw new Error("At least one field must be provided for update");
     }

     queryValues.push(issueId);
     const issueIdPlaceholder = `$${queryValues.length}`;

     const baseQuery = `
    UPDATE issues 
    SET ${updateFields.join(", ")}, updated_at = NOW() 
    WHERE id = ${issueIdPlaceholder}
    RETURNING *;
  `;

     const updateResult = await pools.query(baseQuery, queryValues);

     return updateResult.rows[0];
};



export const issueService = {

     createIssueIntoDB,
     getAllIssuesFromDB,
     getSingleIssueFromDB,
     updateIssueInDB
} 