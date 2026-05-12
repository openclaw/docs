---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex intégré
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements Codex uniquement échouent au lieu de se rabattre sur PI
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-05-12T00:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` fourni permet à OpenClaw d’exécuter des tours d’agent OpenAI intégrés
via le serveur d’applications Codex au lieu du harnais PI intégré.

Utilisez le harnais Codex lorsque vous voulez que Codex possède la session d’agent de bas niveau :
reprise native de fil, continuation native des outils, Compaction native et
exécution par le serveur d’applications. OpenClaw possède toujours les canaux de chat, les fichiers de session, la
sélection de modèle, les outils dynamiques OpenClaw, les approbations, la livraison des médias et le miroir visible
de la transcription.

La configuration normale utilise des refs de modèle OpenAI canoniques comme `openai/gpt-5.5`.
Ne configurez pas de refs de modèle `openai-codex/gpt-*`. Placez l’ordre d’authentification des agents OpenAI
sous `auth.order.openai` ; les anciens profils `openai-codex:*` et les entrées
`auth.order.openai-codex` restent pris en charge pour les installations existantes.

OpenClaw démarre les fils du serveur d’applications Codex avec le mode code natif Codex et
le mode code uniquement activé. Cela garde les outils dynamiques OpenClaw différés/recherchables
dans la surface d’exécution de code et de recherche d’outils propre à Codex, au lieu d’ajouter un
wrapper de recherche d’outils de style PI par-dessus Codex.

Pour la séparation plus large modèle/fournisseur/runtime, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la ref de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Exigences

- OpenClaw avec le Plugin `codex` fourni disponible.
- Si votre configuration utilise `plugins.allow`, incluez `codex`.
- Serveur d’applications Codex `0.125.0` ou plus récent. Le Plugin fourni gère par défaut un
  binaire de serveur d’applications Codex compatible, donc les commandes `codex` locales dans `PATH` n’affectent pas
  le démarrage normal du harnais.
- Authentification Codex disponible via `openclaw models auth login --provider openai-codex`,
  un compte de serveur d’applications dans le répertoire personnel Codex de l’agent, ou un profil d’authentification Codex à clé API
  explicite.

Pour la priorité d’authentification, l’isolation d’environnement, les commandes de serveur d’applications personnalisées, la
découverte de modèles et tous les champs de configuration, consultez la
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Démarrage rapide

La plupart des utilisateurs qui veulent Codex dans OpenClaw veulent ce parcours : se connecter avec un
abonnement ChatGPT/Codex, activer le Plugin `codex` fourni et utiliser une
ref de modèle `openai/gpt-*` canonique.

Connectez-vous avec OAuth Codex :

```bash
openclaw models auth login --provider openai-codex
```

Activez le Plugin `codex` fourni et sélectionnez un modèle d’agent OpenAI :

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

Redémarrez le Gateway après avoir modifié la configuration du Plugin. Si un chat existant
a déjà une session, utilisez `/new` ou `/reset` avant de tester les changements de runtime afin que le prochain
tour résolve le harnais à partir de la configuration actuelle.

## Configuration

La configuration de démarrage rapide est la configuration minimale viable du harnais Codex. Définissez les
options du harnais Codex dans la configuration OpenClaw, et utilisez la CLI uniquement pour l’authentification Codex :

| Besoin                                   | Définir                                                                              | Emplacement                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| Activer le harnais                       | `plugins.entries.codex.enabled: true`                                                | Configuration OpenClaw                   |
| Conserver une installation de Plugin autorisée | Inclure `codex` dans `plugins.allow`                                             | Configuration OpenClaw                   |
| Acheminer les tours d’agent OpenAI via Codex | `agents.defaults.model` ou `agents.list[].model` comme `openai/gpt-*`             | Configuration d’agent OpenClaw           |
| Se connecter avec OAuth Codex            | `openclaw models auth login --provider openai-codex`                                 | Profil d’authentification CLI            |
| Ajouter une clé API de secours pour les exécutions Codex | Profil à clé API `openai:*` listé après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification CLI + configuration OpenClaw |
| Échouer de façon fermée lorsque Codex est indisponible | `agentRuntime.id: "codex"` au niveau fournisseur ou modèle                  | Configuration modèle/fournisseur OpenClaw |
| Utiliser le trafic direct de l’API OpenAI | `agentRuntime.id: "pi"` au niveau fournisseur ou modèle avec l’authentification OpenAI normale | Configuration modèle/fournisseur OpenClaw |
| Ajuster le comportement du serveur d’applications | `plugins.entries.codex.config.appServer.*`                                      | Configuration du Plugin Codex            |
| Activer les applications de Plugin Codex natives | `plugins.entries.codex.config.codexPlugins.*`                                  | Configuration du Plugin Codex            |
| Activer Codex Computer Use               | `plugins.entries.codex.config.computerUse.*`                                         | Configuration du Plugin Codex            |

Utilisez des refs de modèle `openai/gpt-*` pour les tours d’agent OpenAI adossés à Codex. Préférez
`auth.order.openai` pour un ordre abonnement d’abord/clé API de secours. Les profils d’authentification
`openai-codex:*` existants et `auth.order.openai-codex` restent valides, mais
n’écrivez pas de nouvelles refs de modèle `openai-codex/gpt-*`.

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
`openai/gpt-*`. La clé API est uniquement une solution de secours d’authentification, pas une demande de basculer vers PI ou
OpenAI Responses brut.

Le reste de cette page couvre les variantes courantes entre lesquelles les utilisateurs doivent choisir :
forme de déploiement, routage à échec fermé, stratégie d’approbation guardian, Plugins Codex
natifs et Computer Use. Pour les listes complètes d’options, valeurs par défaut, énumérations, la découverte,
l’isolation d’environnement, les délais d’expiration et les champs de transport du serveur d’applications, consultez la
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier le runtime Codex

Utilisez `/status` dans le chat où vous attendez Codex. Un tour d’agent OpenAI adossé à Codex
affiche :

```text
Runtime: OpenAI Codex
```

Vérifiez ensuite l’état du serveur d’applications Codex :

```text
/codex status
/codex models
```

`/codex status` rapporte la connectivité du serveur d’applications, le compte, les limites de débit, les serveurs MCP
et les Skills. `/codex models` liste le catalogue en direct du serveur d’applications Codex pour
le harnais et le compte. Si `/status` est surprenant, consultez
[Dépannage](#troubleshooting).

## Routage et sélection de modèle

Gardez les refs de fournisseur et la stratégie de runtime séparées :

- Utilisez `openai/gpt-*` pour les tours d’agent OpenAI via Codex.
- N’utilisez pas `openai-codex/gpt-*` dans la configuration. Exécutez `openclaw doctor --fix` pour
  réparer les refs héritées et les anciennes épingles de route de session.
- `agentRuntime.id: "codex"` est facultatif pour le mode automatique OpenAI normal, mais utile
  lorsqu’un déploiement doit échouer de façon fermée si Codex est indisponible.
- `agentRuntime.id: "pi"` fait basculer un fournisseur ou un modèle vers le comportement PI direct lorsque
  c’est intentionnel.
- `/codex ...` contrôle les conversations natives du serveur d’applications Codex depuis le chat.
- ACP/acpx est un parcours de harnais externe séparé. Utilisez-le uniquement lorsque l’utilisateur demande
  ACP/acpx ou un adaptateur de harnais externe.

Routage des commandes courantes :

| Intention utilisateur              | Utiliser                                |
| ---------------------------------- | --------------------------------------- |
| Attacher le chat actuel            | `/codex bind [--cwd <path>]`            |
| Reprendre un fil Codex existant    | `/codex resume <thread-id>`             |
| Lister ou filtrer les fils Codex   | `/codex threads [filter]`               |
| Envoyer seulement des retours Codex | `/codex diagnostics [note]`            |
| Démarrer une tâche ACP/acpx        | Commandes de session ACP/acpx, pas `/codex` |

| Cas d’utilisation                                      | Configurer                                                       | Vérifier                                | Notes                              |
| ------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif      | `openai/gpt-*` plus Plugin `codex` activé                        | `/status` affiche `Runtime: OpenAI Codex` | Parcours recommandé                |
| Échouer de façon fermée si Codex est indisponible      | `agentRuntime.id: "codex"` au niveau fournisseur ou modèle       | Le tour échoue au lieu d’un repli PI    | À utiliser pour les déploiements Codex uniquement |
| Trafic direct par clé API OpenAI via PI                | `agentRuntime.id: "pi"` au niveau fournisseur ou modèle et authentification OpenAI normale | `/status` affiche le runtime PI         | À utiliser uniquement lorsque PI est intentionnel |
| Configuration héritée                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la réécrit      | N’écrivez pas de nouvelle configuration de cette façon |
| Adaptateur Codex ACP/acpx                              | ACP `sessions_spawn({ runtime: "acp" })`                         | Statut de tâche/session ACP             | Séparé du harnais Codex natif      |

`agents.defaults.imageModel` suit la même séparation de préfixes. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension d’image
doit passer par un tour borné du serveur d’applications Codex. N’utilisez pas
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

Avec cette configuration, l’agent `main` utilise son parcours fournisseur normal et l’agent
`codex` utilise le serveur d’applications Codex.

### Déploiement Codex à échec fermé

Pour les tours d’agent OpenAI, `openai/gpt-*` se résout déjà vers Codex lorsque le
Plugin fourni est disponible. Ajoutez une stratégie de runtime explicite lorsque vous voulez une règle écrite
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

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le
serveur d’applications est trop ancien, ou si le serveur d’applications ne peut pas démarrer.

## Stratégie du serveur d’applications

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec le transport stdio.
Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
exécutable différent. Utilisez le transport WebSocket uniquement lorsqu’un serveur d’applications s’exécute déjà
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

Les sessions locales app-server stdio utilisent par défaut la posture d’opérateur local de confiance :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences locales de Codex interdisent cette
posture YOLO implicite, OpenClaw sélectionne plutôt les autorisations guardian
autorisées. Lorsqu’un bac à sable OpenClaw est actif pour la session, OpenClaw
restreint Codex `danger-full-access` à Codex `workspace-write` afin que les tours
du mode code natif de Codex restent dans l’espace de travail en bac à sable.

Utilisez le mode guardian lorsque vous voulez une auto-revue native Codex avant les sorties
du bac à sable ou les autorisations supplémentaires :

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

Le mode guardian se développe en approbations app-server Codex, généralement
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et
`sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs.

Pour chaque champ app-server, l’ordre d’authentification, l’isolation de l’environnement, la découverte et le
comportement des délais d’expiration, consultez la [référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le Plugin intégré enregistre `/codex` comme commande slash sur tout canal qui
prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` vérifie la connectivité app-server, les modèles, le compte, les limites de débit,
  les serveurs MCP et les Skills.
- `/codex models` répertorie les modèles app-server Codex actifs.
- `/codex threads [filter]` répertorie les threads app-server Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  thread Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours Codex pour le
  thread attaché.
- `/codex account` affiche le statut du compte et des limites de débit.
- `/codex mcp` répertorie le statut des serveurs MCP de l’app-server Codex.
- `/codex skills` répertorie les Skills de l’app-server Codex.

Pour la plupart des rapports d’assistance, commencez par `/diagnostics [note]` dans la conversation
où le bogue s’est produit. Cela crée un rapport de diagnostics Gateway et, pour les sessions de
harnais Codex, demande l’approbation pour envoyer le paquet de retours Codex pertinent.
Consultez [Export des diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement des
discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement le téléversement des
retours Codex pour le thread actuellement attaché, sans le paquet complet de diagnostics
Gateway.

### Inspecter les threads Codex localement

La manière la plus rapide d’inspecter une mauvaise exécution Codex consiste souvent à ouvrir directement le
thread Codex natif :

```bash
codex resume <thread-id>
```

Obtenez l’identifiant de thread dans la réponse `/diagnostics` terminée, `/codex binding` ou
`/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites des diagnostics au niveau de l’exécution, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

L’authentification est sélectionnée dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Les identifiants de profil `openai-codex:*` existants restent valides.
2. Le compte existant de l’app-server dans le répertoire de base Codex de cet agent.
3. Pour les lancements locaux d’app-server stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsque OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex généré. Cela
garde les clés d’API au niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer accidentellement les tours natifs de l’app-server Codex via l’API.
Les profils explicites de clé d’API Codex et le repli local stdio par clé d’environnement utilisent la connexion app-server
au lieu de l’environnement hérité du processus enfant. Les connexions app-server WebSocket
ne reçoivent pas le repli de clé d’API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
compte propre de l’app-server distant.

Si un profil d’abonnement atteint une limite d’utilisation Codex, OpenClaw enregistre l’heure de réinitialisation
lorsque Codex en signale une et essaie le profil d’authentification ordonné suivant pour la même
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

`appServer.clearEnv` n’affecte que le processus enfant app-server Codex généré.

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations d’espace de travail natives de Codex : `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` et `update_plan`. Les autres outils d’intégration OpenClaw
comme la messagerie, les sessions, les médias, Cron, le navigateur, les nœuds,
Gateway, `heartbeat_respond` et `web_search` sont disponibles via la recherche d’outils Codex
sous l’espace de noms `openclaw`, ce qui garde le contexte initial du modèle plus
petit.
`sessions_yield` et les réponses de source limitées aux outils de messagerie restent directes, car ce sont
des contrats de contrôle de tour. Les instructions de collaboration Heartbeat demandent à Codex de
rechercher `heartbeat_respond` avant de terminer un tour Heartbeat lorsque l’outil n’est
pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un app-server Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage de la charge utile complète
des outils.

Champs Codex de premier niveau pris en charge :

| Champ                      | Valeur par défaut | Signification                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`           | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours app-server Codex.              |
| `codexPlugins`             | désactivé       | Prise en charge native des plugins/app Codex pour les plugins organisés installés depuis la source et migrés.           |

Champs `appServer` pris en charge :

| Champ                         | Valeur par défaut                                                | Signification                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` génère Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                |
| `command`                     | binaire Codex géré                                   | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                          |
| `url`                         | non défini                                                  | URL de l’app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | non défini                                                  | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio généré après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux.    |
| `requestTimeoutMs`            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Fenêtre de silence après une requête app-server Codex limitée au tour pendant qu’OpenClaw attend `turn/completed`. Augmentez-la pour les phases lentes de synthèse après outil ou uniquement de statut.                                                                     |
| `mode`                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou revue par guardian. Les exigences locales stdio qui omettent `danger-full-access`, l’approbation `never` ou le réviseur `user` font de guardian la valeur par défaut implicite.                                                   |
| `approvalPolicy`              | `"never"` ou une politique d’approbation guardian autorisée       | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du thread. Les valeurs par défaut guardian privilégient `"on-request"` lorsqu’elle est autorisée.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou un bac à sable guardian autorisé  | Mode bac à sable natif Codex envoyé au démarrage ou à la reprise du thread. Les valeurs par défaut guardian privilégient `"workspace-write"` lorsqu’elle est autorisée, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, `danger-full-access` est restreint à `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou un réviseur guardian autorisé               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsqu’il y est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                      |
| `serviceTier`                 | non défini                                                  | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flex, `null` efface la substitution, et l’ancien `"fast"` est accepté comme `"priority"`.                                         |

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par
défaut un chien de garde OpenClaw de 30 secondes. Un argument `timeoutMs` positif
par appel allonge ou raccourcit le budget de cet outil précis. L’outil
`image_generate` utilise aussi `agents.defaults.imageGenerationModel.timeoutMs`
quand l’appel d’outil ne fournit pas son propre délai d’expiration, et l’outil
`image` de compréhension multimédia utilise `tools.media.image.timeoutSeconds`
ou sa valeur par défaut multimédia de 60 secondes. Les budgets des outils
dynamiques sont plafonnés à 600000 ms. En cas d’expiration, OpenClaw interrompt
le signal de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse
d’outil dynamique en échec afin que le tour puisse continuer au lieu de laisser
la session en `processing`.

Après qu’OpenClaw a répondu à une requête de serveur d’app limitée au tour
Codex, le harnais attend aussi que Codex termine le tour natif avec
`turn/completed`. Si le serveur d’app reste silencieux pendant
`appServer.turnCompletionIdleTimeoutMs` après cette réponse, OpenClaw interrompt
au mieux le tour Codex, enregistre un délai d’expiration de diagnostic et libère
la voie de session OpenClaw afin que les messages de chat suivants ne soient pas
mis en file derrière un ancien tour natif obsolète. Toute notification non
terminale pour le même tour, y compris `rawResponseItem/completed`, désarme ce
court chien de garde, car Codex a prouvé que le tour est encore actif ; le chien
de garde terminal plus long continue de protéger les tours réellement bloqués.
Les diagnostics de délai d’expiration incluent la dernière méthode de
notification du serveur d’app et, pour les éléments bruts de réponse de
l’assistant, le type d’élément, le rôle, l’identifiant et un aperçu borné du
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
conserve le comportement du plugin dans le même fichier révisé que le reste de
la configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des plugins Codex natifs utilise les propres fonctionnalités
d’app et de plugin du serveur d’app Codex dans le même fil Codex que le tour du
harnais OpenClaw. OpenClaw ne traduit pas les plugins Codex en outils
dynamiques OpenClaw synthétiques `codex_plugin_*`.

`codexPlugins` affecte uniquement les sessions qui sélectionnent le harnais
Codex natif. Il n’a aucun effet sur les exécutions PI, les exécutions normales
du fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnais.

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

La configuration d’app du fil est calculée quand OpenClaw établit une session de
harnais Codex ou remplace une liaison de fil Codex obsolète. Elle n’est pas
recalculée à chaque tour. Après avoir modifié `codexPlugins`, utilisez `/new`,
`/reset` ou redémarrez le gateway afin que les futures sessions de harnais Codex
démarrent avec l’ensemble d’apps mis à jour.

Pour l’éligibilité à la migration, l’inventaire des apps, la stratégie
d’actions destructives, les sollicitations et les diagnostics de plugins natifs,
consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins).

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur est couverte dans son propre guide de
configuration :
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use).

Version courte : OpenClaw n’intègre pas l’app de contrôle du bureau et
n’exécute pas lui-même les actions de bureau. Il prépare le serveur d’app Codex,
vérifie que le serveur MCP `computer-use` est disponible, puis laisse Codex
prendre en charge les appels d’outils MCP natifs pendant les tours en mode Codex.

## Limites d’exécution

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw
  d’exécuter ces outils, OpenClaw reste donc dans le chemin d’exécution.
- Les outils shell, patch, MCP et d’app native propres à Codex appartiennent à
  Codex. OpenClaw peut observer ou bloquer certains événements natifs via le
  relais pris en charge, mais il ne réécrit pas les arguments des outils natifs.
- Codex possède la compaction native. OpenClaw conserve un miroir de transcript
  pour l’historique des canaux, la recherche, `/new`, `/reset` et les futurs
  changements de modèle ou de harnais.
- La génération multimédia, la compréhension multimédia, le TTS, les
  approbations et la sortie des outils de messagerie continuent de passer par
  les paramètres de fournisseur/modèle OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils de transcript
  appartenant à OpenClaw, pas aux enregistrements de résultats d’outils natifs
  Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion des
permissions natives, le pilotage de file, les mécanismes d’envoi des retours
Codex et les détails de compaction, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** c’est attendu
pour les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*`,
activez `plugins.entries.codex.enabled`, puis vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** assurez-vous que la référence de
modèle est `openai/gpt-*` sur le fournisseur OpenAI officiel et que le plugin
Codex est installé et activé. Si vous avez besoin d’une preuve stricte pendant
les tests, définissez `agentRuntime.id: "codex"` au niveau du fournisseur ou du
modèle. Un runtime Codex forcé échoue au lieu de revenir à PI.

**Une configuration héritée `openai-codex/*` subsiste :** exécutez
`openclaw doctor --fix`. Doctor réécrit les anciennes références de modèle en
`openai/*`, supprime les anciens pins de runtime de session et d’agent complet,
et préserve les substitutions de profil d’authentification existantes.

**Le serveur d’app est rejeté :** utilisez Codex app-server `0.125.0` ou plus
récent. Les préversions de même version ou les versions avec suffixe de build
comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car OpenClaw teste le
plancher de protocole stable `0.125.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le plugin `codex`
fourni est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation
est configurée, et que tout `appServer.command`, `url`, `authToken` ou en-tête
personnalisé est valide.

**La découverte de modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes et que le serveur d’app distant parle la même version
du protocole de serveur d’app Codex.

**Un modèle non-Codex utilise PI :** c’est attendu, sauf si la stratégie de
runtime du fournisseur ou du modèle le route vers un autre harnais. Les
références de fournisseurs non-OpenAI simples restent sur leur chemin de
fournisseur normal en mode `auto`.

**L’utilisation de l’ordinateur est installée, mais les outils ne s’exécutent
pas :** vérifiez `/codex computer-use status` depuis une session fraîche. Si un
outil signale `Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si
cela persiste, redémarrez le gateway pour effacer les inscriptions obsolètes de
hooks natifs. Consultez
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use#troubleshooting).

## Liens associés

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de plugin](/fr/plugins/hooks)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [Statut](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
