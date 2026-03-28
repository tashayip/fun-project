export interface QuestObjective {
  id: string          // matches NPC id (e.g. 'uncle-lee')
  description: string
  descZh: string
  complete: boolean
}

export interface Quest {
  id: string
  title: string
  titleZh: string
  objectives: QuestObjective[]
  status: 'inactive' | 'active' | 'complete'
  xpReward: number
  goldReward: number
}

export interface TalkResult {
  xpGained: number
  objectiveComplete: QuestObjective | null
  questComplete: Quest | null
  leveledUp: boolean
  newLevel: number
}

class GameState {
  level = 1
  xp = 0
  xpToNext = 100
  hp = 100
  maxHp = 100
  gold = 0
  talkedTo: Set<string> = new Set()

  quests: Quest[] = [
    {
      id: 'order-meal',
      title: 'Order a Meal',
      titleZh: '点一份餐',
      objectives: [
        { id: 'uncle-lee',  description: 'Chat with Uncle Lee',   descZh: '和李叔叔聊天', complete: false },
        { id: 'auntie-tan', description: "Try Auntie Tan's rice", descZh: '试试陈阿姨的饭', complete: false },
      ],
      status: 'active',
      xpReward: 50,
      goldReward: 10
    },
    {
      id: 'meet-everyone',
      title: 'Meet the Hawkers',
      titleZh: '认识小贩',
      objectives: [
        { id: 'uncle-rajan',  description: 'Order a drink',         descZh: '点一杯饮料',     complete: false },
        { id: 'grandma-wong', description: 'Greet Grandma Wong',    descZh: '向王奶奶打招呼', complete: false },
        { id: 'uncle-hassan', description: 'Visit the satay stall', descZh: '去沙爹摊',       complete: false },
        { id: 'auntie-siew',  description: 'Try the soup',          descZh: '喝一碗汤',       complete: false },
      ],
      status: 'inactive',
      xpReward: 100,
      goldReward: 20
    }
  ]

  /** Call this when a dialogue with an NPC finishes. Returns rewards. */
  talkToNPC(npcId: string): TalkResult {
    const isNew = !this.talkedTo.has(npcId)
    let xpGained = 10   // base XP every conversation
    let objectiveComplete: QuestObjective | null = null
    let questComplete: Quest | null = null

    if (isNew) {
      this.talkedTo.add(npcId)
      xpGained += 10   // first-meeting bonus

      // Check all active quests for a matching objective
      for (const quest of this.quests) {
        if (quest.status !== 'active') continue
        const obj = quest.objectives.find(o => o.id === npcId && !o.complete)
        if (obj) {
          obj.complete = true
          xpGained += 20           // objective bonus
          this.gold += 5
          objectiveComplete = obj

          if (quest.objectives.every(o => o.complete)) {
            quest.status = 'complete'
            xpGained += quest.xpReward
            this.gold += quest.goldReward
            questComplete = quest
            // Activate next quest
            const next = this.quests.find(q => q.status === 'inactive')
            if (next) next.status = 'active'
          }
          break
        }
      }
    }

    const { leveledUp, newLevel } = this._addXP(xpGained)
    return { xpGained, objectiveComplete, questComplete, leveledUp, newLevel }
  }

  getActiveQuest(): Quest | undefined {
    return this.quests.find(q => q.status === 'active')
  }

  private _addXP(amount: number): { leveledUp: boolean; newLevel: number } {
    this.xp += amount
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext
      this.level++
      this.xpToNext = Math.floor(this.xpToNext * 1.4)
      this.maxHp += 10
      this.hp = Math.min(this.hp + 15, this.maxHp)
      return { leveledUp: true, newLevel: this.level }
    }
    return { leveledUp: false, newLevel: this.level }
  }
}

export const gameState = new GameState()
