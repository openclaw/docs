---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de `sessions.json`
    - Vous modifiez le comportement de Compaction automatique ou ajoutez un nettoyage « pré-compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Approfondissement : magasin de sessions + transcriptions, cycle de vie et mécanismes internes de Compaction (auto)'
title: Approfondissement sur la gestion des sessions
x-i18n:
    generated_at: "2026-04-26T11:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Cette page explique comment OpenClaw gère les sessions de bout en bout :

- **Routage des sessions** (comment les messages entrants sont associés à un `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs spécifiques au fournisseur avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (Compaction manuelle + automatique) et où brancher le travail de pré-Compaction
- **Nettoyage silencieux** (par ex. écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous souhaitez d’abord une vue d’ensemble plus générale, commencez par :

- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Hygiène des transcriptions](/fr/reference/transcript-hygiene)

---

## Source de vérité : la Gateway

OpenClaw est conçu autour d’un **processus Gateway unique** qui détient l’état des sessions.

- Les interfaces utilisateur (application macOS, interface de contrôle web, TUI) doivent interroger la Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers locaux sur votre Mac » ne reflète pas ce que la Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petite, mutable, sûre à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec structure en arbre (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle pour les futurs tours

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujets Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json` et les artefacts de transcription :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’ancienneté des entrées obsolètes (par défaut `30d`)
- `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`)
- `rotateBytes` : rotation de `sessions.json` lorsqu’il devient trop volumineux (par défaut `10mb`)
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les plus anciens artefacts de transcription archivés ou orphelins.
2. Si l’utilisation reste au-dessus de la cible, évincer les plus anciennes entrées de session et leurs fichiers de transcription.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin ni les fichiers.

Lancer la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent également des entrées/transcriptions de session, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du magasin de sessions (`false` désactive cette opération).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il conserve les préférences sûres
telles que les réglages de réflexion/rapide/verbeux, les libellés et les surcharges explicites
de modèle/authentification sélectionnées par l’utilisateur. Il supprime le contexte ambiant de conversation tel
que le routage canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison de runtime ACP
afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une autorité de livraison ou de runtime obsolète d’une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Un `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolation).

Modèles courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salle/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf surcharge)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (le fichier de transcription qui poursuit la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour ce `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4:00 heure locale sur l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration par inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque quotidien + inactivité sont tous deux configurés, le premier expiré l’emporte.
- **Événements système** (Heartbeat, réveils Cron, notifications d’exécution, comptabilité Gateway) peuvent modifier la ligne de session mais n’étendent pas la fraîcheur de réinitialisation quotidienne/par inactivité. Le basculement de réinitialisation écarte les notifications d’événements système en file d’attente pour la session précédente avant la construction du nouveau prompt.
- **Garde de bifurcation du parent de thread** (`session.parentForkMaxTokens`, par défaut `100000`) ignore la bifurcation de la transcription parente lorsque la session parente est déjà trop volumineuse ; le nouveau thread repart de zéro. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant actuel de la transcription (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début du `sessionId` actuel ; la fraîcheur de la
  réinitialisation quotidienne l’utilise. Les anciennes lignes peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : dernier horodatage d’interaction utilisateur/canal réelle ; la fraîcheur de la
  réinitialisation par inactivité l’utilise, de sorte que Heartbeat, Cron et les événements d’exécution ne maintiennent pas les sessions
  actives. Les anciennes lignes sans ce champ retombent sur l’heure de début de session récupérée pour la fraîcheur par inactivité.
- `updatedAt` : dernier horodatage de mutation de la ligne du magasin, utilisé pour le listing, l’élagage et la
  comptabilité. Ce n’est pas l’autorité de fraîcheur pour la réinitialisation quotidienne/par inactivité.
- `sessionFile` : surcharge facultative explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (surcharge par session)
- Sélection du modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de jetons (best-effort / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où la Compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compactions au moment où le dernier vidage a été exécuté

Le magasin peut être modifié en toute sécurité, mais la Gateway fait autorité : elle peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure de la transcription (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrée notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par une extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche de l’arbre

OpenClaw ne « corrige » intentionnellement **pas** les transcriptions ; la Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (jetons visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être surchargée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, voir [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume les anciennes conversations dans une entrée `compaction` persistée dans la transcription et conserve intacts les messages récents.

Après Compaction, les futurs tours voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage des sessions). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de Compaction et appariement des outils

Lorsque OpenClaw découpe une longue transcription en blocs de Compaction, il conserve
les appels d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si la limite de découpage par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer la paire.
- Si un bloc final de résultats d’outil ferait sinon dépasser la cible au bloc,
  OpenClaw préserve ce bloc d’outil en attente et conserve intacte la fin non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas ouverte une séparation en attente.

---

## Quand la Compaction automatique se produit (runtime Pi)

Dans l’agent Pi embarqué, la Compaction automatique se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de débordement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires propres au fournisseur) → Compaction → nouvelle tentative.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la prochaine sortie du modèle

Il s’agit de la sémantique du runtime Pi (OpenClaw consomme les événements, mais c’est Pi qui décide quand effectuer la Compaction).

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

OpenClaw applique également un seuil de sécurité pour les exécutions embarquées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le seuil par défaut est de `20000` jetons.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver ce seuil.
- S’il est déjà plus élevé, OpenClaw n’y touche pas.
- La commande manuelle `/compact` respecte un `agents.defaults.compaction.keepRecentTokens` explicite
  et conserve le point de coupe de la fin récente de Pi. Sans budget explicite de conservation,
  la Compaction manuelle reste un point de contrôle strict et le contexte reconstruit repart
  du nouveau résumé.

Pourquoi : laisser suffisamment de marge pour un « nettoyage » sur plusieurs tours (comme les écritures mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un fournisseur enregistré, l’extension safeguard délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un fournisseur de Compaction Plugin enregistré. Laissez non défini pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte suffixe des tours récents et des tours fractionnés après la sortie du fournisseur.
- La synthèse safeguard intégrée redistille les résumés précédents avec les nouveaux messages
  au lieu de conserver l’intégralité du résumé précédent tel quel.
- Le mode safeguard active par défaut les audits de qualité du résumé ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/d’expiration sont relancés (et non avalés) afin de respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer l’état de la Compaction et des sessions via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de Compactions

---

## Nettoyage silencieux (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches d’arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas envoyer de réponse à l’utilisateur ».
- OpenClaw le supprime/le masque dans la couche de livraison.
- La suppression exacte du jeton silencieux est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque toute la charge utile n’est que le jeton silencieux.
- Cela est réservé aux vrais tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  des requêtes utilisateur ordinaires nécessitant une action.

À partir de `2026.1.10`, OpenClaw supprime également le **streaming de brouillon/frappe** lorsqu’un
bloc partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne laissent pas fuiter
de sortie partielle au milieu d’un tour.

---

## « Vidage mémoire » pré-Compaction (implémenté)

Objectif : avant qu’une Compaction automatique ne se produise, exécuter un tour agentique silencieux qui écrit un état
durable sur disque (par ex. `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de la session.
2. Lorsqu’elle franchit un « seuil souple » (inférieur au seuil de Compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » vers l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Remarques :

- Le prompt par défaut et le prompt système par défaut incluent un indice `NO_REPLY` pour supprimer
  la livraison.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi embarquées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose également un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Checklist de dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Incohérence entre magasin et transcription ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Spam de Compaction ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - gonflement des résultats d’outils : activez/ajustez l’élagage des sessions
- Fuite de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez une build incluant le correctif de suppression du streaming.

## Lié

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
