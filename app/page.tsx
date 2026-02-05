import Calendar from "@/components/Calendar";

export default function Home() {
    return (
        <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
                        LAYER STUDIOS
                    </h1>
                    <p className="text-sm md:text-base font-medium tracking-[0.3em] text-gray-500 uppercase">
                        Reservation Status
                    </p>
                </div>
                <Calendar />
            </div>
        </main>
    );
}
