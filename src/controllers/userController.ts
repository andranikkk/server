import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UsersModels } from '../models/userModel.js'
import { RefreshTokenModels } from '../models/refreshTokenModel.js'
import {
	generateAccessToken,
	generateRefreshToken,
} from '../services/tokenService.js'

export const signin = async (req: Request, res: Response) => {
	try {
		const { id, password } = req.body

		const user = await UsersModels.findFirst({
			where: { OR: [{ email: id }, { phone: id }] },
		})

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		const payload = { userId: user.id }
		const accessToken = generateAccessToken(payload)
		const refreshToken = generateRefreshToken(payload)

		await RefreshTokenModels.create({
			data: { token: refreshToken, userId: user.id },
		})

		res.json({ accessToken, refreshToken })
	} catch (error) {
		console.error('Signin error:', error)
		res.status(500).json({ message: 'Internal server error' })
	}
}

export const signup = async (req: Request, res: Response) => {
	try {
		const { email, phone, password } = req.body

		if (!email || !phone || !password) {
			return res.status(400).json({ message: 'Fill all fields' })
		}

		const existing = await UsersModels.findFirst({
			where: { OR: [{ email }, { phone }] },
		})

		if (existing) {
			return res.status(400).json({ message: 'User already exists' })
		}

		const hashed = await bcrypt.hash(password, 10)
		const user = await UsersModels.create({
			data: { email, phone, password: hashed },
		})

		const payload = { userId: user.id }
		const accessToken = generateAccessToken(payload)
		const refreshToken = generateRefreshToken(payload)

		await RefreshTokenModels.create({
			data: { token: refreshToken, userId: user.id },
		})

		res.status(201).json({ accessToken, refreshToken })
	} catch (error) {
		console.error('Signup error:', error)
		res.status(500).json({ message: 'Internal server error' })
	}
}

export const refreshAccessToken = async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body

		if (!refreshToken)
			return res.status(400).json({ error: 'Missing refresh token' })

		const decoded = jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET!
		) as { userId: string }

		const tokenInDb = await RefreshTokenModels.findUnique({
			where: { token: refreshToken },
		})
		if (!tokenInDb) {
			return res
				.status(403)
				.json({ error: 'Refresh token invalid or logged out' })
		}

		const newAccessToken = generateAccessToken({ userId: decoded.userId })
		res.json({ accessToken: newAccessToken })
	} catch (error) {
		res.status(403).json({ error: 'Invalid or expired refresh token' })
	}
}

export const logout = async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body
		if (!refreshToken)
			return res.status(400).json({ error: 'Missing refresh token' })

		await RefreshTokenModels.delete({ where: { token: refreshToken } })
		res.json({ message: 'Logged out successfully' })
	} catch (error) {
		res.status(500).json({ message: 'Logout failed' })
	}
}

//** знаю, что есть баг - возвращается id пользователя даже после logout пока срок жизни токена не истек. Нет времени подключать Редис для черного списка аксесТокенов, с помощью которого можно было бы предотвратить успешный возврат id после logout. Или использовать device-level tracking подход. В общем, есть много вариантов.. */
export const getInfo = (req: any, res: Response) => {
	const user = req.user as { userId: string }
	res.json({ id: user.userId })
}
