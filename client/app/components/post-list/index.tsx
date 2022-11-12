"use client"

import { Button, Input, Text } from "@geist-ui/core/dist"

import styles from "./post-list.module.css"
import ListItemSkeleton from "./list-item-skeleton"
import ListItem from "./list-item"
import { ChangeEvent, useCallback, useEffect, useState } from "react"
import useDebounce from "@lib/hooks/use-debounce"
import Link from "@components/link"
import { TOKEN_COOKIE_NAME } from "@lib/constants"
import { getCookie } from "cookies-next"
import type { PostWithFiles } from "@lib/server/prisma"

type Props = {
	initialPosts: PostWithFiles[]
	morePosts: boolean
}

const PostList = ({ morePosts, initialPosts }: Props) => {
	const [search, setSearchValue] = useState("")
	const [posts, setPosts] = useState(initialPosts)
	const [searching, setSearching] = useState(false)
	const [hasMorePosts, setHasMorePosts] = useState(morePosts)

	const debouncedSearchValue = useDebounce(search, 200)

	const loadMoreClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault()
			if (hasMorePosts) {
				async function fetchPosts() {
					const res = await fetch(`/server-api/posts/mine`, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${getCookie(TOKEN_COOKIE_NAME)}`,
							"x-page": `${posts.length / 10 + 1}`
						}
					})
					const json = await res.json()
					setPosts([...posts, ...json.posts])
					setHasMorePosts(json.morePosts)
				}
				fetchPosts()
			}
		},
		[posts, hasMorePosts]
	)

	// update posts on search
	useEffect(() => {
		if (debouncedSearchValue) {
			// fetch results from /server-api/posts/search
			const fetchResults = async () => {
				setSearching(true)
				//encode search
				const res = await fetch(
					`/server-api/posts/search?q=${encodeURIComponent(
						debouncedSearchValue
					)}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${getCookie(TOKEN_COOKIE_NAME)}`
							// "tok": process.env.SECRET_KEY || ''
						}
					}
				)
				const data = await res.json()
				setPosts(data)
				setSearching(false)
			}
			fetchResults()
		} else {
			setPosts(initialPosts)
		}
	}, [initialPosts, debouncedSearchValue])

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}

	// const debouncedSearchHandler = useMemo(
	// 	() => debounce(handleSearchChange, 300),
	// 	[]
	// )

	// useEffect(() => {
	// 	return () => {
	// 		debouncedSearchHandler.cancel()
	// 	}
	// }, [debouncedSearchHandler])

	const deletePost = useCallback(
		(postId: string) => async () => {
			const res = await fetch(`/server-api/posts/${postId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getCookie(TOKEN_COOKIE_NAME)}`
				}
			})

			if (!res.ok) {
				console.error(res)
				return
			} else {
				setPosts((posts) => posts.filter((post) => post.id !== postId))
			}
		},
		[]
	)

	return (
		<div className={styles.container}>
			<div className={styles.searchContainer}>
				<Input
					scale={3 / 2}
					clearable
					placeholder="Search..."
					onChange={handleSearchChange}
					disabled={Boolean(!posts?.length)}
				/>
			</div>
			{!posts && <Text type="error">Failed to load.</Text>}
			{!posts.length && searching && (
				<ul>
					<li>
						<ListItemSkeleton />
					</li>
					<li>
						<ListItemSkeleton />
					</li>
				</ul>
			)}
			{posts?.length === 0 && posts && (
				<Text type="secondary">
					No posts found. Create one{" "}
					<Link colored href="/new">
						here
					</Link>
					.
				</Text>
			)}
			{posts?.length > 0 && (
				<div>
					<ul>
						{posts.map((post) => {
							return (
								<ListItem
									deletePost={deletePost(post.id)}
									post={post}
									key={post.id}
								/>
							)
						})}
					</ul>
				</div>
			)}
			{hasMorePosts && !setSearchValue && (
				<div className={styles.moreContainer}>
					<Button width={"100%"} onClick={loadMoreClick}>
						Load more
					</Button>
				</div>
			)}
		</div>
	)
}

export default PostList