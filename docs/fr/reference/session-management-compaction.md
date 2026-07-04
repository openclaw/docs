---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcript ou les champs de sessions.json
    - Vous modifiez le comportement de la Compaction automatique ou ajoutez des tâches de maintenance de « pré-Compaction »
    - Vous voulez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions + transcriptions, cycle de vie et mécanismes internes de la Compaction (automatique)'
title: Présentation approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-07-04T20:30:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants correspondent à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu'il suit
- **Persistance des transcriptions** (`*.jsonl`) et sa structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (Compaction manuelle et automatique) et où accrocher le travail de pré-Compaction
- **Maintenance silencieuse** (écritures mémoire qui ne doivent pas produire de sortie visible par l'utilisateur)

Si vous voulez d'abord une vue d'ensemble de plus haut niveau, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d'ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène des transcriptions](/fr/reference/transcript-hygiene)

---

## Source de vérité : le Gateway

OpenClaw est conçu autour d'un unique **processus Gateway** qui possède l'état des sessions.

- Les interfaces utilisateur (application macOS, interface web Control UI, TUI) doivent interroger le Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l'hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce qu'utilise le Gateway.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session courant, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d'outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle pour les tours futurs
   - Les points de contrôle de Compaction sont des métadonnées sur la transcription successeur compactée. Les nouvelles Compactions n'écrivent pas une seconde copie `.checkpoint.*.jsonl`.

Les lecteurs d'historique du Gateway doivent éviter de matérialiser toute la transcription, sauf si
la surface a explicitement besoin d'un accès historique arbitraire. L'historique de première page,
l'historique de discussion intégré, la récupération après redémarrage et les vérifications de jetons/d'utilisation utilisent des lectures bornées de fin de fichier. Les analyses complètes de transcription passent par l'index de transcription asynchrone, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre les lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l'hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles du disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers latéraux de trajectoire :

- `mode` : `enforce` (par défaut) ou `warn`
- `pruneAfter` : seuil d'âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond d'entrées dans `sessions.json` (par défaut `500`)
- La rétention des sondes de courte durée d'exécution de modèle du Gateway est fixée à `24h`, mais elle est conditionnée par la pression : elle supprime uniquement les lignes de sonde strictes obsolètes lorsque la maintenance/le plafonnement des entrées de session atteint une pression. Cela s'applique uniquement aux clés de sonde explicites strictes correspondant à `agent:*:explicit:model-run-<uuid>` et s'exécute avant le nettoyage/plafonnement global des entrées obsolètes lorsqu'il s'exécute.
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway passent par un rédacteur de session par magasin qui sérialise les mutations en processus sans prendre de verrou de fichier d'exécution. Les assistants de correctif des chemins critiques empruntent le cache mutable validé tant qu'ils détiennent ce créneau de rédaction, de sorte que les gros fichiers `sessions.json` ne sont pas clonés ni relus à chaque mise à jour de métadonnées. Le code d'exécution doit privilégier `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` ; les sauvegardes directes de tout le magasin sont des outils de compatibilité et de maintenance hors ligne. Lorsqu'un Gateway est accessible, les commandes non à blanc `openclaw sessions cleanup` et `openclaw agents delete` délèguent les mutations du magasin au Gateway afin que le nettoyage rejoigne la même file de rédaction ; `--store <path>` est le chemin explicite de réparation hors ligne pour la maintenance directe des fichiers. Le nettoyage `maxEntries` reste traité par lots pour les plafonds de taille production, de sorte qu'un magasin peut brièvement dépasser le plafond configuré avant que le prochain nettoyage de niveau haut ne le réécrive à la baisse. Les lectures du magasin de sessions n'élaguent ni ne plafonnent les entrées pendant le démarrage du Gateway ; utilisez les écritures ou `openclaw sessions cleanup --enforce` pour le nettoyage. `openclaw sessions cleanup --enforce` applique toujours immédiatement le plafond configuré et élague les anciens artefacts de transcription, de point de contrôle et de trajectoire non référencés, même lorsqu'aucun budget disque n'est configuré.

La maintenance conserve les pointeurs de conversation externes durables, tels que les sessions de groupe
et les sessions de discussion limitées à un fil, mais les entrées d'exécution synthétiques pour Cron, les hooks,
Heartbeat, ACP et les sous-agents peuvent tout de même être supprimées lorsqu'elles dépassent
l'âge, le nombre ou le budget disque configuré. Les sessions de sonde d'exécution de modèle du Gateway utilisent la
rétention distincte de modèle de `24h` uniquement lorsque leur clé correspond exactement à
`agent:*:explicit:model-run-<uuid>` ; les autres sessions explicites ne font pas partie de
cette rétention. Le nettoyage des exécutions de modèle n'est appliqué qu'en cas de pression sur le plafond
des entrées de session. Les exécutions Cron isolées conservent leur propre contrôle `cron.sessionRetention`,
indépendant de la rétention des sondes d'exécution de modèle.

OpenClaw ne crée plus de sauvegardes de rotation automatiques `sessions.json.bak.*` lors des écritures du Gateway. La clé héritée `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent un verrou d'écriture de session sur le fichier de transcription. L'acquisition du verrou attend jusqu'à
`session.writeLock.acquireTimeoutMs` avant de signaler une erreur de session occupée ; la valeur par défaut est `60000`
ms. Augmentez cette valeur uniquement lorsque des travaux légitimes de préparation, de nettoyage, de Compaction ou de miroir de transcription entrent en concurrence
plus longtemps sur des machines lentes. `session.writeLock.staleMs` contrôle quand un verrou existant peut être
récupéré comme obsolète ; la valeur par défaut est `1800000` ms. `session.writeLock.maxHoldMs` contrôle le
seuil de libération du chien de garde en processus ; la valeur par défaut est `300000` ms. Les remplacements d'urgence par variable d'environnement sont
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` et
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordre d'application du nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d'abord les artefacts les plus anciens archivés, les transcriptions orphelines ou les trajectoires orphelines.
2. Si la cible est toujours dépassée, évincer les plus anciennes entrées de session et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu'à ce que l'utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin/les fichiers.

Exécutez la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d'exécution

Les exécutions Cron isolées créent également des entrées de session/transcriptions, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d'exécution Cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.keepLines` élague les lignes d'historique d'exécution SQLite conservées par tâche Cron (par défaut : `2000`). `cron.runLog.maxBytes` reste accepté pour les anciens journaux d'exécution basés sur fichiers.

Lorsque Cron force la création d'une nouvelle session d'exécution isolée, il assainit l'entrée de session précédente
`cron:<jobId>` avant d'écrire la nouvelle ligne. Il conserve les préférences sûres
telles que les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification sélectionnés par l'utilisateur. Il supprime le contexte de conversation ambiant
tel que le routage de canal/groupe, la politique d'envoi ou de file d'attente, l'élévation, l'origine et la liaison d'exécution ACP
afin qu'une nouvelle exécution isolée ne puisse pas hériter d'une livraison ou d'une autorité d'exécution obsolète
provenant d'une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous vous trouvez (routage + isolation).

Modèles courants :

- Discussion principale/directe (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` courant (le fichier de transcription qui poursuit la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut 4 h 00, heure locale sur l'hôte Gateway) crée un nouveau `sessionId` au prochain message après la limite de réinitialisation.
- **Expiration d'inactivité** (`session.reset.idleMinutes` ou l'ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu'un message arrive après la fenêtre d'inactivité. Lorsque la réinitialisation quotidienne et l'inactivité sont toutes deux configurées, la première qui expire l'emporte.
- **Reprise de reconnexion Control UI** peut préserver la session actuellement visible pour un envoi de reconnexion lorsque le Gateway reçoit le `sessionId` correspondant d'un client d'interface opérateur. Les envois obsolètes ordinaires créent toujours un nouveau `sessionId`.
- **Événements système** (Heartbeat, réveils Cron, notifications d'exécution, comptabilité du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité. Le basculement de réinitialisation supprime les notifications d'événement système en file d'attente pour la session précédente avant que la nouvelle invite soit construite.
- **Politique de branchement parent** utilise la branche active d'OpenClaw lors de la création d'un fil ou d'un branchement de sous-agent. Si cette branche est trop volumineuse, OpenClaw démarre l'enfant avec un contexte isolé au lieu d'échouer ou d'hériter d'un historique inutilisable. La politique de dimensionnement est automatique ; l'ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d'implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (non exhaustif) :

- `sessionId` : id de transcription actuel (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour le `sessionId` actuel ; réinitialisation quotidienne
  la fraîcheur utilise cette valeur. Les lignes héritées peuvent la dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière véritable interaction utilisateur/canal ; réinitialisation d’inactivité
  la fraîcheur utilise cette valeur afin que les événements Heartbeat, Cron et exec ne maintiennent pas les sessions
  actives. Les lignes héritées sans ce champ se rabattent sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du stockage, utilisé pour le listing, l’élagage et
  la tenue de registre. Il ne fait pas autorité pour la fraîcheur de réinitialisation quotidienne/inactive.
- `archivedAt` : horodatage d’archivage facultatif. Les sessions archivées restent dans le stockage
  avec leur transcription intacte et sont exclues des listings actifs normaux.
- `pinnedAt` : horodatage d’épinglage facultatif. Les sessions actives épinglées sont triées avant les
  sessions non épinglées ; l’archivage d’une session efface son épinglage.
- Interopérabilité des fils Codex : les deux champs suivent la forme de gestion des fils de Codex —
  les booléens `archived`/`pinned` sur le fil sont toujours dérivés de
  l’horodatage et horodatés côté serveur, conformément à la sémantique Codex `threads.archived_at`
  et à la sérialisation camelCase. Les horodatages OpenClaw sont en millisecondes
  depuis l’époque, tandis que Codex utilise des secondes depuis l’époque ; les passerelles convertissent donc à la
  jonction du plugin codex. Codex n’a pas encore d’API d’épinglage (`thread/archive`/`thread/unarchive`
  uniquement) ; l’état épinglé reste côté OpenClaw jusqu’à ce qu’une API existe, moment où la
  forme correspondante permettra aux sessions liées d’effectuer mécaniquement un aller-retour de l’état d’épinglage.
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage de groupe/canal
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage de mémoire avant Compaction
- `memoryFlushCompactionCount` : nombre de Compaction au moment du dernier vidage

Le stockage peut être modifié sans risque, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées à mesure que les sessions s’exécutent.

---

## Structure de transcription (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent bien_ dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persistant avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persistant lors de la navigation dans une branche d’arbre

OpenClaw ne « corrige » volontairement pas les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts distincts sont importants :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (jetons visibles par le modèle)
2. **Compteurs du stockage de session** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte vient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le stockage est une valeur d’estimation/rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : définition

La Compaction résume les anciennes conversations dans une entrée `compaction` persistante de la transcription et conserve les messages récents intacts.

Après la Compaction, les tours futurs voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La réinjection de sections AGENTS.md après Compaction est facultative via
`agents.defaults.compaction.postCompactionSections` ; lorsque la valeur est absente ou `[]`,
OpenClaw n’ajoute pas d’extraits AGENTS.md au-dessus du résumé de Compaction.

La Compaction est **persistante** (contrairement à l’élagage de session). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites des fragments de Compaction et appariement des outils

Quand OpenClaw divise une longue transcription en fragments de Compaction, il conserve
les appels d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si la division par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc final de résultats d’outil ferait autrement dépasser la cible au fragment,
  OpenClaw préserve ce bloc d’outils en attente et garde la queue non résumée
  intacte.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas ouverte une division en attente.

---

## Quand la Compaction automatique se produit (runtime OpenClaw)

Dans l’agent OpenClaw intégré, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires propres aux fournisseurs) → compacter → réessayer.
   Lorsque le fournisseur signale le nombre de jetons tenté, OpenClaw transmet ce
   nombre observé à la Compaction de récupération après dépassement. Si le fournisseur confirme
   le dépassement mais n’expose pas de nombre analysable, OpenClaw transmet aux moteurs de Compaction
   et aux diagnostics un nombre synthétique minimalement au-dessus du budget.
   Si la récupération après dépassement échoue encore, OpenClaw présente des consignes explicites à
   l’utilisateur et préserve le mappage de session actuel au lieu de faire tourner silencieusement
   la clé de session vers un nouvel id de session. L’étape suivante est contrôlée par l’opérateur :
   réessayer le message, exécuter `/compact`, ou exécuter `/new` lorsqu’une nouvelle session est
   préférable.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée pour les prompts + la prochaine sortie du modèle

Ce sont les sémantiques du runtime OpenClaw.

OpenClaw peut aussi déclencher une Compaction locale de prévol avant d’ouvrir la prochaine
exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le
fichier de transcription actif atteint cette taille. C’est une garde de taille de fichier pour le coût
de réouverture locale, pas un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale,
et cela exige `truncateAfterCompaction` afin que le résumé compacté puisse devenir une
nouvelle transcription successeure.

Pour les exécutions OpenClaw intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute une garde facultative de boucle d’outils. Après l’ajout d’un résultat d’outil et avant le
prochain appel de modèle, OpenClaw estime la pression sur le prompt avec la même logique de budget
de prévol que celle utilisée au début du tour. Si le contexte ne tient plus, la garde ne
compacte pas dans le hook `transformContext` du runtime OpenClaw. Elle émet un signal structuré
de précontrôle en milieu de tour, arrête la soumission du prompt en cours et laisse la
boucle d’exécution externe utiliser le chemin de récupération existant : tronquer les résultats d’outil trop volumineux
lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer. L’option
est désactivée par défaut et fonctionne avec les modes de Compaction `default` et `safeguard`,
y compris la Compaction safeguard adossée à un fournisseur.
C’est indépendant de `maxActiveTranscriptBytes` : la garde de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que le précontrôle en milieu de tour s’exécute plus tard dans la boucle d’outils
OpenClaw intégrée, après l’ajout de nouveaux résultats d’outil.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction du runtime OpenClaw résident dans les paramètres d’agent :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique aussi un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` jetons.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- S’il est déjà plus élevé, OpenClaw le laisse tel quel.
- Le `/compact` manuel respecte un `agents.defaults.compaction.keepRecentTokens` explicite
  et conserve le point de coupe de queue récente du runtime OpenClaw. Sans budget de conservation explicite,
  la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit démarre depuis
  le nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter le
  précontrôle facultatif de boucle d’outils après les nouveaux résultats d’outil et avant le prochain appel de modèle.
  Ce n’est qu’un déclencheur ; la génération du résumé utilise toujours le chemin de Compaction
  configuré. C’est indépendant de `maxActiveTranscriptBytes`, qui est une garde de taille en octets
  de transcription active au démarrage du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne telle que `"20mb"` pour exécuter la Compaction locale avant un tour lorsque la transcription active
  devient volumineuse. Cette garde n’est active que lorsque
  `truncateAfterCompaction` est également activé. Laissez la valeur non définie ou définissez `0` pour
  désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait tourner la transcription active vers un successeur JSONL compacté après
  la Compaction. Les actions de point de contrôle branche/restauration utilisent ce successeur compacté ;
  les fichiers de point de contrôle hérités d’avant Compaction restent lisibles tant qu’ils sont référencés.

Pourquoi : laisser assez de marge pour la « maintenance » multi-tours (comme les écritures mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `applyAgentCompactionSettingsFromConfig()` dans `src/agents/agent-settings.ts`
(appelé depuis les chemins de configuration du tour de l’exécuteur intégré et de la Compaction).

---

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API du plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’id d’un fournisseur enregistré, l’extension safeguard délègue le résumé à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : id d’un Plugin fournisseur de Compaction enregistré. Laissez non défini pour le résumé LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte de suffixe des tours récents et des tours divisés après la sortie du fournisseur.
- Le résumé safeguard intégré redistille les résumés précédents avec les nouveaux messages
  au lieu de préserver textuellement le résumé précédent complet.
- Le mode safeguard active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw se rabat automatiquement sur le résumé LLM intégré.
- Les signaux d’abandon/expiration sont relancés (non absorbés) afin de respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la Compaction et l’état de session via :

- `/status` (dans n’importe quelle session de discussion)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Journaux du Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`) : `embedded run auto-compaction start` + `complete`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de Compaction

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches d’arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas transmettre de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression exacte du jeton silencieux est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque la charge utile entière est uniquement le jeton silencieux.
- Cela est réservé aux véritables tours en arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires nécessitant une action.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/frappe** lorsqu’un
fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle au milieu du tour.

---

## « Vidage de mémoire » pré-Compaction (implémenté)

Objectif : avant que la Compaction automatique se produise, exécuter un tour agentique silencieux qui écrit un état
durable sur le disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer le contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle dépasse un « seuil souple » (inférieur au seuil de Compaction du runtime OpenClaw), exécuter une directive silencieuse
   « écrire la mémoire maintenant » pour l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (surcharge optionnelle exacte du fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (invite système supplémentaire ajoutée pour le tour de vidage)

Notes :

- L’invite par défaut/l’invite système par défaut incluent une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la chaîne de secours
  de la session active, afin que la maintenance locale uniquement ne bascule pas silencieusement
  vers un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage s’exécute uniquement pour les sessions OpenClaw intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les schémas d’écriture.

OpenClaw expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw réside aujourd’hui côté Gateway.

---

## Liste de vérification pour le dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incompatibilité entre le magasin et la transcription ? Confirmez l’hôte Gateway et le chemin du magasin avec `openclaw status`.
- Compaction répétitive ? Vérifiez :
  - fenêtre de contexte du modèle (trop petite)
  - paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Des tours silencieux divulguent du contenu ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez un build qui inclut le correctif de suppression du streaming.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
