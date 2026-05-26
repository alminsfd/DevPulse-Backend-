import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
     path: path.join(process.cwd(), ".env")
})

const config = {
     connect_string: process.env.CONNECTION_STRING as string,
     port: process.env.PORT,
     jwtkey: process.env.JWTSECRATEKEY

}

export default config