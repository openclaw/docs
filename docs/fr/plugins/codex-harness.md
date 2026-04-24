---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex groupé
    - Vous avez besoin de références de modèle Codex et d’exemples de configuration
    - Vous souhaitez désactiver le repli Pi pour les déploiements Codex uniquement
summary: Exécutez les tours de l’agent intégré OpenClaw via le harnais app-server Codex groupé
title: harnais Codex
x-i18n:
    generated_at: "2026-04-24T08:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Le Plugin `codex` groupé permet à OpenClaw d’exécuter des tours d’agent intégrés via l’app-server Codex au lieu du harnais PI intégré.

Utilisez ceci lorsque vous souhaitez que Codex prenne en charge la session d’agent de bas niveau : découverte des modèles, reprise native de thread, Compaction native et exécution par app-server.
OpenClaw continue de gérer les canaux de chat, les fichiers de session, la sélection de modèle, les outils,
les approbations, la livraison des médias et le miroir visible de la transcription.

Les tours Codex natifs conservent les hooks de Plugin OpenClaw comme couche de compatibilité publique.
Il s’agit de hooks OpenClaw en cours de processus, et non de hooks de commande `hooks.json` de Codex :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` pour les enregistrements de transcription en miroir
- `agent_end`

Les plugins groupés peuvent également enregistrer une fabrique d’extension d’app-server Codex pour ajouter
un middleware asynchrone `tool_result`. Ce middleware s’exécute pour les outils dynamiques OpenClaw
après qu’OpenClaw a exécuté l’outil et avant que le résultat ne soit renvoyé à Codex. Il
est distinct du hook de Plugin public `tool_result_persist`, qui transforme les écritures de résultat d’outil dans la transcription gérée par OpenClaw.

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
souhaitent une exécution native par app-server. Les anciennes références de modèle `codex/*` sélectionnent toujours automatiquement
le harnais pour des raisons de compatibilité.

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI dépendent du préfixe. Utilisez `openai-codex/*` lorsque vous voulez
l’authentification OAuth Codex via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l’API OpenAI ou
lorsque vous forcez le harnais app-server Codex natif :

| Référence de modèle                                  | Chemin d’exécution                            | À utiliser lorsque                                                        |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Fournisseur OpenAI via le pipeline OpenClaw/PI | Vous voulez l’accès direct actuel à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth OpenAI Codex via OpenClaw/PI            | Vous voulez l’authentification par abonnement ChatGPT/Codex avec l’exécuteur PI par défaut. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harnais app-server Codex                      | Vous voulez une exécution native par app-server Codex pour le tour d’agent intégré. |

GPT-5.5 est actuellement disponible dans OpenClaw uniquement via abonnement/OAuth. Utilisez
`openai-codex/gpt-5.5` pour l’OAuth PI, ou `openai/gpt-5.5` avec le harnais
app-server Codex. L’accès direct par clé API pour `openai/gpt-5.5` est pris en charge
une fois qu’OpenAI active GPT-5.5 sur l’API publique.

Les anciennes références `codex/gpt-*` restent acceptées comme alias de compatibilité. Les nouvelles configurations
d’OAuth PI Codex doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de harnais app-server
natif doivent utiliser `openai/gpt-*` avec `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez
`openai-codex/gpt-*` lorsque l’analyse d’image doit passer par le chemin du fournisseur OAuth OpenAI
Codex. Utilisez `codex/gpt-*` lorsque l’analyse d’image doit s’exécuter
dans un tour d’app-server Codex borné. Le modèle app-server Codex doit
annoncer la prise en charge des entrées image ; les modèles Codex texte seul échouent avant le début
du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection vous surprend, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` de la Gateway. Il
inclut l’identifiant du harnais sélectionné, la raison de la sélection, la politique d’exécution/repli et,
en mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour intégré s’exécute,
OpenClaw enregistre l’identifiant du harnais sélectionné sur cette session et continue à l’utiliser pour
les tours ultérieurs du même identifiant de session. Modifiez la configuration `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de faire basculer une conversation existante entre PI et Codex. Cela évite de rejouer une même transcription dans
deux systèmes de session natifs incompatibles.

Les anciennes sessions créées avant l’épinglage du harnais sont traitées comme épinglées à PI dès qu’elles
ont un historique de transcription. Utilisez `/new` ou `/reset` pour faire passer cette conversation à
Codex après avoir modifié la configuration.

`/status` affiche le harnais effectif non-PI à côté de `Fast`, par exemple
`Fast · codex`. Le harnais PI par défaut reste `Runner: pi (embedded)` et
n’ajoute pas de badge de harnais séparé.

## Prérequis

- OpenClaw avec le Plugin `codex` groupé disponible.
- App-server Codex `0.118.0` ou version ultérieure.
- Authentification Codex disponible pour le processus app-server.

Le Plugin bloque les handshakes d’app-server plus anciens ou non versionnés. Cela permet de maintenir
OpenClaw sur la surface de protocole avec laquelle il a été testé.

Pour les tests smoke en direct et dans Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus des fichiers optionnels de CLI Codex tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’authentification que votre app-server Codex locale.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le Plugin groupé et forcez le harnais `codex` :

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
        fallback: "none",
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
`codex/<model>` activent toujours automatiquement le Plugin `codex` groupé. Les nouvelles configurations doivent
préférer `openai/<model>` avec l’entrée `embeddedHarness` explicite ci-dessus.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` lorsque vous voulez que les anciennes références `codex/*` sélectionnent Codex et
PI pour tout le reste. Pour les nouvelles configurations, préférez `runtime: "codex"` explicite sur
les agents qui doivent utiliser le harnais.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Avec cette structure :

- `/model gpt` ou `/model openai/gpt-5.5` utilise le harnais app-server Codex pour cette configuration.
- `/model opus` utilise le chemin du fournisseur Anthropic.
- Si un modèle non-Codex est sélectionné, PI reste le harnais de compatibilité.

## Déploiements Codex uniquement

Désactivez le repli PI lorsque vous devez prouver que chaque tour d’agent intégré utilise
le harnais Codex :

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

Surcharge d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, OpenClaw échoue rapidement si le Plugin Codex est désactivé,
si l’app-server est trop ancien ou si l’app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent Codex uniquement tandis que l’agent par défaut conserve
la sélection automatique normale :

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
session OpenClaw et le harnais Codex crée ou reprend son thread app-server sidecar
selon les besoins. `/reset` efface l’association de session OpenClaw pour ce thread
et permet au tour suivant de résoudre à nouveau le harnais à partir de la configuration actuelle.

## Découverte des modèles

Par défaut, le Plugin Codex interroge l’app-server pour obtenir les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de repli groupé pour :

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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et s’en tienne
au catalogue de repli :

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

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw démarre les sessions de harnais Codex locales en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Il s’agit de la posture d’opérateur local de confiance utilisée
pour les Heartbeat autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des invites d’approbation natives auxquelles personne n’est là pour répondre.

Pour activer les approbations Codex relues par Guardian, définissez `appServer.mode:
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

Guardian est un réviseur d’approbation natif Codex. Lorsque Codex demande à sortir de la sandbox, à écrire hors de l’espace de travail ou à ajouter des autorisations comme l’accès réseau, Codex achemine cette demande d’approbation vers un sous-agent réviseur au lieu d’une invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse la demande spécifique. Utilisez Guardian lorsque vous voulez davantage de garde-fous que le mode YOLO tout en ayant besoin que des agents sans supervision puissent continuer à progresser.

Le préréglage `guardian` s’étend à `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` et `sandbox: "workspace-write"`. Les champs de politique individuels remplacent toujours `mode`, afin que les déploiements avancés puissent combiner le préréglage avec des choix explicites.

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

| Champ               | Valeur par défaut                        | Signification                                                                                             |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                |
| `command`           | `"codex"`                                | Exécutable pour le transport stdio.                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                        |
| `url`               | non défini                               | URL WebSocket de l’app-server.                                                                            |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                 |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                       |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels au plan de contrôle de l’app-server.                                  |
| `mode`              | `"yolo"`                                 | Préréglage pour l’exécution YOLO ou relue par Guardian.                                                   |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation Codex native envoyée au démarrage, à la reprise et au tour du thread.            |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex natif envoyé au démarrage et à la reprise du thread.                                   |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"guardian_subagent"` pour laisser Codex Guardian relire les invites.                            |
| `serviceTier`       | non défini                               | Niveau de service optionnel de l’app-server Codex : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées. |

Les anciennes variables d’environnement fonctionnent toujours comme solutions de repli pour les tests locaux lorsque
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
même fichier relu que le reste de la configuration du harnais Codex.

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

Validation du harnais Codex uniquement, avec repli PI désactivé :

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Approvals Codex relues par Guardian :

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
            approvalsReviewer: "guardian_subagent",
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
à un thread Codex existant, le tour suivant renvoie le modèle
OpenAI actuellement sélectionné, le fournisseur, la politique d’approbation, la sandbox et le niveau de service à
l’app-server. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve
l’association au thread mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur n’importe quel canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité en direct à l’app-server, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles de l’app-server Codex en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le thread attaché.
- `/codex review` démarre la revue native Codex pour le thread attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les Skills de l’app-server Codex.

`/codex resume` écrit le même fichier d’association sidecar que celui utilisé par le harnais pour
les tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le
modèle OpenClaw actuellement sélectionné à l’app-server et conserve l’historique étendu
activé.

La surface de commande nécessite l’app-server Codex `0.118.0` ou version ultérieure. Les méthodes de
contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire             | But                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/plugin entre les harnais PI et Codex.         |
| Middleware d’extension d’app-server Codex | Plugins groupés OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex de bas niveau et politique d’outil native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers `hooks.json` de projet ou globaux de Codex pour acheminer
le comportement des plugins OpenClaw. Les hooks natifs Codex sont utiles pour les opérations
gérées par Codex, telles que la politique shell, la revue native des résultats d’outil, la gestion des arrêts et
le cycle de vie natif de Compaction/modèle, mais ils ne constituent pas l’API de Plugin OpenClaw.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé
l’appel ; OpenClaw déclenche donc le comportement de Plugin et de middleware qu’il possède dans
l’adaptateur de harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil.
OpenClaw peut mettre en miroir certains événements, mais il ne peut pas réécrire le thread Codex natif
à moins que Codex n’expose cette opération via l’app-server ou des callbacks de hook natifs.

Lorsque de nouvelles versions de l’app-server Codex exposeront des événements de hook natifs pour le cycle de vie de Compaction et du modèle,
OpenClaw devra restreindre la prise en charge de ce protocole par version et mapper les
événements vers le contrat de hook OpenClaw existant lorsque la sémantique est fidèle.
Jusque-là, les événements `before_compaction`, `after_compaction`, `llm_input` et
`llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, et non des captures octet pour octet
de la requête interne de Codex ou de la charge utile de Compaction.

Les notifications d’app-server natives Codex `hook/started` et `hook/completed` sont
projetées en tant qu’événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage.
Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Outils, médias et Compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

OpenClaw continue de construire la liste d’outils et de recevoir les résultats des outils dynamiques depuis le
harnais. Le texte, les images, la vidéo, la musique, la synthèse vocale, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison OpenClaw normal.

Les sollicitations d’approbation d’outil MCP Codex sont acheminées via le flux d’approbation de Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées vers le
chat d’origine, et le message de suivi suivant dans la file répond à cette requête native du
serveur au lieu d’être orienté comme contexte supplémentaire. Les autres requêtes de sollicitation MCP échouent toujours en mode fermé.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du thread est déléguée à l’app-server Codex. OpenClaw conserve un miroir de transcription pour l’historique du canal,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et des enregistrements légers de raisonnement ou de plan Codex lorsque l’app-server les émet. Aujourd’hui, OpenClaw n’enregistre que les signaux de début et de fin de Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste vérifiable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le thread natif canonique, `tool_result_persist` ne
réécrit pas actuellement les enregistrements de résultat d’outil natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session gérée par OpenClaw.

La génération de médias ne nécessite pas PI. La génération d’images, de vidéo, de musique, de PDF, la synthèse vocale et la
compréhension des médias continuent d’utiliser les paramètres de fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
sélectionnez un modèle `openai/gpt-*` avec `embeddedHarness.runtime: "codex"` (ou une
ancienne référence `codex/*`) et vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise PI au lieu de Codex :** si aucun harnais Codex ne revendique l’exécution,
OpenClaw peut utiliser PI comme backend de compatibilité. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests, ou
`embeddedHarness.fallback: "none"` pour échouer lorsqu’aucun harnais de Plugin ne correspond. Une fois
l’app-server Codex sélectionné, ses échecs remontent directement sans configuration de
repli supplémentaire.

**L’app-server est rejeté :** mettez à niveau Codex afin que le handshake de l’app-server
signale la version `0.118.0` ou ultérieure.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que l’app-server distant parle la même version du protocole app-server Codex.

**Un modèle non-Codex utilise PI :** c’est attendu sauf si vous avez forcé
`embeddedHarness.runtime: "codex"` (ou sélectionné une ancienne référence `codex/*`). Les références simples
`openai/gpt-*` et celles des autres fournisseurs restent sur leur chemin fournisseur normal.

## Liens connexes

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
