import { useEffect, useState } from 'react';
import { TrendingUp, Clapperboard, Film } from 'lucide-react';
import type { Video } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { VideoCard, ShortCard } from '@/components/VideoCard';

interface HomePageProps {
  onPlayVideo: (video: Video) => void;
}

export function HomePage({ onPlayVideo }: HomePageProps) {
  const [fullVideos, setFullVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function load() {
      const { data: full } = await supabase
        .from('videos')
        .select('*')
        .eq('is_short', false)
        .order('created_at', { ascending: false });

      const { data: short } = await supabase
        .from('videos')
        .select('*')
        .eq('is_short', true)
        .order('created_at', { ascending: false });

      setFullVideos((full as Video[]) ?? []);
      setShorts((short as Video[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(fullVideos.map((v) => v.category)))];
  const filteredVideos =
    activeCategory === 'All' ? fullVideos : fullVideos.filter((v) => v.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="absolute inset-0 opacity-20">
          {fullVideos[0]?.thumbnail_url && (
            <img src={fullVideos[0].thumbnail_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="relative p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-600/30 mb-4">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">Trending Now</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight max-w-2xl">
            Watch. Like. Discover.
          </h1>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base max-w-xl">
            Explore the latest full-length videos and bite-sized shorts from creators around the world.
          </p>
          {fullVideos[0] && (
            <button
              onClick={() => onPlayVideo(fullVideos[0])}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
            >
              <Film className="w-4 h-4" />
              Watch Featured
            </button>
          )}
        </div>
      </div>

      {/* Shorts preview */}
      {shorts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clapperboard className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-neutral-900">Shorts</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shorts.slice(0, 6).map((s) => (
              <ShortCard key={s.id} video={s} onClick={() => onPlayVideo(s)} />
            ))}
          </div>
        </section>
      )}

      {/* Category chips */}
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

      {/* Full videos grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-neutral-900">Full Videos</h2>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((v) => (
              <VideoCard key={v.id} video={v} onClick={() => onPlayVideo(v)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
