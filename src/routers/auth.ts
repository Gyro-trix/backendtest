import { Router } from 'express'
import * as AuthController from '../controllers/auth'

const router = Router()


//router.post('/', AuthController.createUserAuth)
router.post('/', AuthController.authUser)

export default router