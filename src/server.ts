import app from "./app";
import config from "./config";
import { initdb } from "./db";

const main = () => {

     app.listen(config.port, () => {
          initdb()
          console.log(`Example app listening on port ${config.port}`)
     })

}

main()

