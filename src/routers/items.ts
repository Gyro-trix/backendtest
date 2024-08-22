import { Router } from 'express'
import * as ItemController from '../controllers/items'

const router = Router()

router.put('/', ItemController.createItem)
router.get('/', ItemController.getItems)
router.post('/', ItemController.updateItem)
router.delete('/', ItemController.deleteItem)

export default router