
import { pools } from "../../db";
import type { IUser } from "./auth.interface";

const createUserIntoDB = async (payload: IUser) => {

     const { name, email, password, role } = payload
     if (!name || !email || !password) {
          throw new Error(" name, email, password, role must be required ")
     }

     const result = await pools.query(`
          
          INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
          `, [name, email, password, role])
     delete result.rows[0].password
     return result
}


export const authService = {
     createUserIntoDB
}