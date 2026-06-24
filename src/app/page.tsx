// src/app/page.tsx — S-01 Landing (exact spec copy)
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex justify-between items-center px-5 pt-3 text-xs font-semibold">
        <span>9:41</span>
        <span>●●● WiFi 🔋</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="text-[52px] font-black tracking-[-3px] leading-none mb-5">QuicKeys</h1>
          <p className="text-gray-500 text-lg leading-snug">
            A dating app that goes beyond dating
          </p>
        </div>

        <div className="w-full space-y-3 mb-10">
          <Link
            href="/auth/signup"
            className="block w-full bg-black text-white text-center py-4 rounded-xl font-semibold text-base tracking-tight hover:opacity-90 transition-opacity"
          >
            Create Account
          </Link>
          <Link
            href="/auth/signin"
            className="block w-full bg-white text-black text-center py-4 rounded-xl font-semibold text-base tracking-tight border-[1.5px] border-black hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="text-gray-400 text-sm text-center leading-relaxed">
          QuicKeys helps you navigate what happens after the conversation, not just during it.
        </p>
      </div>

      <div className="px-6 pb-8">
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span>Built for real connections</span>
          <span>•</span>
          <span>Guided by Pax™</span>
          <span>•</span>
          <span>Privacy first</span>
        </div>
      </div>
    </div>
  )
}
