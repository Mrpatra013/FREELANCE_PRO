import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// Custom error types
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }))
    
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: errors,
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: 'A record with this information already exists',
          },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: 'Record not found',
          },
          { status: 404 }
        )
      case 'P2003':
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid reference to related record',
          },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database error occurred',
          },
          { status: 500 }
        )
    }
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    )
  }

  // Generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }

  // Unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function asyncHandler(
  fn: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await fn(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Client-side error handler
export function handleClientError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

// Success response helper
export function successResponse(data?: any, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data,
  })
}

// Error response helper
export function errorResponse(message: string, statusCode: number = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status: statusCode }
  )
}