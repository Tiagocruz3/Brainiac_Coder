import { LLMModel } from './models'

export interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface OpenAIModelsResponse {
  object: string
  data: OpenAIModel[]
}

/**
 * Fetch available models from OpenAI API
 */
export async function fetchOpenAIModels(apiKey?: string): Promise<LLMModel[]> {
  try {
    const key = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    
    if (!key) {
      console.log('No OpenAI API key available for fetching models')
      return []
    }

    console.log('Fetching OpenAI models from API...')

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, response.statusText, errorText)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenAIModelsResponse = await response.json()
    console.log('Received models from OpenAI:', data.data.length)
    console.log('Available model IDs:', data.data.map(m => m.id).slice(0, 10))
    
    // Filter and transform OpenAI models to our format
    const openaiModels: LLMModel[] = data.data
      .filter(model => {
        // Only include chat completion models
        const isValidModel = (
          model.id.startsWith('gpt-') || 
          model.id.startsWith('o1') || 
          model.id.startsWith('o3') ||
          model.id === 'gpt-4o' ||
          model.id === 'gpt-4o-mini' ||
          model.id === 'chatgpt-4o-latest'
        ) && !model.id.includes('instruct') && !model.id.includes('base')
        console.log(`Model ${model.id}: ${isValidModel ? 'included' : 'filtered out'}`)
        return isValidModel
      })
      .map(model => ({
        id: model.id,
        name: formatModelName(model.id),
        provider: 'OpenAI',
        providerId: 'openai',
        multiModal: isMultiModalModel(model.id),
        isBeta: isBetaModel(model.id)
      }))
      .sort((a, b) => {
        // Sort by model priority (newer/better models first)
        const priority = getModelPriority(a.id)
        const priorityB = getModelPriority(b.id)
        return priority - priorityB
      })

    console.log('Processed OpenAI models:', openaiModels.map(m => m.id))
    return openaiModels
  } catch (error) {
    console.error('Error fetching OpenAI models:', error)
    return []
  }
}

/**
 * Format model ID into a human-readable name
 */
function formatModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'gpt-5': 'GPT-5',
    'gpt-5-mini': 'GPT-5 Mini',
    'gpt-4.5-preview': 'GPT-4.5 Preview',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'o1': 'o1',
    'o1-mini': 'o1-mini',
    'o1-preview': 'o1 Preview'
  }

  return nameMap[modelId] || modelId.toUpperCase().replace(/-/g, ' ')
}

/**
 * Check if model supports multimodal input
 */
function isMultiModalModel(modelId: string): boolean {
  const multiModalModels = [
    'gpt-5',
    'gpt-5-mini',
    'gpt-4.5-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4-vision-preview',
    'o1'
  ]
  
  return multiModalModels.some(model => modelId.includes(model))
}

/**
 * Check if model is in beta
 */
function isBetaModel(modelId: string): boolean {
  const betaModels = [
    'gpt-5',
    'gpt-5-mini',
    'gpt-4.5-preview',
    'o1-preview'
  ]
  
  return betaModels.some(model => modelId.includes(model))
}

/**
 * Get model priority for sorting (lower number = higher priority)
 */
function getModelPriority(modelId: string): number {
  const priorities: Record<string, number> = {
    'gpt-5': 1,
    'gpt-5-mini': 2,
    'gpt-4.5-preview': 3,
    'o1': 4,
    'gpt-4o': 5,
    'o1-mini': 6,
    'gpt-4o-mini': 7,
    'gpt-4-turbo': 8,
    'gpt-4': 9,
    'gpt-3.5-turbo': 10
  }
  
  for (const [model, priority] of Object.entries(priorities)) {
    if (modelId.includes(model)) {
      return priority
    }
  }
  
  return 999 // Unknown models go to the end
}

/**
 * Cache for OpenAI models to avoid excessive API calls
 */
let cachedModels: LLMModel[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCachedOpenAIModels(apiKey?: string): Promise<LLMModel[]> {
  const now = Date.now()
  
  // Return cached models if still valid
  if (cachedModels && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedModels
  }
  
  // Fetch fresh models
  const models = await fetchOpenAIModels(apiKey)
  
  // Update cache
  cachedModels = models
  cacheTimestamp = now
  
  return models
}

/**
 * Clear the models cache (useful for testing or when API key changes)
 */
export function clearOpenAIModelsCache(): void {
  cachedModels = null
  cacheTimestamp = 0
}