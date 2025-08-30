"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Signup() {
    const [logform, setlogform] = useState({ email: "", password: "", confirmPassword: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)
    const router = useRouter()

    const handleedit = (e) => {
        e.preventDefault()
        const { name, value } = e.target
        setlogform({ ...logform, [name]: value })
        
        // Clear error when user starts typing
        if (error) setError("")
        
        // Calculate password strength
        if (name === "password") {
            calculatePasswordStrength(value)
        }
    }

    const calculatePasswordStrength = (password) => {
        let strength = 0
        if (password.length >= 8) strength += 1
        if (/[A-Z]/.test(password)) strength += 1
        if (/[a-z]/.test(password)) strength += 1
        if (/[0-9]/.test(password)) strength += 1
        if (/[^A-Za-z0-9]/.test(password)) strength += 1
        setPasswordStrength(strength)
    }

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 1) return "bg-red-500"
        if (passwordStrength <= 2) return "bg-orange-500"
        if (passwordStrength <= 3) return "bg-yellow-500"
        if (passwordStrength <= 4) return "bg-blue-500"
        return "bg-green-500"
    }

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 1) return "Weak"
        if (passwordStrength <= 2) return "Fair"
        if (passwordStrength <= 3) return "Good"
        if (passwordStrength <= 4) return "Strong"
        return "Very Strong"
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Validation
        if (logform.password !== logform.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (logform.password.length < 6) {
            setError("Password must be at least 6 characters long")
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: logform.email, 
                    password: logform.password 
                }),
            })

            const data = await response.json()
            
            if (response.ok) {
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

    const handleGoogleSignup = () => {
        window.location.href = "/api/auth/google"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Toast Message */}
            {error && (
                <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 bg-red-600 text-white">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{error}</span>
                        <button 
                            onClick={() => setError("")}
                            className="ml-2 text-white/80 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 relative z-10">
                {/* Left Side - Signup Form */}
                <div className="flex items-center justify-center p-4 order-2 lg:order-1">
                    <div className="w-full max-w-md">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                                <p className="text-gray-300">Let's begin your journey with us</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            placeholder="Enter your email address"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                                            value={logform.email}
                                            onChange={handleedit}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            id="password"
                                            placeholder="Create a strong password"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm pr-12"
                                            value={logform.password}
                                            onChange={handleedit}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Password Strength Indicator */}
                                    {logform.password && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-300">{getPasswordStrengthText()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Input */}
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            placeholder="Confirm your password"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm pr-12"
                                            value={logform.confirmPassword}
                                            onChange={handleedit}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {/* Password Match Indicator */}
                                    {logform.confirmPassword && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {logform.password === logform.confirmPassword ? (
                                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Passwords match
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    Passwords don't match
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Terms and Conditions */}
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        required
                                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-300">
                                        I agree to the{" "}
                                        <Link href="#" className="text-green-400 hover:text-green-300 underline">
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link href="#" className="text-green-400 hover:text-green-300 underline">
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </div>

                                {/* Signup Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" />
                                            </svg>
                                            Creating account...
                                        </div>
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/20"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-transparent text-gray-400">Or sign up with</span>
                                    </div>
                                </div>

                                {/* Google Signup Button */}
                                <button
                                    type="button"
                                    onClick={handleGoogleSignup}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold border border-white/20 shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent backdrop-blur-sm"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Continue with Google
                                    </div>
                                </button>
                            </form>

                            {/* Login Link */}
                            <div className="mt-8 text-center">
                                <p className="text-gray-300">
                                    Already have an account?{" "}
                                    <Link 
                                        href="/login" 
                                        className="text-green-400 hover:text-green-300 font-semibold transition-colors hover:underline"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Image/Branding */}
                <div className="hidden lg:flex flex-col justify-center items-center p-8 order-1 lg:order-2">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
                        <div 
                            className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
                            style={{
                                backgroundImage: "url(/image2.jpg)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat"
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl"></div>
                            <div className="relative z-10 text-center text-white pt-40">
                                <h2 className="text-3xl font-bold mb-4">Join Us Today!</h2>
                                <p className="text-lg opacity-90">Start creating amazing question papers and building the future of education</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
