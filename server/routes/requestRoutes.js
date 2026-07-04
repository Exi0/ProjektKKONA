import express from "express";
import {
  getPendingProfileRequests,
  getProfileRequestDetail,approveProfileChange,rejectProfileChange
} from "../controllers/ProfileChangeController.js";
import adminAuth from "../middleware/adminAuth.js"; 

const requestRouter = express.Router();

requestRouter.get("/profilechangelist", adminAuth, getPendingProfileRequests);
requestRouter.get("/profilechangedetail/:changeId", adminAuth, getProfileRequestDetail);
requestRouter.post("/profilechangedetail/:changeId/approve", adminAuth, approveProfileChange);
requestRouter.post("/profilechangedetail/:changeId/reject", adminAuth, rejectProfileChange);

export default requestRouter;
