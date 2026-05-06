
authentification des users
-> inscription
-> connexion
-> hash mdp
-> génération JWT
-> middleware d'authentification


chaque users à accès à son planning

## Lancer le projet

```bash
python -m uvicorn main:app --reload
```

Documentation interactive :

```text
http://127.0.0.1:8000/docs
```

## Architecture API REST

Toutes les routes de l'API sont versionnées avec le préfixe :

```text
/api/v1
```

Routes disponibles :

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/users/me
GET  /api/v1/users/{user_id}
```

