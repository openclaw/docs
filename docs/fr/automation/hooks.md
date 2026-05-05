---
read_when:
    - Vous voulez une automatisation pilotée par les événements pour /new, /reset, /stop et les événements du cycle de vie des agents
    - Vous souhaitez créer, installer ou déboguer des points d’accroche
summary: 'Crochets : automatisation événementielle pour les commandes et les événements du cycle de vie'
title: Points d’accroche
x-i18n:
    generated_at: "2026-05-05T08:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Les hooks sont de petits scripts qui s’exécutent lorsque quelque chose se produit dans le Gateway. Ils peuvent être découverts à partir de répertoires et inspectés avec `openclaw hooks`. Le Gateway charge les hooks internes seulement après que vous avez activé les hooks ou configuré au moins une entrée de hook, un pack de hooks, un gestionnaire hérité ou un répertoire de hooks supplémentaire.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans le Gateway lorsque des événements d’agent se déclenchent, comme `/new`, `/reset`, `/stop`, ou des événements de cycle de vie.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être inclus dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par des plugins.

## Démarrage rapide

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Types d’événements

| Événement                | Quand il se déclenche                                      |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Commande `/new` émise                                      |
| `command:reset`          | Commande `/reset` émise                                    |
| `command:stop`           | Commande `/stop` émise                                     |
| `command`                | Tout événement de commande (écouteur général)              |
| `session:compact:before` | Avant que la Compaction ne résume l’historique             |
| `session:compact:after`  | Après la fin de la Compaction                              |
| `session:patch`          | Lorsque les propriétés de session sont modifiées           |
| `agent:bootstrap`        | Avant l’injection des fichiers d’amorçage de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks    |
| `gateway:shutdown`       | Lorsque l’arrêt du Gateway commence                        |
| `gateway:pre-restart`    | Avant un redémarrage attendu du Gateway                    |
| `message:received`       | Message entrant depuis n’importe quel canal                |
| `message:transcribed`    | Après la fin de la transcription audio                     |
| `message:preprocessed`   | Après la fin ou l’omission du prétraitement des médias et des liens |
| `message:sent`           | Message sortant livré                                      |

## Écrire des hooks

### Structure d’un hook

Chaque hook est un répertoire contenant deux fichiers :

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Format de HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Champs de métadonnées** (`metadata.openclaw`) :

| Champ      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji d’affichage pour la CLI                        |
| `events`   | Tableau des événements à écouter                     |
| `export`   | Export nommé à utiliser (par défaut, `"default"`)    |
| `os`       | Plateformes requises (par exemple, `["darwin", "linux"]`) |
| `requires` | Chemins `bins`, `anyBins`, `env` ou `config` requis  |
| `always`   | Contourne les contrôles d’éligibilité (booléen)      |
| `install`  | Méthodes d’installation                              |

### Implémentation du gestionnaire

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajouter avec push pour envoyer à l’utilisateur) et `context` (données propres à l’événement). Les contextes de hooks de plugins d’agent et d’outil peuvent aussi inclure `trace`, un contexte de trace de diagnostic compatible W3C en lecture seule que les plugins peuvent transmettre à des journaux structurés pour la corrélation OTEL.

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données propres au fournisseur, notamment `senderId`, `senderName`, `guildId`). `context.content` privilégie un corps de commande non vide pour les messages assimilables à des commandes, puis se rabat sur le corps entrant brut et le corps générique ; il n’inclut pas les enrichissements réservés à l’agent, comme l’historique de fil ou les résumés de liens.

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps enrichi final), `context.from`, `context.channelId`.

**Événements d’amorçage** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de correctif de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de correctif.

**Événements de Compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’utilisateur qui émet `/stop` ; cela relève du cycle de vie de l’annulation/de la commande, et non d’un point de contrôle de finalisation de l’agent. Les plugins qui doivent inspecter une réponse finale naturelle et demander à l’agent un passage supplémentaire doivent plutôt utiliser le hook de plugin typé `before_agent_finalize`. Voir [Hooks de plugins](/fr/plugins/hooks).

**Événements de cycle de vie du Gateway** : `gateway:shutdown` inclut `reason` et `restartExpectedMs` et se déclenche lorsque l’arrêt du Gateway commence. `gateway:pre-restart` inclut le même contexte, mais ne se déclenche que lorsque l’arrêt fait partie d’un redémarrage attendu et qu’une valeur finie de `restartExpectedMs` est fournie. Pendant l’arrêt, l’attente de chaque hook de cycle de vie est au mieux et bornée, de sorte que l’arrêt se poursuit si un gestionnaire se bloque.

## Découverte des hooks

Les hooks sont découverts à partir de ces répertoires, par ordre de priorité de remplacement croissante :

1. **Hooks inclus** : livrés avec OpenClaw
2. **Hooks de plugins** : hooks inclus dans les plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre les espaces de travail). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas remplacer des hooks inclus, gérés ou fournis par des plugins portant le même nom.

Le Gateway ignore la découverte des hooks internes au démarrage tant que les hooks internes ne sont pas configurés. Activez un hook inclus ou géré avec `openclaw hooks enable <name>`, installez un pack de hooks ou définissez `hooks.internal.enabled=true` pour vous inscrire. Lorsque vous activez un hook nommé, le Gateway charge uniquement le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent la découverte large.

### Packs de hooks

Les packs de hooks sont des paquets npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom du paquet + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks intégrés

| Hook                  | Événements                                        | Ce qu’il fait                                                  |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de session dans `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers de bootstrap supplémentaires depuis des motifs glob |
| command-logger        | `command`                                         | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications de chat visibles lorsque la Compaction de session démarre/se termine |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du Gateway                      |

Activez n’importe quel hook intégré :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant et les enregistre dans `<workspace>/memory/YYYY-MM-DD-HHMM.md` en utilisant la date locale de l’hôte. La capture de mémoire s’exécute en arrière-plan afin que les accusés de réception de `/new` et `/reset` ne soient pas retardés par la lecture de la transcription ni par la génération facultative du slug. Définissez `hooks.internal.entries.session-memory.llmSlug: true` pour générer des slugs de noms de fichiers descriptifs avec le modèle configuré. Nécessite que `workspace.dir` soit configuré.

<a id="bootstrap-extra-files"></a>

### Configuration de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Les chemins sont résolus relativement à l’espace de travail. Seuls les noms de base de bootstrap reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande slash dans `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Détails de compaction-notifier

Envoie de courts messages d’état dans la conversation actuelle lorsque OpenClaw commence et termine la compaction de la transcription de session. Cela rend les longs tours moins déroutants sur les surfaces de chat, car l’utilisateur peut voir que l’assistant résume le contexte et continuera après la Compaction.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage du Gateway.

## Hooks de Plugin

Les Plugins peuvent enregistrer des hooks typés via le SDK de Plugin pour une intégration plus profonde :
intercepter les appels d’outils, modifier les prompts, contrôler le flux des messages, et plus encore.
Utilisez les hooks de Plugin lorsque vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install` ou d’autres hooks de cycle de vie dans le processus.

Pour la référence complète des hooks de Plugin, consultez [Hooks de Plugin](/fr/plugins/hooks).

## Configuration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variables d’environnement par hook :

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Répertoires de hooks supplémentaires :

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
L’ancien format de configuration du tableau `hooks.internal.handlers` reste pris en charge pour la compatibilité descendante, mais les nouveaux hooks doivent utiliser le système basé sur la découverte.
</Note>

## Référence CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bonnes pratiques

- **Gardez les gestionnaires rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les travaux lourds en arrière-plan sans les attendre avec `void processInBackground(event)`.
- **Gérez les erreurs avec élégance.** Encadrez les opérations risquées dans un try/catch ; ne levez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type ou l’action de l’événement n’est pas pertinent.
- **Utilisez des clés d’événement spécifiques.** Préférez `"events": ["command:new"]` à `"events": ["command"]` pour réduire la surcharge.

## Dépannage

### Hook non découvert

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook non éligible

```bash
openclaw hooks info my-hook
```

Recherchez les binaires manquants (PATH), les variables d’environnement, les valeurs de configuration ou la compatibilité avec l’OS.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus Gateway afin que les hooks soient rechargés.
3. Consultez les journaux du Gateway : `./scripts/clawlog.sh | grep hook`

## Connexe

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/fr/plugins/hooks) — hooks de cycle de vie de Plugin dans le processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
