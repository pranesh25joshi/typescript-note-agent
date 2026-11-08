// src/types/express.d.ts

// This empty export is necessary to make this file a module so global augmentation works
export {}; 

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}