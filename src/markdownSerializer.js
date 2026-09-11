import matter from 'gray-matter'
import { newBlock } from './noteBlocks'

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
  if (line.startsWith('- ')) return newBlock('bulleted', line.slice(2))
  if (/^\d+\.\s/.test(line)) return newBlock('numbered', line.replace(/^\d+\.\s/, ''))
  if (line.startsWith('> ')) return newBlock('quote', line.slice(2))
  if (line.trim() === '---') return newBlock('divider', '')
  return newBlock('paragraph', line)
}

export function noteToMarkdown(note) {
  const body = note.blocks.map(blockToMarkdown).join('\n\n')
  const frontmatter = {
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt,
    isPinned: !!note.isPinned,
    links: note.links || [],
  }
  return matter.stringify(body, frontmatter)
}

export function markdownToNote(raw) {
  const parsed = matter(raw)
  const lines = parsed.content.split('\n').filter((l) => l.trim() !== '')
  const blocks = lines.length > 0 ? lines.map(lineToBlock) : [newBlock('paragraph', '')]

  return {
    id: parsed.data.id,
    title: parsed.data.title || 'Untitled note',
    updatedAt: parsed.data.updatedAt || Date.now(),
    isPinned: !!parsed.data.isPinned,
    links: parsed.data.links || [],
    blocks,
    body: lines.join('\n'),
  }
}