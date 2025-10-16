import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDestination = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadDestination)) {
	fs.mkdirSync(uploadDestination)
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDestination)
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname)
		const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
		cb(null, name)
	},
})

export const upload = multer({ storage })
