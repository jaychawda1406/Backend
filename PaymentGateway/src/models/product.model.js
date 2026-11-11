import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        price: {
            amount: {
                type: Number,
                required: true
            },
            currency: {
                type: String,
                default: "INR"
            }
        }
    },

)

const Product = mongoose.model("Product", productSchema);
export default Product