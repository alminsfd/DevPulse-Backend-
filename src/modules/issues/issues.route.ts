import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router()

router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues)
router.get("/", issuesController.getAllIssues)
router.get("/:id", issuesController.getSingleIssue);
router.patch(
     "/:id",
     auth(USER_ROLE.maintainer, USER_ROLE.contributor),
     issuesController.updateIssue
);

export const issueRouter = router