export class AIService {
  private apiKey: string
  private baseURL: string
  private defaultModel: string

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || ''
    this.baseURL = 'https://api.siliconflow.cn/v1'
    this.defaultModel = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V2.5'
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options: {
      requireJSON?: boolean
      maxTokens?: number
      temperature?: number
      model?: string
    } = {}
  ): Promise<string> {
    const body: any = {
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature ?? 0.8
    }

    if (options.requireJSON) {
      body.response_format = { type: 'json_object' }
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`AI API错误 ${response.status}: ${errText}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    return data.choices[0]?.message?.content || ''
  }
}
