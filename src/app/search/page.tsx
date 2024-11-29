"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import Link from 'next/link';

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

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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
      <div>
      <ul>
        <li><Link href='/Home'>Home</Link></li>
        <li><Link href='/search'>Search</Link></li>
        <li><Link href='/library'>Your Library</Link></li>
        <li><Link href='/playlistManager'>Your Library</Link></li> 
      </ul>
    </div>
      <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Search tracks or genres..." 
      />

      <h2>Tracks</h2>
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


          {playlists.map(playlist => (
              <li key={playlist.id}>
                  {playlist.name} {playlist.genre && `(${playlist.genre})`} 
              </li>
          ))}
    
      <h2>Playlists</h2>
      <ul>
        {playlists.map(playlist => (
          <li key={playlist.id}>
            {playlist.name} {playlist.genre && `(${playlist.genre})`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;

