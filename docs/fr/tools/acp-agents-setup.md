---
read_when:
    - Installer ou configurer le harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activer le pont MCP plugin-tools ou OpenClaw-tools
    - Configurer les modes de permission ACP
summary: 'Configurer les agents ACP : configuration du harnais acpx, configuration du Plugin, permissions'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-04-26T11:38:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Pour la vue d’ensemble, le guide opérateur, et les concepts, voir [Agents ACP](/fr/tools/acp-agents).

Les sections ci-dessous couvrent la configuration du harnais acpx, la configuration du Plugin pour les ponts MCP, et la configuration des permissions.

Utilisez cette page uniquement lorsque vous configurez la route ACP/acpx. Pour la
configuration du runtime app-server Codex natif, utilisez [Harnais Codex](/fr/plugins/codex-harness). Pour
les clés API OpenAI ou la configuration du fournisseur de modèle Codex OAuth, utilisez
[OpenAI](/fr/providers/openai).

Codex a deux routes OpenClaw :

| Route                      | Config/commande                                        | Page de configuration                    |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| App-server Codex natif     | `/codex ...`, `agentRuntime.id: "codex"`               | [Harnais Codex](/fr/plugins/codex-harness)  |
| Adaptateur ACP Codex explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                               |

Préférez la route native sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge actuelle du harnais acpx

Alias intégrés actuels du harnais acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI : `cursor-agent acp`)
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

Lorsque OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP comme `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non du chemin normal `agentId` d’OpenClaw).

Le contrôle du modèle dépend des capacités de l’adaptateur. Les références de modèle ACP Codex sont
normalisées par OpenClaw avant le démarrage. Les autres harnais ont besoin de ACP `models` plus
la prise en charge de `session/set_model` ; si un harnais n’expose ni cette capacité ACP
ni son propre drapeau de modèle au démarrage, OpenClaw/acpx ne peut pas forcer une sélection de modèle.

## Configuration requise

Base ACP du noyau :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour mettre en pause la distribution ACP tout en conservant les contrôles /acp.
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

La configuration de liaison de thread est spécifique à l’adaptateur de canal. Exemple pour Discord :

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

Si le spawn ACP lié à un thread ne fonctionne pas, vérifiez d’abord le drapeau de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation actuelle n’exigent pas la création de thread enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations livrent le plugin runtime intégré `acpx` activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation de Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou voulez
basculer vers un checkout local de développement, utilisez le chemin explicite du Plugin :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation dans l’espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Puis vérifiez l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le plugin intégré `acpx` enregistre le backend ACP intégré sans
lancer d’agent ACP pendant le démarrage de la Gateway. Exécutez `/acp doctor` pour une sonde live explicite. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` uniquement lorsque vous avez besoin que la
Gateway sonde l’agent configuré au démarrage.

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

- `command` accepte un chemin absolu, un chemin relatif (résolu à partir de l’espace de travail OpenClaw), ou un nom de commande.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Les chemins `command` personnalisés désactivent l’installation automatique locale au Plugin.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances runtime acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la Gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP plugin-tools

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les Plugins OpenClaw au
harnais ACP.

Si vous voulez que des agents ACP tels que Codex ou Claude Code puissent appeler des
outils de Plugin OpenClaw installés tels que memory recall/store, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage
  de session ACPX.
- Expose les outils de Plugin déjà enregistrés par les Plugins OpenClaw installés et activés.
- Conserve cette fonctionnalité explicite et désactivée par défaut.

Notes sur la sécurité et la confiance :

- Cela étend la surface d’outils du harnais ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de Plugin déjà actifs dans la Gateway.
- Traitez cela comme la même frontière de confiance que lorsque vous laissez ces Plugins s’exécuter dans
  OpenClaw lui-même.
- Vérifiez les Plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent à fonctionner comme avant. Le pont intégré plugin-tools est une
commodité supplémentaire activée explicitement, pas un remplacement de la configuration générique de serveur MCP.

### Pont MCP OpenClaw-tools

Par défaut, les sessions ACPX **n’exposent pas non plus** les outils intégrés OpenClaw via
MCP. Activez le pont séparé core-tools lorsqu’un agent ACP a besoin de certains
outils intégrés tels que `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage
  de session ACPX.
- Expose certains outils intégrés OpenClaw. Le serveur initial expose `cron`.
- Conserve l’exposition des outils du noyau explicite et désactivée par défaut.

### Configuration du délai d’attente runtime

Le plugin intégré `acpx` définit par défaut les tours de runtime intégrés à un
délai d’attente de 120 secondes. Cela donne à des harnais plus lents tels que Gemini CLI assez de temps pour terminer
le démarrage et l’initialisation ACP. Remplacez-le si votre hôte a besoin d’une
limite de runtime différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez la Gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde de santé

Lorsque `/acp doctor` ou la sonde de démarrage activée explicitement vérifie le backend, le plugin intégré
`acpx` sonde un agent de harnais. Si `acp.allowedAgents` est défini, il
prend par défaut le premier agent autorisé ; sinon il prend `codex` par défaut. Si votre
déploiement a besoin d’un agent ACP différent pour les vérifications de santé, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez la Gateway après avoir modifié cette valeur.

## Configuration des permissions

Les sessions ACP s’exécutent de manière non interactive — il n’y a pas de TTY pour approuver ou refuser les invites de permission d’écriture de fichier et d’exécution shell. Le plugin acpx fournit deux clés de configuration qui contrôlent la gestion des permissions :

Ces permissions du harnais ACPX sont distinctes des approbations exec OpenClaw et distinctes des drapeaux de contournement CLI-backend du fournisseur tels que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est le commutateur break-glass au niveau du harnais pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent du harnais peut effectuer sans invite.

| Valeur          | Comportement                                                    |
| --------------- | --------------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et exec nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites de permission.                        |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite de permission devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                      |
| ------ | ----------------------------------------------------------------- |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)**     |
| `deny` | Refuse silencieusement la permission et continue (dégradation gracieuse). |

### Configuration

Définir via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la Gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exec qui déclenche une invite de permission peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent gracieusement au lieu de planter.

## Associé

- [Agents ACP](/fr/tools/acp-agents) — vue d’ensemble, guide opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agents](/fr/concepts/multi-agent)
