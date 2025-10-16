import { Router } from 'express'
import userRoutes from './userRoutes.js'
import fileRoutes from './fileRoutes.js'

const router = Router()

router.use('/', userRoutes)
router.use('/', fileRoutes)

export default router
