const express = require("express");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
const path = require("path");
const OpenAI = require("openai");

// Load env (Netlify usually provides env vars; .env is for local dev)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();

app.use(express.json());


const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN || "missing_token",
});

app.post("/chat", async (req, res) => {
    const { message } = req.body || {};

    try {
        const stream = await client.chat.completions.create({
            model: "deepseek-ai/DeepSeek-V4-Flash:novita",
            messages: [{ role: "user", content: message }],
            stream: true,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.end();
    } catch (error) {
        console.error("Error dari Hugging Face:", error?.message || error);
        res.status(500).json({ error: error?.message || String(error) });
    }
});

// Netlify expects module.exports.handler
module.exports.handler = serverless(app);

