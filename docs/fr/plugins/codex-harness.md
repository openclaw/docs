---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex fourni
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements réservés à Codex échouent au lieu d’utiliser PI en solution de repli
summary: Exécuter les tours d’agent embarqué OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-07T13:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` fourni permet à OpenClaw d’exécuter des tours d’agent intégrés via le
serveur d’application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d’agent de bas niveau : découverte
des modèles, reprise native des fils, Compaction native et exécution par le serveur d’application.
OpenClaw possède toujours les canaux de discussion, les fichiers de session, la sélection de modèle, les outils,
les approbations, la livraison des médias et le miroir visible de la transcription.

Lorsqu’un tour de discussion source s’exécute via le harnais Codex, les réponses visibles utilisent par défaut
l’outil OpenClaw `message` si le déploiement n’a pas explicitement configuré
`messages.visibleReplies`. L’agent peut toujours terminer son tour Codex en privé ;
il ne publie dans le canal que lorsqu’il appelle `message(action="send")`. Définissez
`messages.visibleReplies: "automatic"` pour conserver les réponses finales de discussion directe sur le
chemin de livraison automatique historique.

Les tours Heartbeat Codex reçoivent également l’outil `heartbeat_respond` par défaut, afin que
l’agent puisse enregistrer si le réveil doit rester silencieux ou notifier, sans encoder
ce flux de contrôle dans le texte final.

Les consignes d’initiative propres au Heartbeat sont envoyées comme instruction développeur
du mode collaboration Codex sur le tour Heartbeat lui-même. Les tours de discussion ordinaires restaurent
le mode Codex par défaut au lieu de transporter la philosophie du Heartbeat dans leur invite
d’exécution normale.

Si vous essayez de vous orienter, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). En bref :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Configuration rapide

La plupart des utilisateurs qui veulent « Codex dans OpenClaw » veulent cette route : se connecter avec un
abonnement ChatGPT/Codex, puis exécuter les tours d’agent intégrés via le runtime natif
du serveur d’application Codex. La référence de modèle reste canonique sous la forme
`openai/gpt-*` ; l’authentification par abonnement vient du compte/profil Codex, pas
d’un préfixe de modèle `openai-codex/*`.

Connectez-vous d’abord avec OAuth Codex si ce n’est pas déjà fait :

```bash
openclaw models auth login --provider openai-codex
```

Activez ensuite le Plugin `codex` fourni et forcez le runtime Codex :

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

Si votre configuration utilise `plugins.allow`, ajoutez-y aussi `codex` :

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

N’utilisez pas `openai-codex/gpt-*` dans la configuration. Ce préfixe est une route historique que
`openclaw doctor --fix` réécrit en `openai/gpt-*` dans les modèles principaux,
les fallbacks, les surcharges Heartbeat/sous-agent/Compaction, les hooks, les surcharges de canal
et les anciens pins de route de session persistés.

## Ce que ce Plugin change

Le Plugin `codex` fourni apporte plusieurs capacités distinctes :

| Capacité                          | Comment l’utiliser                                 | Ce qu’elle fait                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime intégré natif             | `agentRuntime.id: "codex"`                          | Exécute les tours d’agent intégrés OpenClaw via le serveur d’application Codex. |
| Commandes natives de contrôle de discussion | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les fils du serveur d’application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur d’application Codex | internes `codex`, exposés via le harnais            | Permet au runtime de découvrir et valider les modèles du serveur d’application. |
| Chemin de compréhension des médias Codex | chemins de compatibilité de modèles image `codex/*` | Exécute des tours bornés du serveur d’application Codex pour les modèles de compréhension d’image pris en charge. |
| Relais de hooks natif             | Hooks de Plugin autour des événements natifs Codex  | Permet à OpenClaw d’observer/bloquer les événements natifs Codex pris en charge liés aux outils et à la finalisation. |

Activer le Plugin rend ces capacités disponibles. Cela ne fait **pas** :

- remplacer les surfaces directes à clé d’API OpenAI telles que les images, embeddings, speech ou
  realtime
- convertir les références de modèle `openai-codex/*` sans `openclaw doctor --fix`
- faire d’ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un runtime PI
- remplacer la livraison des canaux OpenClaw, les fichiers de session, le stockage des profils d’authentification ou
  le routage des messages

Le même Plugin possède aussi la surface native de commande de contrôle de discussion `/codex`. Si
le Plugin est activé et que l’utilisateur demande à lier, reprendre, orienter, arrêter ou inspecter
des fils Codex depuis la discussion, les agents doivent préférer `/codex ...` à ACP. ACP reste
le fallback explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur ACP
Codex.

Les tours Codex natifs conservent les hooks de Plugin OpenClaw comme couche de compatibilité publique.
Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription en miroir
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les Plugins peuvent aussi enregistrer un middleware de résultat d’outil neutre vis-à-vis du runtime pour réécrire
les résultats d’outils dynamiques OpenClaw après qu’OpenClaw a exécuté l’outil et avant que le
résultat soit renvoyé à Codex. C’est distinct du hook public de Plugin
`tool_result_persist`, qui transforme les écritures de résultats d’outils appartenant à OpenClaw dans la transcription.

Pour la sémantique des hooks de Plugin eux-mêmes, consultez [Hooks de Plugin](/fr/plugins/hooks)
et [Comportement de garde de Plugin](/fr/tools/plugin).

Les références de modèles d’agent OpenAI utilisent le harnais par défaut. Les nouvelles configurations doivent conserver
les références de modèles OpenAI sous leur forme canonique `openai/gpt-*` ; `agentRuntime.id: "codex"` reste
valide, mais n’est plus requis pour les tours d’agent OpenAI. Les références de modèle historiques `codex/*`
sélectionnent encore automatiquement le harnais pour compatibilité, mais
les préfixes de fournisseurs historiques adossés au runtime ne sont pas affichés comme choix normaux de modèle/fournisseur.

Si une route de modèle configurée est encore `openai-codex/*`, `openclaw doctor --fix`
la réécrit en `openai/*`. Pour les routes d’agent correspondantes, il définit le runtime d’agent
sur `codex` et préserve les surcharges de profil d’authentification `openai-codex` existantes.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                              | Référence de modèle        | Configuration du runtime             | Route d’authentification/profil | Libellé de statut attendu   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif | `openai/gpt-*`             | omis ou `agentRuntime.id: "codex"`  | OAuth Codex ou compte Codex   | `Runtime: OpenAI Codex`      |
| Authentification par clé d’API OpenAI pour les modèles d’agent | `openai/gpt-*`             | omis ou `agentRuntime.id: "codex"`  | profil de clé d’API `openai-codex` | `Runtime: OpenAI Codex`      |
| Configuration historique qui nécessite une réparation par doctor | `openai-codex/gpt-*`       | réparé en `codex`                    | Authentification configurée existante | Revérifier après `doctor --fix` |
| Fournisseurs mixtes avec mode automatique conservateur | références propres au fournisseur | `agentRuntime.id: "auto"`              | Par fournisseur sélectionné          | Dépend du runtime sélectionné |
| Session explicite de l’adaptateur Codex ACP         | dépend de l’invite/modèle ACP | `sessions_spawn` avec `runtime: "acp"` | Authentification du backend ACP | Statut de tâche/session ACP      |

La distinction importante est entre fournisseur et runtime :

- `openai-codex/*` est une route historique que doctor réécrit.
- `agentRuntime.id: "codex"` exige le harnais Codex et échoue fermement s’il
  n’est pas disponible.
- `agentRuntime.id: "auto"` laisse les harnais enregistrés revendiquer les routes de fournisseur
  correspondantes ; les références d’agent OpenAI se résolvent vers Codex au lieu de PI.
- `/codex ...` répond à « quelle conversation Codex native cette discussion doit-elle lier
  ou contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI sont spécifiques au préfixe. Pour la configuration courante avec abonnement et
runtime Codex natif, utilisez `openai/*`.
Traitez `openai-codex/*` comme une configuration historique que doctor doit réécrire :

| Référence de modèle                              | Chemin de runtime                         | À utiliser quand                                                   |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | Harnais du serveur d’application Codex pour les tours d’agent | Vous voulez des modèles d’agent OpenAI via Codex.                       |
| `openai-codex/gpt-5.5`                            | Route historique réparée par doctor          | Vous êtes sur une ancienne configuration ; exécutez `openclaw doctor --fix` pour la réécrire. |
| `openai/gpt-5.5` + profil de clé d’API `openai-codex` | Harnais du serveur d’application Codex                 | Vous voulez une authentification par clé d’API pour un modèle d’agent OpenAI.                  |

GPT-5.5 peut apparaître à la fois sur les routes directes avec clé d’API OpenAI et les routes d’abonnement Codex
lorsque votre compte les expose. Utilisez `openai/gpt-5.5` avec le harnais du serveur d’application Codex
pour le runtime Codex natif, ou `openai/gpt-5.5` sans surcharge de runtime Codex
pour le trafic direct avec clé d’API.

Les références historiques `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité
doctor réécrit les références de runtime historiques en références de modèle canoniques
et enregistre séparément la politique de runtime. Les nouvelles configurations du harnais natif de serveur d’application
doivent utiliser `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même distinction de préfixe. Utilisez
`openai/gpt-*` pour la route OpenAI normale et `codex/gpt-*` lorsque la compréhension
d’image doit s’exécuter via un tour borné du serveur d’application Codex. N’utilisez pas
`openai-codex/gpt-*` ; doctor réécrit ce préfixe historique en `openai/gpt-*`. Le
modèle du serveur d’application Codex doit annoncer la prise en charge des entrées image ; les modèles Codex
uniquement texte échouent avant le démarrage du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du Gateway. Il
inclut l’id du harnais sélectionné, la raison de sélection, la politique de runtime/fallback et,
en mode `auto`, le résultat de prise en charge de chaque candidat de Plugin.

### Signification des avertissements doctor

`openclaw doctor` avertit lorsque des références de modèle configurées ou l’état de route de session persisté
utilisent encore `openai-codex/*`. `openclaw doctor --fix` réécrit ces routes
en :

- `openai/<model>`
- `agentRuntime.id: "codex"`

La route `codex` force le harnais Codex natif. La configuration du runtime PI n’est pas
autorisée pour les tours de modèles d’agent OpenAI.
Doctor répare aussi les anciens pins de session persistés dans les magasins de sessions d’agent
découverts, afin que les anciennes conversations ne restent pas bloquées sur la route supprimée.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour intégré s’exécute,
OpenClaw enregistre l’id du harnais sélectionné sur cette session et continue à l’utiliser pour
les tours ultérieurs avec le même id de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante
entre PI et Codex. Cela évite de rejouer une transcription dans deux systèmes de session natifs
incompatibles.

Les sessions historiques créées avant les pins de harnais sont traitées comme épinglées sur PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour inscrire cette conversation dans
Codex après avoir changé la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais du serveur d’application Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le plugin `codex` intégré disponible.
- Codex app-server `0.125.0` ou plus récent. Le plugin intégré gère par défaut un binaire Codex app-server compatible ; les commandes `codex` locales dans le `PATH` n’affectent donc pas le démarrage normal du harnais.
- Authentification Codex disponible pour le processus app-server ou pour le pont d’authentification Codex d’OpenClaw. Les lancements locaux de l’app-server utilisent un répertoire Codex géré par OpenClaw pour chaque agent et un enfant `HOME` isolé ; ils ne lisent donc pas par défaut votre compte personnel `~/.codex`, vos Skills, plugins, configuration, état de fil ou `$HOME/.agents/skills` natif.

Le plugin bloque les poignées de main app-server plus anciennes ou sans version. Cela maintient OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement du compte Codex CLI ou d’un profil d’authentification OpenClaw `openai-codex`. Les lancements locaux stdio de l’app-server peuvent aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun compte n’est présent.

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native des documents de projet. OpenClaw n’écrit pas de fichiers de documents de projet Codex synthétiques et ne dépend pas des noms de fichiers de repli Codex pour les fichiers de persona, car les replis Codex ne s’appliquent que lorsque `AGENTS.md` est absent.

Pour la parité de l’espace de travail OpenClaw, le harnais Codex résout les autres fichiers d’amorçage (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et `MEMORY.md` lorsqu’ils sont présents) et les transmet via les instructions développeur Codex lors de `thread/start` et `thread/resume`. Cela garde `SOUL.md` et le contexte associé de persona/profil de l’espace de travail visibles sur la voie native de façonnage du comportement Codex sans dupliquer `AGENTS.md`.

## Ajouter Codex aux côtés d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement entre Codex et des modèles de fournisseurs non-Codex. Un runtime forcé s’applique à chaque tour intégré de cet agent ou de cette session. Si vous sélectionnez un modèle Anthropic alors que ce runtime est forcé, OpenClaw essaie quand même le harnais Codex et échoue de manière fermée au lieu de router silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placer Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Garder l’agent par défaut sur `agentRuntime.id: "auto"` et le repli PI pour l’usage mixte normal des fournisseurs.
- Utiliser les références héritées `codex/*` uniquement pour la compatibilité. Les nouvelles configurations devraient préférer `openai/*` avec une politique de runtime Codex explicite.

Par exemple, ceci garde l’agent par défaut sur la sélection automatique normale et ajoute un agent Codex séparé :

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
- Si Codex est manquant ou non pris en charge pour l’agent `codex`, le tour échoue au lieu d’utiliser discrètement PI.

## Routage des commandes d’agent

Les agents doivent router les demandes utilisateur selon l’intention, pas seulement selon le mot « Codex » :

| L’utilisateur demande...                               | L’agent doit utiliser...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| « Lier cette discussion à Codex »                      | `/codex bind`                                    |
| « Reprendre le fil Codex `<id>` ici »                  | `/codex resume <id>`                             |
| « Afficher les fils Codex »                            | `/codex threads`                                 |
| « Créer un rapport de support pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoyer uniquement un retour Codex pour ce fil joint » | `/codex diagnostics [note]`                      |
| « Utiliser mon abonnement ChatGPT/Codex avec le runtime Codex » | `openai/*`                                       |
| « Réparer les anciennes broches de configuration/session `openai-codex/*` » | `openclaw doctor --fix`                          |
| « Exécuter Codex via ACP/acpx »                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un fil » | ACP/acpx, pas `/codex` et pas les sous-agents natifs |

OpenClaw n’annonce les indications de spawn ACP aux agents que lorsque ACP est activé, dispatchable et adossé à un backend de runtime chargé. Si ACP n’est pas disponible, l’invite système et les Skills du plugin ne devraient pas enseigner à l’agent le routage ACP.

## Déploiements Codex uniquement

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent intégré utilise Codex. Les runtimes de plugin explicites échouent de manière fermée et ne sont jamais réessayés silencieusement via PI :

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

Remplacement par l’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Lorsque Codex est forcé, OpenClaw échoue tôt si le plugin Codex est désactivé, si l’app-server est trop ancien ou si l’app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent Codex uniquement pendant que l’agent par défaut conserve la sélection automatique normale :

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

Utilisez les commandes de session normales pour changer d’agents et de modèles. `/new` crée une nouvelle session OpenClaw et le harnais Codex crée ou reprend son fil app-server sidecar selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce fil et permet au tour suivant de résoudre à nouveau le harnais depuis la configuration actuelle.

## Découverte des modèles

Par défaut, le plugin Codex demande à l’app-server les modèles disponibles. Si la découverte échoue ou expire, il utilise un catalogue de repli intégré pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Vous pouvez régler la découverte sous `plugins.entries.codex.config.discovery` :

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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et s’en tienne au catalogue de repli :

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

## Connexion et politique de l’app-server

Par défaut, le plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est livré avec le paquet du plugin `codex`. Cela garde la version de l’app-server liée au plugin intégré au lieu de dépendre de la CLI Codex séparée qui se trouve être installée localement. Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un exécutable différent.

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO : `approvalPolicy: "never"`, `approvalsReviewer: "user"` et `sandbox: "danger-full-access"`. C’est la posture d’opérateur local de confiance utilisée pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans s’arrêter sur des invites d’approbation natives auxquelles personne n’est présent pour répondre.

Pour opter pour les approbations examinées par le gardien Codex, définissez `appServer.mode: "guardian"` :

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

Le mode Guardian utilise le chemin d’approbation auto-review natif de Codex. Lorsque Codex demande à sortir du bac à sable, à écrire hors de l’espace de travail ou à ajouter des permissions comme l’accès réseau, Codex route cette demande d’approbation vers le réviseur natif plutôt que vers une invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse la demande spécifique. Utilisez Guardian lorsque vous voulez plus de garde-fous que le mode YOLO tout en ayant besoin que des agents sans surveillance progressent.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`. Les champs de politique individuels remplacent toujours `mode`, ce qui permet aux déploiements avancés de mélanger le préréglage avec des choix explicites. L’ancienne valeur de réviseur `guardian_subagent` est toujours acceptée comme alias de compatibilité, mais les nouvelles configurations devraient utiliser `auto_review`.

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

Les lancements stdio de l’app-server héritent par défaut de l’environnement de processus d’OpenClaw, mais OpenClaw possède le pont de compte de l’app-server Codex et définit à la fois `CODEX_HOME` et `HOME` sur des répertoires par agent sous l’état OpenClaw de cet agent. Le propre chargeur de Skills de Codex lit `$CODEX_HOME/skills` et `$HOME/.agents/skills`, donc les deux valeurs sont isolées pour les lancements locaux de l’app-server. Cela garde les Skills natifs Codex, plugins, configuration, comptes et état de fil limités à l’agent OpenClaw au lieu de fuir depuis le répertoire personnel Codex CLI de l’opérateur.

Les plugins OpenClaw et les instantanés de Skills OpenClaw circulent toujours via le registre de plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles de Codex CLI ne le font pas. Si vous avez des Skills ou plugins Codex CLI utiles qui devraient faire partie d’un agent OpenClaw, inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l’espace de travail de l’agent OpenClaw actuel. Les plugins natifs Codex, hooks et fichiers de configuration sont signalés ou archivés pour examen manuel au lieu d’être activés automatiquement, car ils peuvent exécuter des commandes, exposer des serveurs MCP ou transporter des identifiants.

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification Codex OpenClaw explicite pour l’agent.
2. Le compte existant de l’app-server dans le répertoire Codex de cet agent.
3. Pour les lancements locaux stdio de l’app-server uniquement, `CODEX_API_KEY`, puis `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’authentification OpenAI est encore requise.

Lorsque OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il retire `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela garde les clés API au niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs sans facturer par accident les tours natifs Codex app-server via l’API. Les profils explicites de clé API Codex et le repli local stdio par clé d’environnement utilisent la connexion app-server au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket à l’app-server ne reçoivent pas de repli par clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le propre compte de l’app-server distant.

Si un déploiement a besoin d’une isolation supplémentaire de l’environnement, ajoutez ces variables à `appServer.clearEnv` :

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

`appServer.clearEnv` n’affecte que le processus enfant Codex app-server lancé.

Les outils dynamiques Codex utilisent par défaut le profil `native-first`. Dans ce mode,
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations natives
Codex sur l’espace de travail : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et
`update_plan`. Les outils d’intégration OpenClaw tels que la messagerie, les sessions, les médias,
cron, le navigateur, les nœuds, gateway, `heartbeat_respond` et `web_search` restent
disponibles.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Par défaut       | Signification                                                                            |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Utilisez `"openclaw-compat"` pour exposer l’ensemble complet des outils dynamiques OpenClaw à Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours Codex app-server.   |

Champs `appServer` pris en charge :

| Champ                         | Par défaut                              | Signification                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                             |
| `command`                     | binaire Codex géré                     | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                       |
| `url`                         | non défini                                    | URL WebSocket app-server.                                                                                                                                                                                                            |
| `authToken`                   | non défini                                    | Jeton bearer pour le transport WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`            | `60000`                                  | Délai d’expiration pour les appels du plan de contrôle app-server.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Fenêtre de silence après une requête Codex app-server limitée à un tour pendant qu’OpenClaw attend `turn/completed`. Augmentez cette valeur pour les phases lentes post-outil ou de synthèse uniquement de statut.                                                                  |
| `mode`                        | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou revue par guardian.                                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du fil.                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage ou à la reprise du fil.                                                                                                                                                                               |
| `approvalsReviewer`           | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                                         |
| `serviceTier`                 | non défini                                    | Niveau de service Codex app-server facultatif : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées.                                                                                                                            |

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas d’expiration, OpenClaw interrompt le signal
de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse d’outil dynamique en échec afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête Codex app-server limitée à un tour, le harnais
s’attend aussi à ce que Codex termine le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs` après cette
réponse, OpenClaw interrompt au mieux le tour Codex, enregistre un délai d’expiration de diagnostic
et libère la voie de session OpenClaw afin que les messages de discussion suivants ne soient
pas mis en file derrière un tour natif périmé. Toute notification non terminale pour le
même tour, y compris `rawResponseItem/completed`, désarme ce court chien de garde
car Codex a prouvé que le tour est toujours actif ; le chien de garde terminal plus long
continue de protéger les tours réellement bloqués. Les diagnostics d’expiration incluent la
dernière méthode de notification app-server et, pour les éléments de réponse assistant bruts, le
type d’élément, le rôle, l’id et un aperçu borné du texte assistant.

Les substitutions d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférable pour les déploiements reproductibles, car elle conserve le comportement du plugin dans le
même fichier révisé que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

Version courte : OpenClaw ne fournit pas l’application de contrôle du bureau et n’exécute pas
lui-même d’actions sur le bureau. Il prépare Codex app-server, vérifie que le
serveur MCP `computer-use` est disponible, puis laisse Codex gérer les appels d’outils
MCP natifs pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux marketplace Codex, enregistrez
`cua-driver mcp` avec `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consultez [Codex Computer Use](/fr/plugins/codex-computer-use) pour la distinction
entre Computer Use appartenant à Codex et l’enregistrement MCP direct.

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

Computer Use est propre à macOS et peut nécessiter des autorisations locales de l’OS avant que le
serveur MCP Codex puisse contrôler les applications. Si `computerUse.enabled` vaut true et que le serveur MCP
n’est pas disponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils Computer Use natifs. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les raisons de statut et le dépannage.

Lorsque `computerUse.autoInstall` vaut true, OpenClaw peut enregistrer la marketplace
Codex Desktop standard groupée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace locale. Utilisez `/new` ou `/reset` après
avoir changé la configuration de runtime ou de Computer Use afin que les sessions existantes ne conservent pas une
ancienne liaison de fil PI ou Codex.

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

app-server distant avec en-têtes explicites :

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
à un fil Codex existant, le tour suivant envoie à nouveau le modèle
OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service actuellement sélectionnés à
app-server. Le passage de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison de fil, mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le Plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct du serveur d’application, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles en direct du serveur d’application Codex.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours de diagnostic Codex pour le thread attaché.
- `/codex computer-use status` vérifie le Plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le Plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` liste les Skills du serveur d’application Codex.

Lorsque Codex signale un échec lié à une limite d’utilisation, OpenClaw inclut la prochaine
heure de réinitialisation du serveur d’application lorsque Codex en a fourni une. Utilisez `/codex account` dans la même
conversation pour inspecter le compte actuel et les fenêtres de limites de débit.

### Flux de débogage courant

Lorsqu’un agent basé sur Codex fait quelque chose d’inattendu dans Telegram, Discord, Slack,
ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre note courte
   décrivant ce que vous avez observé.
2. Approuvez la demande de diagnostic une fois. L’approbation crée le fichier zip de diagnostics du Gateway
   local et, comme la session utilise le harnais Codex, envoie également
   le paquet de retours Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bug ou le fil de support.
   Elle inclut le chemin du paquet local, le résumé de confidentialité, les identifiants de session OpenClaw,
   les identifiants de thread Codex, ainsi qu’une ligne `Inspect locally` pour chaque thread Codex.
4. Si vous voulez déboguer l’exécution vous-même, lancez la commande `Inspect locally`
   affichée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le
   thread Codex natif pour que vous puissiez inspecter la conversation, la continuer localement,
   ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser les retours
Codex pour le thread actuellement attaché, sans le paquet complet de diagnostics du
Gateway OpenClaw. Pour la plupart des rapports de support, `/diagnostics [note]` est
le meilleur point de départ, car il relie l’état local du Gateway et les identifiants de
thread Codex dans une seule réponse. Consultez [Export des diagnostics](/fr/gateway/diagnostics)
pour le modèle complet de confidentialité et le comportement dans les discussions de groupe.

Le cœur d’OpenClaw expose également `/diagnostics [note]`, réservé aux propriétaires, comme commande générale de diagnostics du
Gateway. Son invite d’approbation affiche le préambule sur les données sensibles,
renvoie vers [Export des diagnostics](/fr/gateway/diagnostics), et demande
`openclaw gateway diagnostics export --json` au moyen d’une approbation d’exécution explicite
à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation,
OpenClaw envoie un rapport prêt à coller avec le chemin du paquet local et le résumé
du manifeste. Lorsque la session OpenClaw active utilise le harnais Codex, cette
même approbation autorise également l’envoi des paquets de retours Codex pertinents aux
serveurs OpenAI. L’invite d’approbation indique que les retours Codex seront envoyés, mais
elle ne liste pas les identifiants de session ni de thread Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une discussion de groupe, OpenClaw garde le
canal partagé propre : le groupe ne reçoit qu’un court avis, tandis que le
préambule des diagnostics, les invites d’approbation et les identifiants de session/thread Codex sont envoyés au
propriétaire par la voie d’approbation privée. S’il n’existe aucune voie privée vers le propriétaire,
OpenClaw refuse la demande du groupe et demande au propriétaire de l’exécuter depuis un message privé.

Le téléversement Codex approuvé appelle `feedback/upload` du serveur d’application Codex et demande
au serveur d’application d’inclure les journaux pour chaque thread listé et les sous-threads Codex générés,
lorsqu’ils sont disponibles. Le téléversement passe par le chemin de retours normal de Codex vers les serveurs
OpenAI ; si les retours Codex sont désactivés dans ce serveur d’application, la commande renvoie
l’erreur du serveur d’application. La réponse de diagnostics terminée liste les canaux,
les identifiants de session OpenClaw, les identifiants de thread Codex et les commandes locales `codex resume <thread-id>`
pour les threads qui ont été envoyés. Si vous refusez ou ignorez l’approbation,
OpenClaw n’affiche pas ces identifiants Codex. Ce téléversement ne remplace pas l’export local
des diagnostics du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour
les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le
modèle OpenClaw actuellement sélectionné au serveur d’application et garde l’historique étendu
activé.

### Inspecter un thread Codex depuis la CLI

Le moyen le plus rapide de comprendre une mauvaise exécution Codex consiste souvent à ouvrir le thread Codex
natif directement :

```sh
codex resume <thread-id>
```

Utilisez cela lorsque vous remarquez un bug dans une conversation de canal et que vous voulez inspecter la
session Codex problématique, la continuer localement, ou demander à Codex pourquoi il a fait un
choix d’outil ou de raisonnement particulier. Le chemin le plus simple consiste généralement à exécuter
`/diagnostics [note]` d’abord : après approbation, le rapport terminé liste
chaque thread Codex et affiche une commande `Inspect locally`, par exemple
`codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un terminal.

Vous pouvez également obtenir un identifiant de thread depuis `/codex binding` pour la discussion actuelle ou
`/codex threads [filter]` pour les threads récents du serveur d’application Codex, puis exécuter la même
commande `codex resume` dans votre shell.

La surface de commande nécessite le serveur d’application Codex `0.125.0` ou plus récent. Les méthodes
de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
serveur d’application futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Frontières des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire              | Objectif                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité produit/Plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router
le comportement des Plugins OpenClaw. Pour le pont pris en charge entre outil natif et permissions,
OpenClaw injecte une configuration Codex par thread pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`. Lorsque les approbations du serveur d’application Codex sont activées
(`approvalPolicy` n’est pas `"never"`), la configuration de hook natif injectée par défaut
omet `PermissionRequest` afin que le réviseur du serveur d’application Codex et le pont d’approbation
d’OpenClaw gèrent les escalades réelles après revue. Les opérateurs peuvent toujours ajouter explicitement
`permission_request` à `nativeHookRelay.events` lorsqu’ils ont besoin du relais de compatibilité.
Les autres hooks Codex, comme `SessionStart` et `UserPromptSubmit`, restent
des contrôles au niveau de Codex ; ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, donc OpenClaw déclenche le comportement de Plugin et de middleware qu’il possède dans
l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le thread Codex
natif sauf si Codex expose cette opération via le serveur d’application ou des rappels de hook
natifs.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application Codex
et de l’état de l’adaptateur OpenClaw, pas de commandes de hooks natifs Codex.
Les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, pas des captures octet pour octet
de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur d’application sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Le mode Codex n’est pas PI avec un appel de modèle différent en dessous. Codex possède une plus grande partie
de la boucle de modèle native, et OpenClaw adapte ses surfaces de Plugin et de session
autour de cette frontière.

Pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                       | Prise en charge                                                                      | Pourquoi                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                                                                       | Le serveur d’application Codex possède le tour OpenAI, la reprise native du fil et la continuation native des outils.                                                                                      |
| Routage et livraison des canaux OpenClaw      | Pris en charge                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’environnement d’exécution du modèle.                                                                              |
| Outils dynamiques OpenClaw                    | Pris en charge                                                                       | Codex demande à OpenClaw d’exécuter ces outils, de sorte qu’OpenClaw reste dans le chemin d’exécution.                                                                                                     |
| Plugins de prompt et de contexte              | Pris en charge                                                                       | OpenClaw construit des superpositions de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le fil.                                                                       |
| Cycle de vie du moteur de contexte            | Pris en charge                                                                       | L’assemblage, l’ingestion ou la maintenance après tour, ainsi que la coordination de la compaction du moteur de contexte, s’exécutent pour les tours Codex.                                                |
| Hooks d’outils dynamiques                     | Pris en charge                                                                       | `before_tool_call`, `after_tool_call` et le middleware de résultats d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                               |
| Hooks de cycle de vie                         | Pris en charge en tant qu’observations d’adaptateur                                  | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                          |
| Porte de révision de la réponse finale        | Pris en charge via le relais de hook natif                                           | Le `Stop` Codex est relayé vers `before_agent_finalize`; `revise` demande à Codex une passe de modèle supplémentaire avant la finalisation.                                                               |
| Blocage ou observation natifs du shell, des patchs et de MCP | Pris en charge via le relais de hook natif                                           | `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natives engagées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permission native                | Pris en charge via les approbations du serveur d’application Codex et le relais de hook natif de compatibilité | Les demandes d’approbation du serveur d’application Codex passent par OpenClaw après l’examen Codex. Le relais de hook natif `PermissionRequest` est optionnel pour les modes d’approbation natifs, car Codex l’émet avant l’examen du gardien. |
| Capture de trajectoire du serveur d’application | Pris en charge                                                                       | OpenClaw enregistre la requête qu’il a envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                        |

Non pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                             | Limite V1                                                                                                                                        | Chemin futur                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks natifs de pré-outil Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs Codex.                       | Nécessite la prise en charge par Codex des hooks/schémas pour remplacer l’entrée d’outil. |
| Historique de transcript natif Codex modifiable     | Codex possède l’historique canonique du fil natif. OpenClaw possède un miroir et peut projeter du contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites de serveur d’application Codex si une chirurgie du fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcript possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                         | Pourrait refléter les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées de compaction native enrichies          | OpenClaw observe le début et la fin de la compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de tokens ni de charge utile de résumé. | Nécessite des événements de compaction Codex plus riches.                                  |
| Intervention sur la compaction                      | Les hooks de compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                             | Ajouter des hooks Codex avant/après compaction si les plugins doivent opposer un veto à la compaction native ou la réécrire. |
| Capture octet pour octet de la requête API du modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur Codex construit en interne la requête API OpenAI finale. | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.      |

## Outils, médias et compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hook natif est volontairement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils natifs Codex et de permissions que teste OpenClaw. Dans
l’environnement d’exécution Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex est une surface de plugin OpenClaw tant que le contrat d’exécution ne le
nomme pas.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme l’absence de
décision de hook et poursuit vers son propre gardien ou chemin d’approbation utilisateur.
Les modes d’approbation du serveur d’application Codex omettent ce hook natif par défaut ; ce paragraphe
s’applique lorsque `permission_request` est explicitement inclus dans
`nativeHookRelay.events` ou lorsqu’un environnement d’exécution de compatibilité l’installe.
Lorsqu’un opérateur choisit `allow-always` pour une demande de permission native Codex,
OpenClaw mémorise cette empreinte exacte de fournisseur/session/entrée d’outil/cwd pour une
fenêtre de session bornée. La décision mémorisée est volontairement en correspondance exacte
uniquement : une commande, des arguments, une charge utile d’outil ou un cwd modifiés créent une nouvelle
approbation.

Les sollicitations d’approbation des outils MCP Codex sont routées via le flux
d’approbation de plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les prompts Codex `request_user_input` sont renvoyés au chat
d’origine, et le prochain message de suivi en file répond à cette requête de serveur
native au lieu d’être orienté comme contexte supplémentaire. Les autres demandes de sollicitation MCP
échouent toujours fermées.

L’orientation de la file d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
mode par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` séparées. Les tours de
révision Codex et de compaction manuelle peuvent rejeter l’orientation dans le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise le repli. Consultez
[File d’orientation](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la compaction du fil natif est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir du transcript pour l’historique des canaux,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw enregistre uniquement
les signaux de début et de fin de compaction native. Il n’expose pas encore de
résumé de compaction lisible par un humain ni de liste vérifiable des entrées que Codex
a conservées après compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il s’applique uniquement lorsque
OpenClaw écrit un résultat d’outil de transcript de session possédé par OpenClaw.

La génération de médias ne nécessite pas PI. Les images, vidéos, la musique, les PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres fournisseur/modèle correspondants, tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est attendu pour
les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une réf. héritée `codex/*`), activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut toujours utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne réclame l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection Codex pendant les tests. Un
environnement d’exécution Codex forcé échoue au lieu de se rabattre sur PI. Une fois le serveur d’application Codex
sélectionné, ses échecs remontent directement.

**Le serveur d’application est rejeté :** mettez à niveau Codex afin que la négociation du serveur d’application
signale la version `0.125.0` ou plus récente. Les préversions de même version ou les
versions suffixées de build, comme `0.125.0-alpha.2` ou `0.125.0+custom`, sont rejetées car le
plancher stable du protocole `0.125.0` est celui que teste OpenClaw.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant parle la même version de protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une réf. héritée
`codex/*`. Les réf. simples `openai/gpt-*` et les autres réf. de fournisseurs restent sur leur chemin de
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque tour
intégré pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si le problème persiste, redémarrez
le Gateway pour effacer les inscriptions obsolètes de hook natif. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop, puis réessayez.

## Articles connexes

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
