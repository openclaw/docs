---
read_when:
    - Vous avez besoin du contrat de prise en charge de l’environnement d’exécution du harnais Codex
    - Vous déboguez les outils Codex natifs, les hooks, la Compaction ou le téléversement des retours
    - Vous modifiez le comportement des plugins dans les tours du harnais OpenClaw et Codex
summary: Limites d’exécution, hooks, outils, autorisations et diagnostics pour le harnais Codex
title: Environnement d’exécution du harnais Codex
x-i18n:
    generated_at: "2026-06-27T17:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Cette page documente le contrat d’exécution pour les tours du harness Codex. Pour la configuration et
le routage, commencez par [harness Codex](/fr/plugins/codex-harness). Pour les champs de configuration,
consultez la [référence du harness Codex](/fr/plugins/codex-harness-reference).

## Vue d’ensemble

Le mode Codex n’est pas OpenClaw avec simplement un appel à un autre modèle en dessous. Codex possède une plus grande partie
de la boucle native du modèle, et OpenClaw adapte ses surfaces de Plugin, d’outils, de session et
de diagnostic autour de cette frontière.

OpenClaw possède toujours le routage des canaux, les fichiers de session, la livraison des messages visibles,
les outils dynamiques OpenClaw, les approbations, la livraison des médias et un miroir de transcript.
Codex possède le fil natif canonique, la boucle native du modèle, la continuation native des outils
et la Compaction native.

Le routage des prompts suit le runtime sélectionné, pas seulement la chaîne de fournisseur. Un
tour Codex natif reçoit les instructions développeur du serveur d’application Codex, tandis qu’une
route explicite de compatibilité OpenClaw conserve le prompt système OpenClaw normal, même
lorsqu’elle utilise une authentification ou un transport OpenAI au style Codex.

Codex natif conserve les instructions de base/modèle appartenant à Codex et le comportement des docs de projet
selon la configuration active du fil Codex. OpenClaw démarre et reprend les fils Codex natifs
avec la personnalité intégrée de Codex désactivée afin que les fichiers de personnalité de l’espace de travail
et l’identité de l’agent OpenClaw restent l’autorité. Les exécutions OpenClaw légères
préservent toujours leur suppression existante des docs de projet. Les instructions développeur
OpenClaw couvrent les préoccupations du runtime OpenClaw telles que la livraison du canal source,
les outils dynamiques OpenClaw, la délégation ACP, le contexte de l’adaptateur et les fichiers
de profil de l’espace de travail de l’agent actif. Les catalogues de Skills OpenClaw et les pointeurs
`MEMORY.md` routés par outil sont projetés comme instructions développeur de collaboration
limitées au tour pour Codex natif. Le contenu actif de `BOOTSTRAP.md` et l’injection de secours complète de
`MEMORY.md` utilisent toujours le contexte de référence d’entrée du tour.

## Liaisons de fil et changements de modèle

Lorsqu’une session OpenClaw est attachée à un fil Codex existant, le tour suivant
renvoie au serveur d’application le modèle OpenAI actuellement sélectionné, la politique d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à
`openai/gpt-5.2` conserve la liaison au fil, mais demande à Codex de continuer avec le
modèle nouvellement sélectionné.

## Réponses visibles et Heartbeats

Lorsqu’un tour de chat direct/source passe par le harness Codex, les réponses visibles
utilisent par défaut la livraison automatique de l’assistant final pour les surfaces WebChat internes.
Cela maintient Codex aligné sur le contrat de prompt du harness Pi : les agents répondent
normalement, et OpenClaw publie le texte final dans la conversation source. Définissez
`messages.visibleReplies: "message_tool"` lorsqu’un chat direct/source doit
intentionnellement garder privé le texte final de l’assistant, sauf si l’agent appelle
`message(action="send")`.

Les tours Heartbeat Codex reçoivent également `heartbeat_respond` par défaut dans le catalogue
d’outils OpenClaw consultable, afin que l’agent puisse enregistrer si le réveil doit rester
silencieux ou notifier sans encoder ce flux de contrôle dans le texte final.

Les consignes d’initiative propres au Heartbeat sont envoyées comme instruction développeur
du mode collaboration Codex sur le tour Heartbeat lui-même. Les tours de chat ordinaires restaurent
le mode par défaut de Codex au lieu de porter la philosophie Heartbeat dans leur prompt
de runtime normal. Lorsqu’un fichier `HEARTBEAT.md` non vide existe, les instructions
du mode collaboration Heartbeat orientent Codex vers le fichier au lieu d’intégrer son
contenu en ligne.

## Frontières des hooks

Le harness Codex comporte trois couches de hooks :

| Couche                                | Propriétaire             | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/Plugin entre les harnesses OpenClaw et Codex. |
| Middleware d’extension du serveur d’application Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex bas niveau et politique native des outils depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` de projet ou globaux Codex pour router
le comportement des Plugins OpenClaw. Pour le pont pris en charge des outils natifs et des permissions,
OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`.

Lorsque les approbations du serveur d’application Codex sont activées, c’est-à-dire lorsque `approvalPolicy` n’est pas
`"never"`, la configuration de hook natif injectée par défaut omet `PermissionRequest` afin que
le réviseur du serveur d’application Codex et le pont d’approbation d’OpenClaw gèrent les véritables
escalades après examen. Les opérateurs peuvent ajouter explicitement `permission_request` à
`nativeHookRelay.events` lorsqu’ils ont besoin du relais de compatibilité.

Les autres hooks Codex, tels que `SessionStart` et `UserPromptSubmit`, restent
des contrôles au niveau Codex. Ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex demande
l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware qu’il possède dans
l’adaptateur de harness. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut dupliquer certains événements, mais il ne peut pas réécrire le fil Codex natif
sauf si Codex expose cette opération via le serveur d’application ou les callbacks de hook natif.

Les événements `PreToolUse` du mode rapport du serveur d’application Codex reportent les demandes d’approbation de Plugin
à l’approbation correspondante du serveur d’application. Si un hook OpenClaw `before_tool_call`
renvoie `requireApproval` alors que la charge utile native définit le mode d’approbation rapport
(`openclaw_approval_mode` vaut `"report"`), le relais de hook natif enregistre l’exigence
d’approbation du Plugin et ne renvoie aucune décision native. Lorsque Codex envoie la
demande d’approbation du serveur d’application pour la même utilisation d’outil, OpenClaw ouvre le prompt
d’approbation du Plugin et associe la décision à Codex. Les événements Codex `PermissionRequest`
constituent un chemin d’approbation séparé et peuvent toujours être routés via les approbations OpenClaw
lorsque le runtime est configuré pour ce pont.

Les notifications d’élément du serveur d’application Codex fournissent également des observations asynchrones `after_tool_call`
pour les achèvements d’outils natifs qui ne sont pas déjà couverts par le relais
natif `PostToolUse`. Ces observations servent uniquement à la télémétrie et à la compatibilité des Plugins ;
elles ne peuvent pas bloquer, retarder ou modifier l’appel d’outil natif.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application Codex
et de l’état de l’adaptateur OpenClaw, pas des commandes de hook natives Codex.
Les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, et non des captures octet pour octet
de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications du serveur d’application Codex natives `hook/started` et `hook/completed` sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                                                                  | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle du modèle OpenAI via Codex             | Pris en charge                                                                   | L’app-server Codex possède le tour OpenAI, la reprise de fil natif et la continuation d’outil natif.                                                                                                                                                                                                                                                                                                                                                                                |
| Routage et livraison des canaux OpenClaw      | Pris en charge                                                                   | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime du modèle.                                                                                                                                                                                                                                                                                                                                                                          |
| Outils dynamiques OpenClaw                    | Pris en charge                                                                   | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                                                                                                                                                                                                                                                                                                     |
| Plugins de prompt et de contexte              | Pris en charge                                                                   | OpenClaw projette le prompt/contexte propre à OpenClaw dans le tour Codex, tout en laissant les prompts de base, de modèle et de documentation de projet configurés appartenant à Codex dans la voie native Codex. OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent l’autorité. Les instructions développeur natives de Codex n’acceptent que les consignes de commande explicitement limitées à `codex_app_server`; les anciens indices de commande globaux restent pour les surfaces de prompt non Codex. |
| Cycle de vie du moteur de contexte            | Pris en charge                                                                   | L’assemblage, l’ingestion et la maintenance après tour s’exécutent autour des tours Codex. Les moteurs de contexte ne remplacent pas la Compaction native de Codex.                                                                                                                                                                                                                                                                                                                 |
| Hooks d’outils dynamiques                     | Pris en charge                                                                   | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques appartenant à OpenClaw.                                                                                                                                                                                                                                                                                                                                         |
| Hooks de cycle de vie                         | Pris en charge comme observations de l’adaptateur                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                                                                                                                                                                                                                                                                                                     |
| Porte de révision de réponse finale           | Pris en charge via le relais de hook natif                                       | Le `Stop` de Codex est relayé vers `before_agent_finalize`; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                                                                                                                                                                                                                                                                                                     |
| Blocage ou observation du shell, du patch et de MCP natifs | Pris en charge via le relais de hook natif                                       | Les `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur Codex app-server `0.125.0` ou plus récent. Le blocage est pris en charge; la réécriture des arguments ne l’est pas.                                                                                                                                                                                                                       |
| Politique de permission native                | Pris en charge via les approbations Codex app-server et le relais de hook natif de compatibilité | Les demandes d’approbation Codex app-server passent par OpenClaw après examen par Codex. Le relais de hook natif `PermissionRequest` est optionnel pour les modes d’approbation natifs, car Codex l’émet avant l’examen par guardian.                                                                                                                                                                                                                                             |
| Capture de trajectoire app-server             | Pris en charge                                                                   | OpenClaw enregistre la requête qu’il a envoyée à app-server et les notifications app-server qu’il reçoit.                                                                                                                                                                                                                                                                                                                                                                           |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite V1                                                                                                                                       | Chemin futur                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks natifs pré-outil de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs de Codex.                      | Nécessite la prise en charge par les hooks/schémas Codex du remplacement de l’entrée d’outil. |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique des fils natifs. OpenClaw possède un miroir et peut projeter un futur contexte, mais ne doit pas modifier des éléments internes non pris en charge. | Ajouter des API Codex app-server explicites si une chirurgie de fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription appartenant à OpenClaw, pas les enregistrements d’outils natifs Codex.                        | Des enregistrements transformés pourraient être mis en miroir, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw peut demander une Compaction native, mais ne reçoit pas de liste stable conservée/supprimée, de delta de jetons, de résumé d’achèvement ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                  |
| Intervention sur la Compaction                      | OpenClaw ne permet pas aux plugins ni aux moteurs de contexte d’opposer un veto, de réécrire ou de remplacer la Compaction native de Codex.      | Ajouter des hooks Codex pré/post-Compaction si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet de la requête d’API du modèle | OpenClaw peut capturer les requêtes et notifications app-server, mais le cœur Codex construit en interne la requête finale à l’API OpenAI.       | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.      |

## Permissions natives et sollicitations MCP

Pour `PermissionRequest`, OpenClaw ne renvoie que des décisions explicites
d’autorisation ou de refus lorsque la politique décide. Un résultat sans décision
n’est pas une autorisation. Codex le traite comme une absence de décision de hook
et bascule vers son propre chemin d’approbation guardian ou utilisateur.

Les modes d’approbation Codex app-server omettent ce hook natif par défaut. Ce
comportement s’applique lorsque `permission_request` est explicitement inclus
dans `nativeHookRelay.events` ou qu’un runtime de compatibilité l’installe.

Lorsqu’un opérateur choisit `allow-always` pour une demande de permission native
Codex, OpenClaw mémorise l’empreinte exacte provider/session/entrée d’outil/cwd
pour une fenêtre de session limitée. La décision mémorisée est volontairement
limitée aux correspondances exactes : une commande, des arguments, une charge
utile d’outil ou un cwd modifiés créent une nouvelle approbation.

Les sollicitations d’approbation d’outils MCP Codex sont routées via le flux
d’approbation de Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind`
comme `"mcp_tool_call"`. Les prompts Codex `request_user_input` sont renvoyés au
chat d’origine, et le message de suivi suivant dans la file répond à cette
requête serveur native au lieu d’être orienté comme contexte supplémentaire. Les
autres demandes de sollicitation MCP échouent fermées.

Pour le flux général d’approbation de Plugin qui transporte ces prompts, consultez
[Demandes de permission de Plugin](/fr/plugins/plugin-permission-requests).

## Pilotage de la file

Le pilotage de file d’exécution active correspond à `turn/steer` de Codex
app-server. Avec le mode par défaut `messages.queue.mode: "steer"`, OpenClaw
regroupe les messages de chat en mode pilotage pendant la fenêtre de silence
configurée et les envoie sous forme d’une seule requête `turn/steer`, dans leur
ordre d’arrivée.

La revue Codex et les tours de Compaction manuelle peuvent rejeter le pilotage dans le même tour. Dans ce
cas, OpenClaw attend que l’exécution active se termine avant de démarrer le prompt.
Utilisez `/queue followup` ou `/queue collect` lorsque les messages doivent être mis en file d’attente par défaut
au lieu d’être pilotés. Consultez [File de pilotage](/fr/concepts/queue-steering).

## Téléversement du feedback Codex

Lorsque `/diagnostics [note]` est approuvé pour une session utilisant le harnais Codex
natif, OpenClaw appelle aussi `feedback/upload` de l’app-server Codex pour les threads
Codex concernés. Le téléversement demande à l’app-server d’inclure les journaux pour chaque thread listé
et les sous-threads Codex engendrés lorsqu’ils sont disponibles.

Le téléversement passe par le chemin normal de feedback de Codex vers les serveurs OpenAI. Si le feedback
Codex est désactivé dans cet app-server, la commande renvoie l’erreur de l’app-server.
La réponse de diagnostic terminée liste les canaux, les identifiants de session OpenClaw,
les identifiants de thread Codex et les commandes locales `codex resume <thread-id>` pour les threads
qui ont été envoyés.

Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex et
n’envoie pas de feedback Codex. Le téléversement ne remplace pas l’export de diagnostics local du Gateway.
Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le comportement relatif à
l’approbation, à la confidentialité, au bundle local et aux discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement le téléversement du feedback Codex
pour le thread actuellement attaché, sans le bundle complet de diagnostics Gateway.

## Compaction et miroir de transcription

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du thread appartient
à l’app-server Codex. OpenClaw n’exécute pas de Compaction de prévol pour les tours Codex,
ne remplace pas la Compaction Codex par la Compaction du moteur de contexte, et ne
se rabat pas sur OpenClaw ou sur la synthèse OpenAI publique lorsque la Compaction Codex
native ne peut pas être démarrée. OpenClaw conserve un miroir de transcription pour l’historique
des canaux, la recherche, `/new`, `/reset`, et le changement futur de modèle ou de harnais.

Les demandes explicites de Compaction, comme `/compact` ou une opération de compactage manuel
demandée par un Plugin, démarrent la Compaction Codex native avec `thread/compact/start`.
OpenClaw rend la main après avoir démarré cette opération native. Il n’attend pas
la fin, n’impose pas de délai d’expiration OpenClaw distinct, ne redémarre pas l’app-server Codex
partagé et n’enregistre pas l’opération comme une Compaction terminée par OpenClaw.

Lorsqu’un moteur de contexte demande une projection d’amorçage de thread Codex, OpenClaw
projette les noms et identifiants d’appels d’outil, les formes d’entrée et le contenu expurgé des résultats
d’outil dans le nouveau thread Codex. Il ne copie pas les valeurs brutes des arguments d’appels d’outil dans
cette projection.

Le miroir inclut le prompt utilisateur, le texte final de l’assistant et les enregistrements légers de raisonnement
ou de plan Codex lorsque l’app-server les émet. Aujourd’hui, OpenClaw n’enregistre que
les signaux explicites de démarrage de Compaction native lorsqu’il demande une Compaction. Il
n’expose pas de résumé de Compaction lisible par un humain ni de liste auditable des
entrées que Codex a conservées après la Compaction.

Comme Codex possède le thread natif canonique, `tool_result_persist` ne réécrit pas
actuellement les enregistrements de résultats d’outil natifs Codex. Il s’applique uniquement lorsque
OpenClaw écrit un résultat d’outil de transcription de session appartenant à OpenClaw.

## Médias et livraison

OpenClaw continue de posséder la livraison des médias et la sélection des fournisseurs de médias. L’image,
la vidéo, la musique, les PDF, le TTS et la compréhension des médias utilisent les paramètres fournisseur/modèle
correspondants, tels que `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` et `messages.tts`.

Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie continuent
de passer par le chemin de livraison OpenClaw normal. La génération de médias ne nécessite pas l’environnement d’exécution hérité.
Lorsque Codex émet un élément natif de génération d’image avec un `savedPath`, OpenClaw
transmet ce fichier exact via le chemin normal de réponse média, même si le tour Codex
n’a pas de texte d’assistant.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Export de trajectoire](/fr/tools/trajectory)
