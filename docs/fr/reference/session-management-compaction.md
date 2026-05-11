---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement de Compaction automatique ou ajoutez un nettoyage de « pré-Compaction »
    - Vous souhaitez implémenter des purges de mémoire ou des tours système silencieux
summary: 'Exploration approfondie : stockage des sessions + transcriptions, cycle de vie et mécanismes internes de la Compaction (automatique)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-05-11T20:54:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants correspondent à une `sessionKey`)
- **Stockage des sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (corrections propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte et jetons suivis)
- **Compaction** (manuelle et automatique) et où rattacher le travail de pré-Compaction
- **Maintenance silencieuse** (écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

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

- Les interfaces utilisateur (application macOS, interface de contrôle web, TUI) doivent interroger le Gateway pour les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Stockage des sessions (`sessions.json`)**
   - Table clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, modifiable sans risque (ou suppression d’entrées possible)
   - Suit les métadonnées de session (id de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout uniquement avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle lors des tours suivants
   - Les grands points de contrôle de débogage pré-Compaction sont ignorés une fois que la transcription
     active dépasse la limite de taille des points de contrôle, ce qui évite une seconde énorme
     copie `.checkpoint.*.jsonl`.

Les lecteurs d’historique du Gateway doivent éviter de matérialiser toute la transcription, sauf si
la surface a explicitement besoin d’un accès historique arbitraire. L’historique de première page,
l’historique de chat intégré, la récupération après redémarrage et les vérifications de jetons/utilisation utilisent des lectures de fin bornées.
Les analyses complètes de transcription passent par l’index de transcription asynchrone, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre les lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l’hôte du Gateway :

- Stockage : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du stockage et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les annexes de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`)
- `maxEntries` : limite d’entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway passent par un writer de session par stockage, qui sérialise les mutations en cours de processus sans prendre de verrou de fichier à l’exécution. Les assistants de correctif du chemin critique empruntent le cache mutable validé pendant qu’ils détiennent cet emplacement de writer, de sorte que les grands fichiers `sessions.json` ne soient pas clonés ni relus à chaque mise à jour de métadonnées. Le code d’exécution doit préférer `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` ; les sauvegardes directes de tout le stockage sont des outils de compatibilité et de maintenance hors ligne. Lorsqu’un Gateway est joignable, `openclaw sessions cleanup` sans simulation et `openclaw agents delete` délèguent les mutations du stockage au Gateway afin que le nettoyage rejoigne la même file de writer ; `--store <path>` est le chemin explicite de réparation hors ligne pour une maintenance directe des fichiers. Le nettoyage `maxEntries` reste traité par lots pour les limites de taille de production, donc un stockage peut brièvement dépasser la limite configurée avant que le prochain nettoyage du niveau haut ne le réécrive en dessous. Les lectures du stockage de sessions n’élaguent ni ne limitent les entrées au démarrage du Gateway ; utilisez les écritures ou `openclaw sessions cleanup --enforce` pour le nettoyage. `openclaw sessions cleanup --enforce` applique toujours immédiatement la limite configurée et élague les anciens artefacts de transcription, de point de contrôle et de trajectoire non référencés, même lorsqu’aucun budget disque n’est configuré.

La maintenance conserve les pointeurs de conversation externes durables tels que les sessions de groupe
et les sessions de chat limitées à un fil, mais les entrées d’exécution synthétiques pour Cron, les hooks,
Heartbeat, ACP et les sous-agents peuvent toujours être supprimées lorsqu’elles dépassent
l’âge, le nombre ou le budget disque configuré.

OpenClaw ne crée plus de sauvegardes automatiques de rotation `sessions.json.bak.*` pendant les écritures du Gateway. La clé héritée `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent un verrou d’écriture de session sur le fichier de transcription. L’acquisition du verrou attend jusqu’à
`session.writeLock.acquireTimeoutMs` avant de signaler une erreur de session occupée ; la valeur par défaut est `60000`
ms. N’augmentez cette valeur que lorsque du travail légitime de préparation, de nettoyage, de Compaction ou de miroir de transcription entre en concurrence
plus longtemps sur des machines lentes. La détection des verrous obsolètes et les avertissements de durée maximale de détention restent des politiques distinctes.

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les trajectoires orphelines.
2. Si l’usage reste au-dessus de la cible, évincer les entrées de session les plus anciennes ainsi que leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’usage soit inférieur ou égal à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles, mais ne modifie pas le stockage ni les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées de session/transcriptions, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du stockage de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Quand Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session
`cron:<jobId>` précédente avant d’écrire la nouvelle ligne. Il conserve les préférences sûres
comme les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant
comme le routage de canal/groupe, la politique d’envoi ou de file, l’élévation, l’origine et la liaison
d’exécution ACP afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou
d’une autorité d’exécution provenant d’une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous vous trouvez (routage + isolation).

Schémas courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Ids de session (`sessionId`)

Chaque `sessionKey` pointe vers une `sessionId` actuelle (le fichier de transcription qui poursuit la conversation).

Règles pratiques :

- **Réinitialisation** (`/new`, `/reset`) crée une nouvelle `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4 h 00, heure locale de l’hôte Gateway) crée une nouvelle `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée une nouvelle `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, celle qui expire en premier l’emporte.
- **Événements système** (Heartbeat, réveils Cron, notifications d’exécution, tenue interne du Gateway) peuvent modifier la ligne de session, mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité. Le basculement de réinitialisation abandonne les avis d’événements système en file pour la session précédente avant de construire la nouvelle invite.
- **Politique de fork parent** utilise la branche active de PI lors de la création d’un fil ou d’un fork de sous-agent. Si cette branche est trop volumineuse, OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. La politique de dimensionnement est automatique ; la configuration héritée `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du stockage de sessions (`sessions.json`)

Le type de valeur du stockage est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : id de transcription actuel (le nom de fichier est dérivé de celui-ci sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour la `sessionId` actuelle ; la fraîcheur de réinitialisation quotidienne
  l’utilise. Les anciennes lignes peuvent le déduire de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation
  d’inactivité l’utilise afin que les événements Heartbeat, Cron et exec ne maintiennent pas les sessions
  vivantes. Les anciennes lignes sans ce champ se replient sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du stockage, utilisé pour la liste, l’élagage et
  la tenue interne. Ce n’est pas l’autorité pour la fraîcheur de réinitialisation quotidienne/inactivité.
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
- `compactionCount` : fréquence à laquelle la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compaction au moment du dernier vidage

Le stockage peut être modifié sans risque, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure de transcription (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@earendil-works/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par extension qui _entrent_ bien dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche d’arbre

OpenClaw ne « corrige » intentionnellement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte et jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (jetons visibles par le modèle)
2. **Compteurs du stockage de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le stockage est une valeur d’estimation/de reporting à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans la transcription et conserve les messages récents intacts.

Après la Compaction, les tours suivants voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage de session). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites des morceaux de Compaction et association des outils

Lorsqu’OpenClaw divise une longue transcription en morceaux de Compaction, il garde
les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes.

- Si la séparation par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc de résultat d’outil final ferait autrement dépasser la cible au morceau,
  OpenClaw préserve ce bloc d’outil en attente et garde intacte la fin non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas ouverte une séparation en attente.

---

## Quand la Compaction automatique se produit (runtime Pi)

Dans l’agent Pi intégré, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires propres aux fournisseurs) → Compaction → nouvelle tentative.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la prochaine sortie du modèle

Il s’agit de la sémantique du runtime Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une Compaction locale de prévol avant d’ouvrir la prochaine
exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le
fichier de transcription active atteint cette taille. Il s’agit d’un garde-fou de taille de fichier pour le coût
de réouverture locale, pas d’un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale,
et cela nécessite `truncateAfterCompaction` afin que le résumé compacté puisse devenir une
nouvelle transcription successeure.

Pour les exécutions Pi intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute un garde-fou optionnel de boucle d’outils. Après l’ajout d’un résultat d’outil et avant le
prochain appel au modèle, OpenClaw estime la pression du prompt avec la même logique de budget
de prévol utilisée au début du tour. Si le contexte ne tient plus, le garde-fou ne
compacte pas dans le hook `transformContext` de Pi. Il émet un signal structuré
de prévérification en milieu de tour, arrête la soumission du prompt en cours, et laisse la
boucle d’exécution externe utiliser le chemin de récupération existant : tronquer les résultats d’outils trop volumineux
lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer. L’option
est désactivée par défaut et fonctionne avec les modes de Compaction `default` et `safeguard`,
y compris la Compaction de sauvegarde appuyée par un fournisseur.
C’est indépendant de `maxActiveTranscriptBytes` : le garde-fou de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que la prévérification en milieu de tour s’exécute plus tard dans la boucle d’outils Pi intégrée,
après l’ajout de nouveaux résultats d’outils.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction de Pi se trouvent dans les paramètres de Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw impose aussi un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- S’il est déjà plus élevé, OpenClaw le laisse tel quel.
- La commande manuelle `/compact` respecte un `agents.defaults.compaction.keepRecentTokens`
  explicite et conserve le point de coupe de la fin récente de Pi. Sans budget de conservation explicite,
  la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit repart
  du nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter la
  prévérification optionnelle de boucle d’outils après les nouveaux résultats d’outils et avant le prochain appel au modèle.
  Il ne s’agit que d’un déclencheur ; la génération du résumé utilise toujours le chemin de
  Compaction configuré. C’est indépendant de `maxActiveTranscriptBytes`, qui est un
  garde-fou de taille en octets de la transcription active au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne comme `"20mb"` pour exécuter une Compaction locale avant un tour lorsque la transcription
  active devient volumineuse. Ce garde-fou n’est actif que lorsque
  `truncateAfterCompaction` est aussi activé. Laissez-le non défini ou définissez `0` pour
  le désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait tourner la transcription active vers un JSONL successeur compacté après
  la Compaction. L’ancienne transcription complète reste archivée et liée depuis le
  point de contrôle de Compaction au lieu d’être réécrite sur place.

Pourquoi : laisser assez de marge pour les tâches de maintenance multitours (comme les écritures en mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API du Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur un identifiant de fournisseur enregistré, l’extension de sauvegarde délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un Plugin fournisseur de Compaction enregistré. Laissez non défini pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- La sauvegarde préserve toujours le contexte de suffixe des tours récents et des tours scindés après la sortie du fournisseur.
- La synthèse de sauvegarde intégrée redistille les résumés précédents avec les nouveaux messages
  au lieu de préserver textuellement l’intégralité du résumé précédent.
- Le mode sauvegarde active par défaut les audits de qualité des résumés ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/de délai d’expiration sont relancés (et non absorbés) afin de respecter l’annulation par l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer l’état de la Compaction et de la session via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Journaux du Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`) : `embedded run auto-compaction start` + `complete`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de Compaction

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas envoyer de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression du token silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque l’ensemble de la charge utile n’est que le token silencieux.
- Ceci est réservé aux véritables tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires nécessitant une action.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/saisie** lorsqu’un
morceau partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie partielle
en milieu de tour.

---

## « Vidage mémoire » avant Compaction (implémenté)

Objectif : avant la Compaction automatique, exécuter un tour agentique silencieux qui écrit un état
durable sur le disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer le contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (inférieur au seuil de Compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » à l’attention de l’agent.
3. Utiliser le token silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (surcharge facultative exacte fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Notes :

- Le prompt/prompt système par défaut inclut une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de repli de la session active, de sorte qu’une maintenance locale seule ne bascule pas silencieusement
  vers un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage s’exécute uniquement pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les schémas d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw réside aujourd’hui côté Gateway.

---

## Liste de vérification de dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incohérence entre le store et la transcription ? Confirmez l’hôte Gateway et le chemin du store depuis `openclaw status`.
- Trop de Compaction ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - l’encombrement des résultats d’outils : activez/ajustez l’élagage de session
- Des tours silencieux fuient ? Confirmez que la réponse commence par `NO_REPLY` (token exact insensible à la casse) et que vous utilisez une build incluant le correctif de suppression du streaming.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
