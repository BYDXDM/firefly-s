import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { games, STATUS_LABEL, STATUS_COLOR } from '../../data/games';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: '游戏架 | ' + siteConfig.title,
  description: '记录我在各个世界的足迹',
};

export default function GamesPage() {
  return (
    <div className="min-h-screen relative pb-16">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-5xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 relative z-10">
          {/* 页头 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-wide">
              游戏<span className="text-indigo-500">架</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-bold tracking-widest">
              记录我在各个世界的足迹
            </p>
          </div>

          {/* 游戏卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {games.map((game) => (
              <div
                key={game.name}
                className="group rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl"
              >
                {/* 头图区 */}
                <div className={`relative h-24 bg-gradient-to-br ${game.gradient} flex items-center justify-between px-5`}>
                  <span className="text-4xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                    {game.icon}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black text-white px-2.5 py-0.5 rounded-full ${STATUS_COLOR[game.status]} shadow`}>
                      {STATUS_LABEL[game.status]}
                    </span>
                    <span className="text-[10px] font-bold text-white/80">{game.platform}</span>
                  </div>
                </div>

                {/* 内容区 */}
                <div className="p-5">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">{game.name}</h2>
                  <p className="mt-1 text-xs font-bold text-indigo-500 dark:text-indigo-400">
                    {game.progress}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                    ⏳ {game.hours}
                  </p>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-400/50 pl-3">
                    {game.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-10 tracking-widest">
            —— 每一个世界，都值得认真游玩 ——
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
