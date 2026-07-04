import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createSavedSearch,
  getMySavedSearches,
  deleteSavedSearch,
  toggleAlert,
} from "../controllers/savedSearchController.js";

const savedSearchRouter = express.Router();

savedSearchRouter.post("/", userAuth, createSavedSearch);
savedSearchRouter.get("/", userAuth, getMySavedSearches);
savedSearchRouter.delete("/:id", userAuth, deleteSavedSearch);
savedSearchRouter.patch("/:id/toggle-alert", userAuth, toggleAlert);

export default savedSearchRouter;
