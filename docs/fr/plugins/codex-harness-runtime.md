---
read_when:
    - Vous avez besoin du contrat de prise en charge de l’environnement d’exécution du harnais Codex
    - Vous déboguez les outils Codex natifs, les points d’accroche, la Compaction ou le téléversement des retours
    - Vous modifiez le comportement du Plugin dans les tours PI et du harnais Codex
summary: Frontières d’exécution, points d’accroche, outils, autorisations et diagnostics pour le harnais Codex
title: Environnement d’exécution du harnais Codex
x-i18n:
    generated_at: "2026-05-11T20:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Cette page documente le contrat d’exécution des tours du harness Codex. Pour la configuration et
le routage, commencez par [harness Codex](/fr/plugins/codex-harness). Pour les champs de configuration,
consultez la [référence du harness Codex](/fr/plugins/codex-harness-reference).

## Vue d’ensemble

Le mode Codex n’est pas PI avec un appel de modèle différent en dessous. Codex prend en charge une plus grande partie de
la boucle de modèle native, et OpenClaw adapte ses surfaces de Plugin, d’outil, de session et
de diagnostic autour de cette limite.

OpenClaw reste responsable du routage des canaux, des fichiers de session, de la livraison des messages visibles,
des outils dynamiques OpenClaw, des approbations, de la livraison des médias et d’un miroir de transcription.
Codex est responsable du fil natif canonique, de la boucle de modèle native, de la continuation d’outil native
et de la Compaction native.

## Liaisons de fil et changements de modèle

Lorsqu’une session OpenClaw est attachée à un fil Codex existant, le tour suivant
renvoie au serveur d’application le modèle OpenAI actuellement sélectionné, la stratégie d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à
`openai/gpt-5.2` conserve la liaison du fil, mais demande à Codex de continuer avec le
modèle nouvellement sélectionné.

## Réponses visibles et heartbeats

Lorsqu’un tour de discussion source passe par le harness Codex, les réponses visibles utilisent par défaut
l’outil OpenClaw `message` si le déploiement n’a pas explicitement configuré
`messages.visibleReplies`. L’agent peut toujours terminer son tour Codex en privé ;
il ne publie dans le canal que lorsqu’il appelle `message(action="send")`. Définissez
`messages.visibleReplies: "automatic"` pour conserver les réponses finales de discussion directe dans le
chemin de livraison automatique hérité.

Les tours Heartbeat Codex reçoivent aussi par défaut `heartbeat_respond` dans le catalogue d’outils OpenClaw
consultable, afin que l’agent puisse enregistrer si le réveil doit rester
silencieux ou notifier, sans encoder ce flux de contrôle dans le texte final.

Les consignes d’initiative propres au Heartbeat sont envoyées comme instruction développeur Codex en mode collaboration
sur le tour Heartbeat lui-même. Les tours de discussion ordinaires restaurent
le mode Codex par défaut au lieu de transporter la philosophie du Heartbeat dans leur prompt
d’exécution normal.

## Limites des hooks

Le harness Codex comporte trois couches de hooks :

| Couche                                | Responsable              | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/Plugin entre les harnesses PI et Codex.       |
| Middleware d’extension du serveur d’application Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex bas niveau et stratégie d’outils natifs depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router
le comportement des Plugins OpenClaw. Pour le pont d’outils natifs et d’autorisations pris en charge,
OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`.

Lorsque les approbations du serveur d’application Codex sont activées, c’est-à-dire lorsque `approvalPolicy` n’est pas
`"never"`, la configuration de hook natif injectée par défaut omet `PermissionRequest` afin que
le réviseur du serveur d’application Codex et le pont d’approbation d’OpenClaw gèrent les
escalades réelles après revue. Les opérateurs peuvent ajouter explicitement `permission_request` à
`nativeHookRelay.events` lorsqu’ils ont besoin du relais de compatibilité.

Les autres hooks Codex, tels que `SessionStart` et `UserPromptSubmit`, restent
des contrôles au niveau Codex. Ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware dont il est responsable dans
l’adaptateur du harness. Pour les outils natifs Codex, Codex possède l’enregistrement d’outil canonique.
OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le fil Codex natif
sauf si Codex expose cette opération via le serveur d’application ou des callbacks de hooks natifs.

Les notifications d’éléments du serveur d’application Codex fournissent également des observations async `after_tool_call`
pour les achèvements d’outils natifs qui ne sont pas déjà couverts par le
relais natif `PostToolUse`. Ces observations servent uniquement à la télémétrie et à la compatibilité des Plugins ;
elles ne peuvent pas bloquer, retarder ou modifier l’appel d’outil natif.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application Codex
et de l’état de l’adaptateur OpenClaw, et non de commandes de hooks natifs Codex.
Les événements OpenClaw `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` sont des observations au niveau de l’adaptateur, pas des captures octet pour octet
de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur d’application sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge V1

Pris en charge dans l’exécution Codex v1 :

| Surface                                       | Prise en charge                                                                  | Pourquoi                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                                                                   | Le serveur d’application Codex possède le tour OpenAI, la reprise de fil native et la continuation d’outil native.                                                                                         |
| Routage et livraison des canaux OpenClaw      | Pris en charge                                                                   | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’exécution du modèle.                                                                                              |
| Outils dynamiques OpenClaw                    | Pris en charge                                                                   | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                             |
| Plugins de prompt et de contexte              | Pris en charge                                                                   | OpenClaw construit des surcouches de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le fil.                                                                            |
| Cycle de vie du moteur de contexte            | Pris en charge                                                                   | L’assemblage, l’ingestion, la maintenance après tour et la coordination de la Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                            |
| Hooks d’outils dynamiques                     | Pris en charge                                                                   | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques détenus par OpenClaw.                                                                  |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                           |
| Gate de révision de réponse finale            | Pris en charge via le relais de hook natif                                       | Codex `Stop` est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                                  |
| Blocage ou observation du shell natif, des patchs et de MCP | Pris en charge via le relais de hook natif                         | Codex `PreToolUse` et `PostToolUse` sont relayés pour les surfaces d’outils natifs validées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Stratégie d’autorisations natives             | Pris en charge via les approbations du serveur d’application Codex et le relais de hook natif de compatibilité | Les demandes d’approbation du serveur d’application Codex passent par OpenClaw après revue Codex. Le relais de hook natif `PermissionRequest` est optionnel pour les modes d’approbation natifs, car Codex l’émet avant la revue guardian. |
| Capture de trajectoire du serveur d’application | Pris en charge                                                                 | OpenClaw enregistre la requête envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                                |

Non pris en charge dans l’exécution Codex v1 :

| Surface                                             | Limite V1                                                                                                                                       | Voie future                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutation des arguments d’outils natifs              | Les hooks natifs Codex avant outil peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs Codex.                          | Nécessite une prise en charge Codex des hooks/schémas pour remplacer l’entrée d’outil.      |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique du fil natif. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas modifier des internes non pris en charge. | Ajouter des API explicites du serveur d’application Codex si une chirurgie de fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription détenues par OpenClaw, pas les enregistrements d’outils natifs Codex.       | Pourrait refléter les enregistrements transformés, mais la réécriture canonique nécessite une prise en charge Codex. |
| Métadonnées riches de Compaction native             | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable conservée/supprimée, de delta de tokens ou de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                   |
| Intervention de Compaction                          | Les hooks de Compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                             | Ajouter des hooks Codex avant/après Compaction si les Plugins doivent opposer un veto à la Compaction native ou la réécrire. |
| Capture octet pour octet de la requête API du modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur Codex construit la requête API OpenAI finale en interne. | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.        |

## Autorisations natives et sollicitations MCP

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la stratégie décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence
de décision de hook et poursuit vers son propre chemin guardian ou d’approbation utilisateur.

Codex app-server approval modes omit this native hook by default. This behavior
applies when `permission_request` is explicitly included in
`nativeHookRelay.events` or a compatibility runtime installs it.

When an operator chooses `allow-always` for a Codex native permission request,
OpenClaw remembers that exact provider/session/tool input/cwd fingerprint for a
bounded session window. The remembered decision is intentionally exact-match
only: a changed command, arguments, tool payload, or cwd creates a fresh
approval.

Codex MCP tool approval elicitations are routed through OpenClaw's plugin
approval flow when Codex marks `_meta.codex_approval_kind` as
`"mcp_tool_call"`. Codex `request_user_input` prompts are sent back to the
originating chat, and the next queued follow-up message answers that native
server request instead of being steered as extra context. Other MCP elicitation
requests fail closed.

## Queue steering

Active-run queue steering maps onto Codex app-server `turn/steer`. With the
default `messages.queue.mode: "steer"`, OpenClaw batches queued chat messages
for the configured quiet window and sends them as one `turn/steer` request in
arrival order. Legacy `queue` mode sends separate `turn/steer` requests.

Codex review and manual compaction turns can reject same-turn steering. In that
case, OpenClaw uses the follow-up queue when the selected mode allows fallback.
See [Steering queue](/fr/concepts/queue-steering).

## Codex feedback upload

When `/diagnostics [note]` is approved for a session using the native Codex
harness, OpenClaw also calls Codex app-server `feedback/upload` for relevant
Codex threads. The upload asks app-server to include logs for each listed thread
and spawned Codex subthreads when available.

The upload goes through Codex's normal feedback path to OpenAI servers. If Codex
feedback is disabled in that app-server, the command returns the app-server
error. The completed diagnostics reply lists the channels, OpenClaw session ids,
Codex thread ids, and local `codex resume <thread-id>` commands for the threads
that were sent.

If you deny or ignore the approval, OpenClaw does not print those Codex ids and
does not send Codex feedback. The upload does not replace the local Gateway
diagnostics export. See [Diagnostics export](/fr/gateway/diagnostics) for the
approval, privacy, local bundle, and group-chat behavior.

Use `/codex diagnostics [note]` only when you specifically want the Codex
feedback upload for the currently attached thread without the full Gateway
diagnostics bundle.

## Compaction and transcript mirror

When the selected model uses the Codex harness, native thread compaction is
delegated to Codex app-server. OpenClaw keeps a transcript mirror for channel
history, search, `/new`, `/reset`, and future model or harness switching.

The mirror includes the user prompt, final assistant text, and lightweight Codex
reasoning or plan records when the app-server emits them. Today, OpenClaw only
records native compaction start and completion signals. It does not yet expose a
human-readable compaction summary or an auditable list of which entries Codex
kept after compaction.

Because Codex owns the canonical native thread, `tool_result_persist` does not
currently rewrite Codex-native tool result records. It only applies when
OpenClaw is writing an OpenClaw-owned session transcript tool result.

## Media and delivery

OpenClaw continues to own media delivery and media provider selection. Image,
video, music, PDF, TTS, and media understanding use matching provider/model
settings such as `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, and `messages.tts`.

Text, images, video, music, TTS, approvals, and messaging-tool output continue
through the normal OpenClaw delivery path. Media generation does not require PI.
When Codex emits a native image-generation item with a `savedPath`, OpenClaw
forwards that exact file through the normal reply-media path even if the Codex
turn has no assistant text.

## Related

- [Codex harness](/fr/plugins/codex-harness)
- [Codex harness reference](/fr/plugins/codex-harness-reference)
- [Native Codex plugins](/fr/plugins/codex-native-plugins)
- [Plugin hooks](/fr/plugins/hooks)
- [Agent harness plugins](/fr/plugins/sdk-agent-harness)
- [Diagnostics export](/fr/gateway/diagnostics)
- [Trajectory export](/fr/tools/trajectory)
