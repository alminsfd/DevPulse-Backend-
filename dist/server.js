

import { createRequire } from 'module';

const require = createRequire(import.meta.url);



// src/app.ts
import express from "express";
import CookieParser from "cookie-parser";
import cors from "cors";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connect_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwtkey: process.env.JWTSECRATEKEY
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pools = new Pool({
  connectionString: config_default.connect_string
});
var initdb = async () => {
  await pools.query(`
          CREATE TABLE IF NOT EXISTS  users(
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          email VARCHAR UNIQUE NOT NULL,
          password VARCHAR NOT NULL,
          role VARCHAR DEFAULT 'contributor' CHECK (role IN ('contributor','maintainer')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
          )
          `);
  await pools.query(`             
  
  CREATE TABLE  IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR CHECK (type IN ('bug','feature_request')),
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  reporter_id INT  REFERENCES users(id) ON DELETE CASCADE NOT NULL ,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
`);
  console.log("Database connected successfully!");
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  if (!name || !email || !password) {
    throw new Error(" name, email, password must be required ");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pools.query(`
          
          INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
          `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var checkedUserIntoDb = async (payload) => {
  const { email, password } = payload;
  if (!email || !password) {
    throw new Error(" email, password  must be required ");
  }
  const userData = await pools.query(`
          SELECT * FROM users WHERE email=$1 
          `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Password not valid");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const token = jwt.sign(jwtpayload, config_default.jwtkey, { expiresIn: "1d" });
  return { token, user };
};
var authService = {
  createUserIntoDB,
  checkedUserIntoDb
};

// src/modules/auth/auth.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully ",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var checkUser = async (req, res) => {
  try {
    const result = await authService.checkedUserIntoDb(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  createUser,
  checkUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.createUser);
router.post("/login", authController.checkUser);
var authRouter = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (reporter_id, issueData) => {
  const { title, description, type } = issueData;
  if (!title || !description || !type) {
    throw new Error(" title, description, type must be required ");
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
  } catch (error) {
    throw new Error("Error creating issue");
  }
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  const queryValues = [];
  const filterConditions = [];
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
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
  const formattedIssues = issues.map((issue) => {
    const { reporter_id, ...restOfIssue } = issue;
    return {
      ...restOfIssue,
      reporter: userMap[reporter_id] || null
    };
  });
  return formattedIssues;
};
var getSingleIssueFromDB = async (issueId) => {
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
    reporter: user || null
  };
  return formattedIssue;
};
var updateIssueInDB = async (issueId, user, payload) => {
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
  const queryValues = [];
  const updateFields = [];
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
var deleteIssueFromDB = async (issueId) => {
  const issueCheck = await pools.query(
    `SELECT id FROM issues WHERE id = $1`,
    [issueId]
  );
  if (issueCheck.rows.length === 0) {
    throw new Error("Issue not found!");
  }
  await pools.query(
    `DELETE FROM issues WHERE id = $1`,
    [issueId]
  );
  return true;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    if (!req.user) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "User not authenticated"
      });
    }
    const { id } = req.user;
    const result = await issueService.createIssueIntoDB(id, req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
    }
    const result = await issueService.getSingleIssueFromDB(Number(id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "User not authenticated"
      });
    }
    const result = await issueService.updateIssueInDB(Number(id), req.user, req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    await issueService.deleteIssueFromDB(Number(id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
  ;
};
var issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access!!"
        });
      }
      const decoded = jwt2.verify(token, config_default.jwtkey);
      const userData = await pools.query(
        `
               SELECT * FROM users WHERE email=$1  
                    `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (!user) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: " Unauthorized access-2 !!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden access!!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.maintainer, USER_ROLE.contributor),
  issuesController.updateIssue
);
router2.delete(
  "/:id",
  auth_default(USER_ROLE.maintainer),
  issuesController.deleteIssue
);
var issueRouter = router2;

// src/app.ts
var app = express();
app.get("/", (req, res) => {
  res.status(200).json({
    server: "Devpulse server",
    message: "A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions"
  });
});
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://dev-pulse-backend-six.vercel.app"
  })
);
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
var app_default = app;

// src/server.ts
var main = () => {
  app_default.listen(config_default.port, () => {
    initdb();
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map