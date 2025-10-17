import { Router } from 'express'
import authenticateToken from '../middlewares/auth.js'
import { upload } from '../middlewares/upload.js'
import {
	uploadFile,
	listFiles,
	deleteFile,
	getFileInfo,
	downloadFile,
	updateFile,
} from '../controllers/fileController.js'

const router = Router()

router.post('/upload', authenticateToken, upload.array('file'), uploadFile)
router.get('/list', authenticateToken, listFiles)
router.get('/:id', authenticateToken, getFileInfo)
router.get('/download/:id', authenticateToken, downloadFile)
router.delete('/delete/:id', authenticateToken, deleteFile)
router.put('/update/:id', authenticateToken, upload.single('file'), updateFile)

export default router
