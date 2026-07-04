import express from "express";
import userAuth from "../middleware/userAuth.js";
import { createCheckout,createSubscriptionCheckout } from "../controllers/paymentController.js";

const router = express.Router();

// ✔️ Vytvoření Stripe Checkout session
router.post("/createCheckout", userAuth, createCheckout);
router.post("/create-subscription-checkout", userAuth, createSubscriptionCheckout);

export default router;
