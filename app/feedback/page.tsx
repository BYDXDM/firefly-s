import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import FeedbackForm from './FeedbackForm';

export const metadata: Metadata = {
  title: "建议箱 | " + siteConfig.title,
  description: "对这个网站有任何建议、想法或者发现了一处 Bug，都欢迎告诉我",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen relative pb-20 flex flex-col">
      <Navbar />
      <PageTransition className="flex-1 flex flex-col">
        <main className="w-[95%] md:w-[90%] max-w-3xl mx-auto mt-24 md:mt-28 flex-1 relative z-10">
          {/* 页头 */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">建议箱</h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
              无论是对网站的改进想法、发现的小 Bug，还是单纯想聊两句，都欢迎投进这个箱子。
            </p>
          </header>

          <FeedbackForm />

          {/* 管理入口 */}
          <p className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500 font-bold">
            站长入口：<a href="/admin/feedback" className="hover:text-indigo-500 transition-colors">建议管理 →</a>
          </p>
        </main>
      </PageTransition>
    </div>
  );
}
