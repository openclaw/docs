---
read_when:
    - Vous avez besoin de tous les champs de configuration du harnais Codex
    - Vous modifiez le comportement du transport, de l’authentification, de la découverte ou des délais d’expiration d’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et de serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-05-11T20:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du Plugin `codex`
intégré. Pour la configuration initiale et les décisions de routage, commencez par
[Codex harness](/fr/plugins/codex-harness).

## Surface de configuration du Plugin

Tous les paramètres Codex harness se trouvent sous `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Champs de premier niveau pris en charge :

| Champ                      | Valeur par défaut                  | Signification                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                  | Paramètres de découverte de modèles pour Codex app-server `model/list`.                                                                               |
| `appServer`                | app-server stdio géré | Paramètres de transport, commande, authentification, approbation, sandbox et délai d’expiration.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte d’outil Codex initial.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours Codex app-server.                                                               |
| `codexPlugins`             | désactivé                 | Prise en charge native des plugins/apps Codex pour les plugins organisés migrés installés depuis la source. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé                 | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                                          |

## Transport app-server

Par défaut, OpenClaw démarre le binaire Codex géré fourni avec le Plugin
intégré :

```bash
codex app-server --listen stdio://
```

Cela maintient la version de l’app-server liée au Plugin `codex` intégré plutôt qu’à
la CLI Codex séparée qui se trouve être installée localement. Définissez
`appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
exécutable différent.

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
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Champs `appServer` pris en charge :

| Champ                         | Valeur par défaut                                                | Signification                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                        |
| `command`                     | binaire Codex géré                                   | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré.                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                  |
| `url`                         | non défini                                                  | URL WebSocket de l’app-server.                                                                                                                                                                       |
| `authToken`                   | non défini                                                  | Jeton Bearer pour le transport WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                             |
| `requestTimeoutMs`            | `60000`                                                | Délai d’expiration pour les appels de plan de contrôle app-server.                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Fenêtre silencieuse après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                  |
| `mode`                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour l’exécution YOLO ou relue par guardian.                                                                                                                                                 |
| `approvalPolicy`              | `"never"` ou une politique d’approbation guardian autorisée       | Politique d’approbation native Codex envoyée au démarrage de fil, à la reprise et au tour.                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` ou un sandbox guardian autorisé  | Mode sandbox natif Codex envoyé au démarrage et à la reprise du fil.                                                                                                                                      |
| `approvalsReviewer`           | `"user"` ou un relecteur guardian autorisé               | Utilisez `"auto_review"` pour laisser Codex relire les invites d’approbation natives lorsque cela est autorisé.                                                                                                                   |
| `defaultWorkspaceDir`         | répertoire du processus actuel                              | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                        |
| `serviceTier`                 | non défini                                                  | Niveau de service Codex app-server facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flex, et `null` efface le remplacement. L’ancien `"fast"` est accepté comme `"priority"`. |

Le Plugin bloque les handshakes app-server plus anciens ou sans version. Codex app-server
doit signaler la version stable `0.125.0` ou une version plus récente.

## Modes d’approbation et sandbox

Les sessions app-server stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet aux
tours OpenClaw sans surveillance et aux Heartbeats de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier d’exigences système local de Codex interdit les valeurs implicites YOLO
d’approbation, de relecteur ou de sandbox, OpenClaw traite plutôt la valeur implicite par défaut comme guardian
et sélectionne les permissions guardian autorisées. Les entrées
`[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences sont respectées
pour la décision par défaut du sandbox.

Définissez `appServer.mode: "guardian"` pour les approbations Codex relues par guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Le préréglage `guardian` s’étend en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque ces
valeurs sont autorisées. Les champs de politique individuels remplacent `mode`. L’ancienne
valeur de relecteur `guardian_subagent` est toujours acceptée comme alias de compatibilité,
mais les nouvelles configurations devraient utiliser `auto_review`.

## Authentification et isolation de l’environnement

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant de l’app-server dans le dossier d’accueil Codex de cet agent.
3. Pour les lancements app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’authentification OpenAI est
   encore requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
maintient les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer accidentellement les tours Codex app-server natifs via l’API.

Les profils explicites de clé API Codex et le repli local stdio par clé d’environnement utilisent la connexion app-server
au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket app-server
ne reçoivent pas de repli par clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
compte propre de l’app-server distant.

Les lancements app-server stdio héritent par défaut de l’environnement du processus OpenClaw, mais
OpenClaw possède le pont de compte Codex app-server et définit à la fois `CODEX_HOME` et
`HOME` sur des répertoires par agent sous l’état OpenClaw de cet agent. Le chargeur de Skills propre à Codex
lit `$CODEX_HOME/skills` et `$HOME/.agents/skills`, de sorte que les deux
valeurs sont isolées pour les lancements app-server locaux. Cela maintient les
Skills, plugins, configurations, comptes et états de fil natifs Codex limités à l’agent OpenClaw
au lieu de fuir depuis le dossier d’accueil personnel Codex CLI de l’opérateur.

Les plugins OpenClaw et les instantanés de Skills OpenClaw continuent de passer par le propre
registre de plugins et le chargeur de Skills d’OpenClaw. Les ressources personnelles Codex CLI ne le font pas. Si vous avez
des Skills ou plugins Codex CLI utiles qui devraient faire partie d’un agent OpenClaw,
inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` n’affecte que le processus enfant Codex app-server lancé.
`CODEX_HOME` et `HOME` restent réservés à l’isolation Codex par agent d’OpenClaw
lors des lancements locaux.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations d’espace de travail natives Codex :

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Les autres outils d’intégration OpenClaw, comme la messagerie, les sessions, les médias, cron,
le navigateur, les nœuds, le Gateway, `heartbeat_respond` et `web_search`, sont disponibles
via la recherche d’outils Codex sous l’espace de noms `openclaw`. Cela réduit le contexte
initial du modèle. `sessions_yield` et les réponses de source uniquement via outil de message
restent directes, car ce sont des contrats de contrôle du tour.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un app-server Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage de la charge utile
complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le premier
délai disponible dans cet ordre :

- Un argument `timeoutMs` positif propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour l’outil `image` de compréhension des médias, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut média de 60 secondes.
- La valeur par défaut des outils dynamiques de 30 secondes.

Les budgets des outils dynamiques sont plafonnés à 600000 ms. En cas d’expiration, OpenClaw annule le
signal de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse d’outil dynamique en échec
afin que le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw répond à une requête app-server Codex à portée de tour, le harness
s’attend aussi à ce que Codex termine le tour natif avec `turn/completed`. Si l’
app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs` après cette
réponse, OpenClaw interrompt au mieux le tour Codex, enregistre un diagnostic
d’expiration et libère la voie de session OpenClaw afin que les messages de chat suivants ne soient
pas mis en file derrière un tour natif obsolète.

Toute notification non terminale pour le même tour, y compris
`rawResponseItem/completed`, désactive ce court watchdog, car Codex a
prouvé que le tour est toujours actif. Le watchdog terminal plus long continue de
protéger les tours réellement bloqués. Les diagnostics d’expiration incluent la dernière méthode de notification de l’
app-server et, pour les éléments bruts de réponse assistant, le type d’élément, le rôle,
l’id et un aperçu borné du texte de l’assistant.

## Découverte des modèles

Par défaut, le Plugin Codex demande à l’app-server les modèles disponibles. La
disponibilité des modèles appartient à l’app-server Codex ; la liste peut donc changer quand OpenClaw
met à niveau la version `@openai/codex` intégrée, ou lorsqu’un déploiement pointe
`appServer.command` vers un binaire Codex différent. La disponibilité peut aussi être
propre au compte. Utilisez `/codex models` sur un gateway en cours d’exécution pour voir le catalogue actif
de ce harness et de ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de repli intégré pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Le harness intégré actuel est `@openai/codex` `0.130.0`. Une sonde `model/list`
contre cet app-server intégré a renvoyé :

| Id du modèle          | Par défaut | Masqué | Modalités d’entrée | Efforts de raisonnement |
| --------------------- | ---------- | ------ | ------------------ | ------------------------ |
| `gpt-5.5`             | Oui        | Non    | texte, image       | low, medium, high, xhigh |
| `gpt-5.4`             | Non        | Non    | texte, image       | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Non        | Non    | texte, image       | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Non        | Non    | texte, image       | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Non        | Non    | texte              | low, medium, high, xhigh |
| `gpt-5.2`             | Non        | Non    | texte, image       | low, medium, high, xhigh |

Les modèles masqués peuvent être renvoyés par le catalogue de l’app-server pour des flux
internes ou spécialisés, mais ce ne sont pas des choix normaux dans le sélecteur de modèles.

Ajustez la découverte sous `plugins.entries.codex.config.discovery` :

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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et utilise uniquement le
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

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native des documents de projet. OpenClaw
n’écrit pas de fichiers de documents de projet Codex synthétiques et ne dépend pas des noms de fichiers de repli
Codex pour les fichiers de persona, car les replis Codex ne s’appliquent que lorsque
`AGENTS.md` est absent.

Pour la parité de l’espace de travail OpenClaw, le harness Codex résout les autres fichiers
d’amorçage, notamment `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` et `MEMORY.md` lorsqu’ils sont présents, et les transmet
via les instructions développeur Codex sur `thread/start` et `thread/resume`.
Cela garde le contexte de persona et de profil de l’espace de travail visible sur la voie native Codex
qui façonne le comportement, sans dupliquer `AGENTS.md`.

## Remplacements d’environnement

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La configuration est
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans le
même fichier relu que le reste de la configuration du harness Codex.

## Associé

- [Harness Codex](/fr/plugins/codex-harness)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
