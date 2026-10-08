import { useEffect, useState } from 'react';
import { Clapperboard } from 'lucide-react';
import type { Video } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ShortCard } from '@/components/VideoCard';

interface ShortsPageProps {
  onPlayVideo: (video: Video) => void;
}

export function ShortsPage({ onPlayVideo }: ShortsPageProps) {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('is_short', true)
        .order('views', { ascending: false });

      setShorts((data as Video[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600">
          <Clapperboard className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Shorts</h1>
          <p className="text-sm text-neutral-500">Quick bites of entertainment</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-neutral-100 animate-pulse">
              <div className="aspect-[9/16] bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : shorts.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No shorts available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {shorts.map((s) => (
            <ShortCard key={s.id} video={s} onClick={() => onPlayVideo(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
