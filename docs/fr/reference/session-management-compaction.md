---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement d’auto-compaction ou ajoutez une maintenance de « pré-compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions + transcriptions, cycle de vie et mécanismes internes de la (auto)Compaction'
title: Approfondissement de la gestion des sessions
x-i18n:
    generated_at: "2026-05-06T07:38:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants correspondent à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (manuelle et auto-compaction) et où brancher le travail de pré-compaction
- **Entretien silencieux** (écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous souhaitez d’abord une vue d’ensemble de plus haut niveau, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène des transcriptions](/fr/reference/transcript-hygiene)

---

## Source de vérité : le Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, interface Web Control, TUI) doivent interroger le Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier les fichiers de votre Mac local » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec une structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle pour les tours futurs
   - Les grands points de contrôle de débogage pré-compaction sont ignorés une fois que la transcription active
     dépasse le plafond de taille des points de contrôle, ce qui évite une seconde copie géante
     `.checkpoint.*.jsonl`.

Les lecteurs d’historique du Gateway doivent éviter de matérialiser toute la transcription sauf si
la surface a explicitement besoin d’un accès historique arbitraire. L’historique de première page,
l’historique de chat intégré, la récupération après redémarrage et les vérifications de jetons/d’utilisation utilisent des lectures de fin bornées. Les analyses complètes de transcription passent par l’index de transcription asynchrone, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre les lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles du disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers annexes de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond des entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway passent par un rédacteur de session par magasin qui sérialise les mutations en processus sans prendre de verrou de fichier à l’exécution. Les assistants de correctifs de chemin critique empruntent le cache mutable validé pendant qu’ils détiennent ce créneau de rédacteur, afin que les grands fichiers `sessions.json` ne soient pas clonés ni relus pour chaque mise à jour de métadonnées. Le code d’exécution doit préférer `updateSessionStore(...)` ou `updateSessionStoreEntry(...)` ; les sauvegardes directes de tout le magasin sont des outils de compatibilité et de maintenance hors ligne. Lorsqu’un Gateway est joignable, les commandes non à blanc `openclaw sessions cleanup` et `openclaw agents delete` délèguent les mutations du magasin au Gateway afin que le nettoyage rejoigne la même file de rédacteurs ; `--store <path>` est le chemin explicite de réparation hors ligne pour la maintenance directe de fichiers. Le nettoyage `maxEntries` reste groupé pour les plafonds de taille production, donc un magasin peut brièvement dépasser le plafond configuré avant que le prochain nettoyage de seuil haut ne le réécrive à la baisse. Les lectures du magasin de sessions n’élaguent ni ne plafonnent les entrées au démarrage du Gateway ; utilisez les écritures ou `openclaw sessions cleanup --enforce` pour le nettoyage. `openclaw sessions cleanup --enforce` applique toujours immédiatement le plafond configuré et élague les anciens artefacts de transcription, de point de contrôle et de trajectoire non référencés même lorsqu’aucun budget disque n’est configuré.

La maintenance conserve les pointeurs durables vers des conversations externes, comme les sessions de groupe
et les sessions de chat bornées à un fil, mais les entrées d’exécution synthétiques pour cron, hooks,
heartbeat, ACP et sous-agents peuvent tout de même être supprimées lorsqu’elles dépassent
l’âge, le nombre ou le budget disque configuré.

OpenClaw ne crée plus de sauvegardes de rotation automatiques `sessions.json.bak.*` pendant les écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent un verrou d’écriture de session sur le fichier de transcription. L’acquisition du verrou attend jusqu’à
`session.writeLock.acquireTimeoutMs` avant de signaler une erreur de session occupée ; la valeur par défaut est `60000`
ms. Augmentez-la uniquement lorsque des travaux légitimes de préparation, nettoyage, Compaction ou miroir de transcription entrent en contention
plus longtemps sur des machines lentes. La détection de verrous obsolètes et les avertissements de durée maximale de détention restent des politiques distinctes.

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les artefacts de trajectoire orphelins.
2. Si l’utilisation reste au-dessus de la cible, expulser les entrées de session les plus anciennes et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les expulsions potentielles mais ne modifie pas le magasin/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions cron isolées créent aussi des entrées/transcriptions de session, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Lorsque cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il conserve les préférences sûres
comme les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification choisis par l’utilisateur. Il supprime le contexte de conversation ambiant, comme
le routage de canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution ACP,
afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou
d’une autorité d’exécution provenant d’une ancienne exécution.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous êtes (routage + isolation).

Modèles courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
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
- **Réinitialisation quotidienne** (par défaut 4:00 AM heure locale sur l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première qui expire l’emporte.
- **Événements système** (heartbeat, réveils cron, notifications exec, tenue interne du gateway) peuvent muter la ligne de session mais n’étendent pas la fraîcheur de réinitialisation quotidienne/d’inactivité. Le basculement de réinitialisation supprime les avis d’événements système en file d’attente pour la session précédente avant de construire la nouvelle invite.
- **Politique de fork parent** utilise la branche active de PI lors de la création d’un fil ou d’un fork de sous-agent. Si cette branche est trop grande, OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. La politique de dimensionnement est automatique ; l’ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (non exhaustif) :

- `sessionId` : identifiant de transcription actuel (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour le `sessionId` actuel ; la fraîcheur de réinitialisation quotidienne
  l’utilise. Les anciennes lignes peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation
  d’inactivité l’utilise afin que les événements heartbeat, cron et exec ne maintiennent pas les sessions
  en vie. Les anciennes lignes sans ce champ se rabattent sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du magasin, utilisé pour la liste, l’élagage et
  la tenue interne. Il ne fait pas autorité pour la fraîcheur de réinitialisation quotidienne/d’inactivité.
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (meilleur effort / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : fréquence à laquelle l’auto-compaction s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire de pré-compaction
- `memoryFlushCompactionCount` : nombre de Compaction lorsque le dernier vidage s’est exécuté

Le magasin peut être modifié sans risque, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées à mesure que les sessions s’exécutent.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Ensuite : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche d’arbre

OpenClaw ne « corrige » intentionnellement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts distincts comptent :

1. **Fenêtre de contexte du modèle** : plafond strict par modèle (jetons visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue des modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans la transcription et conserve les messages récents intacts.

Après la Compaction, les tours futurs voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage de session). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites des blocs de Compaction et appariement des outils

Quand OpenClaw divise une longue transcription en blocs de Compaction, il garde
les appels d’outil de l’assistant appariés à leurs entrées `toolResult`
correspondantes.

- Si le découpage par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc de résultat d’outil final ferait autrement dépasser la cible au bloc,
  OpenClaw préserve ce bloc d’outil en attente et conserve intacte la fin
  non résumée.
- Les blocs d’appel d’outil annulés/en erreur ne maintiennent pas ouvert un découpage en attente.

---

## Quand la Compaction automatique se produit (runtime Pi)

Dans l’agent Pi intégré, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires structurées par les fournisseurs) → compacter → réessayer.
2. **Maintenance du seuil** : après un tour réussi, quand :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la prochaine sortie du modèle

Ce sont des sémantiques du runtime Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une Compaction locale préliminaire avant d’ouvrir la prochaine
exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le
fichier de transcription active atteint cette taille. C’est une garde de taille de fichier pour le coût
de réouverture locale, pas un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale,
et elle exige `truncateAfterCompaction` afin que le résumé compacté puisse devenir une
nouvelle transcription successeure.

Pour les exécutions Pi intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute une garde de boucle d’outils optionnelle. Après l’ajout d’un résultat d’outil et avant le
prochain appel au modèle, OpenClaw estime la pression du prompt avec la même logique de budget
préliminaire utilisée au début du tour. Si le contexte ne tient plus, la garde ne compacte pas
dans le hook `transformContext` de Pi. Elle émet un signal structuré de prévérification
en milieu de tour, arrête la soumission du prompt en cours, et laisse la boucle d’exécution
externe utiliser le chemin de récupération existant : tronquer les résultats d’outil surdimensionnés
lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer. L’option est désactivée
par défaut et fonctionne avec les modes de Compaction `default` et `safeguard`,
y compris la Compaction safeguard adossée à un fournisseur.
C’est indépendant de `maxActiveTranscriptBytes` : la garde de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que la prévérification en milieu de tour s’exécute plus tard dans la boucle d’outils Pi intégrée
après l’ajout de nouveaux résultats d’outil.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction de Pi résident dans les paramètres Pi :

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
- S’il est déjà plus élevé, OpenClaw le laisse inchangé.
- Le `/compact` manuel respecte un `agents.defaults.compaction.keepRecentTokens`
  explicite et conserve le point de coupe de la fin récente de Pi. Sans budget de conservation explicite,
  la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit commence à partir du
  nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter la
  prévérification optionnelle de boucle d’outils après les nouveaux résultats d’outil et avant le prochain appel
  au modèle. Ce n’est qu’un déclencheur ; la génération du résumé utilise toujours le chemin de
  Compaction configuré. Elle est indépendante de `maxActiveTranscriptBytes`, qui est une
  garde de taille en octets de transcription active au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne telle que `"20mb"` pour exécuter une Compaction locale avant un tour lorsque la transcription
  active devient volumineuse. Cette garde n’est active que lorsque
  `truncateAfterCompaction` est également activé. Laissez-la non définie ou définissez-la sur `0` pour
  la désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait tourner la transcription active vers un JSONL successeur compacté après
  la Compaction. L’ancienne transcription complète reste archivée et liée depuis le
  point de contrôle de Compaction au lieu d’être réécrite sur place.

Pourquoi : laisser assez de marge pour la « maintenance » multitour (comme les écritures mémoire) avant que la Compaction devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelée depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API de plugin. Lorsque `agents.defaults.compaction.provider` est défini sur un identifiant de fournisseur enregistré, le plugin safeguard délègue le résumé à ce fournisseur au lieu du pipeline `summarizeInStages` intégré.

- `provider` : identifiant d’un plugin fournisseur de Compaction enregistré. Laissez non défini pour le résumé LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte suffixe des tours récents et des tours divisés après la sortie du fournisseur.
- Le résumé safeguard intégré redistille les résumés précédents avec les nouveaux messages
  au lieu de préserver textuellement l’intégralité du résumé précédent.
- Le mode safeguard active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie malformée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement au résumé LLM intégré.
- Les signaux d’abandon/délai expiré sont relancés (pas absorbés) pour respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la Compaction et l’état de session via :

- `/status` (dans n’importe quelle session de discussion)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode détaillé : `🧹 Auto-compaction complete` + compteur de Compaction

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches d’arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression du jeton silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous les deux lorsque la charge utile entière n’est que le jeton silencieux.
- Ceci est réservé aux véritables tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires et actionnables.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/saisie** lorsqu’un
bloc partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle en milieu de tour.

---

## "Vidage de mémoire" pré-Compaction (implémenté)

Objectif : avant que la Compaction automatique se produise, exécuter un tour agentique silencieux qui écrit un état
durable sur le disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage pré-seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (sous le seuil de Compaction de Pi), exécuter une directive silencieuse
   « écris la mémoire maintenant » auprès de l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement optionnel exact fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Notes :

- Le prompt/prompt système par défaut inclut un indice `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de repli de la session active, afin que la maintenance locale seule ne revienne pas silencieusement
  à un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API de plugin, mais la logique de
vidage d’OpenClaw se trouve aujourd’hui côté Gateway.

---

## Liste de vérification pour le dépannage

- Clé de session erronée ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incohérence entre le magasin et la transcription ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Trop de Compactions ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - le gonflement des résultats d’outil : activez/ajustez l’élagage de session
- Des tours silencieux fuient ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez une build qui inclut le correctif de suppression du streaming.

## Voir aussi

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
