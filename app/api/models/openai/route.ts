import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenAIModels } from '@/lib/openai-models'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('apiKey')
    
    // Fetch models from OpenAI API
    const models = await fetchOpenAIModels(apiKey || undefined)
    
    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching OpenAI models:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch OpenAI models',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key is required'
      }, { status: 400 })
    }
    
    // Fetch models with provided API key
    const models = await fetchOpenAIModels(apiKey)
    
    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching OpenAI models with provided key:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch OpenAI models',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}