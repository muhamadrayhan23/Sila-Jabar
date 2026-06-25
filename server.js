const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3000;

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN || "missing_token",
});

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// endpoint untuk chat
app.post("/chat", async (req, res) => {
    const { message } = req.body;
    console.log("Pesan diterima:", message);

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
        console.error("Error dari Hugging Face:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
