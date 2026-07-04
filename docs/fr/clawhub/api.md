---
read_when:
    - Créer des clients API
    - Ajout de points de terminaison ou de schémas
summary: Présentation et conventions de l’API REST publique (v1).
x-i18n:
    generated_at: "2026-07-04T06:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base : `https://clawhub.ai`

OpenAPI : `/api/v1/openapi.json`

## Réutilisation du catalogue public

Vous pouvez créer un catalogue, un annuaire ou une surface de recherche tiers à partir des API publiques de lecture de ClawHub. Les métadonnées publiques des Skills et les fichiers de Skills sont publiés selon les règles de licence des Skills de ClawHub, tandis que l’API elle-même est soumise à des limites de débit et doit être utilisée de façon responsable.

Consignes :

- Utilisez les endpoints publics de lecture tels que `GET /api/v1/skills`, `GET /api/v1/search` et `GET /api/v1/skills/{slug}` pour les listes de catalogue.
- Mettez les réponses en cache et respectez les en-têtes `429`, `Retry-After` et de limitation de débit au lieu d’interroger agressivement.
- Ajoutez un lien vers l’URL canonique du Skill ClawHub lors de l’affichage des listes afin que les utilisateurs puissent inspecter l’enregistrement source du registre.
- Utilisez les URL de page canoniques au format `https://clawhub.ai/<owner>/skills/<slug>`.
- Ne laissez pas entendre que ClawHub approuve, vérifie ou exploite le site tiers.
- Ne dupliquez pas de contenu masqué, privé ou bloqué par la modération en contournant les filtres de l’API publique ou les frontières d’authentification.

## Authentification

- Lecture publique : aucun jeton requis.
- Écriture + compte : `Authorization: Bearer clh_...`.

## Limites de débit

Application tenant compte de l’authentification :

- Requêtes anonymes : par adresse IP.
- Requêtes authentifiées (jeton Bearer valide) : par quota utilisateur.
- Un jeton manquant ou invalide revient à une application par adresse IP.

- Lecture : 3000/min par adresse IP, 12000/min par clé
- Écriture : 300/min par adresse IP, 3000/min par clé
- Téléchargement : 1200/min par adresse IP, 6000/min par clé

En-têtes : `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset` ;
`X-RateLimit-Remaining`, `RateLimit-Remaining` et `Retry-After` sont inclus sur `429`.

Sémantique :

- `X-RateLimit-Reset` : secondes depuis l’époque Unix (heure absolue de réinitialisation)
- `RateLimit-Reset` : délai en secondes jusqu’à la réinitialisation
- `X-RateLimit-Remaining` / `RateLimit-Remaining` : budget restant exact lorsqu’il
  est présent ; les requêtes réussies réparties l’omettent plutôt que de renvoyer une valeur
  globale approximative
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

- Préférez `Retry-After` lorsqu’il est présent.
- Sinon, utilisez `RateLimit-Reset` ou déduisez le délai depuis `X-RateLimit-Reset`.
- Ajoutez de la gigue aux nouvelles tentatives.

## Erreurs

- Les erreurs v1 sont en texte brut (`text/plain; charset=utf-8`), y compris `400`,
  `401`, `403`, `404`, `429` et les réponses de téléchargement bloquées.
- Les paramètres de requête inconnus sont ignorés pour des raisons de compatibilité.
- Les paramètres de requête connus avec des valeurs invalides renvoient `400`.

## Endpoints

Lecture publique :

- `GET /api/v1/search?q=...`
  - Filtres facultatifs : `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias hérité : `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort` : `updated` (par défaut), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), les alias d’installation hérités `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
  - Les valeurs `sort` invalides renvoient `400`
  - `cursor` s’applique aux tris autres que `trending`
  - Filtre facultatif : `nonSuspiciousOnly=true`
  - Alias hérité : `nonSuspicious=true`
  - Avec `nonSuspiciousOnly=true`, les pages basées sur `cursor` peuvent contenir moins de `limit` éléments ; utilisez `nextCursor` pour continuer.
  - `recommended` utilise des signaux d’engagement et de récence.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Les Skills hébergés renvoient des octets ZIP déterministes.
  - Les Skills actuels adossés à GitHub avec une analyse `clean` ou `suspicious` renvoient un
    descripteur de transfert JSON `public-github` au lieu d’octets ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Les Skills hébergés sont exportés en tant que fichiers stockés.
  - Les Skills actuels adossés à GitHub avec une analyse `clean` ou `suspicious` sont exportés
    en tant que descripteurs de transfert `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort` : `updated` (par défaut), `recommended`, `downloads`, alias hérité `installs`
  - Les valeurs `sort` invalides renvoient `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort` : `recommended` (par défaut), `downloads`, `updated`, alias hérité `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Administration uniquement :

- `POST /api/v1/users/reserve` réserve des slugs racine et des espaces réservés privés de paquets sans version pour un identifiant propriétaire.

## Hérité

Les endpoints hérités `/api/*` et `/api/cli/*` sont toujours disponibles. Consultez `DEPRECATIONS.md`.
