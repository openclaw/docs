---
read_when:
    - Vous voulez utiliser le harnais app-server Codex groupé
    - Vous avez besoin de références de modèle Codex et d’exemples de configuration
    - Vous voulez désactiver le repli PI pour les déploiements Codex uniquement
summary: Exécuter des tours d’agent OpenClaw embarqués via le harnais app-server Codex groupé
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-23T07:06:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5eff5a2af66033d575bc05c9f31a23ed0367bedc518dc25364e60a3012bfdff
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harnais Codex

Le Plugin groupé `codex` permet à OpenClaw d’exécuter des tours d’agent embarqués via le
app-server Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex prenne en charge la session d’agent bas niveau : découverte
des modèles, reprise native de thread, Compaction native et exécution app-server.
OpenClaw continue de gérer les canaux de chat, les fichiers de session, la sélection des modèles, les outils,
les approbations, la livraison des médias et le miroir de transcript visible.

Les tours Codex natifs respectent aussi les hooks de Plugin partagés afin que les shims de prompt,
l’automatisation tenant compte de la Compaction, le middleware d’outils et les observateurs de cycle de vie restent
alignés avec le harnais PI :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Les plugins groupés peuvent aussi enregistrer une fabrique d’extension app-server Codex pour ajouter
un middleware `tool_result` asynchrone, et les écritures de transcript Codex en miroir passent
par `before_message_write`.

Le harnais est désactivé par défaut. Il est sélectionné uniquement lorsque le Plugin `codex` est
activé et que le modèle résolu est un modèle `codex/*`, ou lorsque vous forcez explicitement
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Si vous ne configurez jamais `codex/*`, les exécutions existantes PI, OpenAI, Anthropic, Gemini, locales
et de providers personnalisés conservent leur comportement actuel.

## Choisir le bon préfixe de modèle

OpenClaw a des routes distinctes pour l’accès de forme OpenAI et Codex :

| Réf de modèle         | Chemin de runtime                             | À utiliser lorsque                                                       |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Provider OpenAI via la plomberie OpenClaw/PI  | Vous voulez un accès direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth via PI           | Vous voulez ChatGPT/Codex OAuth sans le harnais app-server Codex.        |
| `codex/gpt-5.4`       | Provider Codex groupé plus harnais Codex      | Vous voulez une exécution native app-server Codex pour le tour d’agent embarqué. |

Le harnais Codex ne revendique que les références de modèle `codex/*`. Les références existantes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, locales et de provider personnalisé conservent
leurs chemins normaux.

## Exigences

- OpenClaw avec le Plugin groupé `codex` disponible.
- app-server Codex `0.118.0` ou plus récent.
- Authentification Codex disponible pour le processus app-server.

Le Plugin bloque les handshakes app-server plus anciens ou sans version. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement de `OPENAI_API_KEY`, plus
des fichiers CLI Codex facultatifs tels que `~/.codex/auth.json` et
`~/.codex/config.toml`. Utilisez les mêmes éléments d’authentification que votre app-server Codex local.

## Configuration minimale

Utilisez `codex/gpt-5.4`, activez le Plugin groupé et forcez le harnais `codex` :

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
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

Définir `agents.defaults.model` ou un modèle d’agent sur `codex/<model>` active aussi
automatiquement le Plugin groupé `codex`. L’entrée explicite du Plugin reste
utile dans les configurations partagées parce qu’elle rend l’intention de déploiement évidente.

## Ajouter Codex sans remplacer les autres modèles

Conservez `runtime: "auto"` lorsque vous voulez Codex pour les modèles `codex/*` et PI pour
tout le reste :

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Avec cette forme :

- `/model codex` ou `/model codex/gpt-5.4` utilise le harnais app-server Codex.
- `/model gpt` ou `/model openai/gpt-5.4` utilise le chemin du provider OpenAI.
- `/model opus` utilise le chemin du provider Anthropic.
- Si un modèle non Codex est sélectionné, PI reste le harnais de compatibilité.

## Déploiements Codex uniquement

Désactivez le repli PI lorsque vous devez prouver que chaque tour d’agent embarqué utilise
le harnais Codex :

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Remplacement via variable d’environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, OpenClaw échoue tôt si le Plugin Codex est désactivé,
si le modèle demandé n’est pas une référence `codex/*`, si le app-server est trop ancien, ou si le
app-server ne peut pas démarrer.

## Codex par agent

Vous pouvez rendre un agent Codex uniquement tandis que l’agent par défaut conserve la
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
        model: "codex/gpt-5.4",
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
session OpenClaw et le harnais Codex crée ou reprend son thread sidecar app-server
selon les besoins. `/reset` efface la liaison de session OpenClaw pour ce thread.

## Découverte des modèles

Par défaut, le Plugin Codex demande au app-server les modèles disponibles. Si
la découverte échoue ou expire, il utilise le catalogue de repli groupé :

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

## Connexion app-server et politique

Par défaut, le Plugin démarre Codex localement avec :

```bash
codex app-server --listen stdio://
```

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Il s’agit de la posture de confiance d’opérateur local utilisée
pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s’arrêter sur des prompts d’approbation natifs auxquels personne n’est là pour répondre.

Pour activer les approbations révisées par guardian Codex, définissez `appServer.mode:
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

Le mode Guardian se développe en :

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

Guardian est un réviseur d’approbation Codex natif. Lorsque Codex demande à sortir de la
sandbox, à écrire hors de l’espace de travail ou à ajouter des permissions telles qu’un accès réseau,
Codex route cette demande d’approbation vers un sous-agent réviseur au lieu d’un prompt humain.
Le réviseur rassemble le contexte et applique le cadre de risque de Codex, puis
approuve ou refuse la demande spécifique. Guardian est utile lorsque vous voulez plus de
garde-fous que le mode YOLO, mais avez tout de même besoin que des agents et Heartbeats non supervisés
puissent progresser.

Le harnais live Docker inclut une sonde Guardian lorsque
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Il démarre le harnais Codex en
mode Guardian, vérifie qu’une commande shell escaladée bénigne est approuvée, et
vérifie qu’un téléversement de faux secret vers une destination externe non fiable est
refusé afin que l’agent redemande une approbation explicite.

Les champs individuels de politique l’emportent toujours sur `mode`, de sorte que les déploiements avancés peuvent
mélanger le préréglage avec des choix explicites.

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

| Champ               | Par défaut                               | Signification                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                |
| `command`           | `"codex"`                                | Exécutable pour le transport stdio.                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                        |
| `url`               | non défini                               | URL WebSocket du app-server.                                                                              |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                 |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                       |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration pour les appels du plan de contrôle du app-server.                                     |
| `mode`              | `"yolo"`                                 | Préréglage pour une exécution YOLO ou révisée par guardian.                                               |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation Codex native envoyée à start/resume/turn du thread.                               |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex natif envoyé à start/resume du thread.                                                 |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"guardian_subagent"` pour laisser Codex Guardian réviser les prompts.                           |
| `serviceTier`       | non défini                               | Niveau de service app-server Codex facultatif : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées. |

Les anciennes variables d’environnement fonctionnent toujours comme replis pour les tests locaux lorsque
le champ de configuration correspondant n’est pas défini :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférable pour les déploiements reproductibles car elle conserve le comportement du Plugin dans le
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

Validation de harnais Codex uniquement, avec repli PI désactivé :

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

Approbations Codex révisées par Guardian :

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

app-server distant avec en-têtes explicites :

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
à un thread Codex existant, le tour suivant envoie à nouveau le modèle
`codex/*`, le provider, la politique d’approbation, la sandbox et le niveau de service actuellement sélectionnés à
l’app-server. Passer de `codex/gpt-5.4` à `codex/gpt-5.2` conserve la
liaison du thread, mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le Plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur n’importe quel canal qui prend en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les threads Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un thread Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le thread attaché.
- `/codex review` démarre une revue native Codex pour le thread attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` liste les Skills de l’app-server Codex.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour les
tours normaux. Au message suivant, OpenClaw reprend ce thread Codex, transmet le
modèle OpenClaw `codex/*` actuellement sélectionné à l’app-server et conserve l’historique
étendu activé.

La surface de commande requiert un app-server Codex `0.118.0` ou plus récent. Les méthodes de
contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un
app-server futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Outils, médias et Compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent embarqué bas niveau.

OpenClaw continue de construire la liste des outils et de recevoir les résultats dynamiques d’outils depuis le
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent de passer par le chemin de livraison normal d’OpenClaw.

Les sollicitations d’approbation d’outil MCP Codex sont routées via le flux d’approbation de Plugin d’OpenClaw
lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"` ; les autres sollicitations et les demandes d’entrée libre échouent toujours
de manière fermée.

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction native du thread est
déléguée à l’app-server Codex. OpenClaw conserve un miroir du transcript pour l’historique de canal,
la recherche, `/new`, `/reset`, et les futurs changements de modèle ou de harnais. Le
miroir inclut le prompt utilisateur, le texte final de l’assistant, ainsi que des enregistrements légers de raisonnement ou de plan Codex lorsque l’app-server les émet. Aujourd’hui, OpenClaw enregistre seulement les signaux de démarrage et d’achèvement de la Compaction native. Il n’expose pas encore de
résumé lisible par humain de Compaction ni de liste auditable des entrées que Codex a conservées après la Compaction.

La génération de médias ne nécessite pas PI. L’image, la vidéo, la musique, le PDF, le TTS et la
compréhension des médias continuent d’utiliser les paramètres correspondants de provider/modèle tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas dans `/model` :** activez `plugins.entries.codex.enabled`,
définissez une référence de modèle `codex/*`, ou vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise PI au lieu de Codex :** si aucun harnais Codex ne revendique l’exécution,
OpenClaw peut utiliser PI comme backend de compatibilité. Définissez
`embeddedHarness.runtime: "codex"` pour forcer la sélection de Codex pendant les tests, ou
`embeddedHarness.fallback: "none"` pour échouer lorsqu’aucun harnais de Plugin ne correspond. Une fois
l’app-server Codex sélectionné, ses échecs remontent directement sans configuration de
repli supplémentaire.

**L’app-server est rejeté :** mettez à niveau Codex afin que le handshake app-server
signale la version `0.118.0` ou plus récente.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que l’app-server distant parle la même version du protocole app-server Codex.

**Un modèle non Codex utilise PI :** c’est attendu. Le harnais Codex ne revendique que
les références de modèle `codex/*`.

## Liens connexes

- [Agent Harness Plugins](/fr/plugins/sdk-agent-harness)
- [Model Providers](/fr/concepts/model-providers)
- [Configuration Reference](/fr/gateway/configuration-reference)
- [Testing](/fr/help/testing#live-codex-app-server-harness-smoke)
