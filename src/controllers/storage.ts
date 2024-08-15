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

export interface Storage extends RowDataPacket{
  id?: number
  image: string
  location: string
  name: string
  owner: string
  type: string
  share: boolean
};

export interface User{
    id: number
    username: string
    iat: string
    exp: string
}

const StorageSchema = Joi.object<Storage>({
    id: Joi.number().optional(),
    image: Joi.string().optional(),
    location: Joi.string().required(),
    name: Joi.string().required(),
    owner: Joi.string().optional(),
    type: Joi.string().required(),
    share: Joi.boolean().optional(),
  })

export async function createStorage(req:Request, res:Response){
    const {error, value} = StorageSchema.validate(req.body)
    
    const token = req.cookies.token
    const decoded = jwt.decode(token) as unknown
    const user = decoded as User 

    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }
        
    try{
        const location = value.location;       
        const name = value.name;
        const owner = user.id;
        const type = value.type;
        const share = false;

        const insertQuery = 'INSERT INTO storages (location,name,owner,type,share) VALUES (?,?,?,?,?)';
        await pool.execute(insertQuery, [location,name,owner,type,share]);
        res.status(200).json({redirectUrl:'pantry-pal/#/'})
        return 
    } catch(error){
        console.error("Error:",error);
        return res.status(500).json(rest.error("Database Error"))
    }
}

export async function getStorage(req:Request, res:Response){
    
    const token = req.cookies.token
    const decoded = jwt.decode(token) as unknown
    const user = decoded as User

  //Make sure id given is a number
  if (Number.isNaN(user.id)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const [row] = await pool.query(`
    SELECT * FROM storages
    WHERE owner = ?
    `, [user.id])
  console.log(row)  
  //If there are empty results, the ID is not in the table
  const values = Object.values(row)
  if (values.length === 0){
    return res.status(400).json(rest.error('No Entry for given ID'))
  }
  return res.status(200).json(rest.success(row))
}

export async function updateStorage(req:Request, res:Response){
  const {error, value} = StorageSchema.validate(req.body)
  
  
  const id = value.id
  const image = value.image
  const location = value.location
  const name = value.name
  const owner = value.owner
  const type = value.type
  const share = value.share
  
  if (error !== undefined) {
      return res.status(400).json(rest.error('User data is not formatted correctly'))
  }

  //check if owner is current user

  const getQuery = 'SELECT * FROM storages WHERE id = ?'
  const [getResult] = await pool.execute<Storage[]>(getQuery,[id])

  if(getResult.length === 0){
      return res.status(400).json(rest.error('No Such Storage Exists'))
  }
      const [row] = await pool.query(`
          UPDATE storages
          SET image = ?, location = ?, name = ?, type = ?, share = ?
          WHERE id = ?
          `, [image,location,name,type,share,id])
      return res.status(200).json(rest.success(row))
}


export async function deleteStorage(req:Request, res:Response){
  
  /*
  const token = req.cookies.token
  const {error, value} = DelSchema.validate(jwt.decode(token))
  */
  
  const {error, value} = StorageSchema.validate(req.body)

  if (error !== undefined) {
      return res.status(400).json(rest.error('Request improperly formatted'))
  }
      const [row] = await pool.query(`
          DELETE FROM storages
          WHERE id = ?
          `, [value.id])
      return res.status(200).json(rest.success("User Deleted"))
}