import { useState } from 'react';

interface Song {
    id: number;
    title: string;
    artist: string;
    genre: string;
}

interface SongSearchProps {
    songs: Song[];
}

function SongSearch({ songs }: SongSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');

    const filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedGenre ? song.genre === selectedGenre : true)
    );

    return (
        <div>
            <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Поиск по названию" 
            />
            <select 
                onChange={(e) => setSelectedGenre(e.target.value)} 
                value={selectedGenre}
            >
                <option value="">Все жанры</option>
                <option value="pop">Поп</option>
                <option value="rock">Рок</option>
                <option value="jazz">Джаз</option>
                {/* Добавьте другие жанры */}
            </select>

            <ul>
                {filteredSongs.map(song => (
                    <li key={song.id}>{song.title} - {song.artist}</li>
                ))}
            </ul>
        </div>
    );
}

export default SongSearch;
