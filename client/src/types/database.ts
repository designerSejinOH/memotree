// types/database.ts
export interface Post {
  id: string
  content: string
  thumbnail: string | null
  latitude: number
  longitude: number
  sig_cd: number // 시군구코드
  sig_eng_nm: string // 영문명
  full_nm: string // 전체명
  sig_kor_nm: string // 한글명
  created_at: string
}

export interface LocationStat {
  sig_eng_nm: string
  sig_cd: number
  sig_kor_nm: string
  full_nm: string
  post_count: number
  tree_size: number
  last_post_at: string | null
}

export interface PostInsert {
  content: string
  thumbnail?: string | null
  latitude: number
  longitude: number
  sig_cd: number
  sig_eng_nm: string
  full_nm: string
  sig_kor_nm: string
}

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: Post
        Insert: PostInsert
        Update: Partial<PostInsert>
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Views: {
      location_stats: {
        Row: LocationStat
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Functions: Record<string, {
      Args: Record<string, unknown>
      Returns: unknown
    }>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
