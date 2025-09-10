import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ZodSchema } from 'zod'
import { handleApiError, UnauthorizedError, ValidationError } from './error-handler'

// Authentication middleware
export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: { required?: boolean } = { required: true }
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions)
      
      if (options.required && !session?.user) {
        throw new UnauthorizedError('Authentication required')
      }
      
      // Add user to request context
      const requestWithUser = Object.assign(req, {
        user: session?.user,
      })
      
      return await handler(requestWithUser, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Validation middleware
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest & { validatedData: T }, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      let data: any
      
      // Parse request body for POST/PUT requests
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        try {
          data = await req.json()
        } catch {
          throw new ValidationError('Invalid JSON in request body')
        }
      } else {
        // Parse query parameters for GET requests
        const url = new URL(req.url)
        data = Object.fromEntries(url.searchParams.entries())
        
        // Convert numeric strings to numbers
        Object.keys(data).forEach(key => {
          if (!isNaN(Number(data[key])) && data[key] !== '') {
            data[key] = Number(data[key])
          }
        })
      }
      
      const validatedData = schema.parse(data)
      
      // Add validated data to request
      const requestWithData = Object.assign(req, {
        validatedData,
      })
      
      return await handler(requestWithData, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Combined auth + validation middleware
export function withAuthAndValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest & { user: any; validatedData: T }, context: any) => Promise<NextResponse>
) {
  return withAuth(
    withValidation(schema, handler as any)
  )
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: { maxRequests?: number; windowMs?: number } = {}
) {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options // 100 requests per 15 minutes
  
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs
    
    const current = rateLimitMap.get(ip)
    
    if (!current || current.resetTime < windowStart) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    } else {
      current.count++
      
      if (current.count > maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
          },
          { status: 429 }
        )
      }
    }
    
    return await handler(req, context)
  }
}

// CORS middleware
export function withCors(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
  } = options
  
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
        },
      })
    }
    
    const response = await handler(req, context)
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
    
    return response
  }
}

// Logging middleware
export function withLogging(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const start = Date.now()
    const { method, url } = req
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Started`)
    
    try {
      const response = await handler(req, context)
      const duration = Date.now() - start
      
      console.log(
        `[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`
      )
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(
        `[${new Date().toISOString()}] ${method} ${url} - Error (${duration}ms):`,
        error
      )
      throw error
    }
  }
}