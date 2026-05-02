---
read_when:
    - Vous souhaitez utiliser le harnais de serveur d’application Codex intégré
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements Codex uniquement échouent au lieu de se rabattre sur PI
summary: Exécuter les tours de l’agent intégré OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-02T07:13:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqués via le
serveur d’application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d’agent de bas niveau : découverte
de modèles, reprise native de fil de discussion, Compaction native et exécution par serveur
d’application. OpenClaw conserve la responsabilité des canaux de discussion, des fichiers de session,
de la sélection de modèle, des outils, des approbations, de la livraison des médias et du miroir
visible de la transcription.

Lorsqu’un tour de discussion source passe par le harnais Codex, les réponses visibles utilisent par
défaut l’outil OpenClaw `message` si le déploiement n’a pas configuré explicitement
`messages.visibleReplies`. L’agent peut toujours terminer son tour Codex en privé ;
il ne publie sur le canal que lorsqu’il appelle `message(action="send")`. Définissez
`messages.visibleReplies: "automatic"` pour conserver les réponses finales en discussion directe sur
l’ancien chemin de livraison automatique.

Les tours de Heartbeat Codex reçoivent aussi l’outil `heartbeat_respond` par défaut, afin que
l’agent puisse enregistrer si le réveil doit rester silencieux ou notifier sans encoder
ce flux de contrôle dans le texte final.

Si vous essayez de vous orienter, commencez par
[Environnements d’exécution des agents](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est l’environnement d’exécution, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Configuration rapide

La plupart des utilisateurs qui veulent « Codex dans OpenClaw » veulent cette route : se connecter avec un
abonnement ChatGPT/Codex, puis exécuter les tours d’agent embarqués via l’environnement d’exécution natif
du serveur d’application Codex. La référence de modèle reste canonique sous la forme
`openai/gpt-*` ; l’authentification par abonnement provient du compte/profil Codex, et non
d’un préfixe de modèle `openai-codex/*`.

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
        fallback: "none",
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

N’utilisez pas `openai-codex/gpt-*` lorsque vous voulez dire environnement d’exécution Codex natif. Ce préfixe
est la route explicite « Codex OAuth via PI ». Les changements de configuration s’appliquent aux sessions nouvelles ou
réinitialisées ; les sessions existantes conservent leur environnement d’exécution enregistré.

## Ce que ce Plugin change

Le Plugin `codex` intégré apporte plusieurs capacités distinctes :

| Capacité                          | Comment l’utiliser                                   | Ce qu’elle fait                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Environnement d’exécution embarqué natif | `agentRuntime.id: "codex"`                          | Exécute les tours d’agent embarqués OpenClaw via le serveur d’application Codex. |
| Commandes natives de contrôle de discussion | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les fils de discussion du serveur d’application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue de serveur d’application Codex | Internes `codex`, exposés via le harnais            | Permet à l’environnement d’exécution de découvrir et valider les modèles du serveur d’application. |
| Chemin de compréhension média Codex | Chemins de compatibilité de modèles d’image `codex/*` | Exécute des tours bornés du serveur d’application Codex pour les modèles de compréhension d’image pris en charge. |
| Relais de hooks natifs            | Hooks de Plugin autour des événements natifs Codex   | Permet à OpenClaw d’observer/bloquer les événements d’outil/finalisation natifs Codex pris en charge. |

Activer le Plugin rend ces capacités disponibles. Cela ne fait **pas** :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` en environnement d’exécution natif
- faire d’ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un environnement d’exécution PI
- remplacer la livraison par canal OpenClaw, les fichiers de session, le stockage des profils d’authentification ou
  le routage des messages

Le même Plugin possède aussi la surface native de commande de contrôle de discussion `/codex`. Si
le Plugin est activé et que l’utilisateur demande à lier, reprendre, orienter, arrêter ou inspecter
des fils de discussion Codex depuis le chat, les agents doivent préférer `/codex ...` à ACP. ACP reste
le repli explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur ACP
Codex.

Les tours Codex natifs conservent les hooks de Plugin OpenClaw comme couche de compatibilité publique.
Ce sont des hooks OpenClaw en processus, et non des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription mis en miroir
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les Plugins peuvent aussi enregistrer un middleware de résultat d’outil neutre vis-à-vis de l’environnement d’exécution pour réécrire
les résultats des outils dynamiques OpenClaw après qu’OpenClaw a exécuté l’outil et avant que le
résultat soit renvoyé à Codex. C’est distinct du hook de Plugin public
`tool_result_persist`, qui transforme les écritures de résultats d’outil de transcription possédées par OpenClaw.

Pour la sémantique des hooks de Plugin eux-mêmes, consultez [Hooks de Plugin](/fr/plugins/hooks)
et [Comportement de garde des Plugins](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
veulent une exécution native par serveur d’application. Les anciennes références de modèle `codex/*` sélectionnent encore automatiquement
le harnais par compatibilité, mais les anciens préfixes de fournisseur adossés à un environnement d’exécution
ne sont pas affichés comme choix normaux de modèle/fournisseur.

Si le Plugin `codex` est activé mais que le modèle principal reste
`openai-codex/*`, `openclaw doctor` avertit au lieu de changer la route. C’est
intentionnel : `openai-codex/*` reste le chemin Codex OAuth/abonnement via PI, et
l’exécution native par serveur d’application reste un choix explicite d’environnement d’exécution.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                              | Référence de modèle       | Configuration de l’environnement d’exécution | Route d’authentification/profil | Libellé d’état attendu         |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Abonnement ChatGPT/Codex avec environnement d’exécution Codex natif | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth ou compte Codex | `Runtime: OpenAI Codex`        |
| API OpenAI via le runner OpenClaw normal            | `openai/gpt-*`             | omis ou `runtime: "pi"`                | Clé API OpenAI               | `Runtime: OpenClaw Pi Default` |
| Abonnement ChatGPT/Codex via PI                     | `openai-codex/gpt-*`       | omis ou `runtime: "pi"`                | Fournisseur OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Fournisseurs mixtes avec mode automatique conservateur | références propres au fournisseur | `agentRuntime.id: "auto"`              | Selon le fournisseur sélectionné | Dépend de l’environnement d’exécution sélectionné |
| Session explicite d’adaptateur ACP Codex             | Selon l’invite/le modèle ACP | `sessions_spawn` avec `runtime: "acp"` | Authentification du backend ACP | État de tâche/session ACP      |

La séparation importante est fournisseur contre environnement d’exécution :

- `openai-codex/*` répond à « quelle route fournisseur/authentification PI doit-il utiliser ? »
- `agentRuntime.id: "codex"` répond à « quelle boucle doit exécuter ce
  tour embarqué ? »
- `/codex ...` répond à « à quelle conversation Codex native ce chat doit-il se lier
  ou laquelle doit-il contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI sont spécifiques au préfixe. Pour la configuration courante abonnement plus
environnement d’exécution Codex natif, utilisez `openai/*` avec `agentRuntime.id: "codex"`.
Utilisez `openai-codex/*` uniquement lorsque vous voulez intentionnellement Codex OAuth via PI :

| Référence de modèle                         | Chemin d’environnement d’exécution              | À utiliser quand                                                           |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez un accès actuel direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth via OpenClaw/PI            | Vous voulez l’authentification d’abonnement ChatGPT/Codex avec le runner PI par défaut. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harnais du serveur d’application Codex        | Vous voulez l’authentification d’abonnement ChatGPT/Codex avec l’exécution Codex native. |

GPT-5.5 peut apparaître à la fois sur les routes par clé API OpenAI directe et par abonnement Codex
lorsque votre compte les expose. Utilisez `openai/gpt-5.5` avec le harnais du serveur d’application Codex
pour l’environnement d’exécution Codex natif, `openai-codex/gpt-5.5` pour PI OAuth, ou
`openai/gpt-5.5` sans remplacement d’environnement d’exécution Codex pour le trafic direct par clé API.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de
compatibilité de doctor réécrit les anciennes références d’environnement d’exécution principal vers des références de modèle canoniques
et enregistre séparément la stratégie d’environnement d’exécution, tandis que les anciennes références uniquement de repli
sont laissées inchangées parce que l’environnement d’exécution est configuré pour tout le conteneur d’agent.
Les nouvelles configurations PI Codex OAuth doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de
harnais natif de serveur d’application doivent utiliser `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation de préfixe. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d’image doit passer par le chemin de fournisseur OpenAI
Codex OAuth. Utilisez `codex/gpt-*` lorsque la compréhension d’image doit passer
par un tour borné du serveur d’application Codex. Le modèle du serveur d’application Codex doit
annoncer la prise en charge de l’entrée image ; les modèles Codex texte seul échouent avant le démarrage du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection surprend, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du gateway. Il
inclut l’identifiant du harnais sélectionné, la raison de la sélection, la stratégie d’environnement d’exécution/repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat de Plugin.

### Ce que signifient les avertissements de doctor

`openclaw doctor` avertit lorsque toutes ces conditions sont vraies :

- le Plugin `codex` intégré est activé ou autorisé
- le modèle principal d’un agent est `openai-codex/*`
- l’environnement d’exécution effectif de cet agent n’est pas `codex`

Cet avertissement existe parce que les utilisateurs s’attendent souvent à ce que « Plugin Codex activé » implique
« environnement d’exécution natif du serveur d’application Codex ». OpenClaw ne fait pas ce saut. L’avertissement
signifie :

- **Aucun changement n’est requis** si vous vouliez ChatGPT/Codex OAuth via PI.
- Changez le modèle en `openai/<model>` et définissez
  `agentRuntime.id: "codex"` si vous vouliez une exécution native par serveur d’application.
- Les sessions existantes ont encore besoin de `/new` ou `/reset` après un changement d’environnement d’exécution,
  parce que les épingles d’environnement d’exécution de session sont persistantes.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour embarqué s’exécute,
OpenClaw enregistre l’identifiant du harnais sélectionné sur cette session et continue de l’utiliser pour
les tours suivants avec le même identifiant de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante
entre PI et Codex. Cela évite de rejouer une même transcription via
deux systèmes de session natifs incompatibles.

Les anciennes sessions créées avant les épingles de harnais sont considérées comme épinglées à PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire passer cette conversation à
Codex après avoir modifié la configuration.

`/status` affiche l’environnement d’exécution effectif du modèle. Le mécanisme d’exécution PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le mécanisme d’exécution du serveur d’application Codex apparaît comme
`Runtime: OpenAI Codex`.

## Prérequis

- OpenClaw avec le Plugin `codex` fourni disponible.
- Serveur d’application Codex `0.125.0` ou plus récent. Le Plugin fourni gère par défaut un binaire de serveur d’application Codex compatible, de sorte que les commandes locales `codex` sur le `PATH` n’affectent pas le démarrage normal du mécanisme d’exécution.
- Authentification Codex disponible pour le processus du serveur d’application ou pour le pont d’authentification Codex d’OpenClaw. Les lancements locaux du serveur d’application utilisent un répertoire personnel Codex géré par OpenClaw pour chaque agent et un `HOME` enfant isolé ; ils ne lisent donc pas par défaut votre compte, vos Skills, vos Plugins, votre configuration, votre état de thread ni vos Skills natives dans `$HOME/.agents/skills` personnels sous `~/.codex`.

Le Plugin bloque les handshakes de serveurs d’application plus anciens ou sans version. Cela maintient OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement du compte Codex CLI ou d’un profil d’authentification OpenClaw `openai-codex`. Les lancements locaux du serveur d’application stdio peuvent aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun compte n’est présent.

## Ajouter Codex avec d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement entre Codex et des modèles de fournisseurs non-Codex. Un environnement d’exécution forcé s’applique à chaque tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que cet environnement d’exécution est forcé, OpenClaw tente quand même d’utiliser le mécanisme Codex et échoue de manière fermée au lieu d’acheminer silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Gardez l’agent par défaut sur `agentRuntime.id: "auto"` et le repli PI pour l’usage mixte normal avec plusieurs fournisseurs.
- Utilisez les références héritées `codex/*` uniquement pour compatibilité. Les nouvelles configurations devraient préférer `openai/*` avec une politique d’environnement d’exécution Codex explicite.

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
        fallback: "pi",
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
- L’agent `codex` utilise le mécanisme du serveur d’application Codex.
- Si Codex est manquant ou non pris en charge pour l’agent `codex`, le tour échoue au lieu d’utiliser discrètement PI.

## Routage des commandes d’agent

Les agents doivent router les requêtes utilisateur selon l’intention, pas seulement selon le mot « Codex » :

| L’utilisateur demande...                              | L’agent doit utiliser...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| « Lier cette discussion à Codex »                      | `/codex bind`                                    |
| « Reprendre le thread Codex `<id>` ici »               | `/codex resume <id>`                             |
| « Afficher les threads Codex »                         | `/codex threads`                                 |
| « Déposer un rapport d’assistance pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoyer uniquement un retour Codex pour ce thread joint » | `/codex diagnostics [note]`                      |
| « Utiliser mon abonnement ChatGPT/Codex avec l’environnement d’exécution Codex » | `openai/*` plus `agentRuntime.id: "codex"`       |
| « Utiliser mon abonnement ChatGPT/Codex via PI »       | Références de modèle `openai-codex/*`            |
| « Exécuter Codex via ACP/acpx »                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un thread » | ACP/acpx, pas `/codex` et pas les sous-agents natifs |

OpenClaw n’annonce aux agents les instructions de spawn ACP que lorsque ACP est activé, dispatchable et adossé à un backend d’environnement d’exécution chargé. Si ACP n’est pas disponible, le prompt système et les Skills du Plugin ne doivent pas enseigner à l’agent le routage ACP.

## Déploiements uniquement Codex

Forcez le mécanisme Codex lorsque vous devez prouver que chaque tour d’agent intégré utilise Codex. Les environnements d’exécution de Plugins explicites n’ont par défaut aucun repli PI ; `fallback: "none"` est donc optionnel, mais souvent utile comme documentation :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Surcharge d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le serveur d’application est trop ancien ou si le serveur d’application ne peut pas démarrer. Définissez `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` uniquement si vous voulez intentionnellement que PI gère une sélection de mécanisme manquante.

## Codex par agent

Vous pouvez rendre un agent uniquement Codex pendant que l’agent par défaut conserve la sélection automatique normale :

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session normales pour changer d’agents et de modèles. `/new` crée une nouvelle session OpenClaw, et le mécanisme Codex crée ou reprend son thread sidecar de serveur d’application selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce thread et permet au tour suivant de résoudre à nouveau le mécanisme à partir de la configuration actuelle.

## Découverte des modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. Si la découverte échoue ou expire, il utilise un catalogue de repli fourni pour :

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

## Connexion et politique du serveur d’application

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est livré avec le package du Plugin `codex`. Cela lie la version du serveur d’application au Plugin fourni plutôt qu’à tout CLI Codex distinct éventuellement installé localement. Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales du mécanisme Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. C’est la posture d’opérateur local de confiance utilisée pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans s’arrêter sur des invites d’approbation natives auxquelles personne n’est présent pour répondre.

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

Le mode Guardian utilise le chemin d’approbation avec auto-relecture natif de Codex. Lorsque Codex demande à sortir du sandbox, à écrire en dehors de l’espace de travail ou à ajouter des permissions comme l’accès réseau, Codex route cette demande d’approbation vers le réviseur natif au lieu d’une invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse la demande spécifique. Utilisez Guardian lorsque vous voulez davantage de garde-fous que le mode YOLO, tout en ayant besoin que les agents sans surveillance puissent progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels continuent de remplacer `mode`, ce qui permet aux déploiements avancés de mélanger le préréglage avec des choix explicites. L’ancienne valeur de réviseur `guardian_subagent` est encore acceptée comme alias de compatibilité, mais les nouvelles configurations devraient utiliser `auto_review`.

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

Les lancements stdio du serveur d’application héritent par défaut de l’environnement du processus OpenClaw, mais OpenClaw possède le pont de compte du serveur d’application Codex et définit à la fois `CODEX_HOME` et `HOME` sur des répertoires par agent dans l’état OpenClaw de cet agent. Le chargeur de Skills propre à Codex lit `$CODEX_HOME/skills` et
`$HOME/.agents/skills`, de sorte que les deux valeurs sont isolées pour les lancements locaux du serveur d’application. Cela garde les Skills natives Codex, les Plugins, la configuration, les comptes et l’état des threads limités à l’agent OpenClaw au lieu de provenir par fuite du répertoire personnel Codex CLI personnel de l’opérateur.

Les Plugins OpenClaw et les instantanés de Skills OpenClaw continuent de passer par le registre de Plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles du Codex CLI ne le font pas. Si vous avez des Skills ou Plugins Codex CLI utiles qui doivent faire partie d’un agent OpenClaw, inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l’espace de travail de l’agent OpenClaw actuel. Les Plugins natifs Codex, les hooks et les fichiers de configuration sont signalés ou archivés pour revue manuelle au lieu d’être activés automatiquement, car ils peuvent exécuter des commandes, exposer des serveurs MCP ou porter des identifiants.

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant du serveur d’application dans le répertoire personnel Codex de cet agent.
3. Pour les lancements locaux du serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et que l’authentification OpenAI reste requise.

Quand OpenClaw voit un profil d’authentification Codex de style abonnement ChatGPT, il retire `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela garde les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs sans faire facturer par erreur les tours natifs du serveur d’application Codex via l’API. Les profils explicites à clé API Codex et le repli local par clés d’environnement stdio utilisent la connexion du serveur d’application plutôt que l’environnement hérité du processus enfant. Les connexions WebSocket au serveur d’application ne reçoivent pas le repli de clé API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le propre compte du serveur d’application distant.

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
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations d’espace de travail natives Codex : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et
`update_plan`. Les outils d’intégration OpenClaw comme la messagerie, les sessions, les médias, Cron, le navigateur, les nœuds, Gateway, `heartbeat_respond` et `web_search` restent disponibles.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Valeur par défaut | Signification                                                                                      |
| -------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`  | Utilisez `"openclaw-compat"` pour exposer l’ensemble complet des outils dynamiques OpenClaw à Codex app-server. |
| `codexDynamicToolsExclude` | `[]`              | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours Codex app-server.            |

Champs `appServer` pris en charge :

| Champ               | Valeur par défaut                      | Signification                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                 |
| `command`           | binaire Codex géré                     | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                        |
| `url`               | non défini                             | URL WebSocket de l’app-server.                                                                                                                                                                                                             |
| `authToken`         | non défini                             | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                  |
| `headers`           | `{}`                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`  | `60000`                                | Délai d’expiration pour les appels du plan de contrôle de l’app-server.                                                                                                                                                                    |
| `mode`              | `"yolo"`                               | Préréglage pour l’exécution YOLO ou révisée par le gardien.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                              | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du fil.                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                 | Mode sandbox natif Codex envoyé au démarrage ou à la reprise du fil.                                                                                                                                                                       |
| `approvalsReviewer` | `"user"`                               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                         |
| `serviceTier`       | non défini                             | Niveau de service optionnel de Codex app-server : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs non valides sont ignorées.                                                                                                           |

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas d’expiration, OpenClaw interrompt le signal de l’outil
lorsque cela est pris en charge et renvoie à Codex une réponse d’outil dynamique échouée afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête app-server limitée au tour Codex, le harnais
s’attend également à ce que Codex termine le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant 60 secondes après cette réponse, OpenClaw interrompt
au mieux le tour Codex, enregistre un délai d’expiration de diagnostic et libère la voie
de session OpenClaw afin que les messages de discussion suivants ne soient pas mis en file
derrière un ancien tour natif.

Les substitutions d’environnement restent disponibles pour les tests locaux :

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
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans le
même fichier révisé que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur est couverte dans son propre guide de configuration :
[Utilisation de l’ordinateur Codex](/fr/plugins/codex-computer-use).

La version courte : OpenClaw ne fournit pas l’application de contrôle du bureau ni n’exécute
lui-même des actions sur le bureau. Il prépare Codex app-server, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex gérer les appels d’outils MCP natifs
pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux de marketplace Codex, enregistrez
`cua-driver mcp` avec `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consultez [Utilisation de l’ordinateur Codex](/fr/plugins/codex-computer-use) pour la distinction
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
        fallback: "none",
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
serveur MCP Codex puisse contrôler des applications. Si `computerUse.enabled` est true et que le serveur MCP
n’est pas disponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils natifs d’utilisation de l’ordinateur. Consultez
[Utilisation de l’ordinateur Codex](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les raisons d’état et le dépannage.

Lorsque `computerUse.autoInstall` est true, OpenClaw peut enregistrer la marketplace standard
Codex Desktop groupée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace locale. Utilisez `/new` ou `/reset` après
avoir modifié la configuration d’exécution ou d’utilisation de l’ordinateur afin que les sessions existantes ne conservent pas une ancienne
liaison de fil Pi ou Codex.

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

Approbations Codex révisées par le gardien :

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
à un fil Codex existant, le tour suivant envoie de nouveau à
l’app-server le modèle OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service
actuellement sélectionnés. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison du fil, mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le Plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles Codex app-server en direct.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un fil Codex existant.
- `/codex compact` demande à Codex app-server de compacter le fil attaché.
- `/codex review` lance la révision native Codex pour le fil attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer des retours de diagnostic Codex pour le fil attaché.
- `/codex computer-use status` vérifie le Plugin d’utilisation de l’ordinateur configuré et le serveur MCP.
- `/codex computer-use install` installe le Plugin d’utilisation de l’ordinateur configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP Codex app-server.
- `/codex skills` liste les Skills Codex app-server.

### Flux de débogage courant

Lorsqu’un agent adossé à Codex fait quelque chose de surprenant dans Telegram, Discord, Slack
ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre note courte
   qui décrit ce que vous avez observé.
2. Approuvez la demande de diagnostics une fois. L’approbation crée le zip de
   diagnostics du Gateway local et, comme la session utilise le harnais Codex, envoie
   aussi le paquet de retour Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bogue ou le fil de support.
   Elle inclut le chemin du paquet local, le résumé de confidentialité, les identifiants de session OpenClaw,
   les identifiants de fil Codex, et une ligne `Inspect locally` pour chaque fil Codex.
4. Si vous souhaitez déboguer l’exécution vous-même, exécutez la commande
   `Inspect locally` imprimée dans un terminal. Elle ressemble à
   `codex resume <thread-id>` et ouvre le fil Codex natif afin que vous puissiez inspecter
   la conversation, la poursuivre localement, ou demander à Codex pourquoi il a choisi
   un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement
l’envoi du retour Codex pour le fil actuellement attaché sans le paquet complet de
diagnostics du Gateway OpenClaw. Pour la plupart des rapports de support,
`/diagnostics [note]` est le meilleur point de départ, car il relie l’état du Gateway
local et les identifiants de fil Codex dans une seule réponse. Consultez
[Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité complet
et le comportement en conversation de groupe.

Le noyau OpenClaw expose également `/diagnostics [note]`, réservé aux propriétaires,
comme commande générale de diagnostics du Gateway. Son invite d’approbation affiche
le préambule sur les données sensibles, renvoie vers
[Export de diagnostics](/fr/gateway/diagnostics), et demande
`openclaw gateway diagnostics export --json` via une approbation d’exécution explicite
à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale.
Après approbation, OpenClaw envoie un rapport prêt à coller avec le chemin du paquet
local et le résumé du manifeste. Lorsque la session OpenClaw active utilise le harnais
Codex, cette même approbation autorise aussi l’envoi des paquets de retour Codex
pertinents aux serveurs OpenAI. L’invite d’approbation indique que le retour Codex sera
envoyé, mais elle ne liste pas les identifiants de session ou de fil Codex avant
l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une conversation de groupe,
OpenClaw garde le canal partagé propre : le groupe ne reçoit qu’un bref avis, tandis
que le préambule de diagnostics, les invites d’approbation et les identifiants de
session/fil Codex sont envoyés au propriétaire via la route d’approbation privée.
S’il n’existe aucune route privée vers le propriétaire, OpenClaw refuse la demande du
groupe et demande au propriétaire de l’exécuter depuis un message privé.

L’envoi Codex approuvé appelle `feedback/upload` du serveur d’application Codex et
demande au serveur d’application d’inclure les journaux de chaque fil listé et des
sous-fils Codex générés lorsqu’ils sont disponibles. L’envoi passe par le chemin de
retour normal de Codex vers les serveurs OpenAI ; si le retour Codex est désactivé
dans ce serveur d’application, la commande renvoie l’erreur du serveur d’application.
La réponse de diagnostics terminée liste les canaux, les identifiants de session
OpenClaw, les identifiants de fil Codex, et les commandes locales
`codex resume <thread-id>` pour les fils qui ont été envoyés. Si vous refusez ou
ignorez l’approbation, OpenClaw n’imprime pas ces identifiants Codex. Cet envoi ne
remplace pas l’export de diagnostics du Gateway local.

`/codex resume` écrit le même fichier de liaison compagnon que celui utilisé par le
harnais pour les tours normaux. Au message suivant, OpenClaw reprend ce fil Codex,
transmet le modèle OpenClaw actuellement sélectionné au serveur d’application, et
garde l’historique étendu activé.

### Inspecter un fil Codex depuis la CLI

La façon la plus rapide de comprendre une mauvaise exécution Codex est souvent
d’ouvrir directement le fil Codex natif :

```sh
codex resume <thread-id>
```

Utilisez ceci lorsque vous remarquez un bogue dans une conversation de canal et que
vous souhaitez inspecter la session Codex problématique, la poursuivre localement, ou
demander à Codex pourquoi il a fait un choix d’outil ou de raisonnement particulier.
Le chemin le plus simple consiste généralement à exécuter d’abord
`/diagnostics [note]` : après votre approbation, le rapport terminé liste chaque fil
Codex et imprime une commande `Inspect locally`, par exemple
`codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un
terminal.

Vous pouvez aussi obtenir un identifiant de fil depuis `/codex binding` pour la
conversation actuelle ou `/codex threads [filter]` pour les fils récents du serveur
d’application Codex, puis exécuter la même commande `codex resume` dans votre shell.

La surface de commande exige le serveur d’application Codex `0.125.0` ou une version
plus récente. Les méthodes de contrôle individuelles sont signalées comme
`unsupported by this Codex app-server` si un serveur d’application futur ou personnalisé
n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire              | Objectif                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de plugins OpenClaw             | OpenClaw                  | Compatibilité produit/plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins intégrés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` Codex de projet ou globaux pour router
le comportement des plugins OpenClaw. Pour le pont d’outils natifs et de permissions
pris en charge, OpenClaw injecte une configuration Codex par fil pour `PreToolUse`,
`PostToolUse`, `PermissionRequest`, et `Stop`. Les autres hooks Codex comme
`SessionStart` et `UserPromptSubmit` restent des contrôles de niveau Codex ; ils ne
sont pas exposés comme hooks de plugins OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, donc OpenClaw déclenche le comportement de plugin et de middleware qu’il
possède dans l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède
l’enregistrement d’outil canonique. OpenClaw peut répliquer certains événements, mais
il ne peut pas réécrire le fil Codex natif, sauf si Codex expose cette opération via le
serveur d’application ou les rappels de hook natifs.

Les projections de Compaction et du cycle de vie LLM proviennent des notifications du
serveur d’application Codex et de l’état de l’adaptateur OpenClaw, pas de commandes de
hooks Codex natives. Les événements `before_compaction`, `after_compaction`,
`llm_input`, et `llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur,
pas des captures octet pour octet de la requête interne ou des charges utiles de
Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur
d’application sont projetées comme événements d’agent `codex_app_server.hook` pour la
trajectoire et le débogage. Elles n’invoquent pas les hooks de plugins OpenClaw.

## Contrat de prise en charge v1

Le mode Codex n’est pas PI avec un appel à un modèle différent en dessous. Codex
possède une plus grande partie de la boucle de modèle native, et OpenClaw adapte ses
surfaces de plugin et de session autour de cette limite.

Pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                       | Prise en charge                         | Pourquoi                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                          | Le serveur d’application Codex possède le tour OpenAI, la reprise du fil natif, et la continuation des outils natifs.                                                                                 |
| Routage et livraison des canaux OpenClaw      | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage, et les autres canaux restent hors de l’environnement d’exécution du modèle.                                                                             |
| Outils dynamiques OpenClaw                    | Pris en charge                          | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                       |
| Plugins de prompt et de contexte              | Pris en charge                          | OpenClaw construit des superpositions de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le fil.                                                                   |
| Cycle de vie du moteur de contexte            | Pris en charge                          | L’assemblage, l’ingestion ou la maintenance après tour, et la coordination de Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                       |
| Hooks d’outils dynamiques                     | Pris en charge                          | `before_tool_call`, `after_tool_call`, et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                           |
| Hooks de cycle de vie                         | Pris en charge comme observations de l’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                      |
| Porte de révision de la réponse finale        | Pris en charge via le relais de hook natif | Le `Stop` Codex est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                          |
| Blocage ou observation du shell, des patchs, et de MCP natifs | Pris en charge via le relais de hook natif | `PreToolUse` et `PostToolUse` Codex sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permissions native               | Pris en charge via le relais de hook natif | `PermissionRequest` Codex peut être routé via la politique OpenClaw lorsque l’environnement d’exécution l’expose. Si OpenClaw ne renvoie aucune décision, Codex continue via son gardien normal ou le chemin d’approbation utilisateur. |
| Capture de trajectoire du serveur d’application | Pris en charge                          | OpenClaw enregistre la requête qu’il a envoyée au serveur d’application et les notifications du serveur d’application qu’il reçoit.                                                                   |

Non pris en charge dans l’environnement d’exécution Codex v1 :

| Surface                                             | Limite V1                                                                                                                                     | Évolution future                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation des arguments d’outil natifs                       | Les hooks pré-outil natifs de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs de Codex.                                               | Nécessite la prise en charge par les hooks/schémas Codex du remplacement de l’entrée d’outil.                            |
| Historique de transcription natif de Codex modifiable            | Codex possède l’historique canonique du fil natif. OpenClaw possède un miroir et peut projeter un contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites de serveur d’application Codex si une modification chirurgicale du fil natif est nécessaire.                    |
| `tool_result_persist` pour les enregistrements d’outils natifs de Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs de Codex.                                                           | Pourrait mettre en miroir les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex.              |
| Métadonnées riches de Compaction native                     | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de tokens ni de charge utile de résumé.            | Nécessite des événements de Compaction Codex plus riches.                                                     |
| Intervention de Compaction                             | Les hooks de Compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                                         | Ajouter des hooks Codex pré/post Compaction si les plugins doivent opposer un veto à la Compaction native ou la réécrire. |
| Capture octet pour octet des requêtes d’API de modèle             | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur Codex construit la requête finale à l’API OpenAI en interne.                      | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.                                   |

## Outils, médias et Compaction

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques du
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hooks natifs est intentionnellement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils et d’autorisations natifs de Codex qu’OpenClaw teste. Dans
l’environnement d’exécution Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex est une surface de plugin OpenClaw tant que le contrat d’exécution ne le
nomme pas.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme l’absence de
décision de hook et bascule vers son propre chemin de gardien ou d’approbation utilisateur.

Les sollicitations d’approbation d’outils MCP Codex sont routées via le flux
d’approbation de plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées au
chat d’origine, et le message de suivi suivant dans la file répond à cette requête
du serveur natif au lieu d’être orienté comme contexte supplémentaire. Les autres requêtes de sollicitation
MCP échouent toujours de manière fermée.

L’orientation de la file d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
mode par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file
pour la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` séparées. Les tours de revue
Codex et de Compaction manuelle peuvent rejeter l’orientation sur le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise le repli. Consultez
[File d’orientation](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du fil est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir de transcription pour l’historique
des canaux, la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw ne
consigne que les signaux de début et de fin de Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste vérifiable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs de Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session possédée par OpenClaw.

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

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut encore utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne revendique l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Un
environnement d’exécution Codex forcé échoue désormais au lieu de se rabattre sur PI, sauf si vous
définissez explicitement `agentRuntime.fallback: "pi"`. Une fois le serveur d’application Codex
sélectionné, ses échecs sont exposés directement sans configuration de repli supplémentaire.

**Le serveur d’application est rejeté :** mettez à niveau Codex afin que la négociation du serveur d’application
signale la version `0.125.0` ou une version plus récente. Les préversions de même version ou les
versions suffixées de build telles que `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées parce que le
plancher de protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant parle la même version du protocole de serveur d’application Codex.

**Un modèle non Codex utilise PI :** c’est attendu sauf si vous avez forcé
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
- [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
