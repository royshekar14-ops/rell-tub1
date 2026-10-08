import { Link2, Play } from 'lucide-react';
import type { Video } from '@/lib/types';
import { formatViews, timeAgo } from '@/lib/format';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:shadow-xl hover:border-neutral-300 transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-200">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-neutral-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {video.duration}
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium">
            {video.category}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          {video.channel_avatar_url ? (
            <img
              src={video.channel_avatar_url}
              alt={video.channel_name}
              className="w-6 h-6 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-300 flex items-center justify-center">
              <Link2 className="w-3 h-3 text-neutral-500" />
            </div>
          )}
          <span className="text-xs text-neutral-600 truncate">{video.channel_name}</span>
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          {formatViews(video.views)} • {timeAgo(video.created_at)}
        </p>
      </div>
    </div>
  );
}

interface ShortCardProps {
  video: Video;
  onClick: () => void;
}

export function ShortCard({ video, onClick }: ShortCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:shadow-2xl transition-all duration-300 relative"
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-neutral-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 rounded-full bg-red-600/90 backdrop-blur text-white text-xs font-bold">
            SHORT
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug">{video.title}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            {video.channel_avatar_url && (
              <img
                src={video.channel_avatar_url}
                alt={video.channel_name}
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
              />
            )}
            <span className="text-xs text-neutral-300 truncate">{video.channel_name}</span>
            <span className="text-xs text-neutral-400 ml-auto">{formatViews(video.views)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
