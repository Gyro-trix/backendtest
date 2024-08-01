import { Router } from 'express'
import * as AuthController from '../controllers/auth'

const router = Router()

router.post('/', AuthController.createUserAuth)
router.put('/', AuthController.authUser)

export default router