import { useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface LikeButtonProps {
  videoId: string;
  initialLikeCount: number;
  initialLiked: boolean;
}

export function LikeButton({ videoId, initialLikeCount, initialLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [animating, setAnimating] = useState(false);

  const handleToggleLike = async () => {
    if (!user) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    if (wasLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id);

      if (error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ video_id: videoId, user_id: user.id });

      if (error) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-100 text-neutral-400 text-sm font-medium">
        <Heart className="w-5 h-5" />
        <span>{likeCount.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggleLike}
      className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
        liked
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      <Heart
        className={`w-5 h-5 transition-transform duration-300 ${animating ? 'scale-125' : 'scale-100'} ${
          liked ? 'fill-white' : 'group-hover:scale-110'
        }`}
      />
      <span>{likeCount.toLocaleString()}</span>
    </button>
  );
}
