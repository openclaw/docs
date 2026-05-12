---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex intégré
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements exclusivement Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours de l’agent intégré d’OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-12T08:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` inclus permet à OpenClaw d’exécuter des tours d’agent OpenAI intégrés
via Codex app-server plutôt que via le harnais PI intégré.

Utilisez le harnais Codex lorsque vous voulez que Codex possède la session d’agent de bas niveau :
reprise native de thread, continuation native des outils, Compaction native et
exécution app-server. OpenClaw possède toujours les canaux de chat, les fichiers de session, la
sélection de modèle, les outils dynamiques OpenClaw, les approbations, la livraison des médias et le
miroir de transcription visible.

La configuration normale utilise des références de modèle OpenAI canoniques telles que `openai/gpt-5.5`.
Ne configurez pas de références de modèle `openai-codex/gpt-*`. Placez l’ordre d’authentification
de l’agent OpenAI sous `auth.order.openai` ; les profils `openai-codex:*` plus anciens et les
entrées `auth.order.openai-codex` restent pris en charge pour les installations existantes.

OpenClaw démarre les threads Codex app-server avec le mode code natif de Codex et
code-mode-only activé. Cela conserve les outils dynamiques OpenClaw différés/recherchables
dans la surface d’exécution de code et de recherche d’outils propre à Codex, au lieu d’ajouter un
wrapper de recherche d’outils de style PI par-dessus Codex.

Pour la séparation plus large entre modèle/fournisseur/runtime, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Exigences

- OpenClaw avec le Plugin `codex` inclus disponible.
- Si votre configuration utilise `plugins.allow`, incluez `codex`.
- Codex app-server `0.125.0` ou plus récent. Le Plugin inclus gère par défaut un
  binaire Codex app-server compatible ; les commandes `codex` locales dans `PATH` n’affectent donc pas
  le démarrage normal du harnais.
- Authentification Codex disponible via `openclaw models auth login --provider openai-codex`,
  un compte app-server dans le répertoire Codex home de l’agent, ou un profil d’authentification
  explicite avec clé d’API Codex.

Pour la priorité d’authentification, l’isolation de l’environnement, les commandes app-server personnalisées, la
découverte de modèles et tous les champs de configuration, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Démarrage rapide

La plupart des utilisateurs qui veulent Codex dans OpenClaw veulent ce parcours : connectez-vous avec un
abonnement ChatGPT/Codex, activez le Plugin `codex` inclus et utilisez une
référence de modèle canonique `openai/gpt-*`.

Connectez-vous avec OAuth Codex :

```bash
openclaw models auth login --provider openai-codex
```

Activez le Plugin `codex` inclus et sélectionnez un modèle d’agent OpenAI :

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
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, ajoutez aussi `codex` à cet endroit :

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

Redémarrez le Gateway après avoir modifié la configuration des Plugins. Si un chat existant
a déjà une session, utilisez `/new` ou `/reset` avant de tester les changements de runtime afin que le prochain
tour résolve le harnais à partir de la configuration actuelle.

## Configuration

La configuration de démarrage rapide est la configuration minimale viable du harnais Codex. Définissez les
options du harnais Codex dans la configuration OpenClaw, et utilisez la CLI uniquement pour l’authentification Codex :

| Besoin                                 | Définir                                                                         | Où                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Activer le harnais                     | `plugins.entries.codex.enabled: true`                                            | Configuration OpenClaw             |
| Conserver une installation de Plugin autorisée | Inclure `codex` dans `plugins.allow`                                      | Configuration OpenClaw             |
| Router les tours d’agent OpenAI via Codex | `agents.defaults.model` ou `agents.list[].model` comme `openai/gpt-*`       | Configuration d’agent OpenClaw     |
| Se connecter avec OAuth Codex          | `openclaw models auth login --provider openai-codex`                             | Profil d’authentification CLI      |
| Ajouter une clé d’API de secours pour les exécutions Codex | Profil de clé d’API `openai:*` listé après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification CLI + configuration OpenClaw |
| Échouer de façon fermée lorsque Codex est indisponible | Fournisseur ou modèle `agentRuntime.id: "codex"`                       | Configuration modèle/fournisseur OpenClaw |
| Utiliser le trafic direct de l’API OpenAI | Fournisseur ou modèle `agentRuntime.id: "pi"` avec l’authentification OpenAI normale | Configuration modèle/fournisseur OpenClaw |
| Ajuster le comportement d’app-server   | `plugins.entries.codex.config.appServer.*`                                       | Configuration du Plugin Codex      |
| Activer les applications Plugins natives Codex | `plugins.entries.codex.config.codexPlugins.*`                              | Configuration du Plugin Codex      |
| Activer Codex Computer Use             | `plugins.entries.codex.config.computerUse.*`                                     | Configuration du Plugin Codex      |

Utilisez les références de modèle `openai/gpt-*` pour les tours d’agent OpenAI adossés à Codex. Préférez
`auth.order.openai` pour l’ordre abonnement d’abord/clé d’API en secours. Les profils d’authentification
`openai-codex:*` existants et `auth.order.openai-codex` restent valides, mais
n’écrivez pas de nouvelles références de modèle `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dans cette forme, les deux profils s’exécutent toujours via Codex pour les tours d’agent
`openai/gpt-*`. La clé d’API est uniquement une solution de secours d’authentification, pas une demande de basculer vers PI ou vers
OpenAI Responses simple.

Le reste de cette page couvre les variantes courantes entre lesquelles les utilisateurs doivent choisir :
forme de déploiement, routage à échec fermé, politique d’approbation guardian, Plugins Codex natifs
et Computer Use. Pour les listes complètes d’options, les valeurs par défaut, les énumérations, la découverte,
l’isolation de l’environnement, les délais d’expiration et les champs de transport app-server, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier le runtime Codex

Utilisez `/status` dans le chat où vous attendez Codex. Un tour d’agent OpenAI
adossé à Codex affiche :

```text
Runtime: OpenAI Codex
```

Vérifiez ensuite l’état de Codex app-server :

```text
/codex status
/codex models
```

`/codex status` indique la connectivité app-server, le compte, les limites de débit, les serveurs MCP
et les Skills. `/codex models` liste le catalogue Codex app-server en direct pour
le harnais et le compte. Si `/status` est surprenant, consultez
[Dépannage](#troubleshooting).

## Routage et sélection de modèle

Gardez les références de fournisseur et la politique de runtime séparées :

- Utilisez `openai/gpt-*` pour les tours d’agent OpenAI via Codex.
- N’utilisez pas `openai-codex/gpt-*` dans la configuration. Exécutez `openclaw doctor --fix` pour
  réparer les références héritées et les anciennes épingles de route de session.
- `agentRuntime.id: "codex"` est facultatif pour le mode automatique OpenAI normal, mais utile
  lorsqu’un déploiement doit échouer de façon fermée si Codex est indisponible.
- `agentRuntime.id: "pi"` fait opter un fournisseur ou un modèle pour le comportement PI direct lorsque
  cela est intentionnel.
- `/codex ...` contrôle les conversations Codex app-server natives depuis le chat.
- ACP/acpx est un chemin de harnais externe distinct. Utilisez-le uniquement lorsque l’utilisateur demande
  ACP/acpx ou un adaptateur de harnais externe.

Routage courant des commandes :

| Intention de l’utilisateur        | Utiliser                                |
| ------------------------------- | --------------------------------------- |
| Joindre le chat actuel           | `/codex bind [--cwd <path>]`            |
| Reprendre un thread Codex existant | `/codex resume <thread-id>`           |
| Lister ou filtrer les threads Codex | `/codex threads [filter]`             |
| Envoyer uniquement un retour Codex | `/codex diagnostics [note]`            |
| Démarrer une tâche ACP/acpx      | Commandes de session ACP/acpx, pas `/codex` |

| Cas d’utilisation                                      | Configurer                                                       | Vérifier                                | Notes                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif | `openai/gpt-*` plus Plugin `codex` activé                         | `/status` affiche `Runtime: OpenAI Codex` | Parcours recommandé                |
| Échouer de façon fermée si Codex est indisponible | Fournisseur ou modèle `agentRuntime.id: "codex"`                   | Le tour échoue au lieu d’un repli PI    | À utiliser pour les déploiements Codex uniquement |
| Trafic direct par clé d’API OpenAI via PI          | Fournisseur ou modèle `agentRuntime.id: "pi"` et authentification OpenAI normale | `/status` affiche le runtime PI         | À utiliser uniquement lorsque PI est intentionnel |
| Configuration héritée                              | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la réécrit      | Ne créez pas de nouvelle configuration ainsi |
| Adaptateur Codex ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                         | État de tâche/session ACP               | Séparé du harnais Codex natif      |

`agents.defaults.imageModel` suit la même séparation de préfixe. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension d’image
doit s’exécuter via un tour Codex app-server borné. N’utilisez pas
`openai-codex/gpt-*` ; doctor réécrit ce préfixe hérité en `openai/gpt-*`.

## Modèles de déploiement

### Déploiement Codex de base

Utilisez la configuration de démarrage rapide lorsque tous les tours d’agent OpenAI doivent utiliser Codex par
défaut.

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
    },
  },
}
```

### Déploiement à fournisseurs mixtes

Cette forme conserve Claude comme agent par défaut et ajoute un agent Codex nommé :

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Avec cette configuration, l’agent `main` utilise son chemin de fournisseur normal et l’agent
`codex` utilise Codex app-server.

### Déploiement Codex à échec fermé

Pour les tours d’agent OpenAI, `openai/gpt-*` se résout déjà vers Codex lorsque le
Plugin inclus est disponible. Ajoutez une politique de runtime explicite lorsque vous voulez une règle écrite
d’échec fermé :

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si
l’app-server est trop ancien, ou si l’app-server ne peut pas démarrer.

## Politique app-server

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec le transport stdio.
Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
autre exécutable. Utilisez le transport WebSocket uniquement lorsqu’un app-server est déjà
en cours d’exécution ailleurs :

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
          },
        },
      },
    },
  },
}
```

Les sessions locales de serveur d’application stdio utilisent par défaut la posture d’opérateur local approuvé :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences locales de Codex interdisent cette
posture YOLO implicite, OpenClaw sélectionne plutôt les permissions guardian autorisées.
Lorsqu’un sandbox OpenClaw est actif pour la session, OpenClaw restreint
`danger-full-access` de Codex à `workspace-write` de Codex afin que les tours en
mode code natif de Codex restent dans l’espace de travail sandboxé.

Utilisez le mode guardian lorsque vous voulez une revue automatique native de Codex avant les sorties de sandbox
ou les permissions supplémentaires :

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

Le mode guardian s’étend aux approbations du serveur d’application Codex, généralement
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et
`sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs.

Pour chaque champ du serveur d’application, l’ordre d’authentification, l’isolation de l’environnement, la découverte et
le comportement des délais d’expiration, consultez la [référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le Plugin intégré enregistre `/codex` comme commande slash sur tout canal qui
prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` vérifie la connectivité du serveur d’application, les modèles, le compte, les limites de débit,
  les serveurs MCP et les Skills.
- `/codex models` liste les modèles actifs du serveur d’application Codex.
- `/codex threads [filter]` liste les threads récents du serveur d’application Codex.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  thread Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le thread attaché.
- `/codex review` démarre la revue native de Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours Codex pour le
  thread attaché.
- `/codex account` affiche le statut du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` liste les Skills du serveur d’application Codex.

Pour la plupart des rapports d’assistance, commencez par `/diagnostics [note]` dans la conversation
où le bug s’est produit. Cela crée un rapport de diagnostics Gateway et, pour les sessions du
harnais Codex, demande l’approbation pour envoyer le paquet de retours Codex pertinent.
Consultez [Export des diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement des
discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez précisément l’envoi des
retours Codex pour le thread actuellement attaché, sans le paquet complet de diagnostics
Gateway.

### Inspecter les threads Codex localement

La façon la plus rapide d’inspecter une mauvaise exécution Codex consiste souvent à ouvrir directement le
thread Codex natif :

```bash
codex resume <thread-id>
```

Récupérez l’identifiant de thread dans la réponse `/diagnostics` terminée, `/codex binding` ou
`/codex threads [filter]`.

Pour les mécanismes d’envoi et les limites des diagnostics au niveau de l’exécution, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

L’authentification est sélectionnée dans cet ordre :

1. Les profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Les identifiants de profil `openai-codex:*` existants restent valides.
2. Le compte existant du serveur d’application dans le répertoire Codex de cet agent.
3. Pour les lancements locaux du serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
garde les clés API au niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer accidentellement les tours natifs du serveur d’application Codex via l’API.
Les profils explicites de clé API Codex et le repli local sur clé d’environnement stdio utilisent la connexion au serveur d’application
au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket au serveur d’application
ne reçoivent pas le repli par clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
compte propre du serveur d’application distant.

Si un profil d’abonnement atteint une limite d’utilisation Codex, OpenClaw enregistre l’heure de réinitialisation
lorsque Codex en signale une et essaie le profil d’authentification ordonné suivant pour la même
exécution Codex. Lorsque l’heure de réinitialisation est passée, le profil d’abonnement redevient éligible
sans modifier le modèle `openai/gpt-*` sélectionné ni l’exécution Codex.

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

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations natives de Codex sur l’espace de travail : `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` et `update_plan`. Les autres outils d’intégration OpenClaw
comme la messagerie, les sessions, les médias, cron, le navigateur, les nœuds,
gateway, `heartbeat_respond` et `web_search` sont disponibles via la recherche d’outils Codex
sous l’espace de noms `openclaw`, ce qui réduit le contexte initial du modèle.
`sessions_yield` et les réponses de source réservées à l’outil de messagerie restent directes, car ce sont
des contrats de contrôle de tour. Les instructions de collaboration Heartbeat indiquent à Codex de
rechercher `heartbeat_respond` avant de terminer un tour Heartbeat lorsque l’outil n’est
pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lorsque vous vous connectez à un serveur d’application Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage de la charge utile complète
des outils.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Valeur par défaut | Signification                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`           | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex.              |
| `codexPlugins`             | désactivé       | Prise en charge native des plugins/applications Codex pour les plugins organisés migrés installés depuis la source.           |

Champs `appServer` pris en charge :

| Champ                         | Valeur par défaut                                                | Signification                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                |
| `command`                     | binaire Codex géré                                   | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une surcharge explicite.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                          |
| `url`                         | non défini                                                  | URL WebSocket du serveur d’application.                                                                                                                                                                                                               |
| `authToken`                   | non défini                                                  | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus du serveur d’application stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux.    |
| `requestTimeoutMs`            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle du serveur d’application.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Fenêtre de silence après une requête de serveur d’application Codex limitée à un tour, pendant qu’OpenClaw attend `turn/completed`. Augmentez cette valeur pour les phases lentes de synthèse après outil ou uniquement de statut.                                                                     |
| `mode`                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou revue par guardian. Les exigences locales stdio qui omettent `danger-full-access`, l’approbation `never` ou le réviseur `user` rendent la valeur implicite par défaut guardian.                                                   |
| `approvalPolicy`              | `"never"` ou une stratégie d’approbation guardian autorisée       | Stratégie d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du thread. Les valeurs par défaut guardian privilégient `"on-request"` lorsque c’est autorisé.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou un sandbox guardian autorisé  | Mode sandbox natif Codex envoyé au démarrage ou à la reprise du thread. Les valeurs par défaut guardian privilégient `"workspace-write"` lorsque c’est autorisé, sinon `"read-only"`. Lorsqu’un sandbox OpenClaw est actif, `danger-full-access` est restreint à `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou un réviseur guardian autorisé               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsque c’est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                      |
| `serviceTier`                 | non défini                                                  | Niveau de service facultatif du serveur d’application Codex. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flex, `null` efface la surcharge, et l’ancienne valeur `"fast"` est acceptée comme `"priority"`.                                         |

Les appels d’outils dynamiques détenus par OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par
défaut un chien de garde OpenClaw de 30 secondes. Un argument positif `timeoutMs`
par appel allonge ou raccourcit le budget de cet outil spécifique. L’outil
`image_generate` utilise aussi `agents.defaults.imageGenerationModel.timeoutMs`
lorsque l’appel d’outil ne fournit pas son propre délai d’expiration, et l’outil
`image` de compréhension des médias utilise `tools.media.image.timeoutSeconds`
ou son délai média par défaut de 60 secondes. Les budgets d’outils dynamiques
sont plafonnés à 600000 ms. En cas de délai d’expiration, OpenClaw abandonne le
signal de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse
d’outil dynamique échouée afin que le tour puisse continuer au lieu de laisser la
session en `processing`.

Après qu’OpenClaw répond à une requête de serveur d’application à portée de tour
Codex, le harnais attend aussi de Codex qu’il termine le tour natif avec
`turn/completed`. Si le serveur d’application reste silencieux pendant
`appServer.turnCompletionIdleTimeoutMs` après cette réponse, OpenClaw interrompt
au mieux le tour Codex, enregistre un diagnostic de délai d’expiration et libère
la voie de session OpenClaw afin que les messages de chat suivants ne soient pas
mis en file derrière un tour natif obsolète. Toute notification non terminale
pour le même tour, y compris `rawResponseItem/completed`, désarme ce court chien
de garde, car Codex a prouvé que le tour est encore actif ; le chien de garde
terminal plus long continue à protéger les tours réellement bloqués. Les
notifications globales du serveur d’application, comme les mises à jour de
limite de débit, ne réinitialisent pas la progression d’inactivité du tour.
Lorsque Codex émet un élément `agentMessage` terminé puis reste silencieux sans
`turn/completed`, OpenClaw considère que la sortie de l’assistant est effectivement
terminée, interrompt au mieux le tour Codex natif et libère la voie de session.
Les diagnostics de délai d’expiration incluent la dernière méthode de
notification du serveur d’application et, pour les éléments de réponse assistant
bruts, le type d’élément, le rôle, l’id et un aperçu borné du texte de
l’assistant.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La
configuration est préférable pour les déploiements répétables, car elle conserve
le comportement du Plugin dans le même fichier révisé que le reste de la
configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des Plugins Codex natifs utilise les propres capacités
d’application et de Plugin du serveur d’application Codex dans le même fil Codex
que le tour du harnais OpenClaw. OpenClaw ne traduit pas les Plugins Codex en
outils dynamiques OpenClaw synthétiques `codex_plugin_*`.

`codexPlugins` n’affecte que les sessions qui sélectionnent le harnais Codex
natif. Il n’a aucun effet sur les exécutions PI, les exécutions normales du
fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnais.

Configuration migrée minimale :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuration de l’application de fil est calculée lorsqu’OpenClaw établit
une session de harnais Codex ou remplace une liaison de fil Codex obsolète. Elle
n’est pas recalculée à chaque tour. Après avoir modifié `codexPlugins`, utilisez
`/new`, `/reset`, ou redémarrez le Gateway afin que les futures sessions de
harnais Codex démarrent avec l’ensemble d’applications mis à jour.

Pour l’éligibilité à la migration, l’inventaire des applications, la politique
d’actions destructrices, les élicitations et les diagnostics de Plugin natif,
consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins).

## Computer Use

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

En bref : OpenClaw ne vendore pas l’application de contrôle du bureau et
n’exécute pas lui-même d’actions sur le bureau. Il prépare le serveur
d’application Codex, vérifie que le serveur MCP `computer-use` est disponible,
puis laisse Codex détenir les appels d’outils MCP natifs pendant les tours en
mode Codex.

## Limites d’exécution

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw
  d’exécuter ces outils, OpenClaw reste donc dans le chemin d’exécution.
- Les outils natifs shell, patch, MCP et application de Codex sont détenus par
  Codex. OpenClaw peut observer ou bloquer certains événements natifs via le
  relais pris en charge, mais il ne réécrit pas les arguments des outils natifs.
- Codex détient la Compaction native. OpenClaw conserve un miroir de
  transcription pour l’historique du canal, la recherche, `/new`, `/reset` et le
  futur changement de modèle ou de harnais.
- La génération de médias, la compréhension des médias, la synthèse vocale, les
  approbations et la sortie de l’outil de messagerie continuent à passer par les
  paramètres de fournisseur/modèle OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils de transcription
  détenus par OpenClaw, et non aux enregistrements de résultats d’outils natifs
  Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion native
des permissions, le pilotage de file d’attente, les mécanismes d’envoi des
retours Codex et les détails de Compaction, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** c’est attendu
pour les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*`,
activez `plugins.entries.codex.enabled`, et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** assurez-vous que la référence de
modèle est `openai/gpt-*` sur le fournisseur OpenAI officiel et que le Plugin
Codex est installé et activé. Si vous avez besoin d’une preuve stricte pendant
les tests, définissez `agentRuntime.id: "codex"` pour le fournisseur ou le
modèle. Une exécution Codex forcée échoue au lieu de revenir à PI.

**Une configuration héritée `openai-codex/*` subsiste :** exécutez
`openclaw doctor --fix`. Doctor réécrit les références de modèles héritées en
`openai/*`, supprime les épingles d’exécution de session et d’agent entier
obsolètes, et préserve les substitutions de profil d’authentification
existantes.

**Le serveur d’application est rejeté :** utilisez le serveur d’application
Codex `0.125.0` ou plus récent. Les préversions de même version ou les versions
avec suffixe de build comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées
car OpenClaw teste le plancher de protocole stable `0.125.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le Plugin `codex`
groupé est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation
est configurée, et que tout `appServer.command`, `url`, `authToken` ou en-tête
personnalisé est valide.

**La découverte de modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes, et que le serveur d’application distant parle la même
version du protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si la politique
d’exécution du fournisseur ou du modèle le route vers un autre harnais. Les
références simples de fournisseurs non-OpenAI restent sur leur chemin de
fournisseur normal en mode `auto`.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si cela persiste,
redémarrez le Gateway pour effacer les inscriptions de hooks natifs obsolètes.
Consultez [Codex Computer Use](/fr/plugins/codex-computer-use#troubleshooting).

## Connexe

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Exécutions d’agents](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [Statut](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
