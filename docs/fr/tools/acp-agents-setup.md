---
read_when:
    - Installation ou configuration du harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configurer des agents ACP : configuration du harness acpx, configuration du plugin, permissions'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-05-02T21:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Pour la vue d'ensemble, le runbook opérateur et les concepts, consultez [agents ACP](/fr/tools/acp-agents).

Les sections ci-dessous couvrent la configuration du harness acpx, la configuration des plugins pour les ponts MCP, et la configuration des permissions.

Utilisez cette page uniquement lorsque vous configurez la route ACP/acpx. Pour la configuration d'exécution native du serveur d'application Codex, utilisez [harness Codex](/fr/plugins/codex-harness). Pour les clés API OpenAI ou la configuration du fournisseur de modèles Codex OAuth, utilisez [OpenAI](/fr/providers/openai).

Codex dispose de deux routes OpenClaw :

| Route                      | Config/commande                                       | Page de configuration                   |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Serveur d'application Codex natif | `/codex ...`, `agentRuntime.id: "codex"`               | [harness Codex](/fr/plugins/codex-harness) |
| Adaptateur Codex ACP explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                              |

Préférez la route native, sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge du harness acpx (actuelle)

Alias de harness intégrés acpx actuels :

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

Lorsque OpenClaw utilise le backend acpx, privilégiez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d'agents personnalisés.
Si votre installation locale de Cursor expose encore ACP sous la forme `agent acp`, remplacez la commande de l'agent `cursor` dans votre configuration acpx au lieu de modifier la valeur par défaut intégrée.

L'utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (pas le chemin `agentId` OpenClaw normal).

Le contrôle du modèle dépend des capacités de l'adaptateur. Les références de modèles Codex ACP sont normalisées par OpenClaw avant le démarrage. Les autres harnesses nécessitent ACP `models` ainsi que la prise en charge de `session/set_model` ; si un harness n'expose ni cette capacité ACP ni son propre indicateur de modèle au démarrage, OpenClaw/acpx ne peut pas forcer une sélection de modèle.

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

La configuration de liaison des fils est spécifique à l'adaptateur de canal. Exemple pour Discord :

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

Si le lancement ACP lié à un fil ne fonctionne pas, vérifiez d'abord l'indicateur de fonctionnalité de l'adaptateur :

- Discord : `channels.discord.threadBindings.spawnSessions=true`

Les liaisons de conversation actuelle ne nécessitent pas la création d'un fil enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez la [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les installations packagées utilisent le Plugin d'exécution officiel `@openclaw/acpx` pour ACP.
Installez-le et activez-le avant d'utiliser des sessions de harness ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les checkouts source peuvent aussi utiliser le Plugin d'espace de travail local après `pnpm install`.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, si vous l'avez refusé via `plugins.allow` / `plugins.deny`, ou si vous souhaitez revenir au Plugin packagé, utilisez le chemin de package explicite :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation de l'espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite la santé du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin `acpx` enregistre le backend ACP intégré sans lancer d'agent ACP au démarrage du Gateway. Exécutez `/acp doctor` pour une sonde en direct explicite. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` uniquement lorsque vous avez besoin que le Gateway sonde l'agent configuré au démarrage.

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

- `command` accepte un chemin absolu, un chemin relatif (résolu depuis l'espace de travail OpenClaw) ou un nom de commande.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Les chemins `command` personnalisés désactivent l'installation automatique locale au Plugin.

Consultez [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances d'exécution acpx (binaires spécifiques à la plateforme) sont installées automatiquement via un hook postinstall. Si l'installation automatique échoue, le Gateway démarre quand même normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de Plugin

Par défaut, les sessions ACPX n'exposent **pas** les outils enregistrés par les plugins OpenClaw au harness ACP.

Si vous voulez que des agents ACP tels que Codex ou Claude Code appellent des outils de plugins OpenClaw installés, comme le rappel/stockage de mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l'initialisation des sessions ACPX.
- Expose les outils de plugins déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde la fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela étend la surface d'outils du harness ACP.
- Les agents ACP obtiennent uniquement l'accès aux outils de plugins déjà actifs dans le Gateway.
- Traitez cela comme la même limite de confiance que le fait de laisser ces plugins s'exécuter dans OpenClaw lui-même.
- Examinez les plugins installés avant de l'activer.

Les `mcpServers` personnalisés continuent de fonctionner comme auparavant. Le pont intégré d'outils de plugins est une commodité supplémentaire à activation explicite, pas un remplacement de la configuration générique des serveurs MCP.

### Pont MCP des outils OpenClaw

Par défaut, les sessions ACPX n'exposent pas non plus les outils OpenClaw intégrés via MCP. Activez le pont distinct des outils principaux lorsqu'un agent ACP a besoin d'outils intégrés sélectionnés comme `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l'initialisation des sessions ACPX.
- Expose des outils OpenClaw intégrés sélectionnés. Le serveur initial expose `cron`.
- Garde l'exposition des outils principaux explicite et désactivée par défaut.

### Configuration du délai d'expiration d'exécution

Le Plugin `acpx` définit par défaut un délai d'expiration de 120 secondes pour les tours d'exécution intégrés. Cela donne aux harnesses plus lents, comme Gemini CLI, suffisamment de temps pour terminer le démarrage et l'initialisation ACP. Remplacez-le si votre hôte nécessite une limite d'exécution différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez le Gateway après avoir modifié cette valeur.

### Configuration de l'agent de sonde de santé

Lorsque `/acp doctor` ou la sonde de démarrage à activation explicite vérifie le backend, le Plugin `acpx` fourni sonde un agent de harness. Si `acp.allowedAgents` est défini, il utilise par défaut le premier agent autorisé ; sinon, il utilise `codex` par défaut. Si votre déploiement nécessite un autre agent ACP pour les vérifications de santé, définissez explicitement l'agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le Gateway après avoir modifié cette valeur.

## Configuration des permissions

Les sessions ACP s'exécutent de manière non interactive : il n'y a pas de TTY pour approuver ou refuser les invites d'autorisation d'écriture de fichiers et d'exécution shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la gestion des permissions :

Ces permissions de harness ACPX sont distinctes des approbations d'exécution OpenClaw et distinctes des indicateurs de contournement des fournisseurs de backend CLI, comme Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l'interrupteur d'urgence au niveau du harness pour les sessions ACP.

### `permissionMode`

Contrôle les opérations que l'agent de harness peut effectuer sans invite.

| Valeur          | Comportement                                             |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement uniquement les lectures ; les écritures et l'exécution nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites de permission.                 |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu'une invite de permission devrait être affichée, mais qu'aucun TTY interactif n'est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                   |
| ------ | -------------------------------------------------------------- |
| `fail` | Interrompt la session avec `AcpRuntimeError`. **(par défaut)** |
| `deny` | Refuse silencieusement la permission et continue (dégradation gracieuse). |

### Configuration

Définissez via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le Gateway après avoir modifié ces valeurs.

<Warning>
OpenClaw utilise par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite de permission peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent gracieusement au lieu de planter.
</Warning>

## Connexe

- [agents ACP](/fr/tools/acp-agents) — vue d'ensemble, runbook opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
