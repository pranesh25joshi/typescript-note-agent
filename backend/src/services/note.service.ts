import { prisma } from "../lib/prisma.js";

export const createNote = async (userId: string, content: string) => {
  return await prisma.note.create({
    data: {
      content,
      userId,
      updatedAt: new Date(),
    },
  });
};

export const updateNote = async (userId: string, noteId: string, content?: string, isCompleted?: boolean) => {
  const existingNote = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existingNote || existingNote.userId !== userId) {
    throw new Error("Note not found or unauthorized");
  }

  return await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(content && { content }),
      ...(isCompleted !== undefined && { isCompleted }),
      updatedAt: new Date(),
    },
  });
};

export const deleteNote = async (userId: string, noteId: string) => {
  const existingNote = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existingNote || existingNote.userId !== userId) {
    throw new Error("Note not found or unauthorized");
  }

  return await prisma.note.delete({
    where: { id: noteId },
  });
};


export const getUserNotes = async(userId :string) => {
    const notes = await prisma.note.findMany({
        where : {
            userId : userId
        },
        select: { id: true, content: true, isCompleted: true }
    })

    return notes;
}