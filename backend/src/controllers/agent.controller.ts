import { Request, Response } from "express";
import { generateAgentCompletion } from "../utils/ai-tools/agent.js";
import { createNote, updateNote, deleteNote } from "../services/note.service.js";

export const chatWithAgent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; 
    const { prompt } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    console.log(userId);
    const agentResult = await generateAgentCompletion(userId, prompt);

    return res.status(200).json({
      success: true,
      ...agentResult
    });

  } catch (error) {
    console.error("Agent error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};