import { NextRequest, NextResponse } from 'next/server'

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const audioId = request.nextUrl.searchParams.get('audio')
  if (audioId) {
    if (!/^\d+$/.test(audioId)) {
      return NextResponse.json({ error: 'Invalid audio id' }, { status: 400 })
    }

    try {
      const audioRes = await fetch(`https://music.163.com/song/media/outer/url?id=${audioId}.mp3`, {
        headers: NET_EASE_HEADERS,
        redirect: 'follow',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })
      if (!audioRes.ok || !audioRes.body) {
        return NextResponse.json({ error: 'Audio unavailable' }, { status: 502 })
      }
      return new Response(audioRes.body, {
        status: 200,
        headers: {
          'Content-Type': audioRes.headers.get('content-type') || 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600',
          ...(audioRes.headers.get('content-length') ? { 'Content-Length': audioRes.headers.get('content-length')! } : {}),
        },
      })
    } catch (error) {
      console.error(`[api/music] 音频代理 ${audioId} 失败:`, error)
      return NextResponse.json({ error: 'Audio unavailable' }, { status: 502 })
    }
  }

  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)

  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const [detailRes, lrcRes] = await Promise.all([
          fetch(
            `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ),
          fetch(
            `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ).catch(() => null),
        ])

        const detail = await detailRes.json()
        const song = detail.songs?.[0]

        if (!song) {
          return { id: songId, error: 'not_found' }
        }

        let lrcText = ''
        if (lrcRes && lrcRes.ok) {
          try {
            const lrcData = await lrcRes.json()
            lrcText = lrcData.lrc?.lyric || ''
          } catch {
            /* 歌词可选，失败不影响主流程 */
          }
        }

        const artistName = song.artists?.[0]?.name || '未知歌手'

        return {
          id: songId,
          name: song.name,
          artist: artistName,
          author: artistName,
          cover: song.album?.picUrl || '',
          pic: song.album?.picUrl || '',
          url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
          lrc: lrcText,
        }
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error)
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
