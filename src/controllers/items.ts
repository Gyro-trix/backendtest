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

export interface Item extends RowDataPacket{
  id?: number
  name: string
  quantity: number
  size: string
  storage: number
  expiry: string
};

export interface User{
    id: number
    username: string
    iat: string
    exp: string
}

const ItemSchema = Joi.object<Storage>({
    id: Joi.number().optional(),
    name: Joi.string().required(),
    quantity: Joi.number().required(),
    size: Joi.string().required(),
    storage: Joi.number().required(),
    expiry: Joi.string().required(),
  })

export async function createItem(req:Request, res:Response){
    const {error, value} = ItemSchema.validate(req.body)
    
    if (error !== undefined) {
        return res.status(400).json(rest.error('User data is not formatted correctly'))
    }
        
    try{
        const name = value.name;       
        const quantity = value.quantity;
        const size = value.size;
        const storage = value.storage;
        const expiry = value.expiry;

        const insertQuery = 'INSERT INTO items (name,quantity,size,storage,expiry) VALUES (?,?,?,?,?)';
        await pool.execute(insertQuery, [name,quantity,size,storage,expiry]);
        res.status(200).json({redirectUrl:'pantry-pal/#/'})
        return 
    } catch(error){
        console.error("Error:",error);
        return res.status(500).json(rest.error("Database Error"))
    }
}

//Get Items based on storage ID
export async function getItems(req:Request, res:Response){
    const {error, value} = ItemSchema.validate(req.body)

  //Make sure id given is a number
  if (Number.isNaN(value.storage)) {
    return res.status(400).json(rest.error('ID is not a number'))
  }

  const [row] = await pool.query(`
    SELECT * FROM items
    WHERE storage = ?
    `, [value.storage])
  
  //If there are empty results, the ID is not in the table
  const values = Object.values(row)
  if (values.length === 0){
    return res.status(400).json(rest.error('No Entry for given ID'))
  }
  return res.status(200).json(rest.success(row))
}

export async function updateItem(req:Request, res:Response){
  const {error, value} = ItemSchema.validate(req.body)
  
  
  const id = value.id
  const name = value.name
  const quantity = value.quantity
  const size = value.size
  const expiry = value.expiry
  const storage = value.atorage
  
  if (error !== undefined) {
      return res.status(400).json(rest.error('User data is not formatted correctly'))
  }

  //check if owner is current user

  const getQuery = 'SELECT * FROM items WHERE id = ?'
  const [getResult] = await pool.execute<Item[]>(getQuery,[id])

  if(getResult.length === 0){
      return res.status(400).json(rest.error('No Such Storage Exists'))
  }
      const [row] = await pool.query(`
          UPDATE storages
          SET name = ?, quantity = ?, size = ?, expiry = ?, storage = ?
          WHERE id = ?
          `, [name,quantity,size,expiry,storage,id])
      return res.status(200).json(rest.success(row))
}


export async function deleteItem(req:Request, res:Response){
  
  const {error, value} = ItemSchema.validate(req.body)

  if (error !== undefined) {
      return res.status(400).json(rest.error('Request improperly formatted'))
  }
      const [row] = await pool.query(`
          DELETE FROM storages
          WHERE id = ?
          `, [value.id])
      return res.status(200).json(rest.success("Item Deleted"))
}