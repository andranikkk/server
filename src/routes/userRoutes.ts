import { Router } from 'express'
import authenticateToken from '../middlewares/auth.js'
import {
	refreshAccessToken,
	signin,
	signup,
} from '../controllers/userController.js'

const router = Router()

router.post('/signin', signin)
router.post('/signup', signup)
router.post('/signin/new_token', refreshAccessToken)

router.get('/profile', authenticateToken, (req, res) => {
	res.json({ message: 'Authorized', user: (req as any).user })
})

export default router
