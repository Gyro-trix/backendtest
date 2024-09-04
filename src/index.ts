import express from 'express'
import userRouter from './routers/user'
import authRouter from './routers/auth'
import authInfoRouter from './routers/authinfo'
import storageRouter from './routers/storage'
import itemRouter from './routers/items'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import {authJwt} from "./middleware/jwtauth"
import {authUser} from "./middleware/userauth"
import mysql from 'mysql2'
import cors from 'cors'

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
        last_login TIMESTAMP NULL DEFAULT NULL,
        adminlevel INT NOT NULL DEFAULT 0
    );
    `;
    const createUserTableQuery =`
    CREATE TABLE IF NOT EXISTS users( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        name VARCHAR(20) NOT NULL,
        email VARCHAR(255)  UNIQUE NOT NULL,
        bio TEXT,
        FOREIGN KEY (id) REFERENCES userauth(id) 
    );
    `;
    const createStoragesTableQuery =`
    CREATE TABLE IF NOT EXISTS storages( 
        id INT UNIQUE PRIMARY KEY,
        image VARCHAR(255),
        location VARCHAR(20) NOT NULL,
        name VARCHAR(20) NOT NULL,
        owner INT NOT NULL,
        type VARCHAR(20),
        share BOOLEAN,
        FOREIGN KEY (owner) REFERENCES userauth(id) 
    );
    `;
    const createItemTableQuery =`
    CREATE TABLE IF NOT EXISTS items( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        quantity INT NOT NULL,
        name VARCHAR(20) NOT NULL,
        size VARCHAR(20) NOT NULL,
        storageid INT NOT NULL,
        expiry DATETIME,
        FOREIGN KEY (storageid) REFERENCES storages(id) 
    );
    `;
    const createFriendsTableQuery =`
    CREATE TABLE IF NOT EXISTS friends( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES userauth(id) 
    );
    `;
    const createInvitesTableQuery =`
    CREATE TABLE IF NOT EXISTS invites( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        owner_id INT NOT NULL,
        target_id INT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES userauth(id) 
    );
    `;
    const createRecipesTableQuery =`
    CREATE TABLE IF NOT EXISTS recipes( 
        id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
        owner_id INT NOT NULL,
        content TEXT,
        title VARCHAR(128) NOT NULL,
        subtitle VARCHAR(128) NOT NULL,
        decription VARCHAR(128) NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES userauth(id) 
    );
    `;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute(createAuthTableQuery)
    await connection.execute(createUserTableQuery)
    await connection.execute(createStoragesTableQuery)
    await connection.execute(createItemTableQuery)
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

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.use('/api/storage',authJwt, storageRouter)
app.use('/api/items',authJwt, itemRouter)
app.use('/api/authinfo',authJwt, authInfoRouter)
app.use('/api/user', authJwt, authUser,(req,res) =>{userRouter})

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) })
}

startServer()
