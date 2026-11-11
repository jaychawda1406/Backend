import express from "express";
import morgan from "morgan";
import paymentRoutes from "../routes/payment.routes.js"
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use("/payments",paymentRoutes);
export default app;