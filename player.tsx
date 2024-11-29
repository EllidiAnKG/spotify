// components/AudioPlayer.js
import { useState, useEffect, useRef } from 'react';

interface Song {
    title: string;
    artist: string;
    file_url: string;
}

// Определите интерфейс для пропсов AudioPlayer
interface AudioPlayerProps {
    songs: Song[];
}

function AudioPlayer({ songs }: AudioPlayerProps) {
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null); // Указываем тип для useRef

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play();
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const handleNext = () => {
        setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    };

    const handlePrevious = () => {
        setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
    };

    return (
        <div>
            <audio ref={audioRef} src={songs[currentSongIndex].file_url} />
            <button onClick={handlePrevious}>Предыдущая</button>
            <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Пауза' : 'Играть'}</button>
            <button onClick={handleNext}>Следующая</button>
            <h3>{songs[currentSongIndex].title} - {songs[currentSongIndex].artist}</h3>
        </div>
    );
}

export default AudioPlayer;
