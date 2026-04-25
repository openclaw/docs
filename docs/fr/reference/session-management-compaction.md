---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement de Compaction automatique ou ajoutez des tâches de maintenance « pré-Compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Approfondissement : magasin de sessions + transcriptions, cycle de vie, et mécanismes internes de Compaction (automatique)'
title: Approfondissement sur la gestion des sessions
x-i18n:
    generated_at: "2026-04-25T13:57:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Cette page explique comment OpenClaw gère les sessions de bout en bout :

- **Routage des sessions** (comment les messages entrants sont associés à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance du transcript** (`*.jsonl`) et sa structure
- **Hygiène du transcript** (ajustements spécifiques au fournisseur avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (Compaction manuelle + automatique) et où brancher le travail de pré-Compaction
- **Maintenance silencieuse** (par ex. écritures en mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous voulez d’abord une vue d’ensemble de plus haut niveau, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène du transcript](/fr/reference/transcript-hygiene)

---

## Source de vérité : le Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, interface web Control UI, TUI) doivent interroger le Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers locaux sur Mac » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw conserve les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Mappage clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript en ajout seul avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisé pour reconstruire le contexte du modèle pour les tours futurs

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json` et les artefacts de transcript :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : limite du nombre d’entrées dans `sessions.json` (par défaut `500`)
- `rotateBytes` : fait tourner `sessions.json` lorsqu’il est trop volumineux (par défaut `10mb`)
- `resetArchiveRetention` : durée de rétention pour les archives de transcript `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget optionnel du répertoire des sessions
- `highWaterBytes` : cible optionnelle après nettoyage (par défaut `80%` de `maxDiskBytes`)

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les plus anciens artefacts de transcript archivés ou orphelins.
2. Si l’utilisation reste au-dessus de la cible, évincer les plus anciennes entrées de session et leurs fichiers de transcript.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin ni les fichiers.

Lancer la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées de session/transcripts, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il conserve les préférences sûres
telles que les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/authentification sélectionnés par l’utilisateur. Il supprime le contexte de conversation ambiant
tel que le routage canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison d’exécution ACP
afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une autorité d’exécution ou de livraison
obsolète provenant d’une exécution antérieure.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolement).

Modèles courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf si remplacé)

Les règles canoniques sont documentées sur [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (le fichier de transcript qui poursuit la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4:00 du matin, heure locale de l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration par inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Si quotidien + inactivité sont tous deux configurés, c’est la première expiration qui l’emporte.
- **Garde de bifurcation du parent de thread** (`session.parentForkMaxTokens`, par défaut `100000`) saute la bifurcation du transcript parent lorsque la session parente est déjà trop volumineuse ; le nouveau thread démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant actuel du transcript (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `updatedAt` : horodatage de la dernière activité
- `sessionFile` : remplacement optionnel explicite du chemin du transcript
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : fréquence à laquelle la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage de mémoire avant Compaction
- `memoryFlushCompactionCount` : nombre de Compaction lorsque le dernier vidage a été exécuté

Le magasin peut être modifié en toute sécurité, mais le Gateway fait autorité : il peut réécrire ou réhydrater des entrées à mesure que les sessions s’exécutent.

---

## Structure du transcript (`*.jsonl`)

Les transcripts sont gérés par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est au format JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` optionnel)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrée notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par l’extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche de l’arbre

OpenClaw n’« ajuste » intentionnellement **pas** les transcripts ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (jetons visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, voir [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans le transcript et conserve intacts les messages récents.

Après la Compaction, les tours futurs voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage des sessions). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de Compaction et appariement des outils

Lorsque OpenClaw découpe un long transcript en blocs de Compaction, il maintient
les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes.

- Si le découpage par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc final de résultat d’outil pousserait autrement le bloc au-delà de la cible,
  OpenClaw préserve ce bloc d’outil en attente et garde intacte la fin non résumée.
- Les blocs d’appel d’outil annulés/en erreur ne maintiennent pas une séparation en attente ouverte.

---

## Quand la Compaction automatique se produit (runtime Pi)

Dans l’agent Pi embarqué, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et d’autres variantes similaires propres au fournisseur) → Compaction → nouvelle tentative.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée pour les prompts + la prochaine sortie du modèle

Ce sont des sémantiques du runtime Pi (OpenClaw consomme les événements, mais Pi décide quand faire la Compaction).

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

OpenClaw applique également un plancher de sécurité pour les exécutions embarquées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` jetons.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- Si la valeur est déjà plus élevée, OpenClaw la laisse telle quelle.
- La commande manuelle `/compact` respecte un `agents.defaults.compaction.keepRecentTokens` explicite
  et conserve le point de coupe récent de Pi. Sans budget de conservation explicite,
  la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit repart
  du nouveau résumé.

Pourquoi : laisser suffisamment de marge pour les « tâches de maintenance » sur plusieurs tours (comme les écritures en mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelée depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` dans l’API Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un fournisseur enregistré, l’extension safeguard délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un plugin fournisseur de Compaction enregistré. Laissez non défini pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte suffixe des tours récents et des tours fractionnés après la sortie du fournisseur.
- La synthèse safeguard intégrée re-distille les résumés précédents avec les nouveaux messages
  au lieu de préserver intégralement le résumé précédent tel quel.
- Le mode safeguard active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/d’expiration sont relancés (et non avalés) afin de respecter l’annulation demandée par l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la Compaction et l’état des sessions via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de Compaction

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches d’arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas transmettre de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression du jeton silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` sont tous deux pris en compte lorsque toute la charge utile n’est que le jeton silencieux.
- Cela est réservé aux vrais tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  des requêtes utilisateur ordinaires nécessitant une action.

À partir de `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/saisie** lorsqu’un
bloc partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne laissent pas fuiter
de sortie partielle au milieu du tour.

---

## « Vidage de mémoire » pré-Compaction (implémenté)

Objectif : avant que la Compaction automatique ne se produise, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par ex. `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer du contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (en dessous du seuil de Compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » à destination de l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` pour que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Remarques :

- Le prompt system prompt par défaut incluent un indice `NO_REPLY` pour supprimer
  la livraison.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage s’exécute uniquement pour les sessions Pi embarquées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Memory](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw se trouve aujourd’hui côté Gateway.

---

## Checklist de dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez la `sessionKey` dans `/status`.
- Incohérence entre magasin et transcript ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Spam de Compaction ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - le gonflement des résultats d’outils : activez/ajustez l’élagage des sessions
- Fuite de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez une build qui inclut le correctif de suppression du streaming.

## Lié

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
