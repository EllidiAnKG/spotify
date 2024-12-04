'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from '../../../utils/supabase/client';
import styles from './MainContent.module.css';

interface MainContentProps {
  onPlaySong: (songId: number) => void;
  playingSongId: number | null;
}
interface Song {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  image_url?: string;
  likes_count: number;
  play_count: number;
}


const MainContent: React.FC<MainContentProps> = ({ onPlaySong, playingSongId }) => {
  const [shouldPlay, setShouldPlay] = useState(false); 
  const [songs, setSongs] = useState<Song[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>('play_count');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCountUpdated, setPlayCountUpdated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 13;
  const [totalSongs, setTotalSongs] = useState<number>(0);
  
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  const updateCurrentTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      requestAnimationFrame(updateCurrentTime);
    }
  }, []);
  
  useEffect(() => {
    const updatePlayCount = async () => {
      if (currentSong && !playCountUpdated) { // Check playCountUpdated flag
        setPlayCountUpdated(true); // Set the flag to true
        try {
          const { data: updatedSong, error } = await supabase
            .from('songs')
            .update({ play_count: currentSong.play_count + 1 })
            .eq('id', currentSong.id)
            .select('*')
            .single();

          if (error) {
            console.error('Ошибка обновления счетчика прослушиваний:', error);
            //Consider showing an error to the user
          } else if (updatedSong) {
            const updatedSongs = songs.map((song) =>
              song.id === updatedSong.id ? updatedSong : song
            );
            setSongs(updatedSongs);
          }
        } catch (error) {
          console.error('Ошибка обновления счетчика прослушиваний:', error);
          //Consider showing an error to the user
        }
      }
    };

    const handlePlaying = () => {
      updatePlayCount();
    };

    if (audioRef.current && currentSong) {
      audioRef.current.addEventListener('playing', handlePlaying);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('playing', handlePlaying);
      }
    };
  }, [currentSong]);


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
        const { data, error, count } = await supabase
          .from("songs")
          .select("*", { count: 'exact' })
          .order(sortBy, { ascending: false })
          .range((currentPage - 1) * songsPerPage, currentPage * songsPerPage - 1);

        if (error) throw error;
        setSongs(data || []);
        setTotalSongs(count || 0);
      } catch (error) {
        console.error("Ошибка получения треков:", error);
        setMessage("Не удалось загрузить треки.");
      }
    };

    fetchSongs();
  }, [sortBy, currentPage]);

  const totalPages = Math.ceil(totalSongs / songsPerPage);

  useEffect(() => {
    const songIndex = songs.findIndex(song => song.id === playingSongId);
    setCurrentSong(songs[songIndex] || null);
    setPlayingIndex(songIndex);

    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentTime(0);
      setDuration(0);
    }
  }, [playingSongId, songs]);

  useEffect(() => {
    const audioElement = audioRef.current;

    const handleCanPlay = () => {
      if (audioElement) {
        setDuration(audioElement.duration);
        audioElement.play();
        setIsPlaying(true);
        requestAnimationFrame(updateCurrentTime);
      }
    };

    if (audioElement && currentSong) {
      audioElement.addEventListener('canplay', handleCanPlay);
      audioElement.load();
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('canplay', handleCanPlay);
        cancelAnimationFrame(updateCurrentTime);
      }
    };
  }, [currentSong, updateCurrentTime]);
  useEffect(() => {
    const audioElement = audioRef.current;

    const handleCanPlay = () => {
      if (audioElement && shouldPlay) {
        setDuration(audioElement.duration);
        audioElement.play();
        setIsPlaying(true);
        requestAnimationFrame(updateCurrentTime);
      }
    };

    if (audioElement && currentSong) {
      audioElement.addEventListener('canplay', handleCanPlay);
      audioElement.load();
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('canplay', handleCanPlay);
        cancelAnimationFrame(updateCurrentTime);
      }
    };
  }, [currentSong, shouldPlay, updateCurrentTime]);

  useEffect(() => {
    if (currentSong && playingSongId) {
        setShouldPlay(true); 
    }
    else{
        setShouldPlay(false);
    }
}, [currentSong, playingSongId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volumeValue = Number(e.target.value);
    setVolume(volumeValue);
  };
  
  const playNextSong = () => {
    if (playingIndex !== null) {
      const nextIndex = (playingIndex + 1) % songs.length;
      onPlaySong(songs[nextIndex]?.id);
    }
  };

  const playPreviousSong = () => {
    if (playingIndex !== null) {
      const previousIndex = (playingIndex - 1 + songs.length) % songs.length;
      onPlaySong(songs[previousIndex]?.id);
    }
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <h2>Список треков</h2>
      {message && <p>{message}</p>}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setSortBy('play_count')}>Сортировать по прослушиваниям</button>
        <button onClick={() => setSortBy('likes_count')}>Сортировать по лайкам</button>
      </div>
      <ul>
        {songs.map(song => (
          <li className={styles.container} key={song.id} onClick={() => onPlaySong(song.id)}>
            <p>Проcлушивания: {song.play_count}</p>
            {song.image_url && (
              <img
                src={song.image_url}
                alt={song.title}
                style={{ width: "50px", height: "50px", marginRight: "10px" }}
              />
            )}
            <strong>Название:</strong> {song.title}<br />
            <strong>Исполнитель:</strong> {song.artist}<br />
            <button onClick={() => handleLikeClick(song.id)}>
              {likedSongs.includes(song.id) ? '❤️ UnLike' : '❤️ Like'} ({song.likes_count})
            </button>
          </li>
        ))}
      </ul>
      {currentSong && (
        <div className={styles.player}>
          <h3>Сейчас играет: {currentSong.title}</h3>
          <audio
            ref={audioRef}
            src={currentSong?.file_url || ''}
            preload="auto"
            onEnded={() => {
              setPlayCountUpdated(false); 
              playNextSong();  
            }}
          />
          <div>
            <button onClick={() => audioRef.current?.pause()}>Пауза</button>
            <button onClick={() => audioRef.current?.play()}>Играть</button>
            <button onClick={playPreviousSong}>Предыдущий трек</button>
            <button onClick={playNextSong}>Следующий трек</button>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={currentTime}
              onChange={handleSliderChange}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      )}
      <div>
        {Array.from({ length: totalPages }, (_, index) => (
          <button key={index} onClick={() => paginate(index + 1)} disabled={currentPage === index + 1}>
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainContent;