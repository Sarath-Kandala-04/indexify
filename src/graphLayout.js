// Minimal force-directed layout: nodes repel each other, links pull connected
// nodes together, everything is lightly pulled toward center. Runs a fixed
// number of iterations then stops — no need for a live physics loop since
// the graph is static once laid out.

export function computeLayout(nodes, edges, width, height) {
  const positioned = nodes.map((n) => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * 200,
    y: height / 2 + (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
  }))

  const byId = new Map(positioned.map((n) => [n.id, n]))
  const REPEL = 1800
  const LINK_DIST = 110
  const LINK_STRENGTH = 0.02
  const CENTER_STRENGTH = 0.01
  const ITERATIONS = 220

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between every pair of nodes
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i]
        const b = positioned[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let distSq = dx * dx + dy * dy || 0.01
        const force = REPEL / distSq
        const dist = Math.sqrt(distSq)
        dx = (dx / dist) * force
        dy = (dy / dist) * force
        a.vx += dx
        a.vy += dy
        b.vx -= dx
        b.vy -= dy
      }
    }

    // Attraction along edges
    edges.forEach((e) => {
      const a = byId.get(e.source)
      const b = byId.get(e.target)
      if (!a || !b) return
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const diff = (dist - LINK_DIST) * LINK_STRENGTH
      const fx = (dx / dist) * diff
      const fy = (dy / dist) * diff
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    })

    // Pull toward center + apply velocity with damping
    positioned.forEach((n) => {
      n.vx += (width / 2 - n.x) * CENTER_STRENGTH
      n.vy += (height / 2 - n.y) * CENTER_STRENGTH
      n.x += n.vx
      n.y += n.vy
      n.vx *= 0.85
      n.vy *= 0.85
      n.x = Math.max(30, Math.min(width - 30, n.x))
      n.y = Math.max(30, Math.min(height - 30, n.y))
    })
  }

  return positioned
}