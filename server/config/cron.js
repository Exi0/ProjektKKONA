import cron from "node-cron";
import { sendWeeklyDigest } from "../services/digestService.js";
import userModel from "../models/userModel.js";
import { processSavedSearches } from "../services/savedSearchMatcher.js";
export const registerCronJobs = () => {
  // 📨 Týdenní digest – každé pondělí 8:00
  cron.schedule("0 8 * * 1", async () => {
    console.log("📨 Spouštím týdenní digest...");
    try {
      await sendWeeklyDigest();
    } catch (err) {
      console.error("❌ Chyba při odesílání digestu:", err);
    }
  });
  cron.schedule("0 7 * * *", async () => {
    console.log("🔔 Kontroluji uložená hledání...");
    try { await processSavedSearches(); }
    catch (err) { console.error("❌ Saved search error:", err); }
  });
  // ✅ NOVÉ: každý den ve 3:00 deaktivuj expirovaná předplatná.
  // Pojistka pro případ, že by webhook customer.subscription.deleted nedorazil.
  cron.schedule("0 3 * * *", async () => {
    try {
      const result = await userModel.updateMany(
        {
          "subscription.hasSubscription": true,
          "subscription.expiresAt": { $lt: new Date() }
        },
        {
          $set: {
            "subscription.hasSubscription": false,
            "subscription.type": "none"
          }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`⏰ Deaktivováno ${result.modifiedCount} expirovaných předplatných`);
      }
    } catch (err) {
      console.error("❌ Chyba při deaktivaci předplatných:", err);
    }
  });
};
