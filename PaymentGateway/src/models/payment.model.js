import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        paymentId: {
            type: String
        },
        signature: {
            type: String
        },
        amount: {
            type: Number,
            required: true
        }, // in paise
        currency: {
            type: String,
            default: "INR"
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        }
    },
    { timestamps: true }
);

const payment =  mongoose.model("payment", paymentSchema);
export default payment;