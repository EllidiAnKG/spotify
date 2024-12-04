'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from './Header.module.css';
import { supabase } from '../../../utils/supabase/client';

const Header = ({ onPlaySong }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [songsPerPage] = useState(5);
  const indexOfLastSong = currentPage * songsPerPage;
  const indexOfFirstSong = indexOfLastSong - songsPerPage;
  const currentSongs = filteredSongs.slice(indexOfFirstSong, indexOfLastSong);

  const fetchGenres = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('genre')
      .neq('genre', null);

    if (error) {
      console.error('Ошибка получения жанров:', error);
    } else {
      const uniqueGenres = [...new Set(data.map((item) => item.genre))];
      setGenres(uniqueGenres);
    }
  };

  const fetchSongs = async () => {
    const { data, error } = await supabase.from('songs').select('*');

    if (error) {
      console.error('Ошибка получения треков:', error);
    } else {
      setSongs(data || []);
    }
  };

  const filterSongs = () => {
    let filtered = songs;

    if (searchTerm) {
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(song =>
        song.genre === selectedGenre
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(song =>
        song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSongs(filtered);
  };

  useEffect(() => {
    fetchGenres();
    fetchSongs();
  }, []);

  useEffect(() => {
    filterSongs();
  }, [searchTerm, selectedGenre, searchQuery, songs]);

  const handlePageChange = (direction) => {
    setCurrentPage((prevPage) => prevPage + direction);
  };

  return (
    <div>
      <header className={styles.header}>
        <h1>DeadSongs</h1>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search tracks by title" 
          className={styles.headerInput}
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
      <div className={styles.songList}>
        {currentSongs.length > 0 ? currentSongs.map((song) => (
          <div key={song.id} className={styles.songItem} onClick={() => onPlaySong(song.id)}>
            <h3>{song.title}</h3>
            <p>{song.artist} {song.genre && `(${song.genre})`}</p>
          </div>
        )) : (
          <p>Нет треков, соответствующих вашему запросу.</p>
        )}
      </div>
      <div className={styles.pagination}>
        <button onClick={() => handlePageChange(-1)} disabled={currentPage === 1}>
          Назад
        </button>
        <span>Страница {currentPage}</span>
        <button onClick={() => handlePageChange(1)} disabled={indexOfLastSong >= filteredSongs.length}>
          Вперед
        </button>
      </div>
    </div>
  );
};

export default Header;