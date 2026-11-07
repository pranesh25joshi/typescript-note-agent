import bcrypt from "bcrypt";
import { RegisterInput } from "../../validations/auth.schema.js";


export const hashedPassword =async (password:string)=>{ 
    return await bcrypt.hash(password , 12);
}

export const comparePassword = async (password:string, hashedPassword : string) => {
    return await bcrypt.compare(password,hashedPassword);
}


