---
read_when:
    - Installation ou configuration du harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configuration des agents ACP : configuration du harnais acpx, configuration du Plugin, autorisations'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-04-25T13:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Pour la vue d’ensemble, la procédure opérateur et les concepts, consultez [Agents ACP](/fr/tools/acp-agents).

Les sections ci-dessous couvrent la configuration du harnais acpx, la configuration du Plugin pour les ponts MCP, et la configuration des autorisations.

## Prise en charge du harnais acpx (actuelle)

Alias de harnais intégrés actuels dans acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor : `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Lorsque OpenClaw utilise le backend acpx, privilégiez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP sous `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (pas du chemin normal `agentId` d’OpenClaw).

## Configuration requise

Base ACP principale :

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuration de liaison des fils dépend de l’adaptateur de canal. Exemple pour Discord :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la création ACP liée à un fil ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation en cours ne nécessitent pas la création d’un fil enfant. Elles exigent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations livrent le Plugin d’exécution `acpx` intégré activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation de Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou souhaitez
basculer vers une extraction locale de développement, utilisez le chemin de Plugin explicite :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation depuis un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin `acpx` intégré utilise son binaire local épinglé au Plugin (`node_modules/.bin/acpx` dans le package du Plugin). Au démarrage, le backend est enregistré comme non prêt et une tâche d’arrière-plan vérifie `acpx --version` ; si le binaire est manquant ou ne correspond pas, il exécute `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie. La gateway reste non bloquante pendant toute l’opération.

Remplacez la commande ou la version dans la configuration du Plugin :

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` accepte un chemin absolu, un chemin relatif (résolu depuis l’espace de travail OpenClaw), ou un nom de commande.
- `expectedVersion: "any"` désactive la vérification stricte de version.
- Les chemins `command` personnalisés désactivent l’installation automatique locale au Plugin.

Consultez [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances d’exécution acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP plugin-tools

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les Plugins OpenClaw au
harnais ACP.

Si vous voulez que des agents ACP comme Codex ou Claude Code puissent appeler des
outils de Plugin OpenClaw installés, tels que le rappel/stockage de mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage des sessions ACPX.
- Expose les outils de Plugin déjà enregistrés par les Plugins OpenClaw installés et activés.
- Garde cette fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela élargit la surface d’outils du harnais ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de Plugin déjà actifs dans la gateway.
- Considérez cela comme la même limite de confiance que celle qui autorise ces Plugins à s’exécuter dans
  OpenClaw lui-même.
- Vérifiez les Plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré plugin-tools est une
fonction de confort supplémentaire sur activation explicite, pas un remplacement de la configuration générique des serveurs MCP.

### Pont MCP OpenClaw-tools

Par défaut, les sessions ACPX **n’exposent pas non plus** les outils OpenClaw intégrés via
MCP. Activez le pont séparé des outils principaux lorsqu’un agent ACP a besoin de certains
outils intégrés comme `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage des sessions ACPX.
- Expose certains outils OpenClaw intégrés. Le serveur initial expose `cron`.
- Garde l’exposition des outils principaux explicite et désactivée par défaut.

### Configuration du délai d’expiration d’exécution

Le Plugin `acpx` intégré définit par défaut un délai d’expiration de 120 secondes
pour les tours d’exécution embarqués. Cela laisse à des harnais plus lents comme Gemini CLI suffisamment de temps pour terminer
le démarrage et l’initialisation ACP. Remplacez cette valeur si votre hôte a besoin d’une autre limite d’exécution :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez la gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde de santé

Le Plugin `acpx` intégré sonde un agent de harnais lorsqu’il détermine si le
backend d’exécution embarqué est prêt. Si `acp.allowedAgents` est défini, il prend par défaut
le premier agent autorisé ; sinon, il prend `codex` par défaut. Si votre déploiement
nécessite un autre agent ACP pour les vérifications d’état, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez la gateway après avoir modifié cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent en mode non interactif — il n’y a pas de TTY pour approuver ou refuser les invites d’autorisation d’écriture de fichiers et d’exécution shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la façon dont les autorisations sont gérées :

Ces autorisations du harnais ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement spécifiques aux fournisseurs de backends CLI comme Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur de secours au niveau du harnais pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent du harnais peut effectuer sans invite.

| Valeur          | Comportement                                               |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et exécutions nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites d’autorisation.                  |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite d’autorisation devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                      |
| ------ | ----------------------------------------------------------------- |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)**     |
| `deny` | Refuse silencieusement l’autorisation et continue (dégradation gracieuse). |

### Configuration

Définissez cela via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent proprement au lieu de planter.

## Liens connexes

- [Agents ACP](/fr/tools/acp-agents) — vue d’ensemble, procédure opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
