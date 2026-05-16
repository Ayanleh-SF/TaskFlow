import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const STATUS_LABELS = {
  a_faire: "A faire",
  en_cours: "En cours",
  termine: "Termine",
};

const STATUS_META = {
  a_faire: {
    label: "A faire",
    shortLabel: "Todo",
    className: "status-todo",
  },
  en_cours: {
    label: "En cours",
    shortLabel: "Working on it",
    className: "status-working",
  },
  termine: {
    label: "Termine",
    shortLabel: "Done",
    className: "status-done",
  },
};

const GROUP_ORDER = ["en_cours", "a_faire", "termine"];
const PRIORITIES = ["Haute", "Moyenne", "Basse"];

function getTaskDate(task) {
  const value = task.due_date;
  if (!value) {
    return "Sans date";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getTaskTimestamp(task) {
  return task.due_date ? new Date(`${task.due_date}T00:00:00`).getTime() : null;
}

function getTaskOwner(task) {
  return task.owner || "Moi";
}

function getTaskPriority(task) {
  return task.priority || "Moyenne";
}

function getOwnerInitials(owner) {
  return owner
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ME";
}

function buildTaskPayload(taskData) {
  const payload = { ...taskData };

  if ("owner" in payload) {
    payload.owner = payload.owner.trim() || "Moi";
  }

  if ("due_date" in payload) {
    payload.due_date = payload.due_date || null;
  }

  return payload;
}

function getStoredSession() {
  return {
    access: localStorage.getItem("taskflow_access"),
    refresh: localStorage.getItem("taskflow_refresh"),
  };
}

function storeSession(tokens) {
  localStorage.setItem("taskflow_access", tokens.access);
  localStorage.setItem("taskflow_refresh", tokens.refresh);
}

function clearSession() {
  localStorage.removeItem("taskflow_access");
  localStorage.removeItem("taskflow_refresh");
}

function App() {
  const [session, setSession] = useState(getStoredSession);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(session.access));
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("workspace");

  const api = useMemo(() => {
    async function request(
      path,
      options = {},
      retry = true,
      accessToken = session.access,
    ) {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && retry && session.refresh) {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: session.refresh }),
        });

        if (refreshResponse.ok) {
          const tokens = await refreshResponse.json();
          storeSession(tokens);
          setSession(tokens);
          return request(path, options, false, tokens.access);
        }

        clearSession();
        setSession({ access: null, refresh: null });
        throw new Error("Session expiree");
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erreur API");
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    }

    return { request };
  }, [session]);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");
    try {
      const [me, myTasks] = await Promise.all([
        api.request("/users/me"),
        api.request("/tasks"),
      ]);
      setUser(me);
      setTasks(myTasks);
    } catch (error) {
      setMessage(error.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session.access) {
      loadDashboard();
    } else {
      setLoading(false);
      setUser(null);
      setTasks([]);
    }
  }, [session.access]);

  function handleLogin(tokens) {
    storeSession(tokens);
    setSession(tokens);
  }

  function handleLogout() {
    clearSession();
    setSession({ access: null, refresh: null });
    setUser(null);
    setTasks([]);
  }

  if (!session.access) {
    return <AuthScreen onLogin={handleLogin} message={message} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="brand-row">
          <span className="brand-mark">T</span>
          <strong>TaskFlow</strong>
        </div>
        <nav className="side-nav">
          <button
            className={activePage === "workspace" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("workspace")}
          >
            Workspace
          </button>
          <button
            className={activePage === "dashboard" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
          <button type="button" disabled>Automations</button>
          <button type="button" disabled>Inbox</button>
        </nav>
        <div className="workspace-card">
          <span className="workspace-icon">W</span>
          <div>
            <strong>Mon workspace</strong>
            <small>{tasks.length} elements</small>
          </div>
        </div>
      </aside>

      <section className="product-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Work management</p>
            <h1>{activePage === "dashboard" ? "Dashboard" : "Travail personnel"}</h1>
          </div>
          <div className="account">
            <span className="avatar">{(user?.username || "C").slice(0, 1).toUpperCase()}</span>
            <span>{user?.username || "Connecte"}</span>
            <button className="ghost-button" onClick={handleLogout}>
              Deconnexion
            </button>
          </div>
        </header>

        {loading ? (
          <p className="state-text">Chargement...</p>
        ) : (
          activePage === "dashboard" ? (
            <Dashboard tasks={tasks} />
          ) : (
            <TaskBoard
              api={api}
              tasks={tasks}
              setTasks={setTasks}
              setMessage={setMessage}
            />
          )
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}

function AuthScreen({ onLogin, message }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");

    try {
      if (mode === "register") {
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!registerResponse.ok) {
          throw new Error("Inscription impossible");
        }

        setInfo("Compte cree. Confirme ton inscription depuis le mail recu avant de te connecter.");
        setMode("login");
        setForm({ ...form, password: "" });
        return;
      }

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      if (!loginResponse.ok) {
        const text = await loginResponse.text();
        if (loginResponse.status === 403) {
          throw new Error("Confirme ton email avant de te connecter.");
        }
        throw new Error(text || "Identifiants invalides");
      }

      onLogin(await loginResponse.json());
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="brand-block">
          <div className="brand-row">
            <span className="brand-mark">T</span>
            <strong>TaskFlow</strong>
          </div>
          <p className="eyebrow">Work OS personnel</p>
          <h1>Centralise tes taches comme dans un vrai workspace</h1>
        </div>

        <div className="mode-switch" aria-label="Mode d'authentification">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Connexion
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Inscription
          </button>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label>
            Nom d'utilisateur
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              autoComplete="username"
              required
            />
          </label>

          {mode === "register" && (
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
                required
              />
            </label>
          )}

          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          <button className="primary-button" disabled={busy}>
            {busy ? "Patiente..." : mode === "login" ? "Se connecter" : "Creer le compte"}
          </button>
        </form>

        {(info || error || message) && (
          <p className={info ? "success-message" : "message"}>
            {info || error || message}
          </p>
        )}
      </section>
    </main>
  );
}

function Dashboard({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "termine").length;
  const active = tasks.filter((task) => task.status === "en_cours").length;
  const todo = tasks.filter((task) => task.status === "a_faire").length;
  const highPriority = tasks.filter((task) => getTaskPriority(task) === "Haute").length;
  const datedTasks = tasks.filter((task) => task.due_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdue = datedTasks.filter((task) => getTaskTimestamp(task) < now.getTime()).length;
  const completion = total ? Math.round((done / total) * 100) : 0;
  const upcomingTasks = [...tasks]
    .filter((task) => task.status !== "termine")
    .sort((a, b) => {
      const aTime = getTaskTimestamp(a) ?? Number.MAX_SAFE_INTEGER;
      const bTime = getTaskTimestamp(b) ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 5);

  const statusStats = GROUP_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  const priorityStats = PRIORITIES.map((priority) => ({
    priority,
    count: tasks.filter((task) => getTaskPriority(task) === priority).length,
  }));

  return (
    <section className="dashboard" id="dashboard">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Vue d'ensemble</p>
          <h2>Ce qui merite ton attention</h2>
          <p className="board-subtitle">
            Priorites, echeances et avancement reunis au meme endroit.
          </p>
        </div>
        <div className="progress-widget" aria-label="Progression globale">
          <strong>{completion}%</strong>
          <span>complete</span>
          <div className="progress-track">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total" value={total} detail="elements suivis" />
        <MetricCard label="En cours" value={active} detail="actions actives" />
        <MetricCard label="A faire" value={todo} detail="dans le backlog" />
        <MetricCard label="Urgent" value={highPriority} detail="priorite haute" />
        <MetricCard label="En retard" value={overdue} detail="date depassee" tone="danger" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <header>
            <h3>Repartition par statut</h3>
            <span>{done} terminees</span>
          </header>
          <div className="stat-list">
            {statusStats.map(({ status, count }) => (
              <ProgressRow
                key={status}
                label={STATUS_META[status].label}
                count={count}
                total={total}
                className={STATUS_META[status].className}
              />
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <header>
            <h3>Charge par priorite</h3>
            <span>{highPriority} haute</span>
          </header>
          <div className="stat-list">
            {priorityStats.map(({ priority, count }) => (
              <ProgressRow
                key={priority}
                label={priority}
                count={count}
                total={total}
                className={`priority-${priority.toLowerCase()}`}
              />
            ))}
          </div>
        </section>

        <section className="dashboard-panel next-panel">
          <header>
            <h3>Prochaines echeances</h3>
            <span>{upcomingTasks.length} a suivre</span>
          </header>
          <div className="next-list">
            {upcomingTasks.map((task) => (
              <article className="next-item" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <small>{getTaskOwner(task)} - {getTaskDate(task)}</small>
                </div>
                <span className={`priority-chip priority-${getTaskPriority(task).toLowerCase()}`}>
                  {getTaskPriority(task)}
                </span>
              </article>
            ))}
            {upcomingTasks.length === 0 && (
              <p className="empty-text">Aucune echeance active</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail, tone = "" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ProgressRow({ label, count, total, className }) {
  const width = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="progress-track slim">
        <span className={className} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TaskBoard({ api, tasks, setTasks, setMessage }) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: "a_faire",
    owner: "Moi",
    due_date: "",
    priority: "Moyenne",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeView, setActiveView] = useState("table");
  const groupedTasks = GROUP_ORDER.reduce((groups, status) => {
    groups[status] = tasks.filter((task) => task.status === status);
    return groups;
  }, {});
  const doneCount = groupedTasks.termine.length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  function updateDraft(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  async function createTask(event) {
    event.preventDefault();
    setMessage("");

    try {
      const task = await api.request("/tasks", {
        method: "POST",
        body: JSON.stringify(buildTaskPayload(draft)),
      });
      setTasks([...tasks, task]);
      setDraft({
        title: "",
        description: "",
        status: "a_faire",
        owner: "Moi",
        due_date: "",
        priority: "Moyenne",
      });
      setShowCreateModal(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateTask(taskId, updates) {
    setMessage("");
    try {
      const task = await api.request(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(buildTaskPayload(updates)),
      });
      setTasks(tasks.map((item) => (item.id === task.id ? task : item)));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTask(taskId) {
    setMessage("");
    try {
      await api.request(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="workspace" id="workspace">
      <div className="board-hero">
        <div>
          <p className="eyebrow">Main board</p>
          <h2>Plan de travail</h2>
          <p className="board-subtitle">
            Suis les elements, change les statuts et garde la progression visible.
          </p>
        </div>
        <div className="progress-widget" aria-label="Progression">
          <strong>{progress}%</strong>
          <span>termine</span>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="view-toolbar">
        <div className="tabs" aria-label="Vues du board">
          <button
            className={activeView === "table" ? "active" : ""}
            onClick={() => setActiveView("table")}
            type="button"
          >
            Table
          </button>
          <button
            className={activeView === "kanban" ? "active" : ""}
            onClick={() => setActiveView("kanban")}
            type="button"
          >
            Kanban
          </button>
        </div>
        <div className="board-actions">
          <div className="board-stats">
            <span>{tasks.length} elements</span>
            <span>{groupedTasks.en_cours.length} actifs</span>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setShowCreateModal(true)}
          >
            Nouvelle tâche
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" role="presentation">
          <form className="task-modal" onSubmit={createTask} role="dialog" aria-modal="true">
            <header>
              <div>
                <p className="eyebrow">Nouvel element</p>
                <h2>Nouvelle tâche</h2>
              </div>
              <button
                className="ghost-button compact"
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Fermer"
              >
                Fermer
              </button>
            </header>
            <label>
              Titre
              <input
                name="title"
                value={draft.title}
                onChange={updateDraft}
                placeholder="Ajouter un element"
                autoFocus
                required
              />
            </label>
            <label>
              Notes
              <textarea
                name="description"
                value={draft.description}
                onChange={updateDraft}
                placeholder="Details utiles"
                rows="3"
              />
            </label>
            <div className="modal-field-grid">
              <label>
                Owner
                <input
                  name="owner"
                  value={draft.owner}
                  onChange={updateDraft}
                  placeholder="Owner"
                />
              </label>
              <label>
                Date
                <input
                  name="due_date"
                  type="date"
                  value={draft.due_date}
                  onChange={updateDraft}
                />
              </label>
            </div>
            <div className="modal-field-grid">
              <label>
                Priorite
                <select name="priority" value={draft.priority} onChange={updateDraft}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Statut
                <select name="status" value={draft.status} onChange={updateDraft}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </button>
              <button className="primary-button">Creer</button>
            </div>
          </form>
        </div>
      )}

      {activeView === "table" ? (
        <div className="board-table">
          {GROUP_ORDER.map((status) => (
            <TaskGroup
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="columns">
          {GROUP_ORDER.map((status) => (
            <section className="task-column" key={status}>
              <header>
                <h2>{STATUS_META[status].label}</h2>
                <span>{groupedTasks[status].length}</span>
              </header>
              <div className="task-list">
                {groupedTasks[status].map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                  />
                ))}
                {groupedTasks[status].length === 0 && (
                  <p className="empty-text">Aucun element</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function TaskGroup({ status, tasks, onUpdate, onDelete }) {
  return (
    <section className="table-group">
      <header className="group-header">
        <span className={`group-dot ${STATUS_META[status].className}`} />
        <h3>{STATUS_META[status].label}</h3>
        <span>{tasks.length}</span>
      </header>
      <div className="grid-table" role="table" aria-label={STATUS_META[status].label}>
        <div className="grid-row grid-head" role="row">
          <span role="columnheader">Element</span>
          <span role="columnheader">Owner</span>
          <span role="columnheader">Statut</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Priorite</span>
          <span role="columnheader">Actions</span>
        </div>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="grid-row empty-row" role="row">
            <span>Aucun element dans ce groupe</span>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ value }) {
  const meta = STATUS_META[value];

  return (
    <span className={`status-badge ${meta.className}`}>
      {meta.shortLabel}
    </span>
  );
}

function TaskRow({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    owner: getTaskOwner(task),
    due_date: task.due_date || "",
    priority: getTaskPriority(task),
  });

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      owner: getTaskOwner(task),
      due_date: task.due_date || "",
      priority: getTaskPriority(task),
    });
  }, [task]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function save(event) {
    event.preventDefault();
    onUpdate(task.id, form);
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="grid-row edit-row" role="row" onSubmit={save}>
        <div className="edit-title-cell">
          <input name="title" value={form.title} onChange={updateField} required />
          <input
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="Notes"
          />
        </div>
        <input name="owner" value={form.owner} onChange={updateField} placeholder="Owner" />
        <select name="status" value={form.status} onChange={updateField}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input name="due_date" type="date" value={form.due_date} onChange={updateField} />
        <select name="priority" value={form.priority} onChange={updateField}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <div className="row-actions">
          <button className="primary-button compact">Sauver</button>
          <button className="ghost-button compact" onClick={() => setEditing(false)} type="button">
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid-row" role="row">
      <div className="item-cell" role="cell">
        <strong>{task.title}</strong>
        {task.description && <small>{task.description}</small>}
      </div>
      <div className="owner-cell" role="cell">
        <span className="mini-avatar">{getOwnerInitials(getTaskOwner(task))}</span>
        <span>{getTaskOwner(task)}</span>
      </div>
      <StatusBadge value={task.status} />
      <span className="muted-cell" role="cell">{getTaskDate(task)}</span>
      <span className={`priority-chip priority-${getTaskPriority(task).toLowerCase()}`} role="cell">
        {getTaskPriority(task)}
      </span>
      <div className="row-actions" role="cell">
        <button className="ghost-button compact" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button className="danger-button compact" onClick={() => onDelete(task.id)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}

function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    owner: getTaskOwner(task),
    due_date: task.due_date || "",
    priority: getTaskPriority(task),
  });

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      owner: getTaskOwner(task),
      due_date: task.due_date || "",
      priority: getTaskPriority(task),
    });
  }, [task]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function save(event) {
    event.preventDefault();
    onUpdate(task.id, form);
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="task-card edit-card" onSubmit={save}>
        <input name="title" value={form.title} onChange={updateField} required />
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          rows="3"
        />
        <select name="status" value={form.status} onChange={updateField}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="card-edit-grid">
          <input name="owner" value={form.owner} onChange={updateField} placeholder="Owner" />
          <input name="due_date" type="date" value={form.due_date} onChange={updateField} />
          <select name="priority" value={form.priority} onChange={updateField}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="task-actions">
          <button className="primary-button compact">Sauver</button>
          <button className="ghost-button compact" onClick={() => setEditing(false)} type="button">
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="task-card">
      <div>
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        <div className="card-meta">
          <span>{getTaskOwner(task)}</span>
          <span>{getTaskDate(task)}</span>
          <span className={`priority-chip priority-${getTaskPriority(task).toLowerCase()}`}>
            {getTaskPriority(task)}
          </span>
        </div>
      </div>
      <div className="task-actions">
        <StatusBadge value={task.status} />
        <button className="ghost-button compact" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button className="danger-button compact" onClick={() => onDelete(task.id)}>
          Supprimer
        </button>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
