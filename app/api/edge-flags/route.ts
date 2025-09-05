import { NextRequest, NextResponse } from 'next/server'
import { edgeConfigAdapter } from '@/lib/edge-config-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useEdgeConfig = searchParams.get('edge') === 'true'

    // Get feature flags from the adapter
    const featureData = await edgeConfigAdapter.getFeatureData()
    
    if (!featureData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch flags',
        source: 'error',
        timestamp: new Date().toISOString()
      })
    }

    // Transform features into simple key-value pairs
    const flags: Record<string, any> = {}
    
    if (featureData.features) {
      for (const [key, feature] of Object.entries(featureData.features)) {
        if (feature && typeof feature === 'object' && 'defaultValue' in feature) {
          flags[key] = feature.defaultValue
        } else {
          flags[key] = feature
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: useEdgeConfig ? 'edge-config' : 'api',
      flags,
      features: flags, // Backward compatibility
      metadata: {
        featuresCount: Object.keys(flags).length,
        dateUpdated: featureData.dateUpdated,
        cached: true
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Edge flags API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch flags',
      source: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flagKeys } = body

    if (!Array.isArray(flagKeys)) {
      return NextResponse.json({
        success: false,
        error: 'flagKeys must be an array'
      }, { status: 400 })
    }

    // Get all feature flags
    const allFlags = await edgeConfigAdapter.getAllFeatures()
    
    // Filter to requested flags only
    const requestedFlags: Record<string, any> = {}
    flagKeys.forEach(key => {
      if (key in allFlags) {
        requestedFlags[key] = allFlags[key]
      }
    })

    return NextResponse.json({
      success: true,
      source: 'api',
      flags: requestedFlags,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Edge flags batch API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch flags',
      source: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}