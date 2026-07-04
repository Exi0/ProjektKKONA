import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  proposeTerms,
  confirmTerms,
  markComplete,
  confirmCompletion,
  disputeDeal,
  rateDealParticipant,
} from "../controllers/dealController.js";

const dealRouter = express.Router();

// Navrhnout podmínky (cena, datum, poznámka)
dealRouter.post("/propose-terms", userAuth, proposeTerms);

// Potvrdit podmínky (druhá strana)
dealRouter.post("/confirm-terms", userAuth, confirmTerms);

// Označit práci jako hotovou
dealRouter.post("/mark-complete", userAuth, markComplete);

// Potvrdit dokončení (druhá strana)
dealRouter.post("/confirm-completion", userAuth, confirmCompletion);

// Nahlásit spor
dealRouter.post("/dispute", userAuth, disputeDeal);

// Ohodnotit protistranu (jen po dokončení)
dealRouter.post("/rate", userAuth, rateDealParticipant);

export default dealRouter;
