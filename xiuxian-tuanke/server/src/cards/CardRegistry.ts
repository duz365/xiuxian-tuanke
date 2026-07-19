import { CardDefinition } from '../types'

export const cardRegistry: Record<string, CardDefinition> = {
  // ==================== 战斗 ====================
  'sword-fly': {
    id: 'sword-fly',
    name: '御剑术',
    type: 'attack',
    allowedTargets: ['enemy', 'npc'],
    aiPromptTemplate: `{caster}掐诀御剑，一道剑光斩向{target}。

请描述飞剑的轨迹与光芒形态。

进行D20+{stat}判定，DC={dc}。

成功：飞剑命中，造成{damage}点剑气伤害，描述创伤效果。

失败：飞剑被格挡或闪避，描述对方的应对。

{hiddenInstruction}

要求：{maxLength}字以内，{tone}风格。`,
    params: { stat: 'spirit', dice: '2d6' },
    structuredOutput: { fields: ['narrative', 'damage', 'dcResult'] },
    maxResponseLength: 120,
    tone: '仙侠飘逸'
  },

  'qi-slash': {
    id: 'qi-slash',
    name: '剑气斩',
    type: 'attack',
    allowedTargets: ['enemy'],
    aiPromptTemplate: `{caster}凝聚剑气于刃，近距离斩出一道凌厉的弧光劈向{target}。

请描述剑气形态与破空之声。

进行D20+{stat}判定，DC={dc}。

成功：剑气命中，造成{damage}点伤害并击退目标，描述冲击力。

失败：招式用老露出破绽，{caster}下回合防御判定-2。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: { stat: 'body', dice: '1d10+2' },
    structuredOutput: { fields: ['narrative', 'damage', 'dcResult'] },
    maxResponseLength: 100
  },

  'water-dragon': {
    id: 'water-dragon',
    name: '水龙吟',
    type: 'attack',
    allowedTargets: ['enemy', 'npc'],
    aiPromptTemplate: `{caster}双手结印，凭空凝聚出一条水龙，咆哮着扑向{target}。

请描述水龙的形态与威势。

进行D20+{stat}判定，DC={dc}。

成功：水龙冲击造成{damage}点水行伤害，附加「潮湿」状态。

失败：水龙溃散化为漫天水珠，但仍溅湿目标。

{hiddenInstruction}

要求：{maxLength}字以内，{tone}风格。`,
    params: { stat: 'spirit', dice: '2d6' },
    structuredOutput: { fields: ['narrative', 'damage', 'dcResult', 'statusEffect'] },
    maxResponseLength: 120,
    tone: '仙侠飘逸'
  },

  'mountain-fist': {
    id: 'mountain-fist',
    name: '崩山拳',
    type: 'attack',
    allowedTargets: ['enemy'],
    aiPromptTemplate: `{caster}灵力灌注双拳，拳风厚重如山崩，一拳轰向{target}。

请描述拳风的压迫感与地面的震颤。

进行D20+{stat}判定，DC={dc}。

成功：拳力贯穿，造成{damage}点伤害，可击碎护甲类防御。

失败：拳力被卸开，但{target}仍被震退半步。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: { stat: 'body', dice: '2d6+1', dcModifier: -2 },
    structuredOutput: { fields: ['narrative', 'damage', 'dcResult'] },
    maxResponseLength: 100
  },

  'ice-curse': {
    id: 'ice-curse',
    name: '寒冰咒',
    type: 'attack',
    allowedTargets: ['enemy', 'npc'],
    aiPromptTemplate: `{caster}掐诀念咒，指尖寒气凝结，冰蓝色的咒力笼罩{target}。

请描述冰霜蔓延的过程与对方的反应。

进行D20+{stat}判定，DC={dc}。

成功：目标被冻结在原地1回合无法行动，描述冰封景象。

失败：目标被减速但未冻结，仍可行动。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: { stat: 'spirit', dcModifier: 2 },
    structuredOutput: { fields: ['narrative', 'dcResult', 'statusEffect'] },
    maxResponseLength: 100
  },

  // ==================== 防御 ====================
  'gold-shield': {
    id: 'gold-shield',
    name: '金盾诀',
    type: 'defense',
    allowedTargets: ['self', 'ally'],
    aiPromptTemplate: `{caster}手捏金盾诀，灵力在{target}身前凝成一面金色光盾。

请描述光盾的形态与光芒流转。

{target}获得护盾，下回合受到的下次伤害减半。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 70
  },

  'diamond-body': {
    id: 'diamond-body',
    name: '金刚体',
    type: 'defense',
    allowedTargets: ['self'],
    aiPromptTemplate: `{caster}运转炼体功法，周身骨骼噼啪作响，皮肤泛起暗金色光泽。

请描述炼体功法运转时的威势。

本回合所有对{caster}的攻击判定DC+4。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 70
  },

  'spirit-rain': {
    id: 'spirit-rain',
    name: '灵雨术',
    type: 'heal',
    allowedTargets: ['self', 'ally'],
    aiPromptTemplate: `{caster}召来灵雨，点点灵光如雨丝般洒落在{target}身上。

请描述灵雨渗入身体时的温暖感受与伤势愈合的过程。

{target}回复{heal}点生命，清除负面状态。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: { heal: '2d6+3' },
    structuredOutput: { fields: ['narrative', 'heal'] },
    maxResponseLength: 80
  },

  // ==================== 探索 ====================
  'spirit-eye': {
    id: 'spirit-eye',
    name: '灵目术',
    type: 'scout',
    allowedTargets: ['area', 'obstacle', 'npc'],
    aiPromptTemplate: `{caster}运转灵力于双目，眼中泛起微光，仔细查看{target}。

请描述{caster}看到了什么隐藏的灵力痕迹、禁制、陷阱或线索。

如存在隐秘事物，在灵目下显形。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative', 'hiddenInfo'] },
    maxResponseLength: 140
  },

  'qi-gaze': {
    id: 'qi-gaze',
    name: '望气术',
    type: 'scout',
    allowedTargets: ['area', 'npc'],
    aiPromptTemplate: `{caster}掐指一算，观望{target}的气运与灵力流动。

请描述气机的变化与显现的异象。

透露与当前局面相关的吉凶预兆、隐藏信息或对方实力强弱。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative', 'hiddenInfo'] },
    maxResponseLength: 140
  },

  'earth-listen': {
    id: 'earth-listen',
    name: '地听术',
    type: 'scout',
    allowedTargets: ['area'],
    aiPromptTemplate: `{caster}将手掌贴在地面，土行灵力沿大地扩散。

请描述通过震动感知到的信息——远处的脚步声、地下的动静、隐藏的暗道。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative', 'hiddenInfo'] },
    maxResponseLength: 120
  },

  'earth-escape': {
    id: 'earth-escape',
    name: '土遁术',
    type: 'movement',
    allowedTargets: ['obstacle'],
    aiPromptTemplate: `{caster}手捏土遁诀，身体缓缓沉入土石之中。

请描述遁行过程中四周的压迫感与另一侧豁然开朗的景象。

{caster}成功穿越{target}，到达障碍物另一侧。

可携带最多1名接触的队友同行。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 90
  },

  'wind-ride': {
    id: 'wind-ride',
    name: '御风术',
    type: 'movement',
    allowedTargets: ['area'],
    aiPromptTemplate: `{caster}召来一阵清风缠绕周身，衣袂飘飘，凌空而起。

请描述飞行的姿态与越过{target}时下方的景象。

{caster}成功飞越障碍，到达原本难以抵达的位置。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 80
  },

  // ==================== 社交 ====================
  'spirit-pressure': {
    id: 'spirit-pressure',
    name: '灵压外放',
    type: 'social',
    allowedTargets: ['npc'],
    aiPromptTemplate: `{caster}猛然释放灵力威压，强大的气场如实质般碾压向{target}。

请描述灵压的表现形式——空气扭曲、地面微颤、对方神色大变等。

{target}若修为低于{caster}，会陷入恐惧，更易屈服或吐露情报。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 100
  },

  'soul-search': {
    id: 'soul-search',
    name: '搜魂术',
    type: 'social',
    allowedTargets: ['npc'],
    aiPromptTemplate: `{caster}将手按在{target}天灵盖上，神识如冰冷触须侵入对方识海。

请描述搜魂过程的诡异景象——记忆碎片闪过、痛苦的挣扎、意识的崩塌。

从{target}的记忆中提取与当前剧本相关的关键信息。

注意：此术极为残忍，正道修士使用可能导致道心受损。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative', 'hiddenInfo'] },
    maxResponseLength: 140
  },

  // ==================== 特殊 ====================
  'spirit-pill': {
    id: 'spirit-pill',
    name: '聚灵丹',
    type: 'special',
    allowedTargets: ['self', 'ally'],
    aiPromptTemplate: `{caster}将聚灵丹递给{target}。{target}吞下丹药，一股暖流自丹田升起，灵力缓缓恢复。

请描述丹药入体后的感受与灵力回升的感觉。

{target}回复3点灵力值。

此丹已耗尽。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative'] },
    consumable: true,
    maxResponseLength: 80
  },

  'break-talisman': {
    id: 'break-talisman',
    name: '破阵符',
    type: 'special',
    allowedTargets: ['obstacle', 'area'],
    aiPromptTemplate: `{caster}祭出破阵符，符纸无风自燃，青色火焰化作一道光箭射向{target}的禁制核心。

请描述符火与阵法碰撞的激烈景象。

可解除低阶禁制或严重削弱高阶阵法。

符纸燃尽化为灰烬。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    consumable: true,
    maxResponseLength: 100
  },

  'help-talisman': {
    id: 'help-talisman',
    name: '求救信符',
    type: 'special',
    allowedTargets: [],
    aiPromptTemplate: `{caster}捏碎求救信符，一道灵光冲天而起，在空中炸开成特定的符号。

请描述信号发出的场景——天空中的符号、远处隐约的回应迹象。

一位与{caster}有旧的散修或门派前辈看到信号，正赶来援助，将在2回合后到达。

符纸碎屑从指间飘落。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    consumable: true,
    maxResponseLength: 100
  },

  'enlightenment': {
    id: 'enlightenment',
    name: '顿悟',
    type: 'special',
    allowedTargets: ['self'],
    aiPromptTemplate: `{caster}盘膝闭目，周身灵气翻涌，竟在关键时刻进入顿悟状态。

请描述天人交感的玄妙体验——天地法则在眼前清晰呈现的震撼感。

{caster}下一次使用的卡牌判定获得+3加值。

整场游戏中仅可使用一次。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 110
  },

  // ==================== 协作专属卡 ====================
  'reinforce': {
    id: 'reinforce',
    name: '灵力共鸣',
    type: 'special',
    allowedTargets: ['ally'],
    aiPromptTemplate: `{caster}将自身灵力与{target}共鸣，两股灵力交织在一起。

请描述灵力共鸣的视觉表现——灵光交汇、气势攀升。

{target}下回合使用的卡牌判定获得+2加值。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 70
  },

  'transfer': {
    id: 'transfer',
    name: '灵力渡让',
    type: 'special',
    allowedTargets: ['ally'],
    aiPromptTemplate: `{caster}握住{target}的手腕，将自身灵力渡让过去。

请描述灵力传递的过程——温热的灵力流淌、{caster}额头渗汗。

{caster}消耗2点MP，{target}回复3点MP。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    structuredOutput: { fields: ['narrative'] },
    maxResponseLength: 80
  },

  'cover': {
    id: 'cover',
    name: '掩护',
    type: 'defense',
    allowedTargets: ['ally'],
    aiPromptTemplate: `{caster}闪身挡在{target}身前，摆出防御姿态。

请描述掩护的动作与决意。

本回合{target}受到的攻击改为由{caster}承受。

{hiddenInstruction}

要求：{maxLength}字以内。`,
    params: {},
    maxResponseLength: 60
  }
}
