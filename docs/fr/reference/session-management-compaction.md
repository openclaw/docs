---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement d’auto-Compaction ou ajoutez des tâches d’entretien de « pré-Compaction »
    - Vous voulez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : magasin de sessions + transcriptions, cycle de vie et fonctionnement interne de la Compaction (automatique)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-04-30T07:47:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (la façon dont les messages entrants correspondent à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et sa structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte par rapport aux tokens suivis)
- **Compaction** (Compaction manuelle et automatique) et où brancher le travail de pré-Compaction
- **Maintenance silencieuse** (écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous voulez d’abord une vue d’ensemble de plus haut niveau, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène des transcriptions](/fr/reference/transcript-hygiene)

---

## Source de vérité : le Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, Control UI web, TUI) doivent interroger le Gateway pour les listes de sessions et les nombres de tokens.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier les fichiers locaux de votre Mac » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (id de session courant, dernière activité, bascules, compteurs de tokens, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout uniquement avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle lors des tours futurs
   - Les grands points de contrôle de débogage pré-Compaction sont ignorés une fois que la transcription active dépasse le plafond de taille des points de contrôle, ce qui évite une seconde copie géante `.checkpoint.*.jsonl`.

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujets Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les sidecars de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond d’entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget optionnel du répertoire de sessions
- `highWaterBytes` : cible optionnelle après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway regroupent le nettoyage `maxEntries` pour les plafonds de taille production ; un magasin peut donc dépasser brièvement le plafond configuré avant que le prochain nettoyage de seuil haut ne le réécrive en dessous. `openclaw sessions cleanup --enforce` applique toujours immédiatement le plafond configuré.

OpenClaw ne crée plus de sauvegardes de rotation automatiques `sessions.json.bak.*` pendant les écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Ordre d’application du nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les artefacts de trajectoire orphelins.
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

Les exécutions Cron isolées créent également des entrées/transcriptions de session, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session `cron:<jobId>` précédente avant d’écrire la nouvelle ligne. Il conserve les préférences sûres comme les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites de modèle/authentification sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant comme le routage de canal/groupe, la stratégie d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution ACP afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou d’une autorité d’exécution provenant d’une exécution plus ancienne.

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

## Ids de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` courant (le fichier de transcription qui poursuit la conversation).

Règles pratiques :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4 h 00, heure locale sur l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première qui expire l’emporte.
- **Événements système** (Heartbeat, réveils Cron, notifications exec, tenue de compte du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/d’inactivité. Le basculement de réinitialisation supprime les avis d’événements système en file d’attente pour la session précédente avant de construire la nouvelle invite.
- **Garde de bifurcation du parent de fil** (`session.parentForkMaxTokens`, par défaut `100000`) ignore la bifurcation de transcription parente lorsque la session parente est déjà trop grande ; le nouveau fil démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (non exhaustifs) :

- `sessionId` : id de transcription courant (le nom de fichier en dérive sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début du `sessionId` courant ; la fraîcheur de réinitialisation quotidienne l’utilise. Les anciennes lignes peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation d’inactivité l’utilise afin que Heartbeat, Cron et les événements exec ne gardent pas les sessions en vie. Les anciennes lignes sans ce champ se rabattent sur l’heure de début de session récupérée pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du magasin, utilisé pour les listes, l’élagage et la tenue de compte. Il ne fait pas autorité pour la fraîcheur de réinitialisation quotidienne/d’inactivité.
- `sessionFile` : remplacement optionnel explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la stratégie d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage de groupe/canal
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : fréquence à laquelle la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compaction au moment où le dernier vidage s’est exécuté

Le magasin peut être modifié sans risque, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure de transcription (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` optionnel)
- Ensuite : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent bien_ dans le contexte du modèle (peuvent être masqués de l’interface utilisateur)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche d’arbre

OpenClaw ne « corrige » volontairement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte par rapport aux tokens suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : plafond strict par modèle (tokens visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans la transcription et conserve les messages récents intacts.

Après Compaction, les tours futurs voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

Compaction est **persistante** (contrairement à l’élagage des sessions). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de Compaction et appariement des outils

Quand OpenClaw divise une longue transcription en blocs de Compaction, il garde les appels d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si la division par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer la paire.
- Si un bloc `toolResult` final pousserait sinon le bloc au-delà de la cible, OpenClaw préserve ce bloc d’outil en attente et garde intacte la fin non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas une division en attente ouverte.

---

## Quand la Compaction automatique se produit (runtime Pi)

Dans l’agent Pi intégré, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` et variantes similaires propres aux fournisseurs) → compacter → réessayer.
2. **Maintenance de seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux invites + à la prochaine sortie du modèle

Ce sont les sémantiques du runtime Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une Compaction locale préliminaire avant d’ouvrir la prochaine exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le fichier de transcription actif atteint cette taille. Il s’agit d’une garde de taille de fichier pour le coût de réouverture local, pas d’un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale, et cela nécessite `truncateAfterCompaction` afin que le résumé compacté puisse devenir une nouvelle transcription successeure.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction de Pi se trouvent dans les paramètres Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique également un seuil de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le seuil par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le seuil.
- S’il est déjà plus élevé, OpenClaw le laisse inchangé.
- La commande manuelle `/compact` respecte une valeur explicite de `agents.defaults.compaction.keepRecentTokens`
  et conserve le point de coupure de fin récente de Pi. Sans budget de conservation explicite,
  la compaction manuelle reste un point de contrôle strict, et le contexte reconstruit démarre depuis
  le nouveau résumé.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne comme `"20mb"` pour exécuter la compaction locale avant un tour lorsque la transcription
  active devient volumineuse. Cette protection n’est active que lorsque
  `truncateAfterCompaction` est également activé. Laissez-la non définie ou définissez-la sur `0` pour
  la désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait pivoter la transcription active vers un successeur JSONL compacté après
  la compaction. L’ancienne transcription complète reste archivée et liée depuis le
  point de contrôle de compaction au lieu d’être réécrite sur place.

Pourquoi : conserver suffisamment de marge pour les « tâches de maintenance » multi-tours (comme les écritures mémoire) avant que la compaction devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de compaction via `registerCompactionProvider()` sur l’API de Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un fournisseur enregistré, l’extension de sauvegarde délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un Plugin fournisseur de compaction enregistré. Laissez non défini pour utiliser la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de compaction et la même politique de préservation des identifiants que le chemin intégré.
- La sauvegarde préserve toujours le contexte de suffixe des tours récents et des tours scindés après la sortie du fournisseur.
- La synthèse de sauvegarde intégrée redistille les résumés précédents avec les nouveaux messages
  au lieu de conserver textuellement l’intégralité du résumé précédent.
- Le mode sauvegarde active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/de délai expiré sont relancés (et non absorbés) afin de respecter l’annulation par l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la compaction et l’état de session via :

- `/status` (dans n’importe quelle session de discussion)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode détaillé : `🧹 Auto-compaction complete` + nombre de compactions

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan dont l’utilisateur ne doit pas voir la sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas envoyer de réponse à l’utilisateur ».
- OpenClaw le retire/supprime dans la couche de livraison.
- La suppression du token silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque l’ensemble de la charge utile se limite au token silencieux.
- Ceci est réservé aux véritables tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires et actionnables.

Depuis `2026.1.10`, OpenClaw supprime également le **streaming de brouillon/saisie** lorsqu’un
fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle en cours de tour.

---

## « Vidage mémoire » avant compaction (implémenté)

Objectif : avant que la compaction automatique se produise, exécuter un tour agentique silencieux qui écrit l’état
durable sur disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent), afin que la compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (inférieur au seuil de compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » auprès de l’agent.
3. Utiliser le token silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement optionnel exact du fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (invite système supplémentaire ajoutée pour le tour de vidage)

Notes :

- L’invite par défaut et l’invite système par défaut incluent une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de repli de la session active, de sorte qu’une maintenance locale uniquement ne retombe pas silencieusement
  sur un modèle conversationnel payant.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose également un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de vérification de dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez la `sessionKey` dans `/status`.
- Incohérence entre le magasin et la transcription ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Trop de compactions ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une compaction plus précoce)
  - le gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Des tours silencieux fuient ? Confirmez que la réponse commence par `NO_REPLY` (token exact insensible à la casse) et que vous utilisez une version qui inclut le correctif de suppression du streaming.

## Associés

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
