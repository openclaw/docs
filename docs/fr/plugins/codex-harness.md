---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex bundled
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous souhaitez que les déploiements Codex-only échouent au lieu de revenir à PI
summary: Exécuter les tours de l’agent embarqué OpenClaw via le harnais app-server Codex bundled
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-25T13:51:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Le Plugin `codex` bundled permet à OpenClaw d’exécuter les tours d’agent embarqué via
l’app-server Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous souhaitez que Codex prenne en charge la session d’agent de bas niveau :
découverte de modèles, reprise native des fils, Compaction native et exécution par app-server.
OpenClaw conserve néanmoins la responsabilité des canaux de discussion, des fichiers de session, de la sélection de modèles, des outils,
des approbations, de la livraison des médias et du miroir visible du transcript.

Si vous cherchez à vous repérer, commencez par
[Agent runtimes](/fr/concepts/agent-runtimes). En bref :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

Les tours Codex natifs conservent les Hooks de Plugin OpenClaw comme couche publique de compatibilité.
Il s’agit de Hooks OpenClaw en processus, et non de Hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcript miroir
- `agent_end`

Les plugins peuvent également enregistrer un middleware de résultat d’outil neutre vis-à-vis du runtime afin de réécrire les résultats d’outils dynamiques OpenClaw après exécution de l’outil par OpenClaw et avant le renvoi du résultat à Codex. Cela est distinct du Hook de Plugin public
`tool_result_persist`, qui transforme les écritures de résultats d’outils dans le transcript appartenant à OpenClaw.

Pour la sémantique des Hooks de Plugin elle-même, voir [Plugin hooks](/fr/plugins/hooks)
et [Comportement de garde des plugins](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèles OpenAI
sous forme canonique `openai/gpt-*` et forcer explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
souhaitent une exécution native par app-server. Les anciennes références de modèle `codex/*`
sélectionnent encore automatiquement le harnais pour compatibilité, mais les préfixes de fournisseur hérités adossés au runtime ne sont pas affichés comme des choix normaux de modèle/fournisseur.

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI dépendent du préfixe. Utilisez `openai-codex/*` lorsque vous voulez
Codex OAuth via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l’API OpenAI ou
lorsque vous forcez le harnais app-server Codex natif :

| Réf. de modèle                                       | Chemin runtime                                | À utiliser quand                                                          |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez l’accès direct actuel à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OpenAI Codex OAuth via OpenClaw/PI            | Vous voulez l’authentification par abonnement ChatGPT/Codex avec le runner PI par défaut. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harnais app-server Codex                      | Vous voulez une exécution native via app-server Codex pour le tour d’agent embarqué. |

GPT-5.5 est actuellement réservé à l’authentification par abonnement/OAuth dans OpenClaw. Utilisez
`openai-codex/gpt-5.5` pour l’OAuth PI, ou `openai/gpt-5.5` avec le harnais
app-server Codex. L’accès direct par clé API pour `openai/gpt-5.5` sera pris en charge
une fois qu’OpenAI aura activé GPT-5.5 sur l’API publique.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité Doctor
réécrit les anciennes références runtime principales en références de modèle canoniques et enregistre séparément la politique runtime, tandis que les anciennes références de repli seules restent inchangées, car le runtime est configuré pour tout le conteneur d’agent.
Les nouvelles configurations PI Codex OAuth doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de harnais
app-server natif doivent utiliser `openai/gpt-*` plus
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` suit le même découpage de préfixe. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d’image doit passer par le chemin fournisseur OpenAI
Codex OAuth. Utilisez `codex/gpt-*` lorsque la compréhension d’image doit passer
par un tour borné d’app-server Codex. Le modèle app-server Codex doit
annoncer la prise en charge des entrées image ; les modèles Codex texte seul échouent avant le début du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session en cours. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` de la gateway. Il
inclut l’identifiant de harnais sélectionné, la raison de la sélection, la politique runtime/repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

La sélection du harnais n’est pas un contrôle live de session. Lorsqu’un tour embarqué s’exécute,
OpenClaw enregistre l’identifiant du harnais sélectionné sur cette session et continue de l’utiliser pour
les tours ultérieurs du même ID de session. Modifiez la configuration `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous souhaitez que les sessions futures utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante entre PI et Codex.
Cela évite de rejouer un même transcript à travers deux systèmes de session natifs incompatibles.

Les anciennes sessions créées avant l’épinglage des harnais sont traitées comme épinglées sur PI dès lors
qu’elles ont un historique de transcript. Utilisez `/new` ou `/reset` pour faire passer cette conversation à
Codex après avoir modifié la configuration.

`/status` affiche le runtime de modèle effectif. Le harnais PI par défaut apparaît sous
`Runtime: OpenClaw Pi Default`, et le harnais app-server Codex apparaît sous
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le Plugin `codex` bundled disponible.
- App-server Codex `0.118.0` ou version plus récente.
- Authentification Codex disponible pour le processus app-server.

Le Plugin bloque les handshakes app-server plus anciens ou non versionnés. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus
éventuellement de fichiers CLI Codex tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’authentification que votre app-server Codex local.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le Plugin bundled et forcez le harnais `codex` :

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, incluez également `codex` :

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
`codex/<model>` activent encore automatiquement le Plugin bundled `codex`. Les nouvelles configurations doivent
préférer `openai/<model>` plus l’entrée explicite `embeddedHarness` ci-dessus.

## Ajouter Codex à côté d’autres modèles

Ne définissez pas `runtime: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et des modèles de fournisseurs non Codex. Un runtime forcé s’applique à chaque
tour embarqué de cet agent ou de cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw essaie quand même le harnais Codex et échoue de manière sûre au lieu
de router silencieusement ce tour via PI.

Utilisez plutôt l’une de ces formes :

- Placez Codex sur un agent dédié avec `embeddedHarness.runtime: "codex"`.
- Conservez l’agent par défaut sur `runtime: "auto"` et le repli PI pour un usage normal
  avec plusieurs fournisseurs.
- Utilisez les anciennes références `codex/*` uniquement pour compatibilité. Les nouvelles configurations doivent préférer
  `openai/*` plus une politique runtime Codex explicite.

Par exemple, cela conserve l’agent par défaut sur la sélection automatique normale et
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
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Avec cette forme :

- L’agent `main` par défaut utilise le chemin fournisseur normal et le repli de compatibilité PI.
- L’agent `codex` utilise le harnais app-server Codex.
- Si Codex est manquant ou non pris en charge pour l’agent `codex`, le tour échoue
  au lieu d’utiliser PI discrètement.

## Déploiements Codex-only

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d’agent embarqué
utilise Codex. Les runtimes de Plugin explicites n’ont par défaut aucun repli PI, donc
`fallback: "none"` est facultatif mais souvent utile comme documentation :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

Lorsque Codex est forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si l’
app-server est trop ancien ou si l’app-server ne peut pas démarrer. Définissez
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` uniquement si vous souhaitez volontairement que PI prenne en charge
une sélection de harnais manquante.

## Codex par agent

Vous pouvez rendre un agent Codex-only tandis que l’agent par défaut conserve la
sélection automatique normale :

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session normales pour changer d’agent et de modèle. `/new` crée une nouvelle
session OpenClaw et le harnais Codex crée ou reprend son fil app-server compagnon
selon le besoin. `/reset` efface le binding de session OpenClaw pour ce fil
et permet au tour suivant de résoudre à nouveau le harnais à partir de la configuration courante.

## Découverte de modèles

Par défaut, le Plugin Codex demande à l’app-server les modèles disponibles. Si la
découverte échoue ou expire, il utilise un catalogue bundled de repli pour :

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

Désactivez la découverte lorsque vous souhaitez que le démarrage évite de sonder Codex et reste sur le
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

## Connexion à l’app-server et politique

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw démarre les sessions locales de harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, et
`sandbox: "danger-full-access"`. Il s’agit de la posture de confiance de l’opérateur local utilisée
pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est là pour répondre.

Pour activer les approbations révisées par le gardien Codex, définissez `appServer.mode:
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

Le mode Guardian utilise le chemin d’approbation native avec révision automatique de Codex. Lorsque Codex demande à
sortir du sandbox, à écrire en dehors du workspace, ou à ajouter des autorisations comme l’accès réseau,
Codex route cette demande d’approbation vers le réviseur natif plutôt que vers une
invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse
la demande spécifique. Utilisez Guardian lorsque vous voulez plus de garde-fous que le mode YOLO
tout en ayant besoin que des agents sans surveillance continuent à progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, de sorte que les déploiements avancés peuvent combiner
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

| Champ               | Par défaut                               | Signification                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                        |
| `command`           | `"codex"`                                | Exécutable pour le transport stdio.                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                 |
| `url`               | non défini                               | URL WebSocket de l’app-server.                                                                                     |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                          |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels de plan de contrôle vers l’app-server.                                          |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou avec approbation revue par guardian.                                           |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage/reprise/tour du fil.                                    |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage/reprise du fil.                                                       |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité. |
| `serviceTier`       | non défini                               | Niveau de service optionnel de l’app-server Codex : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées. |

Les anciennes variables d’environnement fonctionnent toujours comme valeurs de repli pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimée. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans le
même fichier révisé que le reste de la configuration du harnais Codex.

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

Validation du harnais Codex-only :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

Approbations Codex revues par Guardian :

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
à un fil Codex existant, le tour suivant envoie de nouveau à
l’app-server le modèle OpenAI actuellement sélectionné, le fournisseur, la politique d’approbation, le sandbox et le niveau de service.
Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve le
binding du fil mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin bundled enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct à l’app-server, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles de l’app-server Codex en direct.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw courante à un fil Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le fil attaché.
- `/codex review` démarre la revue native Codex pour le fil attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les Skills de l’app-server Codex.

`/codex resume` écrit le même fichier de binding sidecar que celui utilisé par le harnais pour
les tours normaux. Au message suivant, OpenClaw reprend ce fil Codex, transmet le
modèle OpenClaw actuellement sélectionné à l’app-server et garde l’historique étendu
activé.

La surface de commande nécessite l’app-server Codex `0.118.0` ou plus récent. Les méthodes
de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des Hooks

Le harnais Codex comporte trois couches de Hooks :

| Couche                                | Propriétaire              | Rôle                                                                |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                  | Compatibilité produit/plugin entre les harnais PI et Codex.         |
| Middleware d’extension app-server Codex | Plugins bundled OpenClaw | Comportement d’adaptation par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                     | Cycle de vie Codex de bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` Codex de projet ou globaux pour router
le comportement des plugins OpenClaw. Pour le pont pris en charge entre outils natifs et permissions,
OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse` et
`PermissionRequest`. Les autres Hooks Codex tels que `SessionStart`,
`UserPromptSubmit` et `Stop` restent des contrôles au niveau Codex ; ils ne sont pas exposés
comme Hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel, de sorte qu’OpenClaw déclenche le comportement de plugin et de middleware qu’il possède dans
l’adaptateur du harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le fil natif Codex
à moins que Codex n’expose cette opération via l’app-server ou des callbacks de Hook natif.

Les projections du cycle de vie de la Compaction et du LLM proviennent des notifications de l’app-server Codex
et de l’état de l’adaptateur OpenClaw, et non des commandes de Hook natif Codex.
Les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations au niveau adaptateur, et non des captures octet pour octet
de la requête interne ou de la charge utile de Compaction de Codex.

Les notifications natives d’app-server Codex `hook/started` et `hook/completed` sont
projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les Hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Le mode Codex n’est pas PI avec un autre appel de modèle en dessous. Codex prend en charge davantage
de la boucle native du modèle, et OpenClaw adapte ses surfaces de plugin et de session
autour de cette limite.

Pris en charge dans le runtime Codex v1 :

| Surface                                 | Prise en charge                          | Pourquoi                                                                                                                                      |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex       | Pris en charge                           | L’app-server Codex prend en charge le tour OpenAI, la reprise native du fil et la continuation native des outils.                           |
| Routage et livraison des canaux OpenClaw | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime du modèle.                                   |
| Outils dynamiques OpenClaw              | Pris en charge                           | Codex demande à OpenClaw d’exécuter ces outils, OpenClaw reste donc sur le chemin d’exécution.                                              |
| Plugins de prompt et de contexte        | Pris en charge                           | OpenClaw construit des surcouches de prompt et projette le contexte dans le tour Codex avant de démarrer ou reprendre le fil.              |
| Cycle de vie du moteur de contexte      | Pris en charge                           | L’assemblage, l’ingestion ou la maintenance post-tour, ainsi que la coordination de Compaction du moteur de contexte, s’exécutent pour les tours Codex. |
| Hooks d’outils dynamiques               | Pris en charge                           | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques appartenant à OpenClaw. |
| Hooks de cycle de vie                   | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex. |
| Bloquer ou observer shell et patch natifs | Pris en charge via le relais de Hook natif | `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natives engagées. Le blocage est pris en charge ; la réécriture d’arguments ne l’est pas. |
| Politique de permissions natives        | Pris en charge via le relais de Hook natif | `PermissionRequest` de Codex peut être routé via la politique OpenClaw lorsque le runtime l’expose.                                        |
| Capture de trajectoire app-server       | Pris en charge                           | OpenClaw enregistre la requête qu’il a envoyée à l’app-server et les notifications d’app-server qu’il reçoit.                              |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite v1                                                                                                                                       | Piste future                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mutation des arguments d’outils natifs              | Les Hooks natifs pre-tool de Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments des outils natifs Codex.                       | Nécessite une prise en charge Codex hook/schema pour remplacer les entrées d’outil.                       |
| Historique de transcript natif Codex modifiable     | Codex possède l’historique canonique natif du fil. OpenClaw possède un miroir et peut projeter le contexte futur, mais ne doit pas muter les internes non pris en charge. | Ajouter des API explicites d’app-server Codex si une chirurgie du fil natif est nécessaire.               |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce Hook transforme les écritures de transcript appartenant à OpenClaw, pas les enregistrements d’outils natifs Codex.                         | Pourrait refléter des enregistrements transformés, mais une réécriture canonique nécessite le support Codex. |
| Métadonnées natives riches de Compaction            | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de jetons ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                                  |
| Intervention sur la Compaction                      | Les Hooks actuels de Compaction OpenClaw sont au niveau notification en mode Codex.                                                            | Ajouter des Hooks Codex avant/après Compaction si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Contrôle de l’arrêt ou de la réponse finale         | Codex dispose de Hooks natifs d’arrêt, mais OpenClaw n’expose pas le contrôle de la réponse finale comme contrat de plugin v1.                | Primitive opt-in future avec garde-fous de boucle et de délai.                                             |
| Parité des Hooks MCP natifs en tant que surface v1 engagée | Le relais est générique, mais OpenClaw n’a pas encore versionné et testé de bout en bout le comportement natif des Hooks MCP avant/après.     | Ajouter des tests et de la documentation sur le relais MCP OpenClaw une fois que le plancher de protocole app-server pris en charge couvrira ces charges utiles. |
| Capture octet par octet des requêtes API modèle     | OpenClaw peut capturer les requêtes et notifications de l’app-server, mais le cœur Codex construit en interne la requête finale vers l’API OpenAI. | Nécessite un événement de traçage de requête modèle Codex ou une API de débogage.                         |

## Outils, médias et Compaction

Le harnais Codex ne change que l’exécuteur embarqué de bas niveau de l’agent.

OpenClaw continue de construire la liste des outils et reçoit les résultats d’outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie de l’outil de messagerie
continuent de passer par le chemin normal de livraison OpenClaw.

Le relais de Hook natif est volontairement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils natifs et de permissions Codex qu’OpenClaw teste. Ne supposez pas
que chaque futur événement de Hook Codex constitue une surface de plugin OpenClaw tant que le
contrat runtime ne l’a pas explicitement nommé.

Les sollicitations d’approbation des outils MCP Codex sont routées via le flux d’approbation de plugin d’OpenClaw
lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées vers la
discussion d’origine, et le message de suivi suivant mis en file répond à cette requête serveur native au lieu d’être dirigé comme contexte supplémentaire. Les autres requêtes de sollicitation MCP échouent de manière sûre.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du fil est déléguée à l’app-server Codex. OpenClaw conserve un miroir du transcript pour l’historique du canal,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant et des enregistrements légers
de raisonnement ou de plan Codex lorsque l’app-server les émet. Aujourd’hui, OpenClaw n’enregistre
que les signaux natifs de début et de fin de Compaction. Il n’expose pas encore de résumé
lisible par un humain de la Compaction ni de liste auditable des entrées que Codex
a conservées après Compaction.

Parce que Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsqu’
OpenClaw écrit un résultat d’outil dans un transcript de session appartenant à OpenClaw.

La génération de médias ne nécessite pas PI. Les images, la vidéo, la musique, les PDF, le TTS et la
compréhension média continuent d’utiliser les paramètres de fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est normal pour les
nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`embeddedHarness.runtime: "codex"` (ou une ancienne référence `codex/*`), activez
`plugins.entries.codex.enabled`, et vérifiez que `plugins.allow` n’exclut pas
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `runtime: "auto"` peut toujours utiliser PI comme backend
de compatibilité lorsqu’aucun harnais Codex ne revendique l’exécution. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests. Un
runtime Codex forcé échoue désormais au lieu de revenir à PI, sauf si vous
définissez explicitement `embeddedHarness.fallback: "pi"`. Une fois l’app-server Codex
sélectionné, ses échecs apparaissent directement sans configuration de repli supplémentaire.

**L’app-server est rejeté :** mettez à niveau Codex afin que le handshake de l’app-server
signale la version `0.118.0` ou plus récente.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que l’app-server distant parle la même version de protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est normal sauf si vous avez forcé
`embeddedHarness.runtime: "codex"` pour cet agent ou sélectionné une ancienne
référence `codex/*`. Les références simples `openai/gpt-*` et celles d’autres fournisseurs restent sur leur chemin
fournisseur normal en mode `auto`. Si vous forcez `runtime: "codex"`, chaque tour embarqué
de cet agent doit être un modèle OpenAI pris en charge par Codex.

## Liens associés

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Agent runtimes](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Statut](/fr/cli/status)
- [Plugin hooks](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
