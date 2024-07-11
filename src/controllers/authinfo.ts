import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'
//import { JsonWebKey } from 'crypto'
import mysql, { RowDataPacket } from 'mysql2'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config()

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

export async function updateUserAuth(req:Request, res:Response){
    const {error, value} = AuthSchema.validate(req.body)
    const username = value.username
    const password = value.password

    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }



}

export async function deleteUserAuth(req:Request, res:Response){

}