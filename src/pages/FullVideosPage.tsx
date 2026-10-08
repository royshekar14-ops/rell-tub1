import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import type { Video } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { VideoCard } from '@/components/VideoCard';

interface FullVideosPageProps {
  onPlayVideo: (video: Video) => void;
}

export function FullVideosPage({ onPlayVideo }: FullVideosPageProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('is_short', false)
        .order('views', { ascending: false });

      setVideos((data as Video[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(videos.map((v) => v.category)))];
  const filtered = activeCategory === 'All' ? videos : videos.filter((v) => v.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600">
          <Film className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Full Videos</h1>
          <p className="text-sm text-neutral-500">Long-form content, sorted by popularity</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-neutral-100 animate-pulse">
              <div className="aspect-video bg-neutral-200" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-full" />
                <div className="h-3 bg-neutral-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No videos in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} onClick={() => onPlayVideo(v)} />
          ))}
        </div>
      )}
    </div>
  );
}
