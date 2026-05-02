---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement de Compaction automatique ou ajoutez des tâches de maintenance « pré-Compaction »
    - Vous souhaitez implémenter des purges de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions + transcriptions, cycle de vie et fonctionnement interne de la Compaction (automatique)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-05-02T21:01:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants sont associés à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (Compaction manuelle et automatique) et où brancher le travail de pré-Compaction
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

OpenClaw est conçu autour d’un seul **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, interface web de contrôle, TUI) doivent interroger le Gateway pour les listes de sessions et les décomptes de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions en deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou pour supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec une structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle lors des tours futurs
   - Les grands points de contrôle de débogage pré-Compaction sont ignorés une fois que la transcription active
     dépasse la limite de taille des points de contrôle, ce qui évite une deuxième copie géante
     `.checkpoint.*.jsonl`.

Les lecteurs d’historique du Gateway doivent éviter de matérialiser toute la transcription sauf si
la surface a explicitement besoin d’un accès historique arbitraire. L’historique de première page,
l’historique de chat intégré, la récupération après redémarrage et les vérifications de jetons/utilisation utilisent des lectures bornées de fin de fichier.
Les analyses complètes de transcription passent par l’index asynchrone de transcription, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre les lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l’hôte du Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujets Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers auxiliaires de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : limite des entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway passent par un écrivain de sessions par magasin qui sérialise les mutations dans le processus sans prendre de verrou de fichier à l’exécution. Les assistants de correctif sur le chemin critique empruntent le cache mutable validé pendant qu’ils détiennent cet emplacement d’écriture, afin que les grands fichiers `sessions.json` ne soient ni clonés ni relus à chaque mise à jour de métadonnées. Le code d’exécution doit préférer `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` ; les sauvegardes directes de tout le magasin sont des outils de compatibilité et de maintenance hors ligne. Lorsqu’un Gateway est joignable, les commandes `openclaw sessions cleanup` sans simulation et `openclaw agents delete` délèguent les mutations du magasin au Gateway afin que le nettoyage rejoigne la même file d’écriture ; `--store <path>` est le chemin explicite de réparation hors ligne pour la maintenance directe des fichiers. Le nettoyage `maxEntries` reste traité par lots pour les limites de taille de production, donc un magasin peut brièvement dépasser la limite configurée avant que le prochain nettoyage de niveau haut ne le ramène en dessous. Les lectures du magasin de sessions ne suppriment ni ne plafonnent les entrées au démarrage du Gateway ; utilisez les écritures ou `openclaw sessions cleanup --enforce` pour le nettoyage. `openclaw sessions cleanup --enforce` applique toujours immédiatement la limite configurée.

La maintenance conserve les pointeurs durables vers les conversations externes, comme les sessions de groupe
et les sessions de chat limitées à un fil, mais les entrées d’exécution synthétiques pour cron, les hooks,
Heartbeat, ACP et les sous-agents peuvent toujours être supprimées lorsqu’elles dépassent le
budget d’âge, de nombre ou de disque configuré.

OpenClaw ne crée plus de sauvegardes automatiques par rotation `sessions.json.bak.*` pendant les écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent un verrou d’écriture de session sur le fichier de transcription. L’acquisition du verrou attend jusqu’à
`session.writeLock.acquireTimeoutMs` avant de signaler une erreur de session occupée ; la valeur par défaut est `60000`
ms. Augmentez cette valeur seulement lorsque des travaux légitimes de préparation, nettoyage, Compaction ou miroir de transcription entrent en concurrence
plus longtemps sur des machines lentes. La détection des verrous obsolètes et les avertissements de durée maximale de détention restent des politiques séparées.

Ordre d’application du nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les trajectoires orphelines.
2. Si l’utilisation reste au-dessus de la cible, évincer les entrées de session les plus anciennes et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin ni les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées/transcriptions de session, et disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) supprime les anciennes sessions d’exécution Cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` suppriment les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il conserve les préférences sûres
comme les réglages de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant comme
le routage de canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution ACP
afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou d’une autorité
d’exécution provenant d’une ancienne exécution.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous vous trouvez (routage + isolation).

Modèles courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (le fichier de transcription qui continue la conversation).

Règles pratiques :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut 4 h 00, heure locale sur l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration après inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première à expirer l’emporte.
- **Événements système** (Heartbeat, réveils Cron, notifications exec, comptabilité du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité. Le basculement de réinitialisation élimine les avis d’événements système en file d’attente pour la session précédente avant la construction de la nouvelle invite.
- **Politique de fork parent** utilise la branche active de Pi lors de la création d’un fil ou d’un fork de sous-agent. Si cette branche est trop grande, OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. La politique de dimensionnement est automatique ; l’ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant de transcription actuel (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour le `sessionId` actuel ; la fraîcheur de réinitialisation quotidienne
  l’utilise. Les anciennes lignes peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation après inactivité
  l’utilise afin que les événements Heartbeat, Cron et exec ne maintiennent pas les sessions
  actives. Les anciennes lignes sans ce champ se replient sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du magasin, utilisé pour les listes, l’élagage et
  la comptabilité. Il ne fait pas autorité pour la fraîcheur de réinitialisation quotidienne/inactivité.
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage de la dernière purge mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compactions lorsque la dernière purge s’est exécutée

Le magasin peut être modifié sans risque, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent bien_ dans le contexte du modèle (peuvent être masqués de l’interface utilisateur)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche de l’arbre

OpenClaw ne « corrige » intentionnellement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts distincts comptent :

1. **Fenêtre de contexte du modèle** : limite dure par modèle (jetons visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte vient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, voir [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume les conversations plus anciennes dans une entrée `compaction` persistée dans la transcription et conserve intacts les messages récents.

Après Compaction, les futurs tours voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage des sessions). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites des blocs de Compaction et association des outils

Lorsque OpenClaw divise une longue transcription en blocs de Compaction, il conserve les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes.

- Si la division par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer la paire.
- Si un bloc de résultat d’outil final ferait autrement dépasser la cible au bloc, OpenClaw préserve ce bloc d’outil en attente et garde intacte la queue non résumée.
- Les blocs d’appels d’outils abandonnés ou en erreur ne maintiennent pas ouverte une division en attente.

---

## Quand l’auto-Compaction se produit (environnement d’exécution Pi)

Dans l’agent Pi intégré, l’auto-Compaction se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et des variantes similaires propres aux fournisseurs) → compacter → réessayer.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la prochaine sortie du modèle

Ce sont des sémantiques de l’environnement d’exécution Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une Compaction locale préalable avant d’ouvrir la prochaine exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le fichier de transcription actif atteint cette taille. Il s’agit d’une garde de taille de fichier pour le coût de réouverture locale, pas d’un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale, et exige `truncateAfterCompaction` afin que le résumé compacté puisse devenir une nouvelle transcription successeur.

Pour les exécutions Pi intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true` ajoute une garde optionnelle de boucle d’outils. Après l’ajout d’un résultat d’outil et avant l’appel de modèle suivant, OpenClaw estime la pression sur le prompt avec la même logique de budget préalable utilisée au début du tour. Si le contexte ne tient plus, la garde ne compacte pas dans le hook `transformContext` de Pi. Elle émet un signal structuré de prévérification en cours de tour, arrête la soumission de prompt en cours et laisse la boucle d’exécution externe utiliser le chemin de récupération existant : tronquer les résultats d’outils trop volumineux lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer. L’option est désactivée par défaut et fonctionne avec les modes de Compaction `default` et `safeguard`, y compris la Compaction de sauvegarde adossée à un fournisseur.
Cela est indépendant de `maxActiveTranscriptBytes` : la garde de taille en octets s’exécute avant l’ouverture d’un tour, tandis que la prévérification en cours de tour s’exécute plus tard dans la boucle d’outils Pi intégrée, après l’ajout de nouveaux résultats d’outils.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction de Pi se trouvent dans les paramètres Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique aussi un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- S’il est déjà plus élevé, OpenClaw le laisse inchangé.
- Le `/compact` manuel respecte un `agents.defaults.compaction.keepRecentTokens` explicite et conserve le point de coupe de la queue récente de Pi. Sans budget de conservation explicite, la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit démarre à partir du nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter la prévérification optionnelle de boucle d’outils après les nouveaux résultats d’outils et avant l’appel de modèle suivant. Il s’agit uniquement d’un déclencheur ; la génération du résumé utilise toujours le chemin de Compaction configuré. Elle est indépendante de `maxActiveTranscriptBytes`, qui est une garde de taille en octets de transcription active au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou une chaîne comme `"20mb"` pour exécuter une Compaction locale avant un tour lorsque la transcription active devient volumineuse. Cette garde n’est active que lorsque `truncateAfterCompaction` est aussi activé. Laissez-la non définie ou définissez-la sur `0` pour la désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé, OpenClaw fait pivoter la transcription active vers un JSONL successeur compacté après la Compaction. L’ancienne transcription complète reste archivée et liée depuis le point de contrôle de Compaction au lieu d’être réécrite sur place.

Pourquoi : laisser assez de marge pour la « maintenance » multi-tours (comme les écritures mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts` (appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API de plugin. Lorsque `agents.defaults.compaction.provider` est défini sur un identifiant de fournisseur enregistré, l’extension de sauvegarde délègue le résumé à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un plugin fournisseur de Compaction enregistré. Laissez non défini pour le résumé LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- La sauvegarde préserve toujours le contexte de suffixe des tours récents et des tours divisés après la sortie du fournisseur.
- Le résumé de sauvegarde intégré redistille les résumés précédents avec les nouveaux messages au lieu de préserver textuellement l’intégralité du résumé précédent.
- Le mode de sauvegarde active par défaut les audits de qualité du résumé ; définissez `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement au résumé LLM intégré.
- Les signaux d’abandon ou d’expiration sont relancés (pas absorbés) afin de respecter l’annulation par l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la Compaction et l’état de session via :

- `/status` (dans n’importe quelle session de discussion)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + compteur de Compaction

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le token silencieux exact `NO_REPLY` / `no_reply` pour indiquer « ne pas remettre de réponse à l’utilisateur ».
- OpenClaw le retire ou le supprime dans la couche de livraison.
- La suppression du token silencieux exact est insensible à la casse, donc `NO_REPLY` et `no_reply` comptent tous les deux lorsque la charge utile complète est seulement le token silencieux.
- Cela concerne uniquement les vrais tours d’arrière-plan sans livraison ; ce n’est pas un raccourci pour les demandes utilisateur ordinaires et actionnables.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/frappe** lorsqu’un bloc partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie partielle en cours de tour.

---

## « Vidage mémoire » avant Compaction (implémenté)

Objectif : avant que l’auto-Compaction ne se produise, exécuter un tour agentique silencieux qui écrit l’état durable sur disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas effacer de contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (sous le seuil de Compaction de Pi), exécuter une directive silencieuse « écrire la mémoire maintenant » à destination de l’agent.
3. Utiliser le token silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement exact fournisseur/modèle optionnel pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Notes :

- Le prompt et le prompt système par défaut incluent un indice `NO_REPLY` pour supprimer la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la chaîne de repli de la session active, afin qu’une maintenance uniquement locale ne retombe pas silencieusement sur un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Discordance entre le store et la transcription ? Confirmez l’hôte Gateway et le chemin du store depuis `openclaw status`.
- Spam de Compaction ? Vérifiez :
  - fenêtre de contexte du modèle (trop petite)
  - paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus tôt)
  - gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Tours silencieux qui fuitent ? Confirmez que la réponse commence par `NO_REPLY` (token exact insensible à la casse) et que vous utilisez une build qui inclut le correctif de suppression du streaming.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
