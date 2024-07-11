import { Router } from 'express'
import * as AuthEdit from '../controllers/authinfo'

const router = Router()

router.put('/', AuthEdit.updateUserAuth)
router.delete('/', AuthEdit.deleteUserAuth)

export default router