export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, never>
        Insert: Record<string, never>
        Update: Record<string, never>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, never>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}

// Note: This is a basic types file. To generate full types from your Supabase database:
// 1. Login to Supabase CLI: supabase login
// 2. Run: npx supabase gen types typescript --project-id "imxiufvfhzjkdhinlhst" --schema public > src/types/database.types.ts
// Or use the npm script: npm run update-types
