---
read_when:
    - Ajout/modification de points de terminaison
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (points de terminaison publics + CLI + authentification).
x-i18n:
    generated_at: "2026-05-11T22:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL de base : `https://clawhub.ai` (par défaut).

Tous les chemins v1 se trouvent sous `/api/v1/...`.
Les anciens chemins `/api/...` et `/api/cli/...` restent disponibles pour compatibilité (voir `DEPRECATIONS.md`).
OpenAPI : `/api/v1/openapi.json`.

## Réutilisation du catalogue public

Les répertoires tiers peuvent utiliser les points de terminaison publics en lecture pour lister ou rechercher des Skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, renvoyer les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/<slug>`) et éviter de suggérer une approbation de ClawHub pour le site tiers. N’essayez pas de répliquer du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slugs Web se résolvent entre les familles de registres, mais les clients API doivent utiliser
les URL canoniques renvoyées par les points de terminaison en lecture au lieu de reconstruire la précédence
des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : application par IP.
- Requêtes authentifiées (jeton Bearer valide) : application par compartiment utilisateur.
- Si le jeton est manquant/invalide, le comportement revient à l’application par IP.
- Les points de terminaison d’écriture authentifiés ne doivent pas renvoyer un simple `Unauthorized` lorsque
  le serveur connaît la raison. Les jetons manquants, les jetons invalides/révoqués et
  les comptes supprimés/bannis/désactivés doivent chacun recevoir un texte exploitable afin que les clients
  CLI puissent indiquer aux utilisateurs ce qui les bloque.

- Lecture : 600/min par IP, 2400/min par clé
- Écriture : 45/min par IP, 180/min par clé
- Téléchargement : 30/min par IP, 180/min par clé (`/api/v1/download`)

En-têtes :

- Compatibilité héritée : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardisés : `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Sur `429` : `Retry-After`

Sémantique des en-têtes :

- `X-RateLimit-Reset` : secondes absolues de l’époque Unix
- `RateLimit-Reset` : secondes avant réinitialisation (délai)
- `Retry-After` : secondes à attendre avant de réessayer (délai) sur `429`

Exemple de réponse `429` :

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Conseils client :

- Si `Retry-After` existe, attendez ce nombre de secondes avant de réessayer.
- Utilisez un backoff avec gigue pour éviter les nouvelles tentatives synchronisées.
- Si `Retry-After` est absent, utilisez `RateLimit-Reset` comme repli (ou calculez à partir de `X-RateLimit-Reset`).

Source IP :

- Utilise `cf-connecting-ip` (Cloudflare) pour l’IP client par défaut.
- ClawHub utilise des en-têtes de transfert fiables pour identifier les IP client en périphérie.
- Si aucune IP client fiable n’est disponible, les requêtes de téléchargement anonymes utilisent un compartiment de repli limité au point de terminaison au lieu d’un seul compartiment global `ip:unknown`. Les requêtes anonymes en lecture/écriture utilisent toujours le compartiment inconnu partagé afin que le routage sans IP reste visible et prudent.

## Points de terminaison publics (sans authentification)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer les Skills mises en avant
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les Skills suspectes (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias hérité de `nonSuspiciousOnly`

Réponse :

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Notes :

- Les résultats sont renvoyés par ordre de pertinence (similarité d’embedding + boosts sur les jetons exacts de slug/nom + a priori de popularité basé sur les téléchargements).
- La pertinence est plus forte que la popularité. Une correspondance précise avec un jeton de slug ou de nom d’affichage peut dépasser une correspondance plus lâche avec beaucoup plus de téléchargements.
- Le texte ASCII est tokenisé sur les limites de mots et de ponctuation. Par exemple, `personal-map` contient un jeton autonome `map`, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill` ; rechercher `map` donne donc à `personal-map` une correspondance lexicale plus forte qu’à `amap-jsapi-skill`.
- Les téléchargements sont utilisés comme petit a priori à échelle logarithmique et comme critère de départage, pas comme signal principal de classement. Les Skills très téléchargées peuvent être moins bien classées lorsque le texte de requête correspond moins bien.
- Un état de modération suspect ou masqué peut retirer une Skill de la recherche publique selon les filtres de l’appelant et l’état de modération actuel.

Conseils de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom d’affichage, le résumé et les tags. N’utilisez un jeton de slug autonome que lorsqu’il s’agit aussi d’une identité stable que vous voulez conserver.
- Ne renommez pas un slug uniquement pour cibler une requête, sauf si le nouveau slug est un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs résumés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution pour les anciennes URL et les installations qui se résolvent via le registre, mais le classement de recherche repose sur les métadonnées canoniques de la Skill après l’indexation du renommage. Les statistiques existantes restent associées à la Skill.
- Si une Skill est invisiblement inattendue, vérifiez d’abord l’état de modération avec `clawhub inspect <slug>` en étant connecté avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), `installsCurrent` (alias : `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les Skills suspectes (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias hérité de `nonSuspiciousOnly`

Notes :

- `trending` classe selon les installations des 7 derniers jours (basé sur la télémétrie).
- `createdAt` est stable pour les explorations de nouvelles Skills ; `updated` change lorsque des Skills existantes sont republiées.
- Lorsque `nonSuspiciousOnly=true`, les tris basés sur un curseur peuvent renvoyer moins de `limit` éléments sur une page, car les Skills suspectes sont filtrées après la récupération de la page.
- Utilisez `nextCursor` pour poursuivre la pagination lorsqu’il est présent. Une page courte ne signifie pas à elle seule la fin des résultats.

Réponse :

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Réponse :

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Notes :

- Les anciens slugs créés par les flux de renommage/fusion de propriétaire se résolvent vers la Skill canonique.
- `metadata.os` : restrictions d’OS déclarées dans le frontmatter de la Skill (par exemple `["macos"]`, `["linux"]`). `null` si non déclaré.
- `metadata.systems` : cibles système Nix (par exemple `["aarch64-darwin", "x86_64-linux"]`). `null` si non déclaré.
- `metadata` vaut `null` si la Skill n’a pas de métadonnées de plateforme.
- `moderation` est inclus uniquement lorsque la Skill est signalée ou que le propriétaire la consulte.

### `GET /api/v1/skills/{slug}/moderation`

Renvoie l’état de modération structuré.

Réponse :

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Notes :

- Les propriétaires et modérateurs peuvent accéder aux détails de modération pour les Skills masquées.
- Les appelants publics n’obtiennent `200` que pour les Skills visibles déjà signalées.
- Les preuves sont expurgées pour les appelants publics et n’incluent des extraits bruts que pour les propriétaires/modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signaler une Skill pour examen par les modérateurs. Les signalements portent sur la Skill, peuvent facultativement être liés
à une version, et alimentent la file des signalements de Skills.

Auth :

- Nécessite un jeton API.

Requête :

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Réponse :

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Point de terminaison modérateur/admin pour la réception des signalements de Skills.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `confirmed`, `dismissed` ou `all`
- `limit` (facultatif) : entier (1-200)
- `cursor` (facultatif) : curseur de pagination

Réponse :

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Point de terminaison modérateur/admin pour résoudre ou rouvrir des signalements de Skills.

Requête :

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` est obligatoire pour `confirmed` et `dismissed` ; il peut être omis lors du
rétablissement de `status` à `open`. Passez `finalAction: "hide"` avec un signalement trié
pour masquer la Skill dans le même flux de travail auditable.

### `GET /api/v1/skills/{slug}/versions`

Paramètres de requête :

- `limit` (facultatif) : entier
- `cursor` (facultatif) : curseur de pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Renvoie les métadonnées de version + la liste des fichiers.

- `version.security` inclut l’état de vérification de scan normalisé et les détails du scanner
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification du scan de sécurité pour une version de Skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résoudre une version taguée (par exemple `latest`).

Notes :

- Si ni `version` ni `tag` n’est fourni, utilise la dernière version.
- Inclut l’état de vérification normalisé ainsi que les détails propres à chaque scanner.
- `security.capabilityTags` inclut des étiquettes déterministes de capacité/risque telles que
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` et `posts-externally` lorsqu’elles sont détectées.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un scanner a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané actuel de la modération au niveau de la Skill dérivé de la dernière version.
- Lorsque vous interrogez une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de traiter `moderation` et `security` comme le même contexte de version.

### `GET /api/v1/skills/{slug}/file`

Renvoie le contenu texte brut.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise la dernière version par défaut.
- Limite de taille de fichier : 200 Ko.

### `GET /api/v1/packages`

Point de terminaison de catalogue unifié pour :

- Skills
- Plugins de code
- Plugins de bundle

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `executesCode` (facultatif) : `true` ou `false`
- `capabilityTag` (facultatif) : filtre de capacité pour les paquets de plugins
- `target` / `hostTarget` (facultatif) : raccourci pour `host:<target>`
- `os`, `arch`, `libc` (facultatif) : raccourci pour les filtres de capacité de l’hôte
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (facultatif) : raccourci `true`/`1` pour les balises d’exigences d’environnement
- `externalService`, `binary`, `osPermission` (facultatif) : raccourci pour les balises nommées
  d’exigences d’environnement
- `artifactKind` (facultatif) : `legacy-zip` ou `npm-pack`
- `npmMirror` (facultatif) : `true`/`1` pour afficher les versions de paquets adossées à ClawPack
  disponibles via le miroir npm

Notes :

- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées de Skills restent adossées au registre des skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux versions de code-plugin et de bundle-plugin.
- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent voir, dans les résultats de liste/recherche, les paquets privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les paquets que l’appelant authentifié peut lire.

### `GET /api/v1/packages/search`

Recherche de catalogue unifiée sur les skills + paquets de plugins.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `executesCode` (facultatif) : `true` ou `false`
- `capabilityTag` (facultatif) : filtre de capacité pour les paquets de plugins
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` et
  `osPermission` sont acceptés comme raccourcis pour les balises de capacité courantes
- `artifactKind` (facultatif) : `legacy-zip` ou `npm-pack`
- `npmMirror` (facultatif) : `true`/`1` pour rechercher les versions de paquets adossées à ClawPack
  disponibles via le miroir npm

Notes :

- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent rechercher les paquets privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les paquets que l’appelant authentifié peut lire.
- Les filtres d’artefacts s’appuient sur des balises de capacité indexées :
  `artifact:legacy-zip`, `artifact:npm-pack` et `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du paquet.

Notes :

- Les Skills peuvent aussi être résolus via cette route dans le catalogue unifié.
- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Supprime logiquement un paquet et toutes ses versions.

Notes :

- Nécessite un jeton d’API pour le propriétaire du paquet, un propriétaire/administrateur d’éditeur d’organisation,
  un modérateur de la plateforme ou un administrateur de la plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Notes :

- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version de paquet, incluant les métadonnées de fichiers, la compatibilité,
les capacités, la vérification, les métadonnées d’artefact et les données d’analyse.

Notes :

- `version.artifact.kind` vaut `legacy-zip` pour les anciennes archives de paquets ou
  `npm-pack` pour les versions adossées à ClawPack.
- Les versions ClawPack incluent les champs compatibles npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont inclus lorsque des données d’analyse existent.
- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites du résolveur d’artefacts pour une version de paquet.

Notes :

- Les anciennes versions de paquets renvoient un artefact `legacy-zip` et une URL ZIP héritée
  `downloadUrl`.
- Les versions ClawPack renvoient un artefact `npm-pack`, les champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface de résolveur OpenClaw ; elle évite de deviner le format d’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artefact de version via le chemin explicite du résolveur.

Notes :

- Les versions ClawPack diffusent les octets exacts `.tgz` du npm-pack téléversé.
- Les anciennes versions ZIP redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour une consommation future par OpenClaw.

Les vérifications de préparation couvrent :

- l’état du canal officiel
- la disponibilité de la dernière version
- la disponibilité de l’artefact npm-pack ClawPack
- le condensat de l’artefact
- la provenance du dépôt source et du commit
- les métadonnées de compatibilité OpenClaw
- les cibles hôtes
- l’état de l’analyse

Réponse :

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Point de terminaison modérateur pour lister les lignes de migration des plugins OpenClaw officiels.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `phase` (facultatif) : `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` ou
  `all` (par défaut).
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Réponse :

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Point de terminaison administrateur pour créer ou mettre à jour une ligne de migration de plugin officiel.

Authentification :

- Nécessite un jeton d’API pour un utilisateur administrateur.

Corps de la requête :

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Notes :

- `bundledPluginId` est normalisé en minuscules et sert de clé d’upsert stable.
- `packageName` est normalisé comme nom npm ; le paquet peut manquer pour les migrations
  planifiées.
- Ceci suit uniquement l’état de préparation de la migration. Cela ne modifie pas OpenClaw et ne génère pas
  de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison modérateur/administrateur pour les files de revue des versions de paquets.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `blocked`, `manual` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Signification des états :

- `open` : versions suspectes, malveillantes, en attente, mises en quarantaine, révoquées ou signalées.
- `blocked` : versions mises en quarantaine, révoquées ou malveillantes.
- `manual` : toute version avec un remplacement manuel de modération.
- `all` : toute version avec un remplacement manuel, un état d’analyse non propre ou un signalement de paquet.

Réponse :

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Signale un paquet pour revue par un modérateur. Les signalements sont au niveau du paquet, éventuellement
liés à une version. Ils alimentent la file de modération, mais ne masquent pas automatiquement et ne
bloquent pas les téléchargements par eux-mêmes ; les modérateurs doivent utiliser la modération de version pour
approuver, mettre en quarantaine ou révoquer les artefacts.

Authentification :

- Nécessite un jeton d’API.

Requête :

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Réponse :

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Point de terminaison modérateur/administrateur pour l’arrivée des signalements de paquets.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `confirmed`, `dismissed` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Réponse :

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Point de terminaison propriétaire/modérateur pour la visibilité de la modération d’un paquet.

Authentification :

- Nécessite un jeton d’API pour le propriétaire du paquet, un membre de l’éditeur, un modérateur ou
  un utilisateur administrateur.

Réponse :

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Point de terminaison modérateur/administrateur pour résoudre ou rouvrir les signalements de paquets.

Requête :

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` est requis pour `confirmed` et `dismissed` ; il peut être omis lors du
rétablissement de `status` à `open`. Passez `finalAction: "quarantine"` ou
`finalAction: "revoke"` avec un rapport confirmé pour appliquer la modération de publication dans le
même workflow auditable.

Réponse :

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Point de terminaison modérateur/administrateur pour la revue des publications de package.

Requête :

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué en attente de suivi.
- `revoked` : bloqué après qu’une publication a précédemment été approuvée.

Les publications en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque modification écrit une entrée de journal d’audit.

### `POST /api/v1/packages/backfill/artifacts`

Point de terminaison de maintenance réservé aux administrateurs pour étiqueter les anciennes publications de packages avec
des métadonnées explicites de type d’artefact.

Corps de la requête :

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Réponse :

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Notes :

- Valeur par défaut : simulation.
- Les publications sans stockage ClawPack sont étiquetées `legacy-zip`.
- Les lignes existantes adossées à ClawPack auxquelles il manque `artifactKind` sont réparées en
  `npm-pack`.
- Cela ne génère pas de ClawPacks et ne modifie pas les octets d’artefact.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu texte brut d’un fichier de package.

Paramètres de requête :

- `path` (requis)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière publication.
- Utilise le compartiment de débit de lecture, pas le compartiment de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille de fichier : 200 Ko.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les publications malveillantes peuvent tout de même être retenues ailleurs.
- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/download`

Télécharge l’archive ZIP déterministe héritée pour une publication de package.

Paramètres de requête :

- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière publication.
- Les Skills redirigent vers `GET /api/v1/download`.
- Les archives de plugin/package sont des fichiers zip avec une racine `package/` afin que les anciens clients OpenClaw
  continuent de fonctionner.
- Cette route reste limitée au ZIP. Elle ne diffuse pas les fichiers ClawPack `.tgz`.
- Les réponses incluent les en-têtes `ETag`, `Digest`, `X-ClawHub-Artifact-Type` et
  `X-ClawHub-Artifact-Sha256` pour les vérifications d’intégrité du résolveur.
- Les métadonnées uniquement présentes dans le registre ne sont pas injectées dans l’archive téléchargée.
- Les analyses VirusTotal en attente ne bloquent pas les téléchargements ; les publications malveillantes renvoient `403`.
- Les packages privés renvoient `404` sauf si l’appelant est le propriétaire.

### `GET /api/npm/{package}`

Renvoie un packument compatible npm pour les versions de package adossées à ClawPack.

Notes :

- Seules les versions avec des tarballs npm-pack ClawPack téléversées sont listées.
- Les versions héritées uniquement en ZIP sont intentionnellement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des
  champs compatibles npm afin que les utilisateurs puissent faire pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de packages à portée prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts du tarball ClawPack téléversé pour les clients du miroir npm.

Notes :

- Utilise le compartiment de débit de téléchargement.
- Les en-têtes de téléchargement incluent le SHA-256 ClawHub ainsi que les métadonnées npm integrity/shasum.
- Les vérifications de modération et d’accès aux packages privés s’appliquent toujours.

### `GET /api/v1/resolve`

Utilisé par la CLI pour mapper une empreinte locale à une version connue.

Paramètres de requête :

- `slug` (requis)
- `hash` (requis) : sha256 hexadécimal de 64 caractères de l’empreinte du bundle

Réponse :

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Télécharge un zip d’une version de skill.

Paramètres de requête :

- `slug` (requis)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom de tag (p. ex. `latest`)

Notes :

- Si ni `version` ni `tag` n’est fourni, la dernière version est utilisée.
- Les versions supprimées logiquement renvoient `410`.
- Les statistiques de téléchargement sont comptabilisées comme des identités uniques par heure (`userId` lorsque le jeton d’API est valide, sinon l’IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison exigent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie l’identifiant utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Préféré : `multipart/form-data` avec du JSON `payload` + des blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, l’API résout cet
  éditeur côté serveur et exige que l’acteur ait accès à l’éditeur.
- Champ de charge utile facultatif : `migrateOwner`. Lorsqu’il vaut `true` avec `ownerHandle`, une
  skill existante peut être déplacée vers ce propriétaire si l’acteur est administrateur/propriétaire à la fois sur
  l’éditeur actuel et l’éditeur cible. Sans cette adhésion explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une publication de code-plugin ou de bundle-plugin.

- Nécessite une authentification par jeton Bearer.
- Préféré : `multipart/form-data` avec du JSON `payload` + des blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, seuls les administrateurs peuvent publier au nom de ce propriétaire.

Points principaux de validation :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les packages de plugin nécessitent `openclaw.plugin.json`. Les téléversements ClawPack `.tgz` doivent
  le contenir à `package/openclaw.plugin.json`.
- Les plugins de code nécessitent `package.json`, les métadonnées du dépôt source, les métadonnées du commit source,
  les métadonnées du schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seuls les éditeurs de confiance peuvent publier sur le canal `official`.
- Les publications pour le compte d’un tiers valident toujours l’éligibilité au canal officiel par rapport au compte propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Supprime logiquement / restaure une skill (propriétaire, modérateur ou administrateur).

Corps JSON facultatif :

```json
{ "reason": "Held for moderation pending legal review." }
```

Lorsqu’il est présent, `reason` est stocké comme note de modération de la skill et copié dans le journal d’audit.
Les suppressions logiques initiées par le propriétaire réservent le slug pendant 30 jours, puis le slug peut être réclamé par
un autre éditeur. La réponse de suppression inclut `slugReservedUntil` lorsque cette expiration s’applique.
Les masquages par modérateur/administrateur et les suppressions de sécurité n’expirent pas de cette façon.

Réponse de suppression :

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Codes d’état :

- `200` : ok
- `401` : non autorisé
- `403` : interdit
- `404` : skill/utilisateur introuvable
- `500` : erreur interne du serveur

### `POST /api/v1/users/publisher`

Réservé aux administrateurs. Garantit qu’un éditeur d’organisation existe pour un identifiant. Si l’identifiant pointe toujours vers un
éditeur utilisateur/personnel partagé hérité, le point de terminaison le migre d’abord vers un éditeur d’organisation.

- Corps : `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Réservé aux administrateurs. Réserve des slugs racine et des noms de package pour un propriétaire légitime sans publier de
publication. Les noms de package deviennent des packages réservés privés sans lignes de publication, afin que le même
propriétaire puisse ensuite publier la vraie publication code-plugin ou bundle-plugin sous ce nom.

- Corps : `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Réponse : `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Points de terminaison de gestion des slugs par le propriétaire

- `POST /api/v1/skills/{slug}/rename`
  - Corps : `{ "newSlug": "new-canonical-slug" }`
  - Réponse : `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corps : `{ "targetSlug": "canonical-target-slug" }`
  - Réponse : `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notes :

- Les deux points de terminaison nécessitent une authentification par jeton d’API et ne fonctionnent que pour le propriétaire de la skill.
- `rename` conserve le slug précédent comme alias de redirection.
- `merge` masque la liste source et redirige le slug source vers la liste cible.

### Points de terminaison de transfert de propriété

- `POST /api/v1/skills/{slug}/transfer`
  - Corps : `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Réponse : `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Réponse (acceptation/refus/annulation) : `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forme de la réponse : `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bannit un utilisateur et supprime définitivement les skills détenues (modérateur/administrateur uniquement).

Corps :

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

ou

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Réponse :

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Lève le bannissement d’un utilisateur et restaure les skills admissibles (administrateur uniquement).

Corps :

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

ou

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Réponse :

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Modifie le rôle d’un utilisateur (administrateur uniquement).

Corps :

```json
{ "handle": "user_handle", "role": "moderator" }
```

ou

```json
{ "userId": "users_...", "role": "admin" }
```

Réponse :

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Liste ou recherche des utilisateurs (administrateur uniquement).

Paramètres de requête :

- `q` (facultatif) : requête de recherche
- `query` (facultatif) : alias de `q`
- `limit` (facultatif) : nombre maximal de résultats (20 par défaut, 200 au maximum)

Réponse :

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Ajoute/supprime une étoile (mise en avant). Les deux points de terminaison sont idempotents.

Réponses :

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Points de terminaison CLI hérités (obsolètes)

Toujours pris en charge pour les anciennes versions de la CLI :

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consultez `DEPRECATIONS.md` pour le plan de suppression.

## Découverte du registre (`/.well-known/clawhub.json`)

La CLI peut découvrir les paramètres de registre/d’authentification depuis le site :

- `/.well-known/clawhub.json` (JSON, préféré)
- `/.well-known/clawdhub.json` (hérité)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez, servez ce fichier (ou définissez explicitement `CLAWHUB_REGISTRY` ; `CLAWDHUB_REGISTRY` hérité).
