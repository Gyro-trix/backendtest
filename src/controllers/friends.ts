import { type Request, type Response } from 'express'
import * as rest from '../utils/rest'
import Joi from 'joi'
import jwt from "jsonwebtoken"
import mysql, { RowDataPacket } from 'mysql2'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise()


export interface Friend extends RowDataPacket{
  id?: number
  user_id: number
  friend_id: number
  status: boolean
};

export interface User{
    id: number
    username: string
    iat: string
    exp: string
}

const FriendSchema = Joi.object<Storage>({
    id: Joi.number().optional(),
    user_id: Joi.number().required(),
    friend_id: Joi.number().optional(),
    status: Joi.boolean().required(),
    
  })

export async function createFriend(req:Request, res:Response){
    const {error, value} = FriendSchema.validate(req.body)
    console.log(value)
    if (error !== undefined) {
        return res.status(400).json(rest.error('Body data is not formatted correctly'))
    }
        
    try{
        const user_id = value.name;       
        const friend_id = value.quantity;
        const status = value.size;
       

        const insertQuery = 'INSERT INTO friends (user_id,friend_id,status) VALUES (?,?,?)';
        await pool.execute(insertQuery, [user_id,friend_id,status]);
        res.status(200).json(rest.success("Friend request sent"))
        return 
    } catch(error){
        console.error("Error:",error);
        return res.status(500).json(rest.error("Database Error"))
    }
}

//Get friends based on user id
export async function getFriends(req:Request, res:Response){
    const {error, value} = FriendSchema.validate(req.body)

  //Make sure id given is a number
  if (Number.isNaN(value.user_id)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const [row] = await pool.query(`
    SELECT * FROM friends
    WHERE user_id = ?
    AND status = true
    `, [value.user_id])
  
  //If there are empty results, the ID is not in the table
  const values = Object.values(row)
  if (values.length === 0){
    return res.status(400).json(rest.error('No Friends for given ID'))
  }
  return res.status(200).json(rest.success(row))
}

export async function updateFriend(req:Request, res:Response){
  const {error, value} = FriendSchema.validate(req.body)
  
  if (error !== undefined) {
      return res.status(400).json(rest.error('User data is not formatted correctly'))
  }

  const id = value.id
  const user_id = value.user_id
  const friend_id = value.friend_id
  const status = value.status
  
  //check if owner is current user

  const getQuery = 'SELECT * FROM friends WHERE id = ?'
  const [getResult] = await pool.execute<Friend[]>(getQuery,[id])

  if(getResult.length === 0){
      return res.status(400).json(rest.error('No Such Storage Exists'))
  }
      const [row] = await pool.query(`
          UPDATE friends
          SET user_id = ?, friends_id = ?, status = ?
          WHERE id = ?
          `, [user_id,friend_id,status])
      return res.status(200).json(rest.success(row))
}


export async function deleteFriends(req:Request, res:Response){
  
  const {error, value} = FriendSchema.validate(req.body)

  if (error !== undefined) {
      return res.status(400).json(rest.error('Request improperly formatted'))
  }
      const [row] = await pool.query(`
          DELETE FROM friends
          WHERE id = ?
          `, [value.id])
      return res.status(200).json(rest.success("Friend Deleted"))
}