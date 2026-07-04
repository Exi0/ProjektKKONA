import express from "express";
import adminAuth from "../middleware/adminAuth.js"; // udělej jako kopii userAuth s kontrolou role
import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "../controllers/userController.js";

const verificationRouter = express.Router();

// admin si stáhne seznam pending users
verificationRouter.get("/pendingVerifications", adminAuth, getPendingVerifications);

// admin schválí
verificationRouter.post("/approveVerification/:id", adminAuth, approveVerification);

// admin zamítne
verificationRouter.post("/rejectVerification/:id", adminAuth, rejectVerification);

export default verificationRouter;