---
read_when:
    - Création de clients API
    - Ajout de points de terminaison ou de schémas
summary: Présentation et conventions de l’API REST publique (v1).
x-i18n:
    generated_at: "2026-05-12T00:55:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base : `https://clawhub.ai`

OpenAPI : `/api/v1/openapi.json`

## Réutilisation du catalogue public

Vous pouvez créer un catalogue, un répertoire ou une interface de recherche tierce à partir des API publiques de lecture de ClawHub. Les métadonnées publiques des Skills et les fichiers de Skills sont publiés selon les règles de licence des Skills de ClawHub, tandis que l'API elle-même est soumise à des limites de débit et doit être consommée de manière responsable.

Consignes :

- Utilisez les points de terminaison publics de lecture tels que `GET /api/v1/skills`, `GET /api/v1/search` et `GET /api/v1/skills/{slug}` pour les listes du catalogue.
- Mettez les réponses en cache et respectez `429`, `Retry-After` et les en-têtes de limitation de débit au lieu d'interroger agressivement.
- Ajoutez un lien vers l'URL canonique du Skill ClawHub lors de l'affichage des listes afin que les utilisateurs puissent inspecter l'enregistrement du registre source.
- Utilisez des URL de page canoniques au format `https://clawhub.ai/<owner>/<slug>`.
- Ne laissez pas entendre que ClawHub approuve, vérifie ou exploite le site tiers.
- Ne mettez pas en miroir du contenu masqué, privé ou bloqué par la modération en contournant les filtres de l'API publique ou les limites d'authentification.

## Authentification

- Lecture publique : aucun jeton requis.
- Écriture + compte : `Authorization: Bearer clh_...`.

## Limites de débit

Application tenant compte de l'authentification :

- Requêtes anonymes : par IP.
- Requêtes authentifiées (jeton Bearer valide) : par compartiment utilisateur.
- Un jeton manquant ou invalide revient à l'application par IP.

- Lecture : 600/min par IP, 2400/min par clé
- Écriture : 45/min par IP, 180/min par clé

En-têtes : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (sur 429).

Sémantique :

- `X-RateLimit-Reset` : secondes depuis l'époque Unix (heure absolue de réinitialisation)
- `RateLimit-Reset` : délai en secondes jusqu'à la réinitialisation
- `Retry-After` : délai en secondes à attendre sur `429`

Exemple `429` :

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Gestion côté client :

- Préférez `Retry-After` lorsqu'il est présent.
- Sinon, utilisez `RateLimit-Reset` ou déduisez le délai à partir de `X-RateLimit-Reset`.
- Ajoutez de la gigue aux nouvelles tentatives.

## Points de terminaison

Lecture publique :

- `GET /api/v1/search?q=...`
  - Filtres facultatifs : `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias hérité : `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort` : `updated` (par défaut), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` s'applique aux tris non-`trending`
  - Filtre facultatif : `nonSuspiciousOnly=true`
  - Alias hérité : `nonSuspicious=true`
  - Avec `nonSuspiciousOnly=true`, les pages basées sur un curseur peuvent contenir moins de `limit` éléments ; utilisez `nextCursor` pour continuer.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Authentification requise :

- `POST /api/v1/skills` (publication, multipart préféré)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Administrateur uniquement :

- `POST /api/v1/users/reserve` réserve les slugs racine et les espaces réservés de paquets privés sans publication pour un identifiant de propriétaire.

## Hérité

Les anciens `/api/*` et `/api/cli/*` sont toujours disponibles. Consultez `DEPRECATIONS.md`.
