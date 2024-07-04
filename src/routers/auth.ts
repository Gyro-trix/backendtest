import { Router } from 'express'
import * as AuthController from '../controllers/auth'

const router = Router()


router.post('/', AuthController.createUserAuth)
router.get('/', AuthController.getUserAuth)
router.put('/:id', AuthController.updateUserAuth)
/*
router.delete('/:id', AuthController.deleteUser)
*/

export default router