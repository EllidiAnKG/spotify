"use client";
import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

const AddSongForm: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [artist, setArtist] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [genre, setGenre] = useState<string>('');
    const [image, setImage] = useState<File | null>(null); 
    const [message, setMessage] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFile(event.target.files?.[0] || null); 
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImage(event.target.files?.[0] || null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            setMessage('You must be logged in to add a song.');
            return;
        }

        if (!file) {
            setMessage('Please select an audio file.');
            return;
        }

        try {
            const { data: uploadAudioData, error: uploadAudioError } = await supabase.storage
                .from('songs')
                .upload(file.name, file);

            if (uploadAudioError) {
                throw uploadAudioError;
            }

            const audioFileUrl = `https://ndcvronhgjgzgxelnlaa.supabase.co/storage/v1/object/public/songs/${uploadAudioData.path}`;
            let imageUrl: string | undefined;
            if (image) {
                const { data: uploadImageData, error: uploadImageError } = await supabase.storage
                  .from('track_images')
                  .upload(image.name, image);
                if (uploadImageError) {
                    throw uploadImageError;
                }
                imageUrl = `https://ndcvronhgjgzgxelnlaa.supabase.co/storage/v1/object/public/track_images/${uploadImageData.path}`;//Replace with your bucket URL
            }
            const { data: songData, error: songError } = await supabase.from('songs').insert([{
                title,
                artist,
                file_url: audioFileUrl,
                genre,
                image_url: imageUrl, 
            }]);
    
            if (songError) {
                throw songError;
            }
    
            setMessage('Song added successfully!');
            setTitle('');
            setArtist('');
            setFile(null);
            setImage(null);
            setGenre('');
        } catch (error) {
            console.error('Error adding song:', error);
            setMessage(`Error adding song: ${error}`);
        }
    };
    
    const genres = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'R&B', 'Electronic', 'Country'];

    return (
        <div>
            <h2>Добавить песню</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Название"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Исполнитель"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                />
                <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
                    <option value="">Выберите жанр</option>
                    {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    required
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange} 
                />
                <button type="submit">Добавить песню</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AddSongForm;
