export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      competition_categories: {
        Row: {
          berat_max: number | null
          berat_min: number | null
          competition_id: string
          created_at: string
          id: string
          jenis_kelamin: string
          kelompok_umur: string
          keterangan: string | null
          nama_kategori: string
        }
        Insert: {
          berat_max?: number | null
          berat_min?: number | null
          competition_id: string
          created_at?: string
          id?: string
          jenis_kelamin?: string
          kelompok_umur: string
          keterangan?: string | null
          nama_kategori: string
        }
        Update: {
          berat_max?: number | null
          berat_min?: number | null
          competition_id?: string
          created_at?: string
          id?: string
          jenis_kelamin?: string
          kelompok_umur?: string
          keterangan?: string | null
          nama_kategori?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_matches: {
        Row: {
          category_id: string
          created_at: string
          gelanggang: number | null
          id: string
          match_number: number
          nomor_partai: number | null
          participant1_id: string | null
          participant2_id: string | null
          round: number
          status: string
          updated_at: string
          waktu_mulai: string | null
          winner_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          gelanggang?: number | null
          id?: string
          match_number: number
          nomor_partai?: number | null
          participant1_id?: string | null
          participant2_id?: string | null
          round: number
          status?: string
          updated_at?: string
          waktu_mulai?: string | null
          winner_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          gelanggang?: number | null
          id?: string
          match_number?: number
          nomor_partai?: number | null
          participant1_id?: string | null
          participant2_id?: string | null
          round?: number
          status?: string
          updated_at?: string
          waktu_mulai?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_matches_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_matches_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_participants: {
        Row: {
          berat_badan: number | null
          category_id: string
          created_at: string
          id: string
          member_id: string
          seed_number: number | null
        }
        Insert: {
          berat_badan?: number | null
          category_id: string
          created_at?: string
          id?: string
          member_id: string
          seed_number?: number | null
        }
        Update: {
          berat_badan?: number | null
          category_id?: string
          created_at?: string
          id?: string
          member_id?: string
          seed_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_participants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string
          id: string
          jumlah_gelanggang: number
          lokasi: string
          nama_kompetisi: string
          status: string
          tanggal_mulai: string
          tanggal_selesai: string | null
          updated_at: string
          waktu_per_pertandingan: number
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by: string
          id?: string
          jumlah_gelanggang?: number
          lokasi: string
          nama_kompetisi: string
          status?: string
          tanggal_mulai: string
          tanggal_selesai?: string | null
          updated_at?: string
          waktu_per_pertandingan?: number
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string
          id?: string
          jumlah_gelanggang?: number
          lokasi?: string
          nama_kompetisi?: string
          status?: string
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          updated_at?: string
          waktu_per_pertandingan?: number
        }
        Relationships: []
      }
      members: {
        Row: {
          cabang: string | null
          created_at: string
          foto_url: string | null
          id: string
          nama_lengkap: string
          nbm: string | null
          no_whatsapp: string | null
          status_aktif: boolean
          tanggal_lahir: string | null
          tempat_lahir: string | null
          tingkatan_id: number | null
          unit_latihan: string | null
          updated_at: string
        }
        Insert: {
          cabang?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nama_lengkap: string
          nbm?: string | null
          no_whatsapp?: string | null
          status_aktif?: boolean
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tingkatan_id?: number | null
          unit_latihan?: string | null
          updated_at?: string
        }
        Update: {
          cabang?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nama_lengkap?: string
          nbm?: string | null
          no_whatsapp?: string | null
          status_aktif?: boolean
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          tingkatan_id?: number | null
          unit_latihan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_tingkatan_id_fkey"
            columns: ["tingkatan_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          member_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          member_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_history: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          member_id: string
          rank_id: number
          tanggal_lulus: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          member_id: string
          rank_id: number
          tanggal_lulus?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          member_id?: string
          rank_id?: number
          tanggal_lulus?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_history_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          id: number
          level_order: number
          name: string
        }
        Insert: {
          id?: number
          level_order: number
          name: string
        }
        Update: {
          id?: number
          level_order?: number
          name?: string
        }
        Relationships: []
      }
      ukt_events: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string
          id: string
          lokasi: string
          nama_event: string
          status: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by: string
          id?: string
          lokasi: string
          nama_event: string
          status?: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lokasi?: string
          nama_event?: string
          status?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      ukt_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          member_id: string
          nilai_akhir: number | null
          status: string
          target_rank_id: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          nilai_akhir?: number | null
          status?: string
          target_rank_id: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          nilai_akhir?: number | null
          status?: string
          target_rank_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ukt_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ukt_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ukt_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ukt_participants_target_rank_id_fkey"
            columns: ["target_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      ukt_scores: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          nilai_aik: number
          nilai_fisik_mental: number
          nilai_ilmu_pencak: number
          nilai_kesehatan: number
          nilai_organisasi: number
          participant_id: string
          penilai_user_id: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          nilai_aik?: number
          nilai_fisik_mental?: number
          nilai_ilmu_pencak?: number
          nilai_kesehatan?: number
          nilai_organisasi?: number
          participant_id: string
          penilai_user_id: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          nilai_aik?: number
          nilai_fisik_mental?: number
          nilai_ilmu_pencak?: number
          nilai_kesehatan?: number
          nilai_organisasi?: number
          participant_id?: string
          penilai_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ukt_scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "ukt_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "penilai" | "komite"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "penilai", "komite"],
    },
  },
} as const
