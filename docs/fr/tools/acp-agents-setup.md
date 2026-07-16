---
read_when:
    - Installation ou configuration du harness acpx pour Claude Code / Codex / Gemini CLI
    - Activation du pont MCP plugin-tools ou OpenClaw-tools
    - Configuration des modes d’autorisation ACP
summary: 'Configuration des agents ACP : configuration du harnais acpx, configuration du plugin, autorisations'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-07-16T13:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Pour la vue d’ensemble, le guide opérationnel et les concepts, consultez [Agents ACP](/fr/tools/acp-agents).

Cette page couvre la configuration du harnais acpx, la configuration du plugin pour les passerelles MCP et la configuration des autorisations.

Utilisez cette page uniquement lorsque vous configurez la voie ACP/acpx. Pour la configuration d’exécution native du serveur d’application Codex, consultez [Harnais Codex](/fr/plugins/codex-harness). Pour les clés d’API OpenAI ou la configuration du fournisseur de modèles avec Codex OAuth, consultez [OpenAI](/fr/providers/openai).

Codex dispose de deux voies OpenClaw :

| Voie                       | Configuration/commande                                  | Page de configuration                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Serveur d’application Codex natif | `/codex ...`, références d’agent `openai/gpt-*` | [Harnais Codex](/fr/plugins/codex-harness) |
| Adaptateur ACP Codex explicite | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Cette page                              |

Privilégiez la voie native, sauf si vous avez explicitement besoin du comportement ACP/acpx.

## Prise en charge du harnais acpx (actuelle)

Alias de harnais acpx intégrés (provenant de la dépendance `acpx` épinglée) :

| Alias        | Encapsule                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [CLI Codex](https://codex.openai.com)                                                                           |
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
| `openclaw`   | Passerelle ACP OpenClaw (`openclaw acp` natif)                                                                     |
| `pi`         | [Agent de codage Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [CLI Qoder](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI Trae](https://docs.trae.cn/cli)                                                                            |

`factory-droid` et `factorydroid` sont également résolus vers l’adaptateur `droid` intégré.

Lorsque OpenClaw utilise le backend acpx, privilégiez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agents personnalisés.
Si votre installation locale de Cursor expose encore ACP sous le nom `agent acp`, remplacez la commande d’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur par défaut intégrée.

L’utilisation directe de la CLI acpx peut également cibler des adaptateurs arbitraires via `--agent <command>`, mais cet échappatoire brut est une fonctionnalité de la CLI acpx (et non la voie `agentId` normale d’OpenClaw).

Le contrôle du modèle dépend des capacités de l’adaptateur. Les références de modèles ACP Codex sont normalisées par OpenClaw avant le démarrage. Les autres harnais nécessitent la prise en charge d’ACP `models` ainsi que de `session/set_model` ; si un harnais n’expose ni cette capacité ACP ni son propre indicateur de modèle au démarrage, OpenClaw/acpx ne peut pas imposer la sélection d’un modèle.

## Configuration requise

Configuration ACP de base :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour suspendre la répartition ACP tout en conservant les contrôles /acp.
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

Si la création d’une session ACP liée à un fil de discussion ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnSessions=true`

Les liaisons à la conversation actuelle ne nécessitent pas la création d’un fil enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Consultez la [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du plugin pour le backend acpx

Les installations empaquetées utilisent le plugin d’exécution officiel `@openclaw/acpx` pour ACP.
Installez-le et activez-le avant d’utiliser des sessions de harnais ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les copies de travail des sources peuvent également utiliser le plugin de l’espace de travail local après `pnpm install`.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou souhaitez revenir au plugin empaqueté, utilisez le chemin de paquet explicite :

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

Le plugin `acpx` intègre directement l’exécution ACP (aucun binaire `acpx` distinct ni aucune version à configurer). Par défaut, il enregistre le backend intégré pendant le démarrage du Gateway et attend une sonde de démarrage avant le signal `ready` du Gateway. Définissez `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ou `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` uniquement pour les scripts ou environnements qui maintiennent intentionnellement la sonde de démarrage désactivée. Exécutez `/acp doctor` pour effectuer une sonde explicite à la demande.

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

- `agents.<id>.command` correspond à l’exécutable ou à la chaîne de commande existante pour cet agent ACP.
- `agents.<id>.args` est facultatif. Chaque élément du tableau est protégé par des guillemets d’interpréteur de commandes avant qu’OpenClaw ne le transmette au registre actuel des chaînes de commande acpx.

Consultez [Plugins](/fr/tools/plugin).

### Téléchargement automatique des adaptateurs

`acpx` télécharge automatiquement les adaptateurs ACP (par exemple, les passerelles ACP Claude et Codex) via `npx` lors de la première utilisation. Vous n’avez pas besoin d’installer manuellement les paquets d’adaptateurs, et OpenClaw lui-même ne nécessite aucune étape post-installation distincte. En cas d’échec du téléchargement ou du lancement d’un adaptateur, `/acp doctor` signale l’échec.

### Passerelle MCP des outils de plugins

Par défaut, les sessions ACPX **n’exposent pas** au harnais ACP les outils enregistrés par les plugins OpenClaw.

Si vous souhaitez que des agents ACP tels que Codex ou Claude Code puissent appeler les outils de plugins OpenClaw installés, comme le rappel ou le stockage en mémoire, activez la passerelle dédiée :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Fonctionnement :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage de la session ACPX.
- Expose les outils de plugins déjà enregistrés par les plugins OpenClaw installés et activés.
- Transmet l’identité de la session ACP active aux fabriques d’outils de plugins, afin que les outils propres à l’agent restent dans l’espace de noms de cet agent.
- Maintient la fonctionnalité explicite et désactivée par défaut.

Remarques concernant la sécurité et la confiance :

- Cela étend la surface d’outils du harnais ACP.
- Les agents ACP accèdent uniquement aux outils de plugins déjà actifs dans le Gateway.
- Considérez qu’il s’agit de la même frontière de confiance que celle qui permet à ces plugins de s’exécuter dans OpenClaw lui-même.
- Examinez les plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme auparavant. La passerelle d’outils de plugins intégrée est une commodité supplémentaire facultative, et non un remplacement de la configuration générique des serveurs MCP.

### Passerelle MCP des outils OpenClaw

Par défaut, les sessions ACPX **n’exposent pas** non plus les outils OpenClaw intégrés via MCP. Activez la passerelle distincte des outils du cœur lorsqu’un agent ACP a besoin d’outils intégrés sélectionnés tels que `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Fonctionnement :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage de la session ACPX.
- Expose certains outils OpenClaw intégrés. Le serveur initial expose `cron`.
- Maintient l’exposition des outils du cœur explicite et désactivée par défaut.

### Configuration du délai d’expiration des opérations d’exécution

Le plugin `acpx` accorde par défaut 120 secondes aux opérations de démarrage et de contrôle de l’exécution intégrée. Cela laisse aux harnais plus lents tels que la CLI Gemini suffisamment de temps pour terminer le démarrage et l’initialisation ACP. Remplacez cette valeur si votre hôte nécessite une limite d’opération différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Les tours d’exécution utilisent les délais d’expiration des agents/exécutions OpenClaw, y compris `/acp timeout`.
`sessions_spawn` n’accepte pas de remplacement du délai d’expiration par appel ; la voie destinée aux opérateurs est `agents.defaults.subagents.runTimeoutSeconds`. Redémarrez le Gateway après avoir modifié `timeoutSeconds`.

### Configuration de l’agent de sonde d’état

Lorsque `/acp doctor` ou la sonde de démarrage vérifie le backend, le plugin `acpx` fourni sonde un agent de harnais. Si `acp.allowedAgents` est défini, la valeur par défaut est le premier agent autorisé ; sinon, la valeur par défaut est `codex`. Si votre déploiement nécessite un autre agent ACP pour les vérifications d’état, définissez explicitement l’agent de sonde :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le Gateway après avoir modifié cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent de manière non interactive — aucun TTY ne permet d’approuver ou de refuser les demandes d’autorisation d’écriture de fichiers et d’exécution de commandes shell. Le plugin acpx fournit deux clés de configuration qui déterminent la gestion des autorisations :

Ces autorisations du harnais ACPX sont distinctes des approbations d’exécution d’OpenClaw et des options de contournement propres aux fournisseurs des backends CLI, telles que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur d’urgence au niveau du harnais pour les sessions ACP.

Pour une comparaison plus générale entre OpenClaw `tools.exec.mode`, les
approbations Codex Guardian et les autorisations du harnais ACPX, consultez
[Modes d’autorisation](/fr/tools/permission-modes).

### `permissionMode`

Détermine les opérations que l’agent du harnais peut effectuer sans demander de confirmation.

| Valeur           | Comportement                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell.          |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et exécutions nécessitent une confirmation. |
| `deny-all`      | Refuse toutes les demandes d’autorisation.                              |

### `nonInteractivePermissions`

Détermine ce qui se passe lorsqu’une demande d’autorisation devrait être affichée, mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur  | Comportement                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Interrompt la session avec `PermissionPromptUnavailableError`. **(par défaut)** |
| `deny` | Refuse silencieusement l’autorisation et poursuit l’exécution (dégradation progressive).        |

### Configuration

Définissez ces valeurs via la configuration du plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le Gateway après avoir modifié ces valeurs.

<Warning>
OpenClaw utilise par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une demande d’autorisation peut échouer avec `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions appliquent une dégradation progressive au lieu de s’arrêter brutalement.
</Warning>

## Pages connexes

- [Agents ACP](/fr/tools/acp-agents) — présentation, guide opérationnel, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
