import { pools } from "../../db";
import type { Issue } from "./issues.interface"


const createIssueIntoDB = async (reporter_id: number, issueData: Issue) => {
     const { title, description, type } = issueData
     if (!title || !description || !type) {
          throw new Error(" title, description, type must be required ")
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


export const issueService = {

     createIssueIntoDB

} 