import express from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
const app = express();

app.use(express.json());

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const user = await userModel.create({
        email, name, password
    });

    const token = jwt.sign({
        id: user._id
    }, "19032168f342f4ace5c7747872ff3915c9871520c27a3bac04ab6cd116593b9d");

    res.status(201).json({
        message: "User created Successfully",
        data: {
            user: {
                name,
                email,
                id: user._id
            },
            token
        }
    });
});

app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.header.authorization;
    const data = jwt.decode(authHeader.split(" ")[1]);
    
})

export default app;