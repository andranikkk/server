import { type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { FileModels } from '../models/fileModel.js'

const uploadDir = path.join(process.cwd(), 'uploads')

export const uploadFile = async (req: any, res: Response) => {
	try {
		const files = req.files as Express.Multer.File[]
		if (!files || files.length === 0)
			return res.status(400).json({ error: 'No files uploaded' })

		const createdFiles = await Promise.all(
			files.map(file =>
				FileModels.create({
					data: {
						name: file.originalname,
						extension: path.extname(file.originalname),
						mimeType: file.mimetype,
						size: file.size,
						path: file.filename,
						userId: req.user.userId,
					},
				})
			)
		)

		res.json({ message: 'Files uploaded successfully', files: createdFiles })
	} catch (err) {
		console.error('Upload error:', err)
		res.status(500).json({ error: 'File upload failed' })
	}
}

export const listFiles = async (req: Request, res: Response) => {
	try {
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
	} catch (err) {
		console.error('List files error:', err)
		res.status(500).json({ error: 'Internal server error' })
	}
}

export const getFileInfo = async (req: Request, res: Response) => {
	try {
		const { id } = req.params
		const file = await FileModels.findUnique({ where: { id } })
		if (!file) return res.status(404).json({ error: 'File not found' })
		res.json(file)
	} catch (err) {
		console.error('Get file info error:', err)
		res.status(500).json({ error: 'Internal server error' })
	}
}

export const downloadFile = async (req: Request, res: Response) => {
	try {
		const { id } = req.params
		const file = await FileModels.findUnique({ where: { id } })
		if (!file) return res.status(404).json({ error: 'File not found' })

		const filePath = path.join(uploadDir, file.path)
		res.download(filePath, file.name)
	} catch (err) {
		console.error('Download file error:', err)
		res.status(500).json({ error: 'Internal server error' })
	}
}

export const deleteFile = async (req: Request, res: Response) => {
	try {
		const { id } = req.params
		const file = await FileModels.findUnique({ where: { id } })
		if (!file) return res.status(404).json({ error: 'File not found' })

		const filePath = path.join(uploadDir, file.path)
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

		await FileModels.delete({ where: { id } })
		res.json({ message: 'File deleted successfully' })
	} catch (err) {
		console.error('File delete error:', err)
		res.status(500).json({ error: 'Internal server error' })
	}
}

export const updateFile = async (req: any, res: Response) => {
	try {
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
	} catch (err) {
		console.error('File update error:', err)
		res.status(500).json({ error: 'Internal server error' })
	}
}
