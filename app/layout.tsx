import { MusicProvider } from '../components/MusicProvider';
import GlobalSearch from '../components/GlobalSearch';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <MusicProvider>
          {children}
          <GlobalSearch />
        </MusicProvider>
      </body>
    </html>
  );
}
