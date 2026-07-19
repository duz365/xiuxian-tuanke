export class AIService {
  private apiKey: string
  private baseURL: string
  private defaultModel: string

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || ''
    this.baseURL = 'https://api.siliconflow.cn/v1'
    this.defaultModel = process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct'
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
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: options.maxTokens || 400,
        temperature: options.temperature ?? 0.7,
        ...(options.requireJSON ? { response_format: { type: 'json_object' } } : {})
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`硅基流动API错误 ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    return content
  }
}
