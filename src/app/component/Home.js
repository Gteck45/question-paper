"use client";

export default function Home() {
    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 drop-shadow-2xl mb-6 animate-pulse">
                        Welcome
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                        Simplify your workflow with our easy-to-use platform for creating question papers
                    </p>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                    <div className="flex flex-col lg:flex-row min-h-[70vh]">
                        {/* Left Side - Image */}
                        <div
                            className="lg:w-1/2 w-full min-h-[300px] lg:min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 relative"
                            style={{
                                backgroundImage: "url(/image.png)",
                                backgroundSize: "contain",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat"
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                        </div>

                        {/* Right Side - Content */}
                        <div className="lg:w-1/2 w-full bg-gradient-to-br from-slate-700/50 to-slate-600/50 flex flex-col justify-center p-8 lg:p-12 text-amber-100 backdrop-blur-sm">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white">Why Choose Us?</h2>
                            
                            <div className="space-y-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Easy Workflow</h3>
                                        <p className="text-gray-300">Simplify your workflow with our intuitive platform designed for educators.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Instant Translation</h3>
                                        <p className="text-gray-300">Translate content into any language instantly—no need for external tools.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Time Saving</h3>
                                        <p className="text-gray-300">Create and print question papers quickly, saving valuable time for educators.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Highlight Box */}
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
                                <h3 className="text-2xl font-semibold mb-3 text-amber-300 flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Effortless Question Paper Creation
                                </h3>
                                <p className="text-amber-100 leading-relaxed">
                                    Quickly generate and print professional question papers with our advanced AI-powered platform, 
                                    designed specifically for modern educational needs.
                                </p>
                            </div>

                            {/* Call to Action */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={() => window.location.href = '/signup'}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-500/50"
                                >
                                    Get Started
                                </button>
                                <button 
                                    onClick={() => window.location.href = '/login'}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl border border-white/30 shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 backdrop-blur-sm"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Smart Templates</h3>
                        <p className="text-gray-300">Pre-built templates for different subjects and exam types.</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
                        <p className="text-gray-300">Get help from AI to generate questions and format papers.</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Export Options</h3>
                        <p className="text-gray-300">Export to PDF, print directly, or share digitally.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}