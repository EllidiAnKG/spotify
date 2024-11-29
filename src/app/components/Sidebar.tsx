
import Link from '../../../node_modules/next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <nav className={styles.sidebar}>
     <div>
      <ul>
        <li><Link href='/playlistManager'>Create Playlists</Link></li>
        <li><Link href='/playlists'>Playlists</Link></li>
        <li><Link href='/recovery'>Reset password</Link></li>
        <li><Link href='/auth'>Return auth</Link></li>
        <li><Link href='/library'>library</Link></li>
        
      </ul>
    </div>
    </nav>
  );
};

export default Sidebar;
