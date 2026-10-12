import { useState } from 'react'
import api from './api'
import { toast, err } from './ui'

function ComplaintMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4M8 12h5M8 15h3M14.5 17.5l3.8-3.8 1.5 1.5-3.8 3.8-2 .5.5-2Z" />
    </svg>
  )
}

export default function Auth() {
  const [reg, setReg] = useState(false)
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const set = e => setF({ ...f, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast('Enter a valid email address', 'bad')
    if (f.password.length < 6) return toast('Password must be at least 6 characters', 'bad')
    if (reg && !f.name.trim()) return toast('Please enter your full name', 'bad')
    setBusy(true)
    try {
      if (reg) {
        await api.post('/students/register', { ...f, role: 'STUDENT' })
        toast('Registration successful. Please log in.')
        setReg(false)
      } else {
        const { data } = await api.post('/students/login', { email: f.email, password: f.password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, role: data.role, email: f.email }))
        location.href = '/'
      }
    } catch (x) {
      toast(err(x), 'bad')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="hero">
        <div>
          <div className="univ-title">Campus Portal · Student Affairs</div>
          <div className="brand" style={{ marginTop: 8 }}>
            <span className="logo"><ComplaintMark /></span>
            <span style={{ fontSize: 24, fontWeight: 800 }}>CampusVoice</span>
          </div>
        </div>

        <div>
          <h1>Report it.<br /><span style={{ color: '#A995FF' }}>Track it.</span><br />Resolve it.</h1>
          <p>
            Your campus concerns deserve action. Submit a complaint, follow its progress, and receive clear updates from the right department.
          </p>
        </div>

        <ul>
          <li>
            <i>✦</i>
            <span><b>Submit concerns securely:</b> Send every complaint to the right campus team.</span>
          </li>
          <li>
            <i>✦</i>
            <span><b>Track every update:</b> Follow progress from submission to resolution.</span>
          </li>
          <li>
            <i>✦</i>
            <span><b>Get accountable action:</b> Receive clear responses from campus administrators.</span>
          </li>
        </ul>
      </section>

      <section className="form">
        <form className="card" onSubmit={submit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="logo" style={{ width: 32, height: 32 }}><ComplaintMark size={19} /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>{reg ? 'Student Registration' : 'Institutional Sign In'}</h2>
              <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                {reg ? 'Create your official student grievance account' : 'Access your complaint dashboard and updates.'}
              </p>
            </div>
          </div>

          {reg && (
            <>
              <label>Full Name</label>
              <input
                name="name"
                value={f.name}
                onChange={set}
                placeholder="Student Full Name (as per ID)"
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            name="email"
            type="email"
            value={f.email}
            onChange={set}
            placeholder="student@college.edu or admin@college.edu"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={f.password}
            onChange={set}
            placeholder="••••••••"
            required
          />

          <button className="btn" style={{ width: '100%', marginTop: 22 }} disabled={busy}>
            {busy ? 'Verifying credentials…' : reg ? 'Create Student Account' : 'Sign in to dashboard →'}
          </button>

          <p className="mute" style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
            {reg ? 'Already have an account?' : 'Need to report an issue?'}{' '}
            <a
              href="#"
              onClick={e => {
                e.preventDefault()
                setReg(!reg)
              }}
              style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}
            >
              {reg ? 'Sign In' : 'Register as a student'}
            </a>
          </p>

        </form>
      </section>
    </div>
  )
}
