---
read_when:
    - Vous souhaitez une automatisation pilotée par les événements pour /new, /reset, /stop et les événements du cycle de vie de l’agent
    - Vous souhaitez créer, installer ou déboguer des hooks
summary: 'Hooks : automatisation pilotée par les événements pour les commandes et les événements du cycle de vie'
title: Hooks
x-i18n:
    generated_at: "2026-07-12T02:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Les hooks sont de petits scripts qui s’exécutent dans le Gateway lorsque des événements d’agent se déclenchent : des commandes comme `/new`, `/reset`, `/stop`, la Compaction de session, le cycle de vie du Gateway et le flux de messages. Ils sont découverts dans des répertoires et gérés avec `openclaw hooks`. Le Gateway ne charge les hooks internes qu’après l’activation des hooks ou la configuration d’au moins une entrée de hook, d’un paquet de hooks, d’un gestionnaire hérité ou d’un répertoire de hooks supplémentaire.

OpenClaw comporte deux types de hooks :

- **Hooks internes** (cette page) : s’exécutent dans le Gateway lorsque des événements d’agent se déclenchent.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher des tâches dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent également être intégrés à des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et ceux gérés par des plugins (affichés sous la forme `plugin:<id>`).

## Choisir l’interface appropriée

OpenClaw propose plusieurs interfaces d’extension qui semblent similaires, mais répondent à des besoins différents :

| Si vous souhaitez...                                                                                                                               | Utilisez...                                      | Pourquoi                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Enregistrer un instantané lors de `/new`, journaliser `/reset`, appeler une API externe après `message:sent` ou ajouter une automatisation générale pour l’opérateur | Hooks internes (`HOOK.md`, cette page)           | Les hooks basés sur des fichiers sont destinés aux effets secondaires gérés par l’opérateur et à l’automatisation des commandes et du cycle de vie |
| Réécrire les invites, bloquer des outils, annuler des messages sortants ou ajouter un intergiciel ou une politique ordonnés                         | Hooks de plugin typés via `api.on(...)`           | Les hooks typés disposent de contrats explicites, de priorités, de règles de fusion et d’une sémantique de blocage et d’annulation           |
| Ajouter uniquement une exportation de télémétrie ou de l’observabilité                                                                              | Événements de diagnostic                          | L’observabilité utilise un bus d’événements distinct, et non une interface de hooks de politique                                             |

Utilisez les hooks internes lorsque vous souhaitez une automatisation se comportant comme une petite intégration installée. Utilisez les hooks de plugin typés lorsque vous avez besoin de contrôler le cycle de vie de l’exécution.

## Démarrage rapide

```bash
# Répertorier les hooks disponibles
openclaw hooks list

# Activer un hook
openclaw hooks enable session-memory

# Vérifier l’état des hooks
openclaw hooks check

# Obtenir des informations détaillées
openclaw hooks info session-memory
```

## Types d’événements

Les hooks s’abonnent à une clé précise de ce tableau ou au nom d’une famille seule
(`command`, `session`, `agent`, `gateway`, `message`) pour recevoir toutes les actions
de cette famille. Le cœur d’OpenClaw n’émet rien d’autre ; tout autre nom est donc presque
toujours une faute de frappe qui laisse silencieusement le hook inactif (seul un plugin
émettant un événement personnalisé pourrait le déclencher). Le chargeur de hooks journalise
un avertissement pour ces noms (par exemple `command:nwe`) et `openclaw hooks info <name>`
les signale ; un hook qui ne s’exécute jamais peut donc être diagnostiqué.

| Événement                | Moment du déclenchement                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `command:new`            | Émission de la commande `/new`                                   |
| `command:reset`          | Émission de la commande `/reset`                                 |
| `command:stop`           | Émission de la commande `/stop`                                  |
| `command`                | Tout événement de commande (écouteur général)                    |
| `session:compact:before` | Avant que la Compaction résume l’historique                       |
| `session:compact:after`  | Après la fin de la Compaction                                    |
| `session:patch`          | Lorsque les propriétés de la session sont modifiées              |
| `agent:bootstrap`        | Avant l’injection des fichiers d’amorçage de l’espace de travail  |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks          |
| `gateway:shutdown`       | Au début de l’arrêt du Gateway                                   |
| `gateway:pre-restart`    | Avant un redémarrage prévu du Gateway                            |
| `message:received`       | Message entrant provenant de n’importe quel canal                |
| `message:transcribed`    | Après la fin de la transcription audio                           |
| `message:preprocessed`   | Après la fin ou l’omission du prétraitement des médias et liens  |
| `message:sent`           | Tentative d’envoi sortant (`context.success` contient le résultat) |

## Écriture de hooks

### Structure d’un hook

Chaque hook est un répertoire contenant deux fichiers :

```text
my-hook/
├── HOOK.md          # Métadonnées + documentation
└── handler.ts       # Implémentation du gestionnaire
```

Le fichier du gestionnaire peut être `handler.ts`, `handler.js`, `index.ts` ou `index.js`.

### Format de HOOK.md

```markdown
---
name: my-hook
description: "Brève description de la fonction de ce hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mon hook

La documentation détaillée se trouve ici.
```

**Champs de métadonnées** (`metadata.openclaw`) :

| Champ      | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `emoji`    | Émoji affiché dans la CLI                                         |
| `events`   | Tableau des événements à écouter                                  |
| `export`   | Exportation nommée à utiliser (valeur par défaut : `"default"`)   |
| `os`       | Plateformes requises (par exemple `["darwin", "linux"]`)          |
| `requires` | Chemins `bins`, `anyBins`, `env` ou `config` requis               |
| `always`   | Ignore les vérifications d’éligibilité (booléen)                  |
| `hookKey`  | Remplacement de la clé de configuration (nom du hook par défaut)  |
| `homepage` | URL de documentation affichée par `openclaw hooks info`           |
| `install`  | Méthodes d’installation                                           |

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

Chaque événement comprend : `type`, `action`, `sessionKey`, `timestamp`, `messages` et `context` (données propres à l’événement). Les contextes de hooks de plugin typés pour les hooks d’agent et d’outil peuvent également inclure `trace`, un contexte de trace de diagnostic en lecture seule compatible avec W3C que les plugins peuvent transmettre aux journaux structurés pour établir une corrélation OTEL.

Les chaînes ajoutées à `event.messages` ne sont renvoyées à la conversation que pour
`command:new` et `command:reset` (acheminées comme réponse à la conversation
d’origine), ainsi que pour `session:compact:before` et `session:compact:after`
(envoyées comme notifications d’état de la Compaction). Tous les autres événements, notamment
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` et
`gateway:*`, ignorent les messages ajoutés.

### Principaux éléments du contexte des événements

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Événements de commande** (`command:stop`) : `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données propres au fournisseur, notamment `senderId`, `senderName`, `guildId`). `context.content` privilégie un corps de commande non vide pour les messages de type commande, puis utilise à défaut le corps entrant brut et le corps générique ; il n’inclut pas les enrichissements réservés à l’agent, comme l’historique du fil ou les résumés de liens.

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`, ainsi que `context.error` en cas d’échec de l’envoi.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps final enrichi), `context.from`, `context.channelId`.

**Événements d’amorçage** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau modifiable), `context.agentId`.

**Événements de modification de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de modification ; le contexte étant une copie, les gestionnaires ne peuvent pas modifier l’entrée de session active.

**Événements de Compaction** : `session:compact:before` comprend `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observe l’émission de `/stop` par l’utilisateur ; il relève du cycle de vie
de l’annulation ou de la commande, et non d’une étape de finalisation de l’agent. Les plugins
qui doivent examiner une réponse finale naturelle et demander à l’agent d’effectuer un passage
supplémentaire doivent plutôt utiliser le hook de plugin typé `before_agent_finalize`. Voir
[Hooks de plugin](/fr/plugins/hooks).

**Événements du cycle de vie du Gateway** : `gateway:shutdown` comprend `reason` et `restartExpectedMs` et se déclenche au début de l’arrêt du Gateway. `gateway:pre-restart` comprend le même contexte, mais ne se déclenche que lorsque l’arrêt fait partie d’un redémarrage prévu et qu’une valeur finie de `restartExpectedMs` est fournie. Pendant l’arrêt, l’attente de chaque hook du cycle de vie est effectuée au mieux et limitée dans le temps, afin que l’arrêt se poursuive si un gestionnaire se bloque. Le délai d’attente par défaut est de 5 secondes pour `gateway:shutdown` et de 10 secondes pour `gateway:pre-restart`.

Utilisez `gateway:pre-restart` pour envoyer de brèves notifications de redémarrage pendant que les canaux sont encore disponibles :

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

Entre l’événement `gateway:shutdown` (ou `gateway:pre-restart`) et la suite de la séquence d’arrêt, le Gateway déclenche également un hook de plugin typé `session_end` pour chaque session encore active au moment de l’arrêt du processus. La valeur `reason` de l’événement est `shutdown` pour un arrêt simple par SIGTERM/SIGINT et `restart` lorsque la fermeture a été planifiée dans le cadre d’un redémarrage prévu. Cette phase de vidage est limitée dans le temps afin qu’un gestionnaire `session_end` lent ne puisse pas bloquer la fin du processus, et les sessions déjà finalisées par remplacement, réinitialisation, suppression ou Compaction sont ignorées pour éviter un double déclenchement.

## Découverte des hooks

Les hooks sont découverts depuis quatre sources :

1. **Hooks intégrés** : fournis avec OpenClaw
2. **Hooks de plugin** : intégrés aux plugins installés ; peuvent remplacer les hooks intégrés portant le même nom
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur et partagés entre les espaces de travail) ; peuvent remplacer les hooks intégrés et les hooks de plugin. Les répertoires supplémentaires définis dans `hooks.internal.load.extraDirs` ont la même priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (propres à chaque agent, désactivés par défaut jusqu’à leur activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas remplacer les hooks intégrés, gérés ou fournis par des plugins portant le même nom.

Au démarrage, le Gateway ignore la découverte des hooks internes tant que ceux-ci ne sont pas configurés. Activez un hook intégré ou géré avec `openclaw hooks enable <name>`, installez un paquet de hooks ou définissez `hooks.internal.enabled=true` pour les activer. Lorsque vous activez un seul hook nommé, le Gateway charge uniquement le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent une découverte étendue.

### Paquets de hooks

Les paquets de hooks sont des paquets npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom du paquet + version exacte facultative ou balise de distribution). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les anciennes commandes `openclaw hooks install` et `openclaw hooks update` sont des alias obsolètes de `openclaw plugins install` / `openclaw plugins update`.

## Hooks intégrés

| Hook                  | Événements                                        | Fonction                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de la session dans `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers d’amorçage supplémentaires à partir de motifs glob |
| command-logger        | `command`                                         | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications visibles dans la conversation au début et à la fin de la Compaction de la session |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du Gateway                      |

Activez n’importe quel hook intégré :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les derniers messages de l’utilisateur et de l’assistant (15 par défaut, configurable avec `hooks.internal.entries.session-memory.messages`) et les enregistre dans `<workspace>/memory/YYYY-MM-DD-HHMM.md` en utilisant la date locale de l’hôte. La capture de la mémoire s’exécute en arrière-plan afin que les accusés de réception de `/new` et `/reset` ne soient pas retardés par la lecture des transcriptions ou la génération facultative d’identifiants descriptifs. Définissez `hooks.internal.entries.session-memory.llmSlug: true` pour générer des identifiants descriptifs dans les noms de fichiers, et définissez éventuellement `hooks.internal.entries.session-memory.model` sur un alias configuré tel que `sonnet`, un identifiant de modèle seul du fournisseur par défaut de l’agent ou une référence `provider/model`. La génération d’identifiants utilise le modèle par défaut de l’agent lorsque `model` est omis et se rabat sur des identifiants d’horodatage lorsqu’elle n’est pas disponible. Nécessite la configuration de `workspace.dir`.

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

`patterns` et `files` sont acceptés comme alias de `paths`. Les chemins sont résolus relativement à l’espace de travail et doivent rester à l’intérieur de celui-ci. Seuls les noms de base de fichiers d’amorçage reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande oblique sous forme de ligne JSON (horodatage, action, clé de session, identifiant de l’expéditeur, source) dans `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Détails de compaction-notifier

Envoie de courts messages d’état dans la conversation en cours lorsqu’OpenClaw commence et termine la Compaction de la transcription de la session. Cela rend les longues interactions moins déroutantes dans les interfaces de conversation, car l’utilisateur peut voir que l’assistant résume le contexte et poursuivra après la Compaction.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` au démarrage du Gateway pour chaque périmètre d’agent configuré, si le fichier existe dans l’espace de travail résolu de cet agent.

## Hooks de Plugin

Les Plugins peuvent enregistrer des hooks typés via le SDK de Plugin pour une intégration plus poussée :
interception des appels d’outils, modification des invites, contrôle du flux des messages, etc.
Utilisez les hooks de Plugin lorsque vous avez besoin de `before_tool_call`, `before_agent_reply`,
`before_install` ou d’autres hooks de cycle de vie exécutés dans le processus.

Les hooks internes gérés par les Plugins sont différents : ils participent au système
général d’événements de commande et de cycle de vie de cette page et apparaissent dans
`openclaw hooks list` sous la forme `plugin:<id>`. Utilisez-les pour les effets secondaires
et la compatibilité avec les ensembles de hooks, et non comme intergiciels ordonnés ou
points de contrôle des politiques.

Pour consulter la référence complète des hooks de Plugin, voir [Hooks de Plugin](/fr/plugins/hooks).

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

Les valeurs d’environnement propres à chaque hook satisfont aux contrôles d’éligibilité `requires.env` du hook (en complément de l’environnement du processus), et les gestionnaires peuvent les lire dans l’entrée de configuration du hook :

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
L’ancien format de configuration sous forme de tableau `hooks.internal.handlers` reste pris en charge pour assurer la rétrocompatibilité, mais les nouveaux hooks doivent utiliser le système fondé sur la découverte.
</Note>

## Référence de la CLI

```bash
# Répertorier tous les hooks (ajouter --eligible, --verbose ou --json)
openclaw hooks list

# Afficher des informations détaillées sur un hook
openclaw hooks info <hook-name>

# Afficher le résumé de l’éligibilité
openclaw hooks check

# Activer/désactiver
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bonnes pratiques

- **Veillez à la rapidité des gestionnaires.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les tâches lourdes en arrière-plan sans attendre leur résultat avec `void processInBackground(event)`.
- **Gérez les erreurs avec précaution.** Encapsulez les opérations risquées dans un bloc try/catch ; ne levez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez rapidement les événements.** Effectuez immédiatement un retour si le type ou l’action de l’événement n’est pas pertinent.
- **Utilisez des clés d’événement précises.** Préférez `"events": ["command:new"]` à `"events": ["command"]` afin de réduire la surcharge.

## Dépannage

### Hook non découvert

```bash
# Vérifier la structure du répertoire
ls -la ~/.openclaw/hooks/my-hook/
# Doit afficher : HOOK.md, handler.ts

# Répertorier tous les hooks découverts
openclaw hooks list
```

### Hook non éligible

```bash
openclaw hooks info my-hook
```

Vérifiez si des exécutables (PATH), des variables d’environnement ou des valeurs de configuration sont manquants, ou si le système d’exploitation est compatible.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez le processus de votre Gateway afin de recharger les hooks.
3. Consultez les journaux du Gateway : `openclaw logs --follow | grep -i hook`

## Contenu associé

- [Référence de la CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/fr/plugins/hooks) — hooks du cycle de vie des Plugins exécutés dans le processus
- [Configuration](/fr/gateway/configuration-reference#hooks)
