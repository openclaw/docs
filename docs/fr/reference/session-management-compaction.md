---
read_when:
    - Vous devez déboguer les identifiants de session, la transcription JSONL ou les champs de sessions.json
    - Vous modifiez le comportement de la Compaction automatique ou ajoutez des tâches d’entretien « pré-Compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage de session + transcriptions, cycle de vie et fonctionnement interne de la Compaction automatique'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-05-02T07:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gère les sessions de bout en bout dans ces domaines :

- **Routage des sessions** (comment les messages entrants correspondent à une `sessionKey`)
- **Stockage des sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et sa structure
- **Hygiène des transcriptions** (correctifs propres aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs jetons suivis)
- **Compaction** (Compaction manuelle et automatique) et où brancher le travail pré-Compaction
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

- Les interfaces utilisateur (application macOS, interface de contrôle web, TUI) doivent interroger le Gateway pour obtenir les listes de sessions et les nombres de jetons.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que le Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Stockage des sessions (`sessions.json`)**
   - Carte clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session actuel, dernière activité, bascules, compteurs de jetons, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription à ajout uniquement avec structure arborescente (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle lors des prochains tours
   - Les gros points de contrôle de débogage pré-Compaction sont ignorés une fois que la transcription active
     dépasse le plafond de taille des points de contrôle, évitant une deuxième copie géante
     `.checkpoint.*.jsonl`.

Les lecteurs d’historique du Gateway doivent éviter de matérialiser toute la transcription sauf si
la surface a explicitement besoin d’un accès historique arbitraire. L’historique de première page,
l’historique de chat intégré, la récupération après redémarrage et les vérifications de jetons/d’utilisation utilisent des lectures de fin bornées.
Les analyses complètes de transcription passent par l’index asynchrone des transcriptions, qui est
mis en cache par chemin de fichier plus `mtimeMs`/`size` et partagé entre les lecteurs concurrents.

---

## Emplacements sur disque

Par agent, sur l’hôte du Gateway :

- Stockage : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du stockage et contrôles de disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json`, les artefacts de transcription et les fichiers auxiliaires de trajectoire :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : plafond d’entrées dans `sessions.json` (par défaut `500`)
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Les écritures normales du Gateway groupent le nettoyage `maxEntries` pour les plafonds de taille production, donc un stockage peut dépasser brièvement le plafond configuré avant que le prochain nettoyage du seuil haut ne le réécrive à la baisse. Les lectures du stockage des sessions n’élaguent pas et ne plafonnent pas les entrées pendant le démarrage du Gateway ; utilisez des écritures ou `openclaw sessions cleanup --enforce` pour nettoyer. `openclaw sessions cleanup --enforce` applique toujours immédiatement le plafond configuré.

La maintenance conserve les pointeurs durables vers des conversations externes, comme les sessions de groupe
et les sessions de chat limitées à un fil, mais les entrées d’exécution synthétiques pour cron, les hooks,
Heartbeat, ACP et les sous-agents peuvent toujours être supprimées lorsqu’elles dépassent
l’âge, le nombre ou le budget disque configuré.

OpenClaw ne crée plus de sauvegardes automatiques avec rotation `sessions.json.bak.*` pendant les écritures du Gateway. La clé héritée `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Ordre d’application du nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts archivés les plus anciens, les transcriptions orphelines ou les trajectoires orphelines.
2. Si l’usage est toujours au-dessus de la cible, évincer les entrées de session les plus anciennes et leurs fichiers de transcription/trajectoire.
3. Continuer jusqu’à ce que l’usage soit inférieur ou égal à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le stockage/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées de session/transcriptions, et elles ont des contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution Cron isolées du stockage des sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

Quand Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session précédente
`cron:<jobId>` avant d’écrire la nouvelle ligne. Il transporte les préférences sûres
comme les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites
de modèle/auth sélectionnés par l’utilisateur. Il abandonne le contexte de conversation ambiant
comme le routage de canal/groupe, la politique d’envoi ou de file d’attente, l’élévation, l’origine et la liaison
d’exécution ACP afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une livraison obsolète ou
d’une autorité d’exécution d’une exécution plus ancienne.

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolation).

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
- **Réinitialisation quotidienne** (par défaut 4 h 00, heure locale sur l’hôte du gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’héritée `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Quand la réinitialisation quotidienne et l’inactivité sont toutes deux configurées, la première qui expire l’emporte.
- **Événements système** (Heartbeat, réveils Cron, notifications exec, tenue des registres du Gateway) peuvent modifier la ligne de session mais ne prolongent pas la fraîcheur de réinitialisation quotidienne/d’inactivité. Le basculement de réinitialisation écarte les notifications d’événements système en file pour la session précédente avant la construction du nouveau prompt.
- **Politique de fork parent** utilise la branche active de PI lors de la création d’un fil ou d’un fork de sous-agent. Si cette branche est trop volumineuse, OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. La politique de dimensionnement est automatique ; la configuration héritée `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.

Détail d’implémentation : la décision se produit dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du stockage des sessions (`sessions.json`)

Le type de valeur du stockage est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (non exhaustif) :

- `sessionId` : identifiant de transcription actuel (le nom de fichier est dérivé de celui-ci sauf si `sessionFile` est défini)
- `sessionStartedAt` : horodatage de début pour le `sessionId` actuel ; la fraîcheur de réinitialisation quotidienne
  l’utilise. Les lignes héritées peuvent le dériver de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle utilisateur/canal ; la fraîcheur de réinitialisation
  d’inactivité l’utilise afin que les événements Heartbeat, Cron et exec ne maintiennent pas les sessions
  en vie. Les lignes héritées sans ce champ se rabattent sur l’heure de début de session récupérée
  pour la fraîcheur d’inactivité.
- `updatedAt` : horodatage de la dernière mutation de ligne du stockage, utilisé pour le listage, l’élagage et
  la tenue des registres. Ce n’est pas l’autorité pour la fraîcheur de réinitialisation quotidienne/d’inactivité.
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
- `compactionCount` : fréquence à laquelle l’auto-Compaction s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compaction lorsque le dernier vidage s’est exécuté

Le stockage est sûr à modifier, mais le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant l’exécution des sessions.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Ensuite : entrées de session avec `id` + `parentId` (arborescence)

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface utilisateur)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de Compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche d’arborescence

OpenClaw ne « corrige » intentionnellement **pas** les transcriptions ; le Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs jetons suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : plafond strict par modèle (jetons visibles par le modèle)
2. **Compteurs du stockage des sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte vient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le stockage est une valeur d’estimation/de reporting à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, consultez [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée `compaction` persistée dans la transcription et conserve les messages récents intacts.

Après la Compaction, les futurs tours voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage des sessions). Consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de Compaction et appairage des outils

Quand OpenClaw divise une longue transcription en blocs de Compaction, il garde
les appels d’outils de l’assistant appairés avec leurs entrées `toolResult` correspondantes.

- Si la séparation par part de jetons tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc final de résultats d’outil ferait autrement dépasser la cible au bloc,
  OpenClaw préserve ce bloc d’outils en attente et garde intacte la fin
  non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas une séparation en attente ouverte.

---

## Quand l’auto-Compaction se produit (exécution Pi)

Dans l’agent Pi intégré, l’auto-Compaction se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires selon les fournisseurs) → compacter → réessayer.
2. **Maintenance du seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la prochaine sortie du modèle

Ce sont des sémantiques d’exécution Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

OpenClaw peut aussi déclencher une compaction locale préalable avant d’ouvrir la
prochaine exécution lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini et que le
fichier de transcription active atteint cette taille. Il s’agit d’un garde-fou de taille de fichier pour le coût de
réouverture locale, pas d’un archivage brut : OpenClaw exécute toujours la compaction sémantique normale,
et cela nécessite `truncateAfterCompaction` afin que le résumé compacté puisse devenir une
nouvelle transcription successeure.

Pour les exécutions Pi intégrées, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
ajoute un garde-fou optionnel de boucle d’outils. Après l’ajout d’un résultat d’outil et avant le
prochain appel au modèle, OpenClaw estime la pression du prompt à l’aide de la même logique de budget
préalable utilisée au début du tour. Si le contexte ne tient plus, le garde-fou ne compacte pas
dans le hook `transformContext` de Pi. Il émet un signal structuré de prévérification
en milieu de tour, arrête la soumission du prompt courant et laisse la boucle d’exécution
externe utiliser le chemin de récupération existant : tronquer les résultats d’outils trop volumineux
lorsque cela suffit, ou déclencher le mode de compaction configuré et réessayer. L’option
est désactivée par défaut et fonctionne avec les modes de compaction `default` et `safeguard`,
y compris la compaction safeguard adossée à un fournisseur.
Cela est indépendant de `maxActiveTranscriptBytes` : le garde-fou de taille en octets s’exécute
avant l’ouverture d’un tour, tandis que la prévérification en milieu de tour s’exécute plus tard dans la boucle d’outils Pi intégrée
après l’ajout de nouveaux résultats d’outils.

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

OpenClaw applique également un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- S’il est déjà plus élevé, OpenClaw le laisse inchangé.
- `/compact` manuel respecte un `agents.defaults.compaction.keepRecentTokens` explicite
  et conserve le point de coupure de la queue récente de Pi. Sans budget de conservation explicite,
  la compaction manuelle reste un point de contrôle strict et le contexte reconstruit démarre à partir
  du nouveau résumé.
- Définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` pour exécuter la
  prévérification optionnelle de boucle d’outils après les nouveaux résultats d’outils et avant le prochain appel au modèle.
  Ce n’est qu’un déclencheur ; la génération du résumé utilise toujours le chemin de
  compaction configuré. Elle est indépendante de `maxActiveTranscriptBytes`, qui est un
  garde-fou de taille en octets de la transcription active au début du tour.
- Définissez `agents.defaults.compaction.maxActiveTranscriptBytes` sur une valeur en octets ou
  une chaîne comme `"20mb"` pour exécuter la compaction locale avant un tour lorsque la transcription active
  devient volumineuse. Ce garde-fou n’est actif que lorsque
  `truncateAfterCompaction` est également activé. Laissez-le non défini ou définissez-le sur `0` pour
  le désactiver.
- Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé,
  OpenClaw fait pivoter la transcription active vers un JSONL successeur compacté après
  la compaction. L’ancienne transcription complète reste archivée et liée depuis le
  point de contrôle de compaction au lieu d’être réécrite sur place.

Pourquoi : laisser assez de marge pour le « ménage » multi-tours (comme les écritures mémoire) avant que la compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de compaction configurables

Les Plugins peuvent enregistrer un fournisseur de compaction via `registerCompactionProvider()` dans l’API du plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’id d’un fournisseur enregistré, l’extension safeguard délègue la synthèse à ce fournisseur plutôt qu’au pipeline intégré `summarizeInStages`.

- `provider` : id d’un plugin fournisseur de compaction enregistré. Laissez non défini pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de compaction et la même politique de préservation des identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte de suffixe des tours récents et des tours scindés après la sortie du fournisseur.
- La synthèse safeguard intégrée redistille les résumés précédents avec les nouveaux messages
  au lieu de préserver textuellement le résumé précédent complet.
- Le mode safeguard active par défaut les audits de qualité des résumés ; définissez
  `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative sur sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/timeout sont relancés (et non avalés) afin de respecter l’annulation par l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la compaction et l’état de session via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de compactages

---

## Ménage silencieux (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression du token silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous les deux lorsque la charge utile complète est uniquement le token silencieux.
- Cela concerne uniquement les véritables tours d’arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les demandes utilisateur ordinaires nécessitant une action.

Depuis `2026.1.10`, OpenClaw supprime également le **streaming de brouillon/saisie** lorsqu’un
fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie
partielle en milieu de tour.

---

## « Vidage mémoire » avant compaction (implémenté)

Objectif : avant qu’une compaction automatique ne se produise, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de session.
2. Lorsqu’elle franchit un « seuil souple » (sous le seuil de compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » destinée à l’agent.
3. Utiliser le token silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `model` (remplacement exact optionnel fournisseur/modèle pour le tour de vidage, par exemple `ollama/qwen3:8b`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Notes :

- Le prompt/prompt système par défaut inclut une indication `NO_REPLY` pour supprimer
  la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la
  chaîne de secours de la session active, afin que le ménage local uniquement ne retombe pas silencieusement
  sur un modèle de conversation payant.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour l’agencement des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose également un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de vérification de dépannage

- Clé de session incorrecte ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez le `sessionKey` dans `/status`.
- Décalage entre store et transcription ? Confirmez l’hôte Gateway et le chemin du store depuis `openclaw status`.
- Trop de compactages ? Vérifiez :
  - fenêtre de contexte du modèle (trop petite)
  - paramètres de compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une compaction plus précoce)
  - gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Fuites de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (token exact insensible à la casse) et que vous êtes sur une build qui inclut le correctif de suppression du streaming.

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
