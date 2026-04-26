---
read_when:
    - Vous souhaitez une automatisation pilotée par événements pour `/new`, `/reset`, `/stop` et les événements du cycle de vie de l’agent
    - Vous souhaitez créer, installer ou déboguer des hooks
summary: 'Hooks : automatisation pilotée par événements pour les commandes et les événements du cycle de vie'
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

Les hooks sont de petits scripts qui s’exécutent lorsqu’un événement se produit dans la Gateway. Ils peuvent être découverts à partir de répertoires et inspectés avec `openclaw hooks`. La Gateway ne charge les hooks internes qu’après l’activation des hooks ou la configuration d’au moins une entrée de hook, d’un pack de hooks, d’un gestionnaire hérité ou d’un répertoire de hooks supplémentaire.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans la Gateway lorsque des événements d’agent se déclenchent, comme `/new`, `/reset`, `/stop` ou des événements du cycle de vie.
- **Webhooks** : points de terminaison HTTP externes permettant à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être inclus dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par des plugins.

## Démarrage rapide

```bash
# Lister les hooks disponibles
openclaw hooks list

# Activer un hook
openclaw hooks enable session-memory

# Vérifier l’état des hooks
openclaw hooks check

# Obtenir des informations détaillées
openclaw hooks info session-memory
```

## Types d’événements

| Événement                | Quand il se déclenche                           |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Commande `/new` émise                           |
| `command:reset`          | Commande `/reset` émise                         |
| `command:stop`           | Commande `/stop` émise                          |
| `command`                | Tout événement de commande (écouteur général)   |
| `session:compact:before` | Avant que la compaction résume l’historique     |
| `session:compact:after`  | Après la fin de la compaction                   |
| `session:patch`          | Lorsque les propriétés de session sont modifiées |
| `agent:bootstrap`        | Avant l’injection des fichiers bootstrap de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks |
| `message:received`       | Message entrant depuis n’importe quel canal     |
| `message:transcribed`    | Après la fin de la transcription audio          |
| `message:preprocessed`   | Après la fin de tout le traitement des médias et des liens |
| `message:sent`           | Message sortant remis                           |

## Écriture de hooks

### Structure d’un hook

Chaque hook est un répertoire contenant deux fichiers :

```
my-hook/
├── HOOK.md          # Métadonnées + documentation
└── handler.ts       # Implémentation du gestionnaire
```

### Format de `HOOK.md`

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

**Champs de métadonnées** (`metadata.openclaw`) :

| Champ      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji d’affichage pour le CLI                        |
| `events`   | Tableau des événements à écouter                     |
| `export`   | Export nommé à utiliser (par défaut `"default"`)     |
| `os`       | Plateformes requises (par ex. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou chemins `config` requis  |
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

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (y ajouter des éléments pour envoyer un message à l’utilisateur) et `context` (données propres à l’événement). Les contextes de hooks de plugins d’agent et d’outils peuvent aussi inclure `trace`, un contexte de trace diagnostique en lecture seule compatible W3C que les plugins peuvent transmettre à des journaux structurés pour la corrélation OTEL.

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données spécifiques au fournisseur, notamment `senderId`, `senderName`, `guildId`).

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps final enrichi), `context.from`, `context.channelId`.

**Événements bootstrap** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de patch de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de patch.

**Événements de compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’émission par l’utilisateur de `/stop` ; il s’agit du cycle de vie de la commande/de l’annulation, et non d’une porte de finalisation de l’agent. Les plugins qui doivent inspecter une réponse finale naturelle et demander à l’agent un passage supplémentaire doivent utiliser à la place le hook de plugin typé `before_agent_finalize`. Voir [Hooks de plugin](/fr/plugins/hooks).

## Découverte des hooks

Les hooks sont découverts à partir de ces répertoires, par ordre de priorité d’écrasement croissante :

1. **Hooks intégrés** : livrés avec OpenClaw
2. **Hooks de plugin** : hooks inclus dans les plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre les espaces de travail). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas écraser des hooks intégrés, gérés ou fournis par des plugins portant le même nom.

La Gateway ignore la découverte des hooks internes au démarrage tant que les hooks internes ne sont pas configurés. Activez un hook intégré ou géré avec `openclaw hooks enable <name>`, installez un pack de hooks, ou définissez `hooks.internal.enabled=true` pour choisir explicitement ce comportement. Lorsque vous activez un hook nommé, la Gateway ne charge que le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent une découverte large.

### Packs de hooks

Les packs de hooks sont des packages npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installation avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom du package + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks intégrés

| Hook                  | Événements                     | Ce qu’il fait                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Enregistre le contexte de session dans `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Injecte des fichiers bootstrap supplémentaires à partir de motifs glob |
| command-logger        | `command`                      | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Exécute `BOOT.md` au démarrage de la gateway          |

Activez n’importe quel hook intégré :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant, génère un slug de nom de fichier descriptif via un LLM, puis enregistre le tout dans `<workspace>/memory/YYYY-MM-DD-slug.md`. Nécessite que `workspace.dir` soit configuré.

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

Les chemins sont résolus relativement à l’espace de travail. Seuls les noms de base bootstrap reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande slash dans `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage de la gateway.

## Hooks de plugin

Les plugins peuvent enregistrer des hooks typés via le SDK Plugin pour une intégration plus poussée :
interception des appels d’outils, modification des prompts, contrôle du flux des messages, et plus encore.
Utilisez des hooks de plugin lorsque vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install` ou d’autres hooks de cycle de vie en processus.

Pour la référence complète des hooks de plugin, voir [Hooks de plugin](/fr/plugins/hooks).

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

Variables d’environnement par hook :

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

Répertoires de hooks supplémentaires :

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
L’ancien format de configuration par tableau `hooks.internal.handlers` est toujours pris en charge pour assurer la compatibilité descendante, mais les nouveaux hooks doivent utiliser le système fondé sur la découverte.
</Note>

## Référence CLI

```bash
# Lister tous les hooks (ajouter --eligible, --verbose ou --json)
openclaw hooks list

# Afficher des informations détaillées sur un hook
openclaw hooks info <hook-name>

# Afficher un résumé d’éligibilité
openclaw hooks check

# Activer/désactiver
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bonnes pratiques

- **Gardez les gestionnaires rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les tâches lourdes en mode fire-and-forget avec `void processInBackground(event)`.
- **Gérez les erreurs proprement.** Encadrez les opérations risquées dans des blocs try/catch ; ne levez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type/l’action de l’événement n’est pas pertinent.
- **Utilisez des clés d’événement spécifiques.** Préférez `"events": ["command:new"]` à `"events": ["command"]` pour réduire la surcharge.

## Dépannage

### Hook non découvert

```bash
# Vérifier la structure du répertoire
ls -la ~/.openclaw/hooks/my-hook/
# Doit afficher : HOOK.md, handler.ts

# Lister tous les hooks découverts
openclaw hooks list
```

### Hook non éligible

```bash
openclaw hooks info my-hook
```

Vérifiez les binaires manquants (PATH), les variables d’environnement, les valeurs de configuration ou la compatibilité du système d’exploitation.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus gateway afin de recharger les hooks.
3. Vérifiez les journaux de la gateway : `./scripts/clawlog.sh | grep hook`

## Lié

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Hooks de plugin](/fr/plugins/hooks) — hooks de cycle de vie des plugins en processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
