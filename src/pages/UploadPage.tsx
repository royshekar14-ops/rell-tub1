import { useState, useRef } from 'react';
import { UploadCloud, Film, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2, Clapperboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Page } from '@/components/Layout';
import type { Video } from '@/lib/types';

interface UploadPageProps {
  onNavigate: (page: Page) => void;
  onPlayVideo: (video: Video) => void;
}

const CATEGORIES = ['Travel', 'Tech', 'Sports', 'Food & Drink', 'Nature', 'Music', 'Gaming', 'Comedy', 'General'];

export function UploadPage({ onNavigate, onPlayVideo }: UploadPageProps) {
  const { user } = useAuth();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isShort, setIsShort] = useState(false);
  const [channelName, setChannelName] = useState('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbPreview, setThumbPreview] = useState<string>('');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Video | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 mb-4">
          <UploadCloud className="w-8 h-8 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Sign in to upload</h2>
        <p className="text-sm text-neutral-500 mb-6">You need an account to upload videos to ReelTube.</p>
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be under 100MB.');
      return;
    }
    setError(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for the thumbnail.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Thumbnail must be under 10MB.');
      return;
    }
    setError(null);
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(formatDuration(video.duration));
      };
      video.onerror = () => resolve('0:00');
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError('Please select a video file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for your video.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const userId = user.id;
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${userId}/${Date.now()}-video.${videoExt}`;

      const { error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile, { cacheControl: '3600', upsert: false });

      if (videoUploadError) throw new Error(`Video upload failed: ${videoUploadError.message}`);
      setProgress(50);

      const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoPath);
      const videoUrl = videoUrlData.publicUrl;

      let thumbnailUrl = '';
      if (thumbFile) {
        const thumbExt = thumbFile.name.split('.').pop();
        const thumbPath = `${userId}/${Date.now()}-thumb.${thumbExt}`;

        const { error: thumbUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbPath, thumbFile, { cacheControl: '3600', upsert: false });

        if (thumbUploadError) throw new Error(`Thumbnail upload failed: ${thumbUploadError.message}`);

        const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
      setProgress(75);

      const duration = await getVideoDuration(videoFile);

      const { data: insertData, error: insertError } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          duration,
          category,
          views: 0,
          is_short: isShort,
          channel_name: channelName.trim() || user.email?.split('@')[0] || 'Anonymous',
          channel_avatar_url: '',
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Database error: ${insertError.message}`);

      setProgress(100);
      setSuccess(insertData as Video);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('General');
    setIsShort(false);
    setChannelName('');
    setVideoFile(null);
    setThumbFile(null);
    setVideoPreview('');
    setThumbPreview('');
    setSuccess(null);
    setError(null);
    setProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Upload complete!</h2>
          <p className="text-sm text-neutral-500">Your video is now live on ReelTube.</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
          {success.thumbnail_url && (
            <div className="aspect-video bg-black">
              <img src={success.thumbnail_url} alt={success.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-neutral-900">{success.title}</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {success.category} • {success.is_short ? 'Short' : 'Full Video'} • {success.duration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => onPlayVideo(success)}
            className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Watch Now
          </button>
          <button
            onClick={resetForm}
            className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600">
          <UploadCloud className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Upload Video</h1>
          <p className="text-sm text-neutral-500">Share your content with the world</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Video File <span className="text-red-500">*</span>
        </label>
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
        {!videoFile ? (
          <button
            onClick={() => videoInputRef.current?.click()}
            className="w-full border-2 border-dashed border-neutral-300 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-red-500 hover:bg-red-50/50 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Film className="w-7 h-7 text-neutral-400 group-hover:text-red-500 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-700">Click to select a video</p>
              <p className="text-xs text-neutral-400 mt-1">MP4, WebM, MOV — up to 100MB</p>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
            <div className="relative aspect-video bg-black">
              <video src={videoPreview} controls className="w-full h-full object-contain" />
              <button
                onClick={() => { setVideoFile(null); setVideoPreview(''); if (videoInputRef.current) videoInputRef.current.value = ''; }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex items-center gap-2">
              <Film className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm text-neutral-700 truncate">{videoFile.name}</span>
              <span className="text-xs text-neutral-400 ml-auto shrink-0">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Thumbnail <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbSelect} className="hidden" />
        {!thumbFile ? (
          <button
            onClick={() => thumbInputRef.current?.click()}
            className="w-full border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex items-center justify-center gap-3 hover:border-red-500 hover:bg-red-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <ImageIcon className="w-5 h-5 text-neutral-400 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-sm font-medium text-neutral-600">Select a thumbnail image</span>
          </button>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white relative">
            <img src={thumbPreview} alt="Thumbnail preview" className="w-full aspect-video object-cover" />
            <button
              onClick={() => { setThumbFile(null); setThumbPreview(''); if (thumbInputRef.current) thumbInputRef.current.value = ''; }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title <span className="text-red-500">*</span></label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a catchy title..." maxLength={120}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell viewers about your video..." rows={3} maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 outline-none transition-all"
          >
            {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Channel Name</label>
          <input
            type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)}
            placeholder={user.email?.split('@')[0] ?? 'Your channel'} maxLength={50}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Video Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsShort(false)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              !isShort ? 'border-red-500 bg-red-50/50' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Film className={`w-5 h-5 ${!isShort ? 'text-red-500' : 'text-neutral-400'}`} />
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-900">Full Video</p>
              <p className="text-xs text-neutral-500">Long-form content</p>
            </div>
          </button>
          <button
            onClick={() => setIsShort(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              isShort ? 'border-red-500 bg-red-50/50' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Clapperboard className={`w-5 h-5 ${isShort ? 'text-red-500' : 'text-neutral-400'}`} />
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-900">Short</p>
              <p className="text-xs text-neutral-500">Under 60 seconds</p>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
            <span className="text-sm text-neutral-600">Uploading... {progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload} disabled={uploading || !videoFile}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
      >
        {uploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Uploading...</>
        ) : (
          <><UploadCloud className="w-5 h-5" />Publish Video</>
        )}
      </button>
    </div>
  );
}
