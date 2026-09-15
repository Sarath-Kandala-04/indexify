function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export const BLOCK_TYPES = {
  paragraph: { label: 'Text' },
  heading1: { label: 'Heading 1' },
  heading2: { label: 'Heading 2' },
  heading3: { label: 'Heading 3' },
  bulleted: { label: 'Bullet List' },
  numbered: { label: 'Numbered List' },
  todo: { label: 'To-do' },
  quote: { label: 'Quote' },
  divider: { label: 'Divider' },
}

export function newBlock(type = 'paragraph', text = '') {
  return { id: uid(), type, text, checked: false }
}

export function ensureBlocks(note) {
  if (Array.isArray(note.blocks) && note.blocks.length > 0) return note.blocks
  return [newBlock('paragraph', note.body || '')]
}

export function blocksToPlainText(blocks) {
  return blocks.map((b) => b.text || '').join('\n')
}