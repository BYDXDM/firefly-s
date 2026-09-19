// 🎧 爱丽丝官方语音台词数据（萌娘百科公共存储 · 女仆爱丽丝 CV 线，个人粉丝博客非商用）
// 每条 mp3 都配好「官方日文台词 + 中文翻译」，台词与音频一一对应、不再各自随机，
// 因此字幕说的就是语音正在说的话。dur 为实测时长（秒），仅在拿不到音频元数据时兜底。
// 纯数据 + 纯查表函数，不含任何播放逻辑（播放见 lib/alice/voice.ts）。

export type AliceVoiceLine = { jp: string; cn: string; dur: number };

export const ALICE_VOICE_LINES: Record<string, AliceVoiceLine> = {
  "/voice/alice/lobby-1.mp3": {
    jp: "今日のアリスはメイドであり勇者！つまりメイド勇者です！メイド勇者とは、メイドと勇者を極めた先にあります。RPGで例えるなら上級職です！",
    cn: "今天的爱丽丝是女仆也是勇者！也就是女仆勇者！所谓女仆勇者，位于女仆和勇者极限的前方。用RPG来举例的话就是高等职业！",
    dur: 15.5,
  },
  "/voice/alice/lobby-2.mp3": {
    jp: "メイド服に着替えると、お掃除スキルが上がった気がします！先生、どこかお掃除するところはありますか？",
    cn: "换上女仆装之后，感觉打扫技能升级了！老师，你有需要打扫的地方吗？",
    dur: 9.1,
  },
  "/voice/alice/lobby-3.mp3": {
    jp: "メイドは様々なお仕事をこなすと聞きました！お料理、お掃除、お洗濯♪破壊に強襲、警備に世界平和まで！",
    cn: "听说女仆会做各种工作！料理、打扫、洗衣服♪从破坏到强袭，从警备到世界和平！",
    dur: 9.5,
  },
  "/voice/alice/lobby-4.mp3": {
    jp: "狙撃手にとって、平常心が大事だと聞きました。せ、先生？そんなに頭を撫でられると…………ふわぁ。アリスは平常心を失ってしまいました……",
    cn: "听说对狙击手来说平常心是很重要的。老，老师？头被这样摸的话…………呼哇。爱丽丝失去了平常心……",
    dur: 16.6,
  },
  "/voice/alice/lobby-5.mp3": {
    jp: "先生、今日のスケジュールを教えてください！一日中、ゴロゴロするんですか……？え、アリスも……？はい！アリスもゴロゴロします！",
    cn: "老师，请告诉爱丽丝你今天的行程！要耍废一整天是吗……？咦，爱丽丝也要……？是！爱丽丝也要耍废！",
    dur: 14.1,
  },
  "/voice/alice/memorial-1.mp3": {
    jp: "せ、先生！？アリス、まだ準備中なので……",
    cn: "老，老师！？爱丽丝，还在准备中……",
    dur: 6,
  },
  "/voice/alice/memorial-2.mp3": {
    jp: "メイドを克服し、ジョブチェンジしたアリスの姿……先生に見せようと思ったのですが……アリスの支度が整うまで、もう少しだけ待っていてください。",
    cn: "克服了对女仆的恐惧，转职后的爱丽丝的身姿……想让老师也看一看……在爱丽丝打理完成之前，还请稍微再等一会儿。",
    dur: 14.6,
  },
  "/voice/alice/memorial-3.mp3": {
    jp: "その通りです！もうメイドは怖くありません！これも全部、先生が居てくれたおかげです。",
    cn: "就是这样！女仆已经没什么好怕的了！这也都是，多亏了老师的帮忙。",
    dur: 8.8,
  },
  "/voice/alice/memorial-4.mp3": {
    jp: "先生と一緒なら……アリスはどんなダンジョンでも攻略できますから。",
    cn: "如果和老师在一起的话……爱丽丝感觉不管是什么地下城都可以攻略下来呢。",
    dur: 7.1,
  },
  "/voice/alice/memorial-5.mp3": {
    jp: "はいっ！アリス、冒険の準備が整いました！",
    cn: "嗯！爱丽丝，已经准备好出发冒险了！",
    dur: 4.8,
  },
  "/voice/alice/cafe-1.mp3": {
    jp: "……どこからお掃除しましょう？",
    cn: "从哪里开始打扫呢？",
    dur: 2.4,
  },
  "/voice/alice/cafe-2.mp3": {
    jp: "サブクエストが発生しそうな場所です……！",
    cn: "是可能发生支线任务的地方……！",
    dur: 2.9,
  },
  "/voice/alice/cafe-3.mp3": {
    jp: "アリス、知ってます。世の中にはメイドカフェというものがあるらしいです！",
    cn: "爱丽丝知道。世界上好像有女仆咖啡店！",
    dur: 6.2,
  },
  // 「获得学生」线：「邦吧咔邦」高频触发语音（原为 gachaget，配对信息保留完整）
  "/voice/alice/gachaget.mp3": {
    jp: "メイドにジョブチェンジしても、アリスはアリスです。見ていてください、先生！",
    cn: "即使换成女仆，爱丽丝也是爱丽丝。请看着，老师！",
    dur: 6.5,
  },
  "/voice/alice/season-birthday.mp3": {
    jp: "ゲーム開発部のみんな、そして先生と出会った日……あの日の出来事を、アリスは忘れません。先生、これからもよろしくお願いします！",
    cn: "和游戏开发部的大家，还有老师相遇的日子……那天所发生的事情，爱丽丝不会忘记的。老师，今后也请你多多指教！",
    dur: 15.9,
  },
  "/voice/alice/season-newyear.mp3": {
    jp: "あけましておめでとうございます、先生！メイドアリスの初仕事、何が良いですか？……そばに居るだけで良いんですか？",
    cn: "新年快乐，老师！女仆爱丽丝的第一项工作，该做什么好呢？……待在你旁边就好了吗？",
    dur: 10.8,
  },
  "/voice/alice/season-xmas.mp3": {
    jp: "アリス、知っています。ゲームでも現実でも、クリスマスはイベントの時間です！",
    cn: "爱丽丝知道。无论是游戏还是现实，圣诞节就是活动的时间！",
    dur: 6.7,
  },
  "/voice/alice/season-halloween.mp3": {
    jp: "ハッピーハロウィーン！みんなでゲームのキャラクターみたいに仮装する日ですね！それとも……ゲームが現実になる日なのでしょうか？",
    cn: "万圣节快乐！是大家一起打扮成游戏角色的日子呢还是……是游戏成为现实的日子？",
    dur: 11.4,
  },
};

// 🎧 场景语音池：只列 mp3 路径，台词与时长统一从 ALICE_VOICE_LINES 查，保证语音/字幕同源
// 摸头：大厅4「被摸头会失去平常心」+ 记忆大厅的亲密触摸线
export const VOICE_BANG = '/voice/alice/gachaget.mp3';

export const POOL_PET = [
  '/voice/alice/lobby-4.mp3',
  '/voice/alice/memorial-1.mp3', '/voice/alice/memorial-3.mp3',
  '/voice/alice/memorial-4.mp3', '/voice/alice/memorial-5.mp3',
];

// 待机：游戏内「大厅」语音线（lobby-1~5），是原作里站在主界面时会说的话
export const POOL_IDLE = [
  '/voice/alice/lobby-1.mp3', '/voice/alice/lobby-2.mp3', '/voice/alice/lobby-3.mp3',
  '/voice/alice/lobby-4.mp3', '/voice/alice/lobby-5.mp3',
];

// 喂食：咖啡厅独白（原作里女仆在咖啡厅的独白，与「吃的」语境最贴近）
export const POOL_FEED = [
  '/voice/alice/cafe-1.mp3', '/voice/alice/cafe-2.mp3', '/voice/alice/cafe-3.mp3',
];

// 节日专属语音（与日期彩蛋联动）
const VOICE_SEASON: Record<string, string> = {
  '03-25': '/voice/alice/season-birthday.mp3',
  '10-31': '/voice/alice/season-halloween.mp3',
  '12-24': '/voice/alice/season-xmas.mp3',
  '12-25': '/voice/alice/season-xmas.mp3',
  '01-01': '/voice/alice/season-newyear.mp3',
  '01-02': '/voice/alice/season-newyear.mp3',
  '01-03': '/voice/alice/season-newyear.mp3',
};

// 教师节没有官方节日语音，借记忆大厅3「这也都是多亏了老师」的致谢线
const VOICE_TEACHERS_DAY = '/voice/alice/memorial-3.mp3';

/** 节日当天优先专属日配；教师节借用致谢线；其余日子返回 null（调用方走普通池） */
export function pickSeasonVoice(now: Date = new Date()): string | null {
  const key = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return VOICE_SEASON[key] ?? (key === '09-10' ? VOICE_TEACHERS_DAY : null);
}
