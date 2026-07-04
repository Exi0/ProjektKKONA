import Stripe from "stripe";
import PaymentModel from "../models/paymentModel.js";
import userModel from "../models/userModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckout = async (req, res) => {
  console.log("start")
  try {
    const { type, targetUserId } = req.body;
    const userId = req.userId;
    console.log(userId)
    console.log(type)
    console.log(targetUserId)
    if (!["unlock_profile", "subscription"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    // ceny v haléřích
    const PRICE_UNLOCK = 4900;      // 49 Kč
    const PRICE_SUB_MONTH = 29900;  // 299 Kč

    const amount = type === "unlock_profile"
        ? PRICE_UNLOCK
        : PRICE_SUB_MONTH;

    // 1) vytvoř payment record v DB
    const payment = await PaymentModel.create({
      user: userId,
      targetUserId: type === "unlock_profile" ? targetUserId : null,
      type,
      amount,
      currency: "CZK",
      status: "pending",
      provider: "stripe"
    });

    console.log(payment)
    // 2) vytvoř Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: {
              name:
                type === "unlock_profile"
                  ? "Odemknutí profilu na AgroZakázky"
                  : "Předplatné Premium (30 dní)"
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment._id.toString()
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
    });
    console.log(session)
    // 3) ulož Stripe session ID
    payment.providerPaymentId = session.id;
    await payment.save();

    return res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("createCheckout error:", err);
    return res.status(500).json({ success: false, message: "Payment creation failed" });
  }
};

export const createSubscriptionCheckout = async (req, res) => {
  console.log("start subcription")
  try {
    const userId = req.userId;
    console.log(userId)
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    // Price ID ze Stripe Dashboard (Recurring, Monthly)
    const PRICE_ID = process.env.STRIPE_SUB_PRICE_ID;

    if (!PRICE_ID) {
      return res.status(500).json({
        success: false,
        message: "Missing STRIPE_SUB_PRICE_ID env variable"
      });
    }

    // 1) vytvoř payment record v DB
    const payment = await PaymentModel.create({
      user: userId,
      type:"subscription",
      amount:1111,
      currency: "CZK",
      status: "pending",
      provider: "stripe"
    });
    console.log(payment)
    // 🧠 Subscription jde přes mode: "subscription"
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: PRICE_ID,
          quantity: 1
        }
      ],

      // ✅ FIX: metadata na úrovni session → webhook (checkout.session.completed)
      // může označit payment jako "paid"
      metadata: {
        paymentId: payment._id.toString()
      },

      // metadata pro subscription → webhook (invoice.payment_succeeded)
      // má userId i při obnovách předplatného
      subscription_data: {
        metadata: {
          userId
        }
      },

      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
    });

    // 3) ulož Stripe session ID
    // ✅ FIX: status zůstává "pending" – na "paid" ho přepne až webhook,
    // teprve když Stripe potvrdí, že uživatel skutečně zaplatil.
    payment.providerPaymentId = session.id;
    await payment.save();

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create subscription checkout"
    });
  }
};
