import express from "express";
import Stripe from "stripe";
import PaymentModel from "../models/paymentModel.js";
import userModel from "../models/userModel.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("⚡ WEBHOOK EVENT:", event.type);

    // ✅ FIX: celé zpracování v try/catch – při chybě DB vrátíme 500
    // a Stripe event automaticky zopakuje (dříve mohl request spadnout bez odpovědi)
    try {
      // -------------------------------------------------------------------
      // 1️⃣ CHECKOUT DOKONČEN (one-time platby I subscription)
      // -------------------------------------------------------------------
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.metadata?.paymentId) {
          const payment = await PaymentModel.findById(session.metadata.paymentId);

          if (payment) {
            if (payment.status !== "paid") {
              payment.status = "paid";
              await payment.save();
            }

            if (payment.type === "unlock_profile") {
              await userModel.findByIdAndUpdate(
                payment.user,
                { $addToSet: { unlockedProfiles: payment.targetUserId } },
                { new: true }
              );
              console.log("✔️ UNLOCK ADDED:", payment.user.toString());
            }
            // payment.type === "subscription" → samotnou aktivaci řeší
            // invoice.payment_succeeded níže, tady jen označíme platbu jako paid
          } else {
            console.log("⚠️ Payment not found:", session.metadata.paymentId);
          }
        }
      }

      // -------------------------------------------------------------------
      // 2️⃣ AKTIVACE / OBNOVA SUBSCRIPTION
      // -------------------------------------------------------------------
      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object;

        // subscription metadata je v invoice.lines.data[0].metadata
        const line = invoice.lines.data[0];
        const userId = line?.metadata?.userId;

        if (userId) {
          const expiresAt = new Date(line.period.end * 1000);

          await userModel.findByIdAndUpdate(userId, {
            subscription: {
              hasSubscription: true,
              type: "premium",
              expiresAt,
              stripeSubscriptionId: invoice.subscription
            }
          });

          console.log("✔️ SUBSCRIPTION ACTIVE FOR USER:", userId, "EXP:", expiresAt);
        } else {
          console.log("⚠️ No userId found in invoice metadata");
        }
      }

      // -------------------------------------------------------------------
      // 3️⃣ ✅ NOVÉ: ZRUŠENÍ SUBSCRIPTION (uživatel zrušil / Stripe ukončil)
      // -------------------------------------------------------------------
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;

        const result = await userModel.findOneAndUpdate(
          { "subscription.stripeSubscriptionId": subscription.id },
          {
            subscription: {
              hasSubscription: false,
              type: "none",
              expiresAt: null,
              stripeSubscriptionId: ""
            }
          },
          { new: true }
        );

        if (result) {
          console.log("✔️ SUBSCRIPTION CANCELLED FOR USER:", result._id.toString());
        } else {
          console.log("⚠️ No user found for cancelled subscription:", subscription.id);
        }
      }

      // -------------------------------------------------------------------
      // 4️⃣ ✅ NOVÉ: NEÚSPĚŠNÁ PLATBA OBNOVY (např. expirovaná karta)
      // Subscription nechá na Stripe retry logice, jen zalogujeme.
      // -------------------------------------------------------------------
      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;
        console.log("⚠️ SUBSCRIPTION PAYMENT FAILED, subscription:", invoice.subscription);
      }

      // -------------------------------------------------------------------
      // HOTOVO
      // -------------------------------------------------------------------
      return res.status(200).send("received");
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
      // 500 → Stripe pošle event znovu (retry), takže o platbu nepřijdeme
      return res.status(500).send("Webhook processing failed");
    }
  }
);

export default router;
