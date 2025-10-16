import { type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { FileModels } from '../models/fileModel.js'

const uploadDir = path.join(process.cwd(), 'uploads')

export const uploadFile = async (req: any, res: Response) => {
	try {
		const file = req.file
		if (!file) return res.status(400).json({ error: 'No file uploaded' })

		const newFile = await FileModels.create({
			data: {
				name: file.originalname,
				extension: path.extname(file.originalname),
				mimeType: file.mimetype,
				size: file.size,
				path: file.filename,
				userId: req.user.userId,
			},
		})

		res.json(newFile)
	} catch (err) {
		console.error('Upload error:', err)
		res.status(500).json({ error: 'File upload failed' })
	}
}

export const listFiles = async (req: Request, res: Response) => {
	const listSize = parseInt(req.query.list_size as string) || 10
	const page = parseInt(req.query.page as string) || 1

	const files = await FileModels.findMany({
		skip: (page - 1) * listSize,
		take: listSize,
		orderBy: { uploadedAt: 'desc' },
	})

	const total = await FileModels.count()
	res.json({
		page,
		listSize,
		total,
		totalPages: Math.ceil(total / listSize),
		files,
	})
}

export const getFileInfo = async (req: Request, res: Response) => {
	const { id } = req.params
	const file = await FileModels.findUnique({ where: { id } })
	if (!file) return res.status(404).json({ error: 'File not found' })
	res.json(file)
}

export const downloadFile = async (req: Request, res: Response) => {
	const { id } = req.params
	const file = await FileModels.findUnique({ where: { id } })
	if (!file) return res.status(404).json({ error: 'File not found' })

	const filePath = path.join(uploadDir, file.path)
	res.download(filePath, file.name)
}

export const deleteFile = async (req: Request, res: Response) => {
	const { id } = req.params
	const file = await FileModels.findUnique({ where: { id } })
	if (!file) return res.status(404).json({ error: 'File not found' })

	const filePath = path.join(uploadDir, file.path)
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

	await FileModels.delete({ where: { id } })
	res.json({ message: 'File deleted successfully' })
}

export const updateFile = async (req: any, res: Response) => {
	const { id } = req.params
	const newFile = req.file
	if (!newFile) return res.status(400).json({ error: 'No file provided' })

	const existing = await FileModels.findUnique({ where: { id } })
	if (!existing) return res.status(404).json({ error: 'File not found' })

	const oldPath = path.join(uploadDir, existing.path)
	if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)

	const updated = await FileModels.update({
		where: { id },
		data: {
			name: newFile.originalname,
			extension: path.extname(newFile.originalname),
			mimeType: newFile.mimetype,
			size: newFile.size,
			path: newFile.filename,
			updatedAt: new Date(),
		},
	})

	res.json(updated)
}
