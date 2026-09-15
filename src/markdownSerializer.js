import { newBlock } from './noteBlocks'

const FRONTMATTER_DELIM = '---'

function blockToMarkdown(block) {
  switch (block.type) {
    case 'heading1': return `# ${block.text}`
    case 'heading2': return `## ${block.text}`
    case 'heading3': return `### ${block.text}`
    case 'bulleted': return `- ${block.text}`
    case 'numbered': return `1. ${block.text}`
    case 'todo': return `- [${block.checked ? 'x' : ' '}] ${block.text}`
    case 'quote': return `> ${block.text}`
    case 'divider': return `---`
    case 'image': return `![](${block.text})`
    case 'file': return `[${block.fileName || block.text}](${block.text})`
    default: return block.text || ''
  }
}

function lineToBlock(line) {
  if (line.startsWith('### ')) return newBlock('heading3', line.slice(4))
  if (line.startsWith('## ')) return newBlock('heading2', line.slice(3))
  if (line.startsWith('# ')) return newBlock('heading1', line.slice(2))
  if (/^- \[[ xX]\] /.test(line)) {
    const checked = /^- \[[xX]\]/.test(line)
    return { ...newBlock('todo', line.replace(/^- \[[ xX]\] /, '')), checked }
  }
  const imageMatch = line.match(/^!\[\]\((.+)\)$/)
  if (imageMatch) return newBlock('image', imageMatch[1])
  const fileMatch = line.match(/^\[(.+)\]\((attachments\/.+)\)$/)
  if (fileMatch) return { ...newBlock('file', fileMatch[2]), fileName: fileMatch[1] }
  if (line.startsWith('- ')) return newBlock('bulleted', line.slice(2))
  if (/^\d+\.\s/.test(line)) return newBlock('numbered', line.replace(/^\d+\.\s/, ''))
  if (line.startsWith('> ')) return newBlock('quote', line.slice(2))
  if (line.trim() === '---') return newBlock('divider', '')
  return newBlock('paragraph', line)
}

function escapeValue(str) {
  return String(str ?? '').replace(/"/g, '\\"')
}

function stringifyFrontmatter(fields) {
  const lines = [FRONTMATTER_DELIM]
  lines.push(`id: "${escapeValue(fields.id)}"`)
  lines.push(`title: "${escapeValue(fields.title)}"`)
  lines.push(`updatedAt: ${fields.updatedAt}`)
  lines.push(`isPinned: ${fields.isPinned ? 'true' : 'false'}`)
  lines.push(`links: ${JSON.stringify(fields.links || [])}`)
  lines.push(FRONTMATTER_DELIM)
  return lines.join('\n')
}

function parseFrontmatter(raw) {
  const trimmed = (raw || '').replace(/^\uFEFF/, '')
  if (!trimmed.startsWith(FRONTMATTER_DELIM)) return { data: {}, content: trimmed }
  const endIndex = trimmed.indexOf(`\n${FRONTMATTER_DELIM}`, FRONTMATTER_DELIM.length)
  if (endIndex === -1) return { data: {}, content: trimmed }
  const frontmatterBlock = trimmed.slice(FRONTMATTER_DELIM.length, endIndex).trim()
  const content = trimmed.slice(endIndex + `\n${FRONTMATTER_DELIM}`.length).replace(/^\n+/, '')

  const data = {}
  frontmatterBlock.split('\n').forEach((line) => {
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
    if (!match) return
    const [, key, rawValue] = match
    let value = rawValue.trim()
    if (key === 'id' || key === 'title') {
      value = value.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"')
    } else if (key === 'updatedAt') {
      value = Number(value)
    } else if (key === 'isPinned') {
      value = value === 'true'
    } else if (key === 'links') {
      try { value = JSON.parse(value) } catch { value = [] }
    }
    data[key] = value
  })

  return { data, content }
}

export function noteToMarkdown(note) {
  const body = (note.blocks || []).map(blockToMarkdown).join('\n\n')
  const frontmatter = stringifyFrontmatter({
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt || Date.now(),
    isPinned: !!note.isPinned,
    links: note.links || [],
  })
  return `${frontmatter}\n\n${body}\n`
}

export function markdownToNote(raw) {
  const { data, content } = parseFrontmatter(raw)
  const lines = content.split('\n').filter((l) => l.trim() !== '')
  const blocks = lines.length > 0 ? lines.map(lineToBlock) : [newBlock('paragraph', '')]
  return {
    id: data.id,
    title: data.title || 'Untitled note',
    updatedAt: data.updatedAt || Date.now(),
    isPinned: !!data.isPinned,
    links: data.links || [],
    blocks,
    body: lines.join('\n'),
  }
}