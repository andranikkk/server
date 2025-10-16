import { PrismaClient } from '@prisma/client'

export const RefreshTokenModels = new PrismaClient().refreshToken
