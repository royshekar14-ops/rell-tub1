import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Calendar, Share2, ListVideo, Download, Check } from 'lucide-react';
import type { Video } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatViews, timeAgo } from '@/lib/format';
import { LikeButton } from '@/components/LikeButton';
import { VideoCard } from '@/components/VideoCard';

interface VideoPlayerProps {
  video: Video;
  onBack: () => void;
  onNavigateVideo: (video: Video) => void;
  relatedVideos: Video[];
}

export function VideoPlayer({ video, onBack, onNavigateVideo, relatedVideos }: VideoPlayerProps) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLikeData() {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);

      if (!cancelled) setLikeCount(count ?? 0);

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('video_id', video.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cancelled) setLiked(!!data);
      } else {
        if (!cancelled) setLiked(false);
      }
    }

    loadLikeData();
    return () => {
      cancelled = true;
    };
  }, [video.id, user]);

  const handleDownload = async () => {
    try {
      const response = await fetch(video.video_url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      window.open(video.video_url, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>
          {/* Video player */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <video
              key={video.id}
              className="w-full h-full object-contain"
              controls
              autoPlay
              poster={video.thumbnail_url}
              src={video.video_url}
            />
          </div>

          {/* Video info */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                {video.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                {video.is_short ? 'Short' : 'Full Video'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
              {video.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {timeAgo(video.created_at)}
              </span>
            </div>

            {/* Channel + actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                {video.channel_avatar_url ? (
                  <img
                    src={video.channel_avatar_url}
                    alt={video.channel_name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {video.channel_name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">{video.channel_name}</p>
                  <p className="text-xs text-neutral-500">Channel</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LikeButton videoId={video.id} initialLikeCount={likeCount} initialLiked={liked} />
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    downloaded
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {downloaded ? (
                    <>
                      <Check className="w-5 h-5" />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download
                    </>
                  )}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-100">
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}

            {!user && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Sign in to like and interact with videos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related videos sidebar */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 mb-3">
            <ListVideo className="w-4 h-4" />
            {video.is_short ? 'More Shorts' : 'Related Videos'}
          </h3>
          <div className="space-y-3">
            {relatedVideos.slice(0, 8).map((rv) => (
              <div key={rv.id} className="flex gap-3 cursor-pointer group" onClick={() => onNavigateVideo(rv)}>
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                  {rv.thumbnail_url && (
                    <img
                      src={rv.thumbnail_url}
                      alt={rv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
                    {rv.duration}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
                    {rv.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 truncate">{rv.channel_name}</p>
                  <p className="text-xs text-neutral-500">{formatViews(rv.views)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
