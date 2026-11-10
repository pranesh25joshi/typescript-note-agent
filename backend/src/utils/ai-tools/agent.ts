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
    
    const SYSTEM_PROMPT  = process.env.SYSTEM_PROMPT as string;
    const systemPromptPlusUserPrompt = SYSTEM_PROMPT.replace("{{USER_NOTES}}", JSON.stringify(userNotes)).replace("{{USER_PROMPT}}", prompt);
    
    console.log(systemPromptPlusUserPrompt);
    // we did this for context awareness , because earlier when we have seperated the system prompt and user prompt from the each other and provided them individual roles then the ai model heavily focused on user prompt and tends to neglect the system prompt, this leads ai to just forgot the system prompt and forgot the instruction and fetched notes data and therefore forgeting the notes id even though it has a context of it in system prompt, so to avoid that we mixed the system and user prompt and send this as a whole to the ai irrespective of role, this leads the ai to focus on the user prompt and generates the required expected output, this process is called context injection.

    // we forced the AI to read the records sequentially in its primary attention window. When it reached your command the notes UUID was already locked into its active memory, allowing it to seamlessly execute the tool call.

    const completion = await Aiclient.chat.completions.create({
    model: process.env.AI_MODEL as string, 
    messages: [
        { 
            role: "user",
            content: systemPromptPlusUserPrompt 
        }
    ],
    tools: noteTools,
    tool_choice: "auto",
  });

  const message = completion.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
      const executionResults = [];

      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          const args = JSON.parse(toolCall.function.arguments);
          const toolName = toolCall.function.name;
          
          try {
            let dbResult;
            switch (toolName) {
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
                throw new Error(`Tool ${toolName} is not implemented.`);
            }

            executionResults.push({
              action: toolName,
              status: "success",
              data: dbResult
            });

          } catch (error: any) {
            console.error(`[Tool Execution Failed] ${toolName}:`, error.message);
            
            executionResults.push({
              action: toolName,
              status: "failed",
              error: error.message
            });
          }
        }
      }

      return {
        isToolCall: true,
        results: executionResults 
      };
    }
  };

