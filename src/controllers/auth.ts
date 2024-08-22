import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'
import mysql, { RowDataPacket } from 'mysql2'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import jwt, {JwtPayload, Secret} from 'jsonwebtoken'


dotenv.config()

const secret: Secret = ""+process.env.JWT_SECRET+""

if(!secret){
    throw new Error("Missing JWT_SECRET in Environment variables")
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise()

type email = string

export interface User extends RowDataPacket{
  id?: number
  username: string
  password_hash: string
  created_at: string
  updated_at: string
  salt: Buffer
  last_login: string
  adminlevel: number
};

interface CustomeJWTPayload extends JwtPayload{
    exp?: number
}

//Joi min and max 2 for place
const UserSchema = Joi.object<User>({
  id: Joi.number().optional(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
})

const AuthSchema = Joi.object<User>({
    id: Joi.number().optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    newpassword: Joi.string().optional()
  })

export async function hashPassword(password: string, salt: Buffer): Promise<string>{
    return new Promise ((resolve, reject) =>{
        crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) =>{
            if(err){
                reject(err);
            } else {
                resolve(derivedKey.toString('hex'))
            }
        })
    })
}

export async function verifyPassword(password: string, savedSalt: Buffer, savedHash: string):Promise<boolean>{
    const salt = savedSalt

    return new Promise((resolve,reject) =>{
        crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) =>{
            if(err){
                reject(err);
            } else{ 
                const hashedPassword = derivedKey.toString('hex')
                resolve(hashedPassword === savedHash)
            }
        })
    }) 
}


export async function createUserAuth(req:Request, res:Response){
    const {error, value} = UserSchema.validate(req.body)
    
    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }
    const username = value.username
    const password = value.password
    const salt = crypto.randomBytes(16)
    
    try{
        const hashedPassword = await hashPassword(password,salt);
        const name = value.name;
        const email = value.email;
    
        
        //const user_id = (userInfo as any).insertId
        
        const insertQuery = 'INSERT INTO userauth (username,password_hash,salt) VALUES (?,?,?)';
        const [result] = await pool.execute(insertQuery, [username,hashedPassword,salt]);

        //Need to get id of new user
        const getIdQuery = 'SELECT * FROM userauth WHERE username = ?'
        const [userIdInfo] = await pool.execute(getIdQuery,[username]);
        const user: User[] = userIdInfo as User[]
        console.log(user[0].id)
        //Create entry into user table
        const insertUser = 'INSERT INTO users (id,name,email) VALUES (?,?,?)'
        const [userInfo] = await pool.execute(insertUser,[user[0].id,name,email]);

        res.status(200).json(rest.success("User Created"))
        return 
    } catch(error){
        console.error("Error:",error);
        return res.status(500).json(rest.error("Database Error"))
    }

}

export async function authUser(req:Request, res:Response){
    
    const {error, value} = AuthSchema.validate(req.body)
    const username = value.username
    const password = value.password

    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }

    const getQuery = 'SELECT * FROM userauth WHERE username = ?'
    const [getResult] = await pool.execute<RowDataPacket[]>(getQuery,[username]);

    const users: User[] = getResult as User[];
    
    if(users.length === 0){
        return res.status(400).json(rest.error('No Such User Exists'))
    }

    const passwordhash = getResult.map(row => row.password_hash)
    const salt = getResult.map(row => row.salt)
    const userId = getResult.map(row => row.id)
    const adminlevel = getResult.map(row => row.adminlevel)[0]
    const logIn = await verifyPassword(password,salt[0],passwordhash[0])
    
    const getUserInfo = 'SELECT * FROM users WHERE id = ?'
    const [getInfo] = await pool.execute<RowDataPacket[]>(getUserInfo,[userId[0]])
    const userI = getInfo.map(row => row.name)
    const userInfo = {
        id: userId[0],
        username: username
    }

    if(logIn === true){
        
        const token = jwt.sign(userInfo,secret,{expiresIn: "10h"})
        const decoded = jwt.decode(token) as CustomeJWTPayload
        const expiry = decoded.exp ?? 0
        
        res.cookie('token', token,{
            httpOnly: true,
            secure: true, 
            sameSite: 'none'
        })
        res.status(200).json({authenticated: true, name: userI[0], adminlevel: adminlevel ,expiry: expiry})
        return 
    } else {
        return res.status(400).json(rest.error('Invalid Username or Password'))
    }
}