import { useEffect, useState, useCallback } from 'react'
import api from './api'
import { Shell, Modal, Badge, Empty, toast, fmt, err, AttachmentViewer, FilePicker, uploadFile, Icons } from './ui'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function EditUserModal({ user, onClose, onSaved }) {
  const [f, setF] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'STUDENT',
    password: ''
  })
  const [busy, setBusy] = useState(false)
  const set = e => setF({ ...f, [e.target.name]: e.target.value })

  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return toast('Name cannot be empty', 'bad')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast('Enter a valid email address', 'bad')
    if (f.password && f.password.length < 6) return toast('Password must be at least 6 characters if changing', 'bad')

    setBusy(true)
    try {
      const payload = {
        name: f.name.trim(),
        email: f.email.trim(),
        role: f.role
      }
      if (f.password.trim()) {
        payload.password = f.password.trim()
      }

      await api.put(`/students/${user.id}`, payload)
      toast('User details updated successfully')
      onSaved()
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Edit User Details · ${user.name}`} onClose={onClose}>
      <form onSubmit={save}>
        <label>Full Name</label>
        <input name="name" value={f.name} onChange={set} required />

        <label>Email Address</label>
        <input name="email" type="email" value={f.email} onChange={set} required />

        <label>User Role</label>
        <select name="role" value={f.role} onChange={set}>
          <option value="STUDENT">STUDENT</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <label>
          Reset Password <span className="mute">(Optional: leave blank to keep current password)</span>
        </label>
        <input
          name="password"
          type="password"
          value={f.password}
          onChange={set}
          placeholder="Enter new password (optional)"
        />

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn accent" disabled={busy}>
            {busy ? 'Saving Changes…' : 'Save User Details'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Manage({ c, meta, user, onClose, onChange }) {
  const [f, setF] = useState({
    subject: c.subject,
    description: c.description,
    priority: c.priority,
    categoryId: c.category?.id || '',
    departmentId: c.department?.id || ''
  })
  const [status, setStatus] = useState(c.status)
  const [feedbackList, setFeedbackList] = useState([])
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState(
    c.status === 'OPEN' ? 'IN_PROGRESS' : c.status === 'WITHDRAWN' ? 'OPEN' : c.status
  )
  const [feedbackFile, setFeedbackFile] = useState(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

  const set = e => setF({ ...f, [e.target.name]: e.target.value })
  const wd = status === 'WITHDRAWN'

  const loadFeedback = () =>
    api.get(`/complaints/${c.id}/responses`)
      .then(r => setFeedbackList(r.data))
      .catch(() => {})

  useEffect(() => {
    loadFeedback()
  }, [c.id])

  async function saveDetails() {
    setSavingDetails(true)
    try {
      await api.put(`/complaints/${c.id}`, {
        ...f,
        categoryId: f.categoryId ? +f.categoryId : null,
        departmentId: f.departmentId ? +f.departmentId : null
      })
      if (status !== 'WITHDRAWN') {
        await api.put(`/complaints/${c.id}/status`, { status })
      }
      toast('Complaint details saved')
      onChange()
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setSavingDetails(false)
    }
  }

  async function del() {
    if (!confirm(`Permanently delete grievance #${c.id}? This cannot be undone.`)) return
    try {
      await api.delete(`/complaints/${c.id}`)
      toast('Grievance deleted')
      onClose()
      onChange()
    } catch (x) {
      toast(err(x), 'bad')
    }
  }

  async function sendFeedback(e) {
    if (e) e.preventDefault()
    const msg = feedbackText.trim()
    if (!msg) {
      return toast('Please enter feedback remarks for the student', 'bad')
    }
    setSubmittingFeedback(true)
    try {
      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null

      if (feedbackFile) {
        toast('Uploading attached proof…')
        const up = await uploadFile(feedbackFile)
        attachmentUrl = up.url
        attachmentName = up.name
        attachmentType = up.type
      }

      // 1. Post official feedback with optional attachment
      await api.post(`/complaints/${c.id}/responses`, {
        message: msg,
        respondedBy: `${user.name} (Administration)`,
        attachmentUrl,
        attachmentName,
        attachmentType
      })

      // 2. Unconditionally update complaint status to the selected feedbackStatus
      await api.put(`/complaints/${c.id}/status`, { status: feedbackStatus })
      setStatus(feedbackStatus)
      c.status = feedbackStatus

      setFeedbackText('')
      setFeedbackFile(null)
      toast(`Official feedback posted & status updated to ${feedbackStatus.replace('_', ' ')}`)
      loadFeedback()
      onChange()
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <Modal title={`Grievance Record #${c.id}`} onClose={onClose} wide>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="mute" style={{ margin: 0, fontSize: 13 }}>
          Submitted by: <b>{c.student?.name || 'Unknown Student'}</b> ({c.student?.email}) · Raised: {fmt(c.createdAt)}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge v={status} />
          <Badge v={f.priority} />
        </div>
      </div>

      {wd && (
        <div className="note">
          <b>Withdrawn by student on {fmt(c.withdrawnAt)}</b>
          <br />
          Reason: {c.withdrawReason}
        </div>
      )}

      {/* Complaint Details Card */}
      <div className="card" style={{ padding: 18, marginBottom: 20, background: '#FAFCFE' }}>
        <h4 style={{ marginBottom: 12, fontSize: 14.5, color: 'var(--pri)' }}>Grievance Information</h4>
        <label style={{ marginTop: 4 }}>Subject</label>
        <input name="subject" value={f.subject} onChange={set} />

        <label>Description</label>
        <textarea name="description" value={f.description} onChange={set} style={{ minHeight: 80 }} />

        {/* Display student's uploaded image, video or doc */}
        {c.attachmentUrl && (
          <AttachmentViewer
            url={c.attachmentUrl}
            name={c.attachmentName}
            type={c.attachmentType}
          />
        )}

        <div className="g2" style={{ marginTop: 12 }}>
          <div>
            <label>Current Status</label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value)
                setFeedbackStatus(e.target.value)
              }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              {wd && <option value="WITHDRAWN">WITHDRAWN</option>}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select name="priority" value={f.priority} onChange={set}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div>
            <label>Assigned Department</label>
            <select name="departmentId" value={f.departmentId} onChange={set}>
              <option value="">Unassigned</option>
              {meta.d.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select name="categoryId" value={f.categoryId} onChange={set}>
              <option value="">None</option>
              {meta.c.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="row" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <button className="btn" disabled={savingDetails} onClick={saveDetails}>
            {savingDetails ? 'Saving…' : 'Save Details'}
          </button>
          {status !== 'RESOLVED' && (
            <button
              className="btn ghost"
              onClick={async () => {
                setStatus('RESOLVED')
                setFeedbackStatus('RESOLVED')
                try {
                  await api.put(`/complaints/${c.id}/status`, { status: 'RESOLVED' })
                  c.status = 'RESOLVED'
                  toast('Marked as Resolved')
                  onChange()
                } catch (x) {
                  toast(err(x), 'bad')
                }
              }}
            >
              <Icons.Check />
              <span>Mark as Resolved</span>
            </button>
          )}
          <span className="grow" />
          <button className="btn bad sm" onClick={del}>
            <Icons.Trash />
            <span>Delete Grievance</span>
          </button>
        </div>
      </div>

      {/* Official Administrative Feedback Section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <h3 style={{ fontSize: 16, color: 'var(--pri)' }}>Official Administrative Feedback</h3>
          <span className="mute" style={{ fontSize: 12 }}>Published directly to student</span>
        </div>
        <p className="mute" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Provide official remarks, verification details, or action taken. The status chosen below will be applied upon publishing.
        </p>

        {/* Feedback Input Form */}
        <div className="card" style={{ border: '1px solid var(--line-strong)', padding: 18, background: '#FFFFFF' }}>
          <label style={{ margin: '0 0 8px', color: 'var(--pri)', fontWeight: 700 }}>
            Send Feedback to Student
          </label>
          <textarea
            style={{ minHeight: 90 }}
            placeholder="Type official administrative feedback (e.g. 'Facility inspected and maintenance completed. See attached photo for verification.')..."
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
          />

          {/* Optional Admin Attachment (Image, Video, Document) */}
          <FilePicker
            file={feedbackFile}
            onSelect={setFeedbackFile}
            onRemove={() => setFeedbackFile(null)}
            label="Attach Photo, Video or Document Proof (Optional)"
          />

          <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pri)' }}>
                Set status upon feedback:
              </span>
              <select
                style={{ width: 'auto', padding: '7px 14px', fontSize: 13, fontWeight: 600, borderColor: 'var(--pri)' }}
                value={feedbackStatus}
                onChange={e => setFeedbackStatus(e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <button
              className="btn accent"
              disabled={submittingFeedback}
              onClick={sendFeedback}
            >
              <Icons.Shield />
              <span>{submittingFeedback ? 'Publishing…' : 'Publish Official Feedback'}</span>
            </button>
          </div>
        </div>

        {/* Existing Published Feedback History */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mute)', marginBottom: 10 }}>
            Published Feedback History ({feedbackList.length})
          </h4>

          {feedbackList.length > 0 ? (
            feedbackList.map(item => (
              <div key={item.id} className="feedback-box active">
                <div className="feedback-header">
                  <div className="feedback-author">
                    <span className="official-tag">Official Feedback</span>
                    <span>{item.respondedBy || 'Administrator'}</span>
                  </div>
                  <span className="mute" style={{ fontSize: 12 }}>{fmt(item.createdAt)}</span>
                </div>
                <div className="feedback-content">{item.message}</div>

                {/* Feedback Attachment */}
                {item.attachmentUrl && (
                  <AttachmentViewer
                    url={item.attachmentUrl}
                    name={item.attachmentName}
                    type={item.attachmentType}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--mute)', background: '#F8FAFC' }}>
              No feedback published for this complaint yet. Write feedback above to notify the student.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Crud({ title, path }) {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [ed, setEd] = useState(null)

  const load = () => api.get(path).then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  const run = async (fn, ok) => {
    try {
      await fn()
      toast(ok)
      load()
    } catch (x) {
      toast(err(x), 'bad')
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, color: 'var(--pri)' }}>{title}</h3>
        <span className="badge LOW">{items.length} total</span>
      </div>

      <div className="row" style={{ margin: '14px 0' }}>
        <input
          className="grow"
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}…`}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && run(async () => {
            await api.post(path, { name: name.trim() })
            setName('')
          }, 'Added successfully')}
        />
        <button
          className="btn"
          onClick={() => name.trim() && run(async () => {
            await api.post(path, { name: name.trim() })
            setName('')
          }, 'Added successfully')}
        >
          Add
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--line)' }}>
        {items.map(i => (
          <div key={i.id} className="row" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            {ed?.id === i.id ? (
              <>
                <input className="grow" value={ed.name} onChange={e => setEd({ ...ed, name: e.target.value })} />
                <button className="btn sm" onClick={() => run(async () => { await api.put(`${path}/${i.id}`, { name: ed.name }); setEd(null) }, 'Saved')}>Save</button>
                <button className="btn ghost sm" onClick={() => setEd(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="grow" style={{ fontWeight: 600, color: 'var(--ink)' }}>{i.name}</span>
                <button className="btn ghost sm" onClick={() => setEd(i)}>
                  <Icons.Edit />
                  <span>Edit</span>
                </button>
                <button
                  className="btn ghost sm"
                  style={{ color: 'var(--bad)', borderColor: 'var(--line-strong)' }}
                  onClick={() => confirm(`Delete "${i.name}"?`) && run(() => api.delete(`${path}/${i.id}`), 'Deleted')}
                >
                  <Icons.Trash />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {!items.length && <p className="mute" style={{ textAlign: 'center', padding: 24 }}>No entries created yet.</p>}
    </div>
  )
}

function Users({ me }) {
  const [u, setU] = useState([])
  const [editUser, setEditUser] = useState(null)

  const load = () => api.get('/students').then(r => setU(r.data)).catch(e => toast(err(e), 'bad'))
  useEffect(() => { load() }, [])

  async function del(x) {
    if (!confirm(`Delete student record for ${x.name}?`)) return
    try {
      await api.delete(`/students/${x.id}`)
      toast('Student deleted')
      load()
    } catch (e) {
      toast('Cannot delete: user still has complaints registered', 'bad')
    }
  }

  return (
    <>
      <div className="card tw">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {u.map(x => (
              <tr key={x.id} style={{ cursor: 'default' }}>
                <td><b>{x.name}</b></td>
                <td>{x.email}</td>
                <td><Badge v={x.role} /></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn ghost sm"
                    style={{ marginRight: 8 }}
                    onClick={() => setEditUser(x)}
                  >
                    <Icons.Edit />
                    <span>Edit</span>
                  </button>
                  {x.id !== me.id && x.role !== 'ADMIN' && (
                    <button
                      className="btn ghost sm"
                      style={{ color: 'var(--bad)', borderColor: 'var(--line-strong)' }}
                      onClick={() => del(x)}
                    >
                      <Icons.Trash />
                      <span>Delete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null)
            load()
          }}
        />
      )}
    </>
  )
}

export default function Admin({ user }) {
  const [tab, setTab] = useState('complaints')
  const [list, setList] = useState(null)
  const [meta, setMeta] = useState({ c: [], d: [] })
  const [sel, setSel] = useState(null)
  const [f, setF] = useState({ s: 'ALL', p: 'ALL', q: '' })

  const load = useCallback(() =>
    api.get('/complaints')
      .then(r => setList(r.data.sort((a, b) => b.id - a.id)))
      .catch(e => toast(err(e), 'bad')),
  [])

  const loadMeta = () =>
    Promise.all([api.get('/departments'), api.get('/complaint-categories')])
      .then(([d, c]) => setMeta({ d: d.data, c: c.data }))

  useEffect(() => {
    load()
    loadMeta()
  }, [load, tab])

  const L = list || []
  const n = s => L.filter(c => c.status === s).length

  // Filter complaints based on status, priority, and search
  const shown = L.filter(c => {
    if (f.s === 'RESOLVED_CLOSED') {
      if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') return false
    } else if (f.s === 'HIGH_ACTIVE') {
      if (c.priority !== 'HIGH' || (c.status !== 'OPEN' && c.status !== 'IN_PROGRESS')) return false
    } else if (f.s !== 'ALL') {
      if (c.status !== f.s) return false
    }

    if (f.s !== 'HIGH_ACTIVE' && f.p !== 'ALL') {
      if (c.priority !== f.p) return false
    }

    if (f.q.trim()) {
      const qLower = f.q.toLowerCase()
      const searchBlob = (
        (c.subject || '') +
        ' ' + (c.student?.name || '') +
        ' ' + (c.description || '') +
        ' ' + (c.category?.name || '') +
        ' ' + (c.department?.name || '') +
        ' #' + c.id
      ).toLowerCase()
      if (!searchBlob.includes(qLower)) return false
    }

    return true
  })

  // Metric cards with clean labels and distinct accent colors
  const STAT_CARDS = [
    { key: 'ALL', label: 'Total Grievances', count: L.length, color: '#0F1D38' },
    { key: 'OPEN', label: 'Open Issues', count: n('OPEN'), color: '#2563EB' },
    { key: 'IN_PROGRESS', label: 'In Progress', count: n('IN_PROGRESS'), color: '#D97706' },
    { key: 'RESOLVED_CLOSED', label: 'Resolved / Closed', count: n('RESOLVED') + n('CLOSED'), color: '#059669' },
    { key: 'WITHDRAWN', label: 'Withdrawn', count: n('WITHDRAWN'), color: '#DC2626' },
    {
      key: 'HIGH_ACTIVE',
      label: 'High Priority Active',
      count: L.filter(c => c.priority === 'HIGH' && ['OPEN', 'IN_PROGRESS'].includes(c.status)).length,
      color: '#9E1B22'
    }
  ]

  const handleStatClick = key => {
    if (key === 'HIGH_ACTIVE') {
      setF(prev => ({ ...prev, s: 'HIGH_ACTIVE', p: 'HIGH' }))
    } else if (key === 'ALL') {
      setF(prev => ({ ...prev, s: 'ALL', p: 'ALL' }))
    } else {
      setF(prev => ({ ...prev, s: key, p: prev.p === 'HIGH' && prev.s === 'HIGH_ACTIVE' ? 'ALL' : prev.p }))
    }
  }

  const activeCardObj = STAT_CARDS.find(c => c.key === f.s)

  return (
    <Shell
      user={user}
      tabs={[
        ['complaints', 'Grievance Console'],
        ['setup', 'Departments & Categories'],
        ['users', 'User Accounts']
      ]}
      tab={tab}
      setTab={setTab}
    >
      {tab === 'complaints' && (
        <>
          <div className="head">
            <div>
              <h2>Administrative Grievance Console</h2>
              <p className="mute">Click any status card below to filter grievances instantly, or manage individual complaints.</p>
            </div>
            <button className="btn ghost" onClick={load}>
              <Icons.Refresh />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Interactive Clickable Stat Cards */}
          <div className="stats">
            {STAT_CARDS.map(card => {
              const isActive = f.s === card.key
              return (
                <div
                  key={card.key}
                  className={`card stat clickable ${isActive ? 'active' : ''}`}
                  style={{ '--c': card.color }}
                  onClick={() => handleStatClick(card.key)}
                  title={`Filter by: ${card.label}`}
                >
                  <b>{card.count}</b>
                  <span className="mute">{card.label}</span>
                </div>
              )
            })}
          </div>

          {/* Search, Filter Toolbar & Active Tag Banner */}
          <div className="row" style={{ marginBottom: 16, gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <input
                style={{ paddingLeft: 36, paddingRight: f.q ? 32 : 14 }}
                placeholder="Search grievances by subject, student name, department or ID…"
                value={f.q}
                onChange={e => setF({ ...f, q: e.target.value })}
              />
              <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--mute)', pointerEvents: 'none' }}>
                <Icons.Search />
              </span>
              {f.q && (
                <button
                  type="button"
                  onClick={() => setF({ ...f, q: '' })}
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

            <select
              style={{ width: 180 }}
              value={f.s}
              onChange={e => setF({ ...f, s: e.target.value })}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Issues</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED_CLOSED">Resolved / Closed</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="CLOSED">Closed Only</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="HIGH_ACTIVE">High Priority Active</option>
            </select>

            <select
              style={{ width: 160 }}
              value={f.p}
              onChange={e => setF({ ...f, p: e.target.value })}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            {(f.s !== 'ALL' || f.p !== 'ALL' || f.q) && (
              <button
                className="btn ghost sm"
                onClick={() => setF({ s: 'ALL', p: 'ALL', q: '' })}
                title="Reset all filters"
                style={{ height: 38 }}
              >
                Reset Filters ✕
              </button>
            )}
          </div>

          {/* Active Filter Summary Bar */}
          {f.s !== 'ALL' && (
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
                Filtering by: <b>{activeCardObj?.label || f.s}</b> · {shown.length} grievance{shown.length === 1 ? '' : 's'} found
              </span>
              <button
                className="btn ghost sm"
                style={{ padding: '2px 8px', fontSize: 11.5 }}
                onClick={() => setF({ ...f, s: 'ALL' })}
              >
                Show All
              </button>
            </div>
          )}

          <div className="card tw">
            {shown.length ? (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>#ID</th>
                    <th>Subject &amp; Category</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Raised On</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(c => (
                    <tr key={c.id} onClick={() => setSel(c)}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--pri)', fontFamily: 'monospace', fontSize: 13 }}>
                          #{c.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <b style={{ color: 'var(--pri)' }}>{c.subject}</b>
                          {c.attachmentUrl && (
                            <span title="Contains attachment" style={{ color: 'var(--info)' }}>
                              <Icons.Paperclip />
                            </span>
                          )}
                        </div>
                        <div className="mute" style={{ fontSize: 12 }}>{c.category?.name || 'General Category'}</div>
                      </td>
                      <td>{c.student?.name || '—'}</td>
                      <td>
                        {c.department?.name ? (
                          <span style={{ fontWeight: 500 }}>{c.department.name}</span>
                        ) : (
                          <span className="mute" style={{ fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td><Badge v={c.priority} /></td>
                      <td><Badge v={c.status} /></td>
                      <td className="mute" style={{ whiteSpace: 'nowrap' }}>{fmt(c.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="btn ghost sm" style={{ padding: '4px 10px', fontSize: 12 }}>
                          Manage →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty
                icon="📋"
                text={list ? `No grievances match "${activeCardObj?.label || f.s}".` : 'Loading grievances…'}
              />
            )}
          </div>
        </>
      )}

      {tab === 'setup' && (
        <>
          <div className="head">
            <div>
              <h2>Department &amp; Category Configuration</h2>
              <p className="mute">Manage college academic and operational departments and complaint categories.</p>
            </div>
          </div>
          <div className="g2">
            <Crud title="Departments" path="/departments" />
            <Crud title="Complaint Categories" path="/complaint-categories" />
          </div>
        </>
      )}

      {tab === 'users' && (
        <>
          <div className="head">
            <div>
              <h2>User Accounts Management</h2>
              <p className="mute">View and edit registered student and administrator profiles on the portal.</p>
            </div>
          </div>
          <Users me={user} />
        </>
      )}

      {sel && (
        <Manage
          c={sel}
          meta={meta}
          user={user}
          onClose={() => setSel(null)}
          onChange={() => {
            load()
          }}
        />
      )}
    </Shell>
  )
}
