import Calendar from "@/components/Calendar";

export default function Home() {
    return (
        <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                    Integrated Schedule Dashboard
                </h1>
                <Calendar />
            </div>
        </main>
    );
}
