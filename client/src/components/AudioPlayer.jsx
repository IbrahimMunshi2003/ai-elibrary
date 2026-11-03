import { useRef, useState } from 'react';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export default function AudioPlayer({ src, title }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setError(true);
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (event) => {
    const nextTime = Number(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  };

  return (
    <div className="mt-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
        aria-label={`Audiobook: ${title}`}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          disabled={error}
          className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={seek}
          disabled={!duration || error}
          aria-label="Audio progress"
          className="w-full accent-primary-600"
        />
        <span className="min-w-[5rem] text-right text-xs text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          This audiobook could not be loaded. Please try again later.
        </p>
      )}
    </div>
  );
}
