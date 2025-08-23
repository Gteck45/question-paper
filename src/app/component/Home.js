export default function Home() {

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white min-h-screen w-full flex flex-col items-center justify-center">
            <h1 className="mt-8 mb-6 text-center text-4xl font-extrabold tracking-wide text-amber-400 drop-shadow-lg">
                Welcome
            </h1>
            <div className="w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl bg-gray-800">
                <div className="flex flex-col md:flex-row h-[70vh]">
                    <div
                        className="md:w-1/2 w-full min-h-[250px] flex items-center justify-center bg-gray-900"
                        style={{
                            backgroundImage: "url(/image.png)",
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}
                    />
                    <div className="md:w-1/2 w-full h-full bg-gray-700 flex flex-col justify-center p-8 text-amber-300">
                        <h2 className="text-center text-3xl font-bold mb-4">Why Choose Us?</h2>
                        <p className="mb-2 text-lg">Simplify your workflow with our easy-to-use platform.</p>
                        <p className="mb-4 text-lg">Translate content into any language instantly—no need for external tools.</p>
                        <div className="about bg-amber-100 bg-opacity-10 rounded-lg p-4 text-black">
                            <h3 className="text-2xl font-semibold mb-2 text-amber-700">Effortless Question Paper Creation</h3>
                            <p className="text-base text-gray-900">Quickly generate and print question papers, saving valuable time for educators.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}