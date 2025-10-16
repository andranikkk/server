import jwt from 'jsonwebtoken'

export const generateAccessToken = (payload: { userId: string }) => {
	return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
		expiresIn: '10m',
	})
}

export const generateRefreshToken = (payload: { userId: string }) => {
	return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
		expiresIn: '7d',
	})
}
