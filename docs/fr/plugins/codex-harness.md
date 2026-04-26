---
read_when:
    - Vous souhaitez utiliser le harness app-server Codex intégré
    - Vous avez besoin d’exemples de configuration du harness Codex
    - Vous voulez que les déploiements Codex uniquement échouent au lieu de revenir à PI
summary: Exécuter les tours d’agent embarqués OpenClaw via le harness app-server Codex intégré
title: Harness Codex
x-i18n:
    generated_at: "2026-04-26T11:34:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Le Plugin `codex` intégré permet à OpenClaw d’exécuter des tours d’agent embarqués via le
app-server Codex au lieu du harness PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d’agent de bas niveau : découverte de
modèles, reprise native de fil, Compaction native et exécution par app-server.
OpenClaw conserve toujours la responsabilité des canaux de chat, des fichiers de session, de la sélection de modèles, des outils,
des approbations, de la remise des médias et du miroir visible de transcription.

Si vous cherchez à vous orienter, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Ce que ce Plugin change

Le Plugin `codex` intégré apporte plusieurs capacités distinctes :

| Capability                        | Comment l’utiliser                                | Ce que cela fait                                                            |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Runtime embarqué natif            | `agentRuntime.id: "codex"`                        | Exécute les tours d’agent embarqués OpenClaw via le app-server Codex.       |
| Commandes natives de contrôle du chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les fils app-server Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue app-server Codex | internes `codex`, exposés via le harness       | Permet au runtime de découvrir et valider les modèles app-server.            |
| Chemin de compréhension média Codex | chemins de compatibilité de modèle image `codex/*` | Exécute des tours app-server Codex bornés pour les modèles pris en charge de compréhension d’image. |
| Relais de hooks natifs            | Hooks de Plugin autour des événements natifs Codex | Permet à OpenClaw d’observer/de bloquer les événements natifs Codex pris en charge pour les outils/la finalisation. |

Activer le Plugin rend ces capacités disponibles. Cela **ne** :

- démarre pas l’utilisation de Codex pour chaque modèle OpenAI
- ne convertit pas les références de modèle `openai-codex/*` en runtime natif
- ne fait pas d’ACP/acpx le chemin Codex par défaut
- ne bascule pas à chaud les sessions existantes ayant déjà enregistré un runtime PI
- ne remplace pas la remise de canal OpenClaw, les fichiers de session, le stockage de profils d’authentification ou
  le routage de messages

Le même Plugin possède aussi la surface de commandes natives de contrôle du chat `/codex`. Si
le Plugin est activé et que l’utilisateur demande de lier, reprendre, piloter, arrêter ou inspecter
des fils Codex depuis le chat, les agents doivent préférer `/codex ...` à ACP. ACP reste
le repli explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur ACP
Codex.

Les tours natifs Codex conservent les hooks de Plugin OpenClaw comme couche publique de compatibilité.
Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcription miroir
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les plugins peuvent aussi enregistrer un middleware neutre vis-à-vis du runtime pour les résultats d’outils afin de réécrire
les résultats d’outils dynamiques OpenClaw après qu’OpenClaw a exécuté l’outil et avant que le
résultat soit renvoyé à Codex. Cela est distinct du hook public de Plugin
`tool_result_persist`, qui transforme les écritures de résultats d’outils dans la transcription possédées par OpenClaw.

Pour la sémantique des hooks de Plugin elle-même, voir [Hooks de Plugin](/fr/plugins/hooks)
et [Comportement des gardes de Plugin](/fr/tools/plugin).

Le harness est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
veulent une exécution app-server native. Les anciennes références de modèle `codex/*` sélectionnent encore automatiquement
le harness pour des raisons de compatibilité, mais les préfixes de fournisseur hérités adossés au runtime ne sont
pas affichés comme des choix normaux de modèle/fournisseur.

Si le Plugin `codex` est activé mais que le modèle principal est toujours
`openai-codex/*`, `openclaw doctor` avertit au lieu de modifier le routage. C’est
intentionnel : `openai-codex/*` reste le chemin OAuth/abonnement PI Codex, et
l’exécution app-server native reste un choix explicite de runtime.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                          | Référence de modèle        | Configuration du runtime               | Exigence de Plugin         | Libellé d’état attendu         |
| ---------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| API OpenAI via le runner normal OpenClaw       | `openai/gpt-*`             | omis ou `runtime: "pi"`                | Fournisseur OpenAI         | `Runtime: OpenClaw Pi Default` |
| OAuth/abonnement Codex via PI                  | `openai-codex/gpt-*`       | omis ou `runtime: "pi"`                | Fournisseur OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Tours embarqués natifs app-server Codex        | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`             | `Runtime: OpenAI Codex`        |
| Fournisseurs mixtes avec mode auto conservateur | références spécifiques au fournisseur | `agentRuntime.id: "auto"` | Runtimes de Plugin facultatifs | Dépend du runtime sélectionné |
| Session explicite avec adaptateur ACP Codex    | dépend d’ACP prompt/model  | `sessions_spawn` avec `runtime: "acp"` | backend `acpx` sain        | Statut de tâche/session ACP    |

La séparation importante est fournisseur versus runtime :

- `openai-codex/*` répond à « quelle route fournisseur/authentification PI doit-elle utiliser ? »
- `agentRuntime.id: "codex"` répond à « quelle boucle doit exécuter ce
  tour embarqué ? »
- `/codex ...` répond à « quelle conversation native Codex ce chat doit-il lier
  ou contrôler ? »
- ACP répond à « quel processus de harness externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI sont spécifiques au préfixe. Utilisez `openai-codex/*` lorsque vous voulez
Codex OAuth via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l’API OpenAI ou
lorsque vous forcez le harness app-server natif Codex :

| Référence de modèle                            | Chemin du runtime                              | À utiliser lorsque                                                         |
| ---------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                               | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez un accès direct actuel à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                         | OAuth OpenAI Codex via OpenClaw/PI             | Vous voulez une authentification par abonnement ChatGPT/Codex avec le runner PI par défaut. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"`  | Harness app-server Codex                       | Vous voulez une exécution app-server native Codex pour le tour d’agent embarqué. |

GPT-5.5 est actuellement limité à l’abonnement/OAuth dans OpenClaw. Utilisez
`openai-codex/gpt-5.5` pour OAuth PI, ou `openai/gpt-5.5` avec le harness
app-server Codex. L’accès direct par clé API à `openai/gpt-5.5` sera pris en charge
une fois qu’OpenAI activera GPT-5.5 sur l’API publique.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité Doctor
réécrit les anciennes références principales de runtime vers des références canoniques de modèle
et enregistre la politique de runtime séparément, tandis que les anciennes références de repli uniquement restent inchangées parce que le runtime est configuré pour l’ensemble du conteneur d’agent.
Les nouvelles configurations PI Codex OAuth doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de harness
app-server natif doivent utiliser `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation de préfixe. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d’image doit s’exécuter via le chemin fournisseur OAuth OpenAI
Codex. Utilisez `codex/gpt-*` lorsque la compréhension d’image doit s’exécuter
via un tour app-server Codex borné. Le modèle app-server Codex doit
annoncer la prise en charge de l’entrée image ; les modèles Codex texte uniquement échouent avant le démarrage
du tour média.

Utilisez `/status` pour confirmer le harness effectif pour la session courante. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` de la Gateway. Il
inclut l’identifiant du harness sélectionné, la raison de la sélection, la politique runtime/repli, et,
en mode `auto`, le résultat de prise en charge de chaque candidat de Plugin.

### Ce que signifient les avertissements Doctor

`openclaw doctor` avertit lorsque tous les éléments suivants sont vrais :

- le Plugin `codex` intégré est activé ou autorisé
- le modèle principal d’un agent est `openai-codex/*`
- le runtime effectif de cet agent n’est pas `codex`

Cet avertissement existe parce que les utilisateurs s’attendent souvent à ce que « Plugin Codex activé » implique
« runtime app-server natif Codex ». OpenClaw ne fait pas ce saut. L’avertissement signifie :

- **Aucun changement n’est requis** si vous vouliez une authentification ChatGPT/Codex OAuth via PI.
- Modifiez le modèle en `openai/<model>` et définissez
  `agentRuntime.id: "codex"` si vous vouliez une exécution app-server native.
- Les sessions existantes nécessitent toujours `/new` ou `/reset` après un changement de runtime,
  car les épingles de runtime de session sont persistantes.

La sélection du harness n’est pas un contrôle de session en direct. Lorsqu’un tour embarqué s’exécute,
OpenClaw enregistre l’identifiant du harness sélectionné sur cette session et continue de l’utiliser pour les
tours suivants dans le même identifiant de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les sessions futures utilisent un autre harness ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante entre PI et Codex. Cela évite de rejouer une transcription à travers
deux systèmes de session natifs incompatibles.

Les anciennes sessions créées avant les épingles de harness sont traitées comme épinglées PI dès qu’elles
contiennent un historique de transcription. Utilisez `/new` ou `/reset` pour faire entrer cette conversation dans
Codex après modification de la configuration.

`/status` affiche le runtime effectif du modèle. Le harness PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harness app-server Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le Plugin `codex` intégré disponible.
- App-server Codex `0.125.0` ou version ultérieure. Le Plugin intégré gère par défaut un
  binaire app-server Codex compatible, de sorte que les commandes locales `codex` dans le `PATH`
  n’affectent pas le démarrage normal du harness.
- Authentification Codex disponible pour le processus app-server.

Le Plugin bloque les handshakes app-server plus anciens ou sans version. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests de fumée en direct et Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus
des fichiers facultatifs Codex CLI tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez le même matériel d’authentification que votre app-server Codex local
utilise.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le Plugin intégré et forcez le harness `codex` :

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

Les anciennes configurations qui définissent `agents.defaults.model` ou un modèle d’agent sur
`codex/<model>` activent encore automatiquement le Plugin `codex` intégré. Les nouvelles configurations doivent
préférer `openai/<model>` plus l’entrée explicite `agentRuntime` ci-dessus.

## Ajouter Codex à côté d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et des modèles de fournisseurs non Codex. Un runtime forcé s’applique à chaque
tour embarqué pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw essaie quand même le harness Codex et échoue en mode fermé
au lieu de router silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Conservez l’agent par défaut sur `agentRuntime.id: "auto"` avec repli PI pour un usage normal mixte entre
  fournisseurs.
- Utilisez les anciennes références `codex/*` uniquement pour la compatibilité. Les nouvelles configurations doivent préférer
  `openai/*` plus une politique de runtime Codex explicite.

Par exemple, cela conserve l’agent par défaut sur une sélection automatique normale et
ajoute un agent Codex distinct :

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

- L’agent `main` par défaut utilise le chemin normal du fournisseur et le repli de compatibilité PI.
- L’agent `codex` utilise le harness app-server Codex.
- Si Codex est absent ou non pris en charge pour l’agent `codex`, le tour échoue
  au lieu d’utiliser PI en silence.

## Routage des commandes d’agent

Les agents doivent router les requêtes utilisateur selon l’intention, pas seulement selon le mot « Codex » :

| L’utilisateur demande...                                 | L’agent doit utiliser...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| « Lier ce chat à Codex »                                 | `/codex bind`                                    |
| « Reprendre ici le fil Codex `<id>` »                    | `/codex resume <id>`                             |
| « Afficher les fils Codex »                              | `/codex threads`                                 |
| « Utiliser Codex comme runtime pour cet agent »          | modification de configuration de `agentRuntime.id` |
| « Utiliser mon abonnement ChatGPT/Codex avec OpenClaw normal » | références de modèle `openai-codex/*`     |
| « Exécuter Codex via ACP/acpx »                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarrer Claude Code/Gemini/OpenCode/Cursor dans un fil » | ACP/acpx, pas `/codex` et pas de sous-agents natifs |

OpenClaw n’annonce des conseils de lancement ACP aux agents que lorsque ACP est activé,
répartissable et soutenu par un backend runtime chargé. Si ACP n’est pas disponible,
le prompt système et les Skills de Plugin ne doivent pas informer l’agent sur le routage
ACP.

## Déploiements Codex uniquement

Forcez le harness Codex lorsque vous devez prouver que chaque tour d’agent embarqué
utilise Codex. Les runtimes de Plugin explicites utilisent par défaut l’absence de repli PI, donc
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

Remplacement par variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le
app-server est trop ancien, ou si le app-server ne peut pas démarrer. Définissez
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` uniquement si vous voulez intentionnellement que PI gère
la sélection de harness manquante.

## Codex par agent

Vous pouvez rendre un agent Codex uniquement tandis que l’agent par défaut conserve une
sélection automatique normale :

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

Utilisez les commandes de session normales pour changer d’agent et de modèle. `/new` crée une nouvelle
session OpenClaw et le harness Codex crée ou reprend son fil app-server annexe
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce fil
et permet au tour suivant de résoudre à nouveau le harness depuis la configuration actuelle.

## Découverte de modèles

Par défaut, le Plugin Codex interroge le app-server pour connaître les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de repli intégré pour :

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

## Connexion app-server et politique

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est déclaré comme dépendance d’exécution de Plugin intégrée et mis en place
avec le reste des dépendances du Plugin `codex`. Cela permet de lier la version du app-server
au Plugin intégré plutôt qu’à n’importe quelle CLI Codex séparée
installée localement. Définissez `appServer.command` uniquement lorsque vous
voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales du harness Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Il s’agit de la posture locale de confiance utilisée
pour les Heartbeat autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est présent pour répondre.

Pour activer les approbations relues par le gardien Codex, définissez `appServer.mode:
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

Le mode Guardian utilise le chemin natif d’approbation avec auto-review de Codex. Lorsque Codex demande à
sortir du sandbox, écrire en dehors de l’espace de travail, ou ajouter des autorisations comme l’accès réseau,
Codex route cette demande d’approbation vers le reviewer natif au lieu d’une invite humaine. Le reviewer applique le cadre de risque de Codex et approuve ou refuse la requête spécifique. Utilisez Guardian lorsque vous voulez plus de garde-fous que le mode YOLO
tout en ayant besoin que des agents sans supervision puissent continuer à progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, de sorte que les déploiements avancés peuvent mélanger
le préréglage avec des choix explicites. L’ancienne valeur de reviewer `guardian_subagent` est
toujours acceptée comme alias de compatibilité, mais les nouvelles configurations doivent utiliser
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

Champs `appServer` pris en charge :

| Field               | Default                                  | Signification                                                                                                  |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                     |
| `command`           | binaire Codex géré                       | Exécutable pour le transport stdio. Laissez vide pour utiliser le binaire géré ; définissez-le uniquement pour un remplacement explicite. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                             |
| `url`               | non défini                               | URL WebSocket de l’app-server.                                                                                 |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                      |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Délai d’attente pour les appels au plan de contrôle app-server.                                                |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou relue par guardian.                                                        |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage/reprise/tour du fil.                               |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage/reprise du fil.                                                   |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex relire les invites d’approbation natives. `guardian_subagent` reste un alias hérité. |
| `serviceTier`       | non défini                               | Niveau de service app-server Codex facultatif : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées. |

Des remplacements par variables d’environnement restent disponibles pour les tests locaux :

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
préférée pour les déploiements reproductibles parce qu’elle garde le comportement du Plugin dans le
même fichier révisé que le reste de la configuration du harness Codex.

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

Validation de harness Codex uniquement :

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

Approbations Codex relues par Guardian :

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
à un fil Codex existant, le tour suivant renvoie au app-server le modèle
OpenAI actuellement sélectionné, le fournisseur, la politique d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la liaison au fil mais demande à Codex de continuer avec le nouveau modèle sélectionné.

## Commande Codex

Le Plugin intégré enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un fil Codex existant.
- `/codex compact` demande au app-server Codex de compacter le fil attaché.
- `/codex review` démarre une révision native Codex pour le fil attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du app-server Codex.
- `/codex skills` liste les Skills du app-server Codex.

`/codex resume` écrit le même fichier de liaison annexe que celui utilisé par le harness pour les
tours normaux. Au message suivant, OpenClaw reprend ce fil Codex, transmet au
app-server le modèle OpenClaw actuellement sélectionné et garde l’historique étendu
activé.

La surface de commande nécessite le app-server Codex `0.125.0` ou version ultérieure. Les méthodes
de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Frontières des hooks

Le harness Codex possède trois couches de hooks :

| Layer                                 | Propriétaire              | Objectif                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité produit/plugin entre les harnesses PI et Codex.       |
| Middleware d’extension du app-server Codex | Plugins intégrés OpenClaw | Comportement de l’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie bas niveau Codex et politique d’outils natifs depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` de projet ou globaux de Codex pour router
le comportement des plugins OpenClaw. Pour le pont pris en charge d’outil natif et d’autorisations,
OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse`,
`PermissionRequest` et `Stop`. Les autres hooks Codex tels que `SessionStart` et
`UserPromptSubmit` restent des contrôles au niveau Codex ; ils ne sont pas exposés comme
hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, donc OpenClaw déclenche le comportement du plugin et du middleware qu’il possède dans l’adaptateur
de harness. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut refléter certains événements, mais ne peut pas réécrire le fil natif Codex
à moins que Codex n’expose cette opération via le app-server ou des callbacks de hook natif.

Les projections du cycle de vie LLM et de la Compaction proviennent des notifications du app-server Codex
et de l’état de l’adaptateur OpenClaw, et non de commandes de hooks natifs Codex.
Les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations au niveau adaptateur, pas des captures
octet pour octet des requêtes internes ou des charges utiles de Compaction de Codex.

Les notifications natives `hook/started` et `hook/completed` du app-server Codex sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas de hooks de Plugin OpenClaw.

## Contrat de prise en charge V1

Le mode Codex n’est pas PI avec un autre appel de modèle en dessous. Codex possède davantage de
la boucle de modèle native, et OpenClaw adapte ses surfaces de plugin et de session
autour de cette frontière.

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                          | Pourquoi                                                                                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                           | Le app-server Codex possède le tour OpenAI, la reprise native du fil et la continuation native des outils.                                                                                              |
| Routage et remise des canaux OpenClaw         | Pris en charge                           | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime de modèle.                                                                                               |
| Outils dynamiques OpenClaw                    | Pris en charge                           | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                         |
| Plugins de prompt et de contexte              | Pris en charge                           | OpenClaw construit les surcouches de prompt et projette le contexte dans le tour Codex avant de démarrer ou reprendre le fil.                                                                          |
| Cycle de vie du moteur de contexte            | Pris en charge                           | L’assemblage, l’ingestion ou la maintenance après-tour, ainsi que la coordination de la Compaction du moteur de contexte, s’exécutent pour les tours Codex.                                          |
| Hooks d’outils dynamiques                     | Pris en charge                           | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                             |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                |
| Porte de révision de réponse finale           | Pris en charge via le relais de hook natif | Codex `Stop` est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage modèle supplémentaire avant la finalisation.                                                                |
| Bloquer ou observer shell, patch et MCP natifs | Pris en charge via le relais de hook natif | `PreToolUse` et `PostToolUse` Codex sont relayés pour les surfaces d’outils natifs engagées, y compris les charges utiles MCP sur le app-server Codex `0.125.0` ou plus récent. Le blocage est pris en charge ; la réécriture d’arguments ne l’est pas. |
| Politique native d’autorisations              | Pris en charge via le relais de hook natif | `PermissionRequest` Codex peut être routé via la politique OpenClaw là où le runtime l’expose. Si OpenClaw ne renvoie aucune décision, Codex continue via son chemin normal d’approbation guardian ou utilisateur. |
| Capture de trajectoire app-server             | Pris en charge                           | OpenClaw enregistre la requête qu’il a envoyée au app-server et les notifications qu’il reçoit du app-server.                                                                                          |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Frontière v1                                                                                                                                     | Chemin futur                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Mutation d’arguments d’outil natif                  | Les hooks natifs pré-outil Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs Codex.                          | Nécessite une prise en charge Codex hook/schema pour remplacer l’entrée d’outil.       |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique natif du fil. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites de app-server Codex si une chirurgie native du fil est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                       | Pourrait refléter des enregistrements transformés, mais la réécriture canonique nécessite le support de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable conservée/supprimée, de delta de jetons ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                               |
| Intervention sur la Compaction                      | Les hooks actuels de Compaction OpenClaw sont au niveau notification en mode Codex.                                                             | Ajouter des hooks Codex pré/post Compaction si les plugins doivent pouvoir opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet des requêtes API modèle    | OpenClaw peut capturer les requêtes et notifications du app-server, mais le noyau Codex construit en interne la requête API OpenAI finale.     | Nécessite un événement de traçage de requête modèle Codex ou une API de débogage.      |

## Outils, médias et Compaction

Le harness Codex ne change que l’exécuteur embarqué de bas niveau de l’agent.

OpenClaw construit toujours la liste d’outils et reçoit les résultats des outils dynamiques depuis le
harness. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin normal de remise OpenClaw.

Le relais de hooks natifs est volontairement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils natifs et d’autorisations Codex testés par OpenClaw. Dans
le runtime Codex, cela inclut les charges utiles `PreToolUse`,
`PostToolUse` et `PermissionRequest` pour shell, patch et MCP. N’imaginez pas que tout futur
événement de hook Codex constitue une surface de Plugin OpenClaw tant que le contrat de runtime ne l’a pas nommé.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique tranche. Un résultat sans décision n’est pas une autorisation. Codex
le traite comme absence de décision de hook et retombe sur son propre chemin normal
d’approbation guardian ou utilisateur.

Les sollicitations d’approbation des outils MCP Codex sont routées via le flux
d’approbation de Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les prompts Codex `request_user_input` sont renvoyés au
chat d’origine, et le prochain message de suivi en file répond à cette requête native
du serveur au lieu d’être piloté comme contexte supplémentaire. Les autres requêtes de sollicitation MCP échouent toujours en mode fermé.

Lorsque le modèle sélectionné utilise le harness Codex, la Compaction native du fil est
déléguée au app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique du canal,
la recherche, `/new`, `/reset`, ainsi que pour les futurs changements de modèle ou de harness. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant et des enregistrements légers
du raisonnement ou du plan Codex lorsque le app-server les émet. Aujourd’hui, OpenClaw n’enregistre que les signaux de début et de fin de Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste auditable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne réécrit pas
actuellement les enregistrements de résultats d’outils natifs Codex. Il s’applique uniquement lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session possédée par OpenClaw.

La génération de médias ne nécessite pas PI. L’image, la vidéo, la musique, le PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme fournisseur normal dans `/model` :** c’est le comportement attendu pour les
nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une ancienne référence `codex/*`), activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut encore utiliser PI comme
backend de compatibilité lorsqu’aucun harness Codex ne revendique l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Un
runtime Codex forcé échoue désormais au lieu de revenir à PI, sauf si vous
définissez explicitement `agentRuntime.fallback: "pi"`. Une fois le app-server Codex
sélectionné, ses défaillances apparaissent directement sans configuration de repli supplémentaire.

**Le app-server est rejeté :** mettez Codex à niveau afin que le handshake app-server
signale la version `0.125.0` ou ultérieure. Les préversions de même version ou les
versions suffixées build telles que `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées car le
seuil de protocole stable `0.125.0` est celui contre lequel OpenClaw est testé.

**La découverte de modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le app-server distant parle la même version de protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une ancienne
référence `codex/*`. Les références simples `openai/gpt-*` et celles des autres fournisseurs restent sur leur chemin fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque
tour embarqué de cet agent doit être un modèle OpenAI pris en charge par Codex.

## Liens connexes

- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Statut](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
