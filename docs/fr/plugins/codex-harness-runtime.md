---
read_when:
    - Vous avez besoin du contrat de prise en charge de l’environnement d’exécution du harnais Codex
    - Vous déboguez les outils Codex natifs, les hooks, la Compaction ou l’envoi de commentaires
    - Vous modifiez le comportement du Plugin dans les tours de harnais OpenClaw et Codex
summary: Limites d’exécution, hooks, outils, permissions et diagnostics pour le harnais Codex
title: Runtime du harness Codex
x-i18n:
    generated_at: "2026-07-04T20:30:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Cette page documente le contrat d’exécution pour les tours du harnais Codex. Pour la configuration et
le routage, commencez par [Harnais Codex](/fr/plugins/codex-harness). Pour les champs de configuration,
consultez [Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vue d’ensemble

Le mode Codex n’est pas OpenClaw avec un appel de modèle différent en dessous. Codex possède une plus grande partie de
la boucle native du modèle, et OpenClaw adapte ses surfaces de Plugin, d’outil, de session et de
diagnostic autour de cette frontière.

OpenClaw possède toujours le routage des canaux, les fichiers de session, la livraison des messages visibles,
les outils dynamiques OpenClaw, les approbations, la livraison des médias et un miroir de transcription.
Codex possède le fil natif canonique, la boucle native du modèle, la continuation native des outils
et la Compaction native.

Le routage des invites suit l’environnement d’exécution sélectionné, et pas seulement la chaîne du fournisseur. Un
tour Codex natif reçoit les instructions développeur du serveur d’application Codex, tandis qu’une
route explicite de compatibilité OpenClaw conserve l’invite système OpenClaw normale même
lorsqu’elle utilise une authentification ou un transport OpenAI au goût de Codex.

Codex natif conserve les instructions de base/modèle détenues par Codex et le comportement des documents de projet
selon la configuration active du fil Codex. OpenClaw démarre et reprend les fils Codex natifs
avec la personnalité intégrée de Codex désactivée afin que les fichiers de personnalité de l’espace de travail
et l’identité de l’agent OpenClaw restent faisant autorité. Les exécutions OpenClaw légères
préservent toujours leur suppression existante des documents de projet. Les instructions développeur
OpenClaw couvrent les préoccupations de l’environnement d’exécution OpenClaw telles que la livraison du canal source,
les outils dynamiques OpenClaw, la délégation ACP, le contexte de l’adaptateur et les
fichiers de profil de l’espace de travail de l’agent actif. Les catalogues de Skills OpenClaw et les pointeurs
`MEMORY.md` routés par outil sont projetés comme instructions développeur de collaboration limitées au tour
pour Codex natif. Le contenu `BOOTSTRAP.md` actif et l’injection de secours complète de
`MEMORY.md` utilisent toujours le contexte de référence de l’entrée du tour.

## Liaisons de fil et changements de modèle

Lorsqu’une session OpenClaw est attachée à un fil Codex existant, le tour suivant
renvoie au serveur d’application le modèle OpenAI actuellement sélectionné, la politique d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à
`openai/gpt-5.2` conserve la liaison du fil mais demande à Codex de continuer avec le
modèle nouvellement sélectionné.

## Réponses visibles et Heartbeats

Lorsqu’un tour de chat direct/source s’exécute via le harnais Codex, les réponses visibles
utilisent par défaut la livraison automatique de l’assistant final pour les surfaces WebChat internes.
Cela maintient Codex aligné avec le contrat d’invite du harnais Pi : les agents répondent
normalement, et OpenClaw publie le texte final dans la conversation source. Définissez
`messages.visibleReplies: "message_tool"` lorsqu’un chat direct/source doit
intentionnellement garder le texte final de l’assistant privé sauf si l’agent appelle
`message(action="send")`.

Les tours Heartbeat de Codex reçoivent aussi `heartbeat_respond` dans le catalogue d’outils OpenClaw
consultable par défaut, afin que l’agent puisse enregistrer si le réveil doit rester
silencieux ou notifier sans encoder ce flux de contrôle dans le texte final.

Les consignes d’initiative propres au Heartbeat sont envoyées comme instruction développeur
en mode collaboration Codex sur le tour Heartbeat lui-même. Les tours de chat ordinaires restaurent
le mode par défaut de Codex au lieu de transporter la philosophie du Heartbeat dans leur invite
d’exécution normale. Lorsqu’un `HEARTBEAT.md` non vide existe, les instructions
en mode collaboration du Heartbeat indiquent à Codex le fichier au lieu d’en intégrer
le contenu.

## Frontières des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire              | Objectif                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité produit/Plugin entre les harnais OpenClaw et Codex.   |
| Middleware d’extension du serveur d’application Codex | Plugins intégrés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique d’outils native issue de la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router
le comportement des Plugins OpenClaw. Pour le pont pris en charge entre outils natifs et permissions,
OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`.

Lorsque les approbations du serveur d’application Codex sont activées, c’est-à-dire que `approvalPolicy` n’est pas
`"never"`, la configuration de hook native injectée par défaut omet `PermissionRequest` afin que
le réviseur du serveur d’application Codex et le pont d’approbation d’OpenClaw gèrent les vraies
escalades après examen. Les opérateurs peuvent ajouter explicitement `permission_request` à
`nativeHookRelay.events` lorsqu’ils ont besoin du relais de compatibilité.

Les autres hooks Codex tels que `SessionStart` et `UserPromptSubmit` restent
des contrôles de niveau Codex. Ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat
v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex demande
l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware dont il est propriétaire dans
l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement d’outil canonique.
OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le fil Codex natif
sauf si Codex expose cette opération via le serveur d’application ou des rappels de hooks
natifs.

Les événements `PreToolUse` en mode rapport du serveur d’application Codex reportent les demandes d’approbation de Plugin
à l’approbation correspondante du serveur d’application. Si un hook OpenClaw `before_tool_call`
renvoie `requireApproval` alors que la charge utile native définit le mode d’approbation rapport
(`openclaw_approval_mode` vaut `"report"`), le relais de hook natif enregistre l’exigence
d’approbation du Plugin et ne renvoie aucune décision native. Lorsque Codex envoie la
demande d’approbation du serveur d’application pour la même utilisation d’outil, OpenClaw ouvre l’invite
d’approbation du Plugin et mappe la décision vers Codex. Les événements Codex `PermissionRequest`
constituent un chemin d’approbation distinct et peuvent toujours être routés via les approbations OpenClaw
lorsque l’environnement d’exécution est configuré pour ce pont.

Les notifications d’éléments du serveur d’application Codex fournissent également des observations asynchrones `after_tool_call`
pour les achèvements d’outils natifs qui ne sont pas déjà couverts par le relais natif
`PostToolUse`. Ces observations servent uniquement à la télémétrie et à la compatibilité des Plugins ;
elles ne peuvent pas bloquer, retarder ni modifier l’appel d’outil natif.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application Codex
et de l’état de l’adaptateur OpenClaw, et non des commandes de hooks natives Codex.
Les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations de niveau adaptateur, pas des captures octet pour octet
de la requête interne de Codex ou des charges utiles de Compaction.

Les notifications du serveur d’application Codex natives `hook/started` et `hook/completed` sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                       | Prise en charge                                                                  | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                                                                   | Le serveur d’application Codex possède le tour OpenAI, la reprise de fil native et la continuation native des outils.                                                                                                                                                                                                                                                                                                                                                                  |
| Routage et livraison des canaux OpenClaw      | Pris en charge                                                                   | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime du modèle.                                                                                                                                                                                                                                                                                                                                                                             |
| Outils dynamiques OpenClaw                    | Pris en charge                                                                   | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                                                                                                                                                                                                                                                                                                       |
| Plugins de prompt et de contexte              | Pris en charge                                                                   | OpenClaw projette le prompt/contexte propre à OpenClaw dans le tour Codex tout en laissant les prompts de base, de modèle et de documentation de projet configurée appartenant à Codex dans la voie native de Codex. OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent la référence. Les instructions développeur natives de Codex acceptent uniquement les consignes de commande explicitement limitées à `codex_app_server`; les anciens indices de commande globaux restent pour les surfaces de prompt non Codex. |
| Cycle de vie du moteur de contexte            | Pris en charge                                                                   | L’assemblage, l’ingestion et la maintenance après tour s’exécutent autour des tours Codex. Les moteurs de contexte ne remplacent pas la Compaction native de Codex.                                                                                                                                                                                                                                                                                                                   |
| Hooks d’outils dynamiques                     | Pris en charge                                                                   | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques appartenant à OpenClaw.                                                                                                                                                                                                                                                                                                                                           |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes du mode Codex.                                                                                                                                                                                                                                                                                                                                      |
| Porte de révision de la réponse finale        | Pris en charge via le relais de hook natif                                       | Le `Stop` Codex est relayé vers `before_agent_finalize`; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                                                                                                                                                                                                                                                                                                          |
| Shell natif, patch et blocage ou observation MCP | Pris en charge via le relais de hook natif                                    | Les `PreToolUse` et `PostToolUse` Codex sont relayés pour les surfaces d’outils natifs validées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge; la réécriture des arguments ne l’est pas.                                                                                                                                                                                                              |
| Politique d’autorisations native              | Pris en charge via les approbations du serveur d’application Codex et le relais de hook natif de compatibilité | Les demandes d’approbation du serveur d’application Codex passent par OpenClaw après l’examen Codex. Le relais de hook natif `PermissionRequest` est optionnel pour les modes d’approbation natifs, car Codex l’émet avant l’examen guardian.                                                                                                                                                                                                                                         |
| Capture de trajectoire du serveur d’application | Pris en charge                                                                 | OpenClaw enregistre la requête qu’il a envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                                                                                                                                                                                                                                                                                                   |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite V1                                                                                                                                    | Chemin futur                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks natifs pré-outil de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs Codex.                      | Nécessite une prise en charge des hooks/schémas Codex pour remplacer l’entrée d’outil.    |
| Historique de transcript natif Codex modifiable     | Codex possède l’historique canonique des fils natifs. OpenClaw possède un miroir et peut projeter du contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites du serveur d’application Codex si une intervention chirurgicale sur le fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcript appartenant à OpenClaw, pas les enregistrements d’outils natifs Codex.                      | Pourrait refléter les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw peut demander une Compaction native, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de jetons, de résumé d’achèvement ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                 |
| Intervention de Compaction                          | OpenClaw ne permet pas aux plugins ni aux moteurs de contexte d’opposer un veto, de réécrire ou de remplacer la Compaction native de Codex.  | Ajouter des hooks pré/post-Compaction Codex si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet de la requête API du modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur de Codex construit en interne la requête finale à l’API OpenAI. | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.       |

## Autorisations natives et sollicitations MCP

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de
décision de hook et poursuit vers son propre guardian ou son propre chemin d’approbation utilisateur.

Les modes d’approbation du serveur d’application Codex omettent ce hook natif par défaut. Ce comportement
s’applique lorsque `permission_request` est explicitement inclus dans
`nativeHookRelay.events` ou lorsqu’un runtime de compatibilité l’installe.

Lorsqu’un opérateur choisit `allow-always` pour une demande d’autorisation native Codex,
OpenClaw mémorise l’empreinte exacte provider/session/entrée d’outil/cwd pour une
fenêtre de session bornée. La décision mémorisée est intentionnellement à correspondance exacte
uniquement : une commande, des arguments, une charge utile d’outil ou un cwd modifiés créent une nouvelle
approbation.

Les sollicitations d’approbation des outils MCP Codex sont routées via le flux
d’approbation des plugins d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les prompts `request_user_input` Codex sont renvoyés au chat
d’origine, et le message de suivi suivant en file d’attente répond à cette demande native du
serveur au lieu d’être orienté comme contexte supplémentaire. Les autres demandes de sollicitation MCP
échouent en mode fermé.

Pour le flux général d’approbation des plugins qui transporte ces prompts, consultez
[Demandes d’autorisation de Plugin](/fr/plugins/plugin-permission-requests).

## Pilotage de file d’attente

Le pilotage de file d’attente d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
paramètre par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en mode pilotage
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer`
dans l’ordre d’arrivée.

Les tours de revue Codex et de compaction manuelle peuvent rejeter le pilotage dans le même tour. Dans ce
cas, OpenClaw attend la fin de l’exécution active avant de démarrer l’invite.
Utilisez `/queue followup` ou `/queue collect` lorsque les messages doivent être mis en file d’attente par défaut
au lieu d’être pilotés. Consultez [File d’attente de pilotage](/fr/concepts/queue-steering).

## Téléversement des retours Codex

Lorsque `/diagnostics [note]` est approuvé pour une session utilisant le harnais Codex
natif, OpenClaw appelle également `feedback/upload` de l’app-server Codex pour les fils
Codex pertinents. Le téléversement demande à l’app-server d’inclure les journaux pour chaque fil listé
et les sous-fils Codex générés lorsqu’ils sont disponibles.

Le téléversement passe par le chemin de retour normal de Codex vers les serveurs OpenAI. Si les retours Codex
sont désactivés dans cet app-server, la commande renvoie l’erreur de l’app-server.
La réponse de diagnostics terminée liste les canaux, les identifiants de session OpenClaw,
les identifiants de fil Codex et les commandes locales `codex resume <thread-id>` pour les fils
qui ont été envoyés.

Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex et
n’envoie pas de retours Codex. Le téléversement ne remplace pas l’export local des diagnostics
du Gateway. Consultez [Export des diagnostics](/fr/gateway/diagnostics) pour le comportement
d’approbation, de confidentialité, de bundle local et de conversation de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement le téléversement
des retours Codex pour le fil actuellement attaché sans le bundle complet de diagnostics du Gateway.

## Compaction et miroir de transcription

Lorsque le modèle sélectionné utilise le harnais Codex, la compaction native du fil appartient
à l’app-server Codex. OpenClaw n’exécute pas de compaction préalable pour les tours Codex,
ne remplace pas la Compaction Codex par la compaction du moteur de contexte et ne
revient pas à la synthèse OpenClaw ou OpenAI publique lorsque la Compaction Codex
native ne peut pas être démarrée. OpenClaw conserve un miroir de transcription pour l’historique
du canal, la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais.

Les demandes explicites de compaction, comme `/compact` ou une opération de compactage manuel
demandée par un plugin, démarrent la Compaction Codex native avec `thread/compact/start`.
OpenClaw garde la demande et le bail du client partagé ouverts jusqu’à ce que Codex émette l’élément
de fin `contextCompaction` correspondant, puis signale le tour de Compaction
comme terminé. Si ce tour terminal dépasse le délai d’expiration de compaction configuré,
OpenClaw demande une interruption de tour native. Le bail et la barrière de compaction
par fil restent conservés jusqu’à ce que Codex signale l’état terminal ou confirme le RPC d’interruption.
Si Codex ne confirme pas dans le délai de grâce d’interruption, OpenClaw retire
la connexion avant de libérer la barrière. Les connexions distantes détachent également la
liaison de fil correspondante afin que le travail ultérieur ne puisse pas chevaucher un tour distant
non confirmé. Les autres tours sur une connexion retirée échouent et peuvent être réessayés sur un client frais.
La fermeture du client, l’annulation de la demande ou l’échec d’un tour de compaction renvoie une
opération échouée.

Lorsqu’un moteur de contexte demande une projection d’amorçage de fil Codex, OpenClaw
projette les noms et identifiants d’appels d’outils, les formes d’entrée et le contenu expurgé des résultats d’outils
dans le nouveau fil Codex. Il ne copie pas les valeurs brutes des arguments d’appel d’outil dans
cette projection.

Le miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque l’app-server les émet. OpenClaw enregistre le
début de Compaction native et le statut terminal, mais il n’expose pas de
résumé de compaction lisible par l’humain ni de liste vérifiable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il s’applique uniquement lorsque
OpenClaw écrit un résultat d’outil de transcription de session appartenant à OpenClaw.

## Médias et livraison

OpenClaw continue de posséder la livraison des médias et la sélection du fournisseur de médias. La compréhension
des images, de la vidéo, de la musique, des PDF, du TTS et des médias utilise les paramètres
fournisseur/modèle correspondants tels que `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` et `messages.tts`.

Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie continuent
de passer par le chemin de livraison OpenClaw normal. La génération de médias ne nécessite pas l’ancien runtime.
Lorsque Codex émet un élément natif de génération d’image avec un `savedPath`, OpenClaw
transmet exactement ce fichier par le chemin normal de réponse média, même si le tour Codex
n’a pas de texte d’assistant.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [Export de trajectoire](/fr/tools/trajectory)
