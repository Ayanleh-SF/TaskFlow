import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const STATUS_LABELS = {
  a_faire: "A faire",
  en_cours: "En cours",
  termine: "Termine",
};

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
      <header className="topbar">
        <div>
          <p className="eyebrow">TaskFlow</p>
          <h1>Travail personnel</h1>
        </div>
        <div className="account">
          <span>{user?.username || "Connecte"}</span>
          <button className="ghost-button" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>
      </header>

      {loading ? (
        <p className="state-text">Chargement...</p>
      ) : (
        <TaskBoard
          api={api}
          tasks={tasks}
          setTasks={setTasks}
          setMessage={setMessage}
        />
      )}

      {message && <p className="message">{message}</p>}
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
          <p className="eyebrow">TaskFlow</p>
          <h1>Organise ton travail personnel</h1>
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

function TaskBoard({ api, tasks, setTasks, setMessage }) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: "a_faire",
  });
  const groupedTasks = {
    a_faire: tasks.filter((task) => task.status === "a_faire"),
    en_cours: tasks.filter((task) => task.status === "en_cours"),
    termine: tasks.filter((task) => task.status === "termine"),
  };

  function updateDraft(event) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  async function createTask(event) {
    event.preventDefault();
    setMessage("");

    try {
      const task = await api.request("/tasks", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setTasks([...tasks, task]);
      setDraft({ title: "", description: "", status: "a_faire" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateTask(taskId, updates) {
    setMessage("");
    try {
      const task = await api.request(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
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
    <section className="workspace">
      <form className="task-form" onSubmit={createTask}>
        <label>
          Titre
          <input
            name="title"
            value={draft.title}
            onChange={updateDraft}
            placeholder="Ex: preparer le point projet"
            required
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={draft.description}
            onChange={updateDraft}
            rows="3"
            placeholder="Details utiles"
          />
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
        <button className="primary-button">Ajouter</button>
      </form>

      <div className="columns">
        {Object.entries(groupedTasks).map(([status, items]) => (
          <section className="task-column" key={status}>
            <header>
              <h2>{STATUS_LABELS[status]}</h2>
              <span>{items.length}</span>
            </header>
            <div className="task-list">
              {items.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
              {items.length === 0 && <p className="empty-text">Aucun element</p>}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
  });

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
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
      </div>
      <div className="task-actions">
        <select
          value={task.status}
          onChange={(event) => onUpdate(task.id, { status: event.target.value })}
          aria-label="Changer le statut"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
