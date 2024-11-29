
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import styles from './Home.module.css';
import AudioPlayer from '../components/MusicPlayer'


export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <Sidebar />
        <div className={styles.mainContent}>
        <MainContent />
        </div>
        <div className={styles.audioPlayer}>
        <AudioPlayer/>
        </div>
      </div>
    </div>
  );
}
