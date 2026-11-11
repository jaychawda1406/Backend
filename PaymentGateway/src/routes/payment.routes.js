import { Router } from "express";
import productModel from "../models/product.model.js";
import razorpayInstance from "../config/razorpay.js";
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
        amount: product.price,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    })
})
export default router;