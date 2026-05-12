---
read_when:
    - Ajout/modification de points de terminaison
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (points de terminaison publics + CLI + authentification).
x-i18n:
    generated_at: "2026-05-12T00:56:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL de base : `https://clawhub.ai` (par défaut).

Tous les chemins v1 se trouvent sous `/api/v1/...`.
Les anciens chemins `/api/...` et `/api/cli/...` restent disponibles pour la compatibilité (voir `DEPRECATIONS.md`).
OpenAPI : `/api/v1/openapi.json`.

## Réutilisation du catalogue public

Les répertoires tiers peuvent utiliser les points de terminaison publics en lecture pour lister ou rechercher des skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, rediriger les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/<slug>`) et éviter de laisser entendre que ClawHub cautionne le site tiers. N’essayez pas de mettre en miroir du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slugs web se résolvent entre les familles de registre, mais les clients API doivent utiliser
les URL canoniques renvoyées par les points de terminaison de lecture au lieu de reconstruire la priorité
des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : appliquées par IP.
- Requêtes authentifiées (jeton Bearer valide) : appliquées par compartiment utilisateur.
- Si le jeton est absent/invalide, le comportement revient à l’application par IP.
- Les points de terminaison d’écriture authentifiés ne doivent pas renvoyer un simple `Unauthorized` lorsque
  le serveur connaît la raison. Les jetons manquants, les jetons invalides/révoqués et
  les comptes supprimés/bannis/désactivés doivent chacun recevoir un texte exploitable afin que les clients
  CLI puissent indiquer aux utilisateurs ce qui les a bloqués.

- Lecture : 600/min par IP, 2400/min par clé
- Écriture : 45/min par IP, 180/min par clé
- Téléchargement : 30/min par IP, 180/min par clé (`/api/v1/download`)

En-têtes :

- Compatibilité héritée : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardisés : `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Sur `429` : `Retry-After`

Sémantique des en-têtes :

- `X-RateLimit-Reset` : secondes absolues depuis l’époque Unix
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

Conseils côté client :

- Si `Retry-After` existe, attendez ce nombre de secondes avant de réessayer.
- Utilisez un repli avec gigue pour éviter les nouvelles tentatives synchronisées.
- Si `Retry-After` est absent, rabattez-vous sur `RateLimit-Reset` (ou calculez à partir de `X-RateLimit-Reset`).

Source de l’IP :

- Utilise `cf-connecting-ip` (Cloudflare) pour l’IP client par défaut.
- ClawHub utilise des en-têtes de transfert de confiance pour identifier les IP client en périphérie.
- Si aucune IP client de confiance n’est disponible, les requêtes anonymes de téléchargement utilisent un compartiment de repli propre au point de terminaison au lieu d’un seul compartiment global `ip:unknown`. Les requêtes anonymes de lecture/écriture continuent d’utiliser le compartiment inconnu partagé afin que le routage sans IP reste visible et prudent.

## Points de terminaison publics (sans auth)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer sur les skills mises en avant
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspectes (`flagged.suspicious`)
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

- Les résultats sont renvoyés par ordre de pertinence (similarité d’embedding + renforcements par correspondance exacte de token de slug/nom + a priori de popularité issu des téléchargements).
- La pertinence prime sur la popularité. Une correspondance précise de slug ou de token de nom d’affichage peut devancer une correspondance plus lâche avec beaucoup plus de téléchargements.
- Le texte ASCII est découpé en tokens aux limites des mots et de la ponctuation. Par exemple, `personal-map` contient un token autonome `map`, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill` ; rechercher `map` donne donc à `personal-map` une correspondance lexicale plus forte qu’à `amap-jsapi-skill`.
- Les téléchargements sont utilisés comme petit a priori à échelle logarithmique et comme critère de départage, pas comme signal principal de classement. Les skills très téléchargées peuvent être classées plus bas lorsque le texte de la requête correspond moins bien.
- Un état de modération suspect ou masqué peut retirer une skill de la recherche publique selon les filtres de l’appelant et l’état de modération actuel.

Conseils de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom d’affichage, le résumé et les tags. Utilisez un token de slug autonome uniquement lorsqu’il s’agit aussi d’une identité stable que vous souhaitez conserver.
- Ne renommez pas un slug uniquement pour cibler une requête, sauf si le nouveau slug est un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs condensés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution des anciennes URL et des installations qui se résolvent via le registre, mais le classement de recherche repose sur les métadonnées canoniques de la skill après indexation du renommage. Les statistiques existantes restent associées à la skill.
- Si une skill est invisiblement masquée de façon inattendue, vérifiez d’abord l’état de modération avec `clawhub inspect <slug>` en étant connecté avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), `installsCurrent` (alias : `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspectes (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias hérité de `nonSuspiciousOnly`

Notes :

- `trending` classe selon les installations des 7 derniers jours (basé sur la télémétrie).
- `createdAt` est stable pour les crawls de nouvelles skills ; `updated` change lorsque des skills existantes sont republiées.
- Quand `nonSuspiciousOnly=true`, les tris basés sur le curseur peuvent renvoyer moins de `limit` éléments sur une page, car les skills suspectes sont filtrées après récupération de la page.
- Utilisez `nextCursor` pour continuer la pagination lorsqu’il est présent. Une page courte ne signifie pas à elle seule la fin des résultats.

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

- Les anciens slugs créés par les flux de renommage/fusion de propriétaire se résolvent vers la skill canonique.
- `metadata.os` : restrictions d’OS déclarées dans le frontmatter de la skill (par exemple `["macos"]`, `["linux"]`). `null` si non déclaré.
- `metadata.systems` : cibles système Nix (par exemple `["aarch64-darwin", "x86_64-linux"]`). `null` si non déclaré.
- `metadata` vaut `null` si la skill n’a aucune métadonnée de plateforme.
- `moderation` est inclus uniquement lorsque la skill est signalée ou que son propriétaire la consulte.

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

- Les propriétaires et modérateurs peuvent accéder aux détails de modération des skills masquées.
- Les appelants publics obtiennent `200` uniquement pour les skills visibles déjà signalées.
- Les preuves sont expurgées pour les appelants publics et n’incluent les extraits bruts que pour les propriétaires/modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signale une skill pour examen par la modération. Les signalements sont au niveau de la skill, éventuellement liés
à une version, et alimentent la file des signalements de skills.

Auth :

- Requiert un jeton API.

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

Point de terminaison modérateur/admin pour la réception des signalements de skills.

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

Point de terminaison modérateur/admin pour résoudre ou rouvrir les signalements de skills.

Requête :

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` est requis pour `confirmed` et `dismissed` ; il peut être omis lors du
retour de `status` à `open`. Passez `finalAction: "hide"` avec un signalement trié
pour masquer la skill dans le même workflow auditable.

### `GET /api/v1/skills/{slug}/versions`

Paramètres de requête :

- `limit` (facultatif) : entier
- `cursor` (facultatif) : curseur de pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Renvoie les métadonnées de version + la liste des fichiers.

- `version.security` inclut l’état de vérification normalisé de l’analyse et les détails du scanner
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification de l’analyse de sécurité pour une version de skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version taguée (par exemple `latest`).

Notes :

- Si ni `version` ni `tag` n’est fourni, utilise la dernière version.
- Inclut l’état de vérification normalisé ainsi que les détails propres au scanner.
- `security.capabilityTags` inclut des libellés déterministes de capacité/risque tels que
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` et `posts-externally` lorsqu’ils sont détectés.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un scanner a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané actuel de la modération au niveau de la skill dérivé de la dernière version.
- Lors d’une requête sur une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de traiter `moderation` et `security` comme relevant du même contexte de version.

### `GET /api/v1/skills/{slug}/file`

Renvoie le contenu texte brut.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Par défaut, utilise la dernière version.
- Limite de taille de fichier : 200 Ko.

### `GET /api/v1/packages`

Point de terminaison de catalogue unifié pour :

- skills
- plugins de code
- plugins de bundle

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `executesCode` (facultatif) : `true` ou `false`
- `capabilityTag` (facultatif) : filtre de capacité pour les packages de Plugin
- `target` / `hostTarget` (facultatif) : raccourci pour `host:<target>`
- `os`, `arch`, `libc` (facultatif) : raccourci pour les filtres de capacité d’hôte
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (facultatif) : raccourci `true`/`1` pour les étiquettes d’exigences d’environnement
- `externalService`, `binary`, `osPermission` (facultatif) : raccourci pour les
  étiquettes d’exigences d’environnement nommées
- `artifactKind` (facultatif) : `legacy-zip` ou `npm-pack`
- `npmMirror` (facultatif) : `true`/`1` pour afficher les versions de packages adossées à ClawPack
  disponibles via le miroir npm

Remarques :

- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées Skills restent adossées au registre Skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux publications `code-plugin` et `bundle-plugin`.
- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent voir les packages privés des éditeurs auxquels ils appartiennent dans les résultats de liste/recherche.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.

### `GET /api/v1/packages/search`

Recherche unifiée dans le catalogue, couvrant les Skills et les packages de Plugin.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `executesCode` (facultatif) : `true` ou `false`
- `capabilityTag` (facultatif) : filtre de capacité pour les packages de Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` et
  `osPermission` sont acceptés comme raccourcis pour les étiquettes de capacité courantes
- `artifactKind` (facultatif) : `legacy-zip` ou `npm-pack`
- `npmMirror` (facultatif) : `true`/`1` pour rechercher les versions de packages adossées à ClawPack
  disponibles via le miroir npm

Remarques :

- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent rechercher les packages privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.
- Les filtres d’artefacts sont adossés à des étiquettes de capacité indexées :
  `artifact:legacy-zip`, `artifact:npm-pack` et `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du package.

Remarques :

- Les Skills peuvent aussi être résolues via cette route dans le catalogue unifié.
- Les packages privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Supprime de manière réversible un package et toutes ses versions publiées.

Remarques :

- Nécessite un jeton d’API pour le propriétaire du package, un propriétaire/administrateur d’éditeur d’organisation,
  un modérateur de plateforme ou un administrateur de plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Remarques :

- Les packages privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version de package, incluant les métadonnées de fichier, la compatibilité,
les capacités, la vérification, les métadonnées d’artefact et les données d’analyse.

Remarques :

- `version.artifact.kind` vaut `legacy-zip` pour les archives de packages de l’ancien monde ou
  `npm-pack` pour les publications adossées à ClawPack.
- Les publications ClawPack incluent les champs compatibles npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont inclus lorsque des données d’analyse existent.
- Les packages privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites du résolveur d’artefact pour une version de package.

Remarques :

- Les versions de packages héritées renvoient un artefact `legacy-zip` et une URL ZIP héritée
  `downloadUrl`.
- Les versions ClawPack renvoient un artefact `npm-pack`, des champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface du résolveur OpenClaw ; elle évite de deviner le format d’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artefact de version via le chemin explicite du résolveur.

Remarques :

- Les versions ClawPack diffusent les octets exacts du `.tgz` `npm-pack` téléversé.
- Les versions ZIP héritées redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour une future consommation par OpenClaw.

Les contrôles de préparation couvrent :

- statut du canal officiel
- disponibilité de la dernière version
- disponibilité de l’artefact `npm-pack` ClawPack
- empreinte de l’artefact
- dépôt source et provenance du commit
- métadonnées de compatibilité OpenClaw
- cibles d’hôte
- état de l’analyse

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

Point de terminaison modérateur pour lister les lignes de migration des Plugins OpenClaw officiels.

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

Point de terminaison administrateur pour créer ou mettre à jour une ligne de migration de Plugin officiel.

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

Remarques :

- `bundledPluginId` est normalisé en minuscules et constitue la clé stable de création ou mise à jour.
- `packageName` est normalisé comme nom npm ; le package peut manquer pour les migrations
  planifiées.
- Ceci suit uniquement l’état de préparation à la migration. Cela ne modifie pas OpenClaw et ne génère
  pas de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison modérateur/administrateur pour les files d’examen des publications de packages.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `blocked`, `manual` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Signification des statuts :

- `open` : publications suspectes, malveillantes, en attente, mises en quarantaine, révoquées ou signalées.
- `blocked` : publications mises en quarantaine, révoquées ou malveillantes.
- `manual` : toute publication avec un remplacement manuel de modération.
- `all` : toute publication avec un remplacement manuel, un état d’analyse non propre ou un signalement de package.

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

Signale un package pour examen par les modérateurs. Les signalements sont au niveau du package, éventuellement
liés à une version. Ils alimentent la file de modération, mais ne masquent pas automatiquement et ne
bloquent pas les téléchargements par eux-mêmes ; les modérateurs doivent utiliser la modération de publication pour
approuver, mettre en quarantaine ou révoquer des artefacts.

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

Point de terminaison modérateur/administrateur pour la réception des signalements de packages.

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

Point de terminaison propriétaire/modérateur pour la visibilité de la modération des packages.

Authentification :

- Nécessite un jeton d’API pour le propriétaire du package, un membre de l’éditeur, un modérateur ou
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

Point de terminaison modérateur/administrateur pour résoudre ou rouvrir des signalements de packages.

Requête :

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` est requis pour `confirmed` et `dismissed`; il peut être omis lors du
retour de `status` à `open`. Passez `finalAction: "quarantine"` ou
`finalAction: "revoke"` avec un signalement confirmé pour appliquer la modération de version dans le
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

Point de terminaison modérateur/administrateur pour l’examen des versions de package.

Requête :

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué en attente de suivi.
- `revoked` : bloqué après qu’une version a été précédemment considérée comme fiable.

Les versions mises en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque modification écrit une entrée de journal d’audit.

### `POST /api/v1/packages/backfill/artifacts`

Point de terminaison de maintenance réservé aux administrateurs pour étiqueter les anciennes versions de package avec
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

- Par défaut, s’exécute à blanc.
- Les versions sans stockage ClawPack sont étiquetées `legacy-zip`.
- Les lignes existantes basées sur ClawPack auxquelles il manque `artifactKind` sont réparées en
  `npm-pack`.
- Cela ne génère pas de ClawPacks et ne modifie pas les octets d’artefact.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu texte brut d’un fichier de package.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
- Utilise le compartiment de débit de lecture, pas celui de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille de fichier : 200 Ko.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les versions malveillantes peuvent encore être retenues ailleurs.
- Les packages privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/download`

Télécharge l’archive ZIP déterministe héritée pour une version de package.

Paramètres de requête :

- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
- Les Skills redirigent vers `GET /api/v1/download`.
- Les archives de Plugin/package sont des fichiers zip avec une racine `package/` afin que les anciens clients OpenClaw
  continuent de fonctionner.
- Cette route reste limitée aux ZIP. Elle ne diffuse pas de fichiers ClawPack `.tgz`.
- Les réponses incluent les en-têtes `ETag`, `Digest`, `X-ClawHub-Artifact-Type` et
  `X-ClawHub-Artifact-Sha256` pour les vérifications d’intégrité du résolveur.
- Les métadonnées propres au registre ne sont pas injectées dans l’archive téléchargée.
- Les analyses VirusTotal en attente ne bloquent pas les téléchargements ; les versions malveillantes renvoient `403`.
- Les packages privés renvoient `404`, sauf si l’appelant est le propriétaire.

### `GET /api/npm/{package}`

Renvoie un packument compatible npm pour les versions de package basées sur ClawPack.

Notes :

- Seules les versions avec des tarballs npm-pack ClawPack téléversées sont listées.
- Les versions héritées uniquement ZIP sont volontairement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des
  champs compatibles npm afin que les utilisateurs puissent pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de packages à portée prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts du tarball ClawPack téléversé pour les clients de miroir npm.

Notes :

- Utilise le compartiment de débit de téléchargement.
- Les en-têtes de téléchargement incluent le SHA-256 ClawHub ainsi que les métadonnées d’intégrité/shasum npm.
- Les contrôles de modération et d’accès aux packages privés s’appliquent toujours.

### `GET /api/v1/resolve`

Utilisé par la CLI pour associer une empreinte locale à une version connue.

Paramètres de requête :

- `slug` (obligatoire)
- `hash` (obligatoire) : sha256 hexadécimal de 64 caractères de l’empreinte du bundle

Réponse :

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Télécharge un zip d’une version de skill.

Paramètres de requête :

- `slug` (obligatoire)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom de tag (par ex. `latest`)

Notes :

- Si ni `version` ni `tag` n’est fourni, la dernière version est utilisée.
- Les versions supprimées de façon réversible renvoient `410`.
- Les statistiques de téléchargement sont comptées comme des identités uniques par heure (`userId` lorsque le jeton d’API est valide, sinon l’IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison exigent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie l’identifiant de l’utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Préféré : `multipart/form-data` avec JSON `payload` + blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de payload facultatif : `ownerHandle`. Lorsqu’il est présent, l’API résout cet
  éditeur côté serveur et exige que l’acteur ait l’accès éditeur.
- Champ de payload facultatif : `migrateOwner`. Lorsque `true` avec `ownerHandle`, une
  skill existante peut être déplacée vers ce propriétaire si l’acteur est administrateur/propriétaire à la fois sur
  les éditeurs actuel et cible. Sans cette option explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une version de code-plugin ou bundle-plugin.

- Nécessite une authentification par jeton Bearer.
- Préféré : `multipart/form-data` avec JSON `payload` + blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de payload facultatif : `ownerHandle`. Lorsqu’il est présent, seuls les administrateurs peuvent publier au nom de ce propriétaire.

Points de validation importants :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les packages de Plugin exigent `openclaw.plugin.json`. Les téléversements ClawPack `.tgz` doivent
  le contenir à `package/openclaw.plugin.json`.
- Les Plugins de code exigent `package.json`, les métadonnées du dépôt source, les métadonnées du commit source,
  les métadonnées du schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seuls les éditeurs de confiance peuvent publier sur le canal `official`.
- Les publications pour le compte d’un tiers valident toujours l’éligibilité au canal officiel par rapport au compte propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Supprimer de façon réversible / restaurer une skill (propriétaire, modérateur ou administrateur).

Corps JSON facultatif :

```json
{ "reason": "Held for moderation pending legal review." }
```

Lorsqu’il est présent, `reason` est stocké comme note de modération de la skill et copié dans le journal d’audit.
Les suppressions réversibles initiées par le propriétaire réservent le slug pendant 30 jours, puis le slug peut être revendiqué par
un autre éditeur. La réponse de suppression inclut `slugReservedUntil` lorsque cette expiration s’applique.
Les masquages modérateur/administrateur et les suppressions pour sécurité n’expirent pas de cette manière.

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

Réservé aux administrateurs. Garantit qu’un éditeur d’organisation existe pour un identifiant. Si l’identifiant pointe encore vers un
ancien éditeur utilisateur/personnel partagé, le point de terminaison le migre d’abord vers un éditeur d’organisation.

- Corps : `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Réservé aux administrateurs. Réserve des slugs racine et des noms de package pour un propriétaire légitime sans publier de
version. Les noms de package deviennent des packages d’espace réservé privés sans lignes de version, afin que le même
propriétaire puisse publier plus tard la vraie version code-plugin ou bundle-plugin sous ce nom.

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

- Les deux points de terminaison exigent une authentification par jeton d’API et ne fonctionnent que pour le propriétaire de la skill.
- `rename` conserve le slug précédent comme alias de redirection.
- `merge` masque la liste source et redirige le slug source vers la liste cible.

### Points de terminaison de transfert de propriété

- `POST /api/v1/skills/{slug}/transfer`
  - Corps : `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Réponse : `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Réponse (acceptation/rejet/annulation) : `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forme de la réponse : `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bannit un utilisateur et supprime définitivement les skills possédées (modérateur/administrateur uniquement).

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

Débannit un utilisateur et restaure les skills éligibles (administrateur uniquement).

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
- `query` (facultatif) : alias pour `q`
- `limit` (facultatif) : nombre maximal de résultats (20 par défaut, 200 max)

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

Ajoute/retire une étoile (mises en avant). Les deux points de terminaison sont idempotents.

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

Voir `DEPRECATIONS.md` pour le plan de suppression.

## Découverte du registre (`/.well-known/clawhub.json`)

La CLI peut découvrir les paramètres de registre/authentification depuis le site :

- `/.well-known/clawhub.json` (JSON, préféré)
- `/.well-known/clawdhub.json` (hérité)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez, servez ce fichier (ou définissez explicitement `CLAWHUB_REGISTRY` ; ancien `CLAWDHUB_REGISTRY`).
