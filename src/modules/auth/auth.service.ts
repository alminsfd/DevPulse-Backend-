import config from "../../config";
import { pools } from "../../db";
import type { ILogin, IUser } from "./auth.interface";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
const createUserIntoDB = async (payload: IUser) => {

     const { name, email, password, role } = payload
     if (!name || !email || !password) {
          throw new Error(" name, email, password must be required ")
     }
     const hashPassword = await bcrypt.hash(password, 10)
     const result = await pools.query(`
          
          INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
          `, [name, email, hashPassword, role])
     delete result.rows[0].password
     return result
}

const checkedUserIntoDb = async (payload: ILogin) => {

     const { email, password } = payload
     if (!email || !password) {
          throw new Error(" email, password  must be required ")
     }

     const userData = await pools.query(`
          SELECT * FROM users WHERE email=$1 
          `, [email])

     if (userData.rows.length === 0) {
          throw new Error("Invalid Credentials!")
     }

     const user = userData.rows[0]
     const isPasswordValid = await bcrypt.compare(password, user.password)
     if (!isPasswordValid) {
          throw new Error("Password not valid")
     }
     const jwtpayload = {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
     };

     const token = jwt.sign(jwtpayload, config.jwtkey as string, { expiresIn: "1d" })
     return { token, user }

}

export const authService = {
     createUserIntoDB,
     checkedUserIntoDb
}