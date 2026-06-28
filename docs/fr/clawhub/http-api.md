---
read_when:
    - Ajout/modification de points de terminaison
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (points de terminaison publics + CLI + authentification).
x-i18n:
    generated_at: "2026-06-28T05:06:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL de base : `https://clawhub.ai` (par défaut).

Tous les chemins v1 se trouvent sous `/api/v1/...`.
Les anciens `/api/...` et `/api/cli/...` restent disponibles pour compatibilité (voir `DEPRECATIONS.md`).
OpenAPI : `/api/v1/openapi.json`.

## Réutilisation du catalogue public

Les répertoires tiers peuvent utiliser les points de terminaison publics en lecture pour lister ou rechercher des Skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, renvoyer les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/skills/<slug>`) et éviter de laisser entendre que ClawHub approuve le site tiers. Ne tentez pas de dupliquer du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slugs web sont résolus entre familles de registres, mais les clients API doivent utiliser
les URL canoniques renvoyées par les points de terminaison de lecture plutôt que de reconstruire la
priorité des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : appliqué par IP.
- Requêtes authentifiées (jeton Bearer valide) : appliqué par compartiment utilisateur.
- Si le jeton est manquant/invalide, le comportement revient à l’application par IP.
- Les points de terminaison d’écriture authentifiés ne doivent pas renvoyer un simple `Unauthorized` lorsque
  le serveur connaît la raison. Les jetons manquants, les jetons invalides/révoqués et
  les comptes supprimés/bannis/désactivés doivent chacun recevoir un texte exploitable afin que les clients
  CLI puissent indiquer aux utilisateurs ce qui les a bloqués.

- Lecture : 3000/min par IP, 12000/min par clé
- Écriture : 300/min par IP, 3000/min par clé
- Téléchargement : 1200/min par IP, 6000/min par clé (points de terminaison de téléchargement)

En-têtes :

- Compatibilité héritée : `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardisés : `RateLimit-Limit`, `RateLimit-Reset`
- Sur `429` : `X-RateLimit-Remaining: 0` et `RateLimit-Remaining: 0`
- Sur `429` : `Retry-After`

Sémantique des en-têtes :

- `X-RateLimit-Reset` : secondes Unix epoch absolues
- `RateLimit-Reset` : secondes avant réinitialisation (délai)
- `X-RateLimit-Remaining` / `RateLimit-Remaining` : budget restant exact lorsqu’il est présent.
  Les requêtes réussies réparties par partition omettent cet en-tête au lieu de renvoyer une valeur globale approximative.
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

Conseils pour les clients :

- Si `Retry-After` existe, attendez ce nombre de secondes avant de réessayer.
- Utilisez un backoff avec gigue pour éviter les nouvelles tentatives synchronisées.
- Si `Retry-After` est manquant, revenez à `RateLimit-Reset` (ou calculez à partir de `X-RateLimit-Reset`).

Source IP :

- Utilise les en-têtes d’IP client fiables, y compris `cf-connecting-ip`, uniquement lorsque le
  déploiement active explicitement les en-têtes transférés fiables.
- ClawHub utilise des en-têtes de transfert fiables pour identifier les IP clientes en périphérie.
- Si aucune IP cliente fiable n’est disponible, les requêtes anonymes utilisent des compartiments de secours
  limités uniquement par type de limite de débit. Ces compartiments de secours n’incluent pas
  les chemins, slugs, noms de paquets, versions, chaînes de requête ou autres paramètres
  d’artefacts fournis par l’appelant.

## Réponses d’erreur

Les réponses d’erreur publiques v1 sont en texte brut avec `content-type: text/plain; charset=utf-8`.
Cela inclut les échecs de validation (`400`), les ressources publiques manquantes (`404`), les échecs
d’authentification et d’autorisation (`401`/`403`), les limites de débit (`429`) et les téléchargements bloqués. Les clients
doivent lire le corps de la réponse comme une chaîne lisible par un humain. Les paramètres de requête inconnus sont
ignorés pour compatibilité, mais les paramètres de requête reconnus avec des valeurs invalides renvoient
`400`.

## Points de terminaison publics (sans authentification)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer sur les Skills mises en avant
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Notes :

- Les résultats sont renvoyés par ordre de pertinence (similarité d’embedding + renforcements sur les jetons exacts de slug/nom + léger a priori de popularité).
- La pertinence prime sur la popularité. Une correspondance précise de slug ou de jeton de nom affiché peut devancer une correspondance plus approximative avec un engagement beaucoup plus fort.
- Le texte ASCII est segmenté sur les limites de mots et de ponctuation. Par exemple, `personal-map` contient un jeton autonome `map`, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill`; rechercher `map` donne donc à `personal-map` une correspondance lexicale plus forte que `amap-jsapi-skill`.
- La popularité est mise à l’échelle logarithmique et plafonnée. Les Skills à fort engagement peuvent être classées plus bas lorsque le texte de la requête correspond moins bien.
- Un état de modération suspect ou masqué peut retirer une Skill de la recherche publique selon les filtres de l’appelant et l’état de modération actuel.

Conseils de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom affiché, le résumé et les tags. Utilisez un jeton de slug autonome uniquement lorsqu’il s’agit aussi d’une identité stable que vous souhaitez conserver.
- Ne renommez pas un slug uniquement pour cibler une requête, sauf si le nouveau slug est un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs résumés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution pour les anciennes URL et les installations résolues via le registre, mais le classement de recherche repose sur les métadonnées canoniques de la Skill une fois le renommage indexé. Les statistiques existantes restent associées à la Skill.
- Si une Skill est anormalement invisible, vérifiez d’abord l’état de modération avec `clawhub inspect @owner/slug` en étant connecté avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `recommended` (alias : `default`), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), les alias d’installation hérités `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les Skills suspectes (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias hérité de `nonSuspiciousOnly`

Les valeurs `sort` invalides renvoient `400`.

Notes :

- `recommended` utilise des signaux d’engagement et de récence.
- `trending` classe selon les installations des 7 derniers jours (fondé sur la télémétrie).
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
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Les anciens slugs créés par des flux de renommage/fusion de propriétaire sont résolus vers la Skill canonique.
- `metadata.os` : restrictions d’OS déclarées dans le frontmatter de la Skill (par ex. `["macos"]`, `["linux"]`). `null` si non déclarées.
- `metadata.systems` : cibles système Nix (par ex. `["aarch64-darwin", "x86_64-linux"]`). `null` si non déclarées.
- `metadata` vaut `null` si la Skill n’a aucune métadonnée de plateforme.
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

- Les propriétaires et modérateurs peuvent accéder aux détails de modération des Skills masquées.
- Les appelants publics obtiennent `200` uniquement pour les Skills visibles déjà signalées.
- Les preuves sont expurgées pour les appelants publics et n’incluent les extraits bruts que pour les propriétaires/modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signaler une Skill pour examen par un modérateur. Les signalements portent sur la Skill, peuvent être liés
à une version et alimentent la file des signalements de Skills.

Authentification :

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

`note` est requis pour `confirmed` et `dismissed` ; il peut être omis lors de la
remise de `status` à `open`. Passez `finalAction: "hide"` avec un signalement trié
pour masquer la Skill dans le même flux auditable.

### `GET /api/v1/skills/{slug}/versions`

Paramètres de requête :

- `limit` (facultatif) : entier
- `cursor` (facultatif) : curseur de pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Renvoie les métadonnées de version + la liste des fichiers.

- `version.security` inclut l’état normalisé de vérification d’analyse et les détails du scanner
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification d’analyse de sécurité pour une version de Skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version balisée (par exemple `latest`).

Notes :

- Si ni `version` ni `tag` n’est fourni, utilise la dernière version.
- Inclut un état de vérification normalisé ainsi que les détails propres au scanner.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un scanner a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané actuel de modération au niveau de la skill, dérivé de la dernière version.
- Lorsque vous interrogez une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de traiter `moderation` et `security` comme appartenant au même contexte de version.

### `POST /api/v1/skills/-/scan`

Point de terminaison de soumission authentifié pour les nouvelles tâches ClawScan.

Les analyses de téléversement local ne sont plus prises en charge. Les requêtes utilisant
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` renvoient `410`.

Les analyses publiées utilisent JSON :

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Remarques :

- Les charges utiles de requêtes d’analyse et les rapports téléchargeables expirent du magasin de requêtes d’analyse après la période de rétention.
- Les analyses publiées nécessitent un accès de gestion propriétaire/éditeur, ou l’autorité d’un modérateur/administrateur de la plateforme.
- Les analyses publiées réécrivent les résultats uniquement lorsque `update: true` et que l’analyse se termine avec succès.
- La réponse est `202` avec `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Les tâches d’analyse sont asynchrones. Les requêtes d’analyse manuelle sont prioritaires sur les travaux normaux de publication/rattrapage, mais leur achèvement dépend toujours de la disponibilité des workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Point de terminaison d’interrogation authentifié pour une analyse soumise.

- Renvoie l’état en file d’attente/en cours/réussite/échec.
- Renvoie `queue.queuedAhead` et `queue.position` pendant la mise en file d’attente afin que les clients puissent afficher combien d’analyses manuelles prioritaires précèdent la requête. Les très grandes files sont bornées et signalées avec `queuedAheadIsEstimate: true`.
- Lorsqu’il est disponible, `report` contient les sections `clawscan`, `skillspector`, `staticAnalysis` et `virustotal`.
- Les tâches d’analyse échouées renvoient `status: "failed"` avec `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Point de terminaison authentifié d’archive de rapport.

- Nécessite une analyse réussie ; les analyses non terminales renvoient `409`.
- Renvoie un ZIP avec `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Point de terminaison authentifié d’archive de rapport stocké pour les versions soumises.

- Nécessite un accès de gestion propriétaire/éditeur à la skill ou au plugin, ou l’autorité d’un modérateur/administrateur de la plateforme.
- Renvoie les résultats d’analyse stockés pour la version exacte soumise, y compris les versions bloquées ou masquées.
- `kind` vaut `skill` par défaut ; utilisez `kind=plugin` pour les analyses de plugins/packages.
- Renvoie la même forme ZIP que les téléchargements de requêtes d’analyse.

### `POST /api/v1/skills/-/scan/batch`

Route canonique de réanalyse par lot réservée aux administrateurs. Elle accepte la même forme de charge utile que l’ancienne route `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonique d’état de lot réservée aux administrateurs. Elle accepte `{ "jobIds": ["..."] }` et renvoie les mêmes compteurs agrégés que l’ancienne route `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Renvoie l’enveloppe de vérification de Skill Card utilisée par `clawhub skill verify`.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version balisée (par exemple `latest`).

Remarques :

- `ok` vaut `true` uniquement lorsque la version sélectionnée possède une Skill Card générée, n’est pas bloquée comme logiciel malveillant par la modération, et que la vérification ClawScan est propre.
- L’identité de la skill, l’identité de l’éditeur et les métadonnées de la version sélectionnée sont des champs de premier niveau de l’enveloppe (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) afin que l’automatisation shell puisse les lire sans dépaqueter des enveloppes imbriquées.
- `security` est le verdict ClawScan/sécurité de premier niveau. L’automatisation doit se baser sur `ok`, `decision`, `reasons` et `security.status`.
- `security.signals` contient des preuves de scanner complémentaires telles que `staticScan`, `virusTotal` et `skillSpector`.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais le scanner d’existence du registre de dépendances est retiré et cette clé vaut toujours `null`.
- `provenance` vaut `server-resolved-github-import` uniquement lorsque ClawHub a résolu et stocké un dépôt/ref/commit/chemin GitHub pendant la publication ou l’import ; sinon, il vaut `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Renvoie les verdicts de sécurité compacts actuels pour des versions exactes de skills. Ce
point de terminaison de collection est destiné aux clients qui savent déjà quelles versions
de Skills ClawHub installées ils doivent afficher, comme OpenClaw Control UI.

Requête :

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Remarques :

- `items` doit contenir 1 à 100 paires uniques `{ slug, version }`.
- Les résultats sont fournis par élément ; une skill ou une version manquante ne fait pas échouer toute la réponse.
- La réponse concerne uniquement la sécurité. Elle n’inclut pas les données de Skill Card, l’état de carte générée, les listes de fichiers d’artefacts ni les charges utiles détaillées des scanners.
- `security.signals` contient uniquement des preuves complémentaires au niveau de l’état ; utilisez `/scan` ou la page security-audit de ClawHub pour obtenir tous les détails des scanners.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais le scanner d’existence du registre de dépendances est retiré et cette clé vaut toujours `null`.
- L’absence de Skill Card n’affecte pas les valeurs `ok`, `decision` ou `reasons` de ce point de terminaison ; les clients doivent lire le fichier `skill-card.md` installé localement lorsqu’ils ont besoin du contenu de la carte.
- Utilisez `/verify` lorsque vous avez besoin de l’enveloppe de vérification Skill Card pour une seule skill, `/card` lorsque vous avez besoin du Markdown de carte généré, et `/scan` lorsque vous avez besoin de données de scanner détaillées.

Réponse :

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Renvoie le contenu texte brut.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
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
- `sort` (facultatif) : `updated` (par défaut), `recommended`, `trending`, `downloads`, alias hérité `installs`
- `category` (facultatif) : filtre de catégorie de plugin. Pris en charge uniquement lorsque la
  requête est limitée aux packages de plugins (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, ou aux points de terminaison de packages avec
  `family=code-plugin`/`family=bundle-plugin`). Les catégories contrôlées et
  les alias de filtre v1 hérités sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées Skill restent adossées au registre des Skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux versions de code-plugin et bundle-plugin.
- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent voir les packages privés des éditeurs auxquels ils appartiennent dans les résultats de liste/recherche.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.

### `GET /api/v1/packages/search`

Recherche de catalogue unifiée dans les Skills + packages de plugins.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de plugin. Pris en charge uniquement lorsque la
  requête est limitée aux packages de plugins. Les catégories contrôlées et les alias de filtre v1
  hérités sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent rechercher les packages privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.

### `GET /api/v1/plugins`

Parcours de catalogue limité aux Plugins sur les packages code-plugin et bundle-plugin.

Paramètres de requête :

- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `recommended` (par défaut), `trending`, `downloads`, `updated`, alias hérité `installs`
- `category` (facultatif) : filtre de catégorie de plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Les alias de filtre v1 hérités restent acceptés sur les points de terminaison de lecture :

- `mcp-tooling`, `data` et `automation` se résolvent en `tools`.
- `observability` et `deployment` se résolvent en `gateway`.
- `dev-tools` se résout en `runtime`.

`trending` est un classement des installations/téléchargements sur sept jours et n’utilise pas les totaux cumulés.
Sur le point de terminaison unifié `/api/v1/packages`, il est limité aux plugins ; utilisez
`/api/v1/skills?sort=trending` pour le catalogue des Skills.

Les alias hérités ne sont pas acceptés comme valeurs de catégorie stockées ou déclarées par l’auteur.

### `GET /api/v1/skills/export`

Export groupé des dernières Skills publiques pour analyse hors ligne.

Auth :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (obligatoire) : borne inférieure en millisecondes Unix pour le `updatedAt` de la skill.
- `endDate` (obligatoire) : borne supérieure en millisecondes Unix pour le `updatedAt` de la skill.
- `limit` (facultatif) : entier (1-250), `250` par défaut.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.

Réponse :

- Corps : archive ZIP.
- Chaque skill exportée est enracinée à `{publisher}/{slug}/`.
- Les Skills hébergées incluent les derniers fichiers de version stockés et sont listées dans
  `_manifest.json` avec `sourceRef: "public-clawhub"`.
- Les Skills actuelles adossées à GitHub avec une analyse `clean` ou `suspicious` incluent
  `_source_handoff.json` avec `sourceRef: "public-github"`, dépôt, commit, chemin,
  hachage de contenu et URL d’archive. Elles n’incluent pas les fichiers sources hébergés par ClawHub.
- Chaque skill inclut `_export_skill_meta.json`.
- `_manifest.json` est toujours inclus à la racine du ZIP.
- `_errors.json` est inclus lorsque des Skills ou fichiers individuels n’ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Export groupé des dernières versions publiques de Plugins pour analyse hors ligne.

Authentification :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (obligatoire) : borne inférieure en millisecondes Unix pour `updatedAt` du Plugin.
- `endDate` (obligatoire) : borne supérieure en millisecondes Unix pour `updatedAt` du Plugin.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.
- `family` (facultatif) : `code-plugin` ou `bundle-plugin`. Omis signifie les deux
  familles de Plugins.

Réponse :

- Corps : archive ZIP.
- Chaque Plugin exporté a pour racine `{family}/{packageName}/`.
- Chaque Plugin exporté inclut les fichiers stockés de la dernière version.
- Les métadonnées d’export par Plugin sont stockées dans
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` est toujours inclus à la racine du ZIP.
- `_errors.json` est inclus lorsque des Plugins ou fichiers individuels n’ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Recherche limitée aux Plugins dans les paquets code-plugin et bundle-plugin.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1-100)
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de Plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notes :

- Les alias de filtres hérités de v1 documentés sous `GET /api/v1/plugins` sont également
  acceptés.
- Le filtrage par catégorie est un véritable filtre d’API appuyé par des lignes de synthèse
  de catégories de Plugins, et non une réécriture de requête de recherche.
- Les résultats sont renvoyés par ordre de pertinence et ne sont pas paginés actuellement.
- Les contrôles de tri de l’interface navigateur pour la recherche de Plugins réordonnent les résultats de pertinence chargés,
  conformément au comportement actuel de navigation `/skills`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du paquet.

Notes :

- Les Skills peuvent également être résolues via cette route dans le catalogue unifié.
- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Supprime logiquement un paquet et toutes ses versions.

Notes :

- Nécessite un jeton d’API pour le propriétaire du paquet, un propriétaire/administrateur d’éditeur d’organisation,
  un modérateur de plateforme ou un administrateur de plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Notes :

- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version de paquet, y compris les métadonnées de fichier, la compatibilité,
la vérification, les métadonnées d’artéfact et les données d’analyse.

Notes :

- `version.artifact.kind` vaut `legacy-zip` pour les archives de paquets de l’ancien monde ou
  `npm-pack` pour les versions adossées à ClawPack.
- Les versions ClawPack incluent les champs compatibles npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash` est une métadonnée de compatibilité obsolète pour les anciens clients. Elle
  hache les octets ZIP exacts renvoyés par `/api/v1/packages/{name}/download`.
  Les clients modernes doivent utiliser `version.artifact.sha256`, qui identifie
  l’artéfact de version canonique.
- `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont
  inclus lorsque des données d’analyse existent.
- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Renvoie le résumé exact de sécurité et de confiance de la version du paquet pour les clients
d’installation. Il s’agit de la surface de consommation publique d’OpenClaw pour décider si une
version résolue peut être installée.

Authentification :

- Point de terminaison en lecture publique. Aucun jeton de propriétaire, d’éditeur, de modérateur ou d’administrateur n’est
  requis.

Réponse :

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Champs de réponse :

- `package.name`, `package.displayName` et `package.family` identifient le
  paquet de registre résolu.
- `release.releaseId`, `release.version` et `release.createdAt` identifient la
  version exacte qui a été évaluée.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` et `release.npmTarballName` sont présents lorsqu’ils sont connus pour
  l’artéfact de version.
- `trust.scanStatus` est l’état de confiance effectif dérivé des entrées des analyseurs
  et de la modération manuelle de la version.
- `trust.moderationState` est nullable. Il vaut `null` lorsqu’aucune modération manuelle de version
  n’existe.
- `trust.blockedFromDownload` est le signal de blocage d’installation. OpenClaw et les autres
  clients d’installation doivent bloquer l’installation lorsque cette valeur vaut `true`, au lieu de
  recalculer les règles de blocage à partir des champs d’analyseur ou de modération.
- `trust.reasons` est la liste d’explications destinée aux utilisateurs et à l’audit. Les codes de motif
  sont des chaînes stables et compactes telles que `manual:quarantined`, `scan:malicious`,
  et `package:malicious`.
- `trust.pending` signifie qu’une ou plusieurs entrées de confiance sont toujours en attente d’achèvement.
- `trust.stale` signifie que le résumé de confiance a été calculé à partir d’entrées obsolètes et
  doit être traité comme nécessitant une actualisation avant une décision d’autorisation à confiance élevée.

Notes :

- Ce point de terminaison est exact à la version. Les clients doivent l’appeler après avoir résolu la
  version du paquet qu’ils ont l’intention d’installer, et pas seulement après avoir lu les dernières
  métadonnées du paquet.
- Les paquets privés renvoient `404`, sauf si l’appelant peut lire l’éditeur propriétaire.
- Ce point de terminaison est intentionnellement plus étroit que les points de terminaison de modération
  propriétaire/modérateur. Il expose la décision d’installation et l’explication publique, pas
  les identités des rapporteurs, les corps de rapports, les preuves privées ni les chronologies de revue
  internes.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites du résolveur d’artéfact pour une version de paquet.

Notes :

- Les anciennes versions de paquets renvoient un artéfact `legacy-zip` et une URL de téléchargement ZIP
  héritée `downloadUrl`.
- Les versions ClawPack renvoient un artéfact `npm-pack`, des champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface de résolution OpenClaw ; elle évite de deviner le format d’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artéfact de version via le chemin explicite du résolveur.

Notes :

- Les versions ClawPack diffusent les octets exacts du `.tgz` npm-pack téléversé.
- Les versions ZIP héritées redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour une consommation future par OpenClaw.

Les vérifications de préparation couvrent :

- statut du canal officiel
- disponibilité de la dernière version
- disponibilité de l’artéfact npm-pack ClawPack
- condensat de l’artéfact
- provenance du dépôt source et du commit
- métadonnées de compatibilité OpenClaw
- cibles hôtes
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

Point de terminaison de modérateur pour lister les lignes de migration de Plugins OpenClaw officiels.

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

Notes :

- `bundledPluginId` est normalisé en minuscules et constitue la clé d’upsert stable.
- `packageName` est normalisé en nom npm ; le paquet peut être absent pour les migrations
  planifiées.
- Cela suit uniquement l’état de préparation de la migration. Cela ne modifie pas OpenClaw ni ne génère
  de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison modérateur/administrateur pour les files de revue des versions de paquets.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `blocked`, `manual` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Signification des statuts :

- `open` : versions suspectes, malveillantes, en attente, mises en quarantaine, révoquées ou signalées.
- `blocked` : versions mises en quarantaine, révoquées ou malveillantes.
- `manual` : toute version avec un remplacement manuel de modération.
- `all` : toute version avec un remplacement manuel, un état d’analyse non sain ou un signalement de paquet.

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

Signale un paquet pour revue par un modérateur. Les signalements se font au niveau du paquet, avec un lien facultatif
vers une version. Ils alimentent la file de modération, mais ne masquent pas automatiquement et ne
bloquent pas les téléchargements à eux seuls ; les modérateurs doivent utiliser la modération de version pour
approuver, mettre en quarantaine ou révoquer les artéfacts.

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

Point de terminaison modérateur/administrateur pour la réception des rapports de paquets.

Auth :

- Nécessite un jeton API pour un utilisateur modérateur ou administrateur.

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

Auth :

- Nécessite un jeton API pour le propriétaire du paquet, un membre éditeur, un modérateur ou
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

Point de terminaison modérateur/administrateur pour résoudre ou rouvrir des rapports de paquets.

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
`finalAction: "revoke"` avec un rapport confirmé pour appliquer la modération de version dans le
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

Point de terminaison modérateur/administrateur pour l’examen d’une version de paquet.

Requête :

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué en attente de suivi.
- `revoked` : bloqué après qu’une version a été précédemment considérée comme fiable.

Les versions en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque changement écrit une entrée de journal d’audit.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu texte brut d’un fichier de paquet.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
- Utilise le compartiment de débit de lecture, pas le compartiment de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille de fichier : 200 Ko.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les versions malveillantes peuvent tout de même être retenues ailleurs.
- Les paquets privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/download`

Télécharge l’archive ZIP déterministe héritée pour une version de paquet.

Paramètres de requête :

- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
- Les Skills redirigent vers `GET /api/v1/download`.
- Les archives de Plugin/paquet sont des fichiers zip avec une racine `package/` afin que les anciens clients OpenClaw
  continuent de fonctionner.
- Cette route reste limitée au ZIP. Elle ne diffuse pas les fichiers ClawPack `.tgz`.
- Les réponses incluent les en-têtes `ETag`, `Digest`, `X-ClawHub-Artifact-Type` et
  `X-ClawHub-Artifact-Sha256` pour les contrôles d’intégrité du résolveur.
- Les métadonnées propres au registre ne sont pas injectées dans l’archive téléchargée.
- Les analyses VirusTotal en attente ne bloquent pas les téléchargements ; les versions malveillantes renvoient `403`.
- Les paquets privés renvoient `404` sauf si l’appelant est le propriétaire.

### `GET /api/npm/{package}`

Renvoie un packument compatible npm pour les versions de paquet basées sur ClawPack.

Notes :

- Seules les versions avec des tarballs npm-pack ClawPack téléversées sont listées.
- Les anciennes versions uniquement ZIP sont volontairement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des champs compatibles npm
  afin que les utilisateurs puissent pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de paquets à portée prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts de la tarball ClawPack téléversée pour les clients miroir npm.

Notes :

- Utilise le compartiment de débit de téléchargement.
- Les en-têtes de téléchargement incluent le SHA-256 ClawHub ainsi que les métadonnées npm integrity/shasum.
- Les contrôles de modération et d’accès aux paquets privés s’appliquent toujours.

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

Télécharge un ZIP de version de skill hébergé, ou renvoie un relais vers la source GitHub pour une
skill actuelle basée sur GitHub avec une analyse `clean` ou `suspicious` et sans version
hébergée.

Paramètres de requête :

- `slug` (obligatoire)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom d’étiquette (p. ex. `latest`)

Notes :

- Si ni `version` ni `tag` n’est fourni, la dernière version est utilisée.
- Les versions supprimées de façon réversible renvoient `410`.
- Les relais de skill basés sur GitHub ne transmettent ni ne mettent en miroir les octets. La réponse JSON
  inclut `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  et `archiveUrl` ; l’état d’analyse/actuel est une barrière et n’est pas inclus comme métadonnée de charge utile de succès.
- Les statistiques de téléchargement sont comptées comme identités uniques par jour UTC (`userId` lorsque le jeton API est valide, sinon IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison nécessitent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie le handle utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Préféré : `multipart/form-data` avec JSON `payload` + blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, l’API résout cet
  éditeur côté serveur et exige que l’acteur dispose d’un accès éditeur.
- Champ de charge utile facultatif : `migrateOwner`. Lorsque `true` avec `ownerHandle`, une
  skill existante peut être déplacée vers ce propriétaire si l’acteur est administrateur/propriétaire à la fois chez
  les éditeurs actuel et cible. Sans cette adhésion explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une version de code-plugin ou de bundle-plugin.

- Nécessite une authentification par jeton Bearer.
- Nécessite `multipart/form-data`.
- Les champs de formulaire autorisés sont `payload`, les blobs `files` répétés, ou une référence de tarball `clawpack`.
  `clawpack` peut être un blob `.tgz` ou un identifiant de stockage renvoyé par
  le flux upload-url. Les publications par storage-id préparé doivent également inclure le
  `clawpackUploadTicket` renvoyé avec cette URL de téléversement.
- Utilisez soit `files`, soit `clawpack`, jamais les deux dans la même requête.
- Les corps JSON et les métadonnées `payload.files` / `payload.artifact` fournies par l’appelant
  sont rejetés.
- Les requêtes de publication multipart directes sont plafonnées à 18 Mo. Les tarballs ClawPack peuvent
  utiliser le flux upload-url jusqu’au plafond de tarball de 120 Mo.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, seuls les administrateurs peuvent publier au nom de ce propriétaire.

Points clés de validation :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les paquets Plugin nécessitent `openclaw.plugin.json`. Les téléversements `.tgz` ClawPack doivent
  le contenir à `package/openclaw.plugin.json`.
- Les code plugins nécessitent `package.json`, les métadonnées du dépôt source, les métadonnées du commit source,
  les métadonnées du schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seuls l’éditeur de l’organisation `openclaw` et les éditeurs personnels des membres actuels de l’organisation `openclaw`
  peuvent publier sur le canal `official`.
- Les publications pour le compte d’autrui valident toujours l’éligibilité au canal officiel par rapport au compte propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Supprime de façon réversible / restaure une skill (propriétaire, modérateur ou administrateur).

Corps JSON facultatif :

```json
{ "reason": "Held for moderation pending legal review." }
```

Lorsqu’il est présent, `reason` est stocké comme note de modération de la skill et copié dans le journal d’audit.
Les suppressions réversibles initiées par le propriétaire réservent le slug pendant 30 jours, puis le slug peut être réclamé par
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

Réservé aux administrateurs. Garantit qu’un éditeur d’organisation existe pour un handle. Si le handle pointe encore vers un
ancien éditeur utilisateur/personnel partagé, le point de terminaison le migre d’abord vers un éditeur d’organisation.
Pour une organisation nouvellement créée, fournissez `memberHandle` ; l’administrateur agissant n’est pas ajouté comme membre.
`memberRole` vaut par défaut `owner`.

- Corps : `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Création authentifiée en libre-service d’un éditeur d’organisation. Crée un nouvel éditeur d’organisation et ajoute
l’appelant comme propriétaire. Ce point de terminaison ne migre pas les handles utilisateur/personnels existants et ne
marque pas l’éditeur comme fiable/officiel.

- Corps : `{ "handle": "opik", "displayName": "Opik" }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Renvoie `409` lorsque le handle est déjà utilisé par un éditeur, un utilisateur ou un éditeur personnel.

### `POST /api/v1/users/reserve`

Réservé aux administrateurs. Réserve les slugs racine et les noms de paquets pour un propriétaire légitime sans publier de
version. Les noms de paquets deviennent des paquets espaces réservés privés sans lignes de version, afin que le même
propriétaire puisse publier ultérieurement la véritable version code-plugin ou bundle-plugin sous ce nom.

- Corps : `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Réponse : `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Réservé aux administrateurs. Récupère un éditeur personnel pour un principal GitHub OAuth de remplacement vérifié
sans modifier les lignes de compte Convex Auth. La requête doit nommer les deux identifiants immuables de compte
fournisseur GitHub ; les handles modifiables ne sont utilisés que comme garde-fou destiné à l’opérateur.

Le point de terminaison utilise par défaut l’exécution à blanc. Appliquer la récupération nécessite `dryRun: false` et
`confirmIdentityVerified: true` après que le personnel a vérifié indépendamment la continuité entre les deux
principaux GitHub. La récupération échoue de manière fermée lorsque l’éditeur personnel actuel de l’utilisateur de destination
possède des skills, des packages ou des sources de skills GitHub.
La récupération migre aussi les anciens champs `ownerUserId` pour les skills de l’éditeur récupéré,
les alias de slug de skill, les packages, les avertissements de l’inspecteur de packages et les lignes de condensé de recherche dérivées afin que
les chemins de propriétaire direct concordent avec la nouvelle autorité d’éditeur. Une réservation active de pseudo protégé
pour le pseudo récupéré est aussi réattribuée à l’utilisateur de remplacement afin qu’une synchronisation ultérieure du profil
ne puisse pas restaurer l’autorité concurrente de l’ancien utilisateur. Chaque table principale est limitée à
100 lignes par transaction d’application ; les récupérations plus volumineuses doivent d’abord utiliser une migration de propriétaire pouvant reprendre.
Les sources de skills GitHub sont rattachées à l’éditeur et signalées comme vérifiées plutôt que réécrites.

- Corps : `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Réponse : `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Points de terminaison de gestion des slugs de propriétaire

- `POST /api/v1/skills/{slug}/rename`
  - Corps : `{ "newSlug": "new-canonical-slug" }`
  - Réponse : `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corps : `{ "targetSlug": "canonical-target-slug" }`
  - Réponse : `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notes :

- Les deux points de terminaison exigent une authentification par jeton d’API et ne fonctionnent que pour le propriétaire du skill.
- `rename` conserve le slug précédent comme alias de redirection.
- `merge` masque l’entrée source et redirige le slug source vers l’entrée cible.

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

Bannir un utilisateur et supprimer définitivement les skills qu’il possède (modérateur/admin uniquement).

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

Lever le bannissement d’un utilisateur et restaurer les skills éligibles (admin uniquement).

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

### `POST /api/v1/users/reclassify-ban`

Modifier le motif stocké pour un bannissement existant sans lever le bannissement ni restaurer
le contenu (admin uniquement). Utilise par défaut l’exécution à blanc, sauf si `dryRun` vaut `false`.

Corps :

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

ou

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Réponse :

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Modifier le rôle d’un utilisateur (admin uniquement).

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

Lister ou rechercher des utilisateurs (admin uniquement).

Paramètres de requête :

- `q` (facultatif) : requête de recherche
- `query` (facultatif) : alias de `q`
- `limit` (facultatif) : nombre maximal de résultats (20 par défaut, 200 maximum)

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

Ajouter/supprimer une étoile (mises en avant). Les deux points de terminaison sont idempotents.

Réponses :

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Points de terminaison CLI historiques (obsolètes)

Toujours pris en charge pour les anciennes versions de la CLI :

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consultez `DEPRECATIONS.md` pour le plan de suppression.

`POST /api/cli/upload-url` renvoie `uploadUrl` et `uploadTicket`. Les publications de packages
qui préparent une archive tar ClawPack doivent envoyer l’identifiant de stockage obtenu sous
`clawpack` et le ticket renvoyé sous `clawpackUploadTicket`.

## Découverte du registre (`/.well-known/clawhub.json`)

La CLI peut découvrir les paramètres de registre/authentification depuis le site :

- `/.well-known/clawhub.json` (JSON, recommandé)
- `/.well-known/clawdhub.json` (historique)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez, servez ce fichier (ou définissez explicitement `CLAWHUB_REGISTRY` ; ancien `CLAWDHUB_REGISTRY`).
