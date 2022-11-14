declare global {
	var prisma: PrismaClient | undefined
}

import config from "@lib/config"
import { Post, PrismaClient, File, User, Prisma } from "@prisma/client"

// we want to update iff they exist the createdAt/updated/expired/deleted items
// the input could be an array, in which case we'd check each item in the array
// if it's an object, we'd check that object
// then we return the changed object or array

const updateDateForItem = (item: any) => {
	if (item.createdAt) {
		item.createdAt = item.createdAt.toString()
	}
	if (item.updatedAt) {
		item.updatedAt = item.updatedAt.toString()
	}
	if (item.expiresAt) {
		item.expiresAt = item.expiresAt.toString()
	}
	if (item.deletedAt) {
		item.deletedAt = item.deletedAt.toString()
	}
	return item
}

const updateDates = (input: any) => {
	if (Array.isArray(input)) {
		return input.map((item) => updateDateForItem(item))
	} else {
		return updateDateForItem(input)
	}
}

export const prisma =
	global.prisma ||
	new PrismaClient({
		log: ["query"]
	})

// prisma.$use(async (params, next) => {
// 	const result = await next(params)
// 	return updateDates(result)
// })

if (process.env.NODE_ENV !== "production") global.prisma = prisma

export type { User, File, Post } from "@prisma/client"

export type PostWithFiles = Post & {
	files: File[]
}

export const getFilesForPost = async (postId: string) => {
	const files = await prisma.file.findMany({
		where: {
			postId
		}
	})

	return files
}

export async function getFilesByPost(postId: string) {
	const files = await prisma.file.findMany({
		where: {
			postId
		}
	})

	return files
}

export async function getPostsByUser(userId: string): Promise<Post[]>
export async function getPostsByUser(
	userId: string,
	includeFiles: true
): Promise<PostWithFiles[]>
export async function getPostsByUser(userId: User["id"], withFiles?: boolean) {
	const posts = await prisma.post.findMany({
		where: {
			authorId: userId
		},
		include: {
			files: withFiles
		},
		orderBy: {
			createdAt: "desc"
		}
	})

	return posts
}

export const getUserById = async (userId: User["id"]) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId
		},
		select: {
			id: true,
			email: true,
			// displayName: true,
			role: true,
			username: true
		}
	})

	return user
}

export const isUserAdmin = async (userId: User["id"]) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId
		},
		select: {
			role: true
		}
	})

	return user?.role?.toLowerCase() === "admin"
}

export const createUser = async (
	username: string,
	password: string,
	serverPassword?: string
) => {
	if (!username || !password) {
		throw new Error("Missing param")
	}

	if (
		config.registration_password &&
		serverPassword !== config.registration_password
	) {
		console.log("Registration password mismatch")
		throw new Error("Wrong registration password")
	}

	const isUserAdminByDefault =
		config.enable_admin && (await prisma.user.count()) === 0
	const userRole = isUserAdminByDefault ? "admin" : "user"

	return {
		// user,
		// token
	}
}

export const getPostById = async (postId: Post["id"], withFiles = false) => {
	const post = await prisma.post.findUnique({
		where: {
			id: postId
		},
		include: {
			files: withFiles
		}
	})

	return post as PostWithFiles
}

export const getAllPosts = async ({
	withFiles = false,
	take = 100,
	...rest
}: {
	withFiles?: boolean
} & Prisma.PostFindManyArgs = {}) => {
	const posts = await prisma.post.findMany({
		include: {
			files: withFiles
		},
		// TODO: optimize which to grab
		take,
		...rest
	})

	return posts as PostWithFiles[]
}

export const searchPosts = async (
	query: string,
	{
		withFiles = false,
		userId,
	}: {
		withFiles?: boolean
		userId?: User["id"]
	} = {}
): Promise<PostWithFiles[]> => {
	const posts = await prisma.post.findMany({
		where: {
			OR: [
				{
					title: {
						search: query
					},
					authorId: userId
				},
				{
					files: {
						some: {
							content: {
								search: query
							},
							userId: userId
						}
					}
				}
			]
		},
		include: {
			files: withFiles
		}
	})

	return posts as PostWithFiles[]
}
