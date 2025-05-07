import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { useState, useRef } from "react";

function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full max-w-xl bg-neutral-900 text-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
      <img
        src="https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228"
        alt="Album cover"
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-semibold">Nome da Música</span>
        <span className="text-xs text-neutral-400">Artista</span>
        <input
          type="range"
          className="w-full mt-2 accent-green-500"
          min="0"
          max="100"
        />
      </div>
      <div className="flex items-center gap-3">
        <button>
          <SkipBack size={20} />
        </button>
        <button
          onClick={togglePlay}
          className="bg-green-500 hover:bg-green-600 text-black p-2 rounded-full"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button>
          <SkipForward size={20} />
        </button>
        <Volume2 size={20} className="ml-4" />
      </div>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      />
    </div>
  );
}

export default Player;
