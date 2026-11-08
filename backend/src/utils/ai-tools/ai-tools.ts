import { ChatCompletionTool } from "openai/resources/index.mjs";

export const noteTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Creates a new note or to-do item for the user.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The text content of the note." },
        },
        required: ["content"],
        additionalProperties: false
      },
    }
  },
  {
    type: "function",
    function: {
      name: "update_note",
      description: "Updates an existing note's content or completion status.",
      parameters: {
        type: "object",
        properties: {
          noteId: { type: "string", description: "The UUID of the note to update." },
          content: { type: "string", description: "The new text content." },
          isCompleted: { type: "boolean" },
        },
        required: ["noteId"],
        additionalProperties: false
      },
    }
  },
  {
    type: "function",
    function: {
      name: "delete_note",
      description: "Deletes a specific note.",
      parameters: {
        type: "object",
        properties: {
          noteId: { type: "string", description: "The UUID of the note to delete." },
        },
        required: ["noteId"],
        additionalProperties: false
      },
    }
  }
];