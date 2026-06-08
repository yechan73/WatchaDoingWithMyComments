export interface WatchaRawComment {
  code?: string;
  text?: string;
  spoiler?: boolean;
  improper?: boolean;
  created_at?: string;
  content?: {
    code?: string;
    content_type?: string;
    title?: string;
    year?: number;
    poster?: {
      small?: string;
      medium?: string;
      large?: string;
      xlarge?: string;
      hd?: string;
    };
    director_names?: string[];
    ratings_avg?: number;
  };
  user_content_action?: {
    rating?: number;
  };
}
