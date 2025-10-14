import { PrismaClient } from '@prisma/client'

export const UsersModels = new PrismaClient().users
