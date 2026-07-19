import { CardDefinition } from '../types'

export const cardRegistry: Record<string, CardDefinition> = {
  // ==================== 技能卡 ====================
  'sword-fly': {
    id: 'sword-fly',
    name: '御剑术',
    type: 'skill',
    rarity: 'common',
    description: '以灵力御剑，远程攻击敌人。',
    targetType: 'enemy',
    allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '2d6+2', stat: 'spirit' },
    manaCost: 2,
    cooldown: 0,
    sellPrice: 50,
    buyPrice: 100,
    aiPromptTemplate: `{caster}掐诀御剑，一道剑光斩向{target}。
进行D20+{statValue}判定，DC={dc}。
成功：飞剑命中，造成{damageRoll}点剑气伤害，描述创伤效果。
失败：飞剑被格挡或闪避，描述对方如何应对。
如有暴击（自然20），伤害翻倍并特别描述。
{extraHint}
要求：{maxLength}字以内，仙侠风格。`
  },
  'qi-slash': {
    id: 'qi-slash',
    name: '剑气斩',
    type: 'skill',
    rarity: 'common',
    description: '凝聚剑气近身斩击。',
    targetType: 'enemy',
    allowedTargets: ['enemy'],
    effect: { type: 'damage', dice: '1d10+4', stat: 'body' },
    manaCost: 1,
    cooldown: 0,
    sellPrice: 50,
    buyPrice: 100,
    aiPromptTemplate: `{caster}凝聚剑气于刃，近距离斩向{target}。
进行D20+{statValue}判定，DC={dc}。
成功：造成{damageRoll}点伤害并击退目标。
失败：招式用老，{caster}露出破绽。
{extraHint}
要求：{maxLength}字以内。`
  },
  'water-dragon': {
    id: 'water-dragon',
    name: '水龙吟',
    type: 'skill',
    rarity: 'uncommon',
    description: '召唤水龙冲击敌人，附加潮湿。',
    targetType: 'enemy',
    allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '2d6', stat: 'spirit', statusEffect: '潮湿' },
    manaCost: 2,
    cooldown: 0,
    sellPrice: 80,
    buyPrice: 160,
    aiPromptTemplate: `{caster}双手结印，凭空凝聚出水龙，咆哮着扑向{target}。
进行D20+{statValue}判定，DC={dc}。
成功：造成{damageRoll}点水行伤害，目标进入「潮湿」状态。
失败：水龙溃散为漫天水珠，但仍溅湿目标。
{extraHint}
要求：{maxLength}字以内，仙侠风格。`
  },
  'mountain-fist': {
    id: 'mountain-fist',
    name: '崩山拳',
    type: 'skill',
    rarity: 'common',
    description: '灵力灌注双拳，势如山崩。',
    targetType: 'enemy',
    allowedTargets: ['enemy'],
    effect: { type: 'damage', dice: '2d6+3', stat: 'body' },
    manaCost: 1,
    cooldown: 0,
    sellPrice: 50,
    buyPrice: 100,
    aiPromptTemplate: `{caster}灵力灌注双拳，一拳轰向{target}，拳风厚重如山崩。
进行D20+{statValue}判定，DC={dc}。
成功：拳力贯穿，造成{damageRoll}点伤害，可击碎护甲类防御。
失败：拳力被卸开，{target}仅被震退半步。
{extraHint}
要求：{maxLength}字以内。`
  },
  'ice-curse': {
    id: 'ice-curse',
    name: '寒冰咒',
    type: 'skill',
    rarity: 'rare',
    description: '冻结目标2回合。',
    targetType: 'enemy',
    allowedTargets: ['enemy', 'npc'],
    effect: { type: 'debuff', duration: 2, statusEffect: '冻结' },
    manaCost: 4,
    cooldown: 2,
    sellPrice: 200,
    buyPrice: 400,
    aiPromptTemplate: `{caster}掐诀念咒，寒气笼罩{target}。
进行D20+{statValue}判定，DC={dc}+2。
成功：目标被冻结在冰晶之中，持续2回合无法行动。
失败：冰霜减速目标但未完全冻结。
{extraHint}
要求：{maxLength}字以内。`
  },
  'healing-light': {
    id: 'healing-light',
    name: '治愈灵光',
    type: 'skill',
    rarity: 'common',
    description: '召唤灵光治愈伤口。',
    targetType: 'ally',
    allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', dice: '2d6+3', stat: 'spirit' },
    manaCost: 2,
    cooldown: 0,
    sellPrice: 50,
    buyPrice: 100,
    aiPromptTemplate: `{caster}召来温暖的灵光笼罩{target}。
回复{healRoll}点生命。
请描述灵光治愈伤口的过程。
{extraHint}
要求：{maxLength}字以内。`
  },
  'flame-blast': {
    id: 'flame-blast',
    name: '烈焰掌',
    type: 'skill',
    rarity: 'uncommon',
    description: '掌心凝聚烈焰爆发。',
    targetType: 'enemy',
    allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '3d6', stat: 'body' },
    manaCost: 3,
    cooldown: 1,
    sellPrice: 100,
    buyPrice: 200,
    aiPromptTemplate: `{caster}掌心凝聚烈焰，猛然轰向{target}。
进行D20+{statValue}判定，DC={dc}。
成功：烈焰喷涌，造成{damageRoll}点火焰伤害，描述灼烧景象。
失败：火焰被躲开，只烧焦了地面。
{extraHint}
要求：{maxLength}字以内。`
  },

  // ==================== 装备卡 ====================
  'purple-lightning-sword': {
    id: 'purple-lightning-sword',
    name: '紫电剑',
    type: 'equipment',
    rarity: 'epic',
    description: '传说中的仙剑，攻击+5，灵力+2。',
    equipSlot: 'weapon',
    equipBonus: { attack: 5, spirit: 2 },
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'equip' },
    sellPrice: 1000,
    buyPrice: 3000,
    aiPromptTemplate: `{caster}握住紫电剑，紫色雷电缠绕手臂。
请描述装备紫电剑的震撼感受。攻击+5，灵力+2。
{extraHint}
要求：{maxLength}字以内。`
  },
  'iron-vest': {
    id: 'iron-vest',
    name: '玄铁护甲',
    type: 'equipment',
    rarity: 'common',
    description: '玄铁打造，防御+3。',
    equipSlot: 'armor',
    equipBonus: { defense: 3 },
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'equip' },
    sellPrice: 150,
    buyPrice: 300,
    aiPromptTemplate: `{caster}穿上玄铁护甲，一股厚重感传来。
请描述穿上护甲的感受。防御+3。
{extraHint}
要求：{maxLength}字以内。`
  },
  'spirit-jade': {
    id: 'spirit-jade',
    name: '灵玉坠',
    type: 'equipment',
    rarity: 'uncommon',
    description: '蕴含灵力的玉佩。灵力+2，神识+1。',
    equipSlot: 'accessory',
    equipBonus: { spirit: 2, mind: 1 },
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'equip' },
    sellPrice: 200,
    buyPrice: 500,
    aiPromptTemplate: `{caster}佩戴灵玉坠，灵台一片清明。
请描述佩戴感受。灵力+2，神识+1。
{extraHint}
要求：{maxLength}字以内。`
  },
  'flame-gloves': {
    id: 'flame-gloves',
    name: '烈焰拳套',
    type: 'equipment',
    rarity: 'rare',
    description: '注入火灵力的拳套。攻击+3，肉身+2。',
    equipSlot: 'weapon',
    equipBonus: { attack: 3, body: 2 },
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'equip' },
    sellPrice: 400,
    buyPrice: 800,
    aiPromptTemplate: `{caster}戴上烈焰拳套，拳套表面流转着火红的光芒。
请描述装备感受。攻击+3，肉身+2。
{extraHint}
要求：{maxLength}字以内。`
  },
  'cloud-boots': {
    id: 'cloud-boots',
    name: '踏云靴',
    type: 'equipment',
    rarity: 'uncommon',
    description: '轻若无物，神识+3。',
    equipSlot: 'accessory',
    equipBonus: { mind: 3 },
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'equip' },
    sellPrice: 250,
    buyPrice: 500,
    aiPromptTemplate: `{caster}穿上踏云靴，顿觉身轻如燕。
请描述装备感受。神识+3。
{extraHint}
要求：{maxLength}字以内。`
  },

  // ==================== 行动卡 ====================
  'full-power-strike': {
    id: 'full-power-strike',
    name: '全力一击',
    type: 'action',
    rarity: 'uncommon',
    description: '放弃防御全力进攻。',
    targetType: 'enemy',
    allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '3d6+5', stat: 'body' },
    sellPrice: 80,
    buyPrice: 160,
    aiPromptTemplate: `{caster}深吸一口气，将所有力量凝聚于一点，全力轰向{target}。
进行D20+{statValue}判定，DC={dc}-2（全力攻击更容易命中）。
成功：造成{damageRoll}点伤害，描述势不可挡的一击。
失败：用力过猛打空了，{caster}踉跄了一下。
{extraHint}
要求：{maxLength}字以内。`
  },
  'defend-stance': {
    id: 'defend-stance',
    name: '防御姿态',
    type: 'action',
    rarity: 'common',
    description: '获得8点护盾。',
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'shield', value: 8 },
    sellPrice: 30,
    buyPrice: 60,
    aiPromptTemplate: `{caster}沉腰坐马，灵力遍布全身，进入防御姿态。
获得8点护盾。
请描述防御姿态的威势。
{extraHint}
要求：{maxLength}字以内。`
  },
  'search-area': {
    id: 'search-area',
    name: '仔细搜索',
    type: 'action',
    rarity: 'common',
    description: '搜索当前区域寻找隐藏物品。',
    targetType: 'none',
    allowedTargets: ['area'],
    effect: { type: 'scout' },
    sellPrice: 20,
    buyPrice: 40,
    aiPromptTemplate: `{caster}仔细搜索{target}的每一个角落。
进行D20+{statValue}判定，DC={dc}。
成功：发现了隐藏的物品或线索，请描述发现了什么。在hiddenInfo中说明找到的卡牌类型。
失败：什么也没找到。
{extraHint}
要求：{maxLength}字以内。`
  },
  'meditate': {
    id: 'meditate',
    name: '打坐冥想',
    type: 'action',
    rarity: 'common',
    description: '静心打坐，回复5点灵力。',
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'heal', value: 5 },
    sellPrice: 20,
    buyPrice: 40,
    aiPromptTemplate: `{caster}盘膝而坐，吐纳天地灵气。
回复5点灵力。
请描述冥想时的感受。
{extraHint}
要求：{maxLength}字以内。`
  },
  'spirit-eye': {
    id: 'spirit-eye',
    name: '灵目术',
    type: 'action',
    rarity: 'common',
    description: '运转灵力于双目，查看隐藏的灵力痕迹。',
    targetType: 'any',
    allowedTargets: ['area', 'obstacle', 'npc'],
    effect: { type: 'scout' },
    sellPrice: 30,
    buyPrice: 60,
    aiPromptTemplate: `{caster}运转灵力于双目，眼中泛起微光，查看{target}。
进行D20+{statValue}判定，DC={dc}。
成功：看到了隐藏的灵力痕迹、禁制或线索。请具体描述。
失败：只看到模糊的灵力残影。
{extraHint}
要求：{maxLength}字以内。`
  },

  // ==================== 物品卡 ====================
  'spirit-pill': {
    id: 'spirit-pill',
    name: '聚灵丹',
    type: 'item',
    rarity: 'common',
    description: '回复5点灵力。',
    targetType: 'self',
    allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', value: 5 },
    consumable: true,
    sellPrice: 30,
    buyPrice: 60,
    aiPromptTemplate: `{caster}将聚灵丹递给{target}。{target}吞下丹药。
回复5点灵力。
请描述丹药入体的感受。
{extraHint}
要求：{maxLength}字以内。`
  },
  'hp-pill': {
    id: 'hp-pill',
    name: '回春丹',
    type: 'item',
    rarity: 'common',
    description: '回复10点生命。',
    targetType: 'self',
    allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', value: 10 },
    consumable: true,
    sellPrice: 40,
    buyPrice: 80,
    aiPromptTemplate: `{caster}将回春丹递给{target}。{target}吞下丹药。
回复10点生命。
请描述药力化开、伤口愈合的过程。
{extraHint}
要求：{maxLength}字以内。`
  },
  'spirit-herb': {
    id: 'spirit-herb',
    name: '灵草',
    type: 'item',
    rarity: 'common',
    description: '炼丹材料。可出售换取灵石。',
    targetType: 'none',
    allowedTargets: [],
    effect: { type: 'heal', value: 0 },
    consumable: false,
    sellPrice: 20,
    buyPrice: 40,
    aiPromptTemplate: `{caster}查看手中的灵草。一株普通的灵草，散发着淡淡的灵气。
可以出售换取灵石，或留着炼丹。
{extraHint}
要求：{maxLength}字以内。`
  },
  'break-talisman': {
    id: 'break-talisman',
    name: '破阵符',
    type: 'item',
    rarity: 'uncommon',
    description: '可解除低阶禁制。',
    targetType: 'obstacle',
    allowedTargets: ['obstacle', 'area'],
    effect: { type: 'damage', value: 0 },
    consumable: true,
    sellPrice: 100,
    buyPrice: 200,
    aiPromptTemplate: `{caster}祭出破阵符，符纸燃起青色火焰射向{target}。
请描述符火与禁制碰撞的景象。低阶禁制被解除。
符纸燃尽化为灰烬。
{extraHint}
要求：{maxLength}字以内。`
  },
  'enlightenment-tea': {
    id: 'enlightenment-tea',
    name: '悟道茶',
    type: 'item',
    rarity: 'rare',
    description: '饮用后下次判定+5。',
    targetType: 'self',
    allowedTargets: ['self'],
    effect: { type: 'buff', duration: 1, statusEffect: '悟道' },
    consumable: true,
    sellPrice: 300,
    buyPrice: 600,
    aiPromptTemplate: `{caster}饮下悟道茶，茶香袅袅。
灵台清明，天地法则清晰呈现。下次判定获得+5加值。
请描述饮茶后的玄妙体验。
{extraHint}
要求：{maxLength}字以内。`
  }
}

export const INITIAL_HAND_CARDS: Record<string, string[]> = {
  '凌霄': ['sword-fly', 'qi-slash', 'defend-stance', 'spirit-pill', 'spirit-eye'],
  '青鸾': ['water-dragon', 'ice-curse', 'healing-light', 'spirit-pill', 'meditate'],
  '石岩': ['mountain-fist', 'full-power-strike', 'defend-stance', 'hp-pill', 'iron-vest']
}
