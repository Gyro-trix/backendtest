import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'
import mysql, { RowDataPacket } from 'mysql2'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'

import jwt, {Secret} from "jsonwebtoken"

import { verifyPassword, hashPassword } from './auth'

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

const AuthSchema = Joi.object<User>({
    id: Joi.number().optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    newpassword: Joi.string().optional()
  })

const DelSchema =  Joi.object<User>({
    id: Joi.number().optional(),
    username: Joi.string().required(),
    iat: Joi.number().optional(),
    exp: Joi.number().optional()
  })

export async function updateUserAuth(req:Request, res:Response){
    const {error, value} = AuthSchema.validate(req.body)
    const username = value.username
    const oldpassword = value.password
    const newpassword = value.newpassword
    const newsalt = crypto.randomBytes(16)

    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }

    const getQuery = 'SELECT * FROM userauth WHERE username = ?'
    const [getResult] = await pool.execute<User[]>(getQuery,[username])

    if(getResult.length === 0){
        return res.status(400).json(rest.error('No Such User Exists'))
    }

    const passwordhash = getResult.map(row => row.password_hash)
    const salt = getResult.map(row => row.salt)
    const checkold = await verifyPassword(oldpassword,salt[0],passwordhash[0])

    if(checkold === true){
        const hashednewpassword = await hashPassword(newpassword, newsalt)
        const [row] = await pool.query(`
            UPDATE userauth
            SET password_hash = ?, salt = ?
            WHERE username = ?
            `, [hashednewpassword,newsalt,username])
        return res.status(200).json(rest.success(row))
    } else {
        return res.status(400).json(rest.error('Old passwrod does not match'))
    }

}

export async function deleteUserAuth(req:Request, res:Response){
    
    const token = req.cookies.token
    
    const {error, value} = DelSchema.validate(jwt.decode(token))
    console.log(value)
    
    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }
    
    if(token){
        const [row] = await pool.query(`
            DELETE FROM userauth
            WHERE id = ?
            `, [value.id])
        return res.status(200).json(rest.success("User Deleted"))
    } else{
        return res.status(400).json(rest.error('No Cookie Found'))
    }

}