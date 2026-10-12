import { useEffect, useState, useCallback } from 'react'
import api from './api'
import { Shell, Modal, Badge, Empty, toast, fmt, err, AttachmentViewer, FilePicker, uploadFile, Icons } from './ui'

const FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'WITHDRAWN']

function NewComplaint({ meta, onClose, onDone }) {
  const [f, setF] = useState({
    categoryId: meta.c[0]?.id || '',
    departmentId: '',
    priority: 'MEDIUM',
    subject: '',
    description: ''
  })
  const [attachedFile, setAttachedFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = e => setF({ ...f, [e.target.name]: e.target.value })

  async function go(e) {
    e.preventDefault()
    if (f.subject.trim().length < 5) return toast('Subject needs at least 5 characters', 'bad')
    if (f.description.trim().length < 20) return toast('Please describe the issue in at least 20 characters', 'bad')
    setBusy(true)
    try {
      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null

      if (attachedFile) {
        toast('Uploading attached file…')
        const up = await uploadFile(attachedFile)
        attachmentUrl = up.url
        attachmentName = up.name
        attachmentType = up.type
      }

      await api.post('/complaints', {
        ...f,
        categoryId: f.categoryId ? +f.categoryId : null,
        departmentId: f.departmentId ? +f.departmentId : null,
        attachmentUrl,
        attachmentName,
        attachmentType
      })
      toast('Grievance submitted successfully')
      onDone()
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Submit New Grievance" onClose={onClose}>
      <form onSubmit={go}>
        <div className="g2">
          <div>
            <label>Complaint Category</label>
            <select name="categoryId" value={f.categoryId} onChange={set}>
              {meta.c.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Urgency / Priority</label>
            <select name="priority" value={f.priority} onChange={set}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>

        <label>Concerned Department (Optional)</label>
        <select name="departmentId" value={f.departmentId} onChange={set}>
          <option value="">Awaiting Department Routing (Admin will assign)</option>
          {meta.d.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <label>Subject / Brief Summary</label>
        <input
          name="subject"
          maxLength={120}
          value={f.subject}
          onChange={set}
          placeholder="Brief summary of the grievance (e.g. Broken bench in Block B Room 302)"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Detailed Description</label>
          <span className="mute" style={{ fontSize: 11.5 }}>{f.description.length}/2000 chars</span>
        </div>
        <textarea
          name="description"
          maxLength={2000}
          value={f.description}
          onChange={set}
          placeholder="Please describe the issue in detail (location, time, how long it has been occurring, specific details)..."
        />

        {/* Optional Image, Video, or Document Attachment */}
        <FilePicker
          file={attachedFile}
          onSelect={setAttachedFile}
          onRemove={() => setAttachedFile(null)}
          label="Attach Photo, Video or Document (Optional)"
        />

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn accent" disabled={busy}>
            {busy ? 'Submitting Grievance…' : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Detail({ c, onClose, onChange }) {
  const [res, setRes] = useState([])
  const [wd, setWd] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/complaints/${c.id}/responses` || '')
      .then(r => setRes(r.data))
      .catch(() => {})
  }, [c.id])

  const idx = FLOW.indexOf(c.status)
  const canWd = c.status === 'OPEN' || c.status === 'IN_PROGRESS'

  async function withdraw() {
    if (reason.trim().length < 10) return toast('Please provide a withdrawal reason (at least 10 characters)', 'bad')
    setBusy(true)
    try {
      await api.put(`/complaints/${c.id}/withdraw`, { reason })
      toast('Grievance withdrawn')
      onChange()
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Grievance #${c.id} · ${c.subject}`} onClose={onClose} wide>
      <div className="row" style={{ marginBottom: 14 }}>
        <Badge v={c.status} />
        <Badge v={c.priority} />
        <span className="mute">
          Category: <b>{c.category?.name || 'General'}</b> · Department: <b>{c.department?.name || 'Awaiting Routing'}</b> · Raised: {fmt(c.createdAt)}
        </span>
      </div>

      {c.status === 'WITHDRAWN' ? (
        <div className="note">
          <b>Withdrawn on {fmt(c.withdrawnAt)}</b>
          <br />
          Reason: {c.withdrawReason}
        </div>
      ) : (
        <div className="steps">
          {FLOW.map((s, i) => (
            <div key={s} className={'st' + (i <= idx ? ' done' : '')}>
              <i>{i <= idx ? '✓' : i + 1}</i>
              {s.replace('_', ' ')}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ background: '#FAFCFE', padding: 18, margin: '14px 0' }}>
        <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mute)', marginBottom: 8 }}>
          Student Statement
        </h4>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 14, lineHeight: 1.6 }}>{c.description}</p>

        {/* Student's Uploaded Attachment (Image, Video, or Doc) */}
        {c.attachmentUrl && (
          <AttachmentViewer
            url={c.attachmentUrl}
            name={c.attachmentName}
            type={c.attachmentType}
          />
        )}
      </div>

      {/* Official Administrative Feedback Display */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, color: 'var(--pri)' }}>Official Administrative Feedback &amp; Action Taken</h3>
          <span className="mute" style={{ fontSize: 12 }}>Verified College Response</span>
        </div>

        {res.length ? (
          res.map(r => (
            <div key={r.id} className="feedback-box active">
              <div className="feedback-header">
                <div className="feedback-author">
                  <span className="official-tag">Official Feedback</span>
                  <span>{r.respondedBy || 'College Administration'}</span>
                </div>
                <span className="mute" style={{ fontSize: 12 }}>{fmt(r.createdAt)}</span>
              </div>
              <div className="feedback-content">{r.message}</div>

              {/* Admin's Uploaded Attachment (Proof Image/Video/Doc) */}
              {r.attachmentUrl && (
                <AttachmentViewer
                  url={r.attachmentUrl}
                  name={r.attachmentName}
                  type={r.attachmentType}
                />
              )}
            </div>
          ))
        ) : (
          <div className="card" style={{ background: '#F8FAFC', padding: 22, textAlign: 'center', color: 'var(--mute)' }}>
            <p style={{ margin: 0, fontSize: 13.5 }}>
              ⏳ <b>Under Review</b> — Administrative feedback has not been published yet. You will see official departmental updates and resolution remarks here once reviewed.
            </p>
          </div>
        )}
      </div>

      {canWd && !wd && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <button className="btn ghost sm" style={{ color: 'var(--bad)', borderColor: 'var(--line-strong)' }} onClick={() => setWd(true)}>
            <Icons.Trash />
            <span>Withdraw this grievance</span>
          </button>
        </div>
      )}

      {wd && (
        <div className="card" style={{ marginTop: 18, borderColor: 'var(--bad)', background: '#FFFDFD' }}>
          <b style={{ color: 'var(--bad)', display: 'block', marginBottom: 6 }}>
            Confirm Grievance Withdrawal
          </b>
          <p className="mute" style={{ margin: '0 0 10px', fontSize: 13 }}>
            Please state why you are withdrawing this issue (e.g. resolved independently, raised by mistake):
          </p>
          <textarea
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for withdrawal (minimum 10 characters)..."
          />
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="btn ghost sm" onClick={() => setWd(false)}>Cancel</button>
            <button className="btn bad sm" disabled={busy} onClick={withdraw}>
              {busy ? 'Withdrawing…' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function Student({ user }) {
  const [list, setList] = useState(null)
  const [meta, setMeta] = useState({ c: [], d: [] })
  const [f, setF] = useState('ALL')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [nw, setNw] = useState(false)
  const [tab, setTab] = useState('mine')

  const load = useCallback(() =>
    api.get('/complaints/mine')
      .then(r => setList(r.data.sort((a, b) => b.id - a.id)))
      .catch(e => toast(err(e), 'bad')),
  [])

  useEffect(() => {
    load()
    Promise.all([api.get('/departments'), api.get('/complaint-categories')])
      .then(([d, c]) => setMeta({ d: d.data, c: c.data }))
      .catch(() => {})
  }, [load])

  const L = list || []
  const n = s => L.filter(c => c.status === s).length

  // Filter complaints based on status and search query
  const shown = L.filter(c => {
    if (f === 'RESOLVED') {
      if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') return false
    } else if (f !== 'ALL') {
      if (c.status !== f) return false
    }
    if (q.trim()) {
      const qLower = q.toLowerCase()
      const searchBlob = (
        (c.subject || '') + ' ' + (c.description || '') + ' #' + c.id + ' ' + (c.category?.name || '')
      ).toLowerCase()
      if (!searchBlob.includes(qLower)) return false
    }
    return true
  })

  const STAT_CARDS = [
    { key: 'ALL', label: 'Total Submitted', count: L.length, color: '#0F1D38' },
    { key: 'OPEN', label: 'Open', count: n('OPEN'), color: '#2563EB' },
    { key: 'IN_PROGRESS', label: 'In Progress', count: n('IN_PROGRESS'), color: '#D97706' },
    { key: 'RESOLVED', label: 'Resolved / Closed', count: n('RESOLVED') + n('CLOSED'), color: '#059669' },
    { key: 'WITHDRAWN', label: 'Withdrawn', count: n('WITHDRAWN'), color: '#DC2626' }
  ]

  const done = () => {
    setNw(false)
    setSel(null)
    load()
  }

  const activeCardObj = STAT_CARDS.find(c => c.key === f)

  return (
    <Shell user={user} tabs={[['mine', 'My Grievances']]} tab={tab} setTab={setTab}>
      <div className="head">
        <div>
          <h2>Welcome, {user.name.split(' ')[0]}</h2>
          <p className="mute">Click any status card below to filter your grievances instantly.</p>
        </div>
        <button className="btn accent" onClick={() => setNw(true)}>
          <span>+ Raise New Grievance</span>
        </button>
      </div>

      {/* Interactive Clickable Stat Cards for Student */}
      <div className="stats">
        {STAT_CARDS.map(card => {
          const isActive = f === card.key
          return (
            <div
              key={card.key}
              className={`card stat clickable ${isActive ? 'active' : ''}`}
              style={{ '--c': card.color }}
              onClick={() => setF(card.key)}
              title={`Click to show only ${card.label}`}
            >
              <b>{card.count}</b>
              <span className="mute">{card.label}</span>
            </div>
          )
        })}
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 10 }}>
        <div className="chips grow">
          {FILTERS.map(x => (
            <button
              key={x}
              className={'chip' + (f === x ? ' on' : '')}
              onClick={() => setF(x)}
            >
              {x === 'RESOLVED' ? 'Resolved / Closed' : x.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <input
            style={{ paddingLeft: 34, paddingRight: q ? 30 : 12 }}
            placeholder="Search my grievances…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--mute)', pointerEvents: 'none' }}>
            <Icons.Search />
          </span>
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--mute)',
                fontSize: 14
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Notification Bar */}
      {f !== 'ALL' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#F0F4FA',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-sm)',
          marginBottom: 14,
          fontSize: 13
        }}>
          <span style={{ color: 'var(--pri)', fontWeight: 600 }}>
            Filtering: <b>{activeCardObj?.label || f}</b> ({shown.length} grievance{shown.length === 1 ? '' : 's'})
          </span>
          <button
            className="btn ghost sm"
            style={{ padding: '2px 8px', fontSize: 11.5 }}
            onClick={() => setF('ALL')}
          >
            Show All
          </button>
        </div>
      )}

      {list === null ? (
        <p className="mute">Loading grievances…</p>
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty
            icon="📭"
            text={L.length ? `No grievances match "${activeCardObj?.label || f}".` : 'You have not raised any grievances yet. Click "+ Raise New Grievance" above to submit one.'}
          />
        </div>
      ) : (
        <div className="list">
          {shown.map(c => (
            <div key={c.id} className="card item" onClick={() => setSel(c)}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: 'var(--pri)', fontFamily: 'monospace', fontSize: 13 }}>
                      #{c.id}
                    </span>
                    <b style={{ fontSize: 15, color: 'var(--pri)' }}>
                      {c.subject}
                    </b>
                    {c.attachmentUrl && (
                      <span title="Contains file attachment" style={{ color: 'var(--info)' }}>
                        <Icons.Paperclip />
                      </span>
                    )}
                  </div>
                  <p className="mute" style={{ margin: '8px 0 0', fontSize: 13 }}>
                    Category: <b>{c.category?.name || 'General'}</b> · Department: <b>{c.department?.name || 'Awaiting Routing'}</b> · Submitted: {fmt(c.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge v={c.priority} />
                  <Badge v={c.status} />
                  <span className="btn ghost sm" style={{ padding: '4px 8px', fontSize: 12, marginLeft: 6 }}>
                    View →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {nw && <NewComplaint meta={meta} onClose={() => setNw(false)} onDone={done} />}
      {sel && <Detail c={sel} onClose={() => setSel(null)} onChange={done} />}
    </Shell>
  )
}
