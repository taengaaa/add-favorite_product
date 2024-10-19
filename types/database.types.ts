export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          description: string
          category: string
          image: string
          link: string
          upvotes: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'upvotes' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      comments: {
        Row: {
          id: number
          product_id: number
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
    }
    Functions: {
      toggle_upvote: {
        Args: { product_id: number; user_id: string }
        Returns: undefined
      }
    }
  }
}
