'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

interface Playlist {
  id: number;
  name: string;
  image_url?: string;
  user_id: string;
}

interface Song {
  id: number;
  title: string;
  playlist_id: number;
  file_url: string;
}

const PlaylistsPage = () => {
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [showSongsModal, setShowSongsModal] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const { data: allPlaylistsData, error: allPlaylistsError } = await supabase
          .from('playlist')
          .select('*');

        if (allPlaylistsError) throw allPlaylistsError;
        setAllPlaylists(allPlaylistsData || []);

        if (authUser?.user) {
          const { data: myPlaylistsData, error: myPlaylistsError } = await supabase
            .from('playlist')
            .select('*')
            .eq('user_id', authUser.user.id);

          if (myPlaylistsError) throw myPlaylistsError;
          setMyPlaylists(myPlaylistsData || []);
        }
      } catch (error) {
        setError('Error fetching playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const fetchSongs = async (playlistId: number) => {
    try {
      console.log("Fetching songs for playlist ID:", playlistId);
      const { data: songsData, error: songsError } = await supabase
        .from('playlist_tracks')
        .select('songs_id, playlist(id, name, image_url)')
        .eq('playlist_id', playlistId);
  
      if (songsError) {
        console.error("Error fetching playlist tracks:", songsError);
        throw songsError; 
      }
  
      if (!songsData || songsData.length === 0) {
        console.warn("No songs found for this playlist.");
        setSongs([]); 
        return;
      }
  
      const songsWithDetails = await Promise.all(songsData.map(async (song) => {
        console.log("Fetching details for song ID:", song.songs_id);
        const { data: trackData, error } = await supabase
          .from('songs')
          .select('id, title, *') 
          .eq('id', song.songs_id)
          .single();
  
        if (error) {
          console.error("Error fetching song details:", error, "for song ID:", song.songs_id);
          throw error; 
        }
        return { ...trackData, playlist_id: playlistId };
      }));
  
      setSongs(songsWithDetails);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Error fetching songs. See console for details.');
    }
  };
  

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    fetchSongs(playlist.id); 
    setShowSongsModal(true); 
  };

  if (loading) return <div>Loading...</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Playlists</h1>
      <ul>
        {allPlaylists.map(playlist => (
          <li key={playlist.id}>
            <button onClick={() => handlePlaylistSelect(playlist)}>
              {playlist.name}
            </button>
          </li>
        ))}
      </ul>

      {showSongsModal && selectedPlaylist && (
        <div>
          <h2>Songs in {selectedPlaylist.name}</h2>
          <button onClick={() => setShowSongsModal(false)}>Close</button>
          <ul>
            {songs.map(song => (
              <li key={song.id}>
                {song.title} - <audio controls src={song.file_url}></audio>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;