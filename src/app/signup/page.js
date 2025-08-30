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
                console.log('Signup successful:', )
                router.push('/dashboard')
            } else {
                setError(data.message || 'Signup failed')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <section className="bg-gray-900 h-[100dvh] w-[100dvw]">
                <div className="flex flex-row justify-center items-center h-full w-full">
                    <div className="w-full lg:w-1/2 h-[80%]">
                        <form className="bg-amber-100 h-full flex justify-center items-center" onSubmit={handleSubmit}>
                            <div className=" w-full lg:w-1/2 h-[50%] bg-[#3f97ce] rounded-4xl p-4 mx-10">
                                <h1 className="text-white text-center font-bold">Lets begin</h1>
                                
                                {error && (
                                    <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
                                )}
                                
                                <div className="emailinput mt-10">
                                    <input 
                                        type="email" 
                                        name="email" 
                                        id="email" 
                                        placeholder="Enter Your Email...." 
                                        className="outline-none border-2 border-gray-600 rounded-2xl p-2 w-full" 
                                        value={logform.email} 
                                        onChange={handleedit}
                                        required 
                                    />
                                </div>
                                <div className="passwordinput mt-10">
                                    <input 
                                        type="password" 
                                        name="password" 
                                        id="password" 
                                        placeholder="Password Here" 
                                        className="outline-none border-2 border-gray-600 rounded-2xl p-2 w-full" 
                                        value={logform.password} 
                                        onChange={handleedit}
                                        required 
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="bg-amber-400 text-white p-2 rounded-2xl w-1/2 mt-10 cursor-pointer disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing up...' : 'Signup'}
                                </button>
                                <p className="text-sm mt-10 text-right">already have an account? <Link className="underline text-amber-400" href="/login"> Login here</Link></p>
                            </div>
                        </form>
                    </div>
                    <div className="hidden lg:block w-1/2 h-[80%]"
                        style={{
                            backgroundImage: "url(/image2.jpg)",
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}>
                    </div>
                </div>
            </section>
        </>
    )
}