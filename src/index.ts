import express from 'express'
import userRouter from './routers/user'
import authRouter from './routers/auth'
import authInfoRouter from './routers/authinfo'
import path from 'path'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import {authJwt} from "./middleware/jwtauth"
import {authUser} from "./middleware/userauth"
import mysql from 'mysql2'

const PORT = process.env.PORT ?? 5001

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  }).promise()
/*

*/
const createTablesIfNotExists = async () => {
    const createAuthTableQuery = `
    CREATE TABLE IF NOT EXISTS userauth( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        salt VARBINARY(16) NOT NULL,
        last_login TIMESTAMP NULL DEFAULT NULL
    );
    `;
    const createUserTableQuery =`
    CREATE TABLE IF NOT EXISTS users( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        name VARCHAR(20) NOT NULL,
        email VARCHAR(255)  UNIQUE NOT NULL,
        bio TEXT
    );
    `;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute(createAuthTableQuery)
    await connection.execute(createUserTableQuery)
    console.log("Table created or already exists")
  } catch (error){
    console.error("Error Creating Table",error)
  } finally {
    if(connection){
        connection.release()
    }
  }
}  
const startServer = async() => {
await createTablesIfNotExists();



const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.use('/api/authinfo',authJwt, authInfoRouter)
app.use('/api/user', authJwt, authUser,(req,res) =>{userRouter})

/**
 * Exercise:
 * Implement a new data model and corresponding API. At the end of the day you should
 * create a model that interests you, and progresses your project in some way, but if
 * you can't think of anything, try creating a model for a collection of books which
 * may have the following properties:
 *  - ISBN
 *  - title
 *  - author
 *  - etc...
 * and lives at /api/book
 *
 * Whatever you decide be sure to implement the full set of POST, GET, PUT, and DELETE
 * operations assuming that makes sense in your case.
 */

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) })
}

startServer()
