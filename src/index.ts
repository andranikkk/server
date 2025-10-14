import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import helmet from 'helmet'
import { __dirname } from './utils/path.js'
import router from './routes/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS, PATCH'
	)
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
	next()
})

app.use(
	cors({
		origin: '*',
	})
)

app.use(
	helmet({
		crossOriginResourcePolicy: false,
	})
)

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, '../static')))

app.use('/api', router)

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`)
})
