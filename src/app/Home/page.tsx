'use client'
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import styles from './Home.module.css';
import CreateTrack from '../components/MusicPlayer';
import { useState } from 'react';
import { useEffect } from 'react';
import {useAuth} from '../../../hook/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);

  const handlePlaySong = (songId: number) => {
    setPlayingSongId(songId);
  };

  const isAuthenticated = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) {

  //     // router.push('/login');
  //   }
  // }, [isAuthenticated, router]);

  // if (!isAuthenticated) {

  //   return null;
  // }

  return (
    <div className={styles.container}>
      <Header onPlaySong={handlePlaySong} />
      <div className={styles.content}>
        <Sidebar />
        <div className={styles.mainContent}>
          <MainContent onPlaySong={handlePlaySong} playingSongId={playingSongId} />
        </div>
        <div className={styles.audioPlayer}>
          <CreateTrack />
        </div>
      </div>
    </div>
  );
}
