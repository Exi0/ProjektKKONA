// ⚠️ Před použitím nainstaluj: npm i helmet express-rate-limit
import express from "express";
import cors from "cors";
import 'dotenv/config';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRouter from './routes/authRoutes.js'
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoutes.js";
import inzeratRouter from "./routes/inzeratRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import conversationRouter from "./routes/conversationRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import verificationRouter from "./routes/verificationRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import { registerCronJobs } from "./config/cron.js";
import testRoutes from "./routes/testRoutes.js";
import statsRouter from "./routes/statsRoutes.js";
import paymentWebhook from "./routes/paymentWebhook.js";
import paymentRouter from "./routes/paymentRouter.js";
import notificationRouter from "./routes/notificationRoutes.js";
import inzeratRequestRouter from "./routes/inzeratRequestRoutes.js";
import dealRouter from "./routes/dealRoutes.js";
import requestRouter from "./routes/requestRoutes.js";
import savedSearchRouter from "./routes/savedSearchRoutes.js";
import {initSocket} from "./config/socket.js";
import {createServer} from "http";
const app = express();

const port = process.env.PORT || 4000
connectDB()

// ✅ FIX: CORS origins z env proměnné, ne natvrdo localhost.
// Do .env přidej např.: ALLOWED_ORIGINS=https://www.tvojedomena.cz,https://tvojedomena.cz
// Při vývoji nech nevyplněné → fallback na localhost.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];
console.log("ALLOWED ORIGINS =", JSON.stringify(allowedOrigins)); // ← temp debug
// ✅ NOVÉ: bezpečnostní HTTP hlavičky
// crossOriginResourcePolicy: "cross-origin" → aby frontend mohl načítat /uploads obrázky
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use("/api/payments/webhook", paymentWebhook); // RAW → musí být nad express.json
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/uploads', express.static('uploads'));

// ✅ NOVÉ: rate limiting
// Přísnější limit na auth (brute-force ochrana hesel a OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 20,                  // max 20 pokusů z jedné IP
  message: { success: false, message: "Příliš mnoho pokusů. Zkuste to za 15 minut." },
  standardHeaders: true,
  legacyHeaders: false,
});
// Obecný limit na celé API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

registerCronJobs();
//API endpointy
app.get('/', (req, res) => res.send('Jedeme!'))
app.use('/api/auth', authLimiter, authRouter)
app.use("/api/stats", statsRouter);
app.use('/api/user', userRouter)
app.use('/api/inzerat', inzeratRouter)
app.use('/api/image', imageRouter)
app.use("/api/conversation", conversationRouter);
app.use("/api/message", messageRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/reports", reportRouter);
app.use("/api/test", testRoutes);
app.use("/api/payments", paymentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/requests", requestRouter);
app.use("/api/inzeratRequest", inzeratRequestRouter);
app.use("/api/deal", dealRouter);
app.use("/api/saved-searches", savedSearchRouter);
// ✅ Centrální error handler
// - plný detail chyby jde jen do server logu (console.error)
// - klientovi se u 5xx posílá generická hláška (žádný únik interních detailů)
// - multer chyby (typ/velikost souboru) mají srozumitelné hlášky → pošleme je
// - handler respektuje err.clientResponse, pokud ho controller nastavil (např. register: type:"reg")
app.use((err, req, res, next) => {
  if (!err) return next();

  console.error(err);

  if (err.clientResponse) {
    return res.status(err.status || 400).json(err.clientResponse);
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || 500;
  const message = status >= 500 ? 'Chyba serveru' : err.message;
  return res.status(status).json({ success: false, message });
});

const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);
httpServer.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});