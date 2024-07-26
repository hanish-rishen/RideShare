import AuthenticationPage from "@/components/authentication";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-gray-100">
      <div className="w-full sm:w-auto border-2 border-gray-300 rounded-lg p-4 sm:p-8">
        <AuthenticationPage />
      </div>
    </main>
  );
}
