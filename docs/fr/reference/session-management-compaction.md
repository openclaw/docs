---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement de Compaction automatique ou ajoutez des tâches de maintenance « pré-Compaction »
    - Vous voulez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : magasin de sessions + transcriptions, cycle de vie et mécanismes internes de (auto)compaction'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-06-27T18:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage de session** (comment les messages entrants sont associés à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et sa structure
- **Hygiène des transcriptions** (corrections propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte et jetons suivis)
- **Compaction** (Compaction manuelle et automatique) et où raccorder le travail pré-Compaction
- **Entretien silencieux** (écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous voulez d’abord une vue d’ensemble plus générale, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène des transcriptions](/fr/reference/transcript-hygiene)

---

## Source de vérité : le Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, interface web Control UI, TUI) doivent interroger le Gateway pour les listes de sessions et les décomptes de jetons.
- En mode distant, les fichiers de session sont sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions en deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle lors des tours futurs
   - Les points de contrôle de Compaction sont des métadonnées sur la transcription successeure compactée. Les nouvelles Compactions n’écrivent pas une seconde copie `.checkpoint.*.jsonl`.

Les lecteurs d’historique du Gateway doivent éviter de matérialiser toute la transcription sauf si
la surface a explicitement besoin d’un accès arbitraire à l’historique. L’historique de première page,
l’historique de discussion intégré, la récupération après redémarrage et les vérifications de jetons/d’utilisation utilisent des lectures bornées de fin de fichier. Les analyses complètes de transcription passent par l’index asynchrone des transcriptions, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l’hôte du Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles de disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers annexes de trajectoire :

- `mode` : `enforce` (par défaut) ou `warn`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond d’entrées dans `sessions.json` (par défaut `500`)
- La rétention des sondes de courte durée d’exécution de modèle du Gateway est fixée à `24h`, mais elle est déclenchée par pression : elle supprime uniquement les lignes de sonde strictes obsolètes lorsque la pression de maintenance/plafond des entrées de session est atteinte. Cela s’applique uniquement aux clés de sonde explicites strictes correspondant à `agent:*:explicit:model-run-<uuid>` et s’exécute avant le nettoyage/plafonnement global des entrées obsolètes lorsqu’il s’exécute.
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway passent par un rédacteur de sessions par magasin qui sérialise les mutations dans le processus sans prendre de verrou de fichier à l’exécution. Les helpers de correctif sur chemin critique empruntent le cache mutable validé pendant qu’ils détiennent cet emplacement de rédacteur, afin que les gros fichiers `sessions.json` ne soient pas clonés ni relus pour chaque mise à jour de métadonnées. Le code d’exécution doit préférer `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` ; les sauvegardes directes du magasin complet sont des outils de compatibilité et de maintenance hors ligne. Lorsqu’un Gateway est joignable, `openclaw sessions cleanup` sans `--dry-run` et `openclaw agents delete` délèguent les mutations du magasin au Gateway afin que le nettoyage rejoigne la même file d’écriture ; `--store <path>` est le chemin explicite de réparation hors ligne pour la maintenance directe de fichier. Le nettoyage `maxEntries` reste traité par lots pour les plafonds de taille production, un magasin peut donc dépasser brièvement le plafond configuré avant que le prochain nettoyage de seuil haut ne le réduise de nouveau. Les lectures du magasin de sessions n’élaguent ni ne plafonnent les entrées au démarrage du Gateway ; utilisez des écritures ou `openclaw sessions cleanup --enforce` pour le nettoyage. `openclaw sessions cleanup --enforce` applique toujours immédiatement le plafond configuré et élague les anciens artefacts de transcription, de point de contrôle et de trajectoire non référencés, même lorsqu’aucun budget disque n’est configuré.

La maintenance conserve les pointeurs durables de conversations externes tels que les sessions de groupe
et les sessions de discussion limitées à un fil, mais les entrées d’exécution synthétiques pour cron, hooks,
Heartbeat, ACP et sous-agents peuvent tout de même être supprimées lorsqu’elles dépassent
l’âge, le nombre ou le budget disque configurés. Les sessions de sonde d’exécution de modèle du Gateway utilisent la
rétention séparée de modèle de `24h` uniquement lorsque leur clé correspond exactement à
`agent:*:explicit:model-run-<uuid>` ; les autres sessions explicites ne font pas partie de
cette rétention. Le nettoyage des exécutions de modèle n’est appliqué qu’en cas de pression de plafond
des entrées de session. Les exécutions cron isolées conservent leur propre contrôle `cron.sessionRetention`,
indépendant de la rétention des sondes d’exécution de modèle.

OpenClaw ne crée plus de sauvegardes automatiques par rotation `sessions.json.bak.*` pendant les écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent un verrou d’écriture de session sur le fichier de transcription. L’acquisition du verrou attend jusqu’à
`session.writeLock.acquireTimeoutMs` avant de remonter une erreur de session occupée ; la valeur par défaut est `60000`
ms. N’augmentez cette valeur que lorsque des travaux légitimes de préparation, nettoyage, Compaction ou miroir de transcription sont en concurrence
plus longtemps sur des machines lentes. `session.writeLock.staleMs` contrôle quand un verrou existant peut être
récupéré comme obsolète ; la valeur par défaut est `1800000` ms. `session.writeLock.maxHoldMs` contrôle le
seuil de libération par watchdog dans le processus ; la valeur par défaut est `300000` ms. Les remplacements d’urgence par variable d’environnement sont
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` et
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les trajectoires orphelines.
2. Si l’utilisation reste au-dessus de la cible, évincer les plus anciennes entrées de session et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions cron isolées créent aussi des entrées/transcriptions de session, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.keepLines` élague les lignes d’historique d’exécution SQLite conservées par tâche cron (par défaut : `2000`). `cron.runLog.maxBytes` reste accepté pour les anciens journaux d’exécution adossés à des fichiers.

Lorsqu’un cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il transporte les préférences sûres
telles que les réglages de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant tel
que le routage de canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution
ACP afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou
d’une autorité d’exécution depuis une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous vous trouvez (routage + isolation).

Motifs courants :

- Discussion principale/directe (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (le fichier de transcription qui poursuit la conversation).

Règles pratiques :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut 4 h 00 heure locale sur l’hôte du gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première échéance l’emporte.
- **Reprise à la reconnexion de la Control UI** peut préserver la session actuellement visible pour un envoi de reconnexion lorsque le Gateway reçoit le `sessionId` correspondant depuis un client d’interface opérateur. Les envois ordinaires obsolètes créent toujours un nouveau `sessionId`.
- **Événements système** (Heartbeat, réveils cron, notifications exec, tenue de registre du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité. Le basculement de réinitialisation écarte les avis d’événements système en file d’attente pour la session précédente avant de construire la nouvelle invite.
- **Politique de fork parent** utilise la branche active d’OpenClaw lors de la création d’un fil ou d’un fork de sous-agent. Si cette branche est trop grande, OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. La politique de dimensionnement est automatique ; l’ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (non exhaustif) :

- `sessionId` : identifiant de transcription actuel (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour le `sessionId` actuel ; la fraîcheur de réinitialisation quotidienne
  l’utilise. Les anciennes lignes peuvent le déduire de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation
  d’inactivité l’utilise afin que les événements Heartbeat, cron et exec ne maintiennent pas les sessions
  en vie. Les anciennes lignes sans ce champ retombent sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du magasin, utilisé pour le listage, l’élagage et
  la tenue de registre. Il ne fait pas autorité pour la fraîcheur de réinitialisation quotidienne/inactivité.
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage de groupe/canal
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection de modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : fréquence à laquelle la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage de la dernière vidange mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compactions lorsque la dernière vidange s’est exécutée

Le magasin est sûr à modifier, mais le Gateway fait autorité : il peut réécrire ou réhydrater des entrées pendant l’exécution des sessions.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par l’extension qui _entrent bien_ dans le contexte du modèle (peuvent être masqués dans l’UI)
- `custom` : état de l’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de compaction persistant avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persistant lors de la navigation dans une branche d’arbre

OpenClaw ne « corrige » volontairement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (jetons visibles par le modèle)
2. **Compteurs du magasin de session** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de reporting à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : définition

La Compaction résume les parties anciennes de la conversation dans une entrée `compaction` persistante de la transcription et conserve les messages récents intacts.

Après la compaction, les tours futurs voient :

- Le résumé de compaction
- Les messages après `firstKeptEntryId`

La réinjection de sections AGENTS.md après compaction est opt-in via
`agents.defaults.compaction.postCompactionSections` ; lorsqu’elle est non définie ou vaut `[]`,
OpenClaw n’ajoute pas d’extraits AGENTS.md par-dessus le résumé de compaction.

La Compaction est **persistante** (contrairement à l’élagage de session). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites des fragments de compaction et appariement des outils

Quand OpenClaw divise une longue transcription en fragments de compaction, il garde
les appels d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si la division par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc de résultats d’outil final ferait autrement dépasser la cible au fragment,
  OpenClaw préserve ce bloc d’outil en attente et garde intacte la queue non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas une division en attente ouverte.

---

## Quand la compaction automatique se produit (runtime OpenClaw)

Dans l’agent OpenClaw embarqué, la compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires propres aux fournisseurs) → compacter → réessayer.
   Lorsque le fournisseur indique le nombre de jetons tenté, OpenClaw transmet ce
   nombre observé à la compaction de récupération après dépassement. Si le fournisseur confirme
   le dépassement mais n’expose pas de nombre analysable, OpenClaw transmet un nombre synthétique
   légèrement hors budget aux moteurs de compaction et aux diagnostics.
   Si la récupération après dépassement échoue encore, OpenClaw présente des consignes explicites à
   l’utilisateur et préserve le mappage de session actuel au lieu de faire tourner silencieusement
   la clé de session vers un nouvel id de session. L’étape suivante est contrôlée par l’opérateur :
   réessayer le message, exécuter `/compact`, ou exécuter `/new` lorsqu’une nouvelle session est
   préférable.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux invites + à la prochaine sortie du modèle

Ce sont les sémantiques du runtime OpenClaw.

OpenClaw peut aussi déclencher une compaction locale préalable avant d’ouvrir la prochaine
exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le
fichier de transcription actif atteint cette taille. Il s’agit d’une garde de taille de fichier pour le coût
de réouverture locale, pas d’archivage brut : OpenClaw exécute toujours la compaction sémantique normale,
et elle nécessite `truncateAfterCompaction` afin que le résumé compacté puisse devenir une
nouvelle transcription successeure.

Pour les exécutions OpenClaw embarquées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute une garde opt-in de boucle d’outils. Après l’ajout d’un résultat d’outil et avant le
prochain appel au modèle, OpenClaw estime la pression sur l’invite avec la même logique de budget
préalable utilisée au début du tour. Si le contexte ne tient plus, la garde ne
compacte pas dans le hook `transformContext` du runtime OpenClaw. Elle émet un signal structuré
de précontrôle en milieu de tour, arrête la soumission d’invite en cours et laisse la
boucle d’exécution externe utiliser le chemin de récupération existant : tronquer les résultats d’outils surdimensionnés
lorsque cela suffit, ou déclencher le mode de compaction configuré et réessayer. L’option
est désactivée par défaut et fonctionne avec les modes de compaction `default` et `safeguard`,
y compris la compaction safeguard adossée à un fournisseur.
C’est indépendant de `maxActiveTranscriptBytes` : la garde de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que le précontrôle en milieu de tour s’exécute plus tard dans la boucle d’outils
OpenClaw embarquée après l’ajout de nouveaux résultats d’outils.

---

## Paramètres de compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de compaction du runtime OpenClaw résident dans les paramètres de l’agent :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw impose aussi un plancher de sécurité pour les exécutions embarquées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` jetons.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- S’il est déjà plus élevé, OpenClaw le laisse inchangé.
- Le `/compact` manuel respecte un `agents.defaults.compaction.keepRecentTokens`
  explicite et conserve le point de coupe de queue récente du runtime OpenClaw. Sans budget de conservation explicite,
  la compaction manuelle reste un point de contrôle strict et le contexte reconstruit démarre à partir
  du nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter le
  précontrôle optionnel de boucle d’outils après les nouveaux résultats d’outils et avant le prochain appel au
  modèle. Ce n’est qu’un déclencheur ; la génération du résumé utilise toujours le chemin de
  compaction configuré. C’est indépendant de `maxActiveTranscriptBytes`, qui est une
  garde de taille en octets de la transcription active au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne telle que `"20mb"` pour exécuter une compaction locale avant un tour lorsque la transcription
  active devient volumineuse. Cette garde n’est active que lorsque
  `truncateAfterCompaction` est aussi activé. Laissez-la non définie ou définissez `0` pour
  désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait tourner la transcription active vers un JSONL successeur compacté après
  compaction. Les actions de point de contrôle de branche/restauration utilisent ce successeur compacté ;
  les anciens fichiers de point de contrôle pré-compaction restent lisibles tant qu’ils sont référencés.

Pourquoi : laisser assez de marge pour le « housekeeping » sur plusieurs tours (comme les écritures mémoire) avant que la compaction devienne inévitable.

Implémentation : `applyAgentCompactionSettingsFromConfig()` dans `src/agents/agent-settings.ts`
(appelé depuis les chemins de configuration du tour et de la compaction de l’exécuteur embarqué).

---

## Fournisseurs de compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de compaction via `registerCompactionProvider()` sur l’API du plugin. Lorsque `agents.defaults.compaction.provider` est défini sur un id de fournisseur enregistré, l’extension safeguard délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : id d’un plugin fournisseur de compaction enregistré. Laissez non défini pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte de suffixe des tours récents et des tours divisés après la sortie du fournisseur.
- La synthèse safeguard intégrée redistille les résumés antérieurs avec les nouveaux messages
  au lieu de préserver textuellement l’intégralité du résumé précédent.
- Le mode safeguard active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/expiration sont relancés (et non absorbés) afin de respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer l’état de la compaction et des sessions via :

- `/status` (dans toute session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Journaux du Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`) : `embedded run auto-compaction start` + `complete`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de compactions

---

## Housekeeping silencieux (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches d’arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw le retire/supprime dans la couche de livraison.
- La suppression du jeton silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous les deux lorsque toute la charge utile n’est que le jeton silencieux.
- Cela concerne uniquement les vrais tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires et actionnables.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/saisie** lorsqu’un
fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle en milieu de tour.

---

## « Vidage mémoire » pré-compaction (implémenté)

Objectif : avant la compaction automatique, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la compaction ne puisse pas
effacer le contexte critique.

OpenClaw utilise l’approche de **vidage pré-seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (inférieur au seuil de compaction du runtime OpenClaw), exécuter une directive silencieuse
   « écrire la mémoire maintenant » à l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` pour que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement exact facultatif fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (invite système supplémentaire ajoutée pour le tour de vidage)

Notes :

- L’invite et l’invite système par défaut incluent une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de fallback de session active, afin que le housekeeping local seul ne retombe pas silencieusement
  sur un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage s’exécute uniquement pour les sessions OpenClaw embarquées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

OpenClaw expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de vérification de dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incohérence entre magasin et transcription ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Spam de compaction ? Vérifiez :
  - fenêtre de contexte du modèle (trop petite)
  - paramètres de compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une compaction plus précoce)
  - gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Fuite de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez une build qui inclut le correctif de suppression du streaming.

## Associé

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
