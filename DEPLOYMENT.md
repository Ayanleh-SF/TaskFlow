# Deploiement gratuit de TaskFlow

Cette configuration cible :

- Frontend React sur Vercel.
- Backend FastAPI sur Render.
- Base PostgreSQL gratuite sur Supabase.

## 1. Base de donnees Supabase

1. Cree un projet sur Supabase.
2. Recupere l'URL PostgreSQL du projet.
3. Garde cette valeur pour Render dans `DATABASE_URL`.

N'utilise pas `taskflow.db` en production : SQLite est un fichier local, et les fichiers locaux ne sont pas persistants sur les hebergements gratuits comme Render.

## 2. Backend Render

Connecte le repo GitHub a Render et cree un Web Service.

Parametres :

```text
Runtime: Python
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Plan: Free
```

Variables d'environnement Render :

```env
DATABASE_URL=postgresql://...
SECRET_KEY=une-longue-cle-secrete
API_BASE_URL=https://ton-backend.onrender.com/api/v1
CORS_ORIGINS=https://ton-frontend.vercel.app,http://localhost:5173,http://127.0.0.1:5173
REQUIRE_EMAIL_CONFIRMATION=false
```

`REQUIRE_EMAIL_CONFIRMATION=false` est recommande pour le deploiement gratuit, car les ports SMTP peuvent etre bloques. Pour remettre la confirmation email plus tard, utilise une API email HTTP plutot que SMTP.

## 3. Frontend Vercel

Importe le meme repo GitHub dans Vercel.

Parametres :

```text
Root directory: frontend
Build command: npm run build
Output directory: dist
```

Variable d'environnement Vercel :

```env
VITE_API_URL=https://ton-backend.onrender.com/api/v1
```

## 4. Ordre conseille

1. Cree Supabase.
2. Deploie le backend Render avec `DATABASE_URL`.
3. Ouvre `https://ton-backend.onrender.com/docs`.
4. Deploie le frontend Vercel avec `VITE_API_URL`.
5. Copie l'URL Vercel dans `CORS_ORIGINS` cote Render.
6. Redeploie Render.
7. Teste inscription, connexion et creation de tache.

## Notes

- Render Free peut mettre environ une minute a se reveiller apres inactivite.
- Les logs fichier existent pendant que l'instance tourne, mais ne doivent pas etre consideres comme persistants en hebergement gratuit.
- Les fichiers du dossier `logs/` sont ignores par Git.
