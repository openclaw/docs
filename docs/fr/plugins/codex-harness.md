---
read_when:
    - Vous souhaitez utiliser le harnais app-server fourni avec Codex
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements réservés à Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours de l’agent intégré OpenClaw via le harnais app-server Codex inclus
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-30T07:37:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin `codex` intégré permet à OpenClaw d'exécuter des tours d'agent intégrés via le
serveur applicatif Codex plutôt que via le harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d'agent bas niveau : découverte
des modèles, reprise native des fils, Compaction native et exécution par serveur applicatif.
OpenClaw reste responsable des canaux de chat, des fichiers de session, de la sélection des modèles, des outils,
des approbations, de la livraison des médias et du miroir de transcription visible.

Si vous essayez de vous orienter, commencez par
[Runtimes d'agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Ce que ce plugin change

Le plugin `codex` intégré fournit plusieurs capacités distinctes :

| Capacité                          | Comment vous l'utilisez                             | Ce qu'elle fait                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime intégré natif             | `agentRuntime.id: "codex"`                          | Exécute les tours d'agent intégrés OpenClaw via le serveur applicatif Codex.  |
| Commandes natives de contrôle du chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les fils du serveur applicatif Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur applicatif Codex | Internes `codex`, exposés via le harnais           | Permet au runtime de découvrir et valider les modèles du serveur applicatif.  |
| Chemin de compréhension multimédia Codex | Chemins de compatibilité de modèles d'image `codex/*` | Exécute des tours bornés du serveur applicatif Codex pour les modèles de compréhension d'image pris en charge. |
| Relais de hooks natifs            | Hooks de Plugin autour des événements natifs Codex  | Permet à OpenClaw d'observer/bloquer les événements natifs Codex pris en charge de type outil/finalisation. |

Activer le plugin rend ces capacités disponibles. Cela ne fait **pas** :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` en runtime natif
- faire d'ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un runtime PI
- remplacer la livraison des canaux OpenClaw, les fichiers de session, le stockage des profils d'authentification ou
  le routage des messages

Le même plugin possède aussi la surface de commandes natives de contrôle du chat `/codex`. Si
le plugin est activé et que l'utilisateur demande à lier, reprendre, piloter, arrêter ou inspecter
des fils Codex depuis le chat, les agents doivent préférer `/codex ...` à ACP. ACP reste
le repli explicite lorsque l'utilisateur demande ACP/acpx ou teste l'adaptateur ACP
Codex.

Les tours Codex natifs conservent les hooks de Plugin OpenClaw comme couche publique de compatibilité.
Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription mis en miroir
- `before_agent_finalize` via le relais `Stop` de Codex
- `agent_end`

Les Plugins peuvent aussi enregistrer un middleware de résultats d'outils neutre vis-à-vis du runtime pour réécrire
les résultats d'outils dynamiques OpenClaw après qu'OpenClaw exécute l'outil et avant que le
résultat soit renvoyé à Codex. C'est distinct du hook de Plugin public
`tool_result_persist`, qui transforme les écritures de résultats d'outils de transcription
possédées par OpenClaw.

Pour la sémantique des hooks de Plugin eux-mêmes, consultez [Hooks de Plugin](/fr/plugins/hooks)
et [Comportement de garde des Plugins](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent garder les références de modèles OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu'elles
veulent une exécution native par serveur applicatif. Les anciennes références de modèle `codex/*` sélectionnent encore automatiquement
le harnais pour compatibilité, mais les anciens préfixes fournisseur appuyés par un runtime ne sont
pas affichés comme choix normaux de modèle/fournisseur.

Si le plugin `codex` est activé mais que le modèle principal est toujours
`openai-codex/*`, `openclaw doctor` avertit au lieu de modifier la route. C'est
intentionnel : `openai-codex/*` reste le chemin d'abonnement/OAuth Codex PI, et
l'exécution native par serveur applicatif reste un choix de runtime explicite.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                     | Référence de modèle        | Configuration du runtime               | Exigence de Plugin         | Libellé d'état attendu          |
| ---------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------- |
| API OpenAI via l'exécuteur OpenClaw normal | `openai/gpt-*`             | omis ou `runtime: "pi"`                | Fournisseur OpenAI         | `Runtime: OpenClaw Pi Default`  |
| Abonnement/OAuth Codex via PI            | `openai-codex/gpt-*`       | omis ou `runtime: "pi"`                | Fournisseur OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Tours intégrés natifs du serveur applicatif Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`             | `Runtime: OpenAI Codex`         |
| Fournisseurs mixtes avec mode automatique conservateur | références propres au fournisseur | `agentRuntime.id: "auto"`              | Runtimes de Plugin facultatifs | Dépend du runtime sélectionné   |
| Session explicite d'adaptateur ACP Codex | dépend de l'invite/du modèle ACP | `sessions_spawn` avec `runtime: "acp"` | backend `acpx` sain        | État de tâche/session ACP       |

La distinction importante est fournisseur versus runtime :

- `openai-codex/*` répond à « quelle route fournisseur/authentification PI doit-il utiliser ? »
- `agentRuntime.id: "codex"` répond à « quelle boucle doit exécuter ce
  tour intégré ? »
- `/codex ...` répond à « à quelle conversation Codex native ce chat doit-il se lier
  ou qu'il doit contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI sont spécifiques au préfixe. Utilisez `openai-codex/*` lorsque vous voulez
OAuth Codex via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l'API OpenAI ou
lorsque vous forcez le harnais natif du serveur applicatif Codex :

| Référence de modèle                         | Chemin de runtime                            | À utiliser lorsque                                                        |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez l'accès direct actuel à l'API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OAuth OpenAI Codex via OpenClaw/PI           | Vous voulez l'authentification par abonnement ChatGPT/Codex avec l'exécuteur PI par défaut. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harnais du serveur applicatif Codex          | Vous voulez l'exécution native par serveur applicatif Codex pour le tour d'agent intégré. |

GPT-5.5 est actuellement limité à l'abonnement/OAuth dans OpenClaw. Utilisez
`openai-codex/gpt-5.5` pour OAuth PI, ou `openai/gpt-5.5` avec le harnais
du serveur applicatif Codex. L'accès direct par clé API pour `openai/gpt-5.5` est pris en charge
dès qu'OpenAI active GPT-5.5 sur l'API publique.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité
de Doctor réécrit les anciennes références de runtime principal vers des références de modèle canoniques
et enregistre séparément la politique de runtime, tandis que les anciennes références uniquement de repli
sont laissées inchangées car le runtime est configuré pour l'ensemble du conteneur d'agent.
Les nouvelles configurations OAuth PI Codex doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations
de harnais natif de serveur applicatif doivent utiliser `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même distinction de préfixe. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d'image doit passer par le chemin fournisseur OAuth
OpenAI Codex. Utilisez `codex/gpt-*` lorsque la compréhension d'image doit s'exécuter
via un tour borné du serveur applicatif Codex. Le modèle du serveur applicatif Codex doit
annoncer la prise en charge des entrées image ; les modèles Codex texte uniquement échouent avant le début du tour multimédia.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l'enregistrement structuré `agent harness selected` du gateway. Il
inclut l'id du harnais sélectionné, la raison de sélection, la politique de runtime/repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

### Signification des avertissements de Doctor

`openclaw doctor` avertit lorsque toutes ces conditions sont vraies :

- le plugin `codex` intégré est activé ou autorisé
- le modèle principal d'un agent est `openai-codex/*`
- le runtime effectif de cet agent n'est pas `codex`

Cet avertissement existe parce que les utilisateurs s'attendent souvent à ce que « Plugin Codex activé » implique
« runtime natif du serveur applicatif Codex ». OpenClaw ne fait pas ce saut. L'avertissement
signifie :

- **Aucun changement n'est requis** si vous vouliez OAuth ChatGPT/Codex via PI.
- Changez le modèle en `openai/<model>` et définissez
  `agentRuntime.id: "codex"` si vous vouliez une exécution native par serveur applicatif.
- Les sessions existantes ont encore besoin de `/new` ou `/reset` après un changement de runtime,
  car les épingles de runtime de session sont persistantes.

La sélection du harnais n'est pas un contrôle de session en direct. Lorsqu'un tour intégré s'exécute,
OpenClaw enregistre l'id du harnais sélectionné sur cette session et continue à l'utiliser pour
les tours ultérieurs dans le même id de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les sessions futures utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une session fraîche avant de basculer une conversation existante
entre PI et Codex. Cela évite de rejouer une transcription à travers
deux systèmes de session natifs incompatibles.

Les anciennes sessions créées avant les épingles de harnais sont traitées comme épinglées sur PI dès qu'elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire entrer cette conversation dans
Codex après avoir modifié la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais du serveur applicatif Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le plugin `codex` intégré disponible.
- Serveur applicatif Codex `0.125.0` ou plus récent. Le plugin intégré gère par défaut
  un binaire de serveur applicatif Codex compatible, donc les commandes locales `codex` sur `PATH`
  n'affectent pas le démarrage normal du harnais.
- Authentification Codex disponible pour le processus du serveur applicatif ou pour le pont d'authentification Codex
  d'OpenClaw.

Le plugin bloque les handshakes de serveur applicatif plus anciens ou non versionnés. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke en direct et Docker, l'authentification vient généralement du compte CLI Codex
ou d'un profil d'authentification OpenClaw `openai-codex`. Les lancements locaux de serveur applicatif stdio peuvent
aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu'aucun compte n'est présent.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le plugin intégré et forcez le harnais `codex` :

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

Si votre configuration utilise `plugins.allow`, incluez aussi `codex` :

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

Les anciennes configurations qui définissent `agents.defaults.model` ou un modèle d'agent sur
`codex/<model>` activent encore automatiquement le plugin `codex` intégré. Les nouvelles configurations doivent
préférer `openai/<model>` plus l'entrée explicite `agentRuntime` ci-dessus.

## Ajouter Codex aux côtés d'autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et des modèles fournisseurs non Codex. Un runtime forcé s'applique à chaque
tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw essaie quand même le harnais Codex et échoue de façon fermée
au lieu de router silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Conservez l’agent par défaut sur `agentRuntime.id: "auto"` et le fallback PI pour l’utilisation mixte
  normale des fournisseurs.
- Utilisez les refs héritées `codex/*` uniquement pour la compatibilité. Les nouvelles configs devraient préférer
  `openai/*` avec une politique d’exécution Codex explicite.

Par exemple, ceci conserve l’agent par défaut sur la sélection automatique normale et
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

- L’agent `main` par défaut utilise le chemin de fournisseur normal et le fallback de compatibilité PI.
- L’agent `codex` utilise le harnais app-server Codex.
- Si Codex est manquant ou non pris en charge pour l’agent `codex`, le tour échoue
  au lieu d’utiliser silencieusement PI.

## Routage des commandes d’agent

Les agents doivent router les demandes utilisateur par intention, pas seulement par le mot « Codex » :

| L’utilisateur demande...                                | L’agent doit utiliser...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| « Lier cette discussion à Codex »                        | `/codex bind`                                    |
| « Reprendre le thread Codex `<id>` ici »                 | `/codex resume <id>`                             |
| « Afficher les threads Codex »                           | `/codex threads`                                 |
| « Déposer un rapport de support pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoyer uniquement des commentaires Codex pour ce thread joint » | `/codex diagnostics [note]`                      |
| « Utiliser Codex comme runtime pour cet agent »          | changement de config vers `agentRuntime.id`      |
| « Utiliser mon abonnement ChatGPT/Codex avec OpenClaw normal » | refs de modèles `openai-codex/*`                 |
| « Exécuter Codex via ACP/acpx »                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un thread » | ACP/acpx, pas `/codex` ni les sous-agents natifs |

OpenClaw n’annonce les consignes de spawn ACP aux agents que lorsque ACP est activé,
dispatchable, et adossé à un backend de runtime chargé. Si ACP n’est pas disponible,
le prompt système et les Skills de Plugin ne doivent pas enseigner à l’agent le routage
ACP.

## Déploiements Codex uniquement

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent intégré
utilise Codex. Les runtimes de Plugin explicites utilisent par défaut aucun fallback PI, donc
`fallback: "none"` est facultatif mais souvent utile comme documentation :

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

Remplacement par l’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Lorsque Codex est forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si
l’app-server est trop ancien, ou si l’app-server ne peut pas démarrer. Définissez
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` uniquement si vous voulez intentionnellement que PI gère
la sélection de harnais manquante.

## Codex par agent

Vous pouvez rendre un agent exclusivement Codex tandis que l’agent par défaut conserve
la sélection automatique normale :

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

Utilisez les commandes de session normales pour changer d’agents et de modèles. `/new` crée une nouvelle
session OpenClaw et le harnais Codex crée ou reprend son thread app-server sidecar
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce thread
et laisse le tour suivant résoudre à nouveau le harnais depuis la config actuelle.

## Découverte des modèles

Par défaut, le Plugin Codex demande à l’app-server les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de fallback intégré pour :

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
catalogue de secours :

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

Le binaire géré est déclaré comme dépendance d’exécution de plugin groupée et préparé
avec le reste des dépendances du plugin `codex`. Cela maintient la version de l’app-server
liée au plugin groupé plutôt qu’à la CLI Codex distincte qui se trouve
être installée localement. Définissez `appServer.command` uniquement lorsque vous
voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales de harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. C’est la posture d’opérateur local de confiance utilisée
pour les heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est là pour répondre.

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

Le mode gardien utilise le chemin d’approbation avec revue automatique native de Codex. Lorsque Codex demande à
quitter le bac à sable, écrire hors de l’espace de travail ou ajouter des permissions comme l’accès
réseau, Codex achemine cette demande d’approbation vers le réviseur natif plutôt que vers une
invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse
la demande précise. Utilisez le gardien lorsque vous voulez davantage de garde-fous que le mode YOLO
tout en ayant besoin que des agents non supervisés puissent progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, ce qui permet aux déploiements avancés de mélanger
le préréglage avec des choix explicites. L’ancienne valeur de réviseur `guardian_subagent` est
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

Les lancements d’app-server stdio héritent par défaut de l’environnement de processus d’OpenClaw,
mais OpenClaw possède le pont de compte de l’app-server Codex. L’authentification est sélectionnée dans cet
ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant de l’app-server, comme une connexion ChatGPT locale à la CLI Codex.
3. Pour les lancements locaux d’app-server stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte d’app-server n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsqu’OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
garde les clés API au niveau du Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans que les tours de l’app-server Codex natif soient facturés via l’API par accident.
Les profils explicites Codex à clé API et le secours local par clé d’environnement stdio utilisent la connexion app-server
au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket à l’app-server
ne reçoivent pas le secours par clé API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le
propre compte de l’app-server distant.

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

`appServer.clearEnv` affecte uniquement le processus enfant de l’app-server Codex lancé.

Champs `appServer` pris en charge :

| Champ               | Valeur par défaut                        | Signification                                                                                                                            |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                               |
| `command`           | binaire Codex géré                       | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                       |
| `url`               | non défini                               | URL WebSocket de l’app-server.                                                                                                           |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                                                |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                                      |
| `clearEnv`          | `[]`                                     | Noms de variables d’environnement supplémentaires retirés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels au plan de contrôle de l’app-server.                                                                  |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou revue par guardian.                                                                                  |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native de Codex envoyée au démarrage, à la reprise ou au tour du thread.                                         |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif de Codex envoyé au démarrage ou à la reprise du thread.                                                               |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.       |
| `serviceTier`       | non défini                               | Niveau de service optionnel de l’app-server Codex : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées.         |

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas de délai d’expiration, OpenClaw interrompt le signal
de l’outil lorsque c’est pris en charge et renvoie une réponse d’outil dynamique en échec à Codex afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête d’app-server Codex limitée au tour, le harnais
s’attend également à ce que Codex termine le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant 60 secondes après cette réponse, OpenClaw tente au mieux
d’interrompre le tour Codex, enregistre un diagnostic de délai d’expiration et libère la voie de session
OpenClaw afin que les messages de chat suivants ne soient pas mis en file derrière un tour natif obsolète.

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
préférable pour les déploiements reproductibles, car elle conserve le comportement du plugin dans le
même fichier relu que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

Version courte : OpenClaw ne fournit pas l’application de contrôle du bureau ni n’exécute
lui-même des actions sur le bureau. Il prépare l’app-server Codex, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex gérer les appels d’outils MCP natifs
pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux de marketplace Codex, enregistrez
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

Computer Use est spécifique à macOS et peut nécessiter des autorisations locales du système d’exploitation avant que le
serveur MCP Codex puisse contrôler des applications. Si `computerUse.enabled` vaut true et que le serveur MCP
est indisponible, les tours en mode Codex échouent avant le démarrage du thread au lieu de
s’exécuter silencieusement sans les outils Computer Use natifs. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les motifs d’état et le dépannage.

Lorsque `computerUse.autoInstall` vaut true, OpenClaw peut enregistrer la marketplace Codex Desktop
standard groupée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace locale. Utilisez `/new` ou `/reset` après
avoir changé la configuration du runtime ou de Computer Use afin que les sessions existantes ne conservent pas une ancienne
liaison de PI ou de thread Codex.

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

App-server distant avec en-têtes explicites :

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
à un thread Codex existant, le tour suivant envoie à nouveau à l’app-server
le modèle OpenAI, le fournisseur, la politique d’approbation, le sandbox et le niveau de service
actuellement sélectionnés. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison de thread, mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer les retours de diagnostic Codex pour le thread attaché.
- `/codex computer-use status` vérifie le plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les skills de l’app-server Codex.

### Flux de débogage courant

Lorsqu’un agent adossé à Codex fait quelque chose d’inattendu dans Telegram, Discord, Slack,
ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre note courte
   qui décrit ce que vous avez vu.
2. Approuvez la demande de diagnostics une fois. L’approbation crée l’archive zip de diagnostics
   Gateway locale et, comme la session utilise le harnais Codex, envoie également
   le paquet de retours Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bogue ou le fil de support.
   Elle inclut le chemin du paquet local, le résumé de confidentialité, les identifiants de session OpenClaw,
   les identifiants de thread Codex et une ligne `Inspect locally` pour chaque thread Codex.
4. Si vous voulez déboguer vous-même l’exécution, lancez la commande `Inspect locally`
   affichée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le
   thread Codex natif afin que vous puissiez inspecter la conversation, la continuer localement,
   ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement téléverser les retours Codex
pour le thread actuellement attaché sans le paquet complet de diagnostics Gateway OpenClaw.
Pour la plupart des rapports de support, `/diagnostics [note]` est le meilleur point de départ,
car il relie l’état Gateway local et les identifiants de thread Codex dans une seule réponse. Consultez [Export des diagnostics](/fr/gateway/diagnostics)
pour le modèle de confidentialité complet et le comportement en conversation de groupe.

Le cœur OpenClaw expose également `/diagnostics [note]`, réservé aux propriétaires, comme commande générale
de diagnostics Gateway. Son invite d’approbation affiche le préambule sur les données sensibles,
renvoie vers [Export des diagnostics](/fr/gateway/diagnostics) et demande
`openclaw gateway diagnostics export --json` via une approbation d’exécution explicite
à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation,
OpenClaw envoie un rapport pouvant être collé, avec le chemin du paquet local et le résumé
du manifeste. Lorsque la session OpenClaw active utilise le harnais Codex, cette
même approbation autorise également l’envoi des paquets de retours Codex pertinents aux
serveurs OpenAI. L’invite d’approbation indique que les retours Codex seront envoyés, mais
elle ne liste pas les identifiants de session ou de thread Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une conversation de groupe, OpenClaw garde le
canal partagé propre : le groupe ne reçoit qu’un court avis, tandis que le
préambule de diagnostics, les invites d’approbation et les identifiants de session/thread Codex sont envoyés au
propriétaire via le chemin d’approbation privé. S’il n’existe aucun chemin privé vers le propriétaire,
OpenClaw refuse la demande de groupe et demande au propriétaire de l’exécuter depuis un DM.

L’appel d’upload Codex approuvé appelle `feedback/upload` sur l’app-server Codex et demande à l’app-server d’inclure les journaux pour chaque thread listé et les sous-threads Codex générés lorsqu’ils sont disponibles. L’upload passe par le chemin de feedback normal de Codex vers les serveurs OpenAI ; si le feedback Codex est désactivé dans cet app-server, la commande renvoie l’erreur de l’app-server. La réponse de diagnostics terminée liste les canaux, les identifiants de session OpenClaw, les identifiants de thread Codex et les commandes locales `codex resume <thread-id>` pour les threads qui ont été envoyés. Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex. Cet upload ne remplace pas l’export local des diagnostics du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harness pour les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le modèle OpenClaw actuellement sélectionné à l’app-server et garde l’historique étendu activé.

### Inspecter un thread Codex depuis la CLI

Le moyen le plus rapide de comprendre une mauvaise exécution Codex consiste souvent à ouvrir directement le thread Codex natif :

```sh
codex resume <thread-id>
```

Utilisez ceci lorsque vous remarquez un bug dans une conversation de canal et que vous voulez inspecter la session Codex problématique, la poursuivre localement ou demander à Codex pourquoi il a fait un choix particulier d’outil ou de raisonnement. Le chemin le plus simple consiste généralement à exécuter d’abord `/diagnostics [note]` : après votre approbation, le rapport terminé liste chaque thread Codex et affiche une commande `Inspect locally`, par exemple `codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un terminal.

Vous pouvez aussi obtenir un identifiant de thread avec `/codex binding` pour la discussion actuelle ou `/codex threads [filter]` pour les threads récents de l’app-server Codex, puis exécuter la même commande `codex resume` dans votre shell.

Cette surface de commande nécessite l’app-server Codex `0.125.0` ou une version plus récente. Les méthodes de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harness Codex possède trois couches de hooks :

| Couche                                | Propriétaire             | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins OpenClaw             | OpenClaw                 | Compatibilité produit/plugin entre les harnesses PI et Codex.       |
| Middleware d’extension app-server Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router le comportement des plugins OpenClaw. Pour le pont d’outils natifs et de permissions pris en charge, OpenClaw injecte une configuration Codex par thread pour `PreToolUse`, `PostToolUse`, `PermissionRequest` et `Stop`. Les autres hooks Codex comme `SessionStart` et `UserPromptSubmit` restent des contrôles de niveau Codex ; ils ne sont pas exposés comme hooks de plugins OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé l’appel ; OpenClaw déclenche donc le comportement de plugin et de middleware dont il est propriétaire dans l’adaptateur de harness. Pour les outils natifs Codex, Codex possède l’enregistrement d’outil canonique. OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le thread Codex natif sauf si Codex expose cette opération via l’app-server ou les callbacks de hooks natifs.

Les projections de Compaction et de cycle de vie LLM proviennent des notifications de l’app-server Codex et de l’état de l’adaptateur OpenClaw, pas des commandes de hooks natifs Codex. Les événements `before_compaction`, `after_compaction`, `llm_input` et `llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, pas des captures octet pour octet de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications app-server natives Codex `hook/started` et `hook/completed` sont projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage. Elles n’invoquent pas les hooks de plugins OpenClaw.

## Contrat de prise en charge V1

Le mode Codex n’est pas PI avec un appel de modèle différent en dessous. Codex possède une plus grande partie de la boucle de modèle native, et OpenClaw adapte ses surfaces de plugin et de session autour de cette limite.

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                         | Pourquoi                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                          | L’app-server Codex possède le tour OpenAI, la reprise de thread native et la continuation d’outil native.                                                                                              |
| Routage et livraison des canaux OpenClaw      | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime de modèle.                                                                                              |
| Outils dynamiques OpenClaw                    | Pris en charge                          | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                        |
| Plugins de prompt et de contexte              | Pris en charge                          | OpenClaw construit des surcouches de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le thread.                                                                     |
| Cycle de vie du moteur de contexte            | Pris en charge                          | L’assemblage, l’ingestion ou la maintenance après tour, et la coordination de Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                        |
| Hooks d’outils dynamiques                     | Pris en charge                          | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                             |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes du mode Codex.                                                       |
| Gate de révision de réponse finale            | Pris en charge via le relais de hook natif | Codex `Stop` est relayé vers `before_agent_finalize` ; `revise` demande à Codex une passe de modèle supplémentaire avant la finalisation.                                                              |
| Blocage ou observation du shell natif, patch et MCP | Pris en charge via le relais de hook natif | Codex `PreToolUse` et `PostToolUse` sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur l’app-server Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture d’arguments ne l’est pas. |
| Politique de permissions native               | Pris en charge via le relais de hook natif | Codex `PermissionRequest` peut être routé via la politique OpenClaw là où le runtime l’expose. Si OpenClaw ne renvoie aucune décision, Codex poursuit son chemin normal de guardian ou d’approbation utilisateur. |
| Capture de trajectoire app-server             | Pris en charge                          | OpenClaw enregistre la requête envoyée à l’app-server et les notifications d’app-server qu’il reçoit.                                                                                                  |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite V1                                                                                                                                       | Chemin futur                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutation des arguments d’outils natifs              | Les hooks natifs de pré-outil Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs Codex.                         | Nécessite la prise en charge Codex hook/schema pour une entrée d’outil de remplacement.     |
| Historique de transcription native Codex modifiable | Codex possède l’historique canonique des threads natifs. OpenClaw possède un miroir et peut projeter du contexte futur, mais ne doit pas muter des internes non pris en charge. | Ajouter des API explicites d’app-server Codex si une chirurgie de thread natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                       | Pourrait refléter les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge Codex. |
| Métadonnées riches de Compaction native             | OpenClaw observe le démarrage et la fin de la Compaction, mais ne reçoit pas de liste stable conservée/supprimée, de delta de tokens ou de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                   |
| Intervention de Compaction                          | Les hooks de Compaction OpenClaw actuels sont au niveau notification en mode Codex.                                                              | Ajouter des hooks pré/post Compaction Codex si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet de la requête d’API de modèle | OpenClaw peut capturer les requêtes et notifications d’app-server, mais le cœur Codex construit en interne la requête finale à l’API OpenAI.    | Nécessite un événement de traçage de requête de modèle Codex ou une API de débogage.        |

## Outils, médias et Compaction

Le harness Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques du harness. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie continuent de passer par le chemin de livraison OpenClaw normal.

Le relais de hook natif est intentionnellement générique, mais le contrat de prise en charge v1 est limité aux chemins d’outils natifs Codex et de permissions que teste OpenClaw. Dans le runtime Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`, `PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur événement de hook Codex est une surface de plugin OpenClaw tant que le contrat de runtime ne le nomme pas.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de décision de hook et revient à son propre chemin de guardian ou d’approbation utilisateur.

Les sollicitations d’approbation d’outils MCP Codex sont routées via le flux d’approbation de plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme `"mcp_tool_call"`. Les prompts Codex `request_user_input` sont renvoyés à la discussion d’origine, et le prochain message de suivi en file d’attente répond à cette requête de serveur native au lieu d’être orienté comme contexte supplémentaire. Les autres requêtes de sollicitation MCP échouent toujours en mode fermé.

Le pilotage de la file d’attente d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
réglage par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de discussion en file d’attente
pendant la fenêtre de silence configurée et les envoie sous forme d’une seule requête `turn/steer`,
dans l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` distinctes. Les tours de
revue Codex et de compaction manuelle peuvent rejeter le pilotage dans le même tour ; dans ce cas,
OpenClaw utilise la file d’attente de suivi lorsque le mode sélectionné autorise le repli. Voir
[File de pilotage](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la compaction native du fil est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir de transcription pour l’historique
des canaux, la recherche, `/new`, `/reset`, et les futurs changements de modèle ou de harnais. Le
miroir inclut la demande utilisateur, le texte final de l’assistant, ainsi que les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw
n’enregistre que les signaux de début et de fin de la compaction native. Il n’expose pas encore de
résumé de compaction lisible par un humain ni de liste vérifiable des entrées que Codex
a conservées après la compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne réécrit pas
actuellement les enregistrements de résultats d’outils natifs de Codex. Il s’applique uniquement lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session appartenant à OpenClaw.

La génération de médias ne nécessite pas PI. L’image, la vidéo, la musique, les PDF, le TTS et la
compréhension des médias continuent d’utiliser les réglages de fournisseur/modèle correspondants, tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** c’est attendu pour les
nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une référence héritée `codex/*`), activez
`plugins.entries.codex.enabled`, et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut encore utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne prend en charge l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Un
runtime Codex forcé échoue désormais au lieu de se replier sur PI, sauf si vous
définissez explicitement `agentRuntime.fallback: "pi"`. Une fois le serveur d’application Codex
sélectionné, ses échecs remontent directement sans configuration de repli supplémentaire.

**Le serveur d’application est rejeté :** mettez à niveau Codex afin que la négociation du serveur d’application
signale la version `0.125.0` ou une version plus récente. Les préversions de même version ou les
versions suffixées par une build, comme `0.125.0-alpha.2` ou `0.125.0+custom`, sont rejetées parce que le
plancher du protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant utilise la même version du protocole de serveur d’application Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une référence héritée
`codex/*`. Les références simples `openai/gpt-*` et les autres références de fournisseurs restent sur leur chemin de
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque
tour intégré pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé, mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si cela persiste, redémarrez
le Gateway pour effacer les enregistrements de hooks natifs périmés. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop, puis réessayez.

## Connexes

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
