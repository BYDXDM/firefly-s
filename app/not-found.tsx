import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto mt-32 mb-20 px-6 relative z-10 flex flex-col items-center text-center">
        {/* 爱丽丝立绘 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/alice-sprite.webp"
          alt="天童爱丽丝"
          className="h-56 sm:h-72 object-contain object-bottom drop-shadow-2xl"
          style={{ animation: 'alice-float 3.2s ease-in-out infinite' }}
        />

        <h1 className="mt-6 text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
          404
        </h1>

        <div className="mt-4 px-5 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg max-w-md">
          <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
            该页面已被什亭之匣回收…
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            阿罗娜：老师，检索了全部档案库，这里好像什么都没有哦。<br />
            爱丽丝：一定是隐藏地图！可惜爱丽丝的探索进度还没解锁这里…
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            返回庭院
          </Link>
          <Link
            href="/music"
            className="px-6 py-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-black border border-slate-200/60 dark:border-slate-700/60 shadow transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            去听歌
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes alice-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
}
