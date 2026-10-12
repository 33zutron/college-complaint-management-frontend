import { useState, useEffect } from 'react'
import api from './api'

function ComplaintMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4M8 12h5M8 15h3M14.5 17.5l3.8-3.8 1.5 1.5-3.8 3.8-2 .5.5-2Z" />
    </svg>
  )
}

let push = () => {}
export const toast = (m, t = 'ok') => push({ m, t, id: Math.random() })

export function Toasts() {
  const [l, s] = useState([])
  useEffect(() => {
    push = x => {
      s(a => [...a, x])
      setTimeout(() => s(a => a.filter(i => i !== x)), 3500)
    }
  }, [])
  return (
    <div className="toasts">
      {l.map(x => (
        <div key={x.id} className={'toast ' + x.t}>
          <span>{x.t === 'bad' ? '⚠️' : '✓'}</span>
          <span>{x.m}</span>
        </div>
      ))}
    </div>
  )
}

// Clean SVG Icons for modern visual polish
export const Icons = {
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  Paperclip: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
  ),
  Upload: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Shield: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

export const Badge = ({ v }) => <span className={'badge ' + (v || '')}>{(v || '').replace('_', ' ')}</span>

export const fmt = d => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—')

export const err = e => {
  const d = e?.response?.data
  if (typeof d === 'string') return d
  if (d?.message) return d.message
  if (d && !d.status && !d.error) return Object.values(d).join(', ')
  return e?.response ? 'Request failed' : 'Cannot reach the server'
}

export const logout = () => {
  localStorage.clear()
  location.href = '/'
}

export const fileUrl = url => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://localhost:8080${url}`
}

export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data // { url, name, type }
}

export function AttachmentViewer({ url, name, type }) {
  if (!url) return null
  const full = fileUrl(url)
  const isImg = (type && type.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name || url)
  const isVid = (type && type.startsWith('video/')) || /\.(mp4|webm|mov|mkv)$/i.test(name || url)

  return (
    <div className="attachment-card" style={{
      marginTop: 14,
      padding: '12px 14px',
      background: '#FFFFFF',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--sh-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pri)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--info)' }}><Icons.Paperclip /></span>
          <span>Attached {isImg ? 'Photo' : isVid ? 'Video' : 'Document'}:</span>
          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{name || 'Attachment'}</span>
        </span>
        <a
          href={full}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="btn ghost sm"
          style={{ fontSize: 12, padding: '4px 10px' }}
        >
          View Full Size ↗
        </a>
      </div>

      {isImg && (
        <div style={{ textAlign: 'center', background: '#F8FAFC', padding: 10, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
          <a href={full} target="_blank" rel="noopener noreferrer">
            <img
              src={full}
              alt={name || 'Attachment preview'}
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                objectFit: 'contain',
                borderRadius: 'var(--r-sm)',
                display: 'inline-block',
                boxShadow: 'var(--sh-xs)'
              }}
            />
          </a>
        </div>
      )}

      {isVid && (
        <div style={{ background: '#0F172A', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
          <video
            src={full}
            controls
            style={{ width: '100%', maxHeight: 300, display: 'block' }}
          >
            Your browser does not support the video player.
          </video>
        </div>
      )}

      {!isImg && !isVid && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 26 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name || 'Document File'}
            </div>
            <div className="mute" style={{ fontSize: 11.5 }}>Click "View Full Size" above to download or open this document</div>
          </div>
        </div>
      )}
    </div>
  )
}

export function FilePicker({ file, onSelect, onRemove, label = 'Attach image, video or document (Optional)' }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    if (file.type && file.type.startsWith('image/')) {
      const u = URL.createObjectURL(file)
      setPreview(u)
      return () => URL.revokeObjectURL(u)
    } else {
      setPreview(null)
    }
  }, [file])

  return (
    <div style={{ margin: '14px 0' }}>
      <label style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--ink-secondary)' }}>
        {label}
      </label>

      {!file ? (
        <div style={{
          border: '1px dashed var(--line-strong)',
          borderRadius: 'var(--r-md)',
          padding: '14px 18px',
          background: '#FAFCFE',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          transition: 'all 0.15s ease'
        }}>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])}
          />
          <label
            htmlFor="fileInput"
            className="btn ghost sm"
            style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icons.Upload />
            <span>Select File</span>
          </label>
          <span className="mute" style={{ fontSize: 12.5 }}>
            Photos, inspection videos, or PDF/DOC reports (up to 50MB)
          </span>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: '#F0F4FA',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-sm)'
        }}>
          {preview ? (
            <img
              src={preview}
              alt="Thumbnail"
              style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}
            />
          ) : (
            <span style={{ fontSize: 24 }}>
              {file.type?.startsWith('video/') ? '🎥' : '📄'}
            </span>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </b>
            <span className="mute" style={{ fontSize: 11.5 }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || 'File'}
            </span>
          </div>

          <button
            type="button"
            className="btn ghost sm"
            style={{ color: 'var(--bad)', borderColor: 'var(--line-strong)' }}
            onClick={onRemove}
          >
            Remove ✕
          </button>
        </div>
      )}
    </div>
  )
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={'modal' + (wide ? ' wide' : '')} onMouseDown={e => e.stopPropagation()}>
        <div className="mh">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Shell({ user, tabs, tab, setTab, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeLabel = tabs.find(([k]) => k === tab)?.[1] || 'Dashboard'

  const go = k => {
    setTab(k)
    setMenuOpen(false)
  }

  return (
    <div className={'app-shell' + (menuOpen ? ' menu-open' : '')}>
      <header className="top">
        <div className="in">
          <button className="menu-toggle" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
            <span /> <span /> <span />
          </button>
          <div className="brand-wrapper">
            <div className="brand">
              <span className="logo"><ComplaintMark /></span>
              <span>CampusVoice</span>
            </div>
            <span className="sub-brand">Student Grievance &amp; Complaint Portal</span>
          </div>

          <nav className="tabs desktop-tabs">
            {tabs.map(([k, l]) => (
              <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => go(k)}>
                {l}
              </button>
            ))}
          </nav>

          <div className="me">
            <div className="me-info">
              <b>{user.name}</b>
              <div className="role-tag">{user.role === 'ADMIN' ? 'College Admin' : 'Student'}</div>
            </div>
            <div className="av">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
            <button className="btn ghost sm" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </header>
      <aside className="side-menu" aria-label={`${user.role === 'ADMIN' ? 'Admin' : 'Student'} navigation`}>
        <div className="side-heading">
          <span className="eyebrow">Workspace</span>
          <strong>{user.role === 'ADMIN' ? 'Admin console' : 'Student portal'}</strong>
        </div>
        <div className="side-links">
          {tabs.map(([k, l], i) => (
            <button key={k} className={'side-link' + (tab === k ? ' active' : '')} onClick={() => go(k)}>
              <span className="side-number">{String(i + 1).padStart(2, '0')}</span>
              <span>{l}</span>
              {tab === k && <span className="side-arrow">→</span>}
            </button>
          ))}
        </div>
        <div className="side-footer">
          <span className="status-dot" /> All systems operational
        </div>
      </aside>
      {menuOpen && <button className="menu-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <section className="workspace">
        <div className="mobile-page-label"><span>{activeLabel}</span><span className="eyebrow">{user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'}</span></div>
        <main>{children}</main>
      </section>
    </div>
  )
}

export const Empty = ({ icon, text }) => (
  <div className="empty">
    <div className="big">{icon}</div>
    <p>{text}</p>
  </div>
)
