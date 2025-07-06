import { Router } from "express";
import { storage } from "../storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";

const router = Router();

// Create chat session
router.post("/sessions", async (req, res) => {
  try {
    const sessionData = insertChatSessionSchema.parse(req.body);
    const session = await storage.createChatSession(sessionData);
    res.json(session);
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: "Failed to create chat session" });
  }
});

// Get a session
router.get("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const session = await storage.getChatSession(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  } catch (error) {
    console.error("Get Session Error:", error);
    res.status(500).json({ message: "Failed to get chat session" });
  }
});

// Get messages in session
router.get("/sessions/:id/messages", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const messages = await storage.getSessionMessages(sessionId);
    res.json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Failed to get messages" });
  }
});

// Create message
router.post("/messages", async (req, res) => {
  try {
    const messageData = insertMessageSchema.parse(req.body);
    const message = await storage.createMessage(messageData);
    res.json(message);
  } catch (error) {
    console.error("Create Message Error:", error);
    res.status(500).json({ message: "Failed to create message" });
  }
});

export default router;