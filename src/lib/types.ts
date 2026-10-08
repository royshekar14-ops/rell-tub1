export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  category: string;
  views: number;
  is_short: boolean;
  channel_name: string;
  channel_avatar_url: string;
  created_at: string;
  user_id?: string | null;
}

export interface Like {
  id: string;
  video_id: string;
  user_id: string;
  created_at: string;
}
