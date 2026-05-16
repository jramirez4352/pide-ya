export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4 shadow-lg shadow-orange-200">
              <span className="text-3xl">🍔</span>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">PideYa</h1>
            <p className="text-zinc-400 text-sm mt-1">Pide a tu restaurante favorito</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
