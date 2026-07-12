---
read_when:
    - Vous avez besoin du contrat de prise en charge de l’environnement d’exécution du harness Codex
    - Vous déboguez les outils Codex natifs, les hooks, la compaction ou l’envoi de commentaires
    - Vous modifiez le comportement des plugins dans les tours de harnais OpenClaw et Codex
summary: Limites d’exécution, hooks, outils, autorisations et diagnostics du harnais Codex
title: Runtime du harnais Codex
x-i18n:
    generated_at: "2026-07-12T15:38:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrat d’exécution pour les tours du harnais Codex. Pour la configuration et le routage, consultez
[Harnais Codex](/fr/plugins/codex-harness). Pour les champs de configuration, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vue d’ensemble

Codex gère la boucle de modèle native, la reprise native des fils de discussion, la
continuation native des outils et la Compaction native. OpenClaw gère le routage des
canaux, les fichiers de session, la remise des messages visibles, les outils dynamiques
OpenClaw, les approbations, la remise des médias et un miroir de transcription autour
de cette frontière.

Le routage des prompts suit l’environnement d’exécution sélectionné, et pas seulement
la chaîne du fournisseur. Un tour Codex natif reçoit les instructions de développement
du serveur d’application Codex ; une route de compatibilité OpenClaw explicite conserve
le prompt système OpenClaw normal, même lorsqu’elle utilise une authentification ou un
transport OpenAI de type Codex.

OpenClaw démarre et reprend les fils de discussion Codex natifs avec la personnalité
intégrée de Codex désactivée (`personality: "none"`) afin que les fichiers de personnalité
de l’espace de travail et l’identité de l’agent OpenClaw restent la référence. Codex natif
conserve par ailleurs les instructions de base et de modèle gérées par Codex ainsi que le
chargement de la documentation du projet. Les exécutions OpenClaw légères (par exemple
Cron) continuent de supprimer le chargement de la documentation du projet.

Les instructions de développement OpenClaw couvrent les aspects propres à l’environnement
d’exécution OpenClaw : remise au canal source, outils dynamiques OpenClaw, délégation ACP,
contexte de l’adaptateur et fichiers de profil actifs de l’espace de travail de l’agent.
Les catalogues de Skills et les pointeurs `MEMORY.md` acheminés par des outils sont projetés
sous forme d’instructions de développement collaboratives limitées au tour. Lorsque les
outils de mémoire sont indisponibles, le contenu actif de `BOOTSTRAP.md` et l’intégralité
de `MEMORY.md` sont à la place ajoutés au contexte d’entrée brut du tour.

La plupart des outils dynamiques OpenClaw utilisent l’espace de noms consultable `openclaw`.
Les outils marqués `catalogMode: "direct-only"` utilisent `openclaw_direct`, que Codex
maintient directement visible par le modèle en tant que `DirectModelOnly`, au lieu de
l’exposer à l’exécution imbriquée en mode Code.

## Liaisons de fils de discussion et changements de modèle

Lorsqu’une session OpenClaw est associée à un fil de discussion Codex existant, le tour
suivant renvoie au serveur d’application le modèle actuellement sélectionné, la politique
d’approbation, le bac à sable, le réviseur des approbations et le niveau de service. Le
passage de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la liaison au fil de discussion,
mais demande à Codex de poursuivre avec le nouveau modèle sélectionné.

Les liaisons supervisées constituent l’exception. Le sélecteur de modèle OpenClaw reste
verrouillé et les reprises omettent les remplacements de modèle et de fournisseur afin
que Codex restaure le modèle et le fournisseur persistants du fil de discussion canonique.
Un contrôle Codex natif distinct peut modifier cette paire persistante, et l’instantané
initial peut produire l’avertissement normal de Codex concernant une différence de modèle ;
le modèle OpenClaw externe et la chaîne de repli ne se substituent jamais à l’un ou à
l’autre.

## Supervision et continuation sûre

La supervision Codex est une fonctionnalité facultative du même Plugin `codex`. Elle
découvre les fils de discussion natifs par l’intermédiaire d’une connexion distincte et
ne projette que les sessions non archivées dans le catalogue du Gateway. En l’absence de
paramètres de connexion `appServer` explicites, cette connexion utilise l’entrée-sortie
standard gérée du répertoire personnel de l’utilisateur, tandis que le harnais ordinaire
reste limité à l’agent. Les lectures de liste et de métadonnées sont passives : elles ne
reprennent pas un fil de discussion, n’abonnent pas OpenClaw à ses événements en direct
et ne répondent pas à ses approbations.

Pour une session stockée ou inactive sur l’ordinateur du Gateway, **Continuer en tant que branche**
crée une discussion normale verrouillée sur le modèle et reflète un historique limité des
messages de l’utilisateur et de l’assistant jusqu’au dernier tour terminal persistant de
la source. Le premier tour normal de la discussion installe les véritables gestionnaires
d’approbation et utilise une bifurcation native temporaire pour épingler l’instantané sans
remplacement du modèle ni du fournisseur. Le serveur d’application Codex utilise sa
configuration native actuelle et renvoie la paire sélectionnée ; il émet son avertissement
normal si ce modèle diffère du dernier modèle enregistré pour la source. Sur la même
connexion de supervision, OpenClaw démarre le fil de discussion canonique du harnais Codex
dont la source est `appServer`, sous son répertoire de travail et sa politique d’exécution,
avec exactement le modèle et le fournisseur renvoyés pour ce démarrage initial, injecte
l’historique visible limité et archive la bifurcation temporaire. La source n’est jamais
reprise. Le fil de discussion canonique dispose de l’ensemble complet des outils du harnais
OpenClaw ; le raisonnement, les appels d’outils et les résultats d’outils de la source n’y
sont pas clonés. La portée de la connexion privée persiste dans les états de liaison en
attente et validés, de sorte que chaque tour ultérieur reste sur cette connexion avec la
configuration native d’authentification et de fournisseur. Une supervision désactivée ou
une dérive de liaison ou de connexion provoque un échec fermé au lieu d’un basculement vers
le harnais ordinaire du répertoire personnel de l’agent.

La source CLI ou VS Code d’origine reste admissible dans les deux catalogues. La branche
canonique est un fil de discussion Codex natif, mais son type de source est `appServer` ;
les clients natifs peuvent filtrer ce type de source, son affichage dans Codex Desktop
n’est donc pas garanti.

Les sources actives ne peuvent pas démarrer une nouvelle branche ni être archivées ; une
discussion supervisée existante peut néanmoins être ouverte. `notLoaded` signifie que
l’activité est inconnue, et non que la source est inactive ; OpenClaw n’autorise l’archivage
d’une ligne locale `idle` ou `notLoaded` qu’après une confirmation explicite qu’aucun autre
exécuteur n’est présent et une nouvelle lecture locale au processus de l’état. Codex
sérialise les mutations des fils de discussion au sein d’un même processus du serveur
d’application, mais ne fournit aucun bail exclusif interprocessus pour l’exécuteur ou le
propriétaire des approbations ; cette lecture ne peut donc pas prouver qu’un autre processus
n’utilise pas le fil de discussion. OpenClaw bloque un propriétaire de liaison actif connu
pour la cible exacte ou pour tout descendant généré non archivé renvoyé par la requête
paginée des descendants de Codex. Les erreurs d’énumération, les cycles et l’épuisement de
la limite de sécurité provoquent un échec fermé. L’archivage natif peut tout de même entrer
en concurrence avec un nouveau tour dans un autre processus ; la confirmation couvre donc
les clients inconnus et l’intervalle entre la lecture de l’état et l’archivage. Une
discussion supervisée verrouillée sur le modèle ne peut pas être supprimée tant qu’elle
protège la liaison native.

Les catalogues de nœuds appairés restent limités aux métadonnées dans la version initiale. La frontière actuelle d’invocation des
nœuds repose sur un modèle requête/réponse et ne peut pas transporter les événements de tour
persistants, les demandes d’approbation ni la sortie en streaming requis par une véritable liaison
au harness Codex. Les actions distantes **Continuer** et **Archiver** restent donc indisponibles même
lorsque la ligne est inactive.

Consultez [Supervision de Codex](/fr/plugins/codex-supervision) pour la configuration par l’opérateur et le
comportement visible de l’interface de contrôle.

## Réponses visibles et heartbeats

Les tours de discussion directs ou issus de la source via le harness Codex utilisent par défaut la remise automatique de la réponse finale
de l’assistant pour les surfaces WebChat internes, conformément au contrat du harness Pi :
l’agent répond normalement et OpenClaw publie le texte final dans la
conversation source. Définissez `messages.visibleReplies: "message_tool"` pour conserver
le texte final de l’assistant privé, sauf si l’agent appelle `message(action="send")`.

Par défaut, les tours Heartbeat de Codex disposent de `heartbeat_respond` dans le catalogue interrogeable des outils
OpenClaw afin que l’agent puisse indiquer si le réveil doit rester silencieux
ou envoyer une notification. Les instructions relatives à l’initiative du Heartbeat sont envoyées sous forme d’instruction de développeur
du mode de collaboration Codex, limitée au tour Heartbeat ; les tours de discussion ordinaires restent
en mode par défaut de Codex. Lorsque `HEARTBEAT.md` n’est pas vide, les instructions de Heartbeat
orientent Codex vers le fichier au lieu d’intégrer directement son contenu.

## Frontières des hooks

| Couche                                | Propriétaire             | Objectif                                                             |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité du produit/Plugin entre les harness OpenClaw et Codex. |
| Middleware d’extension app-server Codex | Plugins intégrés OpenClaw | Comportement de l’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex de bas niveau et politique des outils natifs issue de la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` Codex du projet ou globaux pour acheminer
le comportement des Plugins. Pour le pont des outils natifs et des autorisations, OpenClaw injecte
une configuration Codex par thread pour `PreToolUse`, `PostToolUse`, `PermissionRequest`
et `Stop`.

Lorsque les approbations app-server Codex sont activées (`approvalPolicy` n’est pas
`"never"`), la configuration par défaut injectée pour les hooks natifs omet `PermissionRequest`
afin que l’examinateur app-server de Codex et le pont d’approbation d’OpenClaw gèrent les véritables
élévations après examen. Ajoutez `permission_request` à
`nativeHookRelay.events` pour forcer malgré tout le relais de compatibilité. Les autres hooks Codex,
tels que `SessionStart` et `UserPromptSubmit`, restent des contrôles au niveau de Codex ;
ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel ; le comportement du Plugin et du middleware s’exécute donc dans l’adaptateur du harness. Pour
les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil ; OpenClaw peut répliquer
certains événements, mais ne peut pas réécrire le thread natif, sauf si Codex le permet
par l’intermédiaire de l’app-server ou de rappels de hooks natifs.

Les événements `PreToolUse` en mode rapport de l’app-server Codex reportent l’approbation du Plugin à
l’approbation app-server correspondante. Si un hook OpenClaw `before_tool_call` renvoie
`requireApproval` alors que la charge utile native définit `openclaw_approval_mode:
"report"`, le relais de hooks natifs enregistre l’exigence d’approbation du Plugin et
ne renvoie aucune décision native. Lorsque Codex envoie ensuite la demande d’approbation
app-server pour la même utilisation d’outil, OpenClaw ouvre l’invite d’approbation du Plugin et
retransmet la décision à Codex. Les événements Codex `PermissionRequest` constituent un
chemin d’approbation distinct et peuvent toujours être acheminés via les approbations OpenClaw lorsqu’ils sont
configurés pour ce pont.

Les notifications d’éléments de l’app-server Codex fournissent également des observations asynchrones `after_tool_call`
pour les exécutions d’outils natifs qui ne sont pas déjà couvertes par le relais natif
`PostToolUse`. Elles servent uniquement à la télémétrie et à la compatibilité ; elles ne peuvent ni
bloquer, ni retarder, ni modifier l’appel d’outil natif.

Les projections de la Compaction et du cycle de vie du LLM proviennent des notifications de l’app-server Codex
et de l’état de l’adaptateur OpenClaw, et non des commandes de hooks natives Codex.
`before_compaction`, `after_compaction`, `llm_input` et `llm_output` sont
des observations au niveau de l’adaptateur, et non des captures octet par octet des charges utiles internes
de requête ou de Compaction de Codex.

Les notifications app-server natives Codex `hook/started` et `hook/completed` sont
projetées sous forme d’événements d’agent `codex_app_server.hook` pour la trajectoire et le
débogage. Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge V1

Pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                       | Prise en charge                                                                          | Pourquoi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Prise en charge                                                                          | Le serveur d’application Codex gère le tour OpenAI, la reprise native du fil et la poursuite native de l’utilisation des outils.                                                                                                                                                                                                                                                                                                                                                          |
| Routage et livraison des canaux OpenClaw      | Prise en charge                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’environnement d’exécution du modèle.                                                                                                                                                                                                                                                                                                                                                              |
| Outils dynamiques OpenClaw                    | Prise en charge                                                                          | Codex demande à OpenClaw d’exécuter ces outils, de sorte qu’OpenClaw reste dans le chemin d’exécution.                                                                                                                                                                                                                                                                                                                                                                                     |
| Plugins de prompt et de contexte              | Prise en charge                                                                          | OpenClaw projette le prompt et le contexte propres à OpenClaw dans le tour Codex, tout en laissant les prompts de base, de modèle et de documentation de projet configurée, gérés par Codex, dans le chemin natif de Codex. OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent la référence. Les instructions de développeur natives de Codex n’acceptent que les directives de commande explicitement limitées à `codex_app_server` ; les anciennes indications globales de commande restent disponibles pour les surfaces de prompt autres que Codex. |
| Cycle de vie du moteur de contexte            | Prise en charge                                                                          | L’assemblage, l’ingestion et la maintenance après le tour s’exécutent autour des tours Codex. Les moteurs de contexte ne remplacent pas la Compaction native de Codex.                                                                                                                                                                                                                                                                                                                       |
| Hooks d’outils dynamiques                     | Prise en charge                                                                          | `before_tool_call`, `after_tool_call` et l’intergiciel de résultats d’outils s’exécutent autour des outils dynamiques gérés par OpenClaw.                                                                                                                                                                                                                                                                                                                                                   |
| Hooks de cycle de vie                         | Pris en charge comme observations de l’adaptateur                                         | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` sont déclenchés avec des charges utiles fidèles au mode Codex.                                                                                                                                                                                                                                                                                                                                            |
| Porte de révision de la réponse finale        | Prise en charge par relais de hook natif                                                  | L’événement `Stop` de Codex est relayé vers `before_agent_finalize` ; `revise` demande à Codex d’effectuer un passage de modèle supplémentaire avant la finalisation.                                                                                                                                                                                                                                                                                                                        |
| Blocage ou observation du shell, des correctifs et de MCP natifs | Prise en charge par relais de hook natif                                      | Les événements `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natifs validées, y compris les charges utiles MCP avec le serveur d’application Codex `0.142.0` ou une version ultérieure. Le blocage est pris en charge, mais pas la réécriture des arguments.                                                                                                                                                                                                     |
| Politique d’autorisation native               | Prise en charge par les approbations du serveur d’application Codex et le relais compatible de hooks natifs | Les demandes d’approbation du serveur d’application Codex sont acheminées via OpenClaw après l’examen de Codex. Le relais du hook natif `PermissionRequest` est facultatif pour les modes d’approbation natifs, car Codex l’émet avant l’examen du gardien.                                                                                                                                                                                                                                      |
| Capture de la trajectoire du serveur d’application | Prise en charge                                                                     | OpenClaw enregistre la requête qu’il a envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                                                                                                                                                                                                                                                                                                        |

Non pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                             | Limite de la V1                                                                                                                                 | Évolution future                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Modification des arguments d’outils natifs          | Les hooks natifs de pré-exécution d’outil de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs de Codex.      | Nécessite la prise en charge par les hooks ou le schéma Codex du remplacement des entrées d’outil. |
| Historique modifiable de la transcription native de Codex | Codex gère l’historique canonique du fil natif. OpenClaw gère un miroir et peut projeter le contexte futur, mais ne doit pas modifier les éléments internes non pris en charge. | Ajouter des API explicites au serveur d’application Codex si une intervention sur le fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs de Codex | Ce hook transforme les écritures de transcription gérées par OpenClaw, et non les enregistrements d’outils natifs de Codex.                     | Il serait possible de répliquer les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw peut demander une Compaction native, mais ne reçoit ni liste stable des éléments conservés ou supprimés, ni variation du nombre de jetons, ni résumé d’achèvement, ni charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                      |
| Intervention sur la Compaction                      | OpenClaw ne permet pas aux Plugins ou aux moteurs de contexte d’opposer un veto à la Compaction native de Codex, de la réécrire ou de la remplacer. | Ajouter des hooks Codex avant et après la Compaction si les Plugins doivent opposer un veto à la Compaction native ou la réécrire. |
| Capture octet par octet de la requête à l’API du modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur de Codex construit en interne la requête finale à l’API OpenAI. | Nécessite un événement de traçage des requêtes de modèle Codex ou une API de débogage.          |

## Autorisations natives et sollicitations MCP

Pour `PermissionRequest`, OpenClaw ne renvoie de décisions explicites
d’autorisation ou de refus que lorsque la politique prend une décision.
L’absence de décision ne constitue pas une autorisation : Codex la traite
comme une absence de décision du hook et poursuit avec son propre processus
d’approbation par le gardien ou l’utilisateur.

Les modes d’approbation du serveur d’application Codex omettent ce hook natif
par défaut. Cela s’applique sauf si `permission_request` est explicitement
inclus dans `nativeHookRelay.events` ou si un environnement d’exécution de
compatibilité l’installe.

Lorsqu’un opérateur choisit `allow-always` pour une demande d’autorisation
native Codex, OpenClaw mémorise l’empreinte exacte du fournisseur, de la
session, de l’entrée d’outil et du répertoire de travail pour une fenêtre de
session limitée. La décision mémorisée ne s’applique intentionnellement qu’en
cas de correspondance exacte : toute modification de la commande, des
arguments, de la charge utile de l’outil ou du répertoire de travail crée une
nouvelle demande d’approbation.

Les sollicitations d’approbation d’outils MCP de Codex sont acheminées par le
flux d’approbation des Plugins d’OpenClaw lorsque Codex définit
`_meta.codex_approval_kind` sur `"mcp_tool_call"`. Les invites
`request_user_input` de Codex sont renvoyées à la conversation d’origine, et
le prochain message de suivi placé dans la file d’attente répond à cette
requête native du serveur au lieu d’être orienté comme contexte
supplémentaire. Les autres demandes de sollicitation MCP échouent de manière
fermée.

Pour le flux général d’approbation des Plugins qui transmet ces invites,
consultez [Demandes d’autorisation des Plugins](/fr/plugins/plugin-permission-requests).

## Orientation de la file d’attente

L’orientation de la file d’attente d’une exécution active correspond à
`turn/steer` du serveur d’application Codex. Avec la valeur par défaut
`messages.queue.mode: "steer"`, OpenClaw regroupe les messages de conversation
en mode d’orientation pendant la fenêtre de silence configurée et les envoie
dans leur ordre d’arrivée au sein d’une seule requête `turn/steer`.

Les tours de revue Codex et de compaction manuelle peuvent refuser le pilotage au cours du même tour. Dans
ce cas, OpenClaw attend la fin de l’exécution active avant de démarrer le
prompt. Utilisez `/queue followup` ou `/queue collect` lorsque les messages doivent être mis en file d’attente
par défaut au lieu de piloter le tour. Consultez [File d’attente de pilotage](/fr/concepts/queue-steering).

## Envoi des commentaires Codex

Lorsque `/diagnostics [note]` est approuvé pour une session sur le
harness Codex natif, OpenClaw appelle également `feedback/upload` du serveur d’application Codex pour les
fils Codex concernés, avec les journaux de chaque fil répertorié et des
sous-fils Codex générés lorsqu’ils sont disponibles.

L’envoi passe par le mécanisme de commentaires habituel de Codex vers les serveurs OpenAI. Si
les commentaires Codex sont désactivés dans ce serveur d’application, la commande renvoie
l’erreur du serveur d’application. La réponse de diagnostic terminée répertorie les canaux,
les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales `codex resume <thread-id>`
pour les fils envoyés.

Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex
et n’envoie pas de commentaires Codex. L’envoi ne remplace pas l’exportation locale
des diagnostics du Gateway. Consultez [Exportation des diagnostics](/fr/gateway/diagnostics) pour
l’approbation, la confidentialité, le paquet local et le comportement dans les discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous souhaitez envoyer les commentaires Codex
pour le fil actuellement associé, sans le paquet complet de diagnostics du Gateway.

## Compaction et miroir de transcription

Lorsque le modèle sélectionné utilise le harness Codex, la compaction native du fil
relève du serveur d’application Codex. OpenClaw n’exécute pas de compaction préliminaire pour
les tours Codex, ne remplace pas la compaction Codex par celle du moteur de contexte et ne
se rabat pas sur la synthèse d’OpenClaw ou la synthèse publique d’OpenAI lorsque la compaction native ne peut pas
être démarrée. OpenClaw conserve un miroir de transcription pour l’historique du canal, la recherche,
`/new`, `/reset` et les futurs changements de modèle ou de harness.

Les demandes de compaction explicites, telles que `/compact` ou une opération de
compaction manuelle demandée par un Plugin, démarrent la compaction Codex native avec `thread/compact/start`.
OpenClaw maintient la demande et le bail du client partagé ouverts jusqu’à ce que Codex émette
l’élément d’achèvement `contextCompaction` correspondant, puis signale le tour de compaction
comme terminé. Si ce tour terminal dépasse le délai d’expiration configuré pour la compaction,
OpenClaw demande une interruption native du tour. Le bail et le verrou de compaction
propre au fil restent détenus jusqu’à ce que Codex signale l’état terminal ou confirme
le RPC d’interruption. Si Codex ne le confirme pas pendant le délai de grâce
de l’interruption, OpenClaw retire la connexion avant de libérer le verrou. Les connexions
distantes détachent également l’association du fil correspondant afin qu’aucun travail ultérieur ne puisse
chevaucher un tour distant non confirmé. Les autres tours sur une connexion retirée échouent
et peuvent être réessayés sur un nouveau client. La fermeture du client, l’annulation de la demande ou l’échec
d’un tour de compaction renvoie une opération en échec. La compaction automatique due à la pression
du contexte relève de Codex ; OpenClaw ne démarre la compaction native que pour les déclencheurs demandés
manuellement.

Lorsqu’un moteur de contexte demande une projection d’initialisation de fil Codex, OpenClaw
projette les noms et identifiants des appels d’outils, les structures d’entrée et le contenu expurgé
des résultats d’outils dans le nouveau fil Codex. Il ne copie pas les valeurs brutes des arguments
d’appel d’outil dans cette projection.

Le miroir comprend le prompt utilisateur, le texte final de l’assistant ainsi que des enregistrements légers
du raisonnement ou du plan Codex lorsque le serveur d’application les émet. OpenClaw
enregistre le démarrage de la compaction native et son état terminal, mais ne
présente ni résumé lisible de la compaction ni liste vérifiable des
entrées conservées par Codex après la compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit pas les enregistrements natifs de résultats d’outils Codex. Il s’applique uniquement lorsqu’OpenClaw
écrit un résultat d’outil dans une transcription de session appartenant à OpenClaw.

## Médias et diffusion

OpenClaw continue de gérer la diffusion des médias et la sélection du fournisseur de médias. La compréhension
des images, des vidéos, de la musique, des PDF, de la synthèse vocale et des médias utilise les paramètres
de fournisseur et de modèle correspondants, tels que `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` et `messages.tts`.

Le texte, les images, les vidéos, la musique, la synthèse vocale, les approbations et la sortie des outils de messagerie continuent
d’emprunter le mécanisme de diffusion habituel d’OpenClaw ; la génération de médias ne nécessite pas
l’ancien environnement d’exécution. Lorsque Codex émet un élément natif de génération d’image avec un
`savedPath`, OpenClaw transmet ce fichier exact par le mécanisme habituel de
médias de réponse, même si le tour Codex ne comporte aucun texte de l’assistant.

## Pages connexes

- [Harness Codex](/fr/plugins/codex-harness)
- [Référence du harness Codex](/fr/plugins/codex-harness-reference)
- [Supervision Codex](/fr/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [Exportation de trajectoire](/fr/tools/trajectory)
