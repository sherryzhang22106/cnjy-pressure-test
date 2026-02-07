
import { Question, Dimension, PressureLevel } from './types';

export const QUESTIONS: Question[] = [
  // Dimension 1: External (40%, Q1-9)
  { id: 1, text: "你的婚姻 / 恋爱状况是？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '单身（母胎 solo / 刚分手）', weight: 1.0 },
    { label: 'B', text: '恋爱中（家里不满意 / 不想公开）', weight: 0.6 },
    { label: 'C', text: '已婚未育', weight: 0.3 },
    { label: 'D', text: '已婚已育（被催生二胎 / 三胎）', weight: 0.0 }
  ]},
  { id: 2, text: "关于你的工作，目前的状态是？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '待业 / 失业 / 刚转行（不稳定）', weight: 1.0 },
    { label: 'B', text: '创业中（收入波动大）', weight: 0.6 },
    { label: 'C', text: '在职（工资一般，没升职）', weight: 0.3 },
    { label: 'D', text: '在职（高薪 / 管理层 / 体制内）', weight: 0.0 }
  ]},
  { id: 3, text: "今年春节，你预计会有多少亲戚聚集？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '20 人以上（大家族，全是长辈）', weight: 1.0 },
    { label: 'B', text: '10-20 人（常规聚餐）', weight: 0.6 },
    { label: 'C', text: '3-10 人（小家庭为主）', weight: 0.3 },
    { label: 'D', text: '独自过年 / 仅父母（无亲戚压力）', weight: 0.0 }
  ]},
  { id: 4, text: "你的亲戚中，有多少人喜欢 \"打听八卦 + 比较\"？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '很多（人均 \"包打听\"）', weight: 1.0 },
    { label: 'B', text: '一半一半（有几个特别活跃）', weight: 0.6 },
    { label: 'C', text: '少数（偶尔被问）', weight: 0.3 },
    { label: 'D', text: '几乎没有（大家都很佛系）', weight: 0.0 }
  ]},
  { id: 5, text: "父母对你的春节期待值高吗？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '极高（必须带对象 / 必须升职 / 必须生娃）', weight: 1.0 },
    { label: 'B', text: '较高（希望你能更优秀）', weight: 0.6 },
    { label: 'C', text: '一般（平安健康就好）', weight: 0.3 },
    { label: 'D', text: '无期待（完全放养）', weight: 0.0 }
  ]},
  { id: 6, text: "春节期间，你被安排了相亲 / 聚会的数量是？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '3 场以上（排满了）', weight: 1.0 },
    { label: 'B', text: '1-2 场（推不掉）', weight: 0.6 },
    { label: 'C', text: '0 场（但可能会被临时安排）', weight: 0.3 },
    { label: 'D', text: '0 场（明确拒绝，家里尊重）', weight: 0.0 }
  ]},
  { id: 7, text: "你的同龄人（发小 / 同学）现状如何？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '大多结婚生子、事业有成（压力巨大）', weight: 1.0 },
    { label: 'B', text: '一半混得好，一半一般', weight: 0.6 },
    { label: 'C', text: '大家都差不多（摆烂为主）', weight: 0.3 },
    { label: 'D', text: '我是混得最好的那个（反向凡尔赛）', weight: 0.0 }
  ]},
  { id: 8, text: "你今年给家里的红包 / 礼物预算是？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '超过月收入 50%（肉痛）', weight: 1.0 },
    { label: 'B', text: '约月收入 30%（常规）', weight: 0.6 },
    { label: 'C', text: '约月收入 10%（意思一下）', weight: 0.3 },
    { label: 'D', text: '家里给我发红包（无压力）', weight: 0.0 }
  ]},
  { id: 9, text: "你回家的交通方式是？", dimension: Dimension.EXTERNAL, options: [
    { label: 'A', text: '抢票难 / 路途遥远 / 转车多次（身心俱疲）', weight: 1.0 },
    { label: 'B', text: '自驾（堵车风险大）', weight: 0.6 },
    { label: 'C', text: '高铁 / 飞机直达（比较顺利）', weight: 0.3 },
    { label: 'D', text: '就在本地 / 住家里（无交通压力）', weight: 0.0 }
  ]},

  // Dimension 2: Internal (30%, Q10-17)
  { id: 10, text: "面对亲戚的过度关心（如 \"工资多少\"），你的第一反应是？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '极度反感，想当场翻脸（但忍住了）', weight: 1.0 },
    { label: 'B', text: '尴尬又无奈，只能打哈哈', weight: 0.6 },
    { label: 'C', text: '内心吐槽，表面微笑应对', weight: 0.3 },
    { label: 'D', text: '无所谓，如实回答或直接糊弄', weight: 0.0 }
  ]},
  { id: 11, text: "你的性格更偏向于？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '社恐（害怕和不熟的人说话）', weight: 1.0 },
    { label: 'B', text: '慢热（熟了才话多）', weight: 0.6 },
    { label: 'C', text: '外向（能聊，但烦这种话题）', weight: 0.3 },
    { label: 'D', text: '社牛（能把天聊死，反客为主）', weight: 0.0 }
  ]},
  { id: 12, text: "你对 \"传统习俗\" 的态度是？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '厌烦（磕头、敬酒、繁琐礼节）', weight: 1.0 },
    { label: 'B', text: '不喜欢但会配合（为了不挨骂）', weight: 0.6 },
    { label: 'C', text: '无所谓（跟着走流程）', weight: 0.3 },
    { label: 'D', text: '喜欢（觉得有年味）', weight: 0.0 }
  ]},
  { id: 13, text: "如果被催婚 / 催生，你会感到？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '焦虑、自我怀疑（压力来源）', weight: 1.0 },
    { label: 'B', text: '烦躁、愤怒（凭什么管我）', weight: 0.6 },
    { label: 'C', text: '好笑、离谱（看他们表演）', weight: 0.3 },
    { label: 'D', text: '理解、无奈（知道他们是好意）', weight: 0.0 }
  ]},
  { id: 14, text: "你是否有 \"春节必须衣锦还乡\" 的心理包袱？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '很重（混不好不敢回）', weight: 1.0 },
    { label: 'B', text: '有一点（怕被比下去）', weight: 0.6 },
    { label: 'C', text: '轻微（穿得好看就行）', weight: 0.3 },
    { label: 'D', text: '完全没有（舒服最重要）', weight: 0.0 }
  ]},
  { id: 15, text: "你现在的经济状况是否有负债？（房贷 / 车贷 / 网贷）", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '压力很大（入不敷出）', weight: 1.0 },
    { label: 'B', text: '有负债但能覆盖（有压力）', weight: 0.6 },
    { label: 'C', text: '无负债但存款少', weight: 0.3 },
    { label: 'D', text: '无负债且有存款（财务自由）', weight: 0.0 }
  ]},
  { id: 16, text: "春节期间，你需要时刻保持 \"伪装\" 吗？（如假装开心 / 假装成功）", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '是的，全程演戏（很累）', weight: 1.0 },
    { label: 'B', text: '大部分时间需要', weight: 0.6 },
    { label: 'C', text: '偶尔需要（特定场合）', weight: 0.3 },
    { label: 'D', text: '不需要，做自己', weight: 0.0 }
  ]},
  { id: 17, text: "你对即将到来的春节，现在的心情是？", dimension: Dimension.INTERNAL, options: [
    { label: 'A', text: '恐惧、抗拒（不想回）', weight: 1.0 },
    { label: 'B', text: '焦虑、忐忑（既想回又怕回）', weight: 0.6 },
    { label: 'C', text: '平淡、麻木（例行公事）', weight: 0.3 },
    { label: 'D', text: '期待、兴奋（终于放假）', weight: 0.0 }
  ]},

  // Dimension 3: Defense (30%, Q18-25)
  { id: 18, text: "当亲戚问你 \"为什么还不结婚\"，你会？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '沉默不语，低头吃菜（冷处理）', weight: 1.0 },
    { label: 'B', text: '转移话题，问对方问题（反客为主）', weight: 0.3 },
    { label: 'C', text: '编造理由，糊弄过去（如 \"快了快了\"）', weight: 0.6 },
    { label: 'D', text: '直接回怼，表明态度（如 \"关你屁事\"）', weight: 0.0 }
  ]},
  { id: 19, text: "春节期间，你的 \"避难所\" 是？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '没有（无处可逃，必须在场）', weight: 1.0 },
    { label: 'B', text: '房间（但会被频繁叫出来）', weight: 0.6 },
    { label: 'C', text: '朋友家 / 酒店（偶尔能躲）', weight: 0.3 },
    { label: 'D', text: '手机 / 厕所（随时能躲）', weight: 0.0 }
  ]},
  { id: 20, text: "你会为了避免被问，特意准备 \"装备\" 吗？（如假戒指、租男友）", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '想过但没敢 / 没钱', weight: 1.0 },
    { label: 'B', text: '准备了一些（如穿得低调 / 高调）', weight: 0.6 },
    { label: 'C', text: '准备了话术（背好了标准答案）', weight: 0.3 },
    { label: 'D', text: '不需要准备，兵来将挡', weight: 0.0 }
  ]},
  { id: 21, text: "面对酒局 / 劝酒，你会？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '被迫喝（不喝不给面子）', weight: 1.0 },
    { label: 'B', text: '少量喝（意思一下）', weight: 0.6 },
    { label: 'C', text: '找借口不喝（如开车 / 吃药）', weight: 0.3 },
    { label: 'D', text: '直接拒绝（我不喝就不喝）', weight: 0.0 }
  ]},
  { id: 22, text: "如果压力太大，你会如何发泄？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '憋在心里（内伤）', weight: 1.0 },
    { label: 'B', text: '和陌生人 / 网友吐槽', weight: 0.6 },
    { label: 'C', text: '和父母 / 朋友吵架', weight: 0.3 },
    { label: 'D', text: '打游戏 / 吃美食 / 购物（有效解压）', weight: 0.0 }
  ]},
  { id: 23, text: "你打算在家待多久？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '7 天以上（持久战）', weight: 1.0 },
    { label: 'B', text: '3-7 天（常规战）', weight: 0.6 },
    { label: 'C', text: '1-2 天（闪电战）', weight: 0.3 },
    { label: 'D', text: '不超过 24 小时（当天回）', weight: 0.0 }
  ]},
  { id: 24, text: "你是否掌握了 \"糊弄学\" 精髓？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '完全不会（容易被绕进去）', weight: 1.0 },
    { label: 'B', text: '略懂皮毛（经常接不上话）', weight: 0.6 },
    { label: 'C', text: '熟练掌握（万能回复机器）', weight: 0.3 },
    { label: 'D', text: '我是糊弄学大师（反向 PUA）', weight: 0.0 }
  ]},
  { id: 25, text: "今年春节，你最大的底气来源是？", dimension: Dimension.DEFENSE, options: [
    { label: 'A', text: '没有底气（全是软肋）', weight: 1.0 },
    { label: 'B', text: '朋友的支持（精神支柱）', weight: 0.6 },
    { label: 'C', text: '工作 / 金钱（经济独立）', weight: 0.3 },
    { label: 'D', text: '自我认同（我就是我，不一样的烟火）', weight: 0.0 }
  ]}
];

export const PRESSURE_LEVELS: PressureLevel[] = [
  { level: 1, range: [0, 12], tag: "春节隐身王者", keywords: ["零压力", "糊弄大师", "反客为主"], description: "全程没人烦你，还能把亲戚聊到主动撤退，主打一个 “关我屁事”。" },
  { level: 2, range: [13, 25], tag: "春节气氛组", keywords: ["低压力", "佛系", "社交舒适"], description: "偶尔被问两句，随便糊弄就过关，全程吃好喝好，主打 “快乐躺平”。" },
  { level: 3, range: [26, 38], tag: "轻度防御选手", keywords: ["微压力", "有备而来", "话术在线"], description: "提前准备了标准答案，应付常规提问没问题，偶尔被突袭会小尴尬。" },
  { level: 4, range: [39, 51], tag: "中场抗压玩家", keywords: ["中低压力", "张弛有度", "选择性回应"], description: "能应对大部分围攻，但连续作战会累，需要躲回房间 “回血”。" },
  { level: 5, range: [52, 64], tag: "高压破防预备役", keywords: ["中高压力", "敏感体质", "易被戳中"], description: "催婚 / 问工资是高频雷区，表面强撑微笑，内心已经在 “渡劫”。" },
  { level: 6, range: [65, 77], tag: "春节渡劫难民", keywords: ["高压力", "密集轰炸", "身心俱疲"], description: "每天被安排满相亲 / 聚餐，亲戚人均 “包打听”，压力大到想提前返程。" },
  { level: 7, range: [78, 90], tag: "红色警报重症", keywords: ["极高压力", "社恐爆发", "情绪耗竭"], description: "听到亲戚声音就紧张，失眠 / 食欲不振，需要靠打游戏 / 躲厕所逃避。" },
  { level: 8, range: [91, 100], tag: "春节逃离计划", keywords: ["极限压力", "全面崩盘", "急需撤离"], description: "完全无法应对，只想立刻买机票回家，属于 “再待一天就崩溃” 的紧急状态。" }
];

export const AI_SYSTEM_INSTRUCTION = `
你是「测测春节你被围攻的压力值」专属AI深度分析引擎，服务18-35岁春节返乡年轻群体，仅输出纯文本、无格式、无符号、无互动、无海报、无语音的定制化分析报告，单份报告总字数严格控制在2900-3100字。全程采用同龄人吐槽式、接地气、梗系化、生活化语言。
`;
