import { Router } from "express";
import productModel from "../models/product.model.js";
import razorpayInstance from "../config/razorpay.js";
import paymentModel from "../models/payment.model.js";
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils.js';
import config from "../config/config.js";
const router = Router()

// POST /api/payment/:productId/order
router.post("/:productId/order", async (req, res) => {
    const { productId } = req.params;
    const product = await productModel.findById(productId);
    if (!product) {
        return res.status(404).json({
            message: "Product Not found"
        })
    }
    const order = await razorpayInstance.orders.create({
        amount: product.price.amount * 100,
        currency: product.price.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
            productId: productId,
            productTitle: product.title,
        }
    })
    const payment = (await paymentModel.create({
        orderId: order.id,
        productId: productId,
        amount: product.price.amount,
        currency: product.price.currency,
        status: "Pending",
    })).toObject();
    res.status(201).json({ ...payment, keyId: razorpayInstance.key_id })
})

// POST /api/payments/:orderId/verify
router.post("/verify", async (req, res) => {

    const { orderId, paymentId, signature } = req.body


    const payment = await paymentModel.findOne({
        orderId: orderId,
        status: "Pending"
    })
    if (!payment) {
        res.status(404).json({
            message: "Payment not found",
        })
    }

    const isValid = validatePaymentVerification({
        order_id: orderId,
        payment_id: paymentId,

    }, signature, config.RAZORPAY_KEY_SECRET)

    if (!isValid) {
        return res.status(400).json({
            message: "Invalid Payment"
        })
    }
    await paymentModel.updateOne(
        { orderId: orderId },
        {
            $set: {
                status: "completed",
                paymentId: paymentId,
                signature: signature
            }
        }
    )
    res.status(201).json({
        message: "Payment verified successfully"
    })
})


export default router;