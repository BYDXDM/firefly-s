// data/games.ts — 游戏架数据：记录我在各个世界的足迹
// 加新游戏：往数组里加一条即可；status 只支持 'playing' | 'finished' | 'idle'

export interface GameEntry {
  name: string;
  platform: string;
  icon: string;          // emoji 徽章
  gradient: string;      // 卡片头图渐变（Tailwind 类）
  status: 'playing' | 'finished' | 'idle';
  progress: string;      // 一句话进度
  hours: string;         // 游戏时长/入坑时间
  comment: string;       // 简评
}

export const STATUS_LABEL: Record<GameEntry['status'], string> = {
  playing: '在玩',
  finished: '通关',
  idle: '考古中',
};

export const STATUS_COLOR: Record<GameEntry['status'], string> = {
  playing: 'bg-emerald-500',
  finished: 'bg-sky-500',
  idle: 'bg-slate-400',
};

export const games: GameEntry[] = [
  {
    name: '蔚蓝档案',
    platform: '手机游戏',
    icon: '💙',
    gradient: 'from-sky-400 to-indigo-500',
    status: 'playing',
    progress: '主线最终章 · 总力战毕业中',
    hours: '开服老师',
    comment: '为了她们，这座学园都市值得被守护。邦邦卡邦！',
  },
  {
    name: '明日方舟',
    platform: '手机游戏',
    icon: '⛏️',
    gradient: 'from-slate-600 to-slate-900',
    status: 'playing',
    progress: '集成战略常驻 · 五周年博士学位进修中',
    hours: '2020 至今',
    comment: '罗德岛的药不能停。源石技艺与 GROMACS 一样，都是玄学收敛。',
  },
  {
    name: '极限竞速：地平线 4',
    platform: 'PC · Steam',
    icon: '🏎️',
    gradient: 'from-amber-400 to-rose-500',
    status: 'playing',
    progress: '四季英国 · 车库收集强迫症发作中',
    hours: '100+ 小时',
    comment: '写代码累了就来一圈秋季暴雨泥地拉力，比咖啡管用。',
  },
  {
    name: '赛博朋克：边缘行者',
    platform: '动画 · NC24',
    icon: '🌙',
    gradient: 'from-yellow-400 via-cyan-400 to-fuchsia-500',
    status: 'finished',
    progress: '夜之城 AFTER STORY：单曲循环 I Really Want to Stay at Your House',
    hours: '刷了三遍',
    comment: '在夜之城的月亮下，把这段故事讲给博客的访客听。',
  },
];
