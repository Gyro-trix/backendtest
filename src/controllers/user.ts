import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'

import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config
/*
const pool = mysql.createPool({
  host: 'localhost',
  user:'Matthew',
  password:'12341234',
  database: 'testing'
}).promise()
*/

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}).promise()

const DEMO_USERS: User[] = []
DEMO_USERS.push({
  id: 12345,
  name: 'John Doe',
  email: 'john@doe.com'
})

type email = string

export interface User {
  id?: number
  name: string
  email: email
}

const UserSchema = Joi.object<User>({
  id: Joi.number().optional(),
  name: Joi.string().required(),
  email: Joi.string().email().required()
})

export const createUser = (req: Request, res: Response) => {
    const {error, value} = UserSchema.validate(req.body)
    if (error !== undefined) {
      return res.status(400).json(rest.error('User data is not formatted correctly'))
    }
  
    const user = value;
    if ('id' in user) {
      return res.status(400).json(rest.error('User ID will be generated automatically'))
    }
  
    const id = Math.floor(Math.random() * 1000000)
  
    const createdUser = {
      ...user,
      id
    }
    DEMO_USERS.push(createdUser)
  
    return res.status(200).json(rest.success(createdUser))
}

export async function getStuff(req:Request, res:Response){

  console.log(req)
  const [rows] = await pool.query("SELECT * FROM users")

  return res.status(200).json(rest.success(rows))

}

export const getUser = (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  if (Number.isNaN(id)) {
    
  }

  const user = DEMO_USERS.find(u => u.id === id)
  if (user === undefined) {
    return res.status(404).json(rest.error('User not found'))
  }

  return res.status(200).json(rest.success(user))
  
}

export const deleteUserById = (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json(rest.error('Invalid user ID'))
  }

    const user = DEMO_USERS.find(u => u.id === id)
  if (user === undefined) {
    return res.status(404).json(rest.error('User not found'))
  }
    
    const demoLength = DEMO_USERS.length
    const newArray =[]
  for (let i = 0; i < demoLength; i++ )
    if(DEMO_USERS[i].id !== id ){
      newArray.push(DEMO_USERS[i])
    }
  
    DEMO_USERS.splice(0,demoLength,...newArray)

    return res.status(200).json(rest.success(DEMO_USERS))

  }

export const updateUser =  (req: Request, res: Response) => {
  
    const id = parseInt(req.params.id)
    const name = req.params.name
    const email = req.params.email

  if (Number.isNaN(id)) {
    return res.status(400).json(rest.error('Invalid user ID'))
  }

    const user = DEMO_USERS.find(u => u.id === id)
  if (user === undefined) {
    return res.status(404).json(rest.error('User not found'))
  }

    const demoLength = DEMO_USERS.length
  for (let i = 0; i < demoLength; i++ ){
    if(DEMO_USERS[i].id === id ){
      DEMO_USERS[i].name = name
      DEMO_USERS[i].email = email
      return res.status(200).json(rest.success(DEMO_USERS[i]))
    }
  }
    
}
