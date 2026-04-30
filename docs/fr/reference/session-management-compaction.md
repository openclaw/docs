---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs sessions.json
    - Vous modifiez le comportement d’auto-compaction ou ajoutez des tâches de maintenance « pré-compaction »
    - Vous voulez mettre en œuvre des purges de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : magasin de sessions + transcriptions, cycle de vie et détails internes de la Compaction (auto)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-04-30T16:30:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants sont associés à une `sessionKey`)
- **Stockage des sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (manuelle et auto-compaction) et où accrocher le travail de pré-compaction
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

- Les interfaces utilisateur (app macOS, interface web Control UI, TUI) doivent interroger le Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Stockage des sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou dont les entrées peuvent être supprimées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec structure en arbre (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle pour les prochains tours
   - Les gros points de contrôle de débogage pré-compaction sont ignorés une fois que la transcription active dépasse le plafond de taille des points de contrôle, ce qui évite une deuxième énorme copie `.checkpoint.*.jsonl`.

---

## Emplacements sur disque

Par agent, sur l’hôte du Gateway :

- Stockage : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du stockage et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers annexes de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond d’entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget optionnel pour le répertoire des sessions
- `highWaterBytes` : cible optionnelle après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway regroupent le nettoyage `maxEntries` pour les plafonds de taille production ; un stockage peut donc dépasser brièvement le plafond configuré avant que le prochain nettoyage de seuil haut ne le réécrive à la baisse. `openclaw sessions cleanup --enforce` applique toujours le plafond configuré immédiatement.

OpenClaw ne crée plus de sauvegardes automatiques par rotation `sessions.json.bak.*` lors des écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configs.

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les plus anciens artefacts archivés, transcriptions orphelines ou trajectoires orphelines.
2. Si l’utilisation reste au-dessus de la cible, expulser les plus anciennes entrées de session et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les expulsions potentielles mais ne modifie pas le stockage ni les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées/transcriptions de session, avec des contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du stockage des sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Quand Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session `cron:<jobId>` précédente avant d’écrire la nouvelle ligne. Il conserve les préférences sûres comme les réglages de réflexion/rapide/verbeux, les libellés et les remplacements explicites de modèle/auth sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant comme le routage de canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution ACP afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou d’une autorité d’exécution provenant d’une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _le compartiment de conversation_ dans lequel vous vous trouvez (routage + isolation).

Motifs courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers une `sessionId` actuelle (le fichier de transcription qui poursuit la conversation).

Règles pratiques :

- **Réinitialisation** (`/new`, `/reset`) crée une nouvelle `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4 h 00, heure locale de l’hôte du Gateway) crée une nouvelle `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée une nouvelle `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première à expirer l’emporte.
- **Événements système** (heartbeat, réveils Cron, notifications exec, tenue interne du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité. Le basculement de réinitialisation supprime les avis d’événements système en file pour la session précédente avant la construction de la nouvelle invite.
- **Garde de fork du parent de fil** (`session.parentForkMaxTokens`, par défaut `100000`) ignore le fork de transcription parente lorsque la session parente est déjà trop volumineuse ; le nouveau fil démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du stockage des sessions (`sessions.json`)

Le type de valeur du stockage est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant de transcription actuel (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour la `sessionId` actuelle ; la fraîcheur de réinitialisation quotidienne l’utilise. Les anciennes lignes peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière vraie interaction utilisateur/canal ; la fraîcheur de réinitialisation d’inactivité l’utilise afin que heartbeat, Cron et les événements exec ne maintiennent pas les sessions actives. Les anciennes lignes sans ce champ se rabattent sur l’heure de début de session récupérée pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de la ligne de stockage, utilisé pour le listing, l’élagage et la tenue interne. Ce n’est pas l’autorité pour la fraîcheur de réinitialisation quotidienne/inactivité.
- `sessionFile` : remplacement optionnel explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où l’auto-compaction s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-compaction
- `memoryFlushCompactionCount` : nombre de compactages lorsque le dernier vidage s’est exécuté

Le stockage peut être modifié en toute sécurité, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure de transcription (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` optionnel)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche de l’arbre

OpenClaw ne « corrige » volontairement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : plafond strict par modèle (jetons visibles par le modèle)
2. **Compteurs du stockage des sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte vient du catalogue des modèles (et peut être remplacée via la config).
- `contextTokens` dans le stockage est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans la transcription et conserve intacts les messages récents.

Après la Compaction, les prochains tours voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage des sessions). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de Compaction et association des outils

Quand OpenClaw divise une longue transcription en blocs de Compaction, il garde les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes.

- Si la division par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer la paire.
- Si un bloc final de résultats d’outil ferait autrement dépasser la cible au bloc, OpenClaw préserve ce bloc d’outil en attente et garde intacte la queue non résumée.
- Les blocs d’appels d’outils interrompus/en erreur ne maintiennent pas une division en attente ouverte.

---

## Quand l’auto-compaction se produit (exécution Pi)

Dans l’agent Pi intégré, l’auto-compaction se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires selon les fournisseurs) → compacter → réessayer.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux invites + à la prochaine sortie du modèle

Ce sont des sémantiques d’exécution Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une Compaction locale de prévol avant d’ouvrir la prochaine exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le fichier de transcription actif atteint cette taille. Il s’agit d’une garde par taille de fichier pour le coût de réouverture locale, et non d’un archivage brut : OpenClaw exécute toujours la Compaction sémantique normale, et elle nécessite `truncateAfterCompaction` afin que le résumé compacté puisse devenir une nouvelle transcription successeure.

Pour les exécutions Pi intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute une garde de boucle d’outils optionnelle. Après l’ajout d’un résultat d’outil et avant
l’appel de modèle suivant, OpenClaw estime la pression sur le prompt avec la même logique de
budget de prévol utilisée au début du tour. Si le contexte ne tient plus, la garde ne fait pas de
compaction dans le hook `transformContext` de Pi. Elle émet un signal structuré de prévérification
en milieu de tour, arrête la soumission du prompt en cours, et laisse la boucle d’exécution
externe utiliser le chemin de récupération existant : tronquer les résultats d’outils surdimensionnés
quand cela suffit, ou déclencher le mode de compaction configuré et réessayer. L’option est
désactivée par défaut et fonctionne avec les modes de compaction `default` et `safeguard`,
y compris la compaction de sauvegarde basée sur un provider.
C’est indépendant de `maxActiveTranscriptBytes` : la garde de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que la prévérification en milieu de tour s’exécute plus tard
dans la boucle d’outils Pi intégrée, après l’ajout de nouveaux résultats d’outils.

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de compaction de Pi se trouvent dans les paramètres Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique aussi un seuil de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le seuil par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le seuil.
- S’il est déjà plus élevé, OpenClaw le laisse tel quel.
- `/compact` manuel respecte une valeur explicite de `agents.defaults.compaction.keepRecentTokens`
  et conserve le point de coupure de queue récente de Pi. Sans budget de conservation explicite,
  la compaction manuelle reste un point de contrôle strict et le contexte reconstruit repart du
  nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter la
  prévérification optionnelle de boucle d’outils après les nouveaux résultats d’outils et avant
  l’appel de modèle suivant. Ce n’est qu’un déclencheur ; la génération du résumé utilise toujours
  le chemin de compaction configuré. C’est indépendant de `maxActiveTranscriptBytes`, qui est une
  garde de taille en octets du transcript actif au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne comme `"20mb"` pour exécuter une compaction locale avant un tour lorsque le transcript
  actif devient volumineux. Cette garde n’est active que lorsque
  `truncateAfterCompaction` est aussi activé. Laissez-la non définie ou définissez-la sur `0` pour
  la désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait pivoter le transcript actif vers un successeur JSONL compacté après la
  compaction. L’ancien transcript complet reste archivé et lié depuis le point de contrôle de
  compaction au lieu d’être réécrit sur place.

Pourquoi : laisser assez de marge pour les opérations de maintenance multitours (comme les écritures mémoire) avant que la compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Providers de compaction enfichables

Les Plugins peuvent enregistrer un provider de compaction via `registerCompactionProvider()` sur l’API du plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un provider enregistré, l’extension de sauvegarde délègue la génération du résumé à ce provider au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un Plugin provider de compaction enregistré. Laissez non défini pour la génération de résumé LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les providers reçoivent les mêmes instructions de compaction et la même politique de préservation des identifiants que le chemin intégré.
- La sauvegarde conserve toujours le contexte de suffixe des tours récents et des tours scindés après la sortie du provider.
- La génération de résumé de sauvegarde intégrée redistille les résumés précédents avec les nouveaux messages
  au lieu de préserver textuellement l’intégralité du résumé précédent.
- Le mode sauvegarde active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le provider échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la génération de résumé LLM intégrée.
- Les signaux d’abandon/expiration sont relancés (et non masqués) pour respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la compaction et l’état de session via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode détaillé : `🧹 Auto-compaction complete` + nombre de compactions

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw le retire/supprime dans la couche de livraison.
- La suppression par token silencieux exact est insensible à la casse ; `NO_REPLY` et
  `no_reply` comptent donc tous deux lorsque l’ensemble de la charge utile est uniquement le token silencieux.
- C’est réservé aux vrais tours en arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires nécessitant une action.

Depuis `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/saisie** lorsqu’un
fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle en milieu de tour.

---

## « Vidage mémoire » avant compaction (implémenté)

Objectif : avant que l’auto-compaction ne se produise, exécuter un tour agentique silencieux qui écrit l’état durable
sur disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la compaction ne puisse pas
effacer de contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (sous le seuil de compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » pour l’agent.
3. Utiliser le token silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement optionnel exact provider/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Notes :

- Le prompt/prompt système par défaut inclut une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de fallback de la session active, afin que la maintenance locale uniquement ne bascule pas silencieusement
  vers un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les schémas d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incohérence entre store et transcript ? Confirmez l’hôte Gateway et le chemin du store depuis `openclaw status`.
- Compaction répétitive ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une compaction plus précoce)
  - le gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Fuite des tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (token exact insensible à la casse) et que vous utilisez un build qui inclut le correctif de suppression du streaming.

## Associés

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
