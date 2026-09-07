import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="w-14 h-14 bg-[#F8C39B] text-[#1C1835] rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg">
        404
      </div>
      <h2 className="text-xl font-black text-white">Page Not Found</h2>
      <p className="text-xs text-[#9E97C2]">The requested page could not be located.</p>
      <Link
        href="/"
        className="px-5 py-3 bg-[#F8C39B] text-[#1C1835] font-black rounded-2xl text-xs shadow-md transition-transform hover:scale-105"
      >
        Return to Home
      </Link>
    </div>
  );
}
