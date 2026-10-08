import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Sidebar, Topbar, type Page } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { ShortsPage } from '@/pages/ShortsPage';
import { FullVideosPage } from '@/pages/FullVideosPage';
import { LoginPage } from '@/pages/LoginPage';
import { UploadPage } from '@/pages/UploadPage';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/lib/supabase';
import type { Video } from '@/lib/types';

function AppContent() {
  const [page, setPage] = useState<Page>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);

  const handlePlayVideo = async (video: Video) => {
    setPlayingVideo(video);

    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('is_short', video.is_short)
      .neq('id', video.id)
      .order('views', { ascending: false })
      .limit(10);

    setRelatedVideos((data as Video[]) ?? []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (p: Page) => {
    setPlayingVideo(null);
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (playingVideo) {
      supabase
        .from('videos')
        .update({ views: playingVideo.views + 1 })
        .eq('id', playingVideo.id)
        .then(() => {});
    }
  }, [playingVideo]);

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onNavigate={handleNavigate} />

        <main className="flex-1">
          {playingVideo ? (
            <VideoPlayer
              video={playingVideo}
              onBack={() => {
                setPlayingVideo(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateVideo={handlePlayVideo}
              relatedVideos={relatedVideos}
            />
          ) : page === 'home' ? (
            <HomePage onPlayVideo={handlePlayVideo} />
          ) : page === 'shorts' ? (
            <ShortsPage onPlayVideo={handlePlayVideo} />
          ) : page === 'full' ? (
            <FullVideosPage onPlayVideo={handlePlayVideo} />
          ) : page === 'login' ? (
            <LoginPage onNavigate={handleNavigate} />
          ) : page === 'upload' ? (
            <UploadPage onNavigate={handleNavigate} onPlayVideo={handlePlayVideo} />
          ) : null}
        </main>

        <footer className="border-t border-neutral-200 py-6 px-4 text-center">
          <p className="text-xs text-neutral-400">
            ReelTube — A video platform built for discovery. © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
