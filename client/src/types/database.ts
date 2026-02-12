// types/database.ts
export interface Post {
  id: string
  content: string
  thumbnail: string | null
  latitude: number
  longitude: number
  sido: string
  sigungu: string
  location_key: string
  created_at: string
}

export interface LocationStat {
  location_key: string
  sido: string
  sigungu: string
  post_count: number
  tree_size: number
  last_post_at: string | null
}

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
      }
    }
    Views: {
      location_stats: {
        Row: LocationStat
      }
    }
  }
}
