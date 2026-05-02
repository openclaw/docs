---
read_when:
    - Installation ou configuration du harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configuration des agents ACP : configuration du banc d’essai acpx, configuration du Plugin, autorisations'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-05-02T07:19:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4426219227e77d5dc57039c0c8f7324590388db141689239deaa2441609f4afd
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Pour la vue d’ensemble, le runbook opérateur et les concepts, consultez [agents ACP](/fr/tools/acp-agents).

Les sections ci-dessous couvrent la configuration du harnais acpx, la configuration du plugin pour les ponts MCP et la configuration des autorisations.

Utilisez cette page uniquement lorsque vous configurez la route ACP/acpx. Pour la configuration d’exécution du serveur d’application Codex natif, utilisez [harnais Codex](/fr/plugins/codex-harness). Pour les clés d’API OpenAI ou la configuration du fournisseur de modèles OAuth Codex, utilisez [OpenAI](/fr/providers/openai).

Codex propose deux routes OpenClaw :

| Route                         | Configuration/commande                                  | Page de configuration                  |
| ----------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Serveur d’application Codex natif | `/codex ...`, `agentRuntime.id: "codex"`               | [harnais Codex](/fr/plugins/codex-harness) |
| Adaptateur ACP Codex explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                             |

Préférez la route native sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge du harnais acpx (actuelle)

Alias de harnais intégrés acpx actuels :

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

Lorsque OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP sous la forme `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur par défaut intégrée.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non le chemin `agentId` OpenClaw normal).

Le contrôle du modèle dépend des capacités de l’adaptateur. Les références de modèle ACP Codex sont normalisées par OpenClaw avant le démarrage. Les autres harnais ont besoin des `models` ACP ainsi que de la prise en charge de `session/set_model` ; si un harnais n’expose ni cette capacité ACP ni son propre indicateur de modèle au démarrage, OpenClaw/acpx ne peut pas imposer une sélection de modèle.

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

La configuration de liaison des fils de discussion est propre à l’adaptateur de canal. Exemple pour Discord :

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
        spawnSessions: true,
      },
    },
  },
}
```

Si le spawn ACP lié à un fil de discussion ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnSessions=true`

Les liaisons de conversation actuelle ne nécessitent pas la création d’un fil enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Configuration du plugin pour le backend acpx

Les nouvelles installations livrent le plugin d’exécution `acpx` inclus activé par défaut, donc ACP fonctionne généralement sans étape d’installation manuelle de plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou souhaitez basculer vers un checkout de développement local, utilisez le chemin de plugin explicite :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation d’un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le plugin `acpx` inclus enregistre le backend ACP intégré sans lancer d’agent ACP au démarrage du Gateway. Exécutez `/acp doctor` pour une sonde active explicite. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` uniquement lorsque vous avez besoin que le Gateway sonde l’agent configuré au démarrage.

Remplacez la commande ou la version dans la configuration du plugin :

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

- `command` accepte un chemin absolu, un chemin relatif (résolu depuis l’espace de travail OpenClaw) ou un nom de commande.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Les chemins `command` personnalisés désactivent l’installation automatique locale au plugin.

Consultez [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances d’exécution acpx (binaires propres à la plateforme) sont installées automatiquement via un hook postinstall. Si l’installation automatique échoue, le gateway démarre tout de même normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de plugin

Par défaut, les sessions ACPX n’exposent **pas** les outils enregistrés par les plugins OpenClaw au harnais ACP.

Si vous voulez que des agents ACP comme Codex ou Claude Code appellent des outils de plugin OpenClaw installés, comme le rappel/stockage de mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans le bootstrap de session ACPX.
- Expose les outils de plugin déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde la fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela étend la surface d’outils du harnais ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de plugin déjà actifs dans le gateway.
- Considérez cela comme la même limite de confiance que le fait d’autoriser ces plugins à s’exécuter dans OpenClaw lui-même.
- Passez en revue les plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré plugin-tools est une commodité supplémentaire à activer explicitement, pas un remplacement de la configuration générique de serveur MCP.

### Pont MCP des outils OpenClaw

Par défaut, les sessions ACPX n’exposent pas non plus les outils OpenClaw intégrés via MCP. Activez le pont core-tools séparé lorsqu’un agent ACP a besoin d’outils intégrés sélectionnés tels que `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans le bootstrap de session ACPX.
- Expose des outils OpenClaw intégrés sélectionnés. Le serveur initial expose `cron`.
- Garde l’exposition des outils principaux explicite et désactivée par défaut.

### Configuration du délai d’expiration d’exécution

Le plugin `acpx` inclus définit par défaut un délai d’expiration de 120 secondes pour les tours d’exécution intégrés. Cela donne aux harnais plus lents comme Gemini CLI assez de temps pour terminer le démarrage et l’initialisation ACP. Remplacez-le si votre hôte nécessite une limite d’exécution différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez le gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde d’état

Lorsque `/acp doctor` ou la sonde de démarrage optionnelle vérifie le backend, le plugin `acpx` inclus sonde un agent de harnais. Si `acp.allowedAgents` est défini, il prend par défaut le premier agent autorisé ; sinon il prend par défaut `codex`. Si votre déploiement a besoin d’un agent ACP différent pour les contrôles d’état, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le gateway après avoir modifié cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent de façon non interactive : il n’y a pas de TTY pour approuver ou refuser les invites d’autorisation d’écriture de fichier et d’exécution shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la gestion des autorisations :

Ces autorisations de harnais ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement des fournisseurs de backend CLI, comme `--permission-mode bypassPermissions` de Claude CLI. ACPX `approve-all` est l’interrupteur d’urgence au niveau du harnais pour les sessions ACP.

### `permissionMode`

Contrôle les opérations que l’agent de harnais peut effectuer sans invite.

| Valeur          | Comportement                                             |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et l’exécution nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites d’autorisation.                |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite d’autorisation devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                     |
| ------ | ---------------------------------------------------------------- |
| `fail` | Interrompt la session avec `AcpRuntimeError`. **(par défaut)**   |
| `deny` | Refuse silencieusement l’autorisation et continue (dégradation progressive). |

### Configuration

Définissez via la configuration du plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le gateway après avoir modifié ces valeurs.

<Warning>
OpenClaw utilise par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent progressivement au lieu de planter.
</Warning>

## Connexe

- [agents ACP](/fr/tools/acp-agents) — vue d’ensemble, runbook opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
