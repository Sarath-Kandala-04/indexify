import matter from 'gray-matter'
import { newBlock } from './noteBlocks'

// Block -> one Markdown line/section
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
  if (line.startsWith('### ')) return newBlockWith('heading3', line.slice(4))
  if (line.startsWith('## ')) return newBlockWith('heading2', line.slice(3))
  if (line.startsWith('# ')) return newBlockWith('heading1', line.slice(2))
  if (/^- \[[ xX]\] /.test(line)) {
    const checked = /^- \[[xX]\]/.test(line)
    return { ...newBlock('todo', line.replace(/^- \[[ xX]\] /, '')), checked }
  }
  if (line.startsWith('- ')) return newBlockWith('bulleted', line.slice(2))
  if (/^\d+\.\s/.test(line)) return newBlockWith('numbered', line.replace(/^\d+\.\s/, ''))
  if (line.startsWith('> ')) return newBlockWith('quote', line.slice(2))
  if (line.trim() === '---') return newBlockWith('divider', '')
  return newBlockWith('paragraph', line)
}

function newBlockWith(type, text) {
  return newBlock(type, text)
}

export function noteToMarkdown(note) {
  const body = note.blocks.map(blockToMarkdown).join('\n\n')
  const frontmatter = {
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt,
    isPinned: !!note.isPinned,
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
    blocks,
    body: lines.join('\n'),
  }
}