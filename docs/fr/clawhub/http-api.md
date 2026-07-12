---
read_when:
    - Ajout/modification de points de terminaison
    - Débogage des requêtes CLI ↔ registre
summary: Référence de l’API HTTP (points de terminaison publics et CLI + authentification).
x-i18n:
    generated_at: "2026-07-12T15:06:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL de base : `https://clawhub.ai` (par défaut).

Tous les chemins v1 se trouvent sous `/api/v1/...`.
Les anciens chemins `/api/...` et `/api/cli/...` sont conservés à des fins de compatibilité (voir `DEPRECATIONS.md`).
OpenAPI : `/api/v1/openapi.json`.

## Réutilisation du catalogue public

Les annuaires tiers peuvent utiliser les points de terminaison publics en lecture pour répertorier ou rechercher les Skills ClawHub. Veuillez mettre les résultats en cache, respecter `429`/`Retry-After`, rediriger les utilisateurs vers la fiche ClawHub canonique (`https://clawhub.ai/<owner>/skills/<slug>`) et éviter de laisser entendre que ClawHub approuve le site tiers. Ne tentez pas de reproduire du contenu masqué, privé ou bloqué par la modération en dehors de la surface de l’API publique.

Les raccourcis de slugs Web sont résolus dans toutes les familles du registre, mais les clients API doivent utiliser
les URL canoniques renvoyées par les points de terminaison en lecture plutôt que de reconstruire la priorité
des routes.

## Limites de débit

Modèle d’application :

- Requêtes anonymes : limite appliquée par adresse IP.
- Requêtes authentifiées (jeton Bearer valide) : limite appliquée par compartiment utilisateur.
- Si le jeton est absent ou non valide, le comportement revient à une limite par adresse IP.
- Les points de terminaison d’écriture authentifiés ne doivent pas renvoyer uniquement `Unauthorized` lorsque
  le serveur connaît la raison. Les jetons absents, non valides ou révoqués, ainsi que
  les comptes supprimés, bannis ou désactivés, doivent chacun produire un texte exploitable afin que les clients
  CLI puissent indiquer aux utilisateurs ce qui les a bloqués.

- Lecture : 3000/min par adresse IP, 12000/min par clé
- Écriture : 300/min par adresse IP, 3000/min par clé
- Téléchargement : 1200/min par adresse IP, 6000/min par clé (points de terminaison de téléchargement)

En-têtes :

- Compatibilité historique : `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardisés : `RateLimit-Limit`, `RateLimit-Reset`
- Avec `429` : `X-RateLimit-Remaining: 0` et `RateLimit-Remaining: 0`
- Avec `429` : `Retry-After`

Sémantique des en-têtes :

- `X-RateLimit-Reset` : secondes absolues de l’époque Unix
- `RateLimit-Reset` : secondes avant la réinitialisation (délai)
- `X-RateLimit-Remaining` / `RateLimit-Remaining` : budget restant exact, lorsqu’il est présent.
  Les requêtes partitionnées réussies omettent cet en-tête au lieu de renvoyer une valeur globale approximative.
- `Retry-After` : secondes d’attente avant une nouvelle tentative (délai) avec `429`

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

Limite de débit dépassée
```

Recommandations pour les clients :

- Si `Retry-After` existe, attendez le nombre de secondes indiqué avant une nouvelle tentative.
- Utilisez un délai exponentiel avec gigue pour éviter les nouvelles tentatives synchronisées.
- Si `Retry-After` est absent, utilisez `RateLimit-Reset` comme solution de repli (ou effectuez le calcul à partir de `X-RateLimit-Reset`).

Source de l’adresse IP :

- Utilise les en-têtes d’adresse IP client fiables, notamment `cf-connecting-ip`, uniquement lorsque
  le déploiement active explicitement les en-têtes transférés fiables.
- ClawHub utilise les en-têtes de transfert fiables pour identifier les adresses IP clientes à la périphérie.
- Si aucune adresse IP cliente fiable n’est disponible, les requêtes anonymes utilisent des compartiments de repli
  dont la portée est limitée au type de limite de débit. Ces compartiments de repli n’incluent pas
  les chemins, slugs, noms de paquets, versions, chaînes de requête ni autres
  paramètres d’artefact fournis par l’appelant.

## Réponses d’erreur

Les réponses d’erreur publiques v1 sont en texte brut avec `content-type: text/plain; charset=utf-8`.
Cela inclut les échecs de validation (`400`), les ressources publiques manquantes (`404`), les échecs
d’authentification et d’autorisation (`401`/`403`), les limites de débit (`429`) et les téléchargements bloqués. Les clients
doivent lire le corps de la réponse comme une chaîne lisible par un humain. Les paramètres de requête inconnus sont
ignorés à des fins de compatibilité, mais les paramètres de requête reconnus dont les valeurs sont non valides renvoient
`400`.

## Points de terminaison publics (sans authentification)

### `GET /api/v1/search`

Paramètres de requête :

- `q` (obligatoire) : chaîne de recherche
- `limit` (facultatif) : entier
- `highlightedOnly` (facultatif) : `true` pour filtrer uniquement les Skills mis en avant
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les Skills suspects (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : ancien alias de `nonSuspiciousOnly`

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

- Les résultats sont renvoyés par ordre de pertinence (similarité des plongements + pondérations des correspondances exactes avec les jetons du slug/nom + faible a priori de popularité).
- La pertinence l’emporte sur la popularité. Une correspondance précise avec un jeton du slug ou du nom d’affichage peut être mieux classée qu’une correspondance moins précise bénéficiant d’un engagement bien supérieur.
- Le texte ASCII est découpé en jetons aux limites des mots et de la ponctuation. Par exemple, `personal-map` contient un jeton `map` autonome, tandis que `amap-jsapi-skill` contient `amap`, `jsapi` et `skill` ; une recherche de `map` donne donc à `personal-map` une correspondance lexicale plus forte qu’à `amap-jsapi-skill`.
- La popularité est mise à l’échelle logarithmique et plafonnée. Les Skills suscitant un fort engagement peuvent être moins bien classés lorsque le texte de la requête correspond moins précisément.
- Un état de modération suspect ou masqué peut retirer un Skill de la recherche publique selon les filtres de l’appelant et l’état actuel de la modération.

Recommandations de découvrabilité pour les éditeurs :

- Placez les termes que les utilisateurs rechercheront littéralement dans le nom d’affichage, le résumé et les balises. N’utilisez un jeton de slug autonome que s’il constitue également une identité stable que vous souhaitez conserver.
- Ne renommez pas un slug uniquement pour cibler une requête, sauf si le nouveau slug constitue un meilleur nom canonique à long terme. Les anciens slugs deviennent des alias de redirection, mais l’URL canonique, le slug affiché et les futurs résumés de recherche utilisent le nouveau slug.
- Les alias de renommage préservent la résolution des anciennes URL et des installations résolues par l’intermédiaire du registre, mais le classement de recherche repose sur les métadonnées canoniques du Skill une fois le renommage indexé. Les statistiques existantes restent associées au Skill.
- Si un Skill est inexplicablement invisible, vérifiez d’abord l’état de modération avec `clawhub inspect @owner/slug` en étant connecté, avant de modifier les métadonnées liées au classement.

### `GET /api/v1/skills`

Paramètres de requête :

- `limit` (facultatif) : entier (1–200)
- `cursor` (facultatif) : curseur de pagination pour tout tri autre que `trending`
- `sort` (facultatif) : `updated` (par défaut), `recommended` (alias : `default`), `createdAt` (alias : `newest`), `downloads`, `stars` (alias : `rating`), les anciens alias d’installation `installsCurrent`/`installs`/`installsAllTime` correspondent à `downloads`, `trending`
- `nonSuspiciousOnly` (facultatif) : `true` pour masquer les Skills suspects (`flagged.suspicious`)
- `nonSuspicious` (facultatif) : ancien alias de `nonSuspiciousOnly`

Les valeurs de `sort` non valides renvoient `400`.

Remarques :

- `recommended` utilise des signaux d’engagement et de récence.
- `trending` classe les résultats selon les installations des 7 derniers jours (d’après la télémétrie).
- `createdAt` reste stable pour l’exploration de nouveaux Skills ; `updated` change lorsque des Skills existants sont republiés.
- Lorsque `nonSuspiciousOnly=true`, les tris basés sur un curseur peuvent renvoyer moins de `limit` éléments sur une page, car les Skills suspects sont filtrés après la récupération de la page.
- Utilisez `nextCursor` pour poursuivre la pagination lorsqu’il est présent. Une page courte ne signifie pas à elle seule que les résultats sont épuisés.

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

- Les anciens slugs créés par les flux de renommage ou de fusion du propriétaire sont résolus vers le Skill canonique.
- `metadata.os` : restrictions de système d’exploitation déclarées dans le frontmatter du Skill (par exemple `["macos"]`, `["linux"]`). `null` si elles ne sont pas déclarées.
- `metadata.systems` : systèmes cibles Nix (par exemple `["aarch64-darwin", "x86_64-linux"]`). `null` s’ils ne sont pas déclarés.
- `metadata` vaut `null` si le Skill ne contient aucune métadonnée de plateforme.
- `moderation` est inclus uniquement lorsque le Skill est signalé ou que son propriétaire le consulte.

### `GET /api/v1/skills/{slug}/moderation`

Renvoie un état de modération structuré.

Réponse :

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Détecté : suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Exécution dynamique de code détectée.",
        "evidence": ""
      }
    ]
  }
}
```

Remarques :

- Les propriétaires et les modérateurs peuvent accéder aux détails de modération des Skills masqués.
- Les appelants publics n’obtiennent une réponse `200` que pour les Skills visibles déjà signalés.
- Les éléments de preuve sont expurgés pour les appelants publics et ne comprennent des extraits bruts que pour les propriétaires et les modérateurs.

### `POST /api/v1/skills/{slug}/report`

Signale un Skill afin qu’un modérateur l’examine. Les signalements concernent le Skill dans son ensemble, peuvent être liés
à une version et alimentent la file d’attente des signalements de Skills.

Authentification :

- Nécessite un jeton d’API.

Requête :

```json
{ "reason": "Étape d’installation suspecte", "version": "1.2.3" }
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

Point de terminaison pour les modérateurs et administrateurs destiné à la réception des signalements de Skills.

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
      "reason": "Étape d’installation suspecte",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Auteur du signalement"
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

Point de terminaison pour les modérateurs et administrateurs permettant de résoudre ou de rouvrir les signalements de Skills.

Requête :

```json
{ "status": "confirmed", "note": "Examen effectué et version concernée masquée.", "finalAction": "hide" }
```

`note` est obligatoire pour `confirmed` et `dismissed` ; il peut être omis lors du
rétablissement de `status` à `open`. Transmettez `finalAction: "hide"` avec un signalement
traité afin de masquer le Skill dans le même flux de travail auditable.

### `GET /api/v1/skills/{slug}/versions`

Paramètres de requête :

- `limit` (facultatif) : entier
- `cursor` (facultatif) : curseur de pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

Renvoie les métadonnées de la version et la liste des fichiers.

- `version.security` inclut l’état normalisé de vérification de l’analyse et les détails de l’analyseur
  (VirusTotal + LLM), lorsqu’ils sont disponibles.

### `GET /api/v1/skills/{slug}/scan`

Renvoie les détails de vérification de l’analyse de sécurité d’une version de Skill.

Paramètres de requête :

- `version` (facultatif) : chaîne de version précise.
- `tag` (facultatif) : résout une version balisée (par exemple `latest`).

Remarques :

- Si ni `version` ni `tag` ne sont fournis, utilise la dernière version.
- Inclut l’état de vérification normalisé ainsi que les détails propres au scanner.
- `security.hasScanResult` vaut `true` uniquement lorsqu’un scanner a produit un verdict définitif (`clean`, `suspicious` ou `malicious`).
- `moderation` est un instantané actuel de la modération au niveau de la compétence, dérivé de la dernière version.
- Lorsque vous interrogez une version historique, vérifiez `moderation.matchesRequestedVersion` et `moderation.sourceVersion` avant de considérer `moderation` et `security` comme relevant du même contexte de version.

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

- Les charges utiles des requêtes d’analyse et les rapports téléchargeables expirent du stockage des requêtes d’analyse après la période de conservation.
- Les analyses publiées nécessitent un accès de gestion en tant que propriétaire ou éditeur, ou les droits de modérateur ou d’administrateur de la plateforme.
- Les analyses publiées ne réécrivent les données que lorsque `update: true` et que l’analyse aboutit.
- La réponse est `202` avec `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Les tâches d’analyse sont asynchrones. Les requêtes d’analyse manuelles sont prioritaires sur les tâches normales de publication et de remplissage rétroactif, mais leur achèvement dépend toujours de la disponibilité des workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Point de terminaison d’interrogation authentifié pour une analyse soumise.

- Renvoie l’état en attente/en cours/réussie/échouée.
- Renvoie `queue.queuedAhead` et `queue.position` pendant la mise en attente afin que les clients puissent afficher le nombre d’analyses manuelles prioritaires précédant la requête. Les files d’attente très volumineuses sont plafonnées et signalées avec `queuedAheadIsEstimate: true`.
- Lorsqu’il est disponible, `report` contient les sections `clawscan`, `skillspector`, `staticAnalysis` et `virustotal`.
- Les tâches d’analyse ayant échoué renvoient `status: "failed"` avec `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Point de terminaison authentifié pour l’archive du rapport.

- Nécessite une analyse réussie ; les analyses non terminées renvoient `409`.
- Renvoie une archive ZIP contenant `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Point de terminaison authentifié pour l’archive de rapport stockée des versions soumises.

- Nécessite un accès de gestion en tant que propriétaire/éditeur au skill ou au plugin, ou des droits de modérateur/administrateur de la plateforme.
- Renvoie les résultats d’analyse stockés pour la version exacte soumise, y compris les versions bloquées ou masquées.
- `kind` utilise `skill` par défaut ; utilisez `kind=plugin` pour les analyses de plugins/paquets.
- Renvoie la même structure ZIP que les téléchargements de demandes d’analyse.

### `POST /api/v1/skills/-/scan/batch`

Route canonique de réanalyse par lots réservée aux administrateurs. Elle accepte la même structure de charge utile que l’ancienne route `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonique de statut des lots réservée aux administrateurs. Elle accepte `{ "jobIds": ["..."] }` et renvoie les mêmes compteurs agrégés que l’ancienne route `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Renvoie l’enveloppe de vérification de la fiche du Skill utilisée par `clawhub skill verify`.

Paramètres de requête :

- `version` (facultatif) : chaîne de version spécifique.
- `tag` (facultatif) : résout une version étiquetée (par exemple `latest`).

Remarques :

- `ok` vaut `true` uniquement lorsque la version sélectionnée dispose d’une fiche de Skill générée, n’est pas bloquée comme logiciel malveillant par la modération et a passé la vérification ClawScan.
- L’identité du Skill, l’identité de l’éditeur et les métadonnées de la version sélectionnée sont des champs de premier niveau de l’enveloppe (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), afin que les automatisations shell puissent les lire sans extraire des structures imbriquées.
- `security` est le verdict ClawScan/de sécurité de premier niveau. Les automatisations doivent se baser sur `ok`, `decision`, `reasons` et `security.status`.
- `security.signals` contient les éléments justificatifs de l’analyse, tels que `staticScan`, `virusTotal` et `skillSpector`.
- `security.signals.dependencyRegistry` est conservé pour assurer la compatibilité des réponses v1, mais l’analyseur d’existence dans le registre des dépendances a été retiré et cette clé vaut toujours `null`.
- `provenance` vaut `server-resolved-github-import` uniquement lorsque ClawHub a résolu et stocké un dépôt, une référence, un commit et un chemin GitHub lors de la publication ou de l’importation ; sinon, sa valeur est `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Renvoie les verdicts de sécurité compacts actuels pour des versions exactes de Skills. Ce
point de terminaison de collection est destiné aux clients qui savent déjà quelles versions
de Skills ClawHub installées ils doivent afficher, comme l’interface de contrôle d’OpenClaw.

Requête :

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Remarques :

- `items` doit contenir entre 1 et 100 paires `{ slug, version }` uniques.
- Les résultats sont fournis par élément ; l’absence d’un Skill ou d’une version n’entraîne pas l’échec de toute la réponse.
- La réponse concerne uniquement la sécurité. Elle n’inclut pas les données de fiche du Skill, le statut de génération de la fiche, les listes de fichiers d’artefacts ni les charges utiles détaillées des analyseurs.
- `security.signals` contient uniquement des éléments justificatifs au niveau du statut ; utilisez `/scan` ou la page d’audit de sécurité de ClawHub pour obtenir tous les détails des analyseurs.
- `security.signals.dependencyRegistry` est conservé pour assurer la compatibilité des réponses v1, mais l’analyseur d’existence dans le registre des dépendances a été retiré et cette clé vaut toujours `null`.
- L’absence de fiche du Skill n’affecte pas les valeurs `ok`, `decision` ou `reasons` de ce point de terminaison ; les clients doivent lire localement le fichier `skill-card.md` installé lorsqu’ils ont besoin du contenu de la fiche.
- Utilisez `/verify` lorsque vous avez besoin de l’enveloppe de vérification de la fiche d’un seul Skill, `/card` lorsque vous avez besoin du Markdown de la fiche générée et `/scan` lorsque vous avez besoin de données d’analyse détaillées.

Réponse :

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
      "error": { "code": "version_not_found", "message": "Version introuvable" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Renvoie le contenu textuel brut.

Paramètres de requête :

- `path` (obligatoire)
- `version` (facultatif)
- `tag` (facultatif)

Remarques :

- Utilise par défaut la dernière version.
- Limite de taille du fichier : 200KB.

### `GET /api/v1/packages`

Point de terminaison de catalogue unifié pour :

- les Skills
- les Plugins de code
- les Plugins groupés

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `updated` (par défaut), `recommended`, `trending`, `downloads`, ancien alias `installs`
- `category` (facultatif) : filtre par catégorie de Plugin. Pris en charge uniquement lorsque la
  requête est limitée aux paquets de Plugins (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou les points de terminaison de paquets avec
  `family=code-plugin`/`family=bundle-plugin`). Les catégories contrôlées et
  les anciens alias de filtre v1 sont documentés sous `GET /api/v1/plugins`.

Remarques :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- `GET /api/v1/code-plugins` et `GET /api/v1/bundle-plugins` restent des alias à famille fixe.
- Les entrées de Skills restent adossées au registre des Skills et ne peuvent toujours être publiées que via `POST /api/v1/skills`.
- `POST /api/v1/packages` reste réservé aux versions de Plugins de code et de Plugins groupés.
- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent voir, dans les résultats de liste et de recherche, les paquets privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les paquets que l'appelant authentifié peut consulter.

### `GET /api/v1/packages/search`

Recherche unifiée dans le catalogue des Skills et des paquets de Plugins.

Paramètres de requête :

- `q` (obligatoire) : chaîne de requête
- `limit` (facultatif) : entier (1–100)
- `family` (facultatif) : `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (facultatif) : `official`, `community` ou `private`
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre par catégorie de Plugin. Pris en charge uniquement lorsque la
  requête est limitée aux paquets de Plugins. Les catégories contrôlées et les anciens
  alias de filtre v1 sont documentés sous `GET /api/v1/plugins`.

Remarques :

- Les valeurs non valides pour `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` renvoient `400`. Les paramètres de requête inconnus sont ignorés.
- Les appelants anonymes ne voient que les canaux de paquets publics.
- Les appelants authentifiés peuvent rechercher les paquets privés des éditeurs auxquels ils appartiennent.
- `channel=private` ne renvoie que les paquets que l'appelant authentifié peut consulter.

### `GET /api/v1/plugins`

Parcours du catalogue réservé aux Plugins, couvrant les paquets de Plugins de code et de Plugins groupés.

Paramètres de requête :

- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination
- `isOfficial` (facultatif) : `true` ou `false`
- `sort` (facultatif) : `recommended` (par défaut), `trending`, `downloads`, `updated`, ancien alias `installs`
- `category` (facultatif) : filtre par catégorie de Plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Les anciens alias de filtre v1 restent acceptés sur les points de terminaison de lecture :

- `mcp-tooling`, `data` et `automation` correspondent à `tools`.
- `observability` et `deployment` correspondent à `gateway`.
- `dev-tools` correspond à `runtime`.

`trending` est un classement des installations/téléchargements sur sept jours et n'utilise pas les totaux historiques.
Sur le point de terminaison unifié `/api/v1/packages`, il est réservé aux Plugins ; utilisez
`/api/v1/skills?sort=trending` pour le catalogue des Skills.

Les anciens alias ne sont pas acceptés comme valeurs de catégorie stockées ou déclarées par l'auteur.

### `GET /api/v1/skills/export`

Exportation en masse des dernières versions des Skills publics pour analyse hors ligne.

Authentification :

- Jeton d'API obligatoire.

Paramètres de requête :

- `startDate` (obligatoire) : limite inférieure en millisecondes Unix pour `updatedAt` du Skill.
- `endDate` (obligatoire) : limite supérieure en millisecondes Unix pour `updatedAt` du Skill.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.

Réponse :

- Corps : archive ZIP.
- Chaque Skill exporté se trouve sous `{publisher}/{slug}/`.
- Les Skills hébergés incluent les fichiers de la dernière version stockée et sont répertoriés dans
  `_manifest.json` avec `sourceRef: "public-clawhub"`.
- Les Skills actuels adossés à GitHub dont l'analyse est `clean` ou `suspicious` incluent
  `_source_handoff.json` avec `sourceRef: "public-github"`, le dépôt, le commit, le chemin,
  le hachage du contenu et l'URL de l'archive. Ils n'incluent pas les fichiers sources hébergés par ClawHub.
- Chaque Skill inclut `_export_skill_meta.json`.
- `_manifest.json` est toujours inclus à la racine de l'archive ZIP.
- `_errors.json` est inclus lorsque certains Skills ou fichiers n'ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Exportation en masse des dernières versions publiques des plugins pour une analyse hors ligne.

Authentification :

- Jeton d’API requis.

Paramètres de requête :

- `startDate` (requis) : limite inférieure en millisecondes Unix pour la valeur `updatedAt` du plugin.
- `endDate` (requis) : limite supérieure en millisecondes Unix pour la valeur `updatedAt` du plugin.
- `limit` (facultatif) : entier (1-250), valeur par défaut `250`.
- `cursor` (facultatif) : curseur de pagination de la réponse précédente.
- `family` (facultatif) : `code-plugin` ou `bundle-plugin`. En cas d’omission, les deux
  familles de plugins sont incluses.

Réponse :

- Corps : archive ZIP.
- Chaque plugin exporté se trouve à la racine `{family}/{packageName}/`.
- Chaque plugin exporté inclut les fichiers stockés de sa dernière version.
- Les métadonnées d’exportation propres à chaque plugin sont stockées dans
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` est toujours inclus à la racine du fichier ZIP.
- `_errors.json` est inclus lorsque certains plugins ou fichiers n’ont pas pu être
  exportés.

En-têtes :

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Recherche limitée aux plugins parmi les paquets code-plugin et bundle-plugin.

Paramètres de requête :

- `q` (requis) : chaîne de requête
- `limit` (facultatif) : entier (1-100)
- `isOfficial` (facultatif) : `true` ou `false`
- `category` (facultatif) : filtre par catégorie de plugin. Valeurs actuelles :
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Remarques :

- Les anciens alias de filtres v1 documentés sous `GET /api/v1/plugins` sont également
  acceptés.
- Le filtrage par catégorie est un véritable filtre d’API reposant sur les lignes de
  condensé des catégories de plugins, et non une réécriture de la requête de recherche.
- Les résultats sont renvoyés par ordre de pertinence et ne sont actuellement pas paginés.
- Les contrôles de tri de l’interface du navigateur pour la recherche de plugins réordonnent les résultats de pertinence chargés,
  conformément au comportement actuel de navigation de `/skills`.

### `GET /api/v1/packages/{name}`

Renvoie les métadonnées détaillées du paquet.

Remarques :

- Les Skills peuvent également être résolus via cette route dans le catalogue unifié.
- Les paquets privés renvoient `404`, sauf si l’appelant peut consulter l’éditeur propriétaire.

### `DELETE /api/v1/packages/{name}`

Effectue une suppression logique d’un paquet et de toutes ses versions.

Remarques :

- Nécessite un jeton d’API pour le propriétaire du paquet, un propriétaire ou administrateur de l’organisation éditrice,
  un modérateur de la plateforme ou un administrateur de la plateforme.

### `GET /api/v1/packages/{name}/versions`

Renvoie l’historique des versions.

Paramètres de requête :

- `limit` (facultatif) : entier (1–100)
- `cursor` (facultatif) : curseur de pagination

Remarques :

- Les paquets privés renvoient `404`, sauf si l’appelant peut consulter l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}`

Renvoie une version d’un paquet, notamment les métadonnées des fichiers, la compatibilité,
la vérification, les métadonnées de l’artefact et les données d’analyse.

Remarques :

- `version.artifact.kind` vaut `legacy-zip` pour les anciennes archives de paquets ou
  `npm-pack` pour les versions reposant sur ClawPack.
- Les versions ClawPack incluent les champs compatibles avec npm `npmIntegrity`, `npmShasum` et
  `npmTarballName`.
- `version.sha256hash` est une métadonnée de compatibilité obsolète destinée aux anciens clients. Elle
  calcule le hachage des octets ZIP exacts renvoyés par `/api/v1/packages/{name}/download`.
  Les clients modernes doivent utiliser `version.artifact.sha256`, qui identifie
  l’artefact canonique de la version.
- `version.vtAnalysis`, `version.llmAnalysis` et `version.staticScan` sont
  inclus lorsque des données d’analyse existent.
- Les paquets privés renvoient `404`, sauf si l’appelant peut consulter l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Renvoie le récapitulatif exact de sécurité et de confiance de la version du paquet pour les
clients d’installation. Il s’agit de la surface de consommation publique d’OpenClaw permettant de déterminer si une
version résolue peut être installée.

Authentification :

- Point de terminaison public en lecture. Aucun jeton de propriétaire, d’éditeur, de modérateur ou d’administrateur n’est
  requis.

Réponse :

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Exemple de plugin",
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
  paquet résolu dans le registre.
- `release.releaseId`, `release.version` et `release.createdAt` identifient la
  version exacte qui a été évaluée.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` et `release.npmTarballName` sont présents lorsqu’ils sont connus pour
  l’artefact de la version.
- `trust.scanStatus` est l’état de confiance effectif dérivé des données des outils d’analyse
  et de la modération manuelle de la version.
- `trust.moderationState` accepte la valeur nulle. Il vaut `null` lorsqu’aucune modération manuelle de la version
  n’existe.
- `trust.blockedFromDownload` est le signal de blocage de l’installation. OpenClaw et les autres
  clients d’installation doivent bloquer l’installation lorsque cette valeur est `true`, au lieu de
  recalculer les règles de blocage à partir des champs d’analyse ou de modération.
- `trust.reasons` est la liste explicative destinée aux utilisateurs et à l’audit. Les codes de motif
  sont des chaînes stables et compactes telles que `manual:quarantined`, `scan:malicious`
  et `package:malicious`.
- `trust.pending` signifie qu’une ou plusieurs données de confiance sont toujours en attente de traitement.
- `trust.stale` signifie que le récapitulatif de confiance a été calculé à partir de données obsolètes et
  doit être considéré comme nécessitant une actualisation avant toute décision d’autorisation à haut niveau de confiance.

Remarques :

- Ce point de terminaison correspond à une version exacte. Les clients doivent l’appeler après avoir résolu la
  version du paquet qu’ils prévoient d’installer, et non uniquement après avoir lu les dernières
  métadonnées du paquet.
- Les paquets privés renvoient `404`, sauf si l’appelant peut consulter l’éditeur propriétaire.
- Ce point de terminaison est volontairement plus restreint que les points de terminaison de modération
  destinés aux propriétaires et aux modérateurs. Il expose la décision d’installation et l’explication publique, mais pas
  l’identité des auteurs de signalements, le contenu des signalements, les preuves privées ni les calendriers
  internes de vérification.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Renvoie les métadonnées explicites de résolution de l’artefact pour une version de paquet.

Remarques :

- Les versions de paquet héritées renvoient un artefact `legacy-zip` et une
  `downloadUrl` ZIP héritée.
- Les versions ClawPack renvoient un artefact `npm-pack`, les champs d’intégrité npm, une
  `tarballUrl` et l’URL de compatibilité ZIP héritée.
- Il s’agit de la surface de résolution d’OpenClaw ; elle évite de déduire le format de l’archive à partir
  d’une URL partagée.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Télécharge l’artefact de la version via le chemin de résolution explicite.

Remarques :

- Les versions ClawPack diffusent les octets `.tgz` exacts du paquet npm téléversé.
- Les versions ZIP héritées redirigent vers `/api/v1/packages/{name}/download?version=`.
- Utilise le compartiment de limitation du débit de téléchargement.

### `GET /api/v1/packages/{name}/readiness`

Renvoie l’état de préparation calculé pour une future utilisation par OpenClaw.

Les vérifications de préparation couvrent :

- le statut du canal officiel
- la disponibilité de la dernière version
- la disponibilité de l’artefact ClawPack au format paquet npm
- l’empreinte de l’artefact
- la provenance du dépôt source et du commit
- les métadonnées de compatibilité avec OpenClaw
- les cibles d’hôte
- l’état de l’analyse

Réponse :

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin d’exemple",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "Artefact ClawPack",
      "status": "fail",
      "message": "La dernière version est uniquement disponible au format ZIP hérité."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Point de terminaison destiné aux modérateurs pour répertorier les enregistrements de migration des plugins OpenClaw officiels.

Authentification :

- Nécessite un jeton d’API appartenant à un utilisateur modérateur ou administrateur.

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
      "blockers": ["ClawPack manquant"],
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

Point de terminaison destiné aux administrateurs pour créer ou mettre à jour un enregistrement de migration de plugin officiel.

Authentification :

- Nécessite un jeton d’API appartenant à un utilisateur administrateur.

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
  "blockers": ["ClawPack manquant"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "en attente du téléversement par l’éditeur"
}
```

Remarques :

- `bundledPluginId` est normalisé en minuscules et constitue la clé stable d’insertion ou de mise à jour.
- `packageName` est normalisé comme nom npm ; le paquet peut être absent pour les migrations
  planifiées.
- Cela suit uniquement l’état de préparation de la migration. Cela ne modifie pas OpenClaw et ne génère pas
  de ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Point de terminaison destiné aux modérateurs et administrateurs pour les files d’attente d’examen des versions de paquets.

Authentification :

- Nécessite un jeton d’API appartenant à un utilisateur modérateur ou administrateur.

Paramètres de requête :

- `status` (facultatif) : `open` (par défaut), `blocked`, `manual` ou `all`
- `limit` (facultatif) : entier (1-100)
- `cursor` (facultatif) : curseur de pagination

Signification des statuts :

- `open` : versions suspectes, malveillantes, en attente, mises en quarantaine, révoquées ou signalées.
- `blocked` : versions mises en quarantaine, révoquées ou malveillantes.
- `manual` : toute version soumise à une dérogation manuelle de modération.
- `all` : toute version soumise à une dérogation manuelle, dont l’état d’analyse n’est pas sain ou dont le paquet a été signalé.

Réponse :

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin d’exemple",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "examen manuel",
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

Signale un paquet pour examen par un modérateur. Les signalements concernent le paquet dans son ensemble et peuvent être
liés à une version. Ils alimentent la file d’attente de modération, mais ne masquent pas automatiquement les paquets et ne
bloquent pas les téléchargements par eux-mêmes ; les modérateurs doivent utiliser la modération des versions pour
approuver, mettre en quarantaine ou révoquer les artefacts.

Authentification :

- Nécessite un jeton d’API.

Requête :

```json
{ "reason": "Binaire natif suspect", "version": "1.2.3" }
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

Point de terminaison pour modérateurs/administrateurs destiné à la réception des signalements de packages.

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
      "displayName": "Plugin d’exemple",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Binaire natif suspect",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Auteur du signalement"
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

Point de terminaison pour propriétaires/modérateurs offrant une visibilité sur la modération d’un package.

Authentification :

- Nécessite un jeton d’API pour le propriétaire du package, un membre de l’éditeur, un modérateur ou
  un utilisateur administrateur.

Réponse :

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin d’exemple",
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
    "moderationReason": "examen manuel",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Point de terminaison pour modérateurs/administrateurs permettant de résoudre ou de rouvrir les signalements de packages.

Requête :

```json
{
  "status": "confirmed",
  "note": "Version concernée examinée et mise en quarantaine.",
  "finalAction": "quarantine"
}
```

`note` est requis pour `confirmed` et `dismissed` ; il peut être omis lors du
rétablissement de `status` à `open`. Transmettez `finalAction: "quarantine"` ou
`finalAction: "revoke"` avec un signalement confirmé afin d’appliquer la modération de la version dans le
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

Point de terminaison pour modérateurs/administrateurs destiné à l’examen des versions de packages.

Requête :

```json
{ "state": "quarantined", "reason": "Charge utile native suspecte." }
```

États pris en charge :

- `approved` : examiné manuellement et autorisé.
- `quarantined` : bloqué dans l’attente d’un suivi.
- `revoked` : bloqué après qu’une version a précédemment été considérée comme fiable.

Les versions mises en quarantaine et révoquées renvoient `403` depuis les routes de téléchargement d’artefacts.
Chaque modification crée une entrée dans le journal d’audit.

### `GET /api/v1/packages/{name}/file`

Renvoie le contenu textuel brut d’un fichier de package.

Paramètres de requête :

- `path` (requis)
- `version` (facultatif)
- `tag` (facultatif)

Remarques :

- Utilise par défaut la dernière version.
- Utilise le quota de débit de lecture, et non celui de téléchargement.
- Les fichiers binaires renvoient `415`.
- Limite de taille des fichiers : 200KB.
- Les analyses VirusTotal en attente ne bloquent pas les lectures ; les versions malveillantes peuvent toutefois être masquées ailleurs.
- Les packages privés renvoient `404`, sauf si l’appelant peut lire les données de l’éditeur propriétaire.

### `GET /api/v1/packages/{name}/download`

Télécharge l’archive ZIP déterministe historique d’une version de package.

Paramètres de requête :

- `version` (facultatif)
- `tag` (facultatif)

Remarques :

- Utilise par défaut la dernière version.
- Les Skills sont redirigées vers `GET /api/v1/download`.
- Les archives de Plugin/package sont des fichiers ZIP avec une racine `package/` afin que les anciens clients OpenClaw
  continuent de fonctionner.
- Cette route reste exclusivement réservée aux fichiers ZIP. Elle ne diffuse pas les fichiers ClawPack `.tgz`.
- Les réponses incluent les en-têtes `ETag`, `Digest`, `X-ClawHub-Artifact-Type` et
  `X-ClawHub-Artifact-Sha256` pour les contrôles d’intégrité du résolveur.
- Les métadonnées propres au registre ne sont pas injectées dans l’archive téléchargée.
- Les analyses VirusTotal en attente ne bloquent pas les téléchargements ; les versions malveillantes renvoient `403`.
- Les packages privés renvoient `404`, sauf si l’appelant est le propriétaire.

### `GET /api/npm/{package}`

Renvoie un packument compatible avec npm pour les versions de packages reposant sur ClawPack.

Remarques :

- Seules les versions disposant d’archives tar npm-pack ClawPack téléversées sont répertoriées.
- Les anciennes versions disponibles uniquement au format ZIP sont volontairement omises.
- `dist.tarball`, `dist.integrity` et `dist.shasum` utilisent des
  champs compatibles avec npm afin que les utilisateurs puissent faire pointer npm vers le miroir s’ils le souhaitent.
- Les packuments de packages délimités prennent en charge à la fois `/api/npm/@scope/name` et le chemin de requête
  encodé de npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Diffuse les octets exacts de l’archive tar ClawPack téléversée pour les clients utilisant le miroir npm.

Remarques :

- Utilise le quota de débit de téléchargement.
- Les en-têtes de téléchargement incluent le SHA-256 de ClawHub ainsi que les métadonnées d’intégrité et de somme de contrôle npm.
- Les vérifications de modération et d’accès aux paquets privés s’appliquent toujours.

### `GET /api/v1/resolve`

Utilisé par la CLI pour associer une empreinte locale à une version connue.

Paramètres de requête :

- `slug` (obligatoire)
- `hash` (obligatoire) : SHA-256 hexadécimal de 64 caractères de l’empreinte du bundle

Réponse :

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Télécharge l’archive ZIP d’une version hébergée d’une skill, ou renvoie une redirection vers la source GitHub pour une
skill actuelle adossée à GitHub dont l’analyse est `clean` ou `suspicious` et pour laquelle aucune version
n’est hébergée.

Paramètres de requête :

- `slug` (obligatoire)
- `version` (facultatif) : chaîne semver
- `tag` (facultatif) : nom du tag (p. ex. `latest`)

Remarques :

- Si ni `version` ni `tag` ne sont fournis, la version la plus récente est utilisée.
- Les versions supprimées de manière réversible renvoient `410`.
- Les transferts de Skills adossés à GitHub ne transmettent ni ne répliquent les octets. La réponse JSON
  comprend `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  et `archiveUrl` ; l’état de l’analyse/de la version actuelle sert de contrôle et n’est pas inclus dans les métadonnées
  de la charge utile en cas de réussite.
- Les statistiques de téléchargement comptabilisent les identités uniques par jour UTC (`userId` lorsque le jeton d’API est valide, sinon l’adresse IP).

## Points de terminaison d’authentification (jeton Bearer)

Tous les points de terminaison nécessitent :

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valide le jeton et renvoie l’identifiant de l’utilisateur.

### `POST /api/v1/skills`

Publie une nouvelle version.

- Méthode recommandée : `multipart/form-data` avec du JSON dans `payload` et des blobs dans `files[]`.
- Un corps JSON avec `files` (basé sur storageId) est également accepté.
- Champ de charge utile facultatif : `ownerHandle`. Lorsqu’il est présent, l’API résout ce
  publisher côté serveur et exige que l’acteur dispose d’un accès au publisher.
- Champ de charge utile facultatif : `migrateOwner`. Lorsque sa valeur est `true` avec `ownerHandle`, une
  skill existante peut être transférée vers ce propriétaire si l’acteur est administrateur/propriétaire des deux
  publishers, actuel et cible. Sans cette activation explicite, les changements de propriétaire sont
  rejetés.

### `POST /api/v1/packages`

Publie une version d’un Plugin de code ou d’un Plugin groupé.

- Nécessite une authentification par jeton Bearer.
- Nécessite `multipart/form-data`.
- Les champs de formulaire autorisés sont `payload`, des blobs `files` répétés, ou une référence
  unique à une archive tar `clawpack`. `clawpack` peut être un blob `.tgz` ou un identifiant de stockage renvoyé par
  le flux d’URL de téléversement. Les publications intermédiaires utilisant un identifiant de stockage doivent également inclure le
  `clawpackUploadTicket` renvoyé avec cette URL de téléversement.
- Utilisez soit `files`, soit `clawpack`, mais jamais les deux dans la même requête.
- Les corps JSON et les métadonnées `payload.files` / `payload.artifact`
  fournies par l’appelant sont rejetés.
- Les requêtes de publication multipart directes sont limitées à 18MB. Les archives tar ClawPack peuvent
  utiliser le flux d’URL de téléversement jusqu’à la limite de 120MB par archive tar.
- Champ facultatif de la charge utile : `ownerHandle`. Lorsqu’il est présent, seuls les administrateurs peuvent publier au nom de ce propriétaire.

Points clés de la validation :

- `family` doit être `code-plugin` ou `bundle-plugin`.
- Les paquets de Plugin nécessitent `openclaw.plugin.json`. Les téléversements ClawPack `.tgz` doivent
  le contenir à l’emplacement `package/openclaw.plugin.json`.
- Les Plugins de code nécessitent `package.json`, les métadonnées du dépôt source, les métadonnées du commit
  source, les métadonnées du schéma de configuration, `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
- Seul l’éditeur de l’organisation `openclaw` et les éditeurs personnels des membres actuels de
  l’organisation `openclaw` peuvent publier sur le canal `official`.
- Les publications effectuées au nom d’un tiers valident tout de même l’éligibilité au canal officiel par rapport au compte du propriétaire cible.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Supprimez temporairement ou restaurez une Skill (propriétaire, modérateur ou administrateur).

Corps JSON facultatif :

```json
{ "reason": "Conservée pour modération dans l’attente d’un examen juridique." }
```

Lorsqu’il est présent, `reason` est enregistré comme note de modération de la Skill et copié dans le journal d’audit.
Les suppressions temporaires effectuées par le propriétaire réservent le slug pendant 30 jours, après quoi il peut être revendiqué par
un autre éditeur. La réponse de suppression inclut `slugReservedUntil` lorsque cette expiration s’applique.
Les masquages effectués par un modérateur ou un administrateur et les suppressions pour raisons de sécurité n’expirent pas de cette manière.

Réponse de suppression :

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Codes d’état :

- `200` : OK
- `401` : non autorisé
- `403` : interdit
- `404` : skill/utilisateur introuvable
- `500` : erreur interne du serveur

### `POST /api/v1/users/publisher`

Réservé aux administrateurs. Garantit qu’un éditeur d’organisation existe pour un identifiant. Si l’identifiant pointe encore vers un
ancien utilisateur partagé/éditeur personnel, le point de terminaison le migre d’abord vers un éditeur d’organisation.
Pour une organisation nouvellement créée, fournissez `memberHandle` ; l’administrateur qui effectue l’opération n’est pas ajouté comme membre.
La valeur par défaut de `memberRole` est `owner`.

- Corps : `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Création authentifiée en libre-service d’un éditeur d’organisation. Crée un nouvel éditeur d’organisation et ajoute
l’appelant en tant que propriétaire. Ce point de terminaison ne migre pas les identifiants d’utilisateur/personnels existants et
ne marque pas l’éditeur comme approuvé/officiel.

- Corps : `{ "handle": "opik", "displayName": "Opik" }`
- Réponse : `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Renvoie `409` lorsque l’identifiant est déjà utilisé par un éditeur, un utilisateur ou un éditeur personnel.

### `POST /api/v1/users/reserve`

Réservé aux administrateurs. Réserve des slugs racine et des noms de paquets à leur propriétaire légitime sans publier de
version. Les noms de paquets deviennent des paquets substitutifs privés sans ligne de version, afin que le même
propriétaire puisse ensuite publier la véritable version du plugin de code ou du plugin groupé sous ce nom.

- Corps : `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Réponse : `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Réservé aux administrateurs. Récupère un éditeur personnel pour une identité principale GitHub OAuth de remplacement vérifiée
sans modifier les lignes de compte Convex Auth. La requête doit indiquer les deux identifiants de compte immuables du
fournisseur GitHub ; les identifiants modifiables servent uniquement de garde-fou destiné à l’opérateur.

Le point de terminaison utilise par défaut le mode simulation. L’application de la récupération nécessite `dryRun: false` et
`confirmIdentityVerified: true` après que le personnel a vérifié indépendamment la continuité entre les deux
identités principales GitHub. La récupération échoue de manière sécurisée lorsque l’éditeur personnel actuel
de l’utilisateur de destination possède des Skills, des paquets ou des sources de Skills GitHub.
La récupération migre également les anciens champs `ownerUserId` des Skills de l’éditeur récupéré,
les alias de slug de Skill, les paquets, les avertissements de l’inspecteur de paquets et les lignes dérivées de condensé de recherche afin que
les chemins de propriétaire direct correspondent à la nouvelle autorité de l’éditeur. Une réservation active de pseudonyme protégé
pour le pseudonyme récupéré est également réattribuée à l’utilisateur de remplacement afin qu’une synchronisation
ultérieure du profil ne puisse pas restaurer l’autorité concurrente de l’ancien utilisateur. Chaque table principale est limitée à
100 lignes par transaction d’application ; les récupérations plus importantes doivent d’abord utiliser une migration de propriétaire reprenable.
Les sources de Skills GitHub sont limitées à l’éditeur et signalées comme vérifiées plutôt que réécrites.

- Corps : `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Réponse : `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Points de terminaison de gestion des slugs par le propriétaire

- `POST /api/v1/skills/{slug}/rename`
  - Corps : `{ "newSlug": "new-canonical-slug" }`
  - Réponse : `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corps : `{ "targetSlug": "canonical-target-slug" }`
  - Réponse : `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Remarques :

- Les deux points de terminaison nécessitent une authentification par jeton d’API et ne fonctionnent que pour le propriétaire du Skill.
- `rename` conserve le slug précédent comme alias de redirection.
- `merge` masque la fiche source et redirige le slug source vers la fiche cible.

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
  - Format de la réponse : `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bannir un utilisateur et supprimer définitivement les Skills qu’il possède (modérateur/administrateur uniquement).

Corps :

```json
{ "handle": "user_handle", "reason": "motif facultatif du bannissement" }
```

ou

```json
{ "userId": "users_...", "reason": "motif facultatif du bannissement" }
```

Réponse :

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Lever le bannissement d’un utilisateur et restaurer les Skills admissibles (administrateur uniquement).

Corps :

```json
{ "handle": "user_handle", "reason": "motif facultatif de la levée du bannissement" }
```

ou

```json
{ "userId": "users_...", "reason": "motif facultatif de la levée du bannissement" }
```

Réponse :

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Modifier le motif enregistré d’un bannissement existant sans lever le bannissement ni restaurer
le contenu (administrateur uniquement). Utilise par défaut le mode simulation, sauf si `dryRun` vaut `false`.

Corps :

```json
{ "handle": "user_handle", "reason": "spam de publication en masse", "dryRun": true }
```

ou

```json
{ "userId": "users_...", "reason": "spam de publication en masse", "dryRun": false }
```

Réponse :

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "bannissement automatique pour logiciel malveillant",
  "nextReason": "spam de publication en masse",
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

Répertorier ou rechercher des utilisateurs (administrateur uniquement).

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
      "displayName": "Utilisateur",
      "name": "Utilisateur",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Ajouter/supprimer une étoile (mise en évidence). Les deux points de terminaison sont idempotents.

Réponses :

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Anciens points de terminaison de la CLI (obsolètes)

Toujours pris en charge pour les anciennes versions de la CLI :

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consultez `DEPRECATIONS.md` pour le plan de suppression.

`POST /api/cli/upload-url` renvoie `uploadUrl` et `uploadTicket`. Les publications de
paquets qui préparent une archive tar ClawPack doivent envoyer l’identifiant de stockage obtenu dans
`clawpack` et le ticket renvoyé dans `clawpackUploadTicket`.

## Découverte du registre (`/.well-known/clawhub.json`)

La CLI peut découvrir les paramètres du registre et de l’authentification à partir du site :

- `/.well-known/clawhub.json` (JSON, recommandé)
- `/.well-known/clawdhub.json` (ancien)

Schéma :

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Si vous auto-hébergez le service, mettez ce fichier à disposition (ou définissez explicitement `CLAWHUB_REGISTRY` ; anciennement `CLAWDHUB_REGISTRY`).
