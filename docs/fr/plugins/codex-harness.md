---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex inclus
    - Vous avez besoin d’exemples de configuration du harness Codex
    - Vous voulez que les déploiements exclusivement Codex échouent au lieu de basculer vers PI
summary: Exécuter les tours de l’agent embarqué OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-11T20:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent OpenAI embarqués
via le serveur d’application Codex au lieu du harnais PI intégré.

Utilisez le harnais Codex lorsque vous voulez que Codex possède la session d’agent de bas niveau :
reprise native des fils, continuation native des outils, compaction native et
exécution par serveur d’application. OpenClaw possède toujours les canaux de discussion, les fichiers de session, la sélection de modèle, les outils dynamiques OpenClaw, les approbations, la livraison des médias et le miroir visible de la transcription.

La configuration normale utilise des références de modèle OpenAI canoniques comme `openai/gpt-5.5`.
Ne configurez pas de références de modèle `openai-codex/gpt-*`. Placez l’ordre d’authentification de l’agent OpenAI
sous `auth.order.openai` ; les anciens profils `openai-codex:*` et les entrées
`auth.order.openai-codex` restent pris en charge pour les installations existantes.

OpenClaw démarre les fils du serveur d’application Codex avec le mode code natif Codex et
le mode code uniquement activés. Cela garde les outils dynamiques OpenClaw différés/recherchables
dans la propre exécution de code et la surface de recherche d’outils de Codex au lieu d’ajouter un
wrapper de recherche d’outils de style PI par-dessus Codex.

Pour la séparation plus large modèle/fournisseur/exécution, commencez par
[Exécutions d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est l’exécution, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Exigences

- OpenClaw avec le plugin `codex` intégré disponible.
- Si votre configuration utilise `plugins.allow`, incluez `codex`.
- Serveur d’application Codex `0.125.0` ou plus récent. Le plugin intégré gère par défaut un binaire
  de serveur d’application Codex compatible, donc les commandes locales `codex` dans `PATH` n’affectent pas
  le démarrage normal du harnais.
- Authentification Codex disponible via `openclaw models auth login --provider openai-codex`,
  un compte serveur d’application dans le dossier personnel Codex de l’agent, ou un profil d’authentification par clé API Codex explicite.

Pour la préséance d’authentification, l’isolation d’environnement, les commandes personnalisées du serveur d’application, la découverte de modèles et tous les champs de configuration, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Démarrage rapide

La plupart des utilisateurs qui veulent Codex dans OpenClaw veulent ce parcours : se connecter avec un
abonnement ChatGPT/Codex, activer le plugin `codex` intégré et utiliser une
référence de modèle canonique `openai/gpt-*`.

Connectez-vous avec OAuth Codex :

```bash
openclaw models auth login --provider openai-codex
```

Activez le plugin `codex` intégré et sélectionnez un modèle d’agent OpenAI :

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

Redémarrez le Gateway après avoir modifié la configuration du plugin. Si une discussion existante
a déjà une session, utilisez `/new` ou `/reset` avant de tester les changements d’exécution afin que le prochain
tour résolve le harnais à partir de la configuration actuelle.

## Configuration

La configuration de démarrage rapide est la configuration minimale viable du harnais Codex. Définissez les options du
harnais Codex dans la configuration OpenClaw, et utilisez la CLI uniquement pour l’authentification Codex :

| Besoin                                 | Définir                                                                         | Emplacement                        |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Activer le harnais                     | `plugins.entries.codex.enabled: true`                                            | Configuration OpenClaw             |
| Conserver une installation de plugin en liste d’autorisation | Inclure `codex` dans `plugins.allow`                                             | Configuration OpenClaw             |
| Router les tours d’agent OpenAI via Codex | `agents.defaults.model` ou `agents.list[].model` en tant que `openai/gpt-*`      | Configuration d’agent OpenClaw     |
| Se connecter avec OAuth Codex          | `openclaw models auth login --provider openai-codex`                             | Profil d’authentification CLI      |
| Ajouter une clé API de secours pour les exécutions Codex | Profil de clé API `openai:*` listé après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification CLI + configuration OpenClaw |
| Échouer fermé lorsque Codex est indisponible | `agentRuntime.id: "codex"` de fournisseur ou de modèle                           | Configuration de modèle/fournisseur OpenClaw |
| Utiliser le trafic direct de l’API OpenAI | `agentRuntime.id: "pi"` de fournisseur ou de modèle avec l’authentification OpenAI normale | Configuration de modèle/fournisseur OpenClaw |
| Régler le comportement du serveur d’application | `plugins.entries.codex.config.appServer.*`                                       | Configuration du plugin Codex      |
| Activer les applications de plugin Codex natives | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuration du plugin Codex      |
| Activer Codex Computer Use             | `plugins.entries.codex.config.computerUse.*`                                     | Configuration du plugin Codex      |

Utilisez des références de modèle `openai/gpt-*` pour les tours d’agent OpenAI adossés à Codex. Préférez
`auth.order.openai` pour l’ordre abonnement d’abord/clé API de secours. Les profils d’authentification
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
`openai/gpt-*`. La clé API est seulement une solution de secours d’authentification, pas une demande de basculer vers PI ou
OpenAI Responses brut.

Le reste de cette page couvre les variantes courantes entre lesquelles les utilisateurs doivent choisir :
forme de déploiement, routage en échec fermé, politique d’approbation du gardien, plugins Codex natifs et Computer Use. Pour les listes complètes d’options, valeurs par défaut, énumérations, découverte,
isolation d’environnement, délais d’expiration et champs de transport du serveur d’application, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier l’exécution Codex

Utilisez `/status` dans la discussion où vous attendez Codex. Un tour d’agent OpenAI adossé à Codex
affiche :

```text
Runtime: OpenAI Codex
```

Ensuite, vérifiez l’état du serveur d’application Codex :

```text
/codex status
/codex models
```

`/codex status` signale la connectivité du serveur d’application, le compte, les limites de débit, les serveurs MCP
et les compétences. `/codex models` liste le catalogue actif du serveur d’application Codex pour
le harnais et le compte. Si `/status` est surprenant, consultez
[Dépannage](#troubleshooting).

## Routage et sélection de modèle

Gardez séparées les références de fournisseur et la politique d’exécution :

- Utilisez `openai/gpt-*` pour les tours d’agent OpenAI via Codex.
- N’utilisez pas `openai-codex/gpt-*` dans la configuration. Exécutez `openclaw doctor --fix` pour
  réparer les références héritées et les épingles de route de session obsolètes.
- `agentRuntime.id: "codex"` est facultatif pour le mode automatique OpenAI normal, mais utile
  lorsqu’un déploiement doit échouer fermé si Codex est indisponible.
- `agentRuntime.id: "pi"` opte un fournisseur ou un modèle pour le comportement PI direct lorsque
  c’est intentionnel.
- `/codex ...` contrôle les conversations natives du serveur d’application Codex depuis la discussion.
- ACP/acpx est un chemin de harnais externe séparé. Utilisez-le seulement lorsque l’utilisateur demande
  ACP/acpx ou un adaptateur de harnais externe.

Routage de commandes courant :

| Intention de l’utilisateur       | Utiliser                                |
| ------------------------------- | --------------------------------------- |
| Joindre la discussion actuelle  | `/codex bind [--cwd <path>]`            |
| Reprendre un fil Codex existant | `/codex resume <thread-id>`             |
| Lister ou filtrer les fils Codex | `/codex threads [filter]`              |
| Envoyer uniquement un retour Codex | `/codex diagnostics [note]`           |
| Démarrer une tâche ACP/acpx      | Commandes de session ACP/acpx, pas `/codex` |

| Cas d’utilisation                                   | Configurer                                                       | Vérifier                                | Notes                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abonnement ChatGPT/Codex avec exécution Codex native | `openai/gpt-*` plus plugin `codex` activé                        | `/status` affiche `Runtime: OpenAI Codex` | Parcours recommandé                |
| Échouer fermé si Codex est indisponible              | `agentRuntime.id: "codex"` de fournisseur ou de modèle            | Le tour échoue au lieu du repli PI      | À utiliser pour les déploiements Codex uniquement |
| Trafic direct par clé API OpenAI via PI              | `agentRuntime.id: "pi"` de fournisseur ou de modèle et authentification OpenAI normale | `/status` affiche l’exécution PI        | À utiliser seulement lorsque PI est intentionnel |
| Configuration héritée                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la réécrit      | N’écrivez pas de nouvelle configuration ainsi |
| Adaptateur Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                         | État de tâche/session ACP               | Séparé du harnais Codex natif      |

`agents.defaults.imageModel` suit la même séparation de préfixe. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension d’images
doit s’exécuter via un tour borné de serveur d’application Codex. N’utilisez pas
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

### Déploiement avec fournisseurs mixtes

Cette forme garde Claude comme agent par défaut et ajoute un agent Codex nommé :

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
`codex` utilise le serveur d’application Codex.

### Déploiement Codex en échec fermé

Pour les tours d’agent OpenAI, `openai/gpt-*` se résout déjà vers Codex lorsque le
plugin intégré est disponible. Ajoutez une politique d’exécution explicite lorsque vous voulez une règle écrite
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

Avec Codex forcé, OpenClaw échoue tôt si le plugin Codex est désactivé, si le
serveur d’application est trop ancien ou si le serveur d’application ne peut pas démarrer.

## Politique du serveur d’application

Par défaut, le plugin démarre localement le binaire Codex géré par OpenClaw avec le transport stdio.
Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
exécutable différent. Utilisez le transport WebSocket uniquement lorsqu’un serveur d’application s’exécute déjà
ailleurs :

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

Les sessions app-server stdio locales utilisent par défaut la posture d’opérateur local de confiance :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences Codex locales interdisent cette
posture YOLO implicite, OpenClaw sélectionne plutôt les permissions guardian autorisées.
Lorsqu’un bac à sable OpenClaw est actif pour la session, OpenClaw réduit
`danger-full-access` de Codex à `workspace-write` de Codex afin que les tours de mode code
Codex natifs restent dans l’espace de travail en bac à sable.

Utilisez le mode guardian lorsque vous voulez une revue automatique native Codex avant les sorties du bac à sable
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

Le mode guardian s’étend aux approbations app-server Codex, généralement
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et
`sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs.

Pour chaque champ app-server, l’ordre d’authentification, l’isolation de l’environnement, la découverte et
le comportement des délais d’attente, consultez la [référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le Plugin intégré enregistre `/codex` comme commande slash sur tout canal qui
prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` vérifie la connectivité app-server, les modèles, le compte, les limites de débit,
  les serveurs MCP et les Skills.
- `/codex models` liste les modèles app-server Codex actifs.
- `/codex threads [filter]` liste les threads app-server Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  thread Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours Codex pour le
  thread attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les Skills de l’app-server Codex.

Pour la plupart des rapports de support, commencez par `/diagnostics [note]` dans la conversation
où le bug s’est produit. Cette commande crée un rapport de diagnostics Gateway et, pour les
sessions de harnais Codex, demande l’autorisation d’envoyer le bundle de retours Codex pertinent.
Consultez [Export des diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement
dans les conversations de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser les retours Codex
pour le thread actuellement attaché sans le bundle complet de diagnostics Gateway.

### Inspecter les threads Codex localement

Le moyen le plus rapide d’inspecter une mauvaise exécution Codex est souvent d’ouvrir directement le thread Codex
natif :

```bash
codex resume <thread-id>
```

Obtenez l’id du thread depuis la réponse `/diagnostics` terminée, `/codex binding` ou
`/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites des diagnostics au niveau de l’exécution, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

L’authentification est sélectionnée dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Les ids de profils `openai-codex:*` existants restent valides.
2. Le compte existant de l’app-server dans le répertoire Codex de cet agent.
3. Pour les lancements app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et qu’une authentification OpenAI est
   encore requise.

Quand OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex généré. Cela
garde les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans facturer accidentellement les tours app-server Codex natifs via l’API.
Les profils Codex explicites à clé API et le repli local stdio par clé d’environnement utilisent la connexion app-server
au lieu de l’environnement hérité du processus enfant. Les connexions app-server WebSocket
ne reçoivent pas le repli par clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
compte propre de l’app-server distant.

Si un profil d’abonnement atteint une limite d’utilisation Codex, OpenClaw enregistre l’heure de réinitialisation
lorsque Codex en fournit une et essaie le profil d’authentification ordonné suivant pour la même
exécution Codex. Lorsque l’heure de réinitialisation est passée, le profil d’abonnement redevient éligible
sans changer le modèle `openai/gpt-*` sélectionné ni l’exécution Codex.

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

`appServer.clearEnv` affecte uniquement le processus enfant app-server Codex généré.

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations natives Codex sur l’espace de travail : `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` et `update_plan`. Les autres outils d’intégration OpenClaw,
comme la messagerie, les sessions, les médias, cron, le navigateur, les nœuds,
gateway, `heartbeat_respond` et `web_search`, sont disponibles via la recherche d’outils Codex
sous l’espace de noms `openclaw`, ce qui réduit le contexte initial du modèle.
`sessions_yield` et les réponses de source propres aux outils de messagerie restent directs, car ce sont
des contrats de contrôle de tour. Les instructions de collaboration Heartbeat indiquent à Codex de
rechercher `heartbeat_respond` avant de terminer un tour Heartbeat lorsque l’outil n’est
pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un app-server Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés ou lors du débogage de la charge utile complète
des outils.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Par défaut        | Signification                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`           | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours app-server Codex.              |
| `codexPlugins`             | désactivé       | Prise en charge native des plugins/apps Codex pour les plugins sélectionnés installés depuis les sources migrées.           |

Champs `appServer` pris en charge :

| Champ                         | Par défaut                                                | Signification                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` génère Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                |
| `command`                     | binaire Codex géré                                   | Exécutable pour le transport stdio. Laissez-le non défini pour utiliser le binaire géré ; définissez-le uniquement pour une surcharge explicite.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                          |
| `url`                         | non défini                                                  | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | non défini                                                  | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio généré après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux.    |
| `requestTimeoutMs`            | `60000`                                                | Délai d’attente pour les appels de plan de contrôle app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Fenêtre silencieuse après une requête app-server Codex limitée au tour pendant qu’OpenClaw attend `turn/completed`. Augmentez cette valeur pour les phases lentes de synthèse après outil ou uniquement d’état.                                                                     |
| `mode`                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour l’exécution YOLO ou revue par guardian. Les exigences stdio locales qui omettent `danger-full-access`, l’approbation `never` ou le réviseur `user` rendent la valeur implicite par défaut guardian.                                                   |
| `approvalPolicy`              | `"never"` ou une politique d’approbation guardian autorisée       | Politique d’approbation native Codex envoyée au démarrage/reprise/tour du thread. Les valeurs par défaut guardian préfèrent `"on-request"` lorsqu’elle est autorisée.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou un bac à sable guardian autorisé  | Mode bac à sable natif Codex envoyé au démarrage/reprise du thread. Les valeurs par défaut guardian préfèrent `"workspace-write"` lorsqu’elle est autorisée, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, `danger-full-access` est réduit à `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou un réviseur guardian autorisé               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsqu’elles sont autorisées, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                      |
| `serviceTier`                 | non défini                                                  | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flex, `null` efface la surcharge, et l’ancien `"fast"` est accepté comme `"priority"`.                                         |

Les appels d’outils dynamiques gérés par OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par
défaut un watchdog OpenClaw de 30 secondes. Un argument `timeoutMs` positif par
appel allonge ou raccourcit le budget de cet outil précis. L’outil
`image_generate` utilise aussi `agents.defaults.imageGenerationModel.timeoutMs`
quand l’appel d’outil ne fournit pas son propre délai d’expiration, et l’outil
`image` de compréhension des médias utilise `tools.media.image.timeoutSeconds`
ou sa valeur média par défaut de 60 secondes. Les budgets d’outils dynamiques
sont plafonnés à 600000 ms. En cas de délai expiré, OpenClaw interrompt le
signal de l’outil lorsque cela est pris en charge et renvoie à Codex une réponse
d’outil dynamique en échec afin que le tour puisse continuer au lieu de laisser
la session en `processing`.

Après qu’OpenClaw répond à une requête app-server limitée au tour de Codex, le
harnais attend également que Codex termine le tour natif avec `turn/completed`.
Si l’app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`
après cette réponse, OpenClaw interrompt au mieux le tour Codex, enregistre un
délai d’expiration de diagnostic et libère la voie de session OpenClaw afin que
les messages de chat suivants ne soient pas mis en file derrière un tour natif
obsolète. Toute notification non terminale pour le même tour, y compris
`rawResponseItem/completed`, désarme ce court watchdog parce que Codex a prouvé
que le tour est toujours vivant ; le watchdog terminal plus long continue de
protéger les tours réellement bloqués. Les diagnostics de délai expiré incluent
la dernière méthode de notification app-server et, pour les éléments de réponse
bruts de l’assistant, le type d’élément, le rôle, l’id et un aperçu borné du
texte de l’assistant.

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
configuration est préférable pour les déploiements reproductibles, car elle
conserve le comportement du Plugin dans le même fichier révisé que le reste de
la configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des Plugins Codex natifs utilise les capacités d’application
et de Plugin propres à l’app-server Codex dans le même thread Codex que le tour
du harnais OpenClaw. OpenClaw ne traduit pas les Plugins Codex en outils
dynamiques OpenClaw synthétiques `codex_plugin_*`.

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
            allow_destructive_actions: false,
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

La configuration d’application du thread est calculée lorsqu’OpenClaw établit
une session de harnais Codex ou remplace une liaison de thread Codex obsolète.
Elle n’est pas recalculée à chaque tour. Après avoir modifié `codexPlugins`,
utilisez `/new`, `/reset` ou redémarrez le Gateway afin que les futures sessions
du harnais Codex démarrent avec l’ensemble d’applications mis à jour.

Pour l’éligibilité à la migration, l’inventaire des applications, la politique
des actions destructrices, les sollicitations et les diagnostics de Plugin
natif, consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins).

## Computer Use

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

En bref : OpenClaw ne fournit pas l’application de contrôle du bureau comme
dépendance intégrée et n’exécute pas lui-même les actions de bureau. Il prépare
l’app-server Codex, vérifie que le serveur MCP `computer-use` est disponible,
puis laisse Codex gérer les appels d’outils MCP natifs pendant les tours en mode
Codex.

## Frontières d’exécution

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw
  d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.
- Les outils shell, patch, MCP et d’application native propres à Codex sont
  gérés par Codex. OpenClaw peut observer ou bloquer certains événements natifs
  via le relais pris en charge, mais il ne réécrit pas les arguments des outils
  natifs.
- Codex gère la Compaction native. OpenClaw conserve un miroir de transcript
  pour l’historique des canaux, la recherche, `/new`, `/reset` et les futurs
  changements de modèle ou de harnais.
- La génération de médias, la compréhension des médias, le TTS, les approbations
  et la sortie des outils de messagerie continuent de passer par les paramètres
  de fournisseur/modèle OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils de transcript gérés
  par OpenClaw, et non aux enregistrements de résultats d’outils natifs de
  Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion des
autorisations natives, l’orientation de file, les mécanismes d’envoi des retours
Codex et les détails de Compaction, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** c’est attendu
pour les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*`,
activez `plugins.entries.codex.enabled`, puis vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** assurez-vous que la référence de
modèle est `openai/gpt-*` sur le fournisseur OpenAI officiel et que le Plugin
Codex est installé et activé. Si vous avez besoin d’une preuve stricte pendant
les tests, définissez `agentRuntime.id: "codex"` au niveau du fournisseur ou du
modèle. Une exécution Codex forcée échoue au lieu de revenir à PI.

**Une configuration héritée `openai-codex/*` subsiste :** exécutez
`openclaw doctor --fix`. Doctor réécrit les références de modèle héritées en
`openai/*`, supprime les broches d’exécution obsolètes de session et d’agent
entier, et préserve les substitutions de profil d’authentification existantes.

**L’app-server est rejeté :** utilisez l’app-server Codex `0.125.0` ou une
version plus récente. Les préversions de même version ou les versions avec
suffixe de build comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées,
car OpenClaw teste le plancher stable du protocole `0.125.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le Plugin `codex`
fourni est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation
est configurée, et que tout `appServer.command`, `url`, `authToken` ou en-tête
personnalisé est valide.

**La découverte des modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes, et que l’app-server distant parle la même version du
protocole d’app-server Codex.

**Un modèle non-Codex utilise PI :** c’est attendu, sauf si la politique
d’exécution du fournisseur ou du modèle l’achemine vers un autre harnais. Les
références simples de fournisseurs non-OpenAI restent sur leur chemin de
fournisseur normal en mode `auto`.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une session fraîche. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si le problème
persiste, redémarrez le Gateway pour effacer les enregistrements de hooks natifs
obsolètes. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use#troubleshooting).

## Associés

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Exécutions d’agents](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Statut](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
