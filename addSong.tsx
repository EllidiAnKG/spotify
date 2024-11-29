// pages/add-song.js
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Замените эти значения своими
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

function AddSong() {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [genre, setGenre] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Используем .insert для добавления новых данных
        const { data, error } = await supabase
            .from('songs')
            .insert([{ title, artist, genre, file_url: fileUrl }]);

        if (error) {
            console.error('Error adding song', error);
        } else {
            console.log('Song added', data);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название песни"
                required
            />
            <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Исполнитель"
                required
            />
            <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Жанр"
                required
            />
            <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Ссылка на файл"
                required
            />
            <button type="submit">Добавить песню</button>
        </form>
    );
}

export default AddSong;
