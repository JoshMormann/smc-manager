export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          tier: string;
          waitlist_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          tier?: string;
          waitlist_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          tier?: string;
          waitlist_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          is_smart: boolean;
          search_criteria: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          is_smart?: boolean;
          search_criteria?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          is_smart?: boolean;
          search_criteria?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sref_codes: {
        Row: {
          id: string;
          user_id: string;
          code_value: string;
          sv_version: number;
          title: string;
          copy_count: number;
          upvotes: number;
          downvotes: number;
          save_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_value: string;
          sv_version: number;
          title: string;
          copy_count?: number;
          upvotes?: number;
          downvotes?: number;
          save_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_value?: string;
          sv_version?: number;
          title?: string;
          copy_count?: number;
          upvotes?: number;
          downvotes?: number;
          save_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      code_images: {
        Row: {
          id: string;
          code_id: string;
          image_url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code_id: string;
          image_url: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code_id?: string;
          image_url?: string;
          position?: number;
          created_at?: string;
        };
      };
      code_tags: {
        Row: {
          id: string;
          code_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code_id?: string;
          tag?: string;
          created_at?: string;
        };
      };
      folder_codes: {
        Row: {
          id: string;
          folder_id: string;
          code_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          folder_id: string;
          code_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          folder_id?: string;
          code_id?: string;
          added_at?: string;
        };
      };
      saved_codes: {
        Row: {
          id: string;
          user_id: string;
          code_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_id: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_id?: string;
          saved_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          user_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          user_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      code_votes: {
        Row: {
          id: string;
          user_id: string;
          code_id: string;
          is_upvote: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_id: string;
          is_upvote: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_id?: string;
          is_upvote?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_code_vote_counts: {
        Args: {
          code_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
