---
read_when:
    - Vous devez déboguer les identifiants de session, les événements de transcription ou les champs des lignes de session
    - Vous modifiez le comportement de Compaction automatique ou ajoutez des opérations de maintenance « pré-Compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions et transcriptions, cycle de vie et fonctionnement interne de la Compaction (automatique)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-07-12T15:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un **processus Gateway unique** gère l’état des sessions de bout en bout. Les interfaces utilisateur (application macOS, interface Web Control UI, TUI) interrogent le Gateway pour obtenir les listes de sessions et le nombre de tokens. En mode distant, les fichiers de session résident sur l’hôte distant ; l’examen des fichiers de votre Mac local ne reflète donc pas ce que le Gateway utilise.

Commencez par la documentation générale : [Gestion des sessions](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Vue d’ensemble de la mémoire](/fr/concepts/memory), [Recherche dans la mémoire](/fr/concepts/memory-search), [Élagage des sessions](/fr/concepts/session-pruning), [Hygiène des transcriptions](/fr/reference/transcript-hygiene), et la référence de configuration complète dans [Configuration des agents](/fr/gateway/config-agents).

## Deux couches de persistance

1. **Lignes de session (SQLite par agent)** - table clé/valeur `sessionKey -> SessionEntry`. État d’exécution mutable géré par le Gateway. Assure le suivi des métadonnées : identifiant de la session actuelle, dernière activité, options, compteurs de tokens.
2. **Événements de transcription (SQLite par agent)** - structure arborescente en ajout uniquement (les entrées comportent `id` + `parentId`). Stocke la conversation, les appels d’outils et les résumés de Compaction ; reconstruit le contexte du modèle pour les tours suivants. Les points de contrôle de Compaction constituent des métadonnées associées à la transcription successeure compactée : une nouvelle Compaction n’écrit pas une seconde copie `.checkpoint.*.jsonl`.

Les installations plus anciennes peuvent encore contenir des fichiers `sessions.json` dans le répertoire `sessions/`
de l’agent. Considérez ces fichiers comme des entrées de migration des lignes de session héritées ou comme des cibles explicites
de maintenance hors ligne. Le démarrage du Gateway et `openclaw doctor --fix` importent
automatiquement les lignes héritées actives et l’historique des transcriptions dans le stockage SQLite
propre à chaque agent. Exécutez `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, puis suivez la [séquence de migration de
Doctor](/fr/cli/doctor#session-sqlite-migration) lorsque vous avez besoin de preuves explicites
d’inspection ou de validation. Si une migration échoue après l’archivage des artefacts
de transcription hérités, utilisez le mode de récupération de Doctor décrit dans cette séquence.
La récupération utilise les manifestes de migration, restaure uniquement les artefacts de prise en charge
archivés concernés, prépare sur demande un rapport de problème GitHub expurgé et ne
réactive pas la lecture des fichiers JSONL par l’exécution active.

Les lecteurs d’historique du Gateway évitent de matérialiser l’intégralité de la transcription, sauf si la surface nécessite un accès arbitraire à l’historique. La première page de l’historique, l’historique de discussion intégré, la récupération après redémarrage ainsi que les vérifications des tokens et de l’utilisation emploient des lectures bornées de la fin des données SQLite. Les analyses complètes des transcriptions passent par l’index asynchrone des transcriptions et sont partagées entre les lecteurs simultanés.

## Emplacements sur disque

Pour chaque agent, sur l’hôte du Gateway (résolus via `src/config/sessions.ts`) :

- Stockage des lignes de session d’exécution : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Lignes de transcription d’exécution : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefacts de transcription hérités/archivés : `~/.openclaw/agents/<agentId>/sessions/`
- Entrée de migration des lignes héritées : `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Maintenance du stockage et contrôle de l’espace disque

`session.maintenance` contrôle la maintenance automatique des lignes de session SQLite, des lignes de transcription SQLite, des artefacts d’archive et des fichiers annexes de trajectoire :

| Clé                     | Valeur par défaut      | Remarques                                                                                                                  |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`            | ou `"warn"` (signalement uniquement, sans modification)                                                                    |
| `pruneAfter`            | `"30d"`                | seuil d’ancienneté des entrées obsolètes                                                                                   |
| `maxEntries`            | `500`                  | nombre maximal d’entrées de session                                                                                        |
| `resetArchiveRetention` | conservation (sans seuil d’ancienneté) | seuil d’ancienneté des archives de transcription `*.reset.*`/`*.deleted.*` ; une durée active leur suppression |
| `maxDiskBytes`          | `2gb`                  | budget disque des sessions par agent ; `false` le désactive                                                               |
| `highWaterBytes`        | 80 % de `maxDiskBytes` | cible après le nettoyage lié au budget                                                                                     |

Les transcriptions archivées sont conservées par défaut et compressées avec zstd (`*.jsonl.<reason>.<timestamp>.zst`) lorsque l’environnement d’exécution le permet ; la suppression ou la réinitialisation d’une session n’élimine donc jamais silencieusement l’historique de la conversation. Le budget disque évince d’abord les archives les plus anciennes, avant de toucher aux sessions actives.

L’application active de `maxDiskBytes` par SQLite mesure, pour chaque session, les octets du JSON des lignes de session et du JSON des événements de transcription ; l’application de la maintenance hors ligne héritée mesure les fichiers dans le répertoire de sessions sélectionné.

Les sessions de test d’exécution de modèle du Gateway (clés correspondant à `agent:*:explicit:model-run-<uuid>`) bénéficient d’une durée de conservation distincte et fixe de `24h`. Cet élagage dépend de la pression : il ne s’exécute que lorsque la maintenance des entrées de session ou la limite de capacité est atteinte, et uniquement avant l’étape globale de nettoyage ou de limitation des entrées obsolètes. Les autres sessions explicites n’utilisent pas cette durée de conservation.

Ordre d’application du nettoyage lié au budget disque (`mode: "enforce"`) :

1. Supprimez d’abord les artefacts de transcription archivés les plus anciens, les artefacts hérités orphelins ou les artefacts de trajectoire orphelins.
2. Si l’utilisation reste supérieure à la cible, évincez les entrées de session les plus anciennes ainsi que leurs lignes de transcription ou leurs artefacts de trajectoire.
3. Répétez l’opération jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

`mode: "warn"` signale les évictions potentielles sans modifier le stockage ni les fichiers.

Exécutez la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

La maintenance conserve les pointeurs durables vers les conversations externes, comme les sessions de groupe et les sessions de discussion limitées à un fil, mais les entrées d’exécution synthétiques (cron, hooks, heartbeat, ACP, sous-agents) peuvent toujours être supprimées dès qu’elles dépassent l’âge, le nombre ou le budget disque configurés. Les exécutions cron isolées utilisent un paramètre `cron.sessionRetention` distinct, indépendant de la conservation des sondes d’exécution du modèle.

Les écritures normales du Gateway passent par l’accesseur de session, qui sérialise les mutations SQLite par agent via le chemin d’écriture de l’environnement d’exécution. Le code de l’environnement d’exécution doit privilégier les fonctions d’assistance de l’accesseur dans `src/config/sessions/session-accessor.ts` ; les anciennes fonctions d’assistance de `sessions.json` sont des outils de migration et de maintenance hors ligne. Lorsqu’un Gateway est accessible, les opérations sans simulation `openclaw sessions cleanup` et `openclaw agents delete` délèguent les mutations du stockage au Gateway afin que le nettoyage rejoigne la même file d’attente d’écriture ; `--store <path>` constitue le chemin explicite de réparation hors ligne pour un stockage hérité sélectionné et reste toujours local (tout comme `--dry-run`). Le nettoyage `maxEntries` est effectué par lots pour les stockages de taille adaptée à la production ; un stockage peut donc dépasser brièvement la limite configurée avant que le prochain nettoyage au seuil haut ne le réécrive pour le ramener sous cette limite. Les lectures ne suppriment ni ne limitent jamais les entrées pendant le démarrage du Gateway : seules les écritures ou `openclaw sessions cleanup --enforce` le font ; cette dernière applique également la limite immédiatement et supprime les anciens artefacts hérités non référencés de transcription, de point de contrôle et de trajectoire, même si aucun budget disque n’est configuré.

OpenClaw ne crée plus automatiquement de sauvegardes de rotation `sessions.json.bak.*` lors des écritures du Gateway. L’ancienne clé `session.maintenance.rotateBytes` est ignorée et `openclaw doctor --fix` la supprime des anciennes configurations.

Les modifications des transcriptions utilisent la file d’attente d’écriture de session pour la cible de transcription SQLite :

| Paramètre                            | Valeur par défaut | Remplacement par variable d’environnement        |
| ------------------------------------ | ----------------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`           | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`         | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`          | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` correspond à la durée pendant laquelle l’attente d’un verrou peut signaler une erreur de session occupée avant d’abandonner ; augmentez cette valeur uniquement lorsque des opérations légitimes de préparation, de nettoyage, de compaction ou de mise en miroir des transcriptions entraînent une contention plus longue sur les machines lentes. `staleMs` détermine à partir de quand un verrou existant peut être récupéré comme obsolète. `maxHoldMs` est le seuil de libération du mécanisme de surveillance interne au processus.

### Rétrogradation après le passage à SQLite

Restaurez les artefacts archivés des anciennes transcriptions avant d’exécuter une ancienne
version d’OpenClaw reposant sur des fichiers :

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migration conserve les anciens fichiers `sessions.json` à des fins d’assistance et de
restauration, mais les fichiers JSONL actifs de transcription importés dans SQLite sont
renommés et placés dans `session-sqlite-import-archive/`. Les anciens environnements d’exécution reposant
sur des fichiers suivent les chemins `sessionFile` dans `sessions.json` ; ces artefacts doivent donc être restaurés
avant le démarrage. La restauration utilise les manifestes de migration, déplace uniquement les artefacts archivés
répertoriés dont les chemins d’origine sont absents et conserve la base de données SQLite
pour permettre une récupération ultérieure.

Les sessions créées après le passage à SQLite utilisent exclusivement SQLite et n’apparaîtront pas dans un ancien environnement d’exécution reposant sur des fichiers. Si vous effectuez une nouvelle mise à niveau après un retour à une version antérieure, exécutez à nouveau la séquence d’inspection et de validation de Doctor afin qu’OpenClaw puisse vérifier les artefacts hérités restaurés avant leur importation.

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent leurs propres entrées de session/transcriptions avec une conservation dédiée :

- `cron.sessionRetention` (valeur par défaut : `"24h"`) supprime du stockage les anciennes sessions d’exécution Cron isolées ; `false` désactive cette suppression.
- `cron.runLog.keepLines` limite le nombre de lignes conservées dans l’historique d’exécution SQLite pour chaque tâche Cron (valeur par défaut : `2000`). `cron.runLog.maxBytes` est accepté uniquement à des fins de compatibilité avec les anciens journaux d’exécution reposant sur des fichiers.

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session `cron:<jobId>` précédente avant d’écrire la nouvelle ligne : il conserve les préférences sûres (paramètres de réflexion, de rapidité, de verbosité et de raisonnement, libellés, nom d’affichage) ainsi que les remplacements de modèle et d’authentification explicitement sélectionnés par l’utilisateur, mais supprime le contexte de conversation ambiant (routage par canal/groupe, stratégie d’envoi/de mise en file d’attente, élévation, origine, liaison à l’environnement d’exécution ACP), afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une autorité de livraison ou d’exécution obsolète provenant d’une ancienne exécution.

## Clés de session (`sessionKey`)

Une `sessionKey` détermine le compartiment de conversation dans lequel vous vous trouvez (routage + isolation). Règles canoniques : [/concepts/session](/fr/concepts/session).

| Modèle                              | Exemple                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Discussion principale/directe (par agent) | `agent:<agentId>:<mainKey>` (valeur par défaut : `main`) |
| Groupe                              | `agent:<agentId>:<channel>:group:<id>`                      |
| Salon/canal (Discord/Slack)         | `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>` |
| Cron                                | `cron:<job.id>`                                             |
| Webhook                             | `hook:<uuid>` (sauf remplacement)                           |

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (l’identité de transcription SQLite qui poursuit la conversation). La logique de décision se trouve dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4 h 00, heure locale de l’hôte du Gateway) crée un nouveau `sessionId` au prochain message reçu après la limite de réinitialisation.
- **Expiration pour inactivité** (`session.reset.idleMinutes`, ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la période d’inactivité. Si la réinitialisation quotidienne et l’expiration pour inactivité sont toutes deux configurées, la première échéance atteinte prévaut.
- **Reprise après reconnexion de l’interface de contrôle** préserve la session actuellement visible pour un envoi après reconnexion lorsque le Gateway reçoit le `sessionId` correspondant d’un client d’interface opérateur. Il s’agit d’un signal à usage unique ; les envois périmés ordinaires créent toujours un nouveau `sessionId`.
- **Événements système** (Heartbeat, réveils Cron, notifications d’exécution, tenue des registres du Gateway) peuvent modifier la ligne de session, mais ne prolongent jamais la période de validité de la réinitialisation quotidienne ou pour inactivité. Le basculement de réinitialisation supprime les notifications d’événements système en attente de la session précédente avant la création de la nouvelle invite.
- **Politique de branchement du parent** utilise la branche active d’OpenClaw lors de la création d’un fil ou d’un branchement de sous-agent. Si cette branche est trop volumineuse (au-delà d’une limite interne fixe, actuellement 100K tokens), OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. Le dimensionnement est automatique et non configurable ; l’ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.
- **Branchements opérateur** : `sessions.create { parentSessionKey, fork: true }` crée une nouvelle session dont la transcription bifurque à partir de l’état actuel du parent (avec le même mécanisme de branchement que pour la création de sous-agents, y compris la limite de taille ci-dessus). Le branchement est refusé tant que le parent possède une exécution active, hérite de la sélection de modèle du parent sauf si une autre est explicitement transmise, et marque l’enfant comme `forkedFromParent` avec de nouveaux compteurs de tokens.

## Schéma du stockage des sessions

Le stockage d’exécution conserve les valeurs `SessionEntry` dans une base SQLite par agent. Le type de valeur est `SessionEntry` dans `src/config/sessions.ts`. Champs principaux (liste non exhaustive) :

- `sessionId` : identifiant de transcription actuel utilisé pour adresser les lignes de transcription SQLite
- `sessionStartedAt` : horodatage de début du `sessionId` actuel ; la validité de la réinitialisation quotidienne l’utilise. Les anciennes lignes peuvent le déduire de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle de l’utilisateur ou du canal ; la validité de la réinitialisation pour inactivité l’utilise afin que les événements Heartbeat, Cron et d’exécution ne maintiennent pas les sessions actives. Les anciennes lignes dépourvues de ce champ utilisent à défaut l’heure de début de session récupérée.
- `updatedAt` : horodatage de la dernière modification de la ligne du stockage, utilisé pour l’affichage des listes, l’élagage et la tenue des registres ; il ne fait pas autorité pour la validité de la réinitialisation quotidienne ou pour inactivité.
- `archivedAt` : horodatage d’archivage facultatif. Les sessions archivées restent dans le stockage avec leur transcription intacte et sont exclues des listes actives normales.
- `pinnedAt` : horodatage d’épinglage facultatif. Les sessions actives épinglées sont triées avant les sessions non épinglées ; l’archivage d’une session annule son épinglage.
- Interopérabilité des fils Codex : les deux champs suivent la structure de gestion des fils Codex ; les booléens `archived`/`pinned` transmis sont toujours dérivés de l’horodatage et définis côté serveur, conformément à la sémantique de `threads.archived_at` de Codex et à la sérialisation camelCase. Les horodatages OpenClaw sont exprimés en millisecondes depuis l’époque, tandis que Codex utilise des secondes depuis l’époque ; les ponts effectuent donc la conversion à la jonction du Plugin `codex`. Codex ne dispose pas encore d’une API d’épinglage (`thread/archive`/`thread/unarchive` uniquement) ; l’état épinglé reste géré côté OpenClaw jusqu’à ce qu’une telle API existe. La structure correspondante permettra alors aux sessions liées de faire automatiquement l’aller-retour de l’état d’épinglage.
- La supervision Codex ne répertorie que les fils natifs non archivés. Un fil dont l’activité est inconnue, local au Gateway et dans l’état `idle` ou `notLoaded`, ne peut être archivé au moyen de la commande native `thread/archive` qu’après confirmation explicite par l’opérateur qu’aucun autre processus Codex ne le détient ; le Plugin effectue d’abord une nouvelle lecture de l’état local au processus, puis le fil disparaît du catalogue. Cette lecture ne permet pas de prouver qu’un autre processus App Server n’utilise pas le fil. OpenClaw refuse d’archiver les lignes actives ou en erreur, et l’archivage d’un Node appairé reste indisponible tant que le pont du Node ne peut pas prendre en charge l’intégralité du cycle de vie diffusé du fil. La désarchivation dans un client Codex natif permet au fil de réapparaître.
- `lastReadAt` / `markedUnreadAt` : horodatages de l’état de lecture définis côté serveur par `sessions.patch { unread }` ; `unread: false` enregistre une lecture (définit `lastReadAt`, efface `markedUnreadAt`) ; `unread: true` marque la session comme non lue jusqu’à la prochaine lecture. Les lignes de session exposent un booléen `unread` dérivé : explicitement marquées comme non lues, ou lues avant la dernière activité. Les sessions qui n’ont jamais été marquées comme lues conservent `unread: false`, afin que les installations existantes n’affichent pas soudainement d’indicateurs lors de la mise à niveau.
- `lastActivityAt` : horodatage de la dernière exécution d’agent terminée qui constitue une activité devant être signalée comme non lue (exécutions utilisateur, de canal et Cron). Les tours Heartbeat et d’événements internes, ainsi que les modifications de métadonnées, ne le mettent pas à jour ; `updatedAt` ne constitue pas un signal d’activité.
- `sessionFile` : ancien marqueur conservé pour la compatibilité de migration et d’archivage ; l’exécution active utilise l’identité SQLite
- `chatType` : `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées d’étiquetage du groupe ou du canal
- Options : `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (remplacement propre à la session)
- Sélection du modèle : `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (au mieux, selon le fournisseur) : `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de Compactions automatiques terminées pour cette clé de session
- `memoryFlushAt` / `memoryFlushCompactionCount` : horodatage et nombre de Compactions lors de la dernière vidange de mémoire précédant une Compaction

Le Gateway fait autorité : il peut réécrire ou réhydrater les entrées à mesure que les sessions
s’exécutent. Pour les anciennes installations utilisant des fichiers, effectuez la migration avec
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` au lieu de
modifier `sessions.json` en vous attendant à ce que l’exécution continue de lire ce fichier.

## Structure des événements de transcription

Les transcriptions sont gérées par l’accesseur de session OpenClaw et exposées au code d’exécution au moyen d’assistants fondés sur l’identité. Le flux d’événements est en ajout seul :

- Première entrée : en-tête de session — `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` facultatif.
- Ensuite : entrées avec `id` + `parentId` (structure arborescente).

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : message injecté par une extension qui _entre bien_ dans le contexte du modèle (affiché dans la TUI lorsque `display: true`, entièrement masqué lorsque `display: false`)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle (pour conserver l’état de l’extension entre les rechargements)
- `compaction` : résumé de Compaction conservé avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé conservé lors de la navigation dans une branche de l’arborescence

OpenClaw ne « corrige » volontairement pas les transcriptions ; le Gateway utilise `SessionManager` pour les lire et les écrire.

## Fenêtres de contexte et tokens suivis

Deux concepts distincts :

1. **Fenêtre de contexte du modèle** : limite stricte propre à chaque modèle (tokens visibles par le modèle). Elle provient du catalogue des modèles et peut être remplacée par la configuration.
2. **Compteurs du stockage de session** : statistiques cumulées écrites dans la ligne de session (utilisées pour `/status` et les tableaux de bord). `contextTokens` est une estimation ou une valeur de rapport à l’exécution ; ne la considérez pas comme une garantie stricte.

Pour en savoir plus sur les limites : [/reference/token-use](/fr/reference/token-use).

## Compaction : définition

La Compaction résume les conversations plus anciennes dans une entrée `compaction` conservée dans la transcription et maintient les messages récents intacts. Après une Compaction, les tours suivants voient le résumé de Compaction ainsi que les messages postérieurs à `firstKeptEntryId`. La Compaction est **persistante**, contrairement à l’élagage de session ; consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

La réinjection des sections d’AGENTS.md après une Compaction est facultative via `agents.defaults.compaction.postCompactionSections` ; lorsque cette option n’est pas définie ou vaut `[]`, OpenClaw n’ajoute pas d’extraits d’AGENTS.md au-dessus du résumé de Compaction.

### Limites des segments et association des outils

Lors du découpage d’une longue transcription en segments de Compaction, OpenClaw maintient les appels d’outils de l’assistant associés aux entrées `toolResult` correspondantes :

- Si le découpage fondé sur la part de tokens devait se situer entre un appel d’outil et son résultat, OpenClaw déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer la paire.
- Si un bloc final de résultats d’outils devait faire dépasser la taille cible au segment, OpenClaw préserve ce bloc d’outils en attente et maintient intacte la fin non résumée.
- Les blocs d’appels d’outils abandonnés ou en erreur ne maintiennent pas un découpage en attente ouvert.

## Déclenchement de la Compaction automatique

Deux déclencheurs dans l’agent OpenClaw intégré :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement du contexte (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` et autres variantes propres aux fournisseurs) ; effectuez une Compaction, puis réessayez. Lorsque le fournisseur indique le nombre de tokens de la tentative, OpenClaw transmet ce nombre observé à la Compaction de récupération après dépassement ; si le fournisseur confirme le dépassement sans exposer de nombre analysable, OpenClaw transmet aux moteurs de Compaction et aux diagnostics un nombre synthétique dépassant minimalement le budget. Si la récupération après dépassement échoue encore, OpenClaw affiche des instructions explicites et préserve l’association de la session actuelle au lieu de basculer silencieusement vers un nouvel identifiant de session ; réessayez d’envoyer le message, exécutez `/compact` ou exécutez `/new`.
2. **Maintenance selon un seuil** : après un tour réussi, lorsque `contextTokens > contextWindow - reserveTokens`, où `contextWindow` est la fenêtre de contexte du modèle et `reserveTokens` la marge réservée aux invites ainsi qu’à la prochaine sortie du modèle.

Deux protections supplémentaires s’exécutent en dehors de ces deux déclencheurs :

- **Compaction locale préalable** : définissez `agents.defaults.compaction.maxActiveTranscriptBytes` (en octets ou avec une chaîne comme `"20mb"`) pour déclencher une Compaction locale avant l’ouverture de l’exécution suivante dès que la transcription active atteint cette taille. Il s’agit d’une protection de taille destinée au coût de réouverture locale, et non d’un archivage brut ; la Compaction sémantique normale s’exécute toujours et nécessite `truncateAfterCompaction` afin que le résumé compacté devienne une nouvelle transcription successeure.
- **Précontrôle en cours de tour** : définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valeur par défaut : `false`) pour ajouter une protection à la boucle d’outils. Après l’ajout d’un résultat d’outil et avant l’appel suivant au modèle, OpenClaw estime la pression sur l’invite à l’aide de la même logique de budget préalable que celle utilisée au début du tour. Si le contexte ne tient plus, la protection n’effectue pas de Compaction en ligne ; elle émet un signal structuré de précontrôle en cours de tour, arrête la soumission de l’invite actuelle et laisse la boucle d’exécution externe utiliser le chemin de récupération existant (tronquer les résultats d’outils trop volumineux lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer). Fonctionne avec les modes de Compaction `default` et `safeguard`, y compris la Compaction de protection assurée par le fournisseur. Indépendamment de `maxActiveTranscriptBytes` : la protection fondée sur la taille en octets s’exécute avant l’ouverture d’un tour, tandis que le précontrôle en cours de tour s’exécute plus tard, après l’ajout de nouveaux résultats d’outils.

## Paramètres de Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw applique également un seuil de sécurité minimal pour les exécutions intégrées : si `compaction.reserveTokens` est inférieur à `reserveTokensFloor` (`20000` par défaut), OpenClaw l’augmente. Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver ce seuil. Lorsque la fenêtre de contexte du modèle actif est connue, le seuil et la réserve effective finale sont plafonnés afin que la réserve ne puisse pas consommer l’intégralité du budget de prompt. Cela empêche les modèles à petit contexte (par exemple, un modèle local de 16K tokens) de déclencher la Compaction dès le premier token ; sans fenêtre de contexte connue, les budgets de réserve configuré et actuel restent non plafonnés. Pourquoi imposer un seuil : conserver une marge suffisante pour les opérations de maintenance sur plusieurs tours (comme l’enregistrement de la mémoire décrit ci-dessous) avant que la Compaction ne devienne inévitable. Implémentation : `applyAgentCompactionSettingsFromConfig()` dans `src/agents/agent-settings.ts`, appelée depuis les chemins de configuration des tours de l’exécuteur intégré et de la Compaction.

La commande manuelle `/compact` respecte une valeur `agents.defaults.compaction.keepRecentTokens` explicite et conserve le point de découpe de la fin récente défini par l’environnement d’exécution. Sans budget de conservation explicite, la Compaction manuelle constitue un point de contrôle strict et le contexte reconstruit commence à partir du nouveau résumé.

Lorsque `truncateAfterCompaction` est activé, OpenClaw fait pivoter la transcription active vers une transcription successeur compactée après la Compaction. Les actions de branchement et de restauration d’un point de contrôle utilisent cette transcription successeur compactée ; les anciens fichiers de point de contrôle antérieurs à la Compaction restent lisibles tant qu’ils sont référencés.

## Fournisseurs de Compaction interchangeables

Les Plugins enregistrent un fournisseur de Compaction via `registerCompactionProvider()` dans l’API du Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un fournisseur enregistré, l’extension de protection délègue la synthèse à ce fournisseur au lieu d’utiliser le pipeline intégré `summarizeInStages`.

- `provider` : identifiant d’un Plugin fournisseur de Compaction enregistré. Laissez-le non défini pour utiliser la synthèse par LLM par défaut. Définir un `provider` impose `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et la protection conserve toujours le contexte du suffixe des tours récents et des tours fractionnés après la sortie du fournisseur.
- La synthèse de protection intégrée condense de nouveau les résumés précédents avec les nouveaux messages au lieu de conserver textuellement l’intégralité du résumé précédent.
- Le mode de protection active par défaut les audits de qualité des résumés ; définissez `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse intégrée par LLM. Les signaux d’abandon ou d’expiration explicitement déclenchés par l’appelant sont relancés, et non ignorés, afin que l’annulation soit toujours respectée.

Source : `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Surfaces visibles par l’utilisateur

- `/status` dans n’importe quelle session de discussion
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Journaux du Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`) : `embedded run auto-compaction start` + `complete`
- Mode détaillé : `🧹 Auto-compaction complete` accompagné du nombre de Compactions

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan dont l’utilisateur ne doit pas voir les sorties intermédiaires.

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` / `no_reply` pour signifier « ne pas transmettre de réponse à l’utilisateur ». OpenClaw le retire ou le masque dans la couche de livraison.
- Le masquage du token silencieux exact est insensible à la casse : `NO_REPLY` et `no_reply` sont tous deux reconnus lorsque la charge utile entière se limite au token silencieux.
- Depuis `2026.1.10`, OpenClaw masque également la diffusion en continu des brouillons et de l’indicateur de saisie lorsqu’un fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent aucune sortie partielle en cours de tour.
- Ce mécanisme est réservé aux véritables tours en arrière-plan sans livraison ; il ne constitue pas un raccourci pour les demandes utilisateur ordinaires nécessitant une action.

## Enregistrement de la mémoire avant la Compaction

Avant la Compaction automatique, OpenClaw peut exécuter un tour agentique silencieux qui écrit un état durable sur le disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent), afin que la Compaction ne puisse pas effacer un contexte critique. Il surveille l’utilisation du contexte de la session et, lorsqu’elle dépasse un seuil souple situé sous le seuil de Compaction, il envoie une directive silencieuse « écrire la mémoire maintenant » à l’aide du token silencieux exact `NO_REPLY` / `no_reply`, de sorte que l’utilisateur ne voie rien.

Configuration (`agents.defaults.compaction.memoryFlush`), référence complète sur [/gateway/config-agents](/fr/gateway/config-agents#agentsdefaultscompaction) :

| Clé                         | Valeur par défaut | Remarques                                                                                                                                                                              |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`            |                                                                                                                                                                                        |
| `model`                     | non défini        | remplacement exact du fournisseur/modèle pour le seul tour d’enregistrement, par exemple `ollama/qwen3:8b`                                                                             |
| `softThresholdTokens`       | `4000`            | écart sous le seuil de Compaction qui déclenche un enregistrement                                                                                                                      |
| `forceFlushTranscriptBytes` | non défini (désactivé) | force un enregistrement lorsque le fichier de transcription atteint cette taille en octets (ou une chaîne comme `"2mb"`), même si les compteurs de tokens sont obsolètes ; `0` désactive |
| `prompt`                    | intégré           | message utilisateur pour le tour d’enregistrement                                                                                                                                      |
| `systemPrompt`              | intégré           | prompt système supplémentaire ajouté au tour d’enregistrement                                                                                                                         |

Remarques :

- Le prompt et le prompt système par défaut incluent une indication `NO_REPLY` afin de supprimer la livraison.
- Lorsque `model` est défini, le tour d’enregistrement utilise ce modèle sans hériter de la chaîne de repli de la session active, afin qu’une opération de maintenance exclusivement locale ne bascule pas silencieusement vers un modèle de conversation payant en cas d’échec.
- L’enregistrement s’exécute une fois par cycle de Compaction (suivi dans la ligne de la session).
- L’enregistrement s’exécute uniquement pour les sessions OpenClaw intégrées ; les backends CLI et les tours Heartbeat l’ignorent.
- L’enregistrement est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour connaître l’organisation des fichiers de l’espace de travail et les modèles d’écriture.

OpenClaw expose un hook `session_before_compact` dans l’API d’extension, mais la logique d’enregistrement ci-dessus se trouve du côté du Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), et non dans ce hook.

## Liste de contrôle de dépannage

- **Clé de session incorrecte ?** Commencez par [/concepts/session](/fr/concepts/session) et confirmez la valeur `sessionKey` dans `/status`.
- **Incohérence entre le stockage et la transcription ?** Confirmez l’hôte du Gateway et le chemin du stockage indiqués par `openclaw status`.
- **Compactions répétitives ?** Vérifiez la fenêtre de contexte du modèle (une fenêtre trop petite impose des Compactions fréquentes), `reserveTokens` (une valeur trop élevée pour la fenêtre du modèle déclenche une Compaction plus tôt) et le volume excessif des résultats d’outils (ajustez l’élagage de la session).
- **Chaque prompt semble dépasser la capacité d’un petit modèle local ?** Confirmez que le fournisseur indique la bonne fenêtre de contexte du modèle. OpenClaw ne peut plafonner la réserve effective que lorsque cette fenêtre est connue.
- **Fuite des tours silencieux ?** Confirmez que la réponse commence par le token silencieux exact `NO_REPLY` (insensible à la casse) et que vous utilisez une version incluant le correctif de masquage de la diffusion en continu (`2026.1.10`+).

## Pages connexes

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
- [Référence de la configuration des agents](/fr/gateway/config-agents)
