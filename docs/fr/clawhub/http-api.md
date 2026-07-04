---
read_when:
    - Ajout/modification d’endpoints
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (public + points de terminaison CLI + authentification).
x-i18n:
    generated_at: "2026-07-04T10:37:41Z"
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
Les anciens chemins `/api/...` et `/api/cli/...` restent disponibles pour la compatibilité (voir `DEPRECATIONS.md`).
OpenAPI : `/api/v1/openapi.json`.

## Réutilisation du catalogue public

Les répertoires tiers peuvent utiliser les points de terminaison publics en lecture pour lister ou rechercher des skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, renvoyer les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/skills/<slug>`) et éviter de suggérer une approbation de ClawHub pour le site tiers. N’essayez pas de répliquer du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slug Web se résolvent entre les familles de registres, mais les clients API doivent utiliser
les URL canoniques renvoyées par les points de terminaison en lecture au lieu de reconstruire la priorité
des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : appliquées par IP.
- Requêtes authentifiées (jeton Bearer valide) : appliquées par compartiment utilisateur.
- Si le jeton est absent ou invalide, le comportement revient à l’application par IP.
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
  Les requêtes réussies fragmentées omettent cet en-tête au lieu de renvoyer une valeur globale approximative.
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
- Utilisez un backoff avec jitter pour éviter les nouvelles tentatives synchronisées.
- Si `Retry-After` est absent, utilisez `RateLimit-Reset` comme solution de repli (ou calculez à partir de `X-RateLimit-Reset`).

Source IP :

- Utilise les en-têtes d’IP client de confiance, y compris `cf-connecting-ip`, uniquement lorsque le
  déploiement active explicitement les en-têtes transférés de confiance.
- ClawHub utilise les en-têtes de transfert de confiance pour identifier les IP clientes en périphérie.
- Si aucune IP client de confiance n’est disponible, les requêtes anonymes utilisent des compartiments de repli
  limités uniquement au type de limite de débit. Ces compartiments de repli n’incluent pas
  les chemins, slugs, noms de paquets, versions, chaînes de requête ou autres
  paramètres d’artefact fournis par l’appelant.

## Réponses d’erreur

Les réponses d’erreur publiques v1 sont en texte brut avec `content-type: text/plain; charset=utf-8`.
Cela inclut les échecs de validation (`400`), les ressources publiques manquantes (`404`), les échecs
d’authentification et d’autorisation (`401`/`403`), les limites de débit (`429`) et les téléchargements bloqués. Les clients
doivent lire le corps de la réponse comme une chaîne lisible par un humain. Les paramètres de requête inconnus sont
ignorés pour la compatibilité, mais les paramètres de requête reconnus avec des valeurs invalides renvoient
`400`.

## Points de terminaison publics (sans authentification)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer sur les skills mis en avant
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspects (`flagged.suspicious`)
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

- Les résultats sont renvoyés par ordre de pertinence (similarité d’embedding + boosts sur les jetons exacts de slug/nom + un faible prior de popularité).
- La pertinence est plus forte que la popularité. Une correspondance précise de slug ou de jeton de nom d’affichage peut dépasser une correspondance plus approximative avec un engagement beaucoup plus fort.
- Le texte ASCII est segmenté sur les limites de mots et de ponctuation. Par exemple, `personal-map` contient un jeton autonome `map`, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill` ; rechercher `map` donne donc à `personal-map` une correspondance lexicale plus forte que `amap-jsapi-skill`.
- La popularité est mise à l’échelle logarithmique et plafonnée. Les skills avec un fort engagement peuvent être moins bien classés lorsque le texte de requête correspond moins bien.
- Un état de modération suspect ou masqué peut retirer une skill de la recherche publique selon les filtres de l’appelant et l’état de modération actuel.

Conseils de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom d’affichage, le résumé et les tags. Utilisez un jeton de slug autonome uniquement lorsqu’il s’agit aussi d’une identité stable que vous souhaitez conserver.
- Ne renommez pas un slug uniquement pour cibler une requête, sauf si le nouveau slug est un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs condensés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution pour les anciennes URL et les installations qui se résolvent via le registre, mais le classement de recherche repose sur les métadonnées canoniques de la skill après indexation du renommage. Les statistiques existantes restent associées à la skill.
- Si une skill est invisible de manière inattendue, vérifiez d’abord l’état de modération avec `clawhub inspect @owner/slug` en étant connecté avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `recommended` (alias : `default`), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), les alias d’installation hérités `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les skills suspects (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : alias hérité de `nonSuspiciousOnly`

Les valeurs `sort` invalides renvoient `400`.

Notes :

- `recommended` utilise des signaux d’engagement et de récence.
- `trending` classe selon les installations des 7 derniers jours (basé sur la télémétrie).
- `createdAt` est stable pour les crawls de nouvelles skills ; `updated` change lorsque des skills existantes sont republiées.
- Lorsque `nonSuspiciousOnly=true`, les tris basés sur un curseur peuvent renvoyer moins de `limit` éléments sur une page, car les skills suspectes sont filtrées après récupération de la page.
- Utilisez `nextCursor` pour continuer la pagination lorsqu’il est présent. Une page courte ne signifie pas à elle seule la fin des résultats.

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

- Les anciens slugs créés par les flux de renommage/fusion de propriétaire se résolvent vers la skill canonique.
- `metadata.os` : restrictions d’OS déclarées dans le frontmatter de la skill (par exemple `["macos"]`, `["linux"]`). `null` si non déclaré.
- `metadata.systems` : cibles système Nix (par exemple `["aarch64-darwin", "x86_64-linux"]`). `null` si non déclaré.
- `metadata` vaut `null` si la skill n’a aucune métadonnée de plateforme.
- `moderation` est inclus uniquement lorsque la skill est signalée ou que le propriétaire la consulte.

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

- Les propriétaires et les modérateurs peuvent accéder aux détails de modération des skills masquées.
- Les appelants publics ne reçoivent `200` que pour les skills visibles déjà signalées.
- Les preuves sont expurgées pour les appelants publics et n’incluent des extraits bruts que pour les propriétaires/modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signaler une skill pour examen par un modérateur. Les signalements sont au niveau de la skill, éventuellement liés
à une version, et alimentent la file des signalements de skills.

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

Point de terminaison modérateur/admin pour résoudre ou rouvrir des signalements de skills.

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

- `version.security` inclut l’état de vérification de scan normalisé et les détails du scanner
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification de scan de sécurité pour une version de skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résoudre une version taguée (par exemple `latest`).

Notes :

- Si ni `version` ni `tag` n’est fourni, utilise la dernière version.
- Inclut l’état de vérification normalisé ainsi que les détails propres à l’analyseur.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un analyseur a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané actuel de modération au niveau du skill, dérivé de la dernière version.
- Lors d’une requête sur une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de traiter `moderation` et `security` comme appartenant au même contexte de version.

### `POST /api/v1/skills/-/scan`

Point de terminaison de soumission authentifié pour les nouvelles tâches ClawScan.

Les analyses de téléversements locaux ne sont plus prises en charge. Les requêtes utilisant
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` renvoient `410`.

Les analyses publiées utilisent JSON :

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Remarques :

- Les charges utiles de requête d’analyse et les rapports téléchargeables expirent du magasin des requêtes d’analyse après la fenêtre de rétention.
- Les analyses publiées nécessitent un accès de gestion propriétaire/éditeur, ou une autorité de modérateur/administrateur de la plateforme.
- Les analyses publiées réécrivent les résultats uniquement lorsque `update: true` et que l’analyse se termine avec succès.
- La réponse est `202` avec `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Les tâches d’analyse sont asynchrones. Les requêtes d’analyse manuelles sont prioritaires par rapport au travail normal de publication/remplissage rétroactif, mais leur achèvement dépend toujours de la disponibilité des workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Point de terminaison d’interrogation authentifié pour une analyse soumise.

- Renvoie l’état queued/running/succeeded/failed.
- Renvoie `queue.queuedAhead` et `queue.position` pendant que la requête est en file d’attente afin que les clients puissent afficher combien d’analyses manuelles prioritaires la précèdent. Les très grandes files sont bornées et signalées avec `queuedAheadIsEstimate: true`.
- Lorsqu’il est disponible, `report` contient les sections `clawscan`, `skillspector`, `staticAnalysis` et `virustotal`.
- Les tâches d’analyse échouées renvoient `status: "failed"` avec `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Point de terminaison authentifié d’archive de rapport.

- Nécessite une analyse réussie ; les analyses non terminales renvoient `409`.
- Renvoie un ZIP avec `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Point de terminaison authentifié d’archive de rapport stocké pour les versions soumises.

- Nécessite un accès de gestion propriétaire/éditeur au skill ou au Plugin, ou une autorité de modérateur/administrateur de la plateforme.
- Renvoie les résultats d’analyse stockés pour la version soumise exacte, y compris les versions bloquées ou masquées.
- `kind` vaut par défaut `skill` ; utilisez `kind=plugin` pour les analyses de Plugin/package.
- Renvoie la même forme de ZIP que les téléchargements de requêtes d’analyse.

### `POST /api/v1/skills/-/scan/batch`

Route canonique de nouvelle analyse par lot réservée aux administrateurs. Elle accepte la même forme de charge utile que l’ancienne route `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonique d’état de lot réservée aux administrateurs. Elle accepte `{ "jobIds": ["..."] }` et renvoie les mêmes compteurs agrégés que l’ancienne route `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Renvoie l’enveloppe de vérification Skill Card utilisée par `clawhub skill verify`.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version étiquetée (par exemple `latest`).

Remarques :

- `ok` vaut `true` uniquement lorsque la version sélectionnée possède une Skill Card générée, n’est pas bloquée comme logiciel malveillant par la modération et que la vérification ClawScan est propre.
- L’identité du skill, l’identité de l’éditeur et les métadonnées de la version sélectionnée sont des champs de premier niveau de l’enveloppe (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) afin que l’automatisation shell puisse les lire sans décompresser d’enveloppes imbriquées.
- `security` est le verdict ClawScan/sécurité de premier niveau. L’automatisation doit se baser sur `ok`, `decision`, `reasons` et `security.status`.
- `security.signals` contient les preuves d’analyseur à l’appui, comme `staticScan`, `virusTotal` et `skillSpector`.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais l’analyseur d’existence dans le registre de dépendances est retiré et cette clé vaut toujours `null`.
- `provenance` vaut `server-resolved-github-import` uniquement lorsque ClawHub a résolu et stocké un dépôt/ref/commit/chemin GitHub lors de la publication ou de l’importation ; sinon, il vaut `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Renvoie les verdicts de sécurité compacts actuels pour des versions exactes de skills. Ce
point de terminaison de collection est destiné aux clients qui savent déjà quelles versions de Skills
ClawHub installées ils doivent afficher, comme OpenClaw Control UI.

Requête :

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Remarques :

- `items` doit contenir 1 à 100 paires `{ slug, version }` uniques.
- Les résultats sont fournis par élément ; un skill ou une version manquants ne font pas échouer toute la réponse.
- La réponse concerne uniquement la sécurité. Elle n’inclut pas les données de Skill Card, l’état de carte générée, les listes de fichiers d’artefacts ni les charges utiles détaillées des analyseurs.
- `security.signals` contient uniquement des preuves à l’appui au niveau de l’état ; utilisez `/scan` ou la page d’audit de sécurité ClawHub pour obtenir tous les détails des analyseurs.
- `security.signals.dependencyRegistry` est conservé pour la compatibilité de réponse v1, mais l’analyseur d’existence dans le registre de dépendances est retiré et cette clé vaut toujours `null`.
- L’absence de Skill Card n’affecte pas les champs `ok`, `decision` ou `reasons` de ce point de terminaison ; les clients doivent lire localement le fichier `skill-card.md` installé lorsqu’ils ont besoin du contenu de la carte.
- Utilisez `/verify` lorsque vous avez besoin de l’enveloppe de vérification Skill Card d’un seul skill, `/card` lorsque vous avez besoin du Markdown de carte généré, et `/scan` lorsque vous avez besoin de données détaillées d’analyseur.

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

- Skills
- Plugins de code
- Plugins groupés

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `updated` (par défaut), `recommended`, `trending`, `downloads`, alias historique `installs`
- `category` (facultatif) : filtre de catégorie de Plugin. Pris en charge uniquement lorsque la
  requête est limitée aux paquets de Plugins (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou aux points de terminaison de paquets avec
  `family=code-plugin`/`family=bundle-plugin`). Les catégories contrôlées et
  les alias historiques de filtre v1 sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées de Skills restent adossées au registre de Skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux versions de Plugins de code et de Plugins groupés.
- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent voir les paquets privés des éditeurs auxquels ils appartiennent dans les résultats de liste/recherche.
- `channel=private` renvoie uniquement les paquets que l’appelant authentifié peut lire.

### `GET /api/v1/packages/search`

Recherche de catalogue unifiée dans les Skills et les paquets de Plugins.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de Plugin. Pris en charge uniquement lorsque la
  requête est limitée aux paquets de Plugins. Les catégories contrôlées et les alias
  historiques de filtre v1 sont documentés sous `GET /api/v1/plugins`.

Notes :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent rechercher des paquets privés des éditeurs auxquels ils appartiennent.
- `channel=private` renvoie uniquement les paquets que l’appelant authentifié peut lire.

### `GET /api/v1/plugins`

Parcours du catalogue réservé aux Plugins dans les paquets de Plugins de code et de Plugins groupés.

Paramètres de requête :

- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `recommended` (par défaut), `trending`, `downloads`, `updated`, alias historique `installs`
- `category` (facultatif) : filtre de catégorie de Plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Les alias historiques de filtre v1 restent acceptés sur les points de terminaison de lecture :

- `mcp-tooling`, `data` et `automation` se résolvent en `tools`.
- `observability` et `deployment` se résolvent en `gateway`.
- `dev-tools` se résout en `runtime`.

`trending` est un classement des installations/téléchargements sur sept jours et n’utilise pas les totaux cumulés.
Sur le point de terminaison unifié `/api/v1/packages`, il est réservé aux Plugins ; utilisez
`/api/v1/skills?sort=trending` pour le catalogue de Skills.

Les alias historiques ne sont pas acceptés comme valeurs de catégorie stockées ou déclarées par l’auteur.

### `GET /api/v1/skills/export`

Exportation en masse des dernières Skills publiques pour analyse hors ligne.

Authentification :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (obligatoire) : borne inférieure en millisecondes Unix pour `updatedAt` de la Skill.
- `endDate` (obligatoire) : borne supérieure en millisecondes Unix pour `updatedAt` de la Skill.
- `limit` (facultatif) : entier (1-250), `250` par défaut.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.

Réponse :

- Corps : archive ZIP.
- Chaque Skill exportée est enracinée à `{publisher}/{slug}/`.
- Les Skills hébergées incluent les fichiers de la dernière version stockée et sont répertoriées dans
  `_manifest.json` avec `sourceRef: "public-clawhub"`.
- Les Skills actuelles adossées à GitHub avec une analyse `clean` ou `suspicious` incluent
  `_source_handoff.json` avec `sourceRef: "public-github"`, le dépôt, le commit, le chemin,
  le hachage du contenu et l’URL de l’archive. Elles n’incluent pas les fichiers sources hébergés par ClawHub.
- Chaque Skill inclut `_export_skill_meta.json`.
- `_manifest.json` est toujours inclus à la racine du ZIP.
- `_errors.json` est inclus lorsque certaines Skills ou certains fichiers n’ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Export groupé des dernières versions publiques de plugins pour analyse hors ligne.

Auth :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (requis) : borne inférieure en millisecondes Unix pour `updatedAt` du plugin.
- `endDate` (requis) : borne supérieure en millisecondes Unix pour `updatedAt` du plugin.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.
- `family` (facultatif) : `code-plugin` ou `bundle-plugin`. Omis signifie les deux
  familles de plugins.

Réponse :

- Corps : archive ZIP.
- Chaque plugin exporté a pour racine `{family}/{packageName}/`.
- Chaque plugin exporté inclut les fichiers stockés de la dernière version.
- Les métadonnées d’export par plugin sont stockées dans
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

Recherche limitée aux plugins dans les packages code-plugin et bundle-plugin.

Paramètres de requête :

- `q` (requis) : chaîne de recherche
- `limit` (facultatif) : entier (1-100)
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre de catégorie de plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notes :

- Les alias de filtres v1 hérités documentés sous `GET /api/v1/plugins` sont également
  acceptés.
- Le filtrage par catégorie est un véritable filtre d’API adossé aux lignes de résumé
  des catégories de plugins, et non une réécriture de la requête de recherche.
- Les résultats sont renvoyés par ordre de pertinence et ne sont actuellement pas paginés.
- Les contrôles de tri de l’interface navigateur pour la recherche de plugins réordonnent les résultats de pertinence chargés,
  conformément au comportement actuel de navigation de `/skills`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du package.

Notes :

- Les Skills peuvent aussi être résolus via cette route dans le catalogue unifié.
- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Supprime logiquement un package et toutes ses versions.

Notes :

- Nécessite un jeton d’API pour le propriétaire du package, un propriétaire/administrateur de l’éditeur d’organisation,
  un modérateur de plateforme ou un administrateur de plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Notes :

- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version de package, y compris les métadonnées de fichiers, la compatibilité,
la vérification, les métadonnées d’artefact et les données d’analyse.

Notes :

- `version.artifact.kind` vaut `legacy-zip` pour les archives de package de l’ancien monde ou
  `npm-pack` pour les versions adossées à ClawPack.
- Les versions ClawPack incluent les champs compatibles npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash` est une métadonnée de compatibilité obsolète pour les anciens clients. Elle
  hache les octets ZIP exacts renvoyés par `/api/v1/packages/{name}/download`.
  Les clients modernes doivent utiliser `version.artifact.sha256`, qui identifie
  l’artefact de version canonique.
- `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont
  inclus lorsque des données d’analyse existent.
- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Renvoie le résumé exact de sécurité et de confiance de la version du package pour les clients
d’installation. Il s’agit de la surface de consommation publique d’OpenClaw pour décider si une
version résolue peut être installée.

Auth :

- Point de terminaison de lecture public. Aucun jeton de propriétaire, d’éditeur, de modérateur ni d’administrateur n’est
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
  package de registre résolu.
- `release.releaseId`, `release.version` et `release.createdAt` identifient la
  version exacte qui a été évaluée.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` et `release.npmTarballName` sont présents lorsqu’ils sont connus pour
  l’artefact de version.
- `trust.scanStatus` est l’état de confiance effectif dérivé des entrées du scanner
  et de la modération manuelle de la version.
- `trust.moderationState` est nullable. Il vaut `null` lorsqu’aucune modération manuelle de version
  n’existe.
- `trust.blockedFromDownload` est le signal de blocage d’installation. OpenClaw et les autres
  clients d’installation doivent bloquer l’installation lorsque cette valeur vaut `true` au lieu de
  recalculer les règles de blocage à partir des champs de scanner ou de modération.
- `trust.reasons` est la liste d’explications destinée à l’utilisateur et à l’audit. Les codes de raison
  sont des chaînes stables et compactes telles que `manual:quarantined`, `scan:malicious`,
  et `package:malicious`.
- `trust.pending` signifie qu’une ou plusieurs entrées de confiance sont encore en attente d’achèvement.
- `trust.stale` signifie que le résumé de confiance a été calculé à partir d’entrées obsolètes et
  doit être traité comme nécessitant une actualisation avant une décision d’autorisation à haut niveau de confiance.

Notes :

- Ce point de terminaison est exact à la version. Les clients doivent l’appeler après avoir résolu la
  version du package qu’ils ont l’intention d’installer, pas seulement après avoir lu les dernières
  métadonnées du package.
- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.
- Ce point de terminaison est volontairement plus étroit que les points de terminaison de modération
  propriétaire/modérateur. Il expose la décision d’installation et l’explication publique, et non
  les identités des rapporteurs, les corps de rapports, les preuves privées ou les chronologies de revue
  internes.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites du résolveur d’artefact pour une version de package.

Notes :

- Les versions de package héritées renvoient un artefact `legacy-zip` et une URL ZIP héritée
  `downloadUrl`.
- Les versions ClawPack renvoient un artefact `npm-pack`, des champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface de résolution d’OpenClaw ; elle évite de deviner le format d’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artefact de version via le chemin de résolution explicite.

Notes :

- Les versions ClawPack diffusent les octets exacts du `.tgz` npm-pack téléversé.
- Les versions ZIP héritées redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de limitation de débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour la future consommation par OpenClaw.

Les contrôles de préparation couvrent :

- statut de canal officiel
- disponibilité de la dernière version
- disponibilité de l’artefact npm-pack ClawPack
- résumé de l’artefact
- provenance du dépôt source et du commit
- métadonnées de compatibilité OpenClaw
- cibles d’hôte
- état d’analyse

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

Auth :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `phase` (facultatif) : `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, ou
  `all` (valeur par défaut).
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

Auth :

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

- `bundledPluginId` est normalisé en minuscules et constitue la clé upsert stable.
- `packageName` est normalisé comme nom npm ; le package peut être absent pour les migrations
  planifiées.
- Ceci suit uniquement l’état de préparation de la migration. Cela ne modifie pas OpenClaw et ne génère pas
  de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison modérateur/administrateur pour les files de revue des versions de packages.

Auth :

- Nécessite un jeton d’API pour un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (valeur par défaut), `blocked`, `manual` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Signification des statuts :

- `open` : versions suspectes, malveillantes, en attente, mises en quarantaine, révoquées ou signalées.
- `blocked` : versions mises en quarantaine, révoquées ou malveillantes.
- `manual` : toute version avec une dérogation de modération manuelle.
- `all` : toute version avec une dérogation manuelle, un état d’analyse non propre ou un signalement de package.

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

Signaler un package pour revue par un modérateur. Les signalements se font au niveau du package, éventuellement
liés à une version. Ils alimentent la file de modération, mais ne masquent pas automatiquement et ne
bloquent pas les téléchargements à eux seuls ; les modérateurs doivent utiliser la modération de version pour
approuver, mettre en quarantaine ou révoquer les artefacts.

Auth :

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

Point de terminaison modérateur/admin pour la réception des rapports de packages.

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

Point de terminaison propriétaire/modérateur pour la visibilité de la modération des packages.

Authentification :

- Nécessite un jeton d’API pour le propriétaire du package, un membre de l’éditeur, un modérateur ou
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

Point de terminaison modérateur/admin pour résoudre ou rouvrir les rapports de packages.

Requête :

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` est requis pour `confirmed` et `dismissed` ; il peut être omis lors de la
réinitialisation de `status` à `open`. Passez `finalAction: "quarantine"` ou
`finalAction: "revoke"` avec un rapport confirmé pour appliquer la modération de la version dans le
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

Point de terminaison modérateur/admin pour la revue des versions de packages.

Requête :

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué en attente de suivi.
- `revoked` : bloqué après qu’une version a précédemment été approuvée.

Les versions mises en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque modification écrit une entrée dans le journal d’audit.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu textuel brut d’un fichier de package.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Remarques :

- Utilise par défaut la dernière version.
- Utilise le compartiment de limite de débit de lecture, pas celui de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille de fichier : 200 Ko.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les versions malveillantes peuvent encore être retenues ailleurs.
- Les packages privés renvoient `404` sauf si l’appelant peut lire l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/download`

Télécharge l’archive ZIP déterministe héritée pour une version de package.

Paramètres de requête :

- `version` (facultatif)
- `tag` (facultatif)

Remarques :

- Utilise par défaut la dernière version.
- Les Skills redirigent vers `GET /api/v1/download`.
- Les archives Plugin/package sont des fichiers ZIP avec une racine `package/` afin que les anciens clients OpenClaw
  continuent de fonctionner.
- Cette route reste limitée au ZIP. Elle ne diffuse pas les fichiers ClawPack `.tgz`.
- Les réponses incluent les en-têtes `ETag`, `Digest`, `X-ClawHub-Artifact-Type` et
  `X-ClawHub-Artifact-Sha256` pour les contrôles d’intégrité du résolveur.
- Les métadonnées uniquement présentes dans le registre ne sont pas injectées dans l’archive téléchargée.
- Les analyses VirusTotal en attente ne bloquent pas les téléchargements ; les versions malveillantes renvoient `403`.
- Les packages privés renvoient `404` sauf si l’appelant est le propriétaire.

### `GET /api/npm/{package}`

Renvoie un packument compatible npm pour les versions de packages adossées à ClawPack.

Remarques :

- Seules les versions avec des archives tar npm-pack ClawPack téléversées sont listées.
- Les versions héritées uniquement en ZIP sont intentionnellement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des
  champs compatibles npm afin que les utilisateurs puissent faire pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de packages avec portée prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts de l’archive tar ClawPack téléversée pour les clients de miroir npm.

Remarques :

- Utilise le compartiment de limite de débit de téléchargement.
- Les en-têtes de téléchargement incluent le SHA-256 ClawHub ainsi que les métadonnées npm integrity/shasum.
- Les contrôles de modération et d’accès aux packages privés s’appliquent toujours.

### `GET /api/v1/resolve`

Utilisé par la CLI pour mapper une empreinte locale à une version connue.

Paramètres de requête :

- `slug` (obligatoire)
- `hash` (obligatoire) : sha256 hexadécimal de 64 caractères de l’empreinte du bundle

Réponse :

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Télécharge un ZIP de version de skill hébergée, ou renvoie un transfert vers la source GitHub pour une
skill actuelle adossée à GitHub avec une analyse `clean` ou `suspicious` et sans version
hébergée.

Paramètres de requête :

- `slug` (obligatoire)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom de tag (par ex. `latest`)

Remarques :

- Si ni `version` ni `tag` n’est fourni, la dernière version est utilisée.
- Les versions supprimées de façon réversible renvoient `410`.
- Les transferts de skills adossées à GitHub ne proxient ni ne mettent en miroir les octets. La réponse JSON
  inclut `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  et `archiveUrl` ; l’état d’analyse/actuel sert de barrière et n’est pas inclus comme métadonnée de charge utile
  de succès.
- Les statistiques de téléchargement sont comptées comme des identités uniques par jour UTC (`userId` lorsque le jeton d’API est valide, sinon l’IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison nécessitent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie le handle de l’utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Préféré : `multipart/form-data` avec du JSON `payload` + des blobs `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, l’API résout cet
  éditeur côté serveur et exige que l’acteur ait accès à l’éditeur.
- Champ de charge utile facultatif : `migrateOwner`. Lorsque `true` avec `ownerHandle`, une
  skill existante peut être déplacée vers ce propriétaire si l’acteur est admin/propriétaire sur les deux
  éditeurs actuel et cible. Sans cette adhésion explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une version de code-plugin ou bundle-plugin.

- Nécessite une authentification par jeton Bearer.
- Nécessite `multipart/form-data`.
- Les champs de formulaire autorisés sont `payload`, les blobs `files` répétés, ou une référence d’archive tar
  `clawpack`. `clawpack` peut être un blob `.tgz` ou un id de stockage renvoyé par
  le flux upload-url. Les publications avec id de stockage préparé doivent également inclure le
  `clawpackUploadTicket` renvoyé avec cette URL de téléversement.
- Utilisez soit `files`, soit `clawpack`, jamais les deux dans la même requête.
- Les corps JSON et les métadonnées `payload.files` / `payload.artifact`
  fournies par l’appelant sont rejetés.
- Les requêtes de publication multipart directes sont plafonnées à 18 Mo. Les archives tar ClawPack peuvent
  utiliser le flux upload-url jusqu’au plafond de 120 Mo par archive tar.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, seuls les admins peuvent publier au nom de ce propriétaire.

Points clés de validation :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les packages Plugin nécessitent `openclaw.plugin.json`. Les téléversements `.tgz` ClawPack doivent
  le contenir à `package/openclaw.plugin.json`.
- Les plugins de code nécessitent `package.json`, les métadonnées de dépôt source, les métadonnées de commit
  source, les métadonnées de schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seuls l’éditeur de l’organisation `openclaw` et les éditeurs personnels des membres actuels de l’organisation `openclaw`
  peuvent publier dans le canal `official`.
- Les publications pour le compte d’un tiers valident toujours l’éligibilité au canal officiel par rapport au compte propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Supprime de façon réversible / restaure une skill (propriétaire, modérateur ou admin).

Corps JSON facultatif :

```json
{ "reason": "Held for moderation pending legal review." }
```

Lorsqu’il est présent, `reason` est stocké comme note de modération de la skill et copié dans le journal d’audit.
Les suppressions réversibles initiées par le propriétaire réservent le slug pendant 30 jours, puis le slug peut être revendiqué par
un autre éditeur. La réponse de suppression inclut `slugReservedUntil` lorsque cette expiration s’applique.
Les masquages par modérateur/admin et les suppressions de sécurité n’expirent pas de cette façon.

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

Réservé aux admins. Garantit qu’un éditeur d’organisation existe pour un handle. Si le handle pointe encore vers un
ancien utilisateur/éditeur personnel partagé, le point de terminaison le migre d’abord vers un éditeur d’organisation.
Pour une organisation nouvellement créée, fournissez `memberHandle` ; l’admin qui agit n’est pas ajouté comme membre.
`memberRole` vaut `owner` par défaut.

- Corps : `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Création authentifiée en libre-service d’un éditeur d’organisation. Crée un nouvel éditeur d’organisation et ajoute
l’appelant comme propriétaire. Ce point de terminaison ne migre pas les handles utilisateur/personnels existants et ne
marque pas l’éditeur comme approuvé/officiel.

- Corps : `{ "handle": "opik", "displayName": "Opik" }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Renvoie `409` lorsque le handle est déjà utilisé par un éditeur, un utilisateur ou un éditeur personnel.

### `POST /api/v1/users/reserve`

Réservé aux admins. Réserve des slugs racine et des noms de packages pour un propriétaire légitime sans publier de
version. Les noms de packages deviennent des packages d’espace réservé privés sans ligne de version, afin que le même
propriétaire puisse publier ultérieurement la vraie version code-plugin ou bundle-plugin sous ce nom.

- Corps : `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Réponse : `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Réservé aux admins. Récupère un éditeur personnel pour un principal GitHub OAuth de remplacement vérifié
sans modifier les lignes de compte Convex Auth. La requête doit nommer les deux identifiants immuables de compte
fournisseur GitHub ; les handles modifiables ne sont utilisés que comme garde-fou visible par l’opérateur.

Le point de terminaison utilise le mode simulation par défaut. L’application de la récupération nécessite `dryRun: false` et
`confirmIdentityVerified: true` après que le personnel a vérifié indépendamment la continuité entre les deux
identités GitHub. La récupération échoue de façon fermée lorsque l’utilisateur de destination dispose déjà d’un
éditeur personnel avec des skills, des packages ou des sources de skill GitHub.
La récupération migre également les champs hérités `ownerUserId` pour les skills de l’éditeur récupéré,
les alias de slugs de skill, les packages, les avertissements de l’inspecteur de packages et les lignes dérivées du condensé de recherche afin que
les chemins de propriétaire direct concordent avec la nouvelle autorité de l’éditeur. Une réservation active de handle protégé
pour le handle récupéré est également réattribuée à l’utilisateur de remplacement afin qu’une synchronisation ultérieure du profil
ne puisse pas restaurer l’autorité concurrente de l’ancien utilisateur. Chaque table principale est limitée à
100 lignes par transaction d’application ; les récupérations plus volumineuses doivent d’abord utiliser une migration de propriétaire reprenable.
Les sources de skill GitHub sont limitées à l’éditeur et signalées comme vérifiées plutôt que réécrites.

- Corps : `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Réponse : `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Points de terminaison de gestion du slug du propriétaire

- `POST /api/v1/skills/{slug}/rename`
  - Corps : `{ "newSlug": "new-canonical-slug" }`
  - Réponse : `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corps : `{ "targetSlug": "canonical-target-slug" }`
  - Réponse : `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Remarques :

- Les deux points de terminaison exigent une authentification par jeton d’API et ne fonctionnent que pour le propriétaire du skill.
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

Bannir un utilisateur et supprimer définitivement les skills possédés (modérateur/administrateur uniquement).

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

Lever le bannissement d’un utilisateur et restaurer les skills éligibles (administrateur uniquement).

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

Modifier le motif enregistré d’un bannissement existant sans lever le bannissement ni restaurer
le contenu (administrateur uniquement). Utilise le mode simulation par défaut sauf si `dryRun` vaut `false`.

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

Modifier le rôle d’un utilisateur (administrateur uniquement).

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

Lister ou rechercher des utilisateurs (administrateur uniquement).

Paramètres de requête :

- `q` (facultatif) : requête de recherche
- `query` (facultatif) : alias de `q`
- `limit` (facultatif) : nombre maximal de résultats (20 par défaut, maximum 200)

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

Ajouter/retirer une étoile (mise en avant). Les deux points de terminaison sont idempotents.

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

La CLI peut découvrir les paramètres du registre/de l’authentification depuis le site :

- `/.well-known/clawhub.json` (JSON, préféré)
- `/.well-known/clawdhub.json` (hérité)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez, servez ce fichier (ou définissez explicitement `CLAWHUB_REGISTRY` ; ancien `CLAWDHUB_REGISTRY`).
