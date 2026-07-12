---
read_when:
    - Vous avez besoin du contrat de prise en charge de l’environnement d’exécution du harnais Codex
    - Vous déboguez les outils natifs de Codex, les hooks, la compaction ou l’envoi de commentaires
    - Vous modifiez le comportement des plugins dans les tours de harnais OpenClaw et Codex
summary: Limites d’exécution, hooks, outils, autorisations et diagnostics du harnais Codex
title: Environnement d’exécution du harnais Codex
x-i18n:
    generated_at: "2026-07-12T03:02:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrat d’exécution pour les tours du harnais Codex. Pour la configuration et le routage, consultez
[Harnais Codex](/fr/plugins/codex-harness). Pour les champs de configuration, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vue d’ensemble

Codex gère la boucle de modèle native, la reprise native des fils, la
continuation native des outils et la Compaction native. OpenClaw gère le routage
des canaux, les fichiers de session, la remise des messages visibles, les outils
dynamiques OpenClaw, les approbations, la remise des médias et un miroir de la
transcription autour de cette frontière.

Le routage des prompts suit l’environnement d’exécution sélectionné, et pas
seulement la chaîne du fournisseur. Un tour Codex natif reçoit les instructions
destinées aux développeurs du serveur d’application Codex ; une route de
compatibilité OpenClaw explicite conserve le prompt système OpenClaw normal,
même lorsqu’elle utilise une authentification ou un transport OpenAI de type
Codex.

OpenClaw démarre et reprend les fils Codex natifs avec la personnalité intégrée
de Codex désactivée (`personality: "none"`), afin que les fichiers de
personnalité de l’espace de travail et l’identité de l’agent OpenClaw restent
les références faisant autorité. Autrement, le mode Codex natif conserve les
instructions de base et de modèle gérées par Codex ainsi que le chargement de
la documentation du projet. Les exécutions OpenClaw légères, par exemple Cron,
continuent de désactiver le chargement de la documentation du projet.

Les instructions OpenClaw destinées aux développeurs couvrent les
préoccupations liées à l’environnement d’exécution OpenClaw : remise au canal
source, outils dynamiques OpenClaw, délégation ACP, contexte de l’adaptateur et
fichiers de profil actifs de l’espace de travail de l’agent. Les catalogues de
Skills et les pointeurs vers `MEMORY.md` acheminés par les outils sont projetés
sous forme d’instructions de collaboration destinées aux développeurs et
limitées au tour. Lorsque les outils de mémoire sont indisponibles, le contenu
actif de `BOOTSTRAP.md` et l’intégralité de `MEMORY.md` sont à la place ajoutés
au contexte d’entrée en texte brut du tour.

La plupart des outils dynamiques OpenClaw utilisent l’espace de noms
interrogeable `openclaw`. Les outils marqués `catalogMode: "direct-only"`
utilisent `openclaw_direct`, que Codex conserve directement visible par le
modèle sous la forme `DirectModelOnly`, au lieu de l’exposer à une exécution
imbriquée en mode Code.

## Liaisons de fils et changements de modèle

Lorsqu’une session OpenClaw est attachée à un fil Codex existant, le tour
suivant renvoie au serveur d’application le modèle actuellement sélectionné,
la politique d’approbation, le bac à sable, le réviseur des approbations et le
niveau de service. Le passage de `openai/gpt-5.5` à `openai/gpt-5.2` conserve
la liaison au fil, mais demande à Codex de poursuivre avec le modèle
nouvellement sélectionné.

Les liaisons supervisées constituent l’exception. Le sélecteur de modèle
OpenClaw reste verrouillé et les reprises omettent les substitutions de modèle
et de fournisseur afin que Codex restaure le modèle et le fournisseur
persistants du fil canonique. Une commande Codex native distincte peut modifier
cette paire persistante, et l’instantané initial peut produire l’avertissement
normal de Codex signalant une différence de modèle ; le modèle OpenClaw externe
et la chaîne de repli ne se substituent jamais à l’un ou à l’autre.

## Supervision et continuation sûre

La supervision Codex est une fonctionnalité facultative du même Plugin
`codex`. Elle détecte les fils natifs au moyen d’une connexion distincte et ne
projette dans le catalogue du Gateway que les sessions non archivées. En
l’absence de paramètres de connexion `appServer` explicites, cette connexion
utilise l’entrée-sortie standard gérée du répertoire personnel de l’utilisateur,
tandis que le harnais ordinaire reste limité à l’agent. L’énumération et la
lecture des métadonnées sont passives : elles ne reprennent pas un fil,
n’abonnent pas OpenClaw à ses événements en direct et ne répondent pas à ses
demandes d’approbation.

Pour une session enregistrée ou inactive sur l’ordinateur du Gateway,
**Continuer en tant que branche** crée une conversation normale verrouillée sur
le modèle et reproduit un historique limité des messages de l’utilisateur et
de l’assistant jusqu’au dernier tour terminal persistant de la source. Le
premier tour de conversation normale installe les véritables gestionnaires
d’approbation et utilise un embranchement natif temporaire pour figer
l’instantané sans substitution de modèle ni de fournisseur. Codex App Server
utilise sa configuration native actuelle et renvoie la paire sélectionnée ; il
émet son avertissement normal si ce modèle diffère du dernier modèle enregistré
pour la source. Sur la même connexion de supervision, OpenClaw démarre le fil
du harnais Codex canonique dont la source est `appServer`, dans son répertoire
de travail et sous sa politique d’exécution, avec exactement le modèle et le
fournisseur renvoyés pour ce démarrage initial, injecte l’historique visible
limité et archive l’embranchement temporaire. La source n’est jamais reprise.
Le fil canonique dispose de toute la surface d’outils du harnais OpenClaw ; le
raisonnement, les appels d’outils et les résultats d’outils de la source n’y
sont pas clonés. La portée privée de la connexion persiste dans les états de
liaison en attente et validés, de sorte que chaque tour ultérieur reste sur
cette connexion avec la configuration native d’authentification et de
fournisseur. Une supervision désactivée ou une dérive de liaison ou de
connexion provoque un échec fermé au lieu de basculer vers le harnais ordinaire
du répertoire personnel de l’agent.

La source CLI ou VS Code d’origine reste admissible dans les deux catalogues.
La branche canonique est un fil Codex natif, mais son type de source est
`appServer` ; les clients natifs peuvent filtrer ce type de source, de sorte
que son affichage dans Codex Desktop n’est pas garanti.

Les sources actives ne peuvent pas démarrer une nouvelle branche ni être
archivées ; une conversation supervisée existante peut néanmoins être ouverte.
`notLoaded` signifie que l’activité est inconnue, et non que la session est
inactive ; OpenClaw n’autorise l’archivage d’une ligne locale `idle` ou
`notLoaded` qu’après confirmation explicite de l’absence d’un autre processus
d’exécution et une nouvelle lecture locale au processus de l’état. Codex
sérialise les mutations des fils au sein d’un même processus App Server, mais
ne fournit aucun bail exclusif entre processus pour le processus d’exécution ou
le propriétaire des approbations ; cette lecture ne peut donc pas prouver
qu’un autre processus n’utilise pas le fil. OpenClaw bloque un propriétaire de
liaison actif connu pour la cible exacte ou pour tout descendant créé et non
archivé renvoyé par la requête paginée de Codex sur les descendants. Les
erreurs d’énumération, les cycles et l’épuisement de la limite de sécurité
provoquent un échec fermé. L’archivage natif peut encore entrer en concurrence
avec un nouveau tour dans un autre processus ; la confirmation couvre donc les
clients inconnus et l’intervalle entre la lecture de l’état et l’archivage. Une
conversation supervisée verrouillée sur le modèle ne peut pas être supprimée
tant qu’elle protège la liaison native.

Les catalogues de nœuds appairés restent limités aux métadonnées dans la
version initiale. La frontière actuelle d’invocation des nœuds fonctionne en
requête-réponse et ne peut pas transporter les événements de tour de longue
durée, les demandes d’approbation ni la sortie diffusée en continu nécessaires
à une véritable liaison de harnais Codex. Les actions distantes **Continuer**
et **Archiver** restent donc indisponibles, même lorsque la ligne est inactive.

Consultez [Supervision Codex](/fr/plugins/codex-supervision) pour la configuration
par l’opérateur et le comportement visible de l’interface de contrôle.

## Réponses visibles et Heartbeats

Les tours de conversation directs ou provenant de la source via le harnais
Codex utilisent par défaut la remise automatique de la réponse finale de
l’assistant pour les surfaces WebChat internes, conformément au contrat du
harnais Pi : l’agent répond normalement et OpenClaw publie le texte final dans
la conversation source. Définissez `messages.visibleReplies: "message_tool"`
pour garder privé le texte final de l’assistant, sauf si l’agent appelle
`message(action="send")`.

Les tours Heartbeat de Codex reçoivent par défaut `heartbeat_respond` dans le
catalogue interrogeable d’outils OpenClaw, afin que l’agent puisse indiquer si
le réveil doit rester silencieux ou envoyer une notification. Les consignes
d’initiative du Heartbeat sont envoyées sous forme d’instruction Codex de mode
collaboration destinée aux développeurs et limitée au tour Heartbeat ; les
tours de conversation ordinaires restent en mode Codex Default. Lorsque
`HEARTBEAT.md` n’est pas vide, les instructions du Heartbeat indiquent le
fichier à Codex au lieu d’intégrer directement son contenu.

## Frontières des hooks

| Couche                                | Propriétaire              | Objectif                                                               |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité du produit et des Plugins entre les harnais OpenClaw et Codex. |
| Middleware d’extension Codex App Server | Plugins intégrés OpenClaw | Comportement de l’adaptateur à chaque tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique des outils natifs issue de la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` Codex du projet ou globaux pour
acheminer le comportement des Plugins. Pour le pont des outils natifs et des
autorisations, OpenClaw injecte une configuration Codex propre à chaque fil
pour `PreToolUse`, `PostToolUse`, `PermissionRequest` et `Stop`.

Lorsque les approbations du serveur d’application Codex sont activées
(`approvalPolicy` n’est pas `"never"`), la configuration de hooks natifs
injectée par défaut omet `PermissionRequest`, afin que le réviseur du serveur
d’application Codex et le pont d’approbation OpenClaw gèrent les véritables
élévations après examen. Ajoutez `permission_request` à
`nativeHookRelay.events` pour imposer malgré tout le relais de compatibilité.
Les autres hooks Codex, tels que `SessionStart` et `UserPromptSubmit`, restent
des mécanismes de contrôle au niveau de Codex ; ils ne sont pas exposés comme
hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a
demandé l’appel ; le comportement des Plugins et du middleware s’exécute donc
dans l’adaptateur du harnais. Pour les outils natifs de Codex, Codex possède
l’enregistrement canonique de l’outil ; OpenClaw peut reproduire certains
événements, mais ne peut pas réécrire le fil natif sauf si Codex l’expose par
l’intermédiaire du serveur d’application ou de rappels de hooks natifs.

Les événements `PreToolUse` en mode rapport du serveur d’application Codex
reportent l’approbation du Plugin jusqu’à l’approbation correspondante du
serveur d’application. Si un hook OpenClaw `before_tool_call` renvoie
`requireApproval` alors que la charge utile native définit
`openclaw_approval_mode: "report"`, le relais de hook natif enregistre
l’exigence d’approbation du Plugin et ne renvoie aucune décision native.
Lorsque Codex envoie ensuite la demande d’approbation du serveur d’application
pour la même utilisation de l’outil, OpenClaw ouvre la demande d’approbation du
Plugin et retransmet la décision à Codex. Les événements Codex
`PermissionRequest` constituent un chemin d’approbation distinct et peuvent
toujours être acheminés par les approbations OpenClaw lorsque ce pont est
configuré.

Les notifications d’éléments du serveur d’application Codex fournissent
également des observations asynchrones `after_tool_call` pour les exécutions
d’outils natifs qui ne sont pas déjà couvertes par le relais natif
`PostToolUse`. Elles servent uniquement à la télémétrie et à la compatibilité ;
elles ne peuvent ni bloquer, ni retarder, ni modifier l’appel de l’outil natif.

Les projections de Compaction et du cycle de vie du LLM proviennent des
notifications du serveur d’application Codex et de l’état de l’adaptateur
OpenClaw, et non de commandes de hooks natifs Codex. `before_compaction`,
`after_compaction`, `llm_input` et `llm_output` sont des observations au niveau
de l’adaptateur, et non des captures octet par octet de la requête interne ou
des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` du serveur d’application
Codex natif sont projetées sous forme d’événements d’agent
`codex_app_server.hook` pour la trajectoire et le débogage. Elles n’appellent
pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                       | Prise en charge                                                                  | Raison                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Prise en charge                                                                  | Le serveur d’application Codex gère le tour OpenAI, la reprise native des fils et la poursuite native des outils.                                                                                                                                                                                                                                                                                                                                                                          |
| Routage et livraison des canaux OpenClaw      | Prise en charge                                                                  | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’environnement d’exécution du modèle.                                                                                                                                                                                                                                                                                                                                                              |
| Outils dynamiques OpenClaw                    | Prise en charge                                                                  | Codex demande à OpenClaw d’exécuter ces outils, de sorte qu’OpenClaw reste dans le chemin d’exécution.                                                                                                                                                                                                                                                                                                                                                                                     |
| Plugins d’invite et de contexte               | Prise en charge                                                                  | OpenClaw projette l’invite et le contexte propres à OpenClaw dans le tour Codex, tout en laissant les invites de base, de modèle et de documentation de projet configurées, gérées par Codex, dans le chemin natif de Codex. OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent la référence. Les instructions développeur natives de Codex n’acceptent que les consignes de commande explicitement limitées à `codex_app_server` ; les anciennes indications globales de commande restent disponibles pour les surfaces d’invite autres que Codex. |
| Cycle de vie du moteur de contexte            | Prise en charge                                                                  | L’assemblage, l’ingestion et la maintenance après le tour s’exécutent autour des tours Codex. Les moteurs de contexte ne remplacent pas la Compaction native de Codex.                                                                                                                                                                                                                                                                                                                       |
| Hooks d’outils dynamiques                     | Prise en charge                                                                  | `before_tool_call`, `after_tool_call` et l’intergiciel de résultats d’outil s’exécutent autour des outils dynamiques gérés par OpenClaw.                                                                                                                                                                                                                                                                                                                                                     |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles fidèles au mode Codex.                                                                                                                                                                                                                                                                                                                                              |
| Contrôle de révision de la réponse finale     | Pris en charge via le relais de hooks natifs                                      | Le signal `Stop` de Codex est relayé vers `before_agent_finalize` ; `revise` demande à Codex d’effectuer un passage supplémentaire du modèle avant la finalisation.                                                                                                                                                                                                                                                                                                                         |
| Blocage ou observation du shell, des correctifs et de MCP natifs | Pris en charge via le relais de hooks natifs                                      | Les événements `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natifs validées, y compris les charges utiles MCP avec le serveur d’application Codex `0.142.0` ou version ultérieure. Le blocage est pris en charge, mais pas la réécriture des arguments.                                                                                                                                                                                                       |
| Politique d’autorisations natives             | Prise en charge via les approbations du serveur d’application Codex et le relais de compatibilité des hooks natifs | Les demandes d’approbation du serveur d’application Codex sont acheminées par OpenClaw après l’examen de Codex. Le relais du hook natif `PermissionRequest` est facultatif pour les modes d’approbation natifs, car Codex l’émet avant l’examen du gardien.                                                                                                                                                                                                                                     |
| Capture de la trajectoire du serveur d’application | Prise en charge                                                                  | OpenClaw enregistre la requête envoyée au serveur d’application et les notifications reçues de celui-ci.                                                                                                                                                                                                                                                                                                                                                                                   |

Non pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                             | Limite de la v1                                                                                                                                | Évolution future                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Modification des arguments des outils natifs        | Les hooks natifs de pré-exécution d’outil de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs de Codex.      | Nécessite la prise en charge par les hooks ou le schéma Codex du remplacement des entrées d’outil.     |
| Historique modifiable de la transcription native de Codex | Codex gère l’historique canonique des fils natifs. OpenClaw gère un miroir et peut projeter le contexte futur, mais ne doit pas modifier les éléments internes non pris en charge. | Ajouter des API explicites au serveur d’application Codex si une modification des fils natifs est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs de Codex | Ce hook transforme les écritures de transcription gérées par OpenClaw, et non les enregistrements d’outils natifs de Codex.                    | Il serait possible de répliquer les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw peut demander une Compaction native, mais ne reçoit ni liste stable des éléments conservés ou supprimés, ni variation du nombre de jetons, ni résumé d’achèvement, ni charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                             |
| Intervention sur la Compaction                      | OpenClaw ne permet pas aux Plugins ni aux moteurs de contexte d’opposer un veto, de réécrire ou de remplacer la Compaction native de Codex.    | Ajouter des hooks Codex avant et après la Compaction si les Plugins doivent pouvoir opposer un veto ou réécrire la Compaction native. |
| Capture octet par octet de la requête à l’API du modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur de Codex construit en interne la requête finale à l’API OpenAI. | Nécessite un événement de traçage des requêtes du modèle Codex ou une API de débogage.                 |

## Autorisations natives et sollicitations MCP

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites
d’autorisation ou de refus que lorsque la politique statue. L’absence de
décision ne constitue pas une autorisation : Codex l’interprète comme une
absence de décision du hook et poursuit avec son propre gardien ou son propre
processus d’approbation utilisateur.

Par défaut, les modes d’approbation du serveur d’application Codex omettent ce
hook natif. Cela s’applique sauf si `permission_request` est explicitement
inclus dans `nativeHookRelay.events` ou si un environnement d’exécution de
compatibilité l’installe.

Lorsqu’un opérateur choisit `allow-always` pour une demande d’autorisation
native de Codex, OpenClaw mémorise l’empreinte exacte du fournisseur, de la
session, de l’entrée de l’outil et du répertoire de travail pour une période
limitée de la session. La décision mémorisée ne s’applique volontairement
qu’aux correspondances exactes : toute modification de la commande, des
arguments, de la charge utile de l’outil ou du répertoire de travail entraîne
une nouvelle approbation.

Les sollicitations d’approbation des outils MCP de Codex sont acheminées par le
flux d’approbation des Plugins d’OpenClaw lorsque Codex définit
`_meta.codex_approval_kind` sur `"mcp_tool_call"`. Les invites
`request_user_input` de Codex sont renvoyées à la conversation d’origine, et le
prochain message de suivi mis en file d’attente répond à cette requête du
serveur natif au lieu d’être orienté comme contexte supplémentaire. Les autres
demandes de sollicitation MCP sont refusées par défaut.

Pour le flux général d’approbation des Plugins qui transporte ces invites,
consultez [Demandes d’autorisation des Plugins](/fr/plugins/plugin-permission-requests).

## Pilotage de la file d’attente

Le pilotage de la file d’attente d’une exécution active correspond à
`turn/steer` du serveur d’application Codex. Avec la valeur par défaut
`messages.queue.mode: "steer"`, OpenClaw regroupe les messages de conversation
en mode de pilotage pendant la période de silence configurée et les envoie dans
leur ordre d’arrivée sous la forme d’une seule requête `turn/steer`.

Les tours de revue Codex et de Compaction manuelle peuvent refuser le pilotage pendant le même tour. Dans ce cas, OpenClaw attend la fin de l’exécution active avant de lancer le prompt. Utilisez `/queue followup` ou `/queue collect` lorsque les messages doivent être mis en file d’attente par défaut au lieu de piloter le tour. Consultez [File d’attente de pilotage](/fr/concepts/queue-steering).

## Envoi des commentaires Codex

Lorsque `/diagnostics [note]` est approuvé pour une session utilisant le harnais Codex natif, OpenClaw appelle également `feedback/upload` sur le serveur d’application Codex pour les fils Codex concernés, en incluant les journaux de chaque fil répertorié ainsi que ceux des sous-fils Codex générés lorsqu’ils sont disponibles.

L’envoi emprunte le circuit de commentaires normal de Codex vers les serveurs OpenAI. Si les commentaires Codex sont désactivés sur ce serveur d’application, la commande renvoie l’erreur du serveur d’application. La réponse de diagnostic terminée répertorie les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales `codex resume <thread-id>` correspondant aux fils envoyés.

Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex et n’envoie aucun commentaire Codex. Cet envoi ne remplace pas l’exportation locale des diagnostics du Gateway. Consultez [Exportation des diagnostics](/fr/gateway/diagnostics) pour en savoir plus sur l’approbation, la confidentialité, le paquet local et le comportement dans les discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous souhaitez envoyer les commentaires Codex pour le fil actuellement associé, sans le paquet de diagnostics complet du Gateway.

## Compaction et miroir de transcription

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du fil relève du serveur d’application Codex. OpenClaw n’exécute pas de Compaction préliminaire pour les tours Codex, ne remplace pas la Compaction Codex par celle du moteur de contexte et ne se rabat pas sur la synthèse d’OpenClaw ou de l’API publique OpenAI lorsque la Compaction native ne peut pas être lancée. OpenClaw conserve un miroir de transcription pour l’historique du canal, la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais.

Les demandes explicites de Compaction, comme `/compact` ou une opération de Compaction manuelle demandée par un Plugin, lancent la Compaction Codex native avec `thread/compact/start`. OpenClaw maintient la requête et le bail du client partagé ouverts jusqu’à ce que Codex émette l’élément d’achèvement `contextCompaction` correspondant, puis signale que le tour de Compaction est terminé. Si ce tour terminal dépasse le délai d’expiration de Compaction configuré, OpenClaw demande une interruption native du tour. Le bail et le verrou de Compaction propre au fil restent détenus jusqu’à ce que Codex signale un état terminal ou confirme l’appel RPC d’interruption. Si Codex ne confirme pas dans le délai de grâce de l’interruption, OpenClaw retire la connexion avant de libérer le verrou. Les connexions distantes dissocient également la liaison du fil correspondant afin que les travaux ultérieurs ne puissent pas chevaucher un tour distant non confirmé. Les autres tours sur une connexion retirée échouent et peuvent être réessayés avec un nouveau client. La fermeture du client, l’annulation de la requête ou l’échec d’un tour de Compaction renvoie une opération ayant échoué. La Compaction automatique due à la pression du contexte relève de Codex ; OpenClaw ne lance la Compaction native que pour les déclencheurs demandés manuellement.

Lorsqu’un moteur de contexte demande la projection d’amorçage d’un fil Codex, OpenClaw projette dans le nouveau fil Codex les noms et identifiants des appels d’outils, les structures d’entrée et le contenu expurgé des résultats d’outils. Il ne copie pas les valeurs brutes des arguments d’appels d’outils dans cette projection.

Le miroir inclut le prompt de l’utilisateur, le texte final de l’assistant et des enregistrements légers du raisonnement ou du plan Codex lorsque le serveur d’application les émet. OpenClaw enregistre le démarrage de la Compaction native et son état terminal, mais ne présente ni résumé de Compaction lisible par un humain ni liste vérifiable des entrées conservées par Codex après la Compaction.

Comme Codex détient le fil natif canonique, `tool_result_persist` ne réécrit pas les enregistrements natifs de résultats d’outils Codex. Il ne s’applique que lorsqu’OpenClaw écrit un résultat d’outil dans la transcription d’une session détenue par OpenClaw.

## Médias et diffusion

OpenClaw continue de gérer la diffusion des médias et la sélection de leur fournisseur. La compréhension des images, des vidéos, de la musique, des PDF, de la synthèse vocale et des médias utilise les paramètres de fournisseur et de modèle correspondants, tels que `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et `messages.tts`.

Le texte, les images, les vidéos, la musique, la synthèse vocale, les approbations et les sorties des outils de messagerie continuent d’emprunter le circuit de diffusion normal d’OpenClaw ; la génération de médias ne nécessite pas l’ancien environnement d’exécution. Lorsque Codex émet un élément natif de génération d’image comportant un `savedPath`, OpenClaw transmet ce fichier exact par le circuit normal des médias de réponse, même si le tour Codex ne contient aucun texte de l’assistant.

## Voir aussi

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Supervision de Codex](/fr/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Points d’extension des Plugins](/fr/plugins/hooks)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [Exportation de trajectoire](/fr/tools/trajectory)
