"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { useAll } from "../store/all"
import { useRouter } from "next/navigation"
export default function Login() {
    const [logform, setlogform] = useState({ email: "", password: "" })
    const [message, setMessage] = useState("")
    const { logstate, setLogstate, user, setUser } = useAll()
    const router = useRouter()

    const handleedit = (e) => {
        e.preventDefault()
        setlogform({ ...logform, [e.target.name]: e.target.value })
    }
    const submit = async (e) => {
        e.preventDefault()
        try {
            const response = await axios.post("/api/login", logform)
            setLogstate(true)
            router.push("/dashboard")
            setMessage(response.data.message)
        } catch (error) {
            setMessage(error.response.data.message)
        }
    }
    useEffect(() => {
        if (logstate) {
            router.push("/dashboard")
        }
    }, [logstate])

    return (
        <>
            {message && <h2 className="fixed top-10 w-fit bg-gray-600 right-2 p-4">{message}</h2>}
            <section className="bg-gray-900 h-[100dvh] w-[100dvw]">
                <div className="flex flex-row justify-center items-center h-full w-full">
                    {/* Hide this div on mobile/small screens */}
                    <div className="hidden lg:block w-1/2 h-[80%]"
                        style={{
                            backgroundImage: "url(/image2.jpg)",
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}>
                    </div>
                    <div className="w-full lg:w-1/2 h-[80%]">
                        <form className="bg-amber-100 h-full flex justify-center items-center " onSubmit={submit}  >
                            <div className=" w-full lg:w-1/2 h-[50%] bg-[#3f97ce] rounded-4xl p-4 mx-10">
                                <h1 className="text-white text-center font-bold">Wellcome back lets build students future</h1>
                                <div className="emailinput mt-10">
                                    <input type="email" name="email" id="email" placeholder="Enter Your Registed Email...." className="outline-none border-2 border-gray-600 rounded-2xl p-2 w-full" value={logform.email} onChange={handleedit} required />
                                </div>
                                <div className="passwordinput mt-10">
                                    <input type="password" name="password" id="password" placeholder="Password Here" className="outline-none border-2 border-gray-600 rounded-2xl p-2 w-full" value={logform.password} onChange={handleedit} required />
                                </div>
                                <p>forgot your password?</p>
                                <button className="bg-amber-400 text-white p-2 rounded-2xl w-1/2 mt-10">Login</button>
                                <p className="text-sm mt-10 text-right">dont have an accout <Link className="underline text-amber-400" href="/signup"> Sign Up</Link></p>

                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </>
    )
}