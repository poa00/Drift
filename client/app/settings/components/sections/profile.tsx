"use client"

import { Note, Input, Textarea, Button, useToasts } from "@geist-ui/core/dist"
import { TOKEN_COOKIE_NAME } from "@lib/constants"
import { getCookie } from "cookies-next"
import { User } from "next-auth"
import {  useState } from "react"

const Profile = ({ user }: { user: User }) => {
	const [name, setName] = useState<string>(user.name || "")
	const [email, setEmail] = useState<string>(user.email || "")
	const [bio, setBio] = useState<string>()

	const { setToast } = useToasts()

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value)
	}

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value)
	}

	const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setBio(e.target.value)
	}

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!name && !email && !bio) {
			setToast({
				text: "Please fill out at least one field",
				type: "error"
			})
			return
		}

		const data = {
			displayName: name,
			email,
			bio
		}

		const res = await fetch("/server-api/user/profile", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${getCookie(TOKEN_COOKIE_NAME)}`
			},
			body: JSON.stringify(data)
		})

		if (res.status === 200) {
			setToast({
				text: "Profile updated",
				type: "success"
			})
		} else {
			setToast({
				text: "Something went wrong updating your profile",
				type: "error"
			})
		}
	}

	return (
		<>
			<Note type="warning" marginBottom={"var(--gap)"}>
				This information will be publicly available on your profile
			</Note>
			<form
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "var(--gap)",
					maxWidth: "300px"
				}}
				onSubmit={onSubmit}
			>
				<div>
					<label htmlFor="displayName">Display name</label>
					<Input
						id="displayName"
						width={"100%"}
						placeholder="my name"
						value={name || ""}
						onChange={handleNameChange}
					/>
				</div>
				<div>
					<label htmlFor="email">Email</label>
					<Input
						id="email"
						htmlType="email"
						width={"100%"}
						placeholder="my@email.io"
						value={email || ""}
						onChange={handleEmailChange}
					/>
				</div>
				<div>
					<label htmlFor="bio">Biography (max 250 characters)</label>
					<Textarea
						id="bio"
						width="100%"
						maxLength={250}
						placeholder="I enjoy..."
						value={bio || ""}
						onChange={handleBioChange}
					/>
				</div>
				<Button htmlType="submit" auto>
					Submit
				</Button>
			</form>
		</>
	)
}

export default Profile