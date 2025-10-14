import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UsersModels } from '../models/userModel.js'
import {
	generateAccessToken,
	generateRefreshToken,
} from '../services/tokenService.js'

export const signin = async (req: Request, res: Response) => {
	try {
		const { id, password } = req.body

		if (!id || !password) {
			return res.status(400).json({ message: 'Fill all fields!' })
		}

		const user = await UsersModels.findFirst({
			where: {
				OR: [{ email: id }, { phone: id }],
			},
		})

		const isValid = user && (await bcrypt.compare(password, user.password))
		if (!isValid) {
			return res.status(401).json({ error: 'Invalid id or password' })
		}

		const payload = { userId: user.id }

		const accessToken = generateAccessToken(payload)
		const refreshToken = generateRefreshToken(payload)

		await UsersModels.update({
			where: { id: user.id },
			data: { refreshToken },
		})

		return res.json({ accessToken, refreshToken })
	} catch (error) {
		console.error('Signin error:', error)
		res.status(500).json({ message: 'Internal server error' })
	}
}

export const signup = async (req: Request, res: Response) => {
	const { email, password, phone } = req.body

	try {
		if (!email || !password || !phone) {
			return res.status(400).json({ message: 'Fill all fields' })
		}

		const registeredUser = await UsersModels.findFirst({
			where: {
				OR: [{ email }, { phone }],
			},
		})

		if (registeredUser) {
			return res.status(400).json({ message: 'User already registered' })
		}

		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)

		const user = await UsersModels.create({
			data: {
				email,
				phone,
				password: hashedPassword,
			},
		})

		const payload = { userId: user.id }
		const accessToken = generateAccessToken(payload)
		const refreshToken = generateRefreshToken(payload)

		await UsersModels.update({
			where: { id: user.id },
			data: { refreshToken },
		})

		return res.status(201).json({
			message: 'User registered successfully',
			accessToken,
			refreshToken,
		})
	} catch (error) {
		console.error('Signup error:', error)
		res.status(500).json({ message: 'Internal server error' })
	}
}

export const refreshAccessToken = async (req: Request, res: Response) => {
	const { refreshToken } = req.body

	if (!refreshToken) {
		return res.status(400).json({ error: 'Missing refresh token' })
	}

	try {
		const decoded = jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET!
		) as { userId: string }

		const user = await UsersModels.findUnique({ where: { id: decoded.userId } })
		if (!user || user.refreshToken !== refreshToken) {
			return res.status(403).json({ error: 'Invalid refresh token' })
		}

		const newAccessToken = generateAccessToken({ userId: user.id })
		return res.json({ accessToken: newAccessToken })
	} catch (error) {
		console.error('Refresh token error:', error)
		return res.status(403).json({ error: 'Invalid or expired refresh token' })
	}
}
