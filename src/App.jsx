import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  ClipboardList,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import './App.css'
import {
  config,
  createTodo,
  createUserAccount,
  deleteTodo,
  getCurrentUser,
  hasAppwriteConfig,
  listTodos,
  signInWithEmail,
  signOutCurrentUser,
  updateTodo,
} from './lib/appwrite'

function App() {
  const [user, setUser] = useState(null)
  const [todos, setTodos] = useState([])
  const [taskTitle, setTaskTitle] = useState('')
  const [authMode, setAuthMode] = useState('signin')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [isBooting, setIsBooting] = useState(true)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isTodosLoading, setIsTodosLoading] = useState(false)

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos],
  )

  const activeTodos = todos.length - completedCount
  const isConfigured = hasAppwriteConfig()

  const loadTodos = useCallback(async (nextUser) => {
    if (!nextUser || !isConfigured) return

    setIsTodosLoading(true)
    setMessage('')

    try {
      const documents = await listTodos(nextUser.$id)
      setTodos(documents)
    } catch (error) {
      setMessage(error.message || 'Could not load your todos.')
    } finally {
      setIsTodosLoading(false)
    }
  }, [isConfigured])

  useEffect(() => {
    async function bootApp() {
      if (!isConfigured) {
        setIsBooting(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        await loadTodos(currentUser)
      } catch {
        setUser(null)
      } finally {
        setIsBooting(false)
      }
    }

    bootApp()
  }, [isConfigured, loadTodos])

  function updateAuthField(event) {
    const { name, value } = event.target
    setAuthForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setIsAuthLoading(true)
    setMessage('')

    try {
      if (authMode === 'signup') {
        await createUserAccount(authForm)
      } else {
        await signInWithEmail(authForm)
      }

      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setAuthForm({ name: '', email: '', password: '' })
      await loadTodos(currentUser)
    } catch (error) {
      setMessage(error.message || 'Authentication failed.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  async function handleSignOut() {
    setMessage('')

    try {
      await signOutCurrentUser()
      setUser(null)
      setTodos([])
    } catch (error) {
      setMessage(error.message || 'Could not sign out.')
    }
  }

  async function handleCreateTodo(event) {
    event.preventDefault()

    const title = taskTitle.trim()
    if (!title || !user) return

    setTaskTitle('')
    setMessage('')

    try {
      const newTodo = await createTodo({ title, userId: user.$id })
      setTodos((currentTodos) => [newTodo, ...currentTodos])
    } catch (error) {
      setTaskTitle(title)
      setMessage(error.message || 'Could not create todo.')
    }
  }

  async function handleToggleTodo(todo) {
    setMessage('')

    try {
      const updatedTodo = await updateTodo(todo.$id, {
        completed: !todo.completed,
      })

      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.$id === todo.$id ? updatedTodo : currentTodo,
        ),
      )
    } catch (error) {
      setMessage(error.message || 'Could not update todo.')
    }
  }

  async function handleDeleteTodo(todoId) {
    setMessage('')

    try {
      await deleteTodo(todoId)
      setTodos((currentTodos) =>
        currentTodos.filter((currentTodo) => currentTodo.$id !== todoId),
      )
    } catch (error) {
      setMessage(error.message || 'Could not delete todo.')
    }
  }

  if (isBooting) {
    return (
      <main className="app-shell loading-screen">
        <Loader2 className="spin" size={32} aria-hidden="true" />
        <p>Starting MissionControl...</p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="mission-panel">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <ClipboardList size={25} />
          </div>
          <div>
            <p className="eyebrow">MissionControl</p>
            <h1>Focus your day.</h1>
          </div>
        </div>

        {!isConfigured && (
          <div className="setup-alert" role="alert">
            Add your Appwrite credentials in <code>.env</code> using the keys
            from <code>.env.example</code>.
          </div>
        )}

        {message && (
          <div className="message" role="status">
            {message}
          </div>
        )}

        {!user ? (
          <form className="auth-card" onSubmit={handleAuthSubmit}>
            <div className="form-head">
              <h2>{authMode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
              <div className="mode-switch" aria-label="Authentication mode">
                <button
                  type="button"
                  className={authMode === 'signin' ? 'active' : ''}
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authMode === 'signup' ? 'active' : ''}
                  onClick={() => setAuthMode('signup')}
                >
                  Sign up
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  value={authForm.name}
                  onChange={updateAuthField}
                  minLength="2"
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={updateAuthField}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={updateAuthField}
                minLength="8"
                placeholder="At least 8 characters"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={!isConfigured || isAuthLoading}>
              {isAuthLoading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
              {authMode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        ) : (
          <section className="workspace" aria-label="Todo workspace">
            <div className="workspace-header">
              <div>
                <p className="eyebrow">Signed in as {user.name || user.email}</p>
                <h2>Your mission list</h2>
              </div>
              <button className="icon-button" type="button" onClick={handleSignOut} aria-label="Sign out">
                <LogOut size={19} />
              </button>
            </div>

            <div className="stats-grid" aria-label="Todo summary">
              <div>
                <span>{todos.length}</span>
                <p>Total</p>
              </div>
              <div>
                <span>{activeTodos}</span>
                <p>Active</p>
              </div>
              <div>
                <span>{completedCount}</span>
                <p>Done</p>
              </div>
            </div>

            <form className="todo-form" onSubmit={handleCreateTodo}>
              <input
                type="text"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Add a new mission..."
                required
              />
              <button className="primary-button compact" type="submit">
                <Plus size={18} />
                Add
              </button>
            </form>

            <div className="list-toolbar">
              <p>{isTodosLoading ? 'Syncing tasks...' : 'Synced with Appwrite'}</p>
              <button className="ghost-button" type="button" onClick={() => loadTodos(user)} disabled={isTodosLoading}>
                <RefreshCw className={isTodosLoading ? 'spin' : ''} size={17} />
                Refresh
              </button>
            </div>

            <div className="todo-list">
              {todos.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={34} />
                  <p>No missions yet. Add your first todo to begin.</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <article className={todo.completed ? 'todo-item done' : 'todo-item'} key={todo.$id}>
                    <button
                      className="check-button"
                      type="button"
                      onClick={() => handleToggleTodo(todo)}
                      aria-label={todo.completed ? 'Mark todo as active' : 'Mark todo as complete'}
                    >
                      {todo.completed && <Check size={15} />}
                    </button>
                    <p>{todo.title}</p>
                    <button
                      className="icon-button quiet"
                      type="button"
                      onClick={() => handleDeleteTodo(todo.$id)}
                      aria-label="Delete todo"
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <p className="config-note">
          Project: <code>{config.projectId || 'missing'}</code>
        </p>
      </section>
    </main>
  )
}

export default App
