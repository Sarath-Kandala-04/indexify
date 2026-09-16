import { extractUrls, getYouTubeId } from './urlUtils'

export default function LinkText({ text }) {
  const urls = extractUrls(text || '')
  if (urls.length === 0) return <>{text}</>

  const parts = []
  let remaining = text
  urls.forEach((url) => {
    const idx = remaining.indexOf(url)
    if (idx > 0) parts.push(remaining.slice(0, idx))
    parts.push({ url })
    remaining = remaining.slice(idx + url.length)
  })
  if (remaining) parts.push(remaining)

  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>
        const ytId = getYouTubeId(part.url)
        if (ytId) {
          return (
            <div key={i} className="my-2 rounded-md overflow-hidden" style={{ border: '1px solid var(--line)' }}>
              <a href={part.url} target="_blank" rel="noreferrer" className="block px-3 py-1.5 text-xs" style={{ color: 'var(--accent)', background: 'var(--panel-2)' }}>
                {part.url}
              </a>
              <iframe
                width="100%"
                height="240"
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )
        }
        return (
          <a key={i} href={part.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            {part.url}
          </a>
        )
      })}
    </>
  )
}