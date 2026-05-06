---
read_when:
    - Vous voulez utiliser le harnais app-server Codex fourni
    - Il vous faut des exemples de configuration du harnais Codex
    - Vous voulez que les déploiements réservés à Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-06T09:02:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqués via le
serveur d’application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d’agent de bas niveau : découverte
des modèles, reprise native de fil, Compaction native et exécution par le serveur d’application.
OpenClaw possède toujours les canaux de chat, les fichiers de session, la sélection de modèle, les outils,
les approbations, la livraison des médias et le miroir visible de la transcription.

Lorsqu’un tour de chat source s’exécute via le harnais Codex, les réponses visibles utilisent par défaut
l’outil OpenClaw `message` si le déploiement n’a pas explicitement configuré
`messages.visibleReplies`. L’agent peut toujours terminer son tour Codex en privé ;
il ne publie sur le canal que lorsqu’il appelle `message(action="send")`. Définissez
`messages.visibleReplies: "automatic"` pour conserver les réponses finales de chat direct sur le
chemin hérité de livraison automatique.

Les tours Heartbeat Codex reçoivent aussi l’outil `heartbeat_respond` par défaut, afin que
l’agent puisse indiquer si le réveil doit rester silencieux ou notifier sans encoder
ce flux de contrôle dans le texte final.

Les consignes d’initiative propres au Heartbeat sont envoyées comme une instruction développeur
du mode de collaboration Codex sur le tour Heartbeat lui-même. Les tours de chat ordinaires restaurent
le mode Codex Default au lieu d’emporter la philosophie Heartbeat dans leur invite
d’exécution normale.

Si vous essayez de vous orienter, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Configuration rapide

La plupart des utilisateurs qui veulent « Codex dans OpenClaw » veulent cette route : se connecter avec un
abonnement ChatGPT/Codex, puis exécuter les tours d’agent embarqués via le runtime natif
du serveur d’application Codex. La référence de modèle reste canonique sous la forme
`openai/gpt-*` ; l’authentification par abonnement vient du compte/profil Codex, pas
d’un préfixe de modèle `openai-codex/*`.

Connectez-vous d’abord avec Codex OAuth si ce n’est pas déjà fait :

```bash
openclaw models auth login --provider openai-codex
```

Activez ensuite le plugin `codex` intégré et forcez le runtime Codex :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, incluez-y aussi `codex` :

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

N’utilisez pas `openai-codex/gpt-*` dans la configuration. Ce préfixe est une route héritée que
`openclaw doctor --fix` réécrit en `openai/gpt-*` dans les modèles principaux,
les solutions de repli, les remplacements Heartbeat/sous-agent/Compaction, les hooks, les remplacements de canal,
et les anciens pins de route de session persistés.

## Ce que ce plugin change

Le plugin `codex` intégré apporte plusieurs capacités distinctes :

| Capacité                          | Comment l’utiliser                                  | Ce qu’elle fait                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime embarqué natif            | `agentRuntime.id: "codex"`                          | Exécute les tours d’agent embarqués OpenClaw via le serveur d’application Codex. |
| Commandes natives de contrôle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les fils du serveur d’application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur d’application Codex | internes `codex`, exposés via le harnais           | Permet au runtime de découvrir et valider les modèles du serveur d’application. |
| Chemin de compréhension des médias Codex | chemins de compatibilité des modèles d’image `codex/*` | Exécute des tours bornés du serveur d’application Codex pour les modèles de compréhension d’image pris en charge. |
| Relais de hook natif              | Hooks de Plugin autour des événements natifs Codex  | Permet à OpenClaw d’observer/bloquer les événements natifs Codex pris en charge de type outil/finalisation. |

Activer le plugin rend ces capacités disponibles. Cela ne fait **pas** :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` vers le runtime natif sans que doctor
  vérifie que Codex est installé, activé, fournit le harnais `codex`,
  et est prêt pour OAuth
- faire d’ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un runtime PI
- remplacer la livraison de canal OpenClaw, les fichiers de session, le stockage des profils d’authentification ou
  le routage des messages

Le même plugin possède aussi la surface de commande native `/codex` de contrôle de chat. Si
le plugin est activé et que l’utilisateur demande à lier, reprendre, piloter, arrêter ou inspecter
des fils Codex depuis le chat, les agents doivent préférer `/codex ...` à ACP. ACP reste
le repli explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur ACP
Codex.

Les tours Codex natifs gardent les hooks de Plugin OpenClaw comme couche publique de compatibilité.
Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription mis en miroir
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les plugins peuvent aussi enregistrer un middleware de résultats d’outil neutre vis-à-vis du runtime pour réécrire
les résultats d’outils dynamiques OpenClaw après l’exécution de l’outil par OpenClaw et avant que le
résultat soit renvoyé à Codex. C’est distinct du hook de Plugin public
`tool_result_persist`, qui transforme les écritures de résultats d’outil de transcription possédées par OpenClaw.

Pour la sémantique des hooks de Plugin eux-mêmes, consultez [Hooks de Plugin](/fr/plugins/hooks)
et [Comportement de garde de Plugin](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent garder les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
veulent une exécution native par serveur d’application. Les références de modèle héritées `codex/*` sélectionnent encore automatiquement
le harnais pour compatibilité, mais les préfixes de fournisseurs hérités adossés à un runtime ne sont
pas affichés comme choix normaux de modèle/fournisseur.

Si une route de modèle configurée est encore `openai-codex/*`, `openclaw doctor --fix`
la réécrit en `openai/*`. Pour les routes d’agent correspondantes, il définit le runtime d’agent
sur `codex` uniquement lorsque le plugin Codex est installé, activé, fournit le
harnais `codex` et dispose d’un OAuth utilisable ; sinon il définit le runtime sur `pi`.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                              | Référence de modèle        | Configuration du runtime              | Route auth/profil            | Libellé d’état attendu         |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Abonnement ChatGPT/Codex avec runtime Codex natif  | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth ou compte Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI via le runner OpenClaw normal           | `openai/gpt-*`             | omis ou `runtime: "pi"`                | Clé API OpenAI               | `Runtime: OpenClaw Pi Default` |
| Configuration héritée nécessitant une réparation doctor | `openai-codex/gpt-*`       | réparé vers `codex` ou `pi`            | Auth configurée existante    | Revérifier après `doctor --fix` |
| Fournisseurs mixtes avec mode auto conservateur    | références propres au fournisseur | `agentRuntime.id: "auto"`              | Par fournisseur sélectionné  | Dépend du runtime sélectionné  |
| Session explicite d’adaptateur ACP Codex           | dépend de l’invite/modèle ACP | `sessions_spawn` avec `runtime: "acp"` | Auth du backend ACP          | État de tâche/session ACP      |

La séparation importante est fournisseur contre runtime :

- `openai-codex/*` est une route héritée que doctor réécrit.
- `agentRuntime.id: "codex"` nécessite le harnais Codex et échoue fermé s’il
  est indisponible.
- `agentRuntime.id: "auto"` laisse les harnais enregistrés revendiquer les routes de fournisseur
  correspondantes, mais les références OpenAI canoniques restent possédées par PI sauf si un harnais prend en charge
  cette paire fournisseur/modèle.
- `/codex ...` répond à « quelle conversation Codex native ce chat doit-il lier
  ou contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI sont spécifiques au préfixe. Pour la configuration courante abonnement plus
runtime Codex natif, utilisez `openai/*` avec `agentRuntime.id: "codex"`.
Traitez `openai-codex/*` comme une configuration héritée que doctor doit réécrire :

| Référence de modèle                          | Chemin de runtime                            | À utiliser lorsque                                                        |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez un accès actuel direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Route héritée réparée par doctor             | Vous êtes sur une ancienne configuration ; exécutez `openclaw doctor --fix` pour la réécrire. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harnais du serveur d’application Codex       | Vous voulez l’authentification par abonnement ChatGPT/Codex avec l’exécution Codex native. |

GPT-5.5 peut apparaître à la fois sur les routes directes OpenAI à clé API et sur les routes d’abonnement Codex
lorsque votre compte les expose. Utilisez `openai/gpt-5.5` avec le harnais du serveur d’application Codex
pour le runtime Codex natif, ou `openai/gpt-5.5` sans remplacement de runtime Codex
pour le trafic direct à clé API.

Les références héritées `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité
doctor réécrit les références de runtime héritées en références de modèle canoniques
et enregistre la politique de runtime séparément. Les nouvelles configurations du harnais natif de serveur d’application
doivent utiliser `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation de préfixe. Utilisez
`openai/gpt-*` pour la route OpenAI normale et `codex/gpt-*` lorsque la compréhension
d’image doit s’exécuter via un tour borné du serveur d’application Codex. N’utilisez pas
`openai-codex/gpt-*` ; doctor réécrit ce préfixe hérité en `openai/gpt-*`. Le
modèle du serveur d’application Codex doit déclarer la prise en charge de l’entrée image ; les modèles Codex
texte seul échouent avant le démarrage du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du gateway. Il
inclut l’id du harnais sélectionné, la raison de la sélection, la politique runtime/repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

### Ce que signifient les avertissements doctor

`openclaw doctor` avertit lorsque les références de modèle configurées ou l’état de route de session persisté
utilisent encore `openai-codex/*`. `openclaw doctor --fix` réécrit ces routes
en :

- `openai/<model>`
- `agentRuntime.id: "codex"` lorsque Codex est installé, activé, fournit le
  harnais `codex` et dispose d’un OAuth utilisable
- `agentRuntime.id: "pi"` sinon

La route `codex` force le harnais Codex natif. La route `pi` garde
l’agent sur le runner OpenClaw par défaut au lieu d’activer ou d’installer Codex comme
effet de bord du nettoyage des routes héritées.
Doctor répare aussi les anciens pins de session persistés dans les magasins de sessions d’agent
découverts afin que les anciennes conversations ne restent pas bloquées sur la route supprimée.

La sélection du harnais n’est pas un contrôle de session active. Lorsqu’un tour intégré s’exécute,
OpenClaw enregistre l’id du harnais sélectionné sur cette session et continue à l’utiliser pour
les tours suivants avec le même id de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de faire basculer une
conversation existante entre PI et Codex. Cela évite de rejouer une même transcription via
deux systèmes de session natifs incompatibles.

Les sessions héritées créées avant les épingles de harnais sont considérées comme épinglées sur PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour rattacher cette conversation à
Codex après avoir modifié la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais app-server Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le Plugin `codex` fourni disponible.
- Codex app-server `0.125.0` ou plus récent. Le Plugin fourni gère par défaut un binaire
  Codex app-server compatible, donc les commandes `codex` locales dans `PATH`
  n’affectent pas le démarrage normal du harnais.
- Auth Codex disponible pour le processus app-server ou pour le pont d’auth Codex
  d’OpenClaw. Les lancements app-server locaux utilisent un répertoire d’accueil Codex géré par OpenClaw pour chaque
  agent et un `HOME` enfant isolé, de sorte qu’ils ne lisent pas par défaut votre compte
  `~/.codex` personnel, vos Skills, vos plugins, votre configuration, l’état des threads ni les Skills natifs
  `$HOME/.agents/skills`.

Le Plugin bloque les handshakes app-server plus anciens ou non versionnés. Cela maintient
OpenClaw sur la surface de protocole sur laquelle il a été testé.

Pour les tests live et les smoke tests Docker, l’auth vient généralement du compte CLI Codex
ou d’un profil d’auth OpenClaw `openai-codex`. Les lancements app-server stdio locaux peuvent
aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun compte n’est présent.

## Fichiers d’initialisation de l’espace de travail

Codex gère `AGENTS.md` lui-même via la découverte native des documents de projet. OpenClaw
n’écrit pas de fichiers de documents de projet Codex synthétiques et ne dépend pas des noms de fichiers de secours
Codex pour les fichiers de persona, car les solutions de secours Codex ne s’appliquent que lorsque
`AGENTS.md` est absent.

Pour la parité d’espace de travail OpenClaw, le harnais Codex résout les autres fichiers d’initialisation
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` et `MEMORY.md` lorsqu’il est présent) et les transmet via les instructions développeur Codex
sur `thread/start` et `thread/resume`. Cela garde
`SOUL.md` et le contexte de persona/profil d’espace de travail associé visibles sur la voie native
de façonnage du comportement Codex sans dupliquer `AGENTS.md`.

## Ajouter Codex aux côtés d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et des modèles de fournisseurs non-Codex. Un runtime forcé s’applique à chaque
tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw essaie quand même le harnais Codex et échoue de manière fermée
au lieu d’acheminer silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placer Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Garder l’agent par défaut sur `agentRuntime.id: "auto"` et le repli PI pour un usage mixte normal
  des fournisseurs.
- Utiliser les références héritées `codex/*` uniquement pour la compatibilité. Les nouvelles configurations devraient privilégier
  `openai/*` avec une politique de runtime Codex explicite.

Par exemple, ceci garde l’agent par défaut sur la sélection automatique normale et
ajoute un agent Codex séparé :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Avec cette forme :

- L’agent `main` par défaut utilise le chemin de fournisseur normal et le repli de compatibilité PI.
- L’agent `codex` utilise le harnais Codex app-server.
- Si Codex est absent ou non pris en charge pour l’agent `codex`, le tour échoue
  au lieu d’utiliser discrètement PI.

## Routage des commandes d’agent

Les agents devraient router les requêtes utilisateur selon l’intention, pas seulement selon le mot « Codex » :

| L’utilisateur demande...                               | L’agent devrait utiliser...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| « Lier ce chat à Codex »                               | `/codex bind`                                    |
| « Reprendre le thread Codex `<id>` ici »               | `/codex resume <id>`                             |
| « Afficher les threads Codex »                         | `/codex threads`                                 |
| « Déposer un rapport de support pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoyer seulement des retours Codex pour ce thread joint » | `/codex diagnostics [note]`                      |
| « Utiliser mon abonnement ChatGPT/Codex avec le runtime Codex » | `openai/*` plus `agentRuntime.id: "codex"`       |
| « Réparer les anciennes épingles de configuration/session `openai-codex/*` » | `openclaw doctor --fix`                          |
| « Exécuter Codex via ACP/acpx »                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un thread » | ACP/acpx, pas `/codex` ni les sous-agents natifs |

OpenClaw n’annonce aux agents les consignes de spawn ACP que lorsque ACP est activé,
dispatchable et adossé à un backend de runtime chargé. Si ACP n’est pas disponible,
le prompt système et les Skills du Plugin ne devraient pas enseigner à l’agent le routage
ACP.

## Déploiements Codex uniquement

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent intégré
utilise Codex. Les runtimes de Plugin explicites échouent de manière fermée et ne sont jamais retentés silencieusement
via PI :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Remplacement par variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si
l’app-server est trop ancien ou si l’app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent uniquement Codex pendant que l’agent par défaut garde la
sélection automatique normale :

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session normales pour changer d’agents et de modèles. `/new` crée une nouvelle
session OpenClaw et le harnais Codex crée ou reprend son thread app-server sidecar
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce thread
et permet au tour suivant de résoudre à nouveau le harnais à partir de la configuration actuelle.

## Découverte des modèles

Par défaut, le Plugin Codex demande à l’app-server les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de repli fourni pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Vous pouvez ajuster la découverte sous `plugins.entries.codex.config.discovery` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et s’en tienne au
catalogue de repli :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connexion et politique app-server

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est livré avec le package du Plugin `codex`. Cela garde la
version de l’app-server liée au Plugin fourni au lieu de n’importe quelle CLI Codex séparée
installée localement. Définissez `appServer.command` uniquement lorsque
vous voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. C’est la posture d’opérateur local de confiance utilisée
pour les Heartbeat autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est là pour répondre.

Pour opter pour les approbations relues par le gardien Codex, définissez `appServer.mode:
"guardian"` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Le mode gardien utilise le chemin d’approbation d’auto-review natif de Codex. Lorsque Codex demande à
quitter le sandbox, à écrire hors de l’espace de travail ou à ajouter des autorisations comme l’accès
réseau, Codex route cette demande d’approbation vers le relecteur natif au lieu d’une
invite humaine. Le relecteur applique le cadre de risque de Codex et approuve ou refuse
la requête précise. Utilisez Guardian lorsque vous voulez plus de garde-fous que le mode YOLO
mais devez quand même permettre aux agents sans surveillance de progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, donc les déploiements avancés peuvent combiner
le préréglage avec des choix explicites. L’ancienne valeur de relecteur `guardian_subagent` est
toujours acceptée comme alias de compatibilité, mais les nouvelles configurations devraient utiliser
`auto_review`.

Pour un app-server déjà en cours d’exécution, utilisez le transport WebSocket :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Les lancements app-server stdio héritent par défaut de l’environnement de processus d’OpenClaw,
mais OpenClaw possède le pont de compte app-server Codex et définit à la fois
`CODEX_HOME` et `HOME` sur des répertoires par agent sous l’état OpenClaw de cet agent.
Le chargeur de Skills propre à Codex lit `$CODEX_HOME/skills` et
`$HOME/.agents/skills`, donc les deux valeurs sont isolées pour les lancements app-server
locaux. Cela garde les Skills, plugins, configurations, comptes et états de thread natifs Codex
limités à l’agent OpenClaw au lieu de fuir depuis le répertoire personnel CLI Codex
de l’opérateur.

Les plugins OpenClaw et les instantanés de Skills OpenClaw continuent à passer par le
registre de Plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles de la CLI Codex
ne le font pas. Si vous avez des Skills ou plugins CLI Codex utiles qui devraient intégrer un agent OpenClaw,
inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l’espace de travail de l’agent OpenClaw actuel.
Les plugins natifs Codex, hooks et fichiers de configuration sont signalés ou archivés
pour examen manuel au lieu d’être activés automatiquement, car ils peuvent
exécuter des commandes, exposer des serveurs MCP ou contenir des identifiants.

L’auth est sélectionnée dans cet ordre :

1. Un profil d’auth Codex OpenClaw explicite pour l’agent.
2. Le compte existant de l’app-server dans le répertoire d’accueil Codex de cet agent.
3. Pour les lancements app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’auth OpenAI est
   toujours requise.

Quand OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
permet de garder les clés API au niveau du Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer par erreur les tours du serveur d’application Codex natif via l’API.
Les profils Codex explicites par clé API et le repli local sur une clé d’environnement stdio utilisent la connexion au serveur d’application
au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket au serveur d’application
ne reçoivent pas le repli par clé API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le
compte propre du serveur d’application distant.

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces variables à
`appServer.clearEnv` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` n’affecte que le processus enfant du serveur d’application Codex lancé.

Les outils dynamiques Codex utilisent par défaut le profil `native-first`. Dans ce mode,
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations d’espace de travail
natives de Codex : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et
`update_plan`. Les outils d’intégration OpenClaw tels que la messagerie, les sessions, les médias,
cron, le navigateur, les nœuds, gateway, `heartbeat_respond` et `web_search` restent
disponibles.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Par défaut      | Signification                                                                                      |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Utilisez `"openclaw-compat"` pour exposer l’ensemble complet des outils dynamiques OpenClaw au serveur d’application Codex. |
| `codexDynamicToolsExclude` | `[]`             | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours du serveur d’application Codex. |

Champs `appServer` pris en charge :

| Champ               | Par défaut                              | Signification                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                             |
| `command`           | binaire Codex géré                       | Exécutable pour le transport stdio. Laissez-le non défini pour utiliser le binaire géré ; définissez-le uniquement pour un remplacement explicite.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                       |
| `url`               | non défini                               | URL WebSocket du serveur d’application.                                                                                                                                                                                                            |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Noms de variables d’environnement supplémentaires supprimés du processus serveur d’application stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels du plan de contrôle du serveur d’application.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou revue par guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation Codex native envoyée au démarrage, à la reprise ou au tour du fil.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex natif envoyé au démarrage ou à la reprise du fil.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                                         |
| `serviceTier`       | non défini                               | Niveau de service facultatif du serveur d’application Codex : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées.                                                                                                                            |

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas de délai d’expiration, OpenClaw interrompt le signal de l’outil
lorsque c’est pris en charge et renvoie une réponse d’outil dynamique en échec à Codex afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête serveur d’application limitée au tour Codex, le harnais
attend également que Codex termine le tour natif avec `turn/completed`. Si le
serveur d’application reste silencieux pendant 60 secondes après cette réponse, OpenClaw tente, au mieux,
d’interrompre le tour Codex, enregistre un délai d’expiration de diagnostic et libère la
voie de session OpenClaw afin que les messages de discussion suivants ne soient pas mis en file d’attente derrière un
ancien tour natif obsolète.

Les remplacements d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférée pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans le
même fichier relu que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur est couverte dans son propre guide de configuration :
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use).

En bref : OpenClaw ne vendore pas l’application de contrôle du bureau et n’exécute pas
lui-même les actions de bureau. Il prépare le serveur d’application Codex, vérifie que le
serveur MCP `computer-use` est disponible, puis laisse Codex gérer les appels d’outils
MCP natifs pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux de la marketplace Codex, enregistrez
`cua-driver mcp` avec `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consultez [Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use) pour la distinction
entre l’utilisation de l’ordinateur appartenant à Codex et l’enregistrement MCP direct.

Configuration minimale :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

La configuration peut être vérifiée ou installée depuis la surface de commande :

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

L’utilisation de l’ordinateur est spécifique à macOS et peut nécessiter des autorisations locales du système d’exploitation avant que le
serveur MCP Codex puisse contrôler des applications. Si `computerUse.enabled` vaut true et que le serveur MCP
est indisponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils natifs d’utilisation de l’ordinateur. Consultez
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les raisons d’état et le dépannage.

Lorsque `computerUse.autoInstall` vaut true, OpenClaw peut enregistrer la marketplace Codex Desktop
standard fournie depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace locale. Utilisez `/new` ou `/reset` après
avoir modifié la configuration du runtime ou de l’utilisation de l’ordinateur afin que les sessions existantes ne conservent pas une ancienne
liaison de fil PI ou Codex.

## Recettes courantes

Codex local avec le transport stdio par défaut :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validation du harnais Codex uniquement :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approbations Codex revues par guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Serveur d’application distant avec en-têtes explicites :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Le changement de modèle reste contrôlé par OpenClaw. Lorsqu’une session OpenClaw est attachée
à un fil Codex existant, le tour suivant envoie à nouveau au serveur d’application le modèle
OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service actuellement sélectionnés.
Le passage de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la liaison au
fil, mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le Plugin fourni enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct du serveur d’application, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` répertorie les modèles en direct du serveur d’application Codex.
- `/codex threads [filter]` répertorie les threads Codex récents.
- `/codex resume <thread-id>` rattache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le thread rattaché.
- `/codex review` lance la revue native Codex pour le thread rattaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours de diagnostic Codex pour le thread rattaché.
- `/codex computer-use status` vérifie le Plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le Plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` répertorie l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` répertorie les Skills du serveur d’application Codex.

Quand Codex signale un échec lié à une limite d’utilisation, OpenClaw inclut l’heure de réinitialisation suivante du serveur d’application quand Codex en a fourni une. Utilisez `/codex account` dans la même conversation pour inspecter le compte actuel et les fenêtres de limites de débit.

### Workflow de débogage courant

Quand un agent adossé à Codex fait quelque chose d’inattendu dans Telegram, Discord, Slack ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre note courte qui décrit ce que vous avez observé.
2. Approuvez la demande de diagnostics une fois. L’approbation crée le fichier zip de diagnostics local du Gateway et, comme la session utilise le harnais Codex, envoie aussi le paquet de retours Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bug ou le fil de support. Elle inclut le chemin du paquet local, le résumé de confidentialité, les identifiants de session OpenClaw, les identifiants de thread Codex et une ligne `Inspect locally` pour chaque thread Codex.
4. Si vous voulez déboguer l’exécution vous-même, lancez la commande `Inspect locally` affichée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le thread Codex natif afin que vous puissiez inspecter la conversation, la poursuivre localement ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser les retours Codex pour le thread actuellement rattaché sans le paquet complet de diagnostics du Gateway OpenClaw. Pour la plupart des rapports de support, `/diagnostics [note]` est le meilleur point de départ, car il relie l’état local du Gateway et les identifiants de thread Codex dans une seule réponse. Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité complet et le comportement dans les discussions de groupe.

Le cœur d’OpenClaw expose aussi `/diagnostics [note]`, réservé au propriétaire, comme commande générale de diagnostics du Gateway. Son invite d’approbation affiche le préambule relatif aux données sensibles, contient des liens vers [Export de diagnostics](/fr/gateway/diagnostics), et demande `openclaw gateway diagnostics export --json` au moyen d’une approbation d’exécution explicite à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation, OpenClaw envoie un rapport copiable avec le chemin du paquet local et le résumé du manifeste. Lorsque la session OpenClaw active utilise le harnais Codex, cette même approbation autorise aussi l’envoi des paquets de retours Codex pertinents aux serveurs OpenAI. L’invite d’approbation indique que les retours Codex seront envoyés, mais ne liste pas les identifiants de session ou de thread Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une discussion de groupe, OpenClaw garde le canal partagé propre : le groupe ne reçoit qu’un court avis, tandis que le préambule de diagnostics, les invites d’approbation et les identifiants de session/thread Codex sont envoyés au propriétaire par la route d’approbation privée. S’il n’existe pas de route privée vers le propriétaire, OpenClaw refuse la demande de groupe et demande au propriétaire de l’exécuter depuis un message direct.

Le téléversement Codex approuvé appelle `feedback/upload` sur le serveur d’application Codex et demande au serveur d’application d’inclure les journaux de chaque thread listé et des sous-threads Codex lancés, quand ils sont disponibles. Le téléversement passe par le chemin normal de retours Codex vers les serveurs OpenAI ; si les retours Codex sont désactivés dans ce serveur d’application, la commande renvoie l’erreur du serveur d’application. La réponse de diagnostics terminée liste les canaux, les identifiants de session OpenClaw, les identifiants de thread Codex et les commandes locales `codex resume <thread-id>` pour les threads qui ont été envoyés. Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex. Ce téléversement ne remplace pas l’export de diagnostics local du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le modèle OpenClaw actuellement sélectionné au serveur d’application et garde l’historique étendu activé.

### Inspecter un thread Codex depuis la CLI

Le moyen le plus rapide de comprendre une mauvaise exécution Codex est souvent d’ouvrir directement le thread Codex natif :

```sh
codex resume <thread-id>
```

Utilisez cela quand vous remarquez un bug dans une conversation de canal et voulez inspecter la session Codex problématique, la poursuivre localement ou demander à Codex pourquoi il a fait un choix particulier d’outil ou de raisonnement. Le chemin le plus simple consiste généralement à exécuter d’abord `/diagnostics [note]` : après votre approbation, le rapport terminé liste chaque thread Codex et affiche une commande `Inspect locally`, par exemple `codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un terminal.

Vous pouvez aussi obtenir un identifiant de thread depuis `/codex binding` pour la discussion actuelle ou `/codex threads [filter]` pour les threads récents du serveur d’application Codex, puis exécuter la même commande `codex resume` dans votre shell.

La surface de commande exige le serveur d’application Codex `0.125.0` ou plus récent. Les méthodes de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un serveur d’application futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire             | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/Plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex de bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router le comportement des Plugins OpenClaw. Pour le pont pris en charge entre outils natifs et permissions, OpenClaw injecte une configuration Codex par thread pour `PreToolUse`, `PostToolUse`, `PermissionRequest` et `Stop`. Les autres hooks Codex comme `SessionStart` et `UserPromptSubmit` restent des contrôles au niveau Codex ; ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware qu’il possède dans l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement d’outil canonique. OpenClaw peut refléter certains événements, mais ne peut pas réécrire le thread Codex natif sauf si Codex expose cette opération via le serveur d’application ou des rappels de hooks natifs.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application Codex et de l’état de l’adaptateur OpenClaw, pas des commandes de hooks natifs Codex. Les événements `before_compaction`, `after_compaction`, `llm_input` et `llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, pas des captures octet pour octet de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur d’application sont projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage. Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Le mode Codex n’est pas PI avec un autre appel de modèle sous-jacent. Codex possède une plus grande partie de la boucle de modèle native, et OpenClaw adapte ses surfaces de Plugin et de session autour de cette limite.

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                         | Pourquoi                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                          | Le serveur d’application Codex possède le tour OpenAI, la reprise de thread natif et la continuation d’outil native.                                                                                  |
| Routage et livraison des canaux OpenClaw      | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime de modèle.                                                                                             |
| Outils dynamiques OpenClaw                    | Pris en charge                          | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                       |
| Plugins de prompt et de contexte              | Pris en charge                          | OpenClaw construit des superpositions de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le thread.                                                               |
| Cycle de vie du moteur de contexte            | Pris en charge                          | L’assemblage, l’ingestion ou la maintenance après tour, et la coordination de Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                       |
| Hooks d’outils dynamiques                     | Pris en charge                          | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                            |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes du mode Codex.                                                       |
| Porte de révision de réponse finale           | Pris en charge via le relais de hook natif | Codex `Stop` est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                            |
| Blocage ou observation du shell natif, des patchs et de MCP | Pris en charge via le relais de hook natif | Codex `PreToolUse` et `PostToolUse` sont relayés pour les surfaces d’outils natifs engagées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permissions native               | Pris en charge via le relais de hook natif | Codex `PermissionRequest` peut être routé via la politique OpenClaw là où le runtime l’expose. Si OpenClaw ne renvoie aucune décision, Codex continue par son gardien normal ou son chemin d’approbation utilisateur. |
| Capture de trajectoire du serveur d’application | Pris en charge                        | OpenClaw enregistre la requête envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                           |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite V1                                                                                                                                       | Évolution future                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks pré-outil natifs de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs de Codex.                    | Nécessite la prise en charge par les hooks/schémas Codex du remplacement de l’entrée d’outil. |
| Historique de transcript natif Codex modifiable     | Codex possède l’historique canonique des threads natifs. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas modifier des éléments internes non pris en charge. | Ajouter des API explicites de serveur d’application Codex si une chirurgie du thread natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcript appartenant à OpenClaw, pas les enregistrements d’outils natifs Codex.                          | Pourrait refléter les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de compaction native             | OpenClaw observe le début et la fin de la compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de tokens, ni de charge utile de résumé. | Nécessite des événements de compaction Codex plus riches.                                  |
| Intervention sur la compaction                      | Les hooks de compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                             | Ajouter des hooks Codex pré/post-compaction si les plugins doivent opposer un veto ou réécrire la compaction native. |
| Capture exacte octet pour octet de la requête d’API de modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le noyau Codex construit en interne la requête finale de l’API OpenAI. | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.       |

## Outils, médias et compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques du
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hooks natifs est volontairement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils et de permissions natifs Codex qu’OpenClaw teste. Dans
le runtime Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex est une surface de plugin OpenClaw tant que le contrat de runtime ne le nomme pas
explicitement.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de
décision de hook et passe à son propre chemin de protection ou d’approbation utilisateur.

Les sollicitations d’approbation d’outils MCP Codex sont routées via le flux
d’approbation de plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées au
chat d’origine, et le message de suivi suivant dans la file répond à cette requête de serveur
native au lieu d’être orienté comme contexte supplémentaire. Les autres requêtes de sollicitation MCP
échouent toujours de manière fermée.

L’orientation de file d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
mode par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` séparées. Les tours de
revue Codex et de compaction manuelle peuvent rejeter l’orientation pendant le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise le repli. Voir
[File d’orientation](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la compaction du thread natif est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir du transcript pour l’historique des canaux,
la recherche, `/new`, `/reset` et le futur basculement de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw ne
consigne que les signaux de début et de fin de compaction native. Il n’expose pas encore de
résumé de compaction lisible par l’humain ni de liste vérifiable des entrées que Codex
a conservées après compaction.

Comme Codex possède le thread natif canonique, `tool_result_persist` ne réécrit pas
actuellement les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil de transcript de session appartenant à OpenClaw.

La génération de médias ne nécessite pas PI. L’image, la vidéo, la musique, le PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** c’est attendu pour
les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une référence héritée `codex/*`), activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut toujours utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne prend en charge l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Un
runtime Codex forcé échoue au lieu de se rabattre sur PI. Une fois le serveur d’application Codex
sélectionné, ses échecs remontent directement.

**Le serveur d’application est rejeté :** mettez Codex à niveau afin que la négociation avec le serveur d’application
signale la version `0.125.0` ou plus récente. Les préversions de même version ou les versions suffixées par build
comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car le
plancher de protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`
et que le serveur d’application distant parle la même version du protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une référence héritée
`codex/*`. Les références simples `openai/gpt-*` et les autres références de fournisseurs restent sur leur chemin
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque tour intégré
pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si cela persiste, redémarrez
le gateway pour effacer les inscriptions obsolètes de hooks natifs. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop et réessayez.

## Connexe

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
