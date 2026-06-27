---
read_when:
    - Vous voulez une automatisation pilotée par les événements pour /new, /reset, /stop et les événements du cycle de vie de l’agent
    - Vous voulez créer, installer ou déboguer des points d’accroche
summary: 'Hooks : automatisation pilotée par les événements pour les commandes et les événements de cycle de vie'
title: Points d'accroche
x-i18n:
    generated_at: "2026-06-27T17:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Les hooks sont de petits scripts qui s’exécutent lorsqu’un événement se produit dans le Gateway. Ils peuvent être découverts à partir de répertoires et inspectés avec `openclaw hooks`. Le Gateway charge les hooks internes seulement après l’activation des hooks ou la configuration d’au moins une entrée de hook, un pack de hooks, un gestionnaire hérité ou un répertoire de hooks supplémentaire.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans le Gateway lorsque des événements d’agent sont déclenchés, comme `/new`, `/reset`, `/stop`, ou des événements de cycle de vie.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être inclus dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par des plugins.

## Choisir la bonne surface

OpenClaw propose plusieurs surfaces d’extension qui se ressemblent, mais résolvent des problèmes différents :

| Si vous voulez...                                                                                                              | Utilisez...                                    | Pourquoi                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Enregistrer un instantané sur `/new`, journaliser `/reset`, appeler une API externe après `message:sent`, ou ajouter une automatisation opérateur grossière | Hooks internes (`HOOK.md`, cette page)        | Les hooks fondés sur des fichiers sont destinés aux effets de bord gérés par l’opérateur et à l’automatisation des commandes ou du cycle de vie |
| Réécrire des prompts, bloquer des outils, annuler des messages sortants, ou ajouter un middleware/une politique ordonnés        | Hooks de plugin typés via `api.on(...)`       | Les hooks typés ont des contrats explicites, des priorités, des règles de fusion et une sémantique de blocage/annulation |
| Ajouter un export de télémétrie uniquement ou de l’observabilité                                                                | Événements de diagnostic                      | L’observabilité est un bus d’événements distinct, pas une surface de hook de politique                            |

Utilisez les hooks internes lorsque vous voulez une automatisation qui se comporte comme une petite intégration installée. Utilisez les hooks de plugin typés lorsque vous avez besoin de contrôler le cycle de vie à l’exécution.

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

| Événement                | Moment du déclenchement                                  |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Commande `/new` émise                                   |
| `command:reset`          | Commande `/reset` émise                                 |
| `command:stop`           | Commande `/stop` émise                                  |
| `command`                | Tout événement de commande (écouteur général)           |
| `session:compact:before` | Avant que la Compaction ne résume l’historique          |
| `session:compact:after`  | Après la fin de la Compaction                           |
| `session:patch`          | Lorsque les propriétés de session sont modifiées         |
| `agent:bootstrap`        | Avant l’injection des fichiers d’amorçage de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks |
| `gateway:shutdown`       | Lorsque l’arrêt du gateway commence                     |
| `gateway:pre-restart`    | Avant un redémarrage attendu du gateway                 |
| `message:received`       | Message entrant provenant de n’importe quel canal       |
| `message:transcribed`    | Après la fin de la transcription audio                  |
| `message:preprocessed`   | Après la fin ou l’omission du prétraitement des médias et des liens |
| `message:sent`           | Message sortant livré                                   |

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

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajoutez les réponses ici uniquement sur les surfaces pouvant recevoir une réponse), et `context` (données propres à l’événement). Les contextes de hook de plugin d’agent et d’outil peuvent aussi inclure `trace`, un contexte de trace de diagnostic compatible W3C en lecture seule que les plugins peuvent transmettre à des journaux structurés pour la corrélation OTEL.

`event.messages` est livré automatiquement uniquement sur les surfaces pouvant recevoir une réponse, comme
`command:*` et `message:received`. Les événements uniquement liés au cycle de vie, comme
`agent:bootstrap`, `session:*`, `gateway:*` ou `message:sent`, n’ont pas de
canal de réponse et ignorent les messages ajoutés.

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données propres au fournisseur, notamment `senderId`, `senderName`, `guildId`). `context.content` privilégie un corps de commande non vide pour les messages de type commande, puis se rabat sur le corps entrant brut et le corps générique ; il n’inclut pas les enrichissements réservés à l’agent, comme l’historique du fil ou les résumés de liens.

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps enrichi final), `context.from`, `context.channelId`.

**Événements d’amorçage** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de correctif de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de correctif.

**Événements de Compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’utilisateur qui émet `/stop` ; c’est un cycle de vie d’annulation/commande,
pas une barrière de finalisation d’agent. Les plugins qui doivent inspecter une
réponse finale naturelle et demander un passage supplémentaire à l’agent doivent utiliser le hook de
plugin typé `before_agent_finalize` à la place. Voir [Hooks de plugin](/fr/plugins/hooks).

**Événements de cycle de vie du Gateway** : `gateway:shutdown` inclut `reason` et `restartExpectedMs` et se déclenche lorsque l’arrêt du gateway commence. `gateway:pre-restart` inclut le même contexte, mais ne se déclenche que lorsque l’arrêt fait partie d’un redémarrage attendu et qu’une valeur finie de `restartExpectedMs` est fournie. Pendant l’arrêt, chaque attente de hook de cycle de vie est faite au mieux et bornée afin que l’arrêt continue si un gestionnaire se bloque. Le budget d’attente par défaut est de 5 secondes pour `gateway:shutdown` et de 10 secondes pour `gateway:pre-restart`.

Utilisez `gateway:pre-restart` pour de courts avis de redémarrage pendant que les canaux sont encore disponibles :

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Entre l’événement `gateway:shutdown` (ou `gateway:pre-restart`) et le reste de la séquence d’arrêt, le gateway déclenche aussi un hook de plugin typé `session_end` pour chaque session encore active lorsque le processus s’est arrêté. La valeur `reason` de l’événement est `shutdown` pour un arrêt SIGTERM/SIGINT simple et `restart` lorsque la fermeture a été planifiée dans le cadre d’un redémarrage attendu. Cette vidange est bornée afin qu’un gestionnaire `session_end` lent ne puisse pas bloquer la sortie du processus, et les sessions déjà finalisées par remplacement / réinitialisation / suppression / Compaction sont ignorées afin d’éviter un double déclenchement.

## Découverte des hooks

Les hooks sont découverts à partir de ces répertoires, par ordre de priorité de remplacement croissante :

1. **Hooks intégrés** : livrés avec OpenClaw
2. **Hooks de plugin** : hooks inclus dans les plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre les espaces de travail). Les répertoires supplémentaires provenant de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas remplacer les hooks intégrés, gérés ou fournis par un plugin portant le même nom.

Le Gateway ignore la découverte des hooks internes au démarrage tant que les hooks internes ne sont pas configurés. Activez un hook intégré ou géré avec `openclaw hooks enable <name>`, installez un pack de hooks, ou définissez `hooks.internal.enabled=true` pour vous inscrire. Lorsque vous activez un hook nommé, le Gateway charge uniquement le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent une découverte large.

### Packs de hooks

Les packs de hooks sont des packages npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom du package + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks intégrés

| Hook                  | Événements                                        | Ce qu’il fait                                                 |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de session dans `<workspace>/memory/`  |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers d’amorçage supplémentaires depuis des motifs glob |
| command-logger        | `command`                                         | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications de chat visibles quand la Compaction de session commence/se termine |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du Gateway                     |

Activez n’importe quel hook inclus :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant et les enregistre dans `<workspace>/memory/YYYY-MM-DD-HHMM.md` en utilisant la date locale de l’hôte. La capture de mémoire s’exécute en arrière-plan afin que les accusés de réception de `/new` et `/reset` ne soient pas retardés par la lecture de la transcription ou la génération facultative d’un slug. Définissez `hooks.internal.entries.session-memory.llmSlug: true` pour générer des slugs de noms de fichiers descriptifs avec le modèle configuré. Nécessite que `workspace.dir` soit configuré.

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

Envoie de courts messages d’état dans la conversation en cours quand OpenClaw commence et termine la Compaction de la transcription de session. Cela rend les longs tours moins déroutants sur les surfaces de chat, car l’utilisateur peut voir que l’assistant résume le contexte et continuera après la Compaction.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage du Gateway.

## Hooks de Plugin

Les plugins peuvent enregistrer des hooks typés via le Plugin SDK pour une intégration plus poussée :
interception des appels d’outils, modification des prompts, contrôle du flux de messages, et plus encore.
Utilisez les hooks de Plugin lorsque vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install` ou d’autres hooks de cycle de vie dans le processus.

Les hooks internes gérés par les plugins sont différents : ils participent au système
grossier d’événements de commande/cycle de vie de cette page et apparaissent dans `openclaw hooks list` sous la forme
`plugin:<id>`. Utilisez-les pour les effets de bord et la compatibilité avec les packs de hooks, pas
pour un middleware ordonné ou des portes de politique.

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
L’ancien format de configuration de tableau `hooks.internal.handlers` est toujours pris en charge pour la rétrocompatibilité, mais les nouveaux hooks doivent utiliser le système basé sur la découverte.
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

- **Gardez les gestionnaires rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les travaux lourds en mode sans attente avec `void processInBackground(event)`.
- **Gérez les erreurs avec élégance.** Encapsulez les opérations risquées dans try/catch ; ne levez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type/l’action de l’événement n’est pas pertinent.
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

Vérifiez les binaires manquants (PATH), les variables d’environnement, les valeurs de configuration ou la compatibilité avec l’OS.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus Gateway afin que les hooks soient rechargés.
3. Consultez les journaux du Gateway : `./scripts/clawlog.sh | grep hook`

## Associés

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/fr/plugins/hooks) — hooks de cycle de vie de Plugin dans le processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
