"use client"

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import styles from '../playlistManager/playlistManager.module.css'
import Link from 'next/link';

interface Playlist {
    id: number;
    name: string;
    imageUrl?: string;
}

interface Track {
    id: number;
    title: string;
    artist: string;
    fileUrl?: string;
}

const PlaylistComponent = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [newPlaylistName, setNewPlaylistName] = useState<string>('');
    const [selectedTrackId, setSelectedTrackId] = useState<string>('');
    const [playlistImage, setPlaylistImage] = useState<File | null>(null);

    useEffect(() => {
        fetchPlaylists();
        fetchTracks();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const { data: authUser, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            if (!authUser.user) {
                console.warn('Пользователь не аутентифицирован');
                return;
            }

            const { data, error } = await supabase
                .from('playlist')
                .select('*')
                .eq('user_id', authUser.user.id);
            if (error) throw error;

            console.log('Fetched playlists:', data);
            setPlaylists(data);
        } catch (error) {
            console.error('Ошибка при загрузке плейлистов:', error);
        }
    };

    const fetchTracks = async () => {
        const { data, error } = await supabase.from('songs').select('*');
        if (error) {
            console.error('Ошибка при загрузке треков:', error.message);
        } else {
            setTracks(data);
        }
    };
    
    const createPlaylist = async () => {
        if (!newPlaylistName) return;
    
        let image_url: string | undefined = undefined; 
    
        if (playlistImage) {
            try {
                const { data, error } = await supabase.storage
                    .from('playlist_images')
                    .upload(`playlist-images/${playlistImage.name}`, playlistImage);
    
                if (error) {
                    console.error('Ошибка загрузки изображения:', error.message);
                    return;
                }
    
                const { publicURL } = await getPublicUrl(`playlist-images/${playlistImage.name}`);
                image_url = publicURL;
    
            } catch (error) {
                console.error("Error uploading image or getting URL:", error);
            }
        }
    
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser.user) return;
    
        try {
            const { data, error } = await supabase.from('playlist').insert([{
                name: newPlaylistName,
                image_url: image_url, 
                user_id: authUser.user.id
            }]);
    
            if (error) {
                console.error('Ошибка при создании плейлиста:', error.message);
            } else {
                setNewPlaylistName('');
                setPlaylistImage(null);
                fetchPlaylists();
            }
        } catch (error) {
            console.error("Error inserting playlist into database:", error);
        }
    };
    
    const getPublicUrl = async (path: string): Promise<{ publicURL: string }> => {
        try {
            const { data } = await supabase.storage.from('playlist_images').getPublicUrl(path);
            return { publicURL: data.publicUrl };
        } catch (error) {
            console.error('Error getting public URL:', error);
            return { publicURL: '' }; 
        }
    };
    
    

    const addTrackToPlaylist = async () => {
        if (selectedPlaylist && selectedTrackId) {
            const { data, error } = await supabase
                .from('playlist_tracks')
                .insert([{ playlist_id: selectedPlaylist, songs_id: selectedTrackId }]);

            if (error) {
                console.error('Ошибка при добавлении трека в плейлист:', error.message); 
                console.error('Детали ошибки:', error); 
            } else {
                setSelectedTrackId('');
                console.log('Трек успешно добавлен:', data);
            }
        }
    };

  return (
      <div className={styles.container}>
        <div className={styles.createPlaylist}>
        <h1>Создать плейлист</h1>
        <div>
      <ul className={styles.banana}>
        <li><Link href='/Home'>Home</Link></li>
        <li><Link href='/library'>Your Library</Link></li>
        <li><Link href='/auth'>Return auth</Link></li>
      </ul>
    </div>
      <input
          type="text"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="Введите название плейлиста"
      />
      <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && setPlaylistImage(e.target.files[0])}
      />
      <button onClick={createPlaylist}>Создать плейлист</button>
      </div>
      <div className={styles.playlists}>
      <h2>Плейлисты</h2>
      <ul>
          {playlists.map((playlist) => (
              <li key={playlist.id} onClick={() => setSelectedPlaylist(playlist.id)}>
                  {playlist.name}
              </li>
          ))}
      </ul>

      {selectedPlaylist && (
          <>
              <h2>Добавитьтрек в плейлист</h2>
                  <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)}>
                      <option value="">Выберите трек</option>
                      {tracks.map((track) => (
                          <option key={track.id} value={track.id}>
                              {track.title} - {track.artist}
                          </option>
                      ))}
                  </select>
                  <button onClick={addTrackToPlaylist}>Добавить в плейлист</button>
              </>
          )}
      </div>
      </div>
  );
};

export default PlaylistComponent;