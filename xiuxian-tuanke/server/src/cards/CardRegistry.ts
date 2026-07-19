import { CardDefinition } from '../types'

export const cards: Record<string, CardDefinition> = {
  // === 技能卡 ===
  'sword-fly': {
    id: 'sword-fly', name: '御剑术', type: 'skill', rarity: '普通',
    description: '以灵力御剑，远程攻击。2d6+2剑气伤害。',
    targetType: 'enemy', allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '2d6+2', stat: 'spirit' },
    manaCost: 2, sellPrice: 50, buyPrice: 100,
    aiPrompt: `{caster}掐诀御剑，一道剑光斩向{target}。D20+{stat} vs DC{dc}。成功造成{damageRoll}点伤害并描述创伤。失败描述闪避。`
  },
  'qi-slash': {
    id: 'qi-slash', name: '剑气斩', type: 'skill', rarity: '普通',
    description: '凝聚剑气近身斩击。1d10+4伤害。',
    targetType: 'enemy', allowedTargets: ['enemy'],
    effect: { type: 'damage', dice: '1d10+4', stat: 'body' },
    manaCost: 1, sellPrice: 50, buyPrice: 100,
    aiPrompt: `{caster}凝聚剑气近距离斩向{target}。D20+{stat} vs DC{dc}。成功造成{damageRoll}点伤害并击退。失败露出破绽。`
  },
  'water-dragon': {
    id: 'water-dragon', name: '水龙吟', type: 'skill', rarity: '精良',
    description: '召唤水龙冲击，附加潮湿。2d6水行伤害。',
    targetType: 'enemy', allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '2d6', stat: 'spirit', status: '潮湿' },
    manaCost: 2, sellPrice: 80, buyPrice: 160,
    aiPrompt: `{caster}结印召唤水龙扑向{target}。D20+{stat} vs DC{dc}。成功造成{damageRoll}点伤害附加潮湿状态。失败水龙溃散。`
  },
  'mountain-fist': {
    id: 'mountain-fist', name: '崩山拳', type: 'skill', rarity: '普通',
    description: '灵力灌注双拳。2d6+3伤害，无视护甲。',
    targetType: 'enemy', allowedTargets: ['enemy'],
    effect: { type: 'damage', dice: '2d6+3', stat: 'body' },
    manaCost: 1, sellPrice: 50, buyPrice: 100,
    aiPrompt: `{caster}一拳轰向{target}，拳风如山崩。D20+{stat} vs DC{dc}。成功造成{damageRoll}点伤害击碎护甲。失败被卸力。`
  },
  'ice-curse': {
    id: 'ice-curse', name: '寒冰咒', type: 'skill', rarity: '稀有',
    description: '冻结目标2回合。',
    targetType: 'enemy', allowedTargets: ['enemy', 'npc'],
    effect: { type: 'debuff', duration: 2, status: '冻结' },
    manaCost: 4, cooldown: 2, sellPrice: 200, buyPrice: 400,
    aiPrompt: `{caster}掐诀念咒，寒气笼罩{target}。D20+{stat} vs DC{dc}+2。成功冻结2回合。失败仅减速。`
  },
  'healing-light': {
    id: 'healing-light', name: '治愈灵光', type: 'skill', rarity: '普通',
    description: '召唤灵光治愈。2d6+3回复。',
    targetType: 'ally', allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', dice: '2d6+3', stat: 'spirit' },
    manaCost: 2, sellPrice: 50, buyPrice: 100,
    aiPrompt: `{caster}召来灵光笼罩{target}。回复{damageRoll}点生命。描述伤口愈合的过程。`
  },
  'flame-blast': {
    id: 'flame-blast', name: '烈焰掌', type: 'skill', rarity: '精良',
    description: '掌心凝聚烈焰。3d6火焰伤害。',
    targetType: 'enemy', allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '3d6', stat: 'body' },
    manaCost: 3, cooldown: 1, sellPrice: 100, buyPrice: 200,
    aiPrompt: `{caster}掌心凝聚烈焰轰向{target}。D20+{stat} vs DC{dc}。成功造成{damageRoll}点火焰伤害。失败火焰打偏。`
  },

  // === 装备卡 ===
  'purple-sword': {
    id: 'purple-sword', name: '紫电剑', type: 'equipment', rarity: '史诗',
    description: '传说仙剑。攻击+5，灵力+2。',
    equipSlot: 'weapon', equipBonus: { attack: 5, spirit: 2 },
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'equip' }, sellPrice: 1000, buyPrice: 3000,
    aiPrompt: `{caster}握住紫电剑，紫雷缠绕手臂。攻击+5，灵力+2。描述装备的震撼感。`
  },
  'iron-vest': {
    id: 'iron-vest', name: '玄铁护甲', type: 'equipment', rarity: '普通',
    description: '玄铁打造。防御+3。',
    equipSlot: 'armor', equipBonus: { defense: 3 },
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'equip' }, sellPrice: 150, buyPrice: 300,
    aiPrompt: `{caster}穿上玄铁护甲，防御+3。描述穿上护甲的感受。`
  },
  'spirit-jade': {
    id: 'spirit-jade', name: '灵玉坠', type: 'equipment', rarity: '精良',
    description: '蕴含灵力的玉佩。灵力+2，神识+1。',
    equipSlot: 'accessory', equipBonus: { spirit: 2, mind: 1 },
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'equip' }, sellPrice: 200, buyPrice: 500,
    aiPrompt: `{caster}佩戴灵玉坠，灵台清明。灵力+2，神识+1。`
  },
  'flame-gloves': {
    id: 'flame-gloves', name: '烈焰拳套', type: 'equipment', rarity: '稀有',
    description: '注入火灵力。攻击+3，肉身+2。',
    equipSlot: 'weapon', equipBonus: { attack: 3, body: 2 },
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'equip' }, sellPrice: 400, buyPrice: 800,
    aiPrompt: `{caster}戴上烈焰拳套，红光流转。攻击+3，肉身+2。`
  },
  'cloud-boots': {
    id: 'cloud-boots', name: '踏云靴', type: 'equipment', rarity: '精良',
    description: '轻若无物。神识+3。',
    equipSlot: 'accessory', equipBonus: { mind: 3 },
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'equip' }, sellPrice: 250, buyPrice: 500,
    aiPrompt: `{caster}穿上踏云靴，身轻如燕。神识+3。`
  },

  // === 行动卡 ===
  'full-strike': {
    id: 'full-strike', name: '全力一击', type: 'action', rarity: '精良',
    description: '放弃防御全力进攻。3d6+5伤害。',
    targetType: 'enemy', allowedTargets: ['enemy', 'npc'],
    effect: { type: 'damage', dice: '3d6+5', stat: 'body' },
    sellPrice: 80, buyPrice: 160,
    aiPrompt: `{caster}全力轰向{target}。D20+{stat} vs DC{dc}-2。成功造成{damageRoll}点伤害。失败打空踉跄。`
  },
  'defend-stance': {
    id: 'defend-stance', name: '防御姿态', type: 'action', rarity: '普通',
    description: '获得8点护盾。',
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'shield', value: 8 },
    sellPrice: 30, buyPrice: 60,
    aiPrompt: `{caster}沉腰坐马进入防御姿态。获得8点护盾。描述防御威势。`
  },
  'search-area': {
    id: 'search-area', name: '仔细搜索', type: 'action', rarity: '普通',
    description: '搜索区域，可能发现隐藏物品。',
    targetType: 'none', allowedTargets: ['area'],
    effect: { type: 'scout' },
    sellPrice: 20, buyPrice: 40,
    aiPrompt: `{caster}仔细搜索{target}。D20+{stat} vs DC{dc}。成功发现隐藏物品（在hiddenInfo中描述发现了什么）。失败什么也没找到。`
  },
  'meditate': {
    id: 'meditate', name: '打坐冥想', type: 'action', rarity: '普通',
    description: '静心打坐，回复5点灵力。',
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'heal', value: 5 },
    sellPrice: 20, buyPrice: 40,
    aiPrompt: `{caster}盘膝打坐，吐纳天地灵气。回复5点灵力。描述冥想感受。`
  },
  'spirit-eye': {
    id: 'spirit-eye', name: '灵目术', type: 'action', rarity: '普通',
    description: '查看隐藏的灵力痕迹。',
    targetType: 'any', allowedTargets: ['area', 'obstacle', 'npc'],
    effect: { type: 'scout' },
    sellPrice: 30, buyPrice: 60,
    aiPrompt: `{caster}运转灵力于双目查看{target}。D20+{stat} vs DC{dc}。成功看到隐藏的灵力痕迹或线索（在hiddenInfo中描述）。失败只有模糊残影。`
  },

  // === 物品卡 ===
  'spirit-pill': {
    id: 'spirit-pill', name: '聚灵丹', type: 'item', rarity: '普通',
    description: '回复5点灵力。',
    targetType: 'self', allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', value: 5 }, consumable: true,
    sellPrice: 30, buyPrice: 60,
    aiPrompt: `{caster}将聚灵丹递给{target}服用。回复5点灵力。描述丹药入体的感受。`
  },
  'hp-pill': {
    id: 'hp-pill', name: '回春丹', type: 'item', rarity: '普通',
    description: '回复10点生命。',
    targetType: 'self', allowedTargets: ['self', 'ally'],
    effect: { type: 'heal', value: 10 }, consumable: true,
    sellPrice: 40, buyPrice: 80,
    aiPrompt: `{caster}将回春丹递给{target}服用。回复10点生命。描述伤口愈合的过程。`
  },
  'spirit-herb': {
    id: 'spirit-herb', name: '灵草', type: 'item', rarity: '普通',
    description: '炼丹材料。出售可得20灵石。',
    targetType: 'none', allowedTargets: [],
    effect: { type: 'none' }, sellPrice: 20, buyPrice: 40,
    aiPrompt: `{caster}查看灵草。一株普通的灵草，可出售换灵石。`
  },
  'break-talisman': {
    id: 'break-talisman', name: '破阵符', type: 'item', rarity: '精良',
    description: '解除低阶禁制。',
    targetType: 'obstacle', allowedTargets: ['obstacle', 'area'],
    effect: { type: 'special' }, consumable: true,
    sellPrice: 100, buyPrice: 200,
    aiPrompt: `{caster}祭出破阵符，符纸燃起青火射向{target}。低阶禁制被解除。描述符火与禁制碰撞。`
  },
  'enlightenment-tea': {
    id: 'enlightenment-tea', name: '悟道茶', type: 'item', rarity: '稀有',
    description: '饮用后下次判定+5。',
    targetType: 'self', allowedTargets: ['self'],
    effect: { type: 'buff', duration: 1, status: '悟道' }, consumable: true,
    sellPrice: 300, buyPrice: 600,
    aiPrompt: `{caster}饮下悟道茶。灵台清明，下次判定+5。描述饮茶后的玄妙体验。`
  }
}

export const INITIAL_HAND: Record<string, string[]> = {
  '凌霄': ['sword-fly', 'qi-slash', 'defend-stance', 'spirit-pill', 'spirit-eye'],
  '青鸾': ['water-dragon', 'ice-curse', 'healing-light', 'spirit-pill', 'meditate'],
  '石岩': ['mountain-fist', 'full-strike', 'defend-stance', 'hp-pill', 'iron-vest']
}
