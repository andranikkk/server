import { Router } from 'express'
import {
	getInfo,
	logout,
	refreshAccessToken,
	signin,
	signup,
} from '../controllers/userController.js'
import authenticateToken from '../middlewares/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/signin/new_token', refreshAccessToken)
router.get('/logout', logout)
router.get('/info', authenticateToken, getInfo)

export default router
