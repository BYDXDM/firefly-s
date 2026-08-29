// 一次性脚本：将 CyberCat.tsx 的猫娘文案替换为天童爱丽丝版
const fs = require('fs');
const f = 'components/CyberCat.tsx';
let s = fs.readFileSync(f, 'utf8');
const pairs = [
  ['speak("呼噜噜... 摸得本喵很舒服喵~ (煤球心情愉悦，发出满意的打呼声)", 3000);',
   'speak("诶嘿嘿…被教官摸头的话，爱丽丝会充满干劲的！攻击力暂时提升！", 3000);'],
  ['// --- 🐟 交互事件：喂小鱼干 ---', '// --- 🍓 交互事件：喂草莓牛奶 ---'],
  ['message: "我刚刚喂了你一条美味的小鱼干！你有什么表示？"',
   'message: "我刚刚给了你一瓶甜甜的草莓牛奶！你有什么表示？"'],
  ['speak(`吧唧吧唧... 哇！真好吃喵！\\n\\n${data.reply}`, 8000);',
   'speak(`咕嘟咕嘟… 好耶！草莓牛奶补给完成！\\n\\n${data.reply}`, 8000);'],
  ['speak("吧唧吧唧... 鱼干好吃，但本喵卡壳了喵...", 4000);',
   'speak("草莓牛奶很好喝…但爱丽丝的线路卡壳了……", 4000);'],
  ['speak("铲屎官的网线被老鼠咬断了吧？喵！", 4000);',
   'speak("通信中断了！这一定是主线剧情里才会出现的强敌……", 4000);'],
  ['speak("铲屎官，煤球的大脑连接超时了喵...", 4000);',
   'speak("教官，爱丽丝的大脑连接超时了……", 4000);'],
];
let fail = 0;
for (const [a, b] of pairs) {
  if (!s.includes(a)) { console.error('NOT FOUND:', a.slice(0, 50)); fail++; continue; }
  s = s.replace(a, b);
}
s = s.replace(`"喵呜~ 今天天气真不错喵~",`, `"今天也是适合推主线的好天气！",`);
s = s.replace(`"好困哦，想睡觉喵...",`, `"好困哦…爱丽丝的MP快耗尽了……",`);
s = s.replace(`"铲屎官，快去极客开发！",`, `"教官，快去开发新游戏！",`);
s = s.replace(`"我的小鱼干藏哪里去了？",`, `"我的草莓牛奶藏哪里去了？",`);
s = s.replace(`"怎么没人理本喵...",`, `"怎么没人理爱丽丝……",`);
s = s.replace(`{ label: "🔮 今日喵占", text: "给本铲屎官测一测今天的运势，用你独特的喵喵塔罗牌！" },`,
              `{ label: "🎮 今日运势", text: "给爱丽丝测一测今天的运势吧！用你独特的游戏抽卡方式！" },`);
s = s.replace(`{ label: "🚀 催更铲屎", text: "快用你最傲娇的语气催我去写代码和更新博客！" },`,
              `{ label: "🚀 催更教官", text: "用爱丽丝的方式催我去写代码和更新博客！" },`);
s = s.replace(`{ label: "💡 讲冷笑话", text: "给本铲屎官讲一个只有猫咪才能听懂的冷笑话喵！" },`,
              `{ label: "💡 游戏冷知识", text: "给爱丽丝讲一个只有老玩家才懂的游戏冷知识！" },`);
s = s.replace(`{ label: "❤️ 夸奖煤球", text: "煤球，你绝对是世界上最聪明、最帅气、最厉害的极客猫咪！" },`,
              `{ label: "❤️ 夸奖爱丽丝", text: "爱丽丝，你绝对是基沃托斯最勇敢、最可爱的英雄！" },`);
s = s.replace(`>煤球思考中`, `>爱丽丝思考中`);
s = s.replace(`title="喂小鱼干"`, `title="喂草莓牛奶"`);
s = s.replace(`🐟`, `🍓`);
s = s.replace(`placeholder={isThinking ? "煤球正在飞速思考..." : "跟煤球说点啥喵..."}`,
              `placeholder={isThinking ? "爱丽丝正在飞速思考..." : "跟爱丽丝说点啥……"}`);
s = s.replace(`background-image: url('/siamese-cat.png');`, `background-image: url('/alice-sprite.png');`);
fs.writeFileSync(f, s);
console.log(fail === 0 ? 'all replaced' : fail + ' patterns missing');
