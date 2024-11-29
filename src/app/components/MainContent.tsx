"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from '../../../utils/supabase/client';
import styles from './MainContent.module.css'

interface Song {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  image_url?: string;
  likes_count: number;
  play_count: number;
}

const SongList: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [sortBy, setSortBy] = useState<string>('play_count');

  const audioRef = useRef<HTMLAudioElement>(null);


 // Получение треков с учетом сортировки
 const fetchSongs = async () => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order(sortBy, { ascending: false });
    if (error) throw error;
    setSongs(data || []);
  } catch (error) {
    console.error('Error fetching songs:', error);
    setMessage('Failed to load songs.');
  }
};

// Получение лайков пользователя
const fetchLikedSongs = async () => { 
  const { data: { user }, error: authError } = await supabase.auth.getUser(); 
  if (authError || !user) { 
    console.error("Authentication error:", authError); 
    setMessage("Authentication error. Please sign in."); 
    return; 
  } 
  const userId = user.id; 
  try { 
    const { data, error } = await supabase 
      .from('user_liked_songs') 
      .select('song_id') 
      .eq('user_id', userId); 
    if (error) throw error; 

    // Define the type of data.map
    const likedSongIds: number[] = (data || []).map((item: { song_id: number }) => item.song_id); 
    setLikedSongs(likedSongIds); 
  } catch (error) { 
    console.error("Error fetching liked songs:", error); 
    setMessage("Failed to load liked songs."); 
  } 
}; 


  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .order("play_count", { ascending: false });

        if (error) throw error;
        setSongs(data || []);
      } catch (error) {
        console.error("Error fetching songs:", error);
        setMessage("Failed to load songs.");
      }
    };

    fetchSongs();
  }, []);

  const handleSongClick = (songId: number) => {
    setPlayingSongId(songId);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (!playingSongId) return;
    const currentIndex = songs.findIndex((song) => song.id === playingSongId);
    if (currentIndex > 0) {
      setPlayingSongId(songs[currentIndex - 1].id);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (!playingSongId) return;
    const currentIndex = songs.findIndex((song) => song.id === playingSongId);
    if (currentIndex < songs.length - 1) {
      setPlayingSongId(songs[currentIndex + 1].id);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = parseFloat(e.target.value);
      setCurrentTime(parseFloat(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const currentSong = songs.find((song) => song.id === playingSongId);

  const handleLikeClick = async (songId: number) => {
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) {
        setMessage('You must be logged in to like a song.');
        return;
    }
    const userId = authUser.user.id;

    try {
        const { data: existingLikes, error: checkError } = await supabase
            .from('user_liked_songs')
            .select('id')
            .eq('user_id', userId)
            .eq('song_id', songId);

        if (checkError) {
            console.error("Error checking existing like:", checkError);
            setMessage("Failed to check for existing like.");
            return;
        }

        const updateLikes = async (songId:number, increment:number): Promise<void> =>{
            const {error: updateError} = await supabase
                .from('songs')
                .update({likes_count: increment})
                .eq('id', songId);
            if(updateError){
                console.error("Error updating likes count:", updateError);
                setMessage("Failed to update like count");
                return;
            }
            const updatedSongs = songs.map((song) =>
                song.id === songId ? { ...song, likes_count: song.likes_count + increment} : song
            );
            setSongs(updatedSongs);
        }

        if (existingLikes.length > 0) {
            const { error: deleteError } = await supabase
                .from('user_liked_songs')
                .delete()
                .eq('user_id', userId)
                .eq('song_id', songId);

            if (deleteError) {
                console.error('Error deleting like:', deleteError);
                setMessage('Failed to unlike song.');
                return;
            }
            await updateLikes(songId, -1);
            setLikedSongs(likedSongs.filter((id) => id !== songId));
            setMessage('Song unliked!');
        } else {
            const { error: insertError } = await supabase
                .from('user_liked_songs')
                .insert([{ user_id: userId, song_id: songId }]);
            if (insertError) {
                console.error('Error inserting like:', insertError);
                setMessage('Failed to like song.');
                return;
            }
            await updateLikes(songId, 1);
            setLikedSongs([...likedSongs, songId]);
            setMessage('Song liked!');
        }
    } catch (error) {
        console.error("Unexpected error liking song:", error);
        setMessage("Failed to like/unlike song.");
    }
};


  return (
    <div>
      <h2>Список треков</h2>
      {message && <p>{message}</p>}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setSortBy('play_count')}>Сортировать по прослушиваниям</button>
        <button onClick={() => setSortBy('likes_count')}>Сортировать по лайкам</button>
      </div>
      <ul>
        {songs.map((song) => (
          <li className={styles.container} key={song.id} onClick={() => handleSongClick(song.id)}>
            <p>Plays: {song.play_count}</p>
            {song.image_url && (
              <img
                src={song.image_url}
                alt={song.title}
                style={{ width: "50px", height: "50px", marginRight: "10px" }}
              />
            )}
            <strong>Название:</strong> {song.title} <br />
            <strong>Исполнитель:</strong> {song.artist} <br />
            <button onClick={() => handleLikeClick(song.id)}>
                            {likedSongs.includes(song.id) ? '❤️ UnLike' : '❤️ Like'} ({song.likes_count})
                        </button>
          </li>
        ))}
      </ul>

      {/* Панель управления */}
      {playingSongId && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px"  }}>
          <h3>Сейчас играет: {currentSong?.title}</h3>
          <audio
            ref={audioRef}
            src={currentSong?.file_url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            autoPlay
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={handlePrevious}>⏮️ Предыдущий</button>
            <button onClick={togglePlayPause}>{isPlaying ? "⏸️ Пауза" : "▶️ Воспроизвести"}</button>
            <button onClick={handleNext}>⏭️ Следующий</button>
          </div>
          <div style={{ marginTop: "10px" }}>
            <input
              type="range"
              min="0"
              max={audioRef.current?.duration || 100}
              value={currentTime}
              onChange={handleSeek}
            />
            <p>Текущее время: {Math.floor(currentTime)} / {Math.floor(audioRef.current?.duration || 0)}</p>
          </div>
          <div style={{ marginTop: "10px" }}>
            <label>Громкость:</label>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SongList;
