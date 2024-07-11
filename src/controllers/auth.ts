import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'
import mysql, { RowDataPacket } from 'mysql2'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import jwt, {Secret} from 'jsonwebtoken'


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
  password: string
  name: string
  email: string
  place: string
}

//Joi min and max 2 for place
const UserSchema = Joi.object<User>({
  id: Joi.number().optional(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  place: Joi.string().required(),
})

const AuthSchema = Joi.object<User>({
    id: Joi.number().optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    newpassword: Joi.string().optional()
  })

async function hashPassword(password: string, salt: Buffer): Promise<string>{
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

async function verifyPassword(password: string, savedSalt: Buffer, savedHash: string):Promise<boolean>{
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
        const place = value.place;
    
        //Create entry into user table
        const insertUser = 'INSERT INTO users (name,email,place) VALUES (?,?,?)'
        const [userInfo] = await pool.execute(insertUser,[name,email,place]);
        const user_id = (userInfo as any).insertId
        
        const insertQuery = 'INSERT INTO userauth (username,password_hash,salt,user_id) VALUES (?,?,?,?)';
        const [result] = await pool.execute(insertQuery, [username,hashedPassword,salt,user_id]);
        console.log(result);
        return res.status(200).json(rest.success(result))
    } catch(error){
        console.error("Error:",error);
        return res.status(400).json(rest.error("Error"))
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
    const [getResult] = await pool.execute<User[]>(getQuery,[username])
    
    const passwordhash = getResult.map(row => row.password_hash)
    const salt = getResult.map(row => row.salt)
    const logIn = await verifyPassword(password,salt[0],passwordhash[0])
    console.log(logIn)
    if(logIn === true){
        const token = jwt.sign(value,secret,{expiresIn:"1h"})
        res.cookie('token', token,{
            httpOnly: true,
        })
        return res.redirect('/landing')
    }
    return res.status(500).json(rest.error("Something went wrong"))
}