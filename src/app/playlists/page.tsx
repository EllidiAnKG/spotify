'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';

interface Playlist {
  id: number;
  name: string;
  image_url?: string;
  user_id: string;
}

const PlaylistsPage = () => {
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('Error fetching playlists: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);


  return (
    <div>
      <h1>All Playlists</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <ul>
          {allPlaylists.map((playlist) => (
            <li key={playlist.id}>
              {playlist.image_url && (
                <img src={playlist.image_url} alt={playlist.name} width="50" />
              )}
              {playlist.name}
            </li>
          ))}
        </ul>
      )}

      <h1>My Playlists</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <ul>
          {myPlaylists.map((playlist) => (
            <li key={playlist.id}>
              {playlist.image_url && (
                <img src={playlist.image_url} alt={playlist.name} width="50" />
              )}
              {playlist.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaylistsPage;

