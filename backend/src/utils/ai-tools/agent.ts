import OpenAI from "openai";
import { noteTools } from "./ai-tools.js";
import { createNote, updateNote, deleteNote } from "../../services/note.service.js";
import {getUserNotes} from "../../services/note.service.js";

export const Aiclient = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
    baseURL : process.env.BASE_URL,
});


export const generateAgentCompletion = async (userId : string , prompt: string) => {

    const userNotes = await getUserNotes(userId);
    console.log(userNotes);
    const systemPromptPlusUserPrompt = `
      You are a note management AI agent. 
      
      Here is the JSON list of the user's current notes: 
      ${JSON.stringify(userNotes)}
      
      Instructions: If the user asks to update or delete a note, find the matching note in the list above and use its exact 'id' for your tool calls.
      
      User Request: "${prompt}"
    `;
    // we did this for context awareness , because earlier when we have seperated the system prompt and user prompt from the each other and provided them individual roles then the ai model hevely focused on user prompt and tends to neglect the system prompt, this 

    const completion = await Aiclient.chat.completions.create({
    model: process.env.AI_MODEL as string, 
    messages: [
        {
            role:"system", 
            content:systemPromptPlusUserPrompt
        },
        { 
            role: "user", 
            content: prompt 
        }
    ],
    tools: noteTools,
    tool_choice: "auto",
  });

  const message = completion.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    
    if (toolCall.type === "function") {
      const args = JSON.parse(toolCall.function.arguments);
      let dbResult;

      switch (toolCall.function.name) {
        case "create_note":
          dbResult = await createNote(userId, args.content);
          break;
        case "update_note":
          dbResult = await updateNote(userId, args.noteId, args.content, args.isCompleted);
          break;
        case "delete_note":
          dbResult = await deleteNote(userId, args.noteId);
          break;
        default:
          throw new Error("Unknown tool called");
      }

      return {
        isToolCall: true,
        action: toolCall.function.name,
        data: dbResult
      };
    }
  }

  return {
    isToolCall: false,
    message: message.content
  };
};

