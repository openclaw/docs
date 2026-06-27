---
read_when:
    - Installation ou configuration du harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configuration des agents ACP : configuration du harnais acpx, configuration du plugin, permissions'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-06-27T18:14:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Pour la vue d’ensemble, le runbook opérateur et les concepts, consultez [agents ACP](/fr/tools/acp-agents).

Les sections ci-dessous couvrent la configuration du harnais acpx, la configuration des plugins pour les ponts MCP et la configuration des autorisations.

Utilisez cette page uniquement lorsque vous configurez la route ACP/acpx. Pour la configuration native de l’exécution app-server Codex, utilisez [harnais Codex](/fr/plugins/codex-harness). Pour les clés d’API OpenAI ou la configuration du fournisseur de modèles Codex OAuth, utilisez [OpenAI](/fr/providers/openai).

Codex dispose de deux routes OpenClaw :

| Route                      | Configuration/commande                                  | Page de configuration                   |
| -------------------------- | ------------------------------------------------------- | --------------------------------------- |
| app-server Codex natif     | `/codex ...`, refs d’agent `openai/gpt-*`               | [harnais Codex](/fr/plugins/codex-harness) |
| Adaptateur Codex ACP explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                              |

Préférez la route native, sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge du harnais acpx (actuelle)

Alias actuels du harnais intégré acpx :

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
- `qwen`

Quand OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agents personnalisés.
Si votre installation locale de Cursor expose encore ACP comme `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur par défaut intégrée.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (pas le chemin `agentId` OpenClaw normal).

Le contrôle du modèle dépend des capacités de l’adaptateur. Les refs de modèle Codex ACP sont normalisées par OpenClaw avant le démarrage. Les autres harnais ont besoin des `models` ACP ainsi que de la prise en charge de `session/set_model` ; si un harnais n’expose ni cette capacité ACP ni son propre indicateur de modèle au démarrage, OpenClaw/acpx ne peut pas forcer une sélection de modèle.

## Configuration requise

Socle ACP principal :

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
      "openclaw",
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

La configuration de liaison de fils dépend de l’adaptateur de canal. Exemple pour Discord :

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

Si le spawn ACP lié à un fil ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnSessions=true`

Les liaisons de conversation courante ne nécessitent pas la création de fils enfants. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du plugin pour le backend acpx

Les installations packagées utilisent le plugin d’exécution officiel `@openclaw/acpx` pour ACP.
Installez-le et activez-le avant d’utiliser des sessions de harnais ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les checkouts source peuvent aussi utiliser le plugin de l’espace de travail local après `pnpm install`.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou souhaitez revenir au plugin packagé, utilisez le chemin de package explicite :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation de l’espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Puis vérifiez l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le plugin `acpx` enregistre le backend ACP embarqué pendant le démarrage du Gateway et attend la sonde de démarrage de l’exécution embarquée avant le signal `ready` du gateway. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ou `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` uniquement pour les scripts ou environnements qui gardent intentionnellement la sonde de démarrage désactivée. Exécutez `/acp doctor` pour une sonde explicite à la demande.

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
- Les chemins `command` personnalisés désactivent l’auto-installation locale au plugin.

Remplacez la commande d’un agent ACP individuel avec des arguments structurés lorsqu’un chemin ou une valeur d’indicateur doit rester un seul jeton argv :

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` est l’exécutable ou la chaîne de commande existante pour cet agent ACP.
- `agents.<id>.args` est facultatif. Chaque élément de tableau est cité pour le shell avant qu’OpenClaw ne le transmette au registre actuel des chaînes de commande acpx.

Consultez [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances d’exécution acpx (binaires propres à la plateforme) sont installées automatiquement via un hook postinstall. Si l’installation automatique échoue, le gateway démarre tout de même normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de plugin

Par défaut, les sessions ACPX n’exposent **pas** les outils enregistrés par les plugins OpenClaw au harnais ACP.

Si vous voulez que des agents ACP tels que Codex ou Claude Code appellent des outils de plugins OpenClaw installés, comme le rappel/stockage de mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage de session ACPX.
- Expose les outils de plugins déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde la fonctionnalité explicite et désactivée par défaut.

Notes sur la sécurité et la confiance :

- Cela étend la surface d’outils du harnais ACP.
- Les agents ACP n’obtiennent accès qu’aux outils de plugins déjà actifs dans le gateway.
- Considérez cela comme la même limite de confiance que laisser ces plugins s’exécuter dans OpenClaw lui-même.
- Passez en revue les plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré des outils de plugin est une commodité supplémentaire à activer explicitement, pas un remplacement de la configuration générique de serveur MCP.

### Pont MCP des outils OpenClaw

Par défaut, les sessions ACPX n’exposent pas non plus les outils OpenClaw intégrés via MCP. Activez le pont séparé des outils du cœur lorsqu’un agent ACP a besoin de certains outils intégrés, comme `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage de session ACPX.
- Expose certains outils OpenClaw intégrés. Le serveur initial expose `cron`.
- Garde l’exposition des outils du cœur explicite et désactivée par défaut.

### Configuration du délai d’expiration des opérations d’exécution

Le plugin `acpx` donne par défaut 120 secondes aux opérations de démarrage et de contrôle de l’exécution embarquée. Cela donne aux harnais plus lents, comme Gemini CLI, assez de temps pour terminer le démarrage et l’initialisation ACP. Remplacez cette valeur si votre hôte nécessite une limite d’opération différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Les tours d’exécution utilisent les délais d’expiration agent/run d’OpenClaw, y compris `/acp timeout`.
`sessions_spawn` n’accepte pas de remplacement de délai d’expiration par appel. Redémarrez le gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde d’état

Lorsque `/acp doctor` ou la sonde de démarrage vérifie le backend, le plugin `acpx` inclus sonde un agent de harnais. Si `acp.allowedAgents` est défini, il utilise par défaut le premier agent autorisé ; sinon, il utilise par défaut `codex`. Si votre déploiement nécessite un agent ACP différent pour les contrôles d’état, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le gateway après avoir modifié cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent de manière non interactive : aucun TTY n’est disponible pour approuver ou refuser les invites d’autorisation d’écriture de fichiers et d’exécution shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la manière dont les autorisations sont gérées :

Ces autorisations de harnais ACPX sont distinctes des approbations exec OpenClaw et des indicateurs de contournement propres aux fournisseurs de backend CLI, comme Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur de secours de niveau harnais pour les sessions ACP.

Pour une comparaison plus large entre OpenClaw `tools.exec.mode`, les approbations Codex Guardian et les autorisations de harnais ACPX, consultez [Modes d’autorisation](/fr/tools/permission-modes).

### `permissionMode`

Contrôle les opérations que l’agent de harnais peut effectuer sans invite.

| Valeur          | Comportement                                             |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Approuver automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuver automatiquement les lectures uniquement ; les écritures et exec nécessitent des invites. |
| `deny-all`      | Refuser toutes les invites d’autorisation.               |

### `nonInteractivePermissions`

Contrôle ce qui se produit lorsqu’une invite d’autorisation devrait être affichée, mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                |
| ------ | ----------------------------------------------------------- |
| `fail` | Abandonner la session avec `AcpRuntimeError`. **(par défaut)** |
| `deny` | Refuser silencieusement l’autorisation et continuer (dégradation gracieuse). |

### Configuration

Définissez via la configuration du plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le gateway après avoir modifié ces valeurs.

<Warning>
OpenClaw utilise par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent gracieusement au lieu de planter.
</Warning>

## Connexe

- [agents ACP](/fr/tools/acp-agents) — vue d’ensemble, runbook opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
