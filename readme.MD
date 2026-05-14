
authentification des users
-> inscription
-> confirmation email
-> connexion
-> hash mdp
-> génération JWT
-> middleware d'authentification


chaque user a accès à ses propres éléments de travail personnel
-> création d'éléments
-> lecture des éléments
-> modification des éléments
-> suppression des éléments
-> statuts : a_faire / en_cours / termine
-> isolation par utilisateur : un user ne peut agir que sur ses propres données

## Lancer le projet

API :

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --reload
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Documentation interactive :

```text
http://127.0.0.1:8000/docs
```

Application React :

```text
http://127.0.0.1:5173
```

## Architecture API REST

Toutes les routes de l'API sont versionnées avec le préfixe :

```text
/api/v1
```

Routes disponibles :

```text
POST /api/v1/auth/register
GET  /api/v1/auth/confirm-email?token=...
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/tasks
GET  /api/v1/tasks
GET  /api/v1/tasks/{task_id}
PATCH /api/v1/tasks/{task_id}
DELETE /api/v1/tasks/{task_id}
GET  /api/v1/users/me
GET  /api/v1/users/{user_id}
```

## Confirmation email

L'inscription envoie un vrai email de confirmation via SMTP. Configure les variables d'environnement suivantes dans `.env` :

```text
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=ton-login-smtp-brevo
SMTP_PASSWORD=ta-cle-smtp-brevo
SMTP_USE_TLS=true
EMAIL_FROM=noreply@ayanleh.fr
API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Si l'email de confirmation ne peut pas etre envoye, le compte n'est pas conserve.
