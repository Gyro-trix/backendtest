import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'

import mysql, { RowDataPacket } from 'mysql2'
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
  name: string
  email: email
  place: string
  bio: string
}

//Joi min and max 2 for place
const UserSchema = Joi.object<User>({
  id: Joi.number().optional(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  place: Joi.string().required(),
  bio: Joi.string()
})

//Create, Read, Update, Delete

export async function createUser(req:Request, res:Response){

  //Insure request body is formatted correctly
  const {error, value} = UserSchema.validate(req.body)
  if (error !== undefined) {
    return res.status(400).json(rest.error('User data is not formatted correctly'))
  }
  //There should be no ID in the request body as database creats it
  const user = value
  console.log(value)
  if ('id' in user) {
    return res.status(400).json(rest.error('User ID will be generated automatically'))
  }

  const email = user.email
  const name = user.name
  const place = user.place
  //Check if email exists in database
  const[exists] = await pool.query(`
    SELECT * FROM users
    WHERE email = ?
    `,[email])

  const values = Object.values(exists)
  if (values.length === 1){
    return res.status(400).json(rest.error('Email already in use'))
  } 

  const [row] = await pool.query(`
    INSERT INTO users(email,name,place)
    VALUES(?,?,?)
    `, [email,name,place])

  return res.status(200).json(rest.success(name))

}

export async function getUser(req:Request, res:Response){
  
  const id = parseInt(req.params.id)

  //Make sure id given is a number
  if (Number.isNaN(id)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const [row] = await pool.query(`
    SELECT * FROM users
    WHERE id = ?
    `, [id])
    
  //If there are empty results, the ID is not in the table
  const values = Object.values(row)
  if (values.length === 0){
    return res.status(400).json(rest.error('No Entry for given ID'))
  }
 
 
  return res.status(200).json(rest.success(row))

}

export async function updateUser(req:Request, res:Response){
  
  const {error, value} = UserSchema.validate(req.body)
  if (error !== undefined) {
    return res.status(400).json(rest.error('User data is not formatted correctly'))
  }

  const id = parseInt(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const user = value
  const email = user.email
  const name = user.name
  const place = user.place
  const bio = user.bio

  const[exists] = await pool.query(`
    SELECT * FROM users
    WHERE email = ?
    `,[email])

  const valueCheck = Object.values(exists)
  if (valueCheck.length === 1){
    return res.status(400).json(rest.error('Email already in use'))
  } 

  const [result] = await pool.query(`
    SELECT * FROM users
    WHERE id = ?
    `, [id])

  console.log(Object.values(result).length)
  //If there are empty results, the ID is not in the table
  const values = Object.values(result)

  if (values.length === 0){
    return res.status(400).json(rest.error('No Entry for given ID'))
  }

  const [row] = await pool.query(`
    UPDATE users
    SET email = ?, name = ?, place = ?, bio = ?
    WHERE id = ?
    `, [email,name,place,bio,id])

  return res.status(200).json(rest.success(row))

}

export async function deleteUser(req:Request, res:Response){
  
  const id = parseInt(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const [row] = await pool.query(`
    DELETE FROM users
    WHERE id = ?
    `, [id])

  console.log(row)

  //If there are empty results, the ID is not in the table
  const values = Object.values(row)
  if (values.length === 0){
    return res.status(400).json(rest.error('No Entry for given ID'))
  }  

  return res.status(200).json(rest.success(row))

}
