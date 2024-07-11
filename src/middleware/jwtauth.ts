import { Request, Response, NextFunction } from "express"
import jwt, {Secret} from "jsonwebtoken"
import cookieParser from "cookie-parser"
import * as dotenv from 'dotenv'

dotenv.config()

const secret: Secret = ""+process.env.JWT_SECRET+""

export const authJwt = (req: Request, res: Response, next: NextFunction) =>{
    const token = req.cookies.token
    if(!token){
        return res.status(401).json({message: "No Token Providied"})
    }

    try{
        const verified = jwt.verify(token,secret)
        //req.user = verified
        next()
    } catch (error){
        res.clearCookie('token')
        return res.redirect('/')
    }
}