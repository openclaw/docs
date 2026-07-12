---
read_when:
    - Installation ou configuration du banc d’essai acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configuration des agents ACP : configuration du harnais acpx, configuration du plugin, autorisations'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-07-12T03:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Pour la présentation, le guide opérationnel et les concepts, consultez [Agents ACP](/fr/tools/acp-agents).

Cette page couvre la configuration du banc d’exécution acpx, la configuration du Plugin pour les passerelles MCP et la configuration des autorisations.

Utilisez cette page uniquement lorsque vous configurez la voie ACP/acpx. Pour la configuration d’exécution native du serveur d’application Codex, utilisez le [banc d’exécution Codex](/fr/plugins/codex-harness). Pour les clés d’API OpenAI ou la configuration du fournisseur de modèles avec OAuth Codex, utilisez [OpenAI](/fr/providers/openai).

Codex dispose de deux voies OpenClaw :

| Voie                         | Configuration/commande                                 | Page de configuration                   |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Serveur d’application Codex natif | `/codex ...`, références d’agent `openai/gpt-*`   | [Banc d’exécution Codex](/fr/plugins/codex-harness) |
| Adaptateur ACP Codex explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                         |

Privilégiez la voie native, sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge du banc d’exécution acpx (actuelle)

Alias de banc d’exécution acpx intégrés (issus de la dépendance `acpx` épinglée) :

| Alias        | Encapsule                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [CLI GitHub Copilot](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [CLI Cursor](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [CLI Gemini](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [CLI iFlow](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [CLI Kimi](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [CLI Kiro](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Passerelle ACP OpenClaw (`openclaw acp` natif)                                                                  |
| `pi`         | [Agent de programmation Pi](https://github.com/mariozechner/pi)                                                 |
| `qoder`      | [CLI Qoder](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI Trae](https://docs.trae.cn/cli)                                                                            |

`factory-droid` et `factorydroid` sont également résolus vers l’adaptateur `droid` intégré.

Lorsque OpenClaw utilise le backend acpx, privilégiez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP sous la forme `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut également cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx, et non la voie `agentId` normale d’OpenClaw.

Le contrôle du modèle dépend des capacités de l’adaptateur. Les références de modèles ACP Codex sont normalisées par OpenClaw avant le démarrage. Les autres bancs d’exécution nécessitent la capacité ACP `models` ainsi que la prise en charge de `session/set_model` ; si un banc d’exécution n’expose ni cette capacité ACP ni son propre indicateur de modèle au démarrage, OpenClaw/acpx ne peut pas imposer la sélection d’un modèle.

## Configuration requise

Configuration ACP de base :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour suspendre l’envoi ACP tout en conservant les commandes /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Les valeurs par défaut sont coalesceIdleMs: 350 et maxChunkChars: 1800 ; elles sont indiquées explicitement ici.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuration de liaison aux fils de discussion dépend de l’adaptateur de canal. Exemple pour Discord :

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
        // La valeur par défaut est déjà true ; elle est indiquée explicitement ici.
        spawnSessions: true,
      },
    },
  },
}
```

Si le lancement ACP lié à un fil de discussion ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnSessions=true`

Les liaisons à la conversation actuelle ne nécessitent pas la création d’un fil enfant. Elles requièrent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les installations empaquetées utilisent le Plugin d’exécution officiel `@openclaw/acpx` pour ACP.
Installez-le et activez-le avant d’utiliser des sessions de banc d’exécution ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les extractions du code source peuvent également utiliser le Plugin de l’espace de travail local après `pnpm install`.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez interdit via `plugins.allow` / `plugins.deny`, ou souhaitez revenir au Plugin empaqueté, utilisez le chemin de paquet explicite :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation de l’espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite l’état du backend :

```text
/acp doctor
```

### Sonde de démarrage de l’exécution acpx

Le Plugin `acpx` intègre directement l’exécution ACP, sans binaire `acpx` distinct ni version à configurer. Par défaut, il enregistre le backend intégré au démarrage du Gateway et attend l’achèvement d’une sonde de démarrage avant le signal `ready` du Gateway. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ou `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` uniquement pour les scripts ou environnements qui maintiennent intentionnellement la sonde de démarrage désactivée. Exécutez `/acp doctor` pour lancer explicitement une sonde à la demande.

Remplacez la commande d’un agent ACP individuel par des arguments structurés lorsqu’un chemin ou une valeur d’indicateur doit rester un seul jeton argv :

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

- `agents.<id>.command` est l’exécutable ou la chaîne de commande existante de cet agent ACP.
- `agents.<id>.args` est facultatif. Chaque élément du tableau est protégé pour l’interpréteur de commandes avant qu’OpenClaw ne le transmette au registre actuel des chaînes de commande acpx.

Consultez [Plugins](/fr/tools/plugin).

### Téléchargement automatique des adaptateurs

`acpx` télécharge automatiquement les adaptateurs ACP, par exemple les passerelles ACP Claude et Codex, via `npx` lors de la première utilisation. Vous n’avez pas besoin d’installer manuellement les paquets d’adaptateurs et OpenClaw lui-même ne comporte aucune étape post-installation distincte. Si le téléchargement ou le lancement d’un adaptateur échoue, `/acp doctor` signale l’échec.

### Passerelle MCP des outils de Plugin

Par défaut, les sessions ACPX **n’exposent pas** au banc d’exécution ACP les outils enregistrés par les Plugins OpenClaw.

Si vous souhaitez que des agents ACP tels que Codex ou Claude Code appellent des outils de Plugins OpenClaw installés, comme le rappel ou le stockage en mémoire, activez la passerelle dédiée :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Effets de cette option :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage de la session ACPX.
- Expose les outils de Plugins déjà enregistrés par les Plugins OpenClaw installés et activés.
- Conserve une activation explicite de cette fonctionnalité, désactivée par défaut.

Remarques sur la sécurité et la confiance :

- Cela étend la surface d’outils du banc d’exécution ACP.
- Les agents ACP accèdent uniquement aux outils de Plugins déjà actifs dans le Gateway.
- Considérez cette option comme relevant de la même frontière de confiance que l’autorisation donnée à ces Plugins de s’exécuter dans OpenClaw lui-même.
- Vérifiez les Plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme auparavant. La passerelle intégrée des outils de Plugins est une commodité facultative supplémentaire, et non un remplacement de la configuration générique des serveurs MCP.

### Passerelle MCP des outils OpenClaw

Par défaut, les sessions ACPX **n’exposent pas** non plus les outils OpenClaw intégrés via MCP. Activez la passerelle distincte des outils du cœur lorsqu’un agent ACP a besoin d’outils intégrés sélectionnés, tels que `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Effets de cette option :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage de la session ACPX.
- Expose certains outils OpenClaw intégrés. Le serveur initial expose `cron`.
- Conserve une exposition explicite des outils du cœur, désactivée par défaut.

### Configuration du délai d’expiration des opérations d’exécution

Le Plugin `acpx` accorde par défaut 120 secondes au démarrage de l’exécution intégrée et aux opérations de contrôle. Cela laisse aux bancs d’exécution plus lents, tels que la CLI Gemini, suffisamment de temps pour terminer le démarrage et l’initialisation ACP. Modifiez cette valeur si votre hôte nécessite une autre limite d’opération :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Les tours d’exécution utilisent les délais d’expiration des agents/exécutions OpenClaw, y compris `/acp timeout`.
`sessions_spawn` n’accepte pas de remplacement du délai d’expiration par appel ; la voie opérateur est `agents.defaults.subagents.runTimeoutSeconds`. Redémarrez le Gateway après avoir modifié `timeoutSeconds`.

### Configuration de l’agent de sonde d’intégrité

Lorsque `/acp doctor` ou la sonde de démarrage vérifie le backend, le Plugin `acpx` fourni sonde un agent de banc d’exécution. Si `acp.allowedAgents` est défini, le premier agent autorisé est utilisé par défaut ; sinon, la valeur par défaut est `codex`. Si votre déploiement nécessite un autre agent ACP pour les contrôles d’intégrité, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le Gateway après avoir modifié cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent de manière non interactive : aucune TUI ne permet d’approuver ou de refuser les demandes d’autorisation d’écriture de fichiers et d’exécution de commandes shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la gestion des autorisations :

Ces autorisations du banc d’exécution ACPX sont distinctes des approbations d’exécution OpenClaw et des indicateurs de contournement propres aux fournisseurs du backend CLI, tels que `--permission-mode bypassPermissions` de la CLI Claude. `approve-all` d’ACPX est le mécanisme de dernier recours au niveau du banc d’exécution pour les sessions ACP.

Pour une comparaison plus générale entre `tools.exec.mode` d’OpenClaw, les approbations Codex Guardian et les autorisations du banc d’exécution ACPX, consultez [Modes d’autorisation](/fr/tools/permission-modes).

### `permissionMode`

Contrôle les opérations que l’agent du banc d’exécution peut effectuer sans demander de confirmation.

| Valeur         | Comportement                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `approve-all`  | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et les exécutions nécessitent une confirmation. |
| `deny-all`     | Refuse toutes les demandes d’autorisation.                                   |

### `nonInteractivePermissions`

Détermine ce qui se passe lorsqu’une demande d’autorisation devrait être affichée, mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                                    |
| ------ | ------------------------------------------------------------------------------- |
| `fail` | Interrompt la session avec `PermissionPromptUnavailableError`. **(par défaut)** |
| `deny` | Refuse silencieusement l’autorisation et poursuit l’exécution (dégradation progressive). |

### Configuration

Définissez ces valeurs via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le Gateway après avoir modifié ces valeurs.

<Warning>
Par défaut, OpenClaw utilise `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution déclenchant une demande d’autorisation peut échouer avec `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions passent en mode dégradé sans planter.
</Warning>

## Voir aussi

- [Agents ACP](/fr/tools/acp-agents) — vue d’ensemble, guide d’exploitation, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
