import Calendar from "@/components/Calendar";

export default function Home() {
    return (
        <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 leading-snug">
                    LAYER STUDIOS<br />
                    RESERVATION STATUS
                </h1>
                <Calendar />
            </div>
        </main>
    );
}
