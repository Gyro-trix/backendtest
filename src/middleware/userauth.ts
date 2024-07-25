import {Request, Response, NextFunction} from 'express'

interface AuthRequest extends Request{
    user?: any
}

export const authUser = (req: AuthRequest,res: Response,next: NextFunction) =>{
    console.log(req.body)
    const userId = req.body.id
    console.log({userId})
    console.log(req.cookies.token)
    if(req.user?.id === userId){
        next()
    } else {
        res.sendStatus(403) //forbidden code response
    }
}

