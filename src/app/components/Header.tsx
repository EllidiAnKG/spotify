"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from './Header.module.css';
import { supabase } from '../../../utils/supabase/client';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [genres, setGenres] = useState([]); // Список жанров
  const [selectedGenre, setSelectedGenre] = useState(''); // Выбранный жанр
  const [searchTerm, setSearchTerm] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  interface Track {
    id: string | number; 
    title: string;
    artist: string;
    genre?: string;
  }
  
  interface Playlist {
    id: string | number;
    name: string;
    genre?: string;
  }
  
  // Функция для получения жанров
  const fetchGenres = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('genre')
      .neq('genre', null); // Получаем все уникальные жанры

    if (error) {
      console.error('Ошибка получения жанров:', error);
    } else {
      const uniqueGenres = [...new Set(data.map((item) => item.genre))];
      setGenres(uniqueGenres);
    }
  };

  // Функция для получения треков
  const fetchSongs = async (query = '', genre = '') => {
    let { data, error } = await supabase
      .from('songs')
      .select('*')
      .ilike('genre', `%${query}%`);

    if (!query && genre) {
      // Фильтруем по выбранному жанру
      const response = await supabase
        .from('songs')
        .select('*')
        .eq('genre', genre);
      data = response.data;
      error = response.error;
    } else if (!query) {
      // Если строка и жанр пустые, выводим все треки
      const response = await supabase.from('songs').select('*');
      data = response.data;
      error = response.error;
    }

    if (error) {
      console.error('Ошибка получения треков:', error);
    } else {
      setSongs(data || []);
    }
  };

  // Получение жанров при загрузке компонента
  useEffect(() => {
    fetchGenres();
  }, []);

  // Запрос треков при изменении строки поиска или выбранного жанра
  useEffect(() => {
    fetchSongs(searchQuery, selectedGenre);
  }, [searchQuery, selectedGenre]);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchTerm === '') {
        setTracks([]);
        setPlaylists([]);
        return;
      }

      try {
        const { data: trackData, error: trackError } = await supabase
            .from('songs')
            .select('*')
            .ilike('title', `%${searchTerm}%`);
    
        const { data: playlistData, error: playlistError } = await supabase
            .from('playlist')
            .select('*')
            .ilike('name', `%${searchTerm}%`);
    
        if (trackError) {
            console.error('Error fetching tracks:', trackError);
            setTracks([]); 
        } else {
            setTracks(trackData ?? []); 
        }
    
        if (playlistError) {
            console.error('Error fetching playlists:', playlistError);
            setPlaylists([]);
        } else {
            setPlaylists(playlistData ?? []);
        }
    } catch (error) {
        console.error("General Error", error);
    }
    };

    fetchResults();
  }, [searchTerm]);

  return (
    <div>
      <header className={styles.header}>
        <h1>DeadSongs</h1>
        <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Search tracks" 
      />
        <input
          type="text"
          placeholder="Search by genre"
          className={styles.searchBar}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.genreDropdown}
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((genre, index) => (
            <option key={index} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </header>
      <ul>
        {tracks.map(track => (
          <li key={track.id}>
            {track.title} by {track.artist} {track.genre && `(${track.genre})`}
          </li>
        ))}
      </ul>
  
          {tracks.map(track => (
              <li key={track.id}>
                  {track.title} by {track.artist} {track.genre && `(${track.genre})`} 
              </li>
          ))}
      <div className={styles.songList}>
        {songs.map((song) => (
          <div key={song.id} className={styles.songItem}>
            <h3>{song.title}</h3>
            <p>{song.artist}</p>
            <audio controls>
              <source src={song.file_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Header;
