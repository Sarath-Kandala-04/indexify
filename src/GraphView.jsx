import { useEffect, useMemo, useRef, useState } from 'react'
import { Waypoints } from 'lucide-react'
import { useData } from './DataContext'
import { buildGraphData, TYPE_COLOR_VAR } from './buildGraphData'
import { computeLayout } from './graphLayout'

const TYPE_TAB = { note: 'notes', todo: 'todos', expense: 'expenses', subscription: 'subscriptions' }

function readCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function GraphView({ goTo }) {
  const { notes, todos, expenses, subscriptions } = useData()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [hoveredId, setHoveredId] = useState(null)
  const [positions, setPositions] = useState([])

  const { nodes, edges } = useMemo(
    () => buildGraphData({ notes, todos, expenses, subscriptions }),
    [notes, todos, expenses, subscriptions]
  )

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions([])
      return
    }
    const laidOut = computeLayout(nodes, edges, size.width, size.height)
    setPositions(laidOut)
  }, [nodes, edges, size.width, size.height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size.width, size.height)

    const lineColor = readCssVar('--line')
    const textColor = readCssVar('--text-dim')
    const byId = new Map(positions.map((n) => [n.id, n]))

    // Edges first, so nodes draw on top
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    edges.forEach((e) => {
      const a = byId.get(e.source)
      const b = byId.get(e.target)
      if (!a || !b) return
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    })

    // Nodes
    positions.forEach((n) => {
      const color = readCssVar(TYPE_COLOR_VAR[n.type]) || readCssVar('--accent')
      const isHovered = n.id === hoveredId
      ctx.beginPath()
      ctx.arc(n.x, n.y, isHovered ? 8 : 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      if (isHovered) {
        ctx.fillStyle = textColor
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText(n.label, n.x + 12, n.y + 4)
      }
    })
  }, [positions, edges, size, hoveredId])

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = positions.find((n) => Math.hypot(n.x - mx, n.y - my) < 10)
    setHoveredId(hit ? hit.id : null)
  }

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = positions.find((n) => Math.hypot(n.x - mx, n.y - my) < 10)
    if (!hit) return
    if (hit.refType === 'note') {
      goTo(TYPE_TAB[hit.refType], { type: 'open-note', itemId: hit.refId })
    } else {
      goTo(TYPE_TAB[hit.refType], { type: `highlight-${hit.refType}`, itemId: hit.refId })
    }
  }

  return (
    <div className="h-full flex flex-col px-8 pt-20 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Waypoints size={20} color="var(--accent)" /> Graph
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Visualizing links between your Notes, To-dos, Expenses, and Subscriptions.
          </p>
        </div>

        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-teal)' }} /> Notes</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-blue)' }} /> To-dos</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-orange)' }} /> Expenses</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-purple)' }} /> Subscriptions</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 rounded-lg overflow-hidden relative"
        style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
      >
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <Waypoints size={28} className="mb-2" color="var(--text-dim)" />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Nothing linked yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              Link items from any Note, To-do, Expense, or Subscription to see them appear here.
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            style={{ cursor: hoveredId ? 'pointer' : 'default' }}
          />
        )}
      </div>
    </div>
  )
}