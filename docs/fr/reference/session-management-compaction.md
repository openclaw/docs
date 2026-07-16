---
read_when:
    - Vous devez déboguer les identifiants de session, les événements de transcription ou les champs des lignes de session
    - Vous modifiez le comportement de la Compaction automatique ou ajoutez des opérations de maintenance « pré-Compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions et transcriptions, cycle de vie et fonctionnement interne de la Compaction (automatique)'
title: Présentation détaillée de la gestion des sessions
x-i18n:
    generated_at: "2026-07-16T13:46:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un seul **processus Gateway** gère l’état des sessions de bout en bout. Les interfaces utilisateur (application macOS, interface Web Control UI, TUI) interrogent le Gateway pour obtenir les listes de sessions et le nombre de jetons. En mode distant, les fichiers de session résident sur l’hôte distant ; consulter les fichiers de votre Mac local ne reflète donc pas ce que le Gateway utilise.

Commencez par la documentation générale : [Gestion des sessions](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Présentation de la mémoire](/fr/concepts/memory), [Recherche dans la mémoire](/fr/concepts/memory-search), [Élagage des sessions](/fr/concepts/session-pruning), [Hygiène des transcriptions](/fr/reference/transcript-hygiene), et la référence complète de configuration dans [Configuration de l’agent](/fr/gateway/config-agents).

## Deux couches de persistance

1. **Lignes de session (SQLite par agent)** - table clé/valeur `sessionKey -> SessionEntry`. État d’exécution mutable géré par le Gateway. Suit les métadonnées : identifiant de session actuel, dernière activité, options, compteurs de jetons.
2. **Événements de transcription (SQLite par agent)** - structure arborescente en ajout uniquement (les entrées comportent `id` + `parentId`). Stocke la conversation, les appels d’outils et les résumés de compaction ; reconstruit le contexte du modèle pour les tours suivants. Les points de contrôle de compaction sont des métadonnées associées à la transcription successeur compactée : une nouvelle compaction n’écrit pas une seconde copie de `.checkpoint.*.jsonl`.

Les anciennes installations peuvent encore comporter des fichiers `sessions.json` dans le répertoire `sessions/` de l’agent. Considérez ces fichiers comme des entrées héritées de migration des lignes de session ou comme des cibles explicites de maintenance hors ligne. Le démarrage du Gateway et `openclaw doctor --fix` importent automatiquement les lignes héritées actives et l’historique des transcriptions dans le magasin SQLite par agent. Exécutez `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, puis suivez la [séquence de migration de Doctor](/fr/cli/doctor#session-sqlite-migration) lorsqu’une inspection explicite ou des preuves de validation sont nécessaires. Si une migration échoue après l’archivage d’artefacts de transcription hérités, utilisez le mode de récupération de Doctor indiqué dans cette séquence. La récupération utilise les manifestes de migration, restaure uniquement les artefacts de support archivés concernés, prépare sur demande un rapport de problème GitHub assaini et ne réactive pas la lecture des fichiers JSONL par l’environnement d’exécution actif.

Les lecteurs d’historique du Gateway évitent de matérialiser toute la transcription, sauf si la surface nécessite un accès historique arbitraire. La première page de l’historique, l’historique de discussion intégré, la récupération après redémarrage et les vérifications de jetons ou d’utilisation reposent sur des lectures bornées de la fin des données SQLite. Les analyses complètes des transcriptions passent par l’index asynchrone des transcriptions et sont partagées entre les lecteurs simultanés.

## Emplacements sur disque

Pour chaque agent, sur l’hôte du Gateway (résolus via `src/config/sessions.ts`) :

- Magasin des lignes de session d’exécution : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Lignes de transcription d’exécution : `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefacts de transcription hérités ou archivés : `~/.openclaw/agents/<agentId>/sessions/`
- Entrée de migration des lignes héritées : `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Maintenance du magasin et contrôle de l’espace disque

`session.maintenance` contrôle la maintenance automatique des lignes de session SQLite, des lignes de transcription SQLite, des artefacts archivés et des fichiers annexes de trajectoire :

| Clé                     | Valeur par défaut               | Remarques                                                                                       |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | ou `"warn"` (rapport uniquement, aucune modification)                                                      |
| `pruneAfter`            | `"30d"`               | seuil d’âge des entrées obsolètes                                                                      |
| `maxEntries`            | `500`                 | limite du nombre d’entrées de session                                                                      |
| `resetArchiveRetention` | conserver (aucun seuil d’âge)  | seuil d’âge des archives de transcription `*.reset.*`/`*.deleted.*` ; une durée active leur suppression |
| `maxDiskBytes`          | `2gb`                 | budget disque des sessions par agent ; `false` le désactive                                            |
| `highWaterBytes`        | 80 % de `maxDiskBytes` | cible après le nettoyage lié au budget                                                                 |

Les transcriptions archivées sont conservées par défaut et compressées avec zstd (`*.jsonl.<reason>.<timestamp>.zst`) lorsque l’environnement d’exécution le prend en charge ; la suppression ou la réinitialisation d’une session n’efface donc jamais silencieusement l’historique des conversations. Le budget disque évince d’abord les archives les plus anciennes avant de toucher aux sessions actives.

L’application active de `maxDiskBytes` dans SQLite mesure, pour chaque session, les octets du JSON des lignes de session et du JSON des événements de transcription ; l’application héritée en maintenance hors ligne mesure les fichiers du répertoire de sessions sélectionné.

Les sessions de test des exécutions de modèle du Gateway (clés correspondant à `agent:*:explicit:model-run-<uuid>`) disposent d’une durée de conservation fixe et distincte de `24h`. Cet élagage dépend de la pression : il s’exécute uniquement lorsque la maintenance ou la limite des entrées de session est atteinte, et seulement avant l’étape globale de nettoyage ou de limitation des entrées obsolètes. Les autres sessions explicites n’utilisent pas cette durée de conservation.

Ordre d’application du nettoyage lié au budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts de transcription archivés les plus anciens, les artefacts hérités orphelins ou les artefacts de trajectoire orphelins.
2. Si l’utilisation reste supérieure à la cible, évincer les entrées de session les plus anciennes ainsi que leurs lignes de transcription ou leurs artefacts de trajectoire.
3. Répéter jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

`mode: "warn"` signale les évictions potentielles sans modifier le magasin ni les fichiers.

Exécutez la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

La maintenance conserve les pointeurs durables vers des conversations externes, tels que les sessions de groupe et les sessions de discussion associées à un fil, mais les entrées d’exécution synthétiques (cron, hooks, heartbeat, ACP, sous-agents) peuvent néanmoins être supprimées lorsqu’elles dépassent l’âge, le nombre ou le budget disque configuré. Les exécutions Cron isolées utilisent un contrôle `cron.sessionRetention` distinct, indépendant de la conservation des sessions de test des exécutions de modèle.

Les écritures normales du Gateway passent par l’accesseur de session, qui sérialise les mutations SQLite par agent via le chemin d’écriture de l’environnement d’exécution. Le code d’exécution doit privilégier les fonctions d’assistance de l’accesseur dans `src/config/sessions/session-accessor.ts` ; les fonctions d’assistance héritées de `sessions.json` sont des outils de migration et de maintenance hors ligne. Lorsqu’un Gateway est accessible, les commandes `openclaw sessions cleanup` et `openclaw agents delete` exécutées sans simulation délèguent les mutations du magasin au Gateway afin que le nettoyage rejoigne la même file d’écriture ; `--store <path>` constitue le chemin explicite de réparation hors ligne d’un magasin hérité sélectionné et reste toujours local (tout comme `--dry-run`). Le nettoyage `maxEntries` s’effectue par lots pour les magasins de taille adaptée à la production ; un magasin peut donc dépasser brièvement la limite configurée avant que le prochain nettoyage au seuil supérieur ne le ramène sous cette limite. Les lectures n’élaguent ni ne limitent jamais les entrées au démarrage du Gateway : seules les écritures ou `openclaw sessions cleanup --enforce` le font ; ce dernier applique également la limite immédiatement et élague les anciens artefacts hérités non référencés de transcription, de point de contrôle et de trajectoire, même lorsqu’aucun budget disque n’est configuré.

OpenClaw ne crée plus automatiquement de sauvegardes par rotation `sessions.json.bak.*` lors des écritures du Gateway. Le schéma actuel rejette la clé héritée `session.maintenance.rotateBytes`, et `openclaw doctor --fix` la supprime des anciennes configurations.

Les mutations de transcription utilisent la file d’écriture de session pour la cible de transcription SQLite :

| Paramètre                              | Valeur par défaut   | Remplacement par variable d’environnement                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` définit la durée pendant laquelle l’attente d’un verrou signale une erreur de session occupée avant d’abandonner ; augmentez-la uniquement lorsque des opérations légitimes de préparation, de nettoyage, de compaction ou de mise en miroir des transcriptions se disputent le verrou plus longtemps sur les machines lentes. `staleMs` définit le délai au-delà duquel un verrou existant peut être récupéré comme obsolète. `maxHoldMs` définit le seuil de libération du mécanisme de surveillance au sein du processus.

### Rétrogradation après la migration vers SQLite

Restaurez les artefacts de transcription hérités archivés avant d’exécuter une ancienne version d’OpenClaw reposant sur des fichiers :

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migration laisse en place les fichiers hérités `sessions.json` à des fins d’assistance et de restauration, mais les fichiers JSONL de transcription actifs importés dans SQLite sont renommés dans `session-sqlite-import-archive/`. Les anciens environnements d’exécution reposant sur des fichiers suivent les chemins `sessionFile` dans `sessions.json` ; ces artefacts doivent donc être restaurés avant le démarrage. La restauration utilise les manifestes de migration, déplace uniquement les artefacts archivés enregistrés dont les chemins d’origine sont absents et laisse la base de données SQLite en place pour une récupération ultérieure.

Les sessions créées après la migration vers SQLite existent uniquement dans SQLite et ne seront pas visibles par un ancien environnement d’exécution reposant sur des fichiers. En cas de nouvelle mise à niveau après une rétrogradation, exécutez de nouveau la séquence d’inspection et de validation de Doctor afin qu’OpenClaw puisse vérifier les artefacts hérités restaurés avant de les importer.

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent leurs propres entrées de session et transcriptions avec une durée de conservation dédiée :

- `cron.sessionRetention` (valeur par défaut : `"24h"`) élague du magasin les anciennes sessions d’exécution Cron isolées ; `false` désactive cet élagage.
- L’historique des exécutions conserve les 2000 lignes terminales les plus récentes pour chaque tâche Cron. Les lignes perdues conservent leur fenêtre de nettoyage de 24 heures.

Lorsque Cron force la création d’une nouvelle session d’exécution isolée, il assainit l’entrée de session `cron:<jobId>` précédente avant d’écrire la nouvelle ligne : il conserve les préférences sûres (paramètres de réflexion, de rapidité, de verbosité et de raisonnement, libellés, nom d’affichage) ainsi que les remplacements de modèle et d’authentification explicitement sélectionnés par l’utilisateur, mais supprime le contexte ambiant de la conversation (routage de canal ou de groupe, politique d’envoi ou de mise en file, élévation, origine, liaison à l’environnement d’exécution ACP), afin qu’une nouvelle exécution isolée ne puisse pas hériter d’une autorité de livraison ou d’exécution obsolète provenant d’une exécution antérieure.

## Clés de session (`sessionKey`)

Une `sessionKey` identifie le compartiment de conversation dans lequel vous vous trouvez (routage + isolation). Règles canoniques : [/concepts/session](/fr/concepts/session).

| Modèle                      | Exemple                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Discussion principale/directe (par agent) | `agent:<agentId>:<mainKey>` (valeur par défaut : `main`)                |
| Groupe                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Salon/canal (Discord/Slack) | `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (sauf remplacement)                           |

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` actuel (l’identité de transcription SQLite qui poursuit la conversation). La logique de décision se trouve dans `initSessionState()`, dans `src/auto-reply/reply/session.ts`.

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour ce `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4:00 AM, heure locale de l’hôte du Gateway) crée un nouveau `sessionId` au premier message suivant la limite de réinitialisation.
- **Expiration pour inactivité** (`session.reset.idleMinutes`, ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la période d’inactivité. Si les réinitialisations quotidienne et pour inactivité sont toutes deux configurées, la première à expirer prévaut.
- **Reprise après reconnexion de l’interface de contrôle** conserve la session actuellement visible pour un envoi après reconnexion lorsque le Gateway reçoit le `sessionId` correspondant d’un client d’interface opérateur. Ce signal est à usage unique ; les envois ordinaires obsolètes créent toujours un nouveau `sessionId`.
- **Événements système** (Heartbeat, réveils Cron, notifications d’exécution, tenue des registres du Gateway) peuvent modifier la ligne de session, mais ne prolongent jamais la validité de la réinitialisation quotidienne ou pour inactivité. Le basculement de réinitialisation supprime les notifications d’événements système en attente pour la session précédente avant la création du nouveau prompt.
- **Politique de bifurcation parente** utilise la branche active d’OpenClaw lors de la création d’un fil ou d’une bifurcation de sous-agent. Si cette branche est trop volumineuse (au-delà d’une limite interne fixe, actuellement 100K tokens), OpenClaw démarre l’enfant avec un contexte isolé au lieu d’échouer ou d’hériter d’un historique inutilisable. Le dimensionnement est automatique et non configurable ; l’ancienne configuration `session.parentForkMaxTokens` est supprimée par `openclaw doctor --fix`.
- **Bifurcations de l’opérateur** : `sessions.create { parentSessionKey, fork: true }` crée une nouvelle session dont la transcription bifurque depuis l’état actuel du parent (même mécanisme de bifurcation que pour la création de sous-agents, y compris la limite de taille ci-dessus). La bifurcation est refusée tant que le parent possède une exécution active, hérite de la sélection de modèle du parent sauf si une autre est transmise explicitement, et marque l’enfant `forkedFromParent` avec de nouveaux compteurs de tokens.

## Schéma du stockage des sessions

Le stockage d’exécution conserve les valeurs `SessionEntry` dans une base SQLite propre à chaque agent. Le type de valeur est `SessionEntry` dans `src/config/sessions.ts`. Champs principaux (liste non exhaustive) :

- `sessionId` : identifiant de transcription actuel utilisé pour adresser les lignes de transcription SQLite
- `sessionStartedAt` : horodatage de début du `sessionId` actuel ; la validité de la réinitialisation quotidienne l’utilise. Les anciennes lignes peuvent le déduire de l’en-tête de session JSONL.
- `lastInteractionAt` : horodatage de la dernière interaction réelle avec l’utilisateur ou le canal ; la validité de la réinitialisation pour inactivité l’utilise afin que les événements de Heartbeat, Cron et d’exécution ne maintiennent pas les sessions actives. Pour les anciennes lignes sans ce champ, l’heure de début de session récupérée est utilisée.
- `updatedAt` : horodatage de la dernière modification de la ligne de stockage, utilisé pour l’affichage des listes, l’élagage et la tenue des registres, mais ne faisant pas autorité pour la validité quotidienne ou liée à l’inactivité.
- `archivedAt` : horodatage d’archivage facultatif. Les sessions archivées restent dans le stockage avec leur transcription intacte et sont exclues des listes actives normales.
- `pinnedAt` : horodatage d’épinglage facultatif. Les sessions actives épinglées sont triées avant les sessions non épinglées ; l’archivage d’une session supprime son épinglage.
- Interopérabilité des fils Codex : les deux champs suivent la structure de gestion des fils de Codex ; les booléens `archived`/`pinned` transmis sont toujours dérivés de l’horodatage et définis côté serveur, conformément à la sémantique `threads.archived_at` de Codex et à la sérialisation en camelCase. Les horodatages d’OpenClaw sont exprimés en millisecondes depuis l’époque, tandis que Codex utilise des secondes depuis l’époque ; les ponts effectuent donc la conversion à la jonction du plugin `codex`. Codex ne dispose pas encore d’API d’épinglage (`thread/archive`/`thread/unarchive` uniquement) ; l’état épinglé reste côté OpenClaw jusqu’à ce qu’une telle API existe. La structure correspondante permettra alors aux sessions liées d’effectuer mécaniquement un aller-retour de l’état d’épinglage.
- La supervision Codex ne répertorie que les fils natifs non archivés. Un fil local au Gateway avec une activité `idle` ou `notLoaded` inconnue ne peut être archivé via le mécanisme natif `thread/archive` qu’après confirmation explicite par l’opérateur qu’aucun autre processus Codex ne le possède ; le plugin effectue d’abord une nouvelle lecture de l’état local au processus, puis le fil disparaît du catalogue. Cette lecture ne permet pas de prouver qu’un autre processus App Server n’utilise pas le fil. OpenClaw refuse d’archiver les lignes actives et en erreur, et l’archivage de Node appairé reste indisponible tant que le pont du Node ne peut pas prendre en charge l’intégralité du cycle de vie diffusé du fil. La désarchivation dans un client Codex natif rend le fil à nouveau susceptible d’apparaître.
- `lastReadAt` / `markedUnreadAt` : horodatages de l’état de lecture définis côté serveur par `sessions.patch { unread }` ; `unread: false` enregistre une lecture (définit `lastReadAt`, efface `markedUnreadAt`) ; `unread: true` marque la session comme non lue jusqu’à la prochaine lecture. Les lignes de session exposent un booléen `unread` dérivé : explicitement marquée comme non lue, ou lue avant la dernière activité. Les sessions qui n’ont jamais été marquées comme lues restent `unread: false`, afin que les installations existantes ne signalent pas toutes les sessions lors d’une mise à niveau.
- `lastActivityAt` : horodatage de la dernière exécution d’agent terminée considérée comme une activité digne d’être signalée comme non lue (exécutions utilisateur, de canal et Cron). Les tours de Heartbeat et d’événements internes, ainsi que les correctifs de métadonnées, ne le mettent pas à jour ; `updatedAt` n’est pas un signal d’activité.
- `sessionFile` : marqueur hérité conservé pour la compatibilité des migrations et des archives ; l’exécution active utilise l’identité SQLite
- `chatType` : `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées de libellé du groupe ou du canal
- Options : `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (remplacement propre à la session)
- Sélection du modèle : `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (au mieux, selon le fournisseur) : `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre d’exécutions terminées de la Compaction automatique pour cette clé de session
- `memoryFlushAt` / `memoryFlushCompactionCount` : horodatage et nombre de Compactions du dernier vidage de mémoire précédant une Compaction

Le Gateway fait autorité : il peut réécrire ou réhydrater les entrées pendant
l’exécution des sessions. Pour les anciennes installations reposant sur des fichiers, effectuez la migration avec
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` au lieu de
modifier `sessions.json` en supposant que l’exécution continuera à lire ce fichier.

## Structure des événements de transcription

Les transcriptions sont gérées par l’accesseur de session OpenClaw et exposées au code d’exécution par des fonctions d’assistance fondées sur l’identité. Le flux d’événements est uniquement extensible par ajout :

- Première entrée : en-tête de session — `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` facultatif.
- Ensuite : entrées avec `id` + `parentId` (structure arborescente).

Types d’entrées notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : message injecté par une extension qui _entre_ dans le contexte du modèle (affiché dans la TUI lorsque `display: true`, entièrement masqué lorsque `display: false`)
- `custom` : état d’extension qui _n’entre pas_ dans le contexte du modèle (pour conserver l’état de l’extension entre les rechargements)
- `compaction` : résumé de Compaction persistant avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persistant lors de la navigation dans une branche de l’arborescence

OpenClaw ne « corrige » volontairement pas les transcriptions ; le Gateway utilise `SessionManager` pour les lire et les écrire.

## Fenêtres de contexte et tokens suivis

Deux concepts différents :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (tokens visibles par le modèle). Elle provient du catalogue de modèles et peut être remplacée via la configuration.
2. **Compteurs du stockage de session** : statistiques cumulatives écrites dans la ligne de session (utilisées pour `/status` et les tableaux de bord). `contextTokens` est une valeur d’estimation et de rapport à l’exécution ; ne la considérez pas comme une garantie stricte.

Pour en savoir plus sur les limites : [/reference/token-use](/fr/reference/token-use).

## Compaction : définition

La Compaction résume l’ancienne partie de la conversation dans une entrée `compaction` persistante de la transcription et conserve intacts les messages récents. Après la Compaction, les tours suivants voient le résumé de Compaction ainsi que les messages postérieurs à `firstKeptEntryId`. La Compaction est **persistante**, contrairement à l’élagage des sessions — consultez [/concepts/session-pruning](/fr/concepts/session-pruning).

La réinjection des sections d’AGENTS.md après la Compaction est facultative via `agents.defaults.compaction.postCompactionSections` ; lorsque cette option n’est pas définie ou vaut `[]`, OpenClaw n’ajoute pas d’extraits d’AGENTS.md au-dessus du résumé de Compaction.

### Limites des segments et appairage des outils

Lors de la division d’une longue transcription en segments de Compaction, OpenClaw conserve les appels d’outil de l’assistant avec les entrées `toolResult` correspondantes :

- Si la division selon la proportion de tokens devait se produire entre un appel d’outil et son résultat, OpenClaw déplace la limite vers le message d’appel d’outil de l’assistant plutôt que de séparer la paire.
- Si un bloc final de résultats d’outil devait faire dépasser la taille cible au segment, OpenClaw conserve ce bloc d’outil en attente et maintient intacte la fin non résumée.
- Les blocs d’appels d’outil abandonnés ou en erreur ne maintiennent pas ouverte une division en attente.

## Déclenchement de la Compaction automatique

Deux déclencheurs dans l’agent OpenClaw intégré :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement du contexte (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` et autres variantes propres aux fournisseurs) — effectuer une Compaction, puis réessayer. Lorsque le fournisseur indique le nombre de tokens de la tentative, OpenClaw transmet ce nombre observé à la Compaction de récupération après dépassement ; si le fournisseur confirme le dépassement sans exposer de nombre analysable, OpenClaw transmet aux moteurs de Compaction et aux diagnostics un nombre synthétique dépassant minimalement le budget. Si la récupération après dépassement échoue encore, OpenClaw affiche des instructions explicites et conserve l’association de la session actuelle au lieu de passer silencieusement à un nouvel identifiant de session — réessayez le message, exécutez `/compact` ou exécutez `/new`.
2. **Maintenance selon le seuil** : après un tour réussi, lorsque `contextTokens > contextWindow - reserveTokens`, où `contextWindow` est la fenêtre de contexte du modèle et `reserveTokens` la marge réservée aux prompts et à la prochaine sortie du modèle.

Deux protections supplémentaires s’exécutent en dehors de ces deux déclencheurs :

- **Compaction locale préalable** : définissez `agents.defaults.compaction.maxActiveTranscriptBytes` (en octets ou sous forme de chaîne telle que `"20mb"`) pour déclencher une Compaction locale avant l’ouverture de la prochaine exécution lorsque la transcription active atteint cette taille. Il s’agit d’une protection de taille pour le coût de réouverture locale, et non d’un simple archivage : la Compaction sémantique normale est tout de même exécutée et nécessite `truncateAfterCompaction` afin que le résumé compacté devienne une nouvelle transcription successeure.
- **Vérification préalable en cours de tour** : définissez `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valeur par défaut : `false`) pour ajouter une protection à la boucle d’outils. Après l’ajout d’un résultat d’outil et avant l’appel de modèle suivant, OpenClaw estime la pression exercée sur le prompt à l’aide de la même logique de budget préalable qu’au début du tour. Si le contexte ne tient plus, la protection n’effectue pas de Compaction en ligne : elle émet un signal structuré de vérification préalable en cours de tour, arrête l’envoi du prompt actuel et laisse la boucle d’exécution externe utiliser le mécanisme de récupération existant (tronquer les résultats d’outil trop volumineux lorsque cela suffit, ou déclencher le mode de Compaction configuré et réessayer). Fonctionne avec les modes de Compaction `default` et `safeguard`, y compris la Compaction de protection assurée par le fournisseur. Indépendamment de `maxActiveTranscriptBytes` : la protection fondée sur la taille en octets s’exécute avant l’ouverture d’un tour, tandis que la vérification préalable en cours de tour s’exécute plus tard, après l’ajout de nouveaux résultats d’outil.

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

OpenClaw applique également un seuil de sécurité minimal pour les exécutions intégrées : si `compaction.reserveTokens` est inférieur à `reserveTokensFloor` (valeur par défaut : `20000`), OpenClaw le relève. Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver ce seuil. Lorsque la fenêtre de contexte du modèle actif est connue, le seuil et la réserve effective finale sont tous deux plafonnés afin que la réserve ne puisse pas consommer l’intégralité du budget de prompt. Cela évite que les modèles à petit contexte (par exemple, un modèle local de 16K tokens) n’entrent en Compaction dès le premier token ; sans fenêtre de contexte connue, les budgets de réserve configuré et actuel restent non plafonnés. Pourquoi un seuil minimal : pour conserver une marge suffisante pour les opérations de « maintenance » sur plusieurs tours (comme le vidage de la mémoire ci-dessous) avant que la Compaction ne devienne inévitable. Implémentation : `applyAgentCompactionSettingsFromConfig()` dans `src/agents/agent-settings.ts`, appelé depuis les chemins de configuration des tours de l’exécuteur intégré et de la Compaction.

La commande manuelle `/compact` respecte une valeur `agents.defaults.compaction.keepRecentTokens` explicite et conserve le point de coupure de la fin récente du runtime. Sans budget de conservation explicite, la Compaction manuelle constitue un point de contrôle strict et le contexte reconstruit commence à partir du nouveau résumé.

Lorsque `truncateAfterCompaction` est activé, OpenClaw fait basculer la transcription active vers une version compacte qui lui succède après la Compaction. Les actions de création de branche et de restauration d’un point de contrôle utilisent cette version compacte ; les anciens fichiers de points de contrôle antérieurs à la Compaction restent lisibles tant qu’ils sont référencés.

## Fournisseurs de Compaction enfichables

Les Plugins enregistrent un fournisseur de Compaction via `registerCompactionProvider()` dans l’API de Plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’identifiant d’un fournisseur enregistré, l’extension de protection délègue la synthèse à ce fournisseur au lieu d’utiliser le pipeline `summarizeInStages` intégré.

- `provider` : identifiant d’un Plugin de fournisseur de Compaction enregistré. Laissez cette valeur non définie pour utiliser la synthèse LLM par défaut. La définition d’un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et la protection conserve toujours le contexte suffixe des tours récents et des tours fractionnés après la sortie du fournisseur.
- La synthèse de protection intégrée redistille les résumés précédents avec les nouveaux messages au lieu de conserver textuellement l’intégralité du résumé précédent.
- Le mode de protection active par défaut les audits de qualité des résumés ; définissez `qualityGuard.enabled: false` pour ignorer le comportement de nouvelle tentative en cas de sortie mal formée.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée. Les signaux d’abandon ou d’expiration explicitement déclenchés par l’appelant sont relancés, et non absorbés, afin que l’annulation soit toujours respectée.

Source : `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Surfaces visibles par l’utilisateur

- `/status` dans toute session de discussion
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Journaux du Gateway (`pnpm gateway:watch` ou `openclaw logs --follow`) : `embedded run auto-compaction start` + `complete`
- Mode détaillé : `🧹 Auto-compaction complete` plus le nombre de Compactions

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan dont l’utilisateur ne doit pas voir les sorties intermédiaires.

- L’assistant commence sa sortie par le token silencieux exact `NO_REPLY` / `no_reply` pour signifier « ne pas transmettre de réponse à l’utilisateur ». OpenClaw le retire ou le supprime dans la couche de livraison.
- La suppression du token silencieux exact est insensible à la casse : `NO_REPLY` et `no_reply` sont tous deux reconnus lorsque la charge utile entière se limite au token silencieux.
- Depuis `2026.1.10`, OpenClaw supprime également la diffusion en continu du brouillon et de l’indicateur de saisie lorsqu’un fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent aucune sortie partielle en cours de tour.
- Cette fonctionnalité est réservée aux véritables tours en arrière-plan sans livraison ; elle ne constitue pas un raccourci pour les demandes utilisateur ordinaires nécessitant une action.

## Vidage de la mémoire avant Compaction

Avant une Compaction automatique, OpenClaw peut exécuter un tour agentique silencieux qui écrit un état durable sur le disque (par exemple `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent), afin que la Compaction ne puisse pas effacer un contexte critique. Il surveille l’utilisation du contexte de la session et, lorsqu’elle franchit un seuil souple inférieur au seuil de Compaction, envoie une directive silencieuse « écrire la mémoire maintenant » à l’aide du token silencieux exact `NO_REPLY` / `no_reply`, de sorte que l’utilisateur ne voie rien.

Configuration (`agents.defaults.compaction.memoryFlush`), référence complète dans [/gateway/config-agents](/fr/gateway/config-agents#agentsdefaultscompaction) :

| Clé                         | Valeur par défaut | Remarques                                                                                                                              |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | non défini        | remplacement exact du fournisseur/modèle pour le seul tour de vidage, par exemple `ollama/qwen3:8b`                                  |
| `softThresholdTokens`       | `4000`           | écart sous le seuil de Compaction qui déclenche un vidage                                                                               |
| `forceFlushTranscriptBytes` | non défini (désactivé) | force un vidage lorsque le fichier de transcription atteint cette taille en octets (ou une chaîne comme `"2mb"`), même si les compteurs de tokens sont obsolètes ; `0` désactive |
| `prompt`                    | intégré           | message utilisateur pour le tour de vidage                                                                                              |
| `systemPrompt`              | intégré           | prompt système supplémentaire ajouté au tour de vidage                                                                                  |

Remarques :

- Le prompt et le prompt système par défaut incluent une indication `NO_REPLY` pour supprimer la livraison.
- Lorsque `model` est défini, le tour de vidage utilise ce modèle sans hériter de la chaîne de secours de la session active, afin qu’une opération de maintenance uniquement locale ne bascule pas silencieusement vers un modèle de conversation payant en cas d’échec.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans la ligne de session).
- Le vidage s’exécute uniquement pour les sessions OpenClaw intégrées ; les backends CLI et les tours Heartbeat l’ignorent.
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Consultez [Mémoire](/fr/concepts/memory) pour connaître l’organisation des fichiers de l’espace de travail et les modèles d’écriture.

OpenClaw expose un hook `session_before_compact` dans l’API d’extension, mais la logique de vidage ci-dessus réside côté Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), et non dans ce hook.

## Liste de contrôle de dépannage

- **Clé de session incorrecte ?** Commencez par [/concepts/session](/fr/concepts/session) et confirmez la valeur `sessionKey` dans `/status`.
- **Incohérence entre le stockage et la transcription ?** Confirmez l’hôte du Gateway et le chemin du stockage à partir de `openclaw status`.
- **Compactions incessantes ?** Vérifiez la fenêtre de contexte du modèle (une fenêtre trop petite impose des Compactions fréquentes), `reserveTokens` (une valeur trop élevée pour la fenêtre du modèle provoque une Compaction plus précoce) et le gonflement des résultats d’outils (ajustez l’élagage de session).
- **Chaque prompt semble dépasser la limite sur un petit modèle local ?** Confirmez que le fournisseur indique la bonne fenêtre de contexte du modèle. OpenClaw ne peut plafonner la réserve effective que lorsque cette fenêtre est connue.
- **Des tours silencieux sont divulgués ?** Confirmez que la réponse commence par le token silencieux exact `NO_REPLY` (insensible à la casse) et que vous utilisez une version incluant le correctif de suppression de la diffusion en continu (`2026.1.10`+).

## Pages connexes

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
- [Référence de configuration des agents](/fr/gateway/config-agents)
