---
read_when:
    - Vous souhaitez une automatisation pilotée par les événements pour /new, /reset, /stop et les événements du cycle de vie des agents
    - Vous voulez créer, installer ou déboguer des points d’accroche
summary: 'Points d’accroche : automatisation événementielle pour les commandes et les événements de cycle de vie'
title: Points d’accroche
x-i18n:
    generated_at: "2026-05-11T20:20:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Les points d’accroche sont de petits scripts qui s’exécutent lorsqu’un événement se produit dans le Gateway. Ils peuvent être découverts à partir de répertoires et inspectés avec `openclaw hooks`. Le Gateway charge les points d’accroche internes uniquement après que vous avez activé les points d’accroche ou configuré au moins une entrée de point d’accroche, un pack de points d’accroche, un gestionnaire hérité ou un répertoire de points d’accroche supplémentaire.

Il existe deux types de points d’accroche dans OpenClaw :

- **Points d’accroche internes** (cette page) : s’exécutent dans le Gateway lorsque des événements d’agent se produisent, comme `/new`, `/reset`, `/stop` ou des événements de cycle de vie.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher du travail dans OpenClaw. Consultez [Webhooks](/fr/automation/cron-jobs#webhooks).

Les points d’accroche peuvent également être groupés dans des plugins. `openclaw hooks list` affiche à la fois les points d’accroche autonomes et les points d’accroche gérés par des plugins.

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

| Événement                | Quand il se déclenche                                    |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Commande `/new` émise                                      |
| `command:reset`          | Commande `/reset` émise                                    |
| `command:stop`           | Commande `/stop` émise                                     |
| `command`                | Tout événement de commande (écouteur général)              |
| `session:compact:before` | Avant que la Compaction ne résume l’historique             |
| `session:compact:after`  | Après la fin de la Compaction                              |
| `session:patch`          | Lorsque les propriétés de session sont modifiées           |
| `agent:bootstrap`        | Avant l’injection des fichiers d’amorçage de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des points d’accroche |
| `gateway:shutdown`       | Lorsque l’arrêt du Gateway commence                        |
| `gateway:pre-restart`    | Avant un redémarrage attendu du Gateway                    |
| `message:received`       | Message entrant depuis n’importe quel canal                |
| `message:transcribed`    | Après la fin de la transcription audio                     |
| `message:preprocessed`   | Après la fin ou l’omission du prétraitement des médias et des liens |
| `message:sent`           | Message sortant livré                                      |

## Écriture de points d’accroche

### Structure d’un point d’accroche

Chaque point d’accroche est un répertoire contenant deux fichiers :

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
| `emoji`    | Émoji d’affichage pour la CLI                        |
| `events`   | Tableau d’événements à écouter                       |
| `export`   | Export nommé à utiliser (valeur par défaut : `"default"`) |
| `os`       | Plateformes requises (par ex. `["darwin", "linux"]`) |
| `requires` | Chemins `bins`, `anyBins`, `env` ou `config` requis  |
| `always`   | Contourner les vérifications d’éligibilité (booléen) |
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

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajoutez-y des éléments pour les envoyer à l’utilisateur) et `context` (données propres à l’événement). Les contextes de point d’accroche de Plugin d’agent et d’outil peuvent également inclure `trace`, un contexte de trace de diagnostic compatible W3C en lecture seule que les plugins peuvent transmettre aux journaux structurés pour la corrélation OTEL.

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données propres au fournisseur incluant `senderId`, `senderName`, `guildId`). `context.content` privilégie un corps de commande non vide pour les messages de type commande, puis se rabat sur le corps entrant brut et le corps générique ; il n’inclut pas les enrichissements réservés à l’agent, comme l’historique du fil ou les résumés de liens.

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps enrichi final), `context.from`, `context.channelId`.

**Événements d’amorçage** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de correctif de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (seuls les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de correctif.

**Événements de Compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’utilisateur émettre `/stop` ; il s’agit du cycle de vie d’annulation/de commande, et non d’une barrière de finalisation d’agent. Les plugins qui doivent inspecter une réponse finale naturelle et demander à l’agent une passe supplémentaire doivent utiliser à la place le point d’accroche de Plugin typé `before_agent_finalize`. Consultez [Points d’accroche de Plugin](/fr/plugins/hooks).

**Événements de cycle de vie du Gateway** : `gateway:shutdown` inclut `reason` et `restartExpectedMs`, et se déclenche lorsque l’arrêt du Gateway commence. `gateway:pre-restart` inclut le même contexte, mais ne se déclenche que lorsque l’arrêt fait partie d’un redémarrage attendu et qu’une valeur finie de `restartExpectedMs` est fournie. Pendant l’arrêt, l’attente de chaque point d’accroche de cycle de vie est effectuée au mieux et bornée afin que l’arrêt continue si un gestionnaire se bloque.

Entre l’événement `gateway:shutdown` (ou `gateway:pre-restart`) et le reste de la séquence d’arrêt, le gateway déclenche également un point d’accroche de Plugin typé `session_end` pour chaque session encore active lorsque le processus s’est arrêté. Le `reason` de l’événement est `shutdown` pour un arrêt SIGTERM/SIGINT simple et `restart` lorsque la fermeture a été planifiée dans le cadre d’un redémarrage attendu. Cette vidange est bornée afin qu’un gestionnaire `session_end` lent ne puisse pas bloquer la sortie du processus, et les sessions déjà finalisées par remplacement / réinitialisation / suppression / Compaction sont ignorées afin d’éviter un double déclenchement.

## Découverte des points d’accroche

Les points d’accroche sont découverts à partir de ces répertoires, par ordre croissant de priorité de remplacement :

1. **Points d’accroche groupés** : livrés avec OpenClaw
2. **Points d’accroche de Plugin** : points d’accroche groupés dans les plugins installés
3. **Points d’accroche gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre espaces de travail). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Points d’accroche d’espace de travail** : `<workspace>/hooks/` (propres à l’agent, désactivés par défaut jusqu’à activation explicite)

Les points d’accroche d’espace de travail peuvent ajouter de nouveaux noms de points d’accroche, mais ne peuvent pas remplacer des points d’accroche groupés, gérés ou fournis par des plugins portant le même nom.

Le Gateway ignore la découverte des points d’accroche internes au démarrage tant que les points d’accroche internes ne sont pas configurés. Activez un point d’accroche groupé ou géré avec `openclaw hooks enable <name>`, installez un pack de points d’accroche ou définissez `hooks.internal.enabled=true` pour l’activer. Lorsque vous activez un point d’accroche nommé, le Gateway charge uniquement le gestionnaire de ce point d’accroche ; `hooks.internal.enabled=true`, les répertoires de points d’accroche supplémentaires et les gestionnaires hérités activent une découverte large.

### Packs de points d’accroche

Les packs de points d’accroche sont des packages npm qui exportent des points d’accroche via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom de package + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Points d’accroche groupés

| Point d’accroche     | Événements                                        | Ce qu’il fait                                                |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de session dans `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers d’amorçage supplémentaires depuis des motifs glob |
| command-logger        | `command`                                         | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications de chat visibles lorsque la Compaction de session commence/se termine |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du gateway                      |

Activez n’importe quel point d’accroche groupé :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant et les enregistre dans `<workspace>/memory/YYYY-MM-DD-HHMM.md` en utilisant la date locale de l’hôte. La capture de mémoire s’exécute en arrière-plan afin que les accusés de réception de `/new` et `/reset` ne soient pas retardés par les lectures de transcription ou la génération facultative de slug. Définissez `hooks.internal.entries.session-memory.llmSlug: true` pour générer des slugs de nom de fichier descriptifs avec le modèle configuré. Nécessite que `workspace.dir` soit configuré.

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

Les chemins se résolvent relativement à l’espace de travail. Seuls les noms de base d’amorçage reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande slash dans `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Détails de compaction-notifier

Envoie de courts messages d’état dans la conversation actuelle lorsque OpenClaw commence et termine la Compaction de la transcription de session. Cela rend les longs tours moins déroutants sur les surfaces de chat, car l’utilisateur peut voir que l’assistant résume le contexte et continuera après la Compaction.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage du gateway.

## Points d’accroche de Plugin

Les plugins peuvent enregistrer des points d’accroche typés via le SDK de Plugin pour une intégration plus profonde :
interception des appels d’outils, modification des prompts, contrôle du flux des messages, et plus encore.
Utilisez les points d’accroche de Plugin lorsque vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install` ou d’autres points d’accroche de cycle de vie dans le processus.

Pour la référence complète des points d’accroche de Plugin, consultez [Points d’accroche de Plugin](/fr/plugins/hooks).

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

Variables d’environnement par point d’accroche :

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

Répertoires de points d’accroche supplémentaires :

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
L’ancien format de configuration du tableau `hooks.internal.handlers` reste pris en charge pour la compatibilité ascendante, mais les nouveaux points d’accroche doivent utiliser le système fondé sur la découverte.
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

- **Gardez les gestionnaires rapides.** Les points d’accroche s’exécutent pendant le traitement des commandes. Lancez les tâches lourdes sans attente avec `void processInBackground(event)`.
- **Gérez les erreurs avec élégance.** Encapsulez les opérations risquées dans try/catch ; ne levez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type ou l’action de l’événement n’est pas pertinent.
- **Utilisez des clés d’événement spécifiques.** Préférez `"events": ["command:new"]` à `"events": ["command"]` pour réduire la surcharge.

## Dépannage

### Point d’accroche non découvert

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Point d’accroche non éligible

```bash
openclaw hooks info my-hook
```

Vérifiez l’absence de binaires manquants (PATH), de variables d’environnement, de valeurs de configuration ou de compatibilité avec l’OS.

### Point d’accroche non exécuté

1. Vérifiez que le point d’accroche est activé : `openclaw hooks list`
2. Redémarrez votre processus Gateway afin que les points d’accroche soient rechargés.
3. Consultez les journaux Gateway : `./scripts/clawlog.sh | grep hook`

## Connexe

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [hooks de Plugin](/fr/plugins/hooks) — points d’accroche de cycle de vie de Plugin dans le processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
