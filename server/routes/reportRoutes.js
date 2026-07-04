import express from "express";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import { createReport, deleteReport,getReports } from "../controllers/reportController.js";

const reportRouter = express.Router();

// uživatel nahlásí jiného
reportRouter.post("/create", userAuth, createReport);
// admin – správa
reportRouter.get("/all", adminAuth, getReports);
reportRouter.delete("/delete/:id", adminAuth, deleteReport);
export default reportRouter;
