import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

interface AuthenticatedRequest extends Request {
	user?: string | JwtPayload
}

const authenticateToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers['authorization']
		const token = authHeader && authHeader.split(' ')[1] // "Bearer <token>"

		if (!token) {
			return res.status(401).json({ error: 'Access token missing' })
		}

		const secret = process.env.ACCESS_TOKEN_SECRET
		if (!secret) {
			throw new Error('ACCESS_TOKEN_SECRET not configured')
		}

		jwt.verify(token, secret, (err, decoded) => {
			if (err) {
				if (err.name === 'TokenExpiredError') {
					return res.status(401).json({ error: 'Access token expired' })
				}

				return res.status(403).json({ error: 'Invalid token' })
			}

			req.user = decoded as JwtPayload
			next()
		})
	} catch (error) {
		console.error('Token verification error:', error)
		return res.status(500).json({ error: 'Internal authentication error' })
	}
}

export default authenticateToken
