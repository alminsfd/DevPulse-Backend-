import { Pool } from 'pg'
import config from '../config'
export const pools = new Pool({
     connectionString: config.connect_string
})

export const initdb = async () => {

     await pools.query(`
          CREATE TABLE IF NOT EXISTS  users(
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          email VARCHAR UNIQUE NOT NULL,
          password VARCHAR NOT NULL,
          role VARCHAR DEFAULT 'contributor' CHECK (role IN ('contributor','maintainer')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
          )
          `)

     await pools.query(`             
  
  CREATE TABLE  IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR CHECK (type IN ('bug','feature_request')),
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  reporter_id INT  REFERENCES users(id) ON DELETE CASCADE NOT NULL ,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
`)
     console.log("Database connected successfully!");

}