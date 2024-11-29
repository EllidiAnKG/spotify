'use client'
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import styles from '../library/library.module.css'
import Link from 'next/link';

interface Track {
  id: number; 
  title: string;
  artist: string;
  file_url?: string;
}

interface Playlist {
  id: number;
  name: string;
  image_url?: string; 
  user_id: string;
}
interface PlaylistTrack {
    id: number;
    songs_id: number;
    playlist_id: number;
}
interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}

const Library = () => {
  const [playlistsWithTracks, setPlaylistsWithTracks] = useState<PlaylistWithTracks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalPlaylist, setModalPlaylist] = useState<PlaylistWithTracks | null>(null);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!authUser.user) {
        throw new Error("Пользователь не аутентифицирован");
      }
      const { data: playlists, error: playlistError } = await supabase
        .from('playlist')
        .select(`
          id,
          name,
          image_url,
          user_id,
          playlist_tracks (
            songs_id 
          )
        `)
        .eq('user_id', authUser.user.id);
  
      if (playlistError) throw playlistError;
  
      console.log('Retrieved playlists:', playlists); 

      if (!playlists || playlists.length === 0) {
        console.warn('Нет плейлистов для данного пользователя'); 
        return; 
      }
  
      const playlistsWithTracksPromises = playlists.map(async (playlist) => {
        const { data: tracks, error } = await supabase
          .from('songs')
          .select('id, title, artist, file_url')
          .in('id', playlist.playlist_tracks.map((track) => track.songs_id));
  
        if (error) throw error;
        
        return {
          ...playlist,
          tracks: tracks || [],
        };
      });
  
      const playlistsWithTracks = await Promise.all(playlistsWithTracksPromises);
  
      setPlaylistsWithTracks(playlistsWithTracks);
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      setError('Ошибка загрузки плейлистов: ' + message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlist: PlaylistWithTracks) => {
    setModalPlaylist(playlist);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalPlaylist(null);
  };

  
const removeTrackFromPlaylist = async (trackId: number, playlistId: number) => {
    try {
        setLoading(true);
        const { data: existingTrack, error: fetchError } = await supabase
            .from('playlist_tracks')
            .select('*')
            .eq('songs_id', trackId)
            .eq('playlist_id', playlistId);
        
        if (fetchError) {
            console.error("Ошибка при получении трека:", fetchError.message);
            return;
        }

        if (existingTrack.length === 0) {
            console.log("Трек не найден в плейлисте");
            return;
        }

        const { data, error } = await supabase
            .from('playlist_tracks')
            .delete()
            .eq('songs_id', trackId)
            .eq('playlist_id', playlistId);

        if (error) {
            console.error("Ошибка при удалении:", error.message);
        } else {
            console.log("Удалено:", data);
        }
        setPlaylistsWithTracks((prevPlaylists) =>
        prevPlaylists.map((playlist) => {
                if (playlist.id === playlistId) {
                    return {
                        ...playlist,
                        tracks: playlist.tracks.filter(track => track.id !== trackId),
                    };
                }
                return playlist;
            })
        );

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.log(err);
    } finally {
        setLoading(false);
    }
};


  return (
    <div className={styles.body}>
      <div>
      <ul>
        <li><Link href='/Home'>Home</Link></li>
        <li><Link href='/search'>Search</Link></li>
        <li><Link href='/library'>Your Library</Link></li>
        <li><Link href='/playlistManager'>Your Library</Link></li>
      </ul>
    </div>
      <h1>Ваша Библиотека Плейлистов</h1>
  
      {loading && <p>Загрузка...</p>}
  
      {error && <div style={{ color: 'red' }}>{error}</div>}
  
      <div className={styles.banana}>
        <div className={styles.container}>
          {playlistsWithTracks.map((playlist) => (
            <div className={styles.listPlaylists} key={playlist.id} onClick={() => handlePlaylistClick(playlist)}>
              <h2>{playlist.name}</h2>
              {playlist.image_url && (
                <img src={playlist.image_url} alt={playlist.name} width="50" />
              )}
            </div>
          ))}
        </div>
  
        {showModal && modalPlaylist && (
        <div className={styles.modal}>
            <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>
                &times;
            </span>
            <h2>{modalPlaylist.name}</h2>
            {modalPlaylist.image_url && (
                <img src={modalPlaylist.image_url} alt={modalPlaylist.name} width="100" />
            )}
            <ul>
                {modalPlaylist.tracks.map((track) => (
                <li className={styles.listSongs} key={track.id}>
                    {track.title} - {track.artist}
                    {track.file_url && <audio controls src={track.file_url} />}
                    <div>
                    <button onClick={() => removeTrackFromPlaylist(track.id, modalPlaylist.id)}>
                        Удалить
                    </button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        </div>
        )}
      </div>
    </div>
  );
}


  



export default Library;