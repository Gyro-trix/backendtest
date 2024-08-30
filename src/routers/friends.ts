import { Router } from 'express'
import * as FriendsController from '../controllers/friends'

const router = Router()

router.put('/', FriendsController.createFriend)
router.get('/', FriendsController.getFriends)
router.post('/', FriendsController.updateFriend)
router.delete('/', FriendsController.deleteFriends)

export default router