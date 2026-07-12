---
read_when:
    - Création de clients API
    - Ajout de points de terminaison ou de schémas
summary: Présentation générale et conventions de l’API REST publique (v1).
x-i18n:
    generated_at: "2026-07-12T15:11:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base : `https://clawhub.ai`

OpenAPI : `/api/v1/openapi.json`

## Réutilisation du catalogue public

Vous pouvez créer un catalogue, un annuaire ou une interface de recherche tiers à partir des API publiques de lecture de ClawHub. Les métadonnées et les fichiers publics des Skills sont publiés conformément aux règles de licence des Skills de ClawHub, tandis que l'API elle-même est soumise à des limites de débit et doit être utilisée de manière responsable.

Recommandations :

- Utilisez les points de terminaison publics de lecture tels que `GET /api/v1/skills`, `GET /api/v1/search` et `GET /api/v1/skills/{slug}` pour les listes du catalogue.
- Mettez les réponses en cache et respectez `429`, `Retry-After` et les en-têtes de limite de débit au lieu d'effectuer des interrogations trop fréquentes.
- Lorsque vous affichez des listes, ajoutez un lien vers l'URL canonique du Skill ClawHub afin que les utilisateurs puissent consulter l'enregistrement du registre source.
- Utilisez des URL de page canoniques au format `https://clawhub.ai/<owner>/skills/<slug>`.
- Ne laissez pas entendre que ClawHub approuve, vérifie ou exploite le site tiers.
- Ne reproduisez pas de contenu masqué, privé ou bloqué par la modération en contournant les filtres de l'API publique ou les limites d'authentification.

## Authentification

- Lecture publique : aucun jeton requis.
- Écriture + compte : `Authorization: Bearer clh_...`.

## Limites de débit

Application tenant compte de l'authentification :

- Requêtes anonymes : par adresse IP.
- Requêtes authentifiées (jeton Bearer valide) : par quota utilisateur.
- Un jeton manquant ou non valide entraîne l'application des limites par adresse IP.

- Lecture : 3000/min par adresse IP, 12000/min par clé
- Écriture : 300/min par adresse IP, 3000/min par clé
- Téléchargement : 1200/min par adresse IP, 6000/min par clé

En-têtes : `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset` ;
`X-RateLimit-Remaining`, `RateLimit-Remaining` et `Retry-After` sont inclus dans les réponses `429`.

Sémantique :

- `X-RateLimit-Reset` : secondes depuis l'époque Unix (heure absolue de réinitialisation)
- `RateLimit-Reset` : délai en secondes avant la réinitialisation
- `X-RateLimit-Remaining` / `RateLimit-Remaining` : quota restant exact lorsqu'il est
  présent ; les requêtes distribuées réussies l'omettent au lieu de renvoyer une valeur
  globale approximative
- `Retry-After` : délai d'attente en secondes en cas de réponse `429`

Exemple de réponse `429` :

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

- Privilégiez `Retry-After` lorsqu'il est présent.
- Sinon, utilisez `RateLimit-Reset` ou calculez le délai à partir de `X-RateLimit-Reset`.
- Ajoutez une variation aléatoire aux nouvelles tentatives.

## Erreurs

- Les erreurs v1 sont en texte brut (`text/plain; charset=utf-8`), notamment les réponses `400`,
  `401`, `403`, `404`, `429` et les réponses de téléchargement bloqué.
- Les paramètres de requête inconnus sont ignorés à des fins de compatibilité.
- Les paramètres de requête connus avec des valeurs non valides renvoient `400`.

## Points de terminaison

Lecture publique :

- `GET /api/v1/search?q=...`
  - Filtres facultatifs : `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias historique : `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort` : `updated` (par défaut), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), les anciens alias d'installation `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
  - Les valeurs `sort` non valides renvoient `400`
  - `cursor` s'applique aux tris autres que `trending`
  - Filtre facultatif : `nonSuspiciousOnly=true`
  - Alias historique : `nonSuspicious=true`
  - Avec `nonSuspiciousOnly=true`, les pages fondées sur un curseur peuvent contenir moins de `limit` éléments ; utilisez `nextCursor` pour continuer.
  - `recommended` utilise des signaux d'engagement et de récence.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Les Skills hébergés renvoient des octets ZIP déterministes.
  - Les Skills actuels adossés à GitHub dont l'analyse est `clean` ou `suspicious` renvoient un
    descripteur de transfert JSON `public-github` au lieu d'octets provenant de ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Les Skills hébergés sont exportés sous forme de fichiers stockés.
  - Les Skills actuels adossés à GitHub dont l'analyse est `clean` ou `suspicious` sont exportés
    sous forme de descripteurs de transfert `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort` : `updated` (par défaut), `recommended`, `downloads`, ancien alias `installs`
  - Les valeurs `sort` non valides renvoient `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort` : `recommended` (par défaut), `downloads`, `updated`, ancien alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Authentification requise :

- `POST /api/v1/skills` (publication, format multipart recommandé)
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Administrateurs uniquement :

- `POST /api/v1/users/reserve` réserve les slugs racine et les espaces réservés privés de paquets sans version pour l'identifiant d'un propriétaire.

## Ancienne API

Les anciennes API `/api/*` et `/api/cli/*` restent disponibles. Consultez `DEPRECATIONS.md`.
