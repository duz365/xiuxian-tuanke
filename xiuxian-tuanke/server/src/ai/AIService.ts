export class AIService {
  private apiKey: string
  private baseURL = 'https://api.siliconflow.cn/v1'
  private model: string

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || ''
    this.model = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V2.5'
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`AI API错误 ${res.status}: ${errText}`)
    }

    const data: any = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }
}
