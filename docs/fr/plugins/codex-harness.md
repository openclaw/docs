---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex fourni
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements réservés à Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-03T21:35:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqués via le serveur d’application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex prenne en charge la session d’agent de bas niveau : découverte des modèles, reprise native de thread, compaction native et exécution par serveur d’application. OpenClaw conserve la gestion des canaux de discussion, des fichiers de session, de la sélection du modèle, des outils, des approbations, de la livraison des médias et du miroir de transcription visible.

Lorsqu’un tour de discussion source s’exécute via le harnais Codex, les réponses visibles utilisent par défaut l’outil `message` d’OpenClaw si le déploiement n’a pas explicitement configuré `messages.visibleReplies`. L’agent peut tout de même terminer son tour Codex en privé ; il ne publie dans le canal que lorsqu’il appelle `message(action="send")`. Définissez `messages.visibleReplies: "automatic"` pour conserver les réponses finales de discussion directe sur l’ancien chemin de livraison automatique.

Les tours Heartbeat Codex reçoivent aussi l’outil `heartbeat_respond` par défaut, afin que l’agent puisse enregistrer si le réveil doit rester silencieux ou notifier sans encoder ce flux de contrôle dans le texte final.

Les consignes d’initiative propres à Heartbeat sont envoyées comme instruction développeur Codex en mode collaboration sur le tour Heartbeat lui-même. Les tours de discussion ordinaires restaurent le mode Codex Default au lieu de transporter la philosophie Heartbeat dans leur prompt d’exécution normal.

Si vous essayez de vous orienter, commencez par
[Environnements d’exécution d’agent](/fr/concepts/agent-runtimes). En bref :
`openai/gpt-5.5` est la référence de modèle, `codex` est l’environnement d’exécution, et Telegram, Discord, Slack ou un autre canal reste la surface de communication.

## Configuration rapide

La plupart des utilisateurs qui veulent « Codex dans OpenClaw » veulent ce chemin : se connecter avec un abonnement ChatGPT/Codex, puis exécuter les tours d’agent embarqués via l’environnement d’exécution natif du serveur d’application Codex. La référence de modèle reste canonique sous la forme `openai/gpt-*` ; l’authentification par abonnement vient du compte/profil Codex, pas d’un préfixe de modèle `openai-codex/*`.

Connectez-vous d’abord avec Codex OAuth si ce n’est pas déjà fait :

```bash
openclaw models auth login --provider openai-codex
```

Activez ensuite le Plugin `codex` intégré et forcez l’environnement d’exécution Codex :

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

N’utilisez pas `openai-codex/gpt-*` lorsque vous voulez dire environnement d’exécution natif Codex. Ce préfixe correspond au chemin explicite « Codex OAuth via PI ». Les changements de configuration s’appliquent aux sessions nouvelles ou réinitialisées ; les sessions existantes conservent leur environnement d’exécution enregistré.

## Ce que ce Plugin change

Le Plugin `codex` intégré apporte plusieurs capacités distinctes :

| Capacité                          | Comment l’utiliser                                  | Ce qu’elle fait                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Environnement d’exécution embarqué natif | `agentRuntime.id: "codex"`                          | Exécute les tours d’agent embarqués OpenClaw via le serveur d’application Codex. |
| Commandes natives de contrôle de discussion | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les threads du serveur d’application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur d’application Codex | internes `codex`, exposés via le harnais            | Permet à l’environnement d’exécution de découvrir et valider les modèles du serveur d’application. |
| Chemin de compréhension des médias Codex | chemins de compatibilité de modèles d’image `codex/*` | Exécute des tours bornés du serveur d’application Codex pour les modèles de compréhension d’images pris en charge. |
| Relais de hooks natif             | Hooks de Plugin autour des événements natifs Codex  | Permet à OpenClaw d’observer/bloquer les événements natifs Codex de type outil/finalisation pris en charge. |

Activer le Plugin rend ces capacités disponibles. Cela ne fait **pas** ce qui suit :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` en environnement d’exécution natif
- faire d’ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un environnement d’exécution PI
- remplacer la livraison de canal OpenClaw, les fichiers de session, le stockage des profils d’authentification ou le routage des messages

Le même Plugin possède aussi la surface native de commandes de contrôle de discussion `/codex`. Si le Plugin est activé et que l’utilisateur demande à lier, reprendre, orienter, arrêter ou inspecter des threads Codex depuis la discussion, les agents doivent préférer `/codex ...` à ACP. ACP reste la solution de secours explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur Codex ACP.

Les tours natifs Codex conservent les hooks de Plugin OpenClaw comme couche publique de compatibilité. Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription en miroir
- `before_agent_finalize` via le relais `Stop` de Codex
- `agent_end`

Les Plugins peuvent aussi enregistrer un middleware de résultats d’outil neutre vis-à-vis de l’environnement d’exécution afin de réécrire les résultats d’outils dynamiques OpenClaw après l’exécution de l’outil par OpenClaw et avant le renvoi du résultat à Codex. Cela est distinct du hook de Plugin public `tool_result_persist`, qui transforme les écritures de résultats d’outils de transcription appartenant à OpenClaw.

Pour la sémantique des hooks de Plugin eux-mêmes, consultez [Hooks de Plugin](/fr/plugins/hooks) et [Comportement des gardes de Plugin](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI sous la forme canonique `openai/gpt-*` et forcer explicitement `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles veulent une exécution native par serveur d’application. Les anciennes références de modèle `codex/*` sélectionnent encore automatiquement le harnais pour compatibilité, mais les anciens préfixes de fournisseur adossés à un environnement d’exécution ne sont pas affichés comme choix normaux de modèle/fournisseur.

Si le Plugin `codex` est activé mais que le modèle principal est toujours `openai-codex/*`, `openclaw doctor` émet un avertissement au lieu de changer le chemin. C’est intentionnel : `openai-codex/*` reste le chemin Codex OAuth/abonnement via PI, et l’exécution native par serveur d’application reste un choix explicite d’environnement d’exécution.

## Carte des chemins

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                              | Référence de modèle       | Configuration d’environnement d’exécution | Chemin d’authentification/profil | Libellé d’état attendu         |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Abonnement ChatGPT/Codex avec environnement d’exécution natif Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth ou compte Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI via l’exécuteur OpenClaw normal         | `openai/gpt-*`             | omis ou `runtime: "pi"`                | Clé d’API OpenAI             | `Runtime: OpenClaw Pi Default` |
| Abonnement ChatGPT/Codex via PI                    | `openai-codex/gpt-*`       | omis ou `runtime: "pi"`                | Fournisseur OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Fournisseurs mixtes avec mode automatique conservateur | références propres au fournisseur | `agentRuntime.id: "auto"`              | Selon le fournisseur sélectionné | Dépend de l’environnement d’exécution sélectionné |
| Session explicite d’adaptateur Codex ACP           | dépend du prompt/modèle ACP | `sessions_spawn` avec `runtime: "acp"` | Authentification du backend ACP | État de tâche/session ACP      |

La séparation importante est entre fournisseur et environnement d’exécution :

- `openai-codex/*` répond à « quel chemin fournisseur/authentification PI doit-il utiliser ? »
- `agentRuntime.id: "codex"` répond à « quelle boucle doit exécuter ce tour embarqué ? »
- `/codex ...` répond à « quelle conversation native Codex cette discussion doit-elle lier ou contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les chemins de la famille OpenAI sont spécifiques au préfixe. Pour la configuration courante abonnement plus environnement d’exécution natif Codex, utilisez `openai/*` avec `agentRuntime.id: "codex"`. Utilisez `openai-codex/*` uniquement lorsque vous voulez intentionnellement Codex OAuth via PI :

| Référence de modèle                          | Chemin d’environnement d’exécution            | À utiliser lorsque                                                         |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez l’accès direct actuel à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth via OpenClaw/PI           | Vous voulez l’authentification par abonnement ChatGPT/Codex avec l’exécuteur PI par défaut. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harnais du serveur d’application Codex       | Vous voulez l’authentification par abonnement ChatGPT/Codex avec l’exécution native Codex. |

GPT-5.5 peut apparaître à la fois sur les chemins avec clé d’API OpenAI directe et avec abonnement Codex lorsque votre compte les expose. Utilisez `openai/gpt-5.5` avec le harnais du serveur d’application Codex pour l’environnement d’exécution natif Codex, `openai-codex/gpt-5.5` pour PI OAuth, ou `openai/gpt-5.5` sans surcharge d’environnement d’exécution Codex pour le trafic direct par clé d’API.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité de doctor réécrit les anciennes références principales d’environnement d’exécution en références de modèle canoniques et enregistre séparément la politique d’environnement d’exécution, tandis que les anciennes références uniquement de secours restent inchangées, car l’environnement d’exécution est configuré pour tout le conteneur d’agent. Les nouvelles configurations PI Codex OAuth doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de harnais natif de serveur d’application doivent utiliser `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez `openai-codex/gpt-*` lorsque la compréhension d’images doit passer par le chemin du fournisseur OpenAI Codex OAuth. Utilisez `codex/gpt-*` lorsque la compréhension d’images doit passer par un tour borné du serveur d’application Codex. Le modèle du serveur d’application Codex doit annoncer la prise en charge des entrées d’image ; les modèles Codex texte uniquement échouent avant le démarrage du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness` et inspectez l’enregistrement structuré `agent harness selected` du Gateway. Il inclut l’id du harnais sélectionné, la raison de sélection, la politique d’environnement d’exécution/de secours et, en mode `auto`, le résultat de prise en charge de chaque Plugin candidat.

### Signification des avertissements de doctor

`openclaw doctor` émet un avertissement lorsque toutes les conditions suivantes sont vraies :

- le Plugin `codex` intégré est activé ou autorisé
- le modèle principal d’un agent est `openai-codex/*`
- l’environnement d’exécution effectif de cet agent n’est pas `codex`

Cet avertissement existe parce que les utilisateurs s’attendent souvent à ce que « Plugin Codex activé » implique « environnement d’exécution natif du serveur d’application Codex ». OpenClaw ne fait pas ce saut. L’avertissement signifie :

- **Aucun changement n’est requis** si vous vouliez ChatGPT/Codex OAuth via PI.
- Remplacez le modèle par `openai/<model>` et définissez
  `agentRuntime.id: "codex"` si vous vouliez une exécution native par serveur d’application.
- Les sessions existantes nécessitent toujours `/new` ou `/reset` après un changement d’environnement d’exécution,
  car les épingles d’environnement d’exécution de session sont persistantes.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour embarqué s’exécute, OpenClaw enregistre l’id du harnais sélectionné sur cette session et continue à l’utiliser pour les tours suivants avec le même id de session. Modifiez la configuration `agentRuntime` ou `OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ; utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante entre PI et Codex. Cela évite de rejouer une même transcription via deux systèmes de session natifs incompatibles.

Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées à PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire basculer cette conversation vers
Codex après avoir changé la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais de serveur d’application Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le Plugin `codex` groupé disponible.
- Serveur d’application Codex `0.125.0` ou plus récent. Le Plugin groupé gère par défaut un binaire
  de serveur d’application Codex compatible, donc les commandes `codex` locales dans le `PATH`
  n’affectent pas le démarrage normal du harnais.
- Authentification Codex disponible pour le processus du serveur d’application ou pour le pont
  d’authentification Codex d’OpenClaw. Les lancements locaux du serveur d’application utilisent un
  répertoire personnel Codex géré par OpenClaw pour chaque agent et un `HOME` enfant isolé, donc ils
  ne lisent pas par défaut votre compte personnel `~/.codex`, vos Skills, Plugins, votre configuration,
  l’état des fils de discussion ni `$HOME/.agents/skills` natif.

Le Plugin bloque les handshakes de serveur d’application anciens ou sans version. Cela maintient
OpenClaw sur la surface de protocole avec laquelle il a été testé.

Pour les tests de fumée en direct et Docker, l’authentification provient généralement du compte CLI
Codex ou d’un profil d’authentification OpenClaw `openai-codex`. Les lancements locaux de serveur
d’application stdio peuvent aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun
compte n’est présent.

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native de documentation de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documentation de projet Codex et ne dépend pas des noms de
fichiers de secours Codex pour les fichiers de persona, car les solutions de secours Codex ne
s’appliquent que lorsque `AGENTS.md` est absent.

Pour la parité d’espace de travail OpenClaw, le harnais Codex résout les autres fichiers
d’amorçage (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` lorsqu’ils sont présents) et les transmet via les instructions de configuration Codex
sur `thread/start` et `thread/resume`. Cela garde `SOUL.md` et le contexte associé de persona/profil
d’espace de travail visibles sans dupliquer `AGENTS.md`.

## Ajouter Codex aux côtés d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer
librement entre Codex et des modèles de fournisseurs non-Codex. Un runtime forcé s’applique à chaque
tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que ce
runtime est forcé, OpenClaw tente quand même le harnais Codex et échoue de façon fermée au lieu de
router silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Gardez l’agent par défaut sur `agentRuntime.id: "auto"` et le repli PI pour l’usage mixte normal
  de fournisseurs.
- Utilisez les références héritées `codex/*` uniquement pour la compatibilité. Les nouvelles
  configurations doivent préférer `openai/*` avec une politique de runtime Codex explicite.

Par exemple, ceci garde l’agent par défaut sur la sélection automatique normale et ajoute un agent
Codex séparé :

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

- L’agent `main` par défaut utilise le chemin fournisseur normal et le repli de compatibilité PI.
- L’agent `codex` utilise le harnais de serveur d’application Codex.
- Si Codex est absent ou non pris en charge pour l’agent `codex`, le tour échoue au lieu d’utiliser
  discrètement PI.

## Routage des commandes d’agent

Les agents doivent router les demandes utilisateur selon l’intention, et non selon le seul mot « Codex » :

| L’utilisateur demande de...                                   | L’agent doit utiliser...                           |
| ------------------------------------------------------------- | -------------------------------------------------- |
| « Associer cette discussion à Codex »                         | `/codex bind`                                      |
| « Reprendre le fil Codex `<id>` ici »                         | `/codex resume <id>`                               |
| « Afficher les fils Codex »                                   | `/codex threads`                                   |
| « Envoyer un rapport de support pour une exécution Codex défectueuse » | `/diagnostics [note]`                              |
| « Envoyer uniquement un retour Codex pour ce fil joint »      | `/codex diagnostics [note]`                        |
| « Utiliser mon abonnement ChatGPT/Codex avec le runtime Codex » | `openai/*` plus `agentRuntime.id: "codex"`         |
| « Utiliser mon abonnement ChatGPT/Codex via PI »              | références de modèle `openai-codex/*`              |
| « Exécuter Codex via ACP/acpx »                               | ACP `sessions_spawn({ runtime: "acp", ... })`      |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un fil »   | ACP/acpx, pas `/codex` et pas de sous-agents natifs |

OpenClaw n’annonce les consignes de spawn ACP aux agents que lorsque ACP est activé, distribuable et
adossé à un backend de runtime chargé. Si ACP n’est pas disponible, l’invite système et les Skills du
Plugin ne doivent pas enseigner à l’agent le routage ACP.

## Déploiements Codex uniquement

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent intégré utilise Codex.
Les runtimes de Plugin explicites échouent de façon fermée et ne sont jamais retentés
silencieusement via PI :

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

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le serveur
d’application est trop ancien ou si le serveur d’application ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent exclusivement Codex pendant que l’agent par défaut conserve la sélection
automatique normale :

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

Utilisez les commandes de session normales pour changer d’agents et de modèles. `/new` crée une
nouvelle session OpenClaw et le harnais Codex crée ou reprend son fil de serveur d’application
sidecar selon les besoins. `/reset` efface l’association de session OpenClaw pour ce fil et permet au
tour suivant de résoudre à nouveau le harnais depuis la configuration actuelle.

## Découverte de modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. Si la découverte
échoue ou expire, il utilise un catalogue de repli groupé pour :

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

Le binaire géré est livré avec le paquet du Plugin `codex`. Cela garde la version du serveur
d’application liée au Plugin groupé plutôt qu’à la CLI Codex séparée qui se trouve installée
localement. Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter
un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales de harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et `sandbox: "danger-full-access"`. C’est la
posture d’opérateur local de confiance utilisée pour les Heartbeats autonomes : Codex peut utiliser
les outils shell et réseau sans s’arrêter sur des invites d’approbation natives auxquelles personne
n’est présent pour répondre.

Pour opter pour les approbations revues par le gardien Codex, définissez `appServer.mode:
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

Le mode Guardian utilise le chemin d’approbation native par auto-revue de Codex. Lorsque Codex demande
à quitter le bac à sable, à écrire hors de l’espace de travail ou à ajouter des permissions comme
l’accès réseau, Codex route cette demande d’approbation vers le réviseur natif au lieu d’une invite
humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse la demande spécifique.
Utilisez Guardian lorsque vous voulez davantage de garde-fous que le mode YOLO tout en permettant à
des agents sans surveillance de progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`. Les champs de politique
individuels remplacent toujours `mode`, afin que les déploiements avancés puissent combiner le
préréglage avec des choix explicites. L’ancienne valeur de réviseur `guardian_subagent` reste acceptée
comme alias de compatibilité, mais les nouvelles configurations doivent utiliser `auto_review`.

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

Les lancements de serveur d’application stdio héritent par défaut de l’environnement de processus
d’OpenClaw, mais OpenClaw possède le pont de compte du serveur d’application Codex et définit à la fois
`CODEX_HOME` et `HOME` vers des répertoires propres à l’agent sous l’état OpenClaw de cet agent. Le
chargeur de Skills propre à Codex lit `$CODEX_HOME/skills` et `$HOME/.agents/skills`, donc les deux
valeurs sont isolées pour les lancements locaux de serveur d’application. Cela garde les Skills,
Plugins, la configuration, les comptes et l’état de fil natifs Codex limités à l’agent OpenClaw au lieu
de fuir depuis le répertoire personnel CLI Codex de l’opérateur.

Les Plugins OpenClaw et les instantanés de Skills OpenClaw continuent de passer par le registre de
Plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles de la CLI Codex, non.
Si vous avez des Skills ou Plugins CLI Codex utiles qui doivent faire partie d’un agent OpenClaw,
inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l’espace de travail de l’agent OpenClaw
actuel. Les Plugins, hooks et fichiers de configuration natifs Codex sont signalés ou archivés pour
revue manuelle au lieu d’être activés automatiquement, car ils peuvent exécuter des commandes,
exposer des serveurs MCP ou transporter des identifiants.

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification Codex OpenClaw explicite pour l’agent.
2. Le compte existant du serveur d’application dans le répertoire personnel Codex de cet agent.
3. Pour les lancements locaux de serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et qu’une
   authentification OpenAI reste requise.

Lorsqu’OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela garde les clés d’API de
niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs sans faire facturer par
erreur les tours natifs du serveur d’application Codex via l’API. Les profils explicites de clé d’API
Codex et le repli local de clé d’environnement stdio utilisent la connexion au serveur d’application
au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket au serveur
d’application ne reçoivent pas le repli par clé d’API d’environnement du Gateway ; utilisez un profil
d’authentification explicite ou le compte propre du serveur d’application distant.

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

`appServer.clearEnv` affecte uniquement le processus enfant app-server Codex lancé.

Les outils dynamiques Codex utilisent par défaut le profil `native-first`. Dans ce mode,
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations d’espace de travail
natives de Codex : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et
`update_plan`. Les outils d’intégration OpenClaw tels que la messagerie, les sessions, les médias,
Cron, le navigateur, les Nodes, le Gateway, `heartbeat_respond` et `web_search` restent
disponibles.

Champs Plugin Codex de premier niveau pris en charge :

| Champ                      | Par défaut       | Signification                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Utilisez `"openclaw-compat"` pour exposer l’ensemble complet des outils dynamiques OpenClaw au app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours du app-server Codex.       |

Champs `appServer` pris en charge :

| Champ               | Par défaut                              | Signification                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                 |
| `command`           | binaire Codex géré                     | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                       |
| `url`               | non défini                             | URL WebSocket du app-server.                                                                                                                                                                                                               |
| `authToken`         | non défini                             | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                  |
| `headers`           | `{}`                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`  | `60000`                                | Délai d’expiration pour les appels du plan de contrôle du app-server.                                                                                                                                                                       |
| `mode`              | `"yolo"`                               | Préréglage pour l’exécution YOLO ou revue par un gardien.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                              | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du fil.                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                 | Mode sandbox natif Codex envoyé au démarrage ou à la reprise du fil.                                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                          |
| `serviceTier`       | non défini                             | Niveau de service facultatif du app-server Codex : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs non valides sont ignorées.                                                                                                           |

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas d’expiration du délai, OpenClaw annule le signal
de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse d’outil dynamique en échec afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête app-server limitée au tour Codex, le harnais
s’attend également à ce que Codex termine le tour natif avec `turn/completed`. Si le
app-server reste silencieux pendant 60 secondes après cette réponse, OpenClaw tente au mieux
d’interrompre le tour Codex, enregistre un délai d’expiration de diagnostic et libère la voie de session
OpenClaw afin que les messages de discussion suivants ne soient pas mis en file derrière un ancien
tour natif obsolète.

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
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans le
même fichier relu que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur est traitée dans son propre guide de configuration :
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use).

Version courte : OpenClaw ne vendore pas l’application de contrôle du bureau et n’exécute pas
lui-même les actions de bureau. Il prépare le app-server Codex, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex gérer les appels d’outils MCP natifs
pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux de marketplace Codex, enregistrez
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
serveur MCP Codex puisse contrôler les applications. Si `computerUse.enabled` est vrai et que le serveur MCP
est indisponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils natifs d’utilisation de l’ordinateur. Consultez
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les motifs de statut et le dépannage.

Lorsque `computerUse.autoInstall` est vrai, OpenClaw peut enregistrer la marketplace Codex Desktop
standard groupée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace locale. Utilisez `/new` ou `/reset` après
avoir modifié la configuration d’exécution ou d’utilisation de l’ordinateur afin que les sessions existantes ne conservent pas une ancienne
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

Approbations Codex revues par un gardien :

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

App-server distant avec des en-têtes explicites :

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
à un fil Codex existant, le tour suivant renvoie le modèle
OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service actuellement sélectionnés au
app-server. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison du fil, mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct au serveur d’application, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles en direct du serveur d’application Codex.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours de diagnostics Codex pour le thread attaché.
- `/codex computer-use status` vérifie le Plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le Plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` liste les Skills du serveur d’application Codex.

### Workflow de débogage courant

Lorsqu’un agent adossé à Codex fait quelque chose d’inattendu dans Telegram, Discord, Slack,
ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre courte note
   qui décrit ce que vous avez observé.
2. Approuvez la demande de diagnostics une fois. L’approbation crée le fichier zip de
   diagnostics local du Gateway et, comme la session utilise le harnais Codex, envoie
   aussi l’ensemble de retours Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bogue ou le fil de support.
   Elle inclut le chemin de l’ensemble local, le résumé de confidentialité, les identifiants de session OpenClaw,
   les identifiants de thread Codex et une ligne `Inspect locally` pour chaque thread Codex.
4. Si vous voulez déboguer l’exécution vous-même, exécutez la commande `Inspect locally`
   imprimée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le
   thread Codex natif afin que vous puissiez inspecter la conversation, la poursuivre localement
   ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser
les retours Codex pour le thread actuellement attaché, sans l’ensemble complet de diagnostics
du Gateway OpenClaw. Pour la plupart des rapports de support, `/diagnostics [note]` est
le meilleur point de départ, car il associe l’état local du Gateway et les identifiants de thread
Codex dans une seule réponse. Consultez [Export de diagnostics](/fr/gateway/diagnostics)
pour le modèle complet de confidentialité et le comportement dans les discussions de groupe.

Le cœur OpenClaw expose aussi `/diagnostics [note]`, réservé aux propriétaires, comme commande générale
de diagnostics du Gateway. Son invite d’approbation affiche le préambule sur les données sensibles,
renvoie vers [Export de diagnostics](/fr/gateway/diagnostics) et demande
`openclaw gateway diagnostics export --json` via une approbation d’exécution explicite
à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation,
OpenClaw envoie un rapport prêt à coller avec le chemin de l’ensemble local et le résumé du manifeste.
Lorsque la session OpenClaw active utilise le harnais Codex, cette même approbation autorise aussi l’envoi
des ensembles de retours Codex pertinents aux serveurs OpenAI. L’invite d’approbation indique que les retours
Codex seront envoyés, mais ne liste pas les identifiants de session ou de thread Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une discussion de groupe, OpenClaw garde le
canal partagé propre : le groupe ne reçoit qu’un bref avis, tandis que le préambule des diagnostics,
les invites d’approbation et les identifiants de session/thread Codex sont envoyés au propriétaire
via la route d’approbation privée. S’il n’existe aucune route privée vers le propriétaire,
OpenClaw refuse la demande de groupe et demande au propriétaire de l’exécuter depuis un message privé.

Le téléversement Codex approuvé appelle `feedback/upload` du serveur d’application Codex et demande
au serveur d’application d’inclure les journaux pour chaque thread listé et les sous-threads Codex générés
lorsqu’ils sont disponibles. Le téléversement passe par le chemin de retours normal de Codex vers les
serveurs OpenAI ; si les retours Codex sont désactivés dans ce serveur d’application, la commande renvoie
l’erreur du serveur d’application. La réponse de diagnostics terminée liste les canaux,
les identifiants de session OpenClaw, les identifiants de thread Codex et les commandes locales
`codex resume <thread-id>` pour les threads qui ont été envoyés. Si vous refusez ou ignorez l’approbation,
OpenClaw n’imprime pas ces identifiants Codex. Ce téléversement ne remplace pas l’export local de diagnostics
du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que le harnais utilise pour les tours normaux.
Au message suivant, OpenClaw reprend ce thread Codex, transmet le modèle OpenClaw actuellement sélectionné
au serveur d’application et garde l’historique étendu activé.

### Inspecter un thread Codex depuis la CLI

La manière la plus rapide de comprendre une mauvaise exécution Codex est souvent d’ouvrir directement
le thread Codex natif :

```sh
codex resume <thread-id>
```

Utilisez cela lorsque vous remarquez un bogue dans une conversation de canal et voulez inspecter la
session Codex problématique, la poursuivre localement ou demander à Codex pourquoi il a fait un choix
particulier d’outil ou de raisonnement. Le chemin le plus simple consiste généralement à exécuter
`/diagnostics [note]` d’abord : après votre approbation, le rapport terminé liste chaque thread Codex
et imprime une commande `Inspect locally`, par exemple `codex resume <thread-id>`. Vous pouvez copier
cette commande directement dans un terminal.

Vous pouvez aussi obtenir un identifiant de thread depuis `/codex binding` pour la discussion actuelle ou
`/codex threads [filter]` pour les threads récents du serveur d’application Codex, puis exécuter la même
commande `codex resume` dans votre shell.

La surface de commande requiert le serveur d’application Codex `0.125.0` ou plus récent. Les méthodes
de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un serveur
d’application futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire             | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/Plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router
le comportement des Plugins OpenClaw. Pour le pont pris en charge d’outils natifs et de permissions,
OpenClaw injecte une configuration Codex par thread pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`. Les autres hooks Codex comme `SessionStart` et
`UserPromptSubmit` restent des contrôles de niveau Codex ; ils ne sont pas exposés comme
hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé l’appel,
ce qui permet à OpenClaw de déclencher le comportement de Plugin et de middleware qu’il possède dans
l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut refléter certains événements, mais ne peut pas réécrire le thread Codex natif sauf si Codex
expose cette opération via le serveur d’application ou les callbacks de hook natifs.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications du serveur d’application
Codex et de l’état de l’adaptateur OpenClaw, pas de commandes de hook Codex natives.
Les événements OpenClaw `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` sont des observations au niveau de l’adaptateur, pas des captures octet pour octet
de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur d’application sont projetées
comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge V1

Le mode Codex n’est pas PI avec un appel de modèle différent en dessous. Codex possède une plus grande partie
de la boucle de modèle native, et OpenClaw adapte ses surfaces de Plugin et de session autour de cette limite.

Pris en charge dans l’exécution Codex v1 :

| Surface                                       | Prise en charge                        | Pourquoi                                                                                                                                                                                             |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                          | Le serveur d’application Codex possède le tour OpenAI, la reprise de thread native et la continuation d’outil native.                                                                                |
| Routage et livraison des canaux OpenClaw      | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors de l’exécution du modèle.                                                                                       |
| Outils dynamiques OpenClaw                    | Pris en charge                          | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                      |
| Plugins de prompt et de contexte              | Pris en charge                          | OpenClaw construit des surcouches de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le thread.                                                                  |
| Cycle de vie du moteur de contexte            | Pris en charge                          | L’assemblage, l’ingestion ou la maintenance après tour, ainsi que la coordination de Compaction du moteur de contexte, s’exécutent pour les tours Codex.                                             |
| Hooks d’outils dynamiques                     | Pris en charge                          | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                          |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                     |
| Gate de révision de réponse finale            | Pris en charge via le relais de hook natif | Codex `Stop` est relayé vers `before_agent_finalize` ; `revise` demande à Codex une passe de modèle supplémentaire avant la finalisation.                                                            |
| Blocage ou observation du shell natif, des patchs et de MCP | Pris en charge via le relais de hook natif | Codex `PreToolUse` et `PostToolUse` sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permissions native               | Pris en charge via le relais de hook natif | Codex `PermissionRequest` peut être routé via la politique OpenClaw lorsque l’exécution l’expose. Si OpenClaw ne renvoie aucune décision, Codex continue par son gardien normal ou son chemin d’approbation utilisateur. |
| Capture de trajectoire du serveur d’application | Pris en charge                        | OpenClaw enregistre la requête envoyée au serveur d’application et les notifications de serveur d’application qu’il reçoit.                                                                          |

Non pris en charge dans l’exécution Codex v1 :

| Surface                                             | Limite V1                                                                                                                                     | Voie future                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les hooks pré-outil natifs de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs Codex.                         | Nécessite la prise en charge par les hooks/schémas Codex du remplacement de l’entrée d’outil. |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique natif du fil. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites de serveur d’application Codex si une chirurgie du fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                       | Pourrait mettre en miroir des enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées de Compaction natives riches            | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de jetons ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                  |
| Intervention de Compaction                          | Les hooks de Compaction OpenClaw actuels sont de niveau notification en mode Codex.                                                             | Ajouter des hooks de Compaction pré/post Codex si les plugins doivent opposer un veto à la Compaction native ou la réécrire. |
| Capture octet pour octet des requêtes d’API de modèle | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur Codex construit en interne la requête finale de l’API OpenAI. | Nécessite un événement de traçage des requêtes de modèle Codex ou une API de débogage.     |

## Outils, médias et Compaction

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hooks natifs est volontairement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils et de permissions natifs Codex testés par OpenClaw. Dans
le runtime Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex constitue une surface de plugin OpenClaw tant que le contrat de runtime ne le nomme pas
explicitement.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de
décision de hook et bascule vers son propre gardien ou chemin d’approbation utilisateur.

Les sollicitations d’approbation d’outils MCP Codex sont acheminées via le flux
d’approbation de plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées au chat
d’origine, et le message de suivi suivant en file d’attente répond à cette requête de serveur
native au lieu d’être orienté comme contexte supplémentaire. Les autres demandes de sollicitation MCP
échouent toujours fermées.

Le pilotage de file d’attente d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
paramètre par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file d’attente
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` séparées. Les tours de
revue Codex et de Compaction manuelle peuvent rejeter le pilotage dans le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise le repli. Voir
[File de pilotage](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du fil est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir de transcription pour l’historique des canaux,
la recherche, `/new`, `/reset` et le futur changement de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw n’enregistre que
les signaux de début et de fin de Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste vérifiable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil de transcription de session possédé par OpenClaw.

La génération de médias ne nécessite pas PI. Les images, la vidéo, la musique, les PDF, le TTS et la
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
runtime Codex forcé échoue au lieu de se replier vers PI. Une fois le serveur d’application Codex
sélectionné, ses échecs remontent directement.

**Le serveur d’application est rejeté :** mettez Codex à niveau afin que la négociation du serveur d’application
signale la version `0.125.0` ou une version plus récente. Les préversions de même version ou les versions suffixées
par build telles que `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car le
plancher de protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant parle la même version du protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une référence héritée
`codex/*`. Les références simples `openai/gpt-*` et les autres références de fournisseurs restent sur leur chemin
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque tour intégré
pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si cela persiste, redémarrez
le Gateway pour effacer les enregistrements de hooks natifs obsolètes. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop et réessayez.

## Connexe

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de plugins](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
