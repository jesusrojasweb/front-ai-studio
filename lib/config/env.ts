// Environment configuration utility
// This file centralizes all environment variables for easy access across the app

interface AppConfig {
  // API endpoints
  MS_CORE_CREATOR_STUDIO: string

  // App environment
  NODE_ENV: string

  // Next.js specific
  NEXT_PUBLIC_APP_URL?: string
}

class EnvironmentConfig {
  private config: AppConfig

  constructor() {
    // Initialize configuration - Next.js will make env vars available through next.config.ts
    this.config = {
      MS_CORE_CREATOR_STUDIO: process.env.MS_CORE_CREATOR_STUDIO || '',
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }

    this.validateConfig()
  }

  private validateConfig() {
    const requiredVars = ['MS_CORE_CREATOR_STUDIO']

    for (const varName of requiredVars) {
      if (!this.config[varName as keyof AppConfig]) {
        console.warn(
          `Warning: Required environment variable ${varName} is not set`
        )
      }
    }
  }

  // API URLs
  get apiBaseUrl(): string {
    return this.config.MS_CORE_CREATOR_STUDIO
  }

  get authApiUrl(): string {
    return `${this.apiBaseUrl}/auth`
  }

  get videosApiUrl(): string {
    return `${this.apiBaseUrl}/v1/videos`
  }

  get clipsApiUrl(): string {
    return `${this.apiBaseUrl}/v1/clips`
  }

  get jobsApiUrl(): string {
    return `${this.apiBaseUrl}/v1/jobs`
  }

  // Environment checks
  get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }

  get isTest(): boolean {
    return this.config.NODE_ENV === 'test'
  }

  // App URLs
  get appUrl(): string {
    return this.config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  // Debug method
  getConfig(): Readonly<AppConfig> {
    return { ...this.config }
  }
}

// Create and export singleton instance
export const env = new EnvironmentConfig()

// Export types for TypeScript support
export type { AppConfig }
