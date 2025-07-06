import { Router } from "express";
import { z } from "zod";
import { searchTonerWebProducts } from "../perplexity";

const router = Router();

// ---------- Schemas ----------
const aiRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(["DeepSearch", "Think"]),
  image: z.string().optional(), // base64 image data
});

type AIRequest = z.infer<typeof aiRequestSchema>;

// ---------- Routes ----------
router.post("/chat", async (req, res) => {
  try {
    const { message, mode, image } = aiRequestSchema.parse(req.body) as AIRequest;
    const response = await searchTonerWebProducts(message, mode, image);
    res.json({ content: response });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request data",
        error: "Please check your request format",
        details: error.errors,
      });
    }
    console.error("AI Chat Error:", error);
    res.status(500).json({
      message: "Failed to process AI request",
      error: error?.message ?? "Unknown error",
    });
  }
});

// Placeholder image generation route (kept for future feature parity)
router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }
  res.json({ message: "Image generation feature is coming soon!", prompt });
});

// Placeholder news route
router.get("/news", async (req, res) => {
  const { query } = req.query;
  res.json({ message: "Latest news feature is coming soon!", query: query || "general" });
});

export default router;