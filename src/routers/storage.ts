import { Router } from 'express'
import * as StorageController from '../controllers/storage'

const router = Router()

router.put('/', StorageController.createStorage)
router.get('/', StorageController.getStorage)
router.post('/', StorageController.updateStorage)
router.delete('/', StorageController.deleteStorage)

export default router