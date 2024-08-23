import mysql from "mysql2/promise";

const HOST = process.env.DB_HOST;
const USER = process.env.DB_USER;
const PASSWORD = process.env.DB_PASSWORD;
const DATABASE = process.env.DB_DATABASE;



const dbConnect = async () => {
    try {
      const connection = await mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE,
      });
  
      console.log("You have successfully connected to SingleStore.");
      return connection;
    } catch (err) {
      console.error("ERROR", err);
      process.exit(1);
    }
  };
  
  export default dbConnect;
