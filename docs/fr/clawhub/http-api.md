---
read_when:
    - Ajout/modification de points de terminaison
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (points de terminaison publics + CLI + authentification).
x-i18n:
    generated_at: "2026-07-04T17:56:52Z"
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

Les répertoires tiers peuvent utiliser les points de terminaison publics en lecture pour lister ou rechercher des skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, renvoyer les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/skills/<slug>`) et éviter de laisser entendre que ClawHub cautionne le site tiers. Ne tentez pas de dupliquer du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slug Web se résolvent entre les familles de registre, mais les clients d’API doivent utiliser
les URL canoniques renvoyées par les points de terminaison en lecture au lieu de reconstruire la précédence
des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : appliquées par IP.
- Requêtes authentifiées (jeton Bearer valide) : appliquées par compartiment utilisateur.
- Si le jeton est absent/invalide, le comportement revient à une application par IP.
- Les points de terminaison d’écriture authentifiés ne doivent pas renvoyer un simple `Unauthorized` lorsque
  le serveur connaît la raison. Les jetons manquants, les jetons invalides/révoqués et
  les comptes supprimés/bannis/désactivés doivent chacun recevoir un texte exploitable afin que les clients
  CLI puissent indiquer aux utilisateurs ce qui les a bloqués.

- Lecture : 3000/min par IP, 12000/min par clé
- Écriture : 300/min par IP, 3000/min par clé
- Téléchargement : 1200/min par IP, 6000/min par clé (points de terminaison de téléchargement)

En-têtes :

- Compatibilité ancienne : `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardisés : `RateLimit-Limit`, `RateLimit-Reset`
- Sur `429` : `X-RateLimit-Remaining: 0` et `RateLimit-Remaining: 0`
- Sur `429` : `Retry-After`

Sémantique des en-têtes :

- `X-RateLimit-Reset` : secondes absolues depuis l’époque Unix
- `RateLimit-Reset` : secondes avant réinitialisation (délai)
- `X-RateLimit-Remaining` / `RateLimit-Remaining` : budget restant exact lorsqu’il est présent.
  Les requêtes réussies réparties par shard omettent cet en-tête au lieu de renvoyer une valeur globale approximative.
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
- Si `Retry-After` est absent, utilisez `RateLimit-Reset` comme solution de repli (ou calculez à partir de `X-RateLimit-Reset`).

Source IP :

- Utilise les en-têtes IP client de confiance, y compris `cf-connecting-ip`, uniquement lorsque le
  déploiement active explicitement les en-têtes transférés de confiance.
- ClawHub utilise les en-têtes de transfert de confiance pour identifier les IP client à la périphérie.
- Si aucune IP client de confiance n’est disponible, les requêtes anonymes utilisent des compartiments de repli
  limités uniquement par type de limite de débit. Ces compartiments de repli n’incluent pas
  les chemins, slugs, noms de paquet, versions, chaînes de requête ou autres
  paramètres d’artefact fournis par l’appelant.

## Réponses d’erreur

Les réponses d’erreur publiques v1 sont en texte brut avec `content-type: text/plain; charset=utf-8`.
Cela inclut les échecs de validation (`400`), les ressources publiques manquantes (`404`), les échecs d’authentification et
d’autorisation (`401`/`403`), les limites de débit (`429`) et les téléchargements bloqués. Les clients
doivent lire le corps de la réponse comme une chaîne lisible par un humain. Les paramètres de requête inconnus sont
ignorés pour compatibilité, mais les paramètres de requête reconnus avec des valeurs invalides renvoient
`400`.

## Points de terminaison publics (sans authentification)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer sur les skills mis en avant
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspects (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias ancien de `nonSuspiciousOnly`

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

Remarques :

- Les résultats sont renvoyés par ordre de pertinence (similarité d’embedding + bonus pour correspondance exacte de jeton de slug/nom + faible a priori de popularité).
- La pertinence prime sur la popularité. Une correspondance précise avec un slug ou un jeton de nom d’affichage peut dépasser une correspondance plus lâche avec un engagement beaucoup plus fort.
- Le texte ASCII est découpé en jetons aux limites des mots et de la ponctuation. Par exemple, `personal-map` contient un jeton autonome `map`, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill`; rechercher `map` donne donc à `personal-map` une correspondance lexicale plus forte que `amap-jsapi-skill`.
- La popularité est mise à l’échelle logarithmique et plafonnée. Les skills à fort engagement peuvent être classés plus bas lorsque le texte de la requête correspond moins bien.
- Un état de modération suspect ou masqué peut retirer un skill de la recherche publique selon les filtres de l’appelant et l’état de modération actuel.

Conseils de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom d’affichage, le résumé et les tags. Utilisez un jeton de slug autonome uniquement lorsqu’il s’agit aussi d’une identité stable que vous souhaitez conserver.
- Ne renommez pas un slug simplement pour viser une requête, sauf si le nouveau slug est un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs condensés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution des anciennes URL et des installations qui se résolvent via le registre, mais le classement de recherche est basé sur les métadonnées canoniques du skill une fois le renommage indexé. Les statistiques existantes restent associées au skill.
- Si un skill est invisible de façon inattendue, vérifiez d’abord l’état de modération avec `clawhub inspect @owner/slug` en étant connecté avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `recommended` (alias : `default`), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), les anciens alias d’installation `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspects (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias ancien de `nonSuspiciousOnly`

Les valeurs `sort` invalides renvoient `400`.

Remarques :

- `recommended` utilise des signaux d’engagement et de récence.
- `trending` classe par installations au cours des 7 derniers jours (basé sur la télémétrie).
- `createdAt` est stable pour les crawls de nouveaux skills ; `updated` change lorsque des skills existants sont republiés.
- Lorsque `nonSuspiciousOnly=true`, les tris basés sur curseur peuvent renvoyer moins de `limit` éléments sur une page, car les skills suspects sont filtrés après la récupération de la page.
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

Remarques :

- Les anciens slugs créés par les flux de renommage/fusion de propriétaire se résolvent vers le skill canonique.
- `metadata.os` : restrictions d’OS déclarées dans le frontmatter du skill (par exemple `["macos"]`, `["linux"]`). `null` si non déclaré.
- `metadata.systems` : cibles système Nix (par exemple `["aarch64-darwin", "x86_64-linux"]`). `null` si non déclaré.
- `metadata` vaut `null` si le skill n’a pas de métadonnées de plateforme.
- `moderation` est inclus uniquement lorsque le skill est signalé ou lorsque le propriétaire le consulte.

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

Remarques :

- Les propriétaires et modérateurs peuvent accéder aux détails de modération pour les skills masqués.
- Les appelants publics obtiennent seulement `200` pour les skills visibles déjà signalés.
- Les preuves sont expurgées pour les appelants publics et n’incluent des extraits bruts que pour les propriétaires/modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signaler un skill pour examen par un modérateur. Les signalements se font au niveau du skill, peuvent être liés
à une version et alimentent la file des signalements de skills.

Authentification :

- Nécessite un jeton d’API.

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
pour masquer le skill dans le même workflow auditable.

### `GET /api/v1/skills/{slug}/versions`

Paramètres de requête :

- `limit` (facultatif) : entier
- `cursor` (facultatif) : curseur de pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Renvoie les métadonnées de version + la liste des fichiers.

- `version.security` inclut l’état de vérification d’analyse normalisé et les détails du scanner
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification d’analyse de sécurité pour une version de skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résoudre une version taguée (par exemple `latest`).

Remarques :

- Si ni `version` ni `tag` n’est fourni, utilise la dernière version.
- Inclut l’état de vérification normalisé ainsi que les détails propres au scanner.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un scanner a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané de modération actuel au niveau de la skill, dérivé de la dernière version.
- Lors de l’interrogation d’une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de traiter `moderation` et `security` comme relevant du même contexte de version.

### `POST /api/v1/skills/-/scan`

Point de terminaison authentifié de soumission pour les nouvelles tâches ClawScan.

Les analyses par téléversement local ne sont plus prises en charge. Les requêtes utilisant
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` renvoient `410`.

Les analyses publiées utilisent JSON :

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notes :

- Les charges utiles des requêtes d’analyse et les rapports téléchargeables expirent du magasin des requêtes d’analyse après la fenêtre de rétention.
- Les analyses publiées nécessitent un accès de gestion propriétaire/éditeur, ou une autorité de modérateur/administrateur de la plateforme.
- Les analyses publiées ne réécrivent les données que lorsque `update: true` et que l’analyse se termine avec succès.
- La réponse est `202` avec `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Les tâches d’analyse sont asynchrones. Les requêtes d’analyse manuelles sont prioritaires par rapport au travail normal de publication/remplissage rétroactif, mais leur achèvement dépend toujours de la disponibilité des workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Point de terminaison authentifié d’interrogation pour une analyse soumise.

- Renvoie l’état queued/running/succeeded/failed.
- Renvoie `queue.queuedAhead` et `queue.position` tant que la tâche est en file d’attente afin que les clients puissent afficher le nombre d’analyses manuelles prioritaires devant la requête. Les très grandes files sont plafonnées et signalées avec `queuedAheadIsEstimate: true`.
- Lorsqu’il est disponible, `report` contient les sections `clawscan`, `skillspector`, `staticAnalysis` et `virustotal`.
- Les tâches d’analyse échouées renvoient `status: "failed"` avec `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Point de terminaison authentifié d’archive de rapport.

- Nécessite une analyse réussie ; les analyses non terminales renvoient `409`.
- Renvoie un ZIP avec `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Point de terminaison authentifié d’archive de rapport stockée pour les versions soumises.

- Nécessite un accès de gestion propriétaire/éditeur à la skill ou au plugin, ou une autorité de modérateur/administrateur de la plateforme.
- Renvoie les résultats d’analyse stockés pour la version exacte soumise, y compris les versions bloquées ou masquées.
- `kind` vaut par défaut `skill` ; utilisez `kind=plugin` pour les analyses de plugin/package.
- Renvoie la même forme de ZIP que les téléchargements de requêtes d’analyse.

### `POST /api/v1/skills/-/scan/batch`

Route canonique de nouvelle analyse par lot réservée aux administrateurs. Elle accepte la même forme de charge utile que l’ancienne route `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonique d’état de lot réservée aux administrateurs. Elle accepte `{ "jobIds": ["..."] }` et renvoie les mêmes compteurs agrégés que l’ancienne route `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Renvoie l’enveloppe de vérification de Skill Card utilisée par `clawhub skill verify`.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version étiquetée (par exemple `latest`).

Notes :

- `ok` vaut `true` uniquement lorsque la version sélectionnée possède une Skill Card générée, n’est pas bloquée comme malware par la modération, et que la vérification ClawScan est propre.
- L’identité de la skill, l’identité de l’éditeur et les métadonnées de la version sélectionnée sont des champs de premier niveau de l’enveloppe (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) afin que l’automatisation shell puisse les lire sans décompresser d’enveloppes imbriquées.
- `security` est le verdict ClawScan/sécurité de premier niveau. L’automatisation doit se baser sur `ok`, `decision`, `reasons` et `security.status`.
- `security.signals` contient des éléments probants de scanner, tels que `staticScan`, `virusTotal` et `skillSpector`.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais le scanner d’existence du registre de dépendances est retiré et cette clé est toujours `null`.
- `provenance` vaut `server-resolved-github-import` uniquement lorsque ClawHub a résolu et stocké un dépôt/ref/commit/chemin GitHub pendant la publication ou l’importation ; sinon, elle vaut `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Renvoie les verdicts de sécurité compacts actuels pour des versions exactes de skills. Ce
point de terminaison de collection est destiné aux clients qui savent déjà quelles versions
de skills ClawHub installées ils doivent afficher, comme OpenClaw Control UI.

Requête :

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notes :

- `items` doit contenir 1 à 100 paires `{ slug, version }` uniques.
- Les résultats sont par élément ; une skill ou une version manquante ne fait pas échouer toute la réponse.
- La réponse concerne uniquement la sécurité. Elle n’inclut pas les données de Skill Card, l’état de carte générée, les listes de fichiers d’artefacts ni les charges utiles détaillées des scanners.
- `security.signals` contient uniquement des éléments probants de niveau état ; utilisez `/scan` ou la page security-audit de ClawHub pour obtenir tous les détails des scanners.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais le scanner d’existence du registre de dépendances est retiré et cette clé est toujours `null`.
- L’absence de Skill Card n’affecte pas les valeurs `ok`, `decision` ou `reasons` de ce point de terminaison ; les clients doivent lire localement le fichier `skill-card.md` installé lorsqu’ils ont besoin du contenu de la carte.
- Utilisez `/verify` lorsque vous avez besoin de l’enveloppe de vérification de Skill Card pour une seule skill, `/card` lorsque vous avez besoin du Markdown de carte généré, et `/scan` lorsque vous avez besoin de données détaillées des scanners.

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
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou points de terminaison de packages avec
  `family=code-plugin`/`family=bundle-plugin`). Les catégories contrôlées et
  les alias de filtre hérités de v1 sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs invalides pour `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées de Skills restent adossées au registre de Skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux versions de code-plugin et de bundle-plugin.
- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent voir les packages privés des éditeurs auxquels ils appartiennent dans les résultats de liste/recherche.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.

### `GET /api/v1/packages/search`

Recherche de catalogue unifiée dans les Skills et les packages de plugins.

Paramètres de requête :

- `q` (obligatoire) : chaîne de recherche
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de plugin. Pris en charge uniquement lorsque la
  requête est limitée aux packages de plugins. Les catégories contrôlées et les alias de filtre
  hérités de v1 sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs invalides pour `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- Les appelants anonymes ne voient que les canaux de packages publics.
- Les appelants authentifiés peuvent rechercher les packages privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les packages que l’appelant authentifié peut lire.

### `GET /api/v1/plugins`

Navigation dans le catalogue réservé aux plugins, couvrant les packages code-plugin et bundle-plugin.

Paramètres de requête :

- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `recommended` (par défaut), `trending`, `downloads`, `updated`, alias hérité `installs`
- `category` (facultatif) : filtre de catégorie de plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Les alias de filtre hérités de v1 restent acceptés sur les points de terminaison de lecture :

- `mcp-tooling`, `data` et `automation` correspondent à `tools`.
- `observability` et `deployment` correspondent à `gateway`.
- `dev-tools` correspond à `runtime`.

`trending` est un classement des installations/téléchargements sur sept jours et n’utilise pas les totaux cumulés.
Sur le point de terminaison unifié `/api/v1/packages`, il est réservé aux plugins ; utilisez
`/api/v1/skills?sort=trending` pour le catalogue de Skills.

Les alias hérités ne sont pas acceptés comme valeurs de catégorie stockées ou déclarées par l’auteur.

### `GET /api/v1/skills/export`

Export en masse des dernières Skills publiques pour analyse hors ligne.

Authentification :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (obligatoire) : borne inférieure en millisecondes Unix pour le champ `updatedAt` de la Skill.
- `endDate` (obligatoire) : borne supérieure en millisecondes Unix pour le champ `updatedAt` de la Skill.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination issu de la réponse précédente.

Réponse :

- Corps : archive ZIP.
- Chaque Skill exportée est enracinée à `{publisher}/{slug}/`.
- Les Skills hébergées incluent les derniers fichiers de version stockés et sont listées dans
  `_manifest.json` avec `sourceRef: "public-clawhub"`.
- Les Skills actuelles adossées à GitHub avec une analyse `clean` ou `suspicious` incluent
  `_source_handoff.json` avec `sourceRef: "public-github"`, dépôt, commit, chemin,
  hachage de contenu et URL d’archive. Elles n’incluent pas les fichiers sources hébergés par ClawHub.
- Chaque Skill inclut `_export_skill_meta.json`.
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

Export groupé des dernières versions publiques de plugins pour analyse hors ligne.

Authentification :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (obligatoire) : borne inférieure en millisecondes Unix pour le `updatedAt` du plugin.
- `endDate` (obligatoire) : borne supérieure en millisecondes Unix pour le `updatedAt` du plugin.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.
- `family` (facultatif) : `code-plugin` ou `bundle-plugin`. L’omission signifie les deux
  familles de plugins.

Réponse :

- Corps : archive ZIP.
- Chaque plugin exporté est enraciné à `{family}/{packageName}/`.
- Chaque plugin exporté inclut les fichiers stockés de la dernière version.
- Les métadonnées d’export par plugin sont stockées à
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` est toujours inclus à la racine du ZIP.
- `_errors.json` est inclus lorsque des plugins ou fichiers individuels n’ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Recherche limitée aux plugins dans les paquets code-plugin et bundle-plugin.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1-100)
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Remarques :

- Les alias de filtres hérités v1 documentés sous `GET /api/v1/plugins` sont également
  acceptés.
- Le filtrage par catégorie est un véritable filtre d’API adossé aux lignes de résumé
  de catégorie de plugin, et non une réécriture de requête de recherche.
- Les résultats sont renvoyés par ordre de pertinence et ne sont actuellement pas paginés.
- Les contrôles de tri de l’interface navigateur pour la recherche de plugins réordonnent les résultats de pertinence chargés,
  conformément au comportement actuel de navigation de `/skills`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du paquet.

Remarques :

- Les Skills peuvent aussi être résolues via cette route dans le catalogue unifié.
- Les paquets privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Supprime de manière réversible un paquet et toutes ses versions.

Remarques :

- Nécessite un jeton d’API pour le propriétaire du paquet, un propriétaire/administrateur de l’éditeur d’organisation,
  un modérateur de plateforme ou un administrateur de plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Remarques :

- Les paquets privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version de paquet, y compris les métadonnées de fichiers, la compatibilité,
la vérification, les métadonnées d’artefact et les données d’analyse.

Remarques :

- `version.artifact.kind` vaut `legacy-zip` pour les anciennes archives de paquets ou
  `npm-pack` pour les versions basées sur ClawPack.
- Les versions ClawPack incluent les champs compatibles npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash` est une métadonnée de compatibilité obsolète pour les anciens clients. Elle
  hache les octets ZIP exacts renvoyés par `/api/v1/packages/{name}/download`.
  Les clients modernes doivent utiliser `version.artifact.sha256`, qui identifie
  l’artefact de version canonique.
- `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont
  inclus lorsque des données d’analyse existent.
- Les paquets privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Renvoie le résumé exact de sécurité et de confiance de la version du paquet pour les clients
d’installation. Il s’agit de la surface de consommation publique d’OpenClaw pour décider si une
version résolue peut être installée.

Authentification :

- Point de terminaison de lecture public. Aucun jeton de propriétaire, d’éditeur, de modérateur ou d’administrateur n’est
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
  l’artefact de version.
- `trust.scanStatus` est le statut de confiance effectif dérivé des entrées du scanner
  et de la modération manuelle de la version.
- `trust.moderationState` est nullable. Il vaut `null` lorsqu’aucune modération manuelle de version
  n’existe.
- `trust.blockedFromDownload` est le signal de blocage de l’installation. OpenClaw et les autres
  clients d’installation doivent bloquer l’installation lorsque cette valeur vaut `true` au lieu de
  redériver les règles de blocage à partir des champs de scanner ou de modération.
- `trust.reasons` est la liste d’explications destinée à l’utilisateur et à l’audit. Les codes de raison
  sont des chaînes stables et compactes telles que `manual:quarantined`, `scan:malicious`,
  et `package:malicious`.
- `trust.pending` signifie qu’une ou plusieurs entrées de confiance sont encore en attente d’achèvement.
- `trust.stale` signifie que le résumé de confiance a été calculé à partir d’entrées obsolètes et
  doit être considéré comme nécessitant une actualisation avant une décision d’autorisation à haute confiance.

Remarques :

- Ce point de terminaison est exact à la version. Les clients doivent l’appeler après avoir résolu la
  version du paquet qu’ils prévoient d’installer, pas seulement après avoir lu les dernières
  métadonnées du paquet.
- Les paquets privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.
- Ce point de terminaison est volontairement plus restreint que les points de terminaison de modération
  propriétaire/modérateur. Il expose la décision d’installation et l’explication publique, pas
  les identités des rapporteurs, les corps de rapports, les preuves privées ni les chronologies d’examen
  internes.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites du résolveur d’artefact pour une version de paquet.

Remarques :

- Les versions de paquets héritées renvoient un artefact `legacy-zip` et une URL ZIP héritée
  `downloadUrl`.
- Les versions ClawPack renvoient un artefact `npm-pack`, des champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface de résolution OpenClaw ; elle évite de deviner le format d’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artefact de version via le chemin de résolution explicite.

Remarques :

- Les versions ClawPack diffusent les octets `.tgz` npm-pack exacts téléversés.
- Les versions ZIP héritées redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour une consommation future par OpenClaw.

Les contrôles de préparation couvrent :

- statut de canal officiel
- disponibilité de la dernière version
- disponibilité de l’artefact ClawPack npm-pack
- empreinte de l’artefact
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

Point de terminaison modérateur pour lister les lignes de migration de plugins OpenClaw officiels.

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

Corps de requête :

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

- `bundledPluginId` est normalisé en minuscules et constitue la clé upsert stable.
- `packageName` est normalisé comme nom npm ; le paquet peut être absent pour les migrations
  planifiées.
- Cela suit uniquement l’état de préparation de la migration. Cela ne modifie pas OpenClaw et ne génère pas
  de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison modérateur/administrateur pour les files d’examen des versions de paquets.

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
- `all` : toute version avec un remplacement manuel, un état d’analyse non propre ou un rapport de paquet.

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

Signaler un paquet pour examen par un modérateur. Les signalements sont au niveau du paquet, éventuellement
liés à une version. Ils alimentent la file de modération, mais ne masquent pas automatiquement et ne
bloquent pas les téléchargements par eux-mêmes ; les modérateurs doivent utiliser la modération de version pour
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

Point de terminaison modérateur/admin pour la réception des signalements de paquets.

Authentification :

- Nécessite un jeton d’API pour un utilisateur modérateur ou admin.

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
  un utilisateur admin.

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

Point de terminaison modérateur/admin pour résoudre ou rouvrir des signalements de paquets.

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
`finalAction: "revoke"` avec un signalement confirmé pour appliquer la modération de la version dans le
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

Point de terminaison modérateur/admin pour l’examen des versions de paquets.

Requête :

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué en attente de suivi.
- `revoked` : bloqué après qu’une version a été précédemment approuvée.

Les versions mises en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque modification écrit une entrée dans le journal d’audit.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu texte brut d’un fichier de paquet.

Paramètres de requête :

- `path` (requis)
- `version` (facultatif)
- `tag` (facultatif)

Notes :

- Utilise par défaut la dernière version.
- Utilise le compartiment de limitation de lecture, pas celui de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille de fichier : 200 Ko.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les versions malveillantes peuvent toutefois être retenues ailleurs.
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

Renvoie un packument compatible npm pour les versions de paquets basées sur ClawPack.

Notes :

- Seules les versions avec des tarballs npm-pack ClawPack téléversées sont listées.
- Les versions héritées uniquement ZIP sont intentionnellement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des
  champs compatibles npm afin que les utilisateurs puissent faire pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de paquets avec portée prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts du tarball ClawPack téléversé pour les clients du miroir npm.

Notes :

- Utilise le compartiment de limitation des téléchargements.
- Les en-têtes de téléchargement incluent le SHA-256 ClawHub ainsi que les métadonnées npm integrity/shasum.
- Les contrôles de modération et d’accès aux paquets privés s’appliquent toujours.

### `GET /api/v1/resolve`

Utilisé par la CLI pour associer une empreinte locale à une version connue.

Paramètres de requête :

- `slug` (requis)
- `hash` (requis) : sha256 hexadécimal de 64 caractères de l’empreinte du bundle

Réponse :

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Télécharge le ZIP d’une version de Skill hébergée, ou renvoie un transfert vers une source GitHub pour une
Skill actuelle basée sur GitHub avec une analyse `clean` ou `suspicious` et aucune version
hébergée.

Paramètres de requête :

- `slug` (requis)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom de tag (par exemple `latest`)

Notes :

- Si ni `version` ni `tag` n’est fourni, la dernière version est utilisée.
- Les versions supprimées de manière réversible renvoient `410`.
- Les transferts de Skills basées sur GitHub ne proxifient ni ne mettent en miroir les octets. La réponse JSON
  inclut `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  et `archiveUrl` ; l’état d’analyse/actuel sert de garde et n’est pas inclus comme métadonnée de charge utile
  de réussite.
- Les statistiques de téléchargement sont comptées comme identités uniques par jour UTC (`userId` lorsque le jeton d’API est valide, sinon l’adresse IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison exigent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie le handle de l’utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Préféré : `multipart/form-data` avec JSON `payload` + blobs `files[]`.
- Un corps JSON avec `files` (basés sur `storageId`) est également accepté.
- Champ facultatif de charge utile : `ownerHandle`. Lorsqu’il est présent, l’API résout cet
  éditeur côté serveur et exige que l’acteur ait accès à l’éditeur.
- Champ facultatif de charge utile : `migrateOwner`. Lorsqu’il vaut `true` avec `ownerHandle`, une
  Skill existante peut être déplacée vers ce propriétaire si l’acteur est admin/propriétaire à la fois sur
  l’éditeur actuel et sur l’éditeur cible. Sans cette acceptation explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une version de code-plugin ou de bundle-plugin.

- Nécessite une authentification par jeton Bearer.
- Nécessite `multipart/form-data`.
- Les champs de formulaire autorisés sont `payload`, des blobs `files` répétés, ou une référence de tarball `clawpack`.
  `clawpack` peut être un blob `.tgz` ou un identifiant de stockage renvoyé par
  le flux upload-url. Les publications d’identifiant de stockage préparé doivent également inclure le
  `clawpackUploadTicket` renvoyé avec cette URL de téléversement.
- Utilisez soit `files`, soit `clawpack`, jamais les deux dans la même requête.
- Les corps JSON et les métadonnées `payload.files` / `payload.artifact`
  fournies par l’appelant sont rejetés.
- Les requêtes de publication multipart directes sont plafonnées à 18 Mo. Les tarballs ClawPack peuvent
  utiliser le flux upload-url jusqu’au plafond de tarball de 120 Mo.
- Champ facultatif de charge utile : `ownerHandle`. Lorsqu’il est présent, seuls les admins peuvent publier au nom de ce propriétaire.

Points clés de validation :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les paquets de Plugin exigent `openclaw.plugin.json`. Les téléversements ClawPack `.tgz` doivent
  le contenir à `package/openclaw.plugin.json`.
- Les Plugins de code exigent `package.json`, les métadonnées du dépôt source, les métadonnées du commit source,
  les métadonnées de schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seuls l’éditeur d’organisation `openclaw` et les éditeurs personnels des membres actuels de l’organisation `openclaw`
  peuvent publier sur le canal `official`.
- Les publications pour le compte d’un tiers valident toujours l’éligibilité au canal officiel par rapport au compte propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Suppression réversible / restauration d’une Skill (propriétaire, modérateur ou admin).

Corps JSON facultatif :

```json
{ "reason": "Held for moderation pending legal review." }
```

Lorsqu’elle est présente, `reason` est stockée comme note de modération de la Skill et copiée dans le journal d’audit.
Les suppressions réversibles initiées par le propriétaire réservent le slug pendant 30 jours, puis le slug peut être revendiqué par
un autre éditeur. La réponse de suppression inclut `slugReservedUntil` lorsque cette expiration s’applique.
Les masquages par modérateur/admin et les suppressions de sécurité n’expirent pas de cette manière.

Réponse de suppression :

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Codes d’état :

- `200` : ok
- `401` : non autorisé
- `403` : interdit
- `404` : Skill/utilisateur introuvable
- `500` : erreur interne du serveur

### `POST /api/v1/users/publisher`

Réservé aux admins. Garantit qu’un éditeur d’organisation existe pour un handle. Si le handle pointe encore vers un
utilisateur/éditeur personnel partagé hérité, le point de terminaison le migre d’abord vers un éditeur d’organisation.
Pour une organisation nouvellement créée, fournissez `memberHandle` ; l’admin agissant n’est pas ajouté comme membre.
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

Réservé aux admins. Réserve des slugs racine et des noms de paquets pour un propriétaire légitime sans publier de
version. Les noms de paquets deviennent des paquets espaces réservés privés sans ligne de version, afin que le même
propriétaire puisse publier plus tard la véritable version code-plugin ou bundle-plugin sous ce nom.

- Corps : `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Réponse : `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Réservé aux admins. Récupère un éditeur personnel pour un principal GitHub OAuth de remplacement vérifié
sans modifier les lignes de compte Convex Auth. La requête doit nommer les deux identifiants immuables de compte
fournisseur GitHub ; les handles mutables ne sont utilisés que comme garde visible par l’opérateur.

Le point de terminaison utilise par défaut la simulation. L’application de la récupération nécessite `dryRun: false` et
`confirmIdentityVerified: true` après que le personnel a vérifié indépendamment la continuité entre les deux
principaux GitHub. La récupération échoue en mode fermé lorsque l’éditeur personnel actuel de l’utilisateur de destination
possède des Skills, des packages ou des sources de Skills GitHub.
La récupération migre également les champs hérités `ownerUserId` pour les Skills de l’éditeur récupéré,
les alias de slug de Skill, les packages, les avertissements de l’inspecteur de packages et les lignes de condensé de recherche dérivées afin que
les chemins de propriétaire direct concordent avec la nouvelle autorité de l’éditeur. Une réservation active de handle protégé
pour le handle récupéré est également réassignée à l’utilisateur de remplacement afin que la synchronisation ultérieure
du profil ne puisse pas restaurer l’autorité concurrente de l’ancien utilisateur. Chaque table principale est limitée à
100 lignes par transaction d’application ; les récupérations plus volumineuses doivent d’abord utiliser une migration de propriétaire reprenable.
Les sources de Skills GitHub sont limitées à l’éditeur et signalées comme vérifiées plutôt que réécrites.

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

- Les deux points de terminaison nécessitent une authentification par jeton d’API et fonctionnent uniquement pour le propriétaire du Skill.
- `rename` conserve le slug précédent comme alias de redirection.
- `merge` masque la fiche source et redirige le slug source vers la fiche cible.

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

Bannir un utilisateur et supprimer définitivement les Skills dont il est propriétaire (modérateur/admin uniquement).

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

Débannir un utilisateur et restaurer les Skills éligibles (admin uniquement).

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

Modifier la raison stockée d’un bannissement existant sans débannir ni restaurer
le contenu (admin uniquement). Utilise par défaut la simulation sauf si `dryRun` vaut `false`.

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
- `limit` (facultatif) : résultats maximum (20 par défaut, 200 maximum)

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

## Points de terminaison CLI hérités (obsolètes)

Toujours pris en charge pour les anciennes versions de la CLI :

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consultez `DEPRECATIONS.md` pour le plan de suppression.

`POST /api/cli/upload-url` renvoie `uploadUrl` et `uploadTicket`. Les publications de packages
qui préparent une archive tar ClawPack doivent envoyer l’identifiant de stockage obtenu comme
`clawpack` et le ticket renvoyé comme `clawpackUploadTicket`.

## Découverte du registre (`/.well-known/clawhub.json`)

La CLI peut découvrir les paramètres de registre/authentification à partir du site :

- `/.well-known/clawhub.json` (JSON, privilégié)
- `/.well-known/clawdhub.json` (hérité)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez, servez ce fichier (ou définissez explicitement `CLAWHUB_REGISTRY` ; anciennement `CLAWDHUB_REGISTRY`).
