import { MusicProvider } from '../components/MusicProvider';
import GlobalSearch from '../components/GlobalSearch';
import CyberCat from '../components/CyberCat';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <MusicProvider>
          {children}
          <GlobalSearch />
          <CyberCat />
        </MusicProvider>
      </body>
    </html>
  );
}
