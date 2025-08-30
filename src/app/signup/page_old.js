"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
export default function Signup() {
    const [logform, setlogform] = useState({ email: "", password: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleedit = (e) => {
        e.preventDefault()
        setlogform({ ...logform, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logform),
            })

            const data = await response.json()
            
            if (response.ok) {
                // Handle success - redirect or show success message
                
}

