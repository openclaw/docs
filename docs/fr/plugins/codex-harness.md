---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex intégré
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements exclusivement Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours d’agent embarqué d’OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-07T01:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin `codex` inclus permet à OpenClaw d'exécuter des tours d'agent embarqués via le serveur d'application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d'agent de bas niveau : découverte des modèles, reprise native de thread, compaction native et exécution par le serveur d'application. OpenClaw conserve la gestion des canaux de chat, des fichiers de session, de la sélection du modèle, des outils, des approbations, de la livraison des médias et du miroir visible de la transcription.

Lorsqu'un tour de chat source s'exécute via le harnais Codex, les réponses visibles utilisent par défaut l'outil OpenClaw `message` si le déploiement n'a pas explicitement configuré `messages.visibleReplies`. L'agent peut toujours terminer son tour Codex en privé ; il ne publie dans le canal que lorsqu'il appelle `message(action="send")`. Définissez `messages.visibleReplies: "automatic"` pour conserver les réponses finales en chat direct sur le chemin hérité de livraison automatique.

Les tours Heartbeat Codex reçoivent également l'outil `heartbeat_respond` par défaut, afin que l'agent puisse indiquer si le réveil doit rester silencieux ou notifier sans encoder ce flux de contrôle dans le texte final.

Les consignes d'initiative propres à Heartbeat sont envoyées comme instruction développeur en mode collaboration Codex sur le tour Heartbeat lui-même. Les tours de chat ordinaires rétablissent le mode Codex par défaut au lieu de transporter la philosophie Heartbeat dans leur prompt d'exécution normal.

Si vous essayez de vous orienter, commencez par
[Exécutions d'agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est l'exécution, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Configuration rapide

La plupart des utilisateurs qui veulent « Codex dans OpenClaw » veulent ce chemin : se connecter avec un abonnement ChatGPT/Codex, puis exécuter les tours d'agent embarqués via l'exécution native du serveur d'application Codex. La référence de modèle reste canonique sous la forme
`openai/gpt-*` ; l'authentification par abonnement vient du compte/profil Codex, et non d'un préfixe de modèle `openai-codex/*`.

Connectez-vous d'abord avec OAuth Codex si ce n'est pas déjà fait :

```bash
openclaw models auth login --provider openai-codex
```

Activez ensuite le plugin `codex` inclus et forcez l'exécution Codex :

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

Si votre configuration utilise `plugins.allow`, incluez-y également `codex` :

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

N'utilisez pas `openai-codex/gpt-*` dans la configuration. Ce préfixe est un chemin hérité que
`openclaw doctor --fix` réécrit en `openai/gpt-*` dans les modèles principaux,
les solutions de repli, les surcharges Heartbeat/sous-agent/Compaction, les hooks, les surcharges de canal,
et les anciens pins de chemin de session persistés.

## Ce que ce plugin change

Le plugin `codex` inclus apporte plusieurs capacités distinctes :

| Capacité                          | Comment l'utiliser                                | Ce qu'elle fait                                                              |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| Exécution embarquée native        | `agentRuntime.id: "codex"`                        | Exécute les tours d'agent embarqués OpenClaw via le serveur d'application Codex. |
| Commandes natives de contrôle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les threads du serveur d'application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur d'application Codex | internes `codex`, exposés via le harnais | Permet à l'exécution de découvrir et de valider les modèles du serveur d'application. |
| Chemin de compréhension média Codex | chemins de compatibilité de modèles d'image `codex/*` | Exécute des tours bornés du serveur d'application Codex pour les modèles de compréhension d'image pris en charge. |
| Relais de hooks natif             | Hooks de plugin autour des événements natifs Codex | Permet à OpenClaw d'observer/bloquer les événements natifs Codex pris en charge de type outil/finalisation. |

Activer le plugin rend ces capacités disponibles. Cela ne fait **pas** ceci :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` vers l'exécution native sans que doctor
  vérifie que Codex est installé, activé, fournit le harnais `codex`,
  et est prêt pour OAuth
- faire d'ACP/acpx le chemin Codex par défaut
- basculer à chaud des sessions existantes qui ont déjà enregistré une exécution PI
- remplacer la livraison de canal OpenClaw, les fichiers de session, le stockage des profils d'authentification ou
  le routage des messages

Le même plugin possède également la surface native de commande de contrôle de chat `/codex`. Si
le plugin est activé et que l'utilisateur demande à lier, reprendre, orienter, arrêter ou inspecter
des threads Codex depuis le chat, les agents devraient préférer `/codex ...` à ACP. ACP reste
la solution de repli explicite lorsque l'utilisateur demande ACP/acpx ou teste l'adaptateur ACP
Codex.

Les tours Codex natifs conservent les hooks de plugin OpenClaw comme couche publique de compatibilité.
Ce sont des hooks OpenClaw en processus, et non des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription en miroir
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les plugins peuvent également enregistrer un middleware de résultat d'outil neutre vis-à-vis de l'exécution afin de réécrire
les résultats d'outils dynamiques OpenClaw après l'exécution de l'outil par OpenClaw et avant que le
résultat soit renvoyé à Codex. Cela est distinct du hook de plugin public
`tool_result_persist`, qui transforme les écritures de résultats d'outils dans la transcription possédée par OpenClaw.

Pour la sémantique des hooks de plugin eux-mêmes, consultez [Hooks de plugin](/fr/plugins/hooks)
et [Comportement de garde des plugins](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu'elles
veulent l'exécution native par serveur d'application. Les références de modèle héritées `codex/*` sélectionnent encore automatiquement
le harnais pour compatibilité, mais les préfixes de fournisseurs hérités adossés à l'exécution ne sont
pas affichés comme choix normaux de modèle/fournisseur.

Si un chemin de modèle configuré est encore `openai-codex/*`, `openclaw doctor --fix`
le réécrit en `openai/*`. Pour les chemins d'agent correspondants, il définit l'exécution d'agent
sur `codex` uniquement lorsque le plugin Codex est installé, activé, fournit le
harnais `codex` et dispose d'un OAuth utilisable ; sinon il définit l'exécution sur `pi`.

## Carte des chemins

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                              | Référence de modèle        | Configuration d'exécution             | Chemin auth/profil             | Libellé d'état attendu          |
| -------------------------------------------------- | -------------------------- | ------------------------------------- | ------------------------------ | ------------------------------- |
| Abonnement ChatGPT/Codex avec exécution Codex native | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | OAuth Codex ou compte Codex    | `Runtime: OpenAI Codex`         |
| API OpenAI via le runner OpenClaw normal           | `openai/gpt-*`             | omis ou `runtime: "pi"`               | Clé API OpenAI                 | `Runtime: OpenClaw Pi Default`  |
| Configuration héritée nécessitant une réparation par doctor | `openai-codex/gpt-*`       | réparé en `codex` ou `pi`             | Authentification configurée existante | Revérifier après `doctor --fix` |
| Fournisseurs mixtes avec mode automatique conservateur | références propres au fournisseur | `agentRuntime.id: "auto"`             | Par fournisseur sélectionné    | Dépend de l'exécution sélectionnée |
| Session explicite de l'adaptateur Codex ACP        | dépend du prompt/modèle ACP | `sessions_spawn` avec `runtime: "acp"` | Authentification du backend ACP | État de tâche/session ACP       |

La séparation importante est entre fournisseur et exécution :

- `openai-codex/*` est un chemin hérité que doctor réécrit.
- `agentRuntime.id: "codex"` nécessite le harnais Codex et échoue fermé s'il
  est indisponible.
- `agentRuntime.id: "auto"` permet aux harnais enregistrés de revendiquer les chemins de fournisseur
  correspondants, mais les références OpenAI canoniques restent possédées par PI sauf si un harnais prend en charge
  cette paire fournisseur/modèle.
- `/codex ...` répond à « à quelle conversation Codex native ce chat doit-il se lier
  ou quelle conversation doit-il contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les chemins de la famille OpenAI sont spécifiques au préfixe. Pour la configuration courante avec abonnement plus
exécution Codex native, utilisez `openai/*` avec `agentRuntime.id: "codex"`.
Traitez `openai-codex/*` comme une configuration héritée que doctor doit réécrire :

| Référence de modèle                         | Chemin d'exécution                           | À utiliser lorsque                                                        |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez un accès actuel direct à l'API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | Chemin hérité réparé par doctor              | Vous êtes sur une ancienne configuration ; exécutez `openclaw doctor --fix` pour la réécrire. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harnais du serveur d'application Codex       | Vous voulez l'authentification par abonnement ChatGPT/Codex avec l'exécution Codex native. |

GPT-5.5 peut apparaître à la fois sur les chemins avec clé API OpenAI directe et sur les chemins d'abonnement Codex
lorsque votre compte les expose. Utilisez `openai/gpt-5.5` avec le harnais du serveur d'application Codex
pour l'exécution Codex native, ou `openai/gpt-5.5` sans surcharge d'exécution Codex
pour le trafic direct avec clé API.

Les références héritées `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité
doctor réécrit les références d'exécution héritées en références de modèle canoniques
et enregistre séparément la politique d'exécution. Les nouvelles configurations du harnais natif de serveur d'application
devraient utiliser `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation de préfixes. Utilisez
`openai/gpt-*` pour le chemin OpenAI normal et `codex/gpt-*` lorsque la compréhension
d'image doit s'exécuter via un tour borné du serveur d'application Codex. N'utilisez pas
`openai-codex/gpt-*` ; doctor réécrit ce préfixe hérité en `openai/gpt-*`. Le
modèle du serveur d'application Codex doit annoncer la prise en charge de l'entrée image ; les modèles Codex
texte seul échouent avant le démarrage du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l'enregistrement structuré `agent harness selected` du gateway. Il
inclut l'identifiant du harnais sélectionné, la raison de sélection, la politique d'exécution/de repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat plugin.

### Signification des avertissements de doctor

`openclaw doctor` avertit lorsque des références de modèle configurées ou l'état de chemin de session persisté
utilisent encore `openai-codex/*`. `openclaw doctor --fix` réécrit ces chemins
vers :

- `openai/<model>`
- `agentRuntime.id: "codex"` lorsque Codex est installé, activé, fournit le
  harnais `codex` et dispose d'un OAuth utilisable
- `agentRuntime.id: "pi"` sinon

Le chemin `codex` force le harnais Codex natif. Le chemin `pi` conserve
l'agent sur le runner OpenClaw par défaut au lieu d'activer ou d'installer Codex comme
effet secondaire du nettoyage de chemin hérité.
Doctor répare également les anciens pins de session persistés dans les magasins de sessions d'agent découverts
afin que les anciennes conversations ne restent pas bloquées sur le chemin supprimé.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour intégré s’exécute,
OpenClaw enregistre l’identifiant du harnais sélectionné sur cette session et continue de l’utiliser pour
les tours ultérieurs avec le même identifiant de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante
entre PI et Codex. Cela évite de rejouer une même transcription dans
deux systèmes de sessions natifs incompatibles.

Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées à PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire basculer cette conversation vers
Codex après avoir modifié la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais de serveur d’application Codex apparaît comme
`Runtime: OpenAI Codex`.

## Prérequis

- OpenClaw avec le Plugin `codex` groupé disponible.
- Serveur d’application Codex `0.125.0` ou plus récent. Le Plugin groupé gère par défaut un binaire
  de serveur d’application Codex compatible ; les commandes `codex` locales sur le `PATH`
  n’affectent donc pas le démarrage normal du harnais.
- Authentification Codex disponible pour le processus du serveur d’application ou pour le pont
  d’authentification Codex d’OpenClaw. Les lancements locaux du serveur d’application utilisent un répertoire d’accueil Codex géré par OpenClaw pour chaque
  agent et un `HOME` enfant isolé ; ils ne lisent donc pas par défaut votre compte
  `~/.codex` personnel, vos Skills, Plugins, votre configuration, l’état des fils, ni les Skills natifs
  `$HOME/.agents/skills`.

Le Plugin bloque les handshakes de serveur d’application plus anciens ou sans version. Cela maintient
OpenClaw sur la surface de protocole avec laquelle il a été testé.

Pour les tests de fumée en direct et Docker, l’authentification provient généralement du compte CLI Codex
ou d’un profil d’authentification OpenClaw `openai-codex`. Les lancements locaux de serveur d’application stdio peuvent
également se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun compte n’est présent.

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native de documentation de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documentation de projet Codex et ne dépend pas des
noms de fichiers de secours Codex pour les fichiers de persona, car les solutions de secours Codex ne s’appliquent que lorsque
`AGENTS.md` est absent.

Pour la parité d’espace de travail OpenClaw, le harnais Codex résout les autres fichiers d’amorçage
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` et `MEMORY.md` lorsqu’ils sont présents) et les transmet via les instructions développeur Codex sur `thread/start` et `thread/resume`. Cela garde
`SOUL.md` et le contexte de persona/profil d’espace de travail associé visibles sur la voie native
Codex de façonnage du comportement sans dupliquer `AGENTS.md`.

## Ajouter Codex aux côtés d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et des modèles de fournisseurs non Codex. Un runtime forcé s’applique à chaque
tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw tente toujours le harnais Codex et échoue de façon fermée
au lieu d’acheminer silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Gardez l’agent par défaut sur `agentRuntime.id: "auto"` et le repli PI pour l’utilisation normale avec plusieurs fournisseurs.
- Utilisez les références héritées `codex/*` uniquement pour la compatibilité. Les nouvelles configurations doivent préférer
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
- L’agent `codex` utilise le harnais de serveur d’application Codex.
- Si Codex est absent ou non pris en charge pour l’agent `codex`, le tour échoue
  au lieu d’utiliser discrètement PI.

## Routage des commandes d’agent

Les agents doivent router les demandes utilisateur selon l’intention, et non uniquement selon le mot « Codex » :

| Si l’utilisateur demande...                            | L’agent doit utiliser...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| « Lier cette discussion à Codex »                      | `/codex bind`                                    |
| « Reprendre le fil Codex `<id>` ici »                  | `/codex resume <id>`                             |
| « Afficher les fils Codex »                            | `/codex threads`                                 |
| « Déposer un rapport d’assistance pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoyer uniquement un retour Codex pour ce fil joint » | `/codex diagnostics [note]`                      |
| « Utiliser mon abonnement ChatGPT/Codex avec le runtime Codex » | `openai/*` plus `agentRuntime.id: "codex"`       |
| « Réparer les anciennes épingles de configuration/session `openai-codex/*` » | `openclaw doctor --fix`                          |
| « Exécuter Codex via ACP/acpx »                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un fil » | ACP/acpx, pas `/codex` ni les sous-agents natifs |

OpenClaw ne présente les consignes de spawn ACP aux agents que lorsque ACP est activé,
dispatchable, et adossé à un backend de runtime chargé. Si ACP n’est pas disponible,
le prompt système et les Skills de Plugin ne doivent pas enseigner à l’agent le routage
ACP.

## Déploiements uniquement Codex

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent intégré
utilise Codex. Les runtimes de Plugin explicites échouent de façon fermée et ne sont jamais retentés silencieusement
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

Surcharge d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Lorsque Codex est forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le
serveur d’application est trop ancien, ou si le serveur d’application ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent exclusivement Codex pendant que l’agent par défaut conserve la
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
session OpenClaw et le harnais Codex crée ou reprend son fil de serveur d’application sidecar
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce fil
et laisse le prochain tour résoudre à nouveau le harnais depuis la configuration actuelle.

## Découverte de modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de repli groupé pour :

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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et reste sur le
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

## Connexion et politique du serveur d’application

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est livré avec le paquet du Plugin `codex`. Cela garde la version du
serveur d’application liée au Plugin groupé plutôt qu’à la CLI Codex séparée
qui se trouve être installée localement. Définissez `appServer.command` uniquement lorsque
vous voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. C’est la posture d’opérateur local de confiance utilisée
pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des prompts d’approbation natifs auxquels personne n’est là pour répondre.

Pour opter pour des approbations relues par le gardien Codex, définissez `appServer.mode:
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

Le mode gardien utilise le chemin d’approbation auto-review natif de Codex. Lorsque Codex demande à
sortir du sandbox, écrire hors de l’espace de travail ou ajouter des permissions comme l’accès
réseau, Codex route cette demande d’approbation vers le relecteur natif au lieu d’un
prompt humain. Le relecteur applique le cadre de risque de Codex et approuve ou refuse
la demande spécifique. Utilisez Gardien lorsque vous voulez plus de garde-fous que le mode YOLO
tout en ayant besoin que des agents sans surveillance puissent progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, ce qui permet aux déploiements avancés de combiner
le préréglage avec des choix explicites. L’ancienne valeur de relecteur `guardian_subagent` est
toujours acceptée comme alias de compatibilité, mais les nouvelles configurations doivent utiliser
`auto_review`.

Pour un serveur d’application déjà en cours d’exécution, utilisez le transport WebSocket :

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

Les lancements de serveur d’application stdio héritent par défaut de l’environnement de processus d’OpenClaw,
mais OpenClaw possède le pont de compte du serveur d’application Codex et définit à la fois
`CODEX_HOME` et `HOME` vers des répertoires par agent dans l’état OpenClaw de cet agent.
Le chargeur de Skills propre à Codex lit `$CODEX_HOME/skills` et
`$HOME/.agents/skills` ; les deux valeurs sont donc isolées pour les lancements locaux de serveur d’application.
Cela garde les Skills, Plugins, configurations, comptes et états de fil natifs de Codex
limités à l’agent OpenClaw au lieu de les laisser fuir depuis le répertoire personnel
de la CLI Codex de l’opérateur.

Les Plugins OpenClaw et les instantanés de Skills OpenClaw continuent de passer par le registre de Plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles de la CLI Codex ne le font pas. Si vous avez
des Skills ou Plugins CLI Codex utiles qui doivent faire partie d’un agent OpenClaw,
inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l’espace de travail de l’agent OpenClaw actuel.
Les Plugins, hooks et fichiers de configuration natifs Codex sont signalés ou archivés
pour révision manuelle au lieu d’être activés automatiquement, car ils peuvent
exécuter des commandes, exposer des serveurs MCP ou contenir des identifiants.

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification Codex OpenClaw explicite pour l’agent.
2. Le compte existant du serveur d’application dans le répertoire d’accueil Codex de cet agent.
3. Pour les lancements locaux de serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex généré. Cela
garde les clés API au niveau du Gateway disponibles pour les embeddings ou les modèles OpenAI directs,
sans faire facturer par accident les tours natifs du serveur d’application Codex via l’API.
Les profils de clé API Codex explicites et le repli local par clé d’environnement stdio utilisent la
connexion au serveur d’application au lieu de l’environnement hérité du processus enfant. Les connexions
WebSocket au serveur d’application ne reçoivent pas le repli par clé API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le
compte propre du serveur d’application distant.

Si un déploiement nécessite une isolation d’environnement supplémentaire, ajoutez ces variables à
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

`appServer.clearEnv` affecte uniquement le processus enfant du serveur d’application Codex généré.

Les outils dynamiques Codex utilisent par défaut le profil `native-first`. Dans ce mode,
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations natives Codex sur l’espace de travail :
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` et
`update_plan`. Les outils d’intégration OpenClaw comme la messagerie, les sessions, les médias,
cron, le navigateur, les nœuds, le gateway, `heartbeat_respond` et `web_search` restent
disponibles.

Champs de plugin Codex de premier niveau pris en charge :

| Champ                      | Valeur par défaut | Signification                                                                                 |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`  | Utilisez `"openclaw-compat"` pour exposer l’ensemble complet des outils dynamiques OpenClaw au serveur d’application Codex. |
| `codexDynamicToolsExclude` | `[]`              | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex. |

Champs `appServer` pris en charge :

| Champ               | Valeur par défaut                       | Signification                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                 |
| `command`           | binaire Codex géré                       | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une surcharge explicite.                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                         |
| `url`               | non défini                               | URL WebSocket du serveur d’application.                                                                                                                                                                                                    |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                  |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                     | Noms de variables d’environnement supplémentaires supprimés du processus stdio de serveur d’application généré après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels de plan de contrôle du serveur d’application.                                                                                                                                                           |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou revue par gardien.                                                                                                                                                                                     |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage, à la reprise et au tour du fil.                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage ou à la reprise du fil.                                                                                                                                                                       |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les demandes d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                        |
| `serviceTier`       | non défini                               | Niveau de service optionnel du serveur d’application Codex : `"fast"`, `"flex"` ou `null`. Les valeurs héritées non valides sont ignorées.                                                                                                  |

Les appels aux outils dynamiques détenus par OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans un délai de 30 secondes. En cas d’expiration, OpenClaw interrompt le signal de l’outil
lorsque c’est pris en charge et renvoie une réponse d’outil dynamique échouée à Codex afin que
le tour puisse continuer au lieu de laisser la session en état `processing`.

Après qu’OpenClaw a répondu à une requête de serveur d’application Codex limitée au tour,
le harnais s’attend aussi à ce que Codex termine le tour natif avec `turn/completed`. Si le
serveur d’application reste silencieux pendant 60 secondes après cette réponse, OpenClaw interrompt au mieux
le tour Codex, enregistre un délai d’expiration diagnostique et libère la voie de session
OpenClaw afin que les messages de discussion suivants ne soient pas mis en file derrière un tour natif
périmé.

Les surcharges d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La configuration est
préférée pour les déploiements répétables, car elle conserve le comportement du plugin dans le
même fichier revu que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

La version courte : OpenClaw n’intègre pas l’application de contrôle du bureau et n’exécute pas
lui-même les actions de bureau. Il prépare le serveur d’application Codex, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex gérer les appels d’outils MCP natifs
pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux de marketplace Codex, enregistrez
`cua-driver mcp` avec `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consultez [Codex Computer Use](/fr/plugins/codex-computer-use) pour la distinction
entre Computer Use détenu par Codex et l’enregistrement MCP direct.

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

Computer Use est spécifique à macOS et peut nécessiter des autorisations locales du système d’exploitation avant que le
serveur MCP Codex puisse contrôler des applications. Si `computerUse.enabled` vaut true et que le serveur MCP
n’est pas disponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils natifs Computer Use. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les motifs de statut et le dépannage.

Lorsque `computerUse.autoInstall` vaut true, OpenClaw peut enregistrer le marketplace standard
Codex Desktop groupé depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace local. Utilisez `/new` ou `/reset` après
avoir modifié la configuration du runtime ou de Computer Use afin que les sessions existantes ne conservent pas une ancienne
liaison PI ou de fil Codex.

## Recettes courantes

Codex local avec transport stdio par défaut :

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

Approbations Codex revues par gardien :

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
à un fil Codex existant, le tour suivant envoie de nouveau au serveur d’application
le modèle OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service
actuellement sélectionnés. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison du fil mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct à l’app-server, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles Codex app-server en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` rattache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande à Codex app-server de compacter le thread rattaché.
- `/codex review` démarre la revue native Codex pour le thread rattaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer un retour de diagnostics Codex pour le thread rattaché.
- `/codex computer-use status` vérifie le Plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le Plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP Codex app-server.
- `/codex skills` liste les Skills Codex app-server.

Lorsque Codex signale un échec lié à une limite d’utilisation, OpenClaw inclut l’heure de réinitialisation suivante de l’app-server lorsque Codex en a fourni une. Utilisez `/codex account` dans la même conversation pour inspecter le compte actuel et les fenêtres de limites de débit.

### Workflow de débogage courant

Lorsqu’un agent adossé à Codex fait quelque chose de surprenant dans Telegram, Discord, Slack ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre courte note qui décrit ce que vous avez observé.
2. Approuvez la demande de diagnostics une fois. L’approbation crée le zip de diagnostics local du Gateway et, comme la session utilise le harnais Codex, envoie aussi le bundle de retour Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bug ou le fil de support. Elle inclut le chemin du bundle local, le résumé de confidentialité, les ids de session OpenClaw, les ids de thread Codex et une ligne `Inspect locally` pour chaque thread Codex.
4. Si vous voulez déboguer l’exécution vous-même, exécutez la commande `Inspect locally` affichée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le thread Codex natif afin que vous puissiez inspecter la conversation, la poursuivre localement ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser le retour Codex pour le thread actuellement rattaché sans le bundle complet de diagnostics du Gateway OpenClaw. Pour la plupart des rapports de support, `/diagnostics [note]` est un meilleur point de départ, car il relie l’état local du Gateway et les ids de thread Codex dans une seule réponse. Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité complet et le comportement dans les discussions de groupe.

Le cœur d’OpenClaw expose aussi `/diagnostics [note]`, réservé aux propriétaires, comme commande générale de diagnostics du Gateway. Son invite d’approbation affiche le préambule sur les données sensibles, renvoie vers [Export de diagnostics](/fr/gateway/diagnostics) et demande `openclaw gateway diagnostics export --json` via une approbation d’exécution explicite à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation, OpenClaw envoie un rapport prêt à coller avec le chemin du bundle local et le résumé du manifeste. Lorsque la session OpenClaw active utilise le harnais Codex, cette même approbation autorise aussi l’envoi des bundles de retour Codex pertinents aux serveurs OpenAI. L’invite d’approbation indique que le retour Codex sera envoyé, mais elle ne liste pas les ids de session ou de thread Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une discussion de groupe, OpenClaw garde le canal partagé propre : le groupe ne reçoit qu’un bref avis, tandis que le préambule de diagnostics, les invites d’approbation et les ids de session/thread Codex sont envoyés au propriétaire via la route d’approbation privée. S’il n’existe aucune route privée vers le propriétaire, OpenClaw refuse la demande du groupe et demande au propriétaire de l’exécuter depuis un DM.

Le téléversement Codex approuvé appelle `feedback/upload` de Codex app-server et demande à l’app-server d’inclure les journaux pour chaque thread listé et les sous-threads Codex générés lorsqu’ils sont disponibles. Le téléversement passe par le chemin de retour normal de Codex vers les serveurs OpenAI ; si le retour Codex est désactivé dans cet app-server, la commande renvoie l’erreur de l’app-server. La réponse de diagnostics terminée liste les canaux, les ids de session OpenClaw, les ids de thread Codex et les commandes locales `codex resume <thread-id>` pour les threads qui ont été envoyés. Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces ids Codex. Ce téléversement ne remplace pas l’export local de diagnostics du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que le harnais utilise pour les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le modèle OpenClaw actuellement sélectionné à l’app-server et garde l’historique étendu activé.

### Inspecter un thread Codex depuis la CLI

Le moyen le plus rapide de comprendre une mauvaise exécution Codex consiste souvent à ouvrir directement le thread Codex natif :

```sh
codex resume <thread-id>
```

Utilisez cela lorsque vous remarquez un bug dans une conversation de canal et que vous voulez inspecter la session Codex problématique, la poursuivre localement ou demander à Codex pourquoi il a fait un choix particulier d’outil ou de raisonnement. Le chemin le plus simple consiste généralement à exécuter d’abord `/diagnostics [note]` : après votre approbation, le rapport terminé liste chaque thread Codex et affiche une commande `Inspect locally`, par exemple `codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un terminal.

Vous pouvez aussi obtenir un id de thread avec `/codex binding` pour la discussion actuelle ou `/codex threads [filter]` pour les threads Codex app-server récents, puis exécuter la même commande `codex resume` dans votre shell.

La surface de commande nécessite Codex app-server `0.125.0` ou plus récent. Les méthodes de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire              | Objectif                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité produit/Plugin entre les harnais PI et Codex.         |
| Middleware d’extension Codex app-server | Plugins groupés OpenClaw  | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` Codex de projet ou globaux pour acheminer le comportement des Plugins OpenClaw. Pour le pont pris en charge des outils natifs et des permissions, OpenClaw injecte une configuration Codex par thread pour `PreToolUse`, `PostToolUse`, `PermissionRequest` et `Stop`. Lorsque les approbations Codex app-server sont activées (`approvalPolicy` n’est pas `"never"`), la configuration de hook natif injectée par défaut omet `PermissionRequest` afin que le relecteur app-server de Codex et le pont d’approbation d’OpenClaw gèrent les escalades réelles après revue. Les opérateurs peuvent toujours ajouter explicitement `permission_request` à `nativeHookRelay.events` lorsqu’ils ont besoin du relais de compatibilité. Les autres hooks Codex comme `SessionStart` et `UserPromptSubmit` restent des contrôles de niveau Codex ; ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé l’appel ; OpenClaw déclenche donc le comportement de Plugin et de middleware dont il est propriétaire dans l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement d’outil canonique. OpenClaw peut mettre en miroir certains événements, mais il ne peut pas réécrire le thread Codex natif sauf si Codex expose cette opération via l’app-server ou des callbacks de hook natifs.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications Codex app-server et de l’état de l’adaptateur OpenClaw, pas de commandes de hook natives Codex. Les événements `before_compaction`, `after_compaction`, `llm_input` et `llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, pas des captures octet pour octet de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications app-server Codex natives `hook/started` et `hook/completed` sont projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage. Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge V1

Le mode Codex n’est pas PI avec un autre appel de modèle sous-jacent. Codex possède une plus grande part de la boucle de modèle native, et OpenClaw adapte ses surfaces de Plugin et de session autour de cette limite.

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                                                                      | Pourquoi                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                                                                        | L’app-server Codex possède le tour OpenAI, la reprise native du fil et la continuation native des outils.                                                                                                  |
| Routage et livraison des canaux OpenClaw      | Pris en charge                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’environnement d’exécution du modèle.                                                                              |
| Outils dynamiques OpenClaw                    | Pris en charge                                                                        | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                            |
| Plugins d’invite et de contexte               | Pris en charge                                                                        | OpenClaw construit des superpositions d’invite et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le fil.                                                                        |
| Cycle de vie du moteur de contexte            | Pris en charge                                                                        | L’assemblage, l’ingestion ou la maintenance après le tour, et la coordination de la Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                     |
| Hooks d’outils dynamiques                     | Pris en charge                                                                        | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                                |
| Hooks de cycle de vie                         | Pris en charge en tant qu’observations d’adaptateur                                  | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                          |
| Garde de révision de réponse finale           | Pris en charge via le relais de hooks natifs                                         | Le `Stop` Codex est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                             |
| Blocage ou observation du shell, du patch et de MCP natifs | Pris en charge via le relais de hooks natifs                              | `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur l’app-server Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permission native                | Pris en charge via les approbations de l’app-server Codex et le relais compatible de hooks natifs | Les demandes d’approbation de l’app-server Codex passent par OpenClaw après la revue Codex. Le relais de hook natif `PermissionRequest` est optionnel pour les modes d’approbation natifs parce que Codex l’émet avant la revue par le gardien. |
| Capture de trajectoire de l’app-server        | Pris en charge                                                                        | OpenClaw enregistre la requête envoyée à l’app-server et les notifications d’app-server qu’il reçoit.                                                                                                      |

Non pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                             | Limite v1                                                                                                                                        | Chemin futur                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks natifs pré-outil de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs de Codex.                      | Nécessite une prise en charge des hooks/schémas Codex pour remplacer l’entrée d’outil.     |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique du fil natif. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas muter des internes non pris en charge. | Ajouter des API explicites de l’app-server Codex si une chirurgie du fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                       | Les enregistrements transformés pourraient être mis en miroir, mais la réécriture canonique nécessite une prise en charge Codex. |
| Métadonnées riches de Compaction native             | OpenClaw observe le début et l’achèvement de la Compaction, mais ne reçoit pas de liste stable conservée/supprimée, de delta de jetons ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                  |
| Intervention sur la Compaction                      | Les hooks de Compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                              | Ajouter des hooks Codex pré/post Compaction si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet de la requête d’API du modèle | OpenClaw peut capturer les requêtes et notifications de l’app-server, mais le cœur Codex construit la requête finale à l’API OpenAI en interne. | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.       |

## Outils, médias et Compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques du
harnais. Le texte, les images, la vidéo, la musique, la synthèse vocale, les approbations et la sortie d’outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hooks natifs est intentionnellement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils et de permissions natifs Codex testés par OpenClaw. Dans
l’environnement d’exécution Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex est une surface de Plugin OpenClaw tant que le contrat d’environnement d’exécution ne le nomme pas.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de
décision de hook et poursuit vers son propre chemin de gardien ou d’approbation utilisateur.
Les modes d’approbation de l’app-server Codex omettent ce hook natif par défaut ; ce paragraphe
s’applique lorsque `permission_request` est explicitement inclus dans
`nativeHookRelay.events` ou qu’un environnement d’exécution compatible l’installe.
Lorsqu’un opérateur choisit `allow-always` pour une demande de permission native Codex,
OpenClaw mémorise cette empreinte exacte de fournisseur/session/entrée d’outil/cwd pendant une
fenêtre de session limitée. La décision mémorisée est intentionnellement à correspondance exacte
uniquement : une commande, des arguments, une charge utile d’outil ou un cwd modifiés créent une nouvelle
approbation.

Les sollicitations d’approbation d’outil MCP Codex sont routées via le flux
d’approbation de Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées au chat
d’origine, et le message de suivi suivant dans la file répond à cette demande de serveur native
au lieu d’être orienté comme contexte supplémentaire. Les autres demandes de sollicitation MCP
échouent toujours en mode fermé.

L’orientation de file d’exécution active correspond à `turn/steer` de l’app-server Codex. Avec le
mode par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode historique `queue` envoie des requêtes `turn/steer` séparées. Les tours de
revue Codex et de Compaction manuelle peuvent rejeter l’orientation dans le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise un repli. Voir
[File d’orientation](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction du fil natif est
déléguée à l’app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique des canaux,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque l’app-server les émet. Aujourd’hui, OpenClaw n’enregistre que
les signaux de début et d’achèvement de la Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste auditables des entrées que Codex a
conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil de transcription de session possédée par OpenClaw.

La génération de médias ne nécessite pas PI. La génération et la compréhension d’images, de vidéos, de musique, de PDF, de synthèse vocale et de médias
continuent d’utiliser les paramètres fournisseur/modèle correspondants, tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est attendu pour
les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une référence historique `codex/*`), activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut encore utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne revendique l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Un
environnement d’exécution Codex forcé échoue au lieu de se replier sur PI. Une fois l’app-server Codex
sélectionné, ses échecs remontent directement.

**L’app-server est rejeté :** mettez à niveau Codex afin que la négociation de l’app-server
indique la version `0.125.0` ou plus récente. Les préversions de même version ou les versions avec suffixe de build
telles que `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées parce que le
seuil de protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que l’app-server distant parle la même version du protocole d’app-server Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une référence historique
`codex/*`. Les références simples `openai/gpt-*` et autres références de fournisseurs restent sur leur chemin
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque tour intégré
pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé, mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si le problème persiste, redémarrez
le Gateway pour effacer les inscriptions de hooks natifs obsolètes. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop, puis réessayez.

## Associés

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
