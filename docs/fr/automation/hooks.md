---
read_when:
    - Vous voulez une automatisation pilotée par les événements pour /new, /reset, /stop et les événements du cycle de vie de l’agent
    - Vous souhaitez créer, installer ou déboguer des points d’accroche
summary: 'Points d’accroche : automatisation événementielle pour les commandes et les événements de cycle de vie'
title: Points d’accroche
x-i18n:
    generated_at: "2026-05-03T21:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sont de petits scripts qui s’exécutent quand quelque chose se produit dans le Gateway. Ils peuvent être découverts depuis des répertoires et inspectés avec `openclaw hooks`. Le Gateway charge les hooks internes uniquement après que vous avez activé les hooks ou configuré au moins une entrée de hook, un pack de hooks, un gestionnaire hérité ou un répertoire de hooks supplémentaire.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans le Gateway quand des événements d’agent se déclenchent, comme `/new`, `/reset`, `/stop`, ou des événements de cycle de vie.
- **Webhooks** : points de terminaison HTTP externes permettant à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être regroupés dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par Plugin.

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

| Événement                | Quand il se déclenche                                     |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Commande `/new` émise                                    |
| `command:reset`          | Commande `/reset` émise                                  |
| `command:stop`           | Commande `/stop` émise                                   |
| `command`                | Tout événement de commande (écouteur général)             |
| `session:compact:before` | Avant que la Compaction résume l’historique               |
| `session:compact:after`  | Après la fin de la Compaction                             |
| `session:patch`          | Quand les propriétés de session sont modifiées            |
| `agent:bootstrap`        | Avant l’injection des fichiers d’amorçage de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks  |
| `gateway:shutdown`       | Quand l’arrêt du gateway commence                         |
| `gateway:pre-restart`    | Avant un redémarrage prévu du gateway                     |
| `message:received`       | Message entrant depuis n’importe quel canal               |
| `message:transcribed`    | Après la fin de la transcription audio                    |
| `message:preprocessed`   | Après la fin ou l’omission du prétraitement des médias et des liens |
| `message:sent`           | Message sortant livré                                     |

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
| `events`   | Tableau d’événements à écouter                       |
| `export`   | Export nommé à utiliser (par défaut `"default"`)     |
| `os`       | Plateformes requises (par ex. `["darwin", "linux"]`) |
| `requires` | Chemins `bins`, `anyBins`, `env` ou `config` requis  |
| `always`   | Contourner les contrôles d’éligibilité (booléen)     |
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

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajouter pour envoyer à l’utilisateur) et `context` (données propres à l’événement). Les contextes de hooks d’agent et d’outil Plugin peuvent aussi inclure `trace`, un contexte de trace de diagnostic en lecture seule compatible W3C que les plugins peuvent transmettre aux journaux structurés pour la corrélation OTEL.

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données propres au fournisseur, y compris `senderId`, `senderName`, `guildId`). `context.content` privilégie un corps de commande non vide pour les messages de type commande, puis se rabat sur le corps entrant brut et le corps générique ; il n’inclut pas les enrichissements réservés à l’agent, comme l’historique du fil ou les résumés de liens.

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps enrichi final), `context.from`, `context.channelId`.

**Événements d’amorçage** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de patch de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de patch.

**Événements de Compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’utilisateur qui émet `/stop` ; il s’agit du cycle de vie d’annulation/commande, pas d’une barrière de finalisation d’agent. Les plugins qui doivent inspecter une réponse finale naturelle et demander à l’agent une passe supplémentaire doivent plutôt utiliser le hook Plugin typé `before_agent_finalize`. Voir [Hooks de Plugin](/fr/plugins/hooks).

**Événements de cycle de vie du Gateway** : `gateway:shutdown` inclut `reason` et `restartExpectedMs` et se déclenche quand l’arrêt du gateway commence. `gateway:pre-restart` inclut le même contexte, mais se déclenche uniquement quand l’arrêt fait partie d’un redémarrage prévu et qu’une valeur finie de `restartExpectedMs` est fournie. Pendant l’arrêt, chaque attente de hook de cycle de vie est effectuée au mieux et bornée afin que l’arrêt continue si un gestionnaire se bloque.

## Découverte des hooks

Les hooks sont découverts depuis ces répertoires, par ordre croissant de priorité de remplacement :

1. **Hooks groupés** : livrés avec OpenClaw
2. **Hooks de Plugin** : hooks regroupés dans des plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre espaces de travail). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas remplacer les hooks groupés, gérés ou fournis par Plugin portant le même nom.

Le Gateway ignore la découverte des hooks internes au démarrage jusqu’à ce que les hooks internes soient configurés. Activez un hook groupé ou géré avec `openclaw hooks enable <name>`, installez un pack de hooks ou définissez `hooks.internal.enabled=true` pour vous inscrire. Quand vous activez un hook nommé, le Gateway charge uniquement le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent la découverte large.

### Packs de hooks

Les packs de hooks sont des paquets npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom de paquet + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks groupés

| Hook                  | Événements                                        | Ce qu’il fait                                                |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de session dans `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers d’amorçage supplémentaires depuis des motifs glob |
| command-logger        | `command`                                         | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications de chat visibles au début/à la fin de la Compaction de session |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du gateway                    |

Activez n’importe quel hook groupé :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant, génère un slug de nom de fichier descriptif via LLM, et l’enregistre dans `<workspace>/memory/YYYY-MM-DD-slug.md` en utilisant la date locale de l’hôte. Nécessite que `workspace.dir` soit configuré.

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

Les chemins sont résolus relativement à l’espace de travail. Seuls les noms de base d’amorçage reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande slash dans `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Détails de compaction-notifier

Envoie de courts messages d’état dans la conversation actuelle quand OpenClaw commence et termine la Compaction de la transcription de session. Cela rend les longs tours moins déroutants sur les surfaces de chat, car l’utilisateur peut voir que l’assistant résume le contexte et continuera après la Compaction.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage du gateway.

## Hooks de Plugin

Les plugins peuvent enregistrer des hooks typés via le SDK Plugin pour une intégration plus profonde :
intercepter les appels d’outils, modifier les prompts, contrôler le flux de messages, et plus encore.
Utilisez les hooks Plugin quand vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install`, ou d’autres hooks de cycle de vie dans le processus.

Pour la référence complète des hooks Plugin, voir [Hooks de Plugin](/fr/plugins/hooks).

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
L’ancien format de configuration de tableau `hooks.internal.handlers` reste pris en charge pour la rétrocompatibilité, mais les nouveaux hooks doivent utiliser le système fondé sur la découverte.
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

- **Gardez les gestionnaires rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les travaux lourds sans attendre leur résultat avec `void processInBackground(event)`.
- **Gérez les erreurs proprement.** Encapsulez les opérations risquées dans try/catch ; ne lancez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
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

Vérifiez les binaires manquants (PATH), les variables d’environnement, les valeurs de configuration ou la compatibilité du système d’exploitation.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus Gateway afin que les hooks soient rechargés.
3. Vérifiez les journaux du Gateway : `./scripts/clawlog.sh | grep hook`

## Associé

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/fr/plugins/hooks) — hooks de cycle de vie de Plugin dans le processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
