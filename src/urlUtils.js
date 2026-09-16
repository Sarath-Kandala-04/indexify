const URL_REGEX = /(https?:\/\/[^\s]+)/g

export function extractUrls(text) {
  return (text.match(URL_REGEX) || [])
}

export function getYouTubeId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1)
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1]
    }
  } catch {
    return null
  }
  return null
}

export function isUrl(text) {
  try {
    const u = new URL(text.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}