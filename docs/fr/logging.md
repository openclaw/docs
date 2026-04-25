---
read_when:
    - Vous avez besoin d’une vue d’ensemble de la journalisation adaptée aux débutants
    - Vous voulez configurer les niveaux ou formats de journalisation
    - Vous faites du dépannage et devez trouver rapidement les journaux
summary: 'Vue d’ensemble de la journalisation : journaux de fichiers, sortie console, suivi CLI et interface de contrôle'
title: Vue d’ensemble de la journalisation
x-i18n:
    generated_at: "2026-04-25T13:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Journalisation

OpenClaw possède deux principales surfaces de journalisation :

- **Journaux de fichiers** (lignes JSON) écrits par la Gateway.
- **Sortie console** affichée dans les terminaux et l’interface Gateway Debug.

L’onglet **Logs** de l’interface de contrôle suit le journal de fichier de la gateway. Cette page explique où
se trouvent les journaux, comment les lire et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, la Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte de la gateway.

Vous pouvez remplacer cela dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Comment lire les journaux

### CLI : suivi en direct (recommandé)

Utilisez la CLI pour suivre le fichier journal de la gateway via RPC :

```bash
openclaw logs --follow
```

Options utiles actuelles :

- `--local-time` : afficher les horodatages dans votre fuseau horaire local
- `--url <url>` / `--token <token>` / `--timeout <ms>` : drapeaux RPC Gateway standard
- `--expect-final` : drapeau d’attente de réponse finale RPC adossé à un agent (accepté ici via la couche client partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, jolies et colorées.
- **Sessions non TTY** : texte brut.
- `--json` : JSON délimité par lignes (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement les identifiants de configuration ou
d’environnement ; incluez vous-même `--token` si la Gateway cible
requiert une auth.

En mode JSON, la CLI émet des objets balisés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indices de troncature / rotation
- `raw` : ligne de journal non analysée

Si la Gateway local loopback demande un appairage, `openclaw logs` revient automatiquement
au fichier journal local configuré. Les cibles `--url` explicites n’utilisent pas ce fallback.

Si la Gateway est inaccessible, la CLI affiche un court indice pour exécuter :

```bash
openclaw doctor
```

### Interface de contrôle (web)

L’onglet **Logs** de l’interface de contrôle suit le même fichier en utilisant `logs.tail`.
Voir [/web/control-ui](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux de canal uniquement

Pour filtrer l’activité de canal (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journal

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface de contrôle analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

### Sortie console

Les journaux console sont **adaptés au TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par ex. `gateway/channels/whatsapp`)
- Coloration par niveau (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket Gateway

`openclaw gateway` possède aussi une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : seulement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style de rendu verbeux
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurer la journalisation

Toute la configuration de journalisation se trouve sous `logging` dans `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Niveaux de journalisation

- `logging.level` : niveau des **journaux de fichiers** (JSONL).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` n’affecte que la sortie console et la verbosité des journaux WS ; il ne change pas
les niveaux des journaux de fichiers.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial pour l’humain, coloré, avec horodatages.
- `compact` : sortie plus serrée (meilleur pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Masquage

Les résumés d’outils peuvent masquer les tokens sensibles avant qu’ils n’atteignent la console :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut

Le masquage n’affecte que la **sortie console** et ne modifie pas les journaux de fichiers.

## Diagnostics + OpenTelemetry

Les diagnostics sont des événements structurés et lisibles par machine pour les exécutions de modèles **et**
la télémétrie de flux de messages (Webhooks, mise en file, état de session). Ils ne **remplacent pas**
les journaux ; ils existent pour alimenter les métriques, les traces et d’autres exportateurs.

Les événements de diagnostic sont émis dans le processus, mais les exportateurs ne sont attachés que lorsque
les diagnostics + le Plugin exportateur sont activés.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)** : le modèle de données + les SDK pour les traces, métriques et journaux.
- **OTLP** : le protocole de transport utilisé pour exporter les données OTel vers un collecteur/backend.
- OpenClaw exporte aujourd’hui via **OTLP/HTTP (protobuf)**.

### Signaux exportés

- **Métriques** : compteurs + histogrammes (utilisation des tokens, flux de messages, mise en file).
- **Traces** : spans pour l’usage du modèle + le traitement des Webhooks/messages.
- **Journaux** : exportés via OTLP lorsque `diagnostics.otel.logs` est activé. Le volume de
  journaux peut être élevé ; gardez `logging.level` et les filtres de l’exportateur à l’esprit.

### Catalogue des événements de diagnostic

Utilisation du modèle :

- `model.usage` : tokens, coût, durée, contexte, fournisseur/modèle/canal, ID de session.

Flux de messages :

- `webhook.received` : entrée de Webhook par canal.
- `webhook.processed` : Webhook traité + durée.
- `webhook.error` : erreurs du gestionnaire de Webhook.
- `message.queued` : message mis en file pour traitement.
- `message.processed` : résultat + durée + erreur facultative.
- `message.delivery.started` : début d’une tentative de distribution sortante.
- `message.delivery.completed` : fin d’une tentative de distribution sortante + durée/nombre de résultats.
- `message.delivery.error` : échec d’une tentative de distribution sortante + durée/catégorie d’erreur bornée.

File + session :

- `queue.lane.enqueue` : mise en file d’une lane de file de commandes + profondeur.
- `queue.lane.dequeue` : retrait de file d’une lane de file de commandes + temps d’attente.
- `session.state` : transition d’état de session + raison.
- `session.stuck` : avertissement de session bloquée + ancienneté.
- `run.attempt` : métadonnées de tentative/réessai d’exécution.
- `diagnostic.heartbeat` : compteurs agrégés (Webhooks/file/session).

Exec :

- `exec.process.completed` : résultat final du processus exec, durée, cible, mode,
  code de sortie et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.

### Activer les diagnostics (sans exportateur)

Utilisez ceci si vous voulez rendre les événements de diagnostic disponibles aux Plugins ou à des récepteurs personnalisés :

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Drapeaux de diagnostic (journaux ciblés)

Utilisez des drapeaux pour activer des journaux de débogage supplémentaires et ciblés sans augmenter `logging.level`.
Les drapeaux sont insensibles à la casse et prennent en charge les jokers (par ex. `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Remplacement par environnement (ponctuel) :

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Remarques :

- Les journaux de drapeaux vont dans le fichier journal standard (le même que `logging.file`).
- La sortie reste masquée selon `logging.redactSensitive`.
- Guide complet : [/diagnostics/flags](/fr/diagnostics/flags).

### Exporter vers OpenTelemetry

Les diagnostics peuvent être exportés via le Plugin `diagnostics-otel` (OTLP/HTTP). Cela
fonctionne avec tout collecteur/backend OpenTelemetry qui accepte OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Remarques :

- Vous pouvez aussi activer le Plugin avec `openclaw plugins enable diagnostics-otel`.
- `protocol` ne prend actuellement en charge que `http/protobuf`. `grpc` est ignoré.
- Les métriques incluent l’utilisation des tokens, le coût, la taille du contexte, la durée d’exécution et les
  compteurs/histogrammes de flux de messages (Webhooks, mise en file, état de session, profondeur/attente de file).
- Les traces/métriques peuvent être activées ou désactivées avec `traces` / `metrics` (par défaut : activé). Les traces
  incluent les spans d’utilisation du modèle ainsi que les spans de traitement Webhook/message lorsqu’ils sont activés.
- Le contenu brut modèle/outil n’est pas exporté par défaut. Utilisez
  `diagnostics.otel.captureContent` uniquement lorsque votre collecteur et votre politique de rétention
  sont approuvés pour le texte des prompts, réponses, outils ou prompt système.
- Définissez `headers` lorsque votre collecteur exige une auth.
- Variables d’environnement prises en charge : `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Définissez `OPENCLAW_OTEL_PRELOADED=1` lorsqu’un autre preload ou processus hôte a déjà
  enregistré le SDK OpenTelemetry global. Dans ce mode, le Plugin ne démarre pas
  et n’arrête pas son propre SDK, mais il connecte quand même les écouteurs de diagnostic OpenClaw et
  respecte `diagnostics.otel.traces`, `metrics` et `logs`.

### Métriques exportées (noms + types)

Utilisation du modèle :

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flux de messages :

- `openclaw.webhook.received` (compteur, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attributs : `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (compteur, attributs : `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attributs : `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attributs :
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Files + sessions :

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state`)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

Exec :

- `openclaw.exec.duration_ms` (histogramme, attributs : `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Spans exportés (noms + attributs clés)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Lorsque la capture de contenu est explicitement activée, les spans modèle/outil peuvent aussi inclure
des attributs `openclaw.content.*` bornés et masqués pour les classes de contenu
précises que vous avez choisies.

### Échantillonnage + flush

- Échantillonnage des traces : `diagnostics.otel.sampleRate` (0.0–1.0, spans racines uniquement).
- Intervalle d’export des métriques : `diagnostics.otel.flushIntervalMs` (min 1000 ms).

### Remarques sur le protocole

- Les points de terminaison OTLP/HTTP peuvent être définis via `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Si le point de terminaison contient déjà `/v1/traces` ou `/v1/metrics`, il est utilisé tel quel.
- Si le point de terminaison contient déjà `/v1/logs`, il est utilisé tel quel pour les journaux.
- `OPENCLAW_OTEL_PRELOADED=1` réutilise un SDK OpenTelemetry enregistré en externe
  pour les traces/métriques au lieu de démarrer un NodeSDK possédé par le Plugin.
- `diagnostics.otel.logs` active l’export OTLP des journaux pour la sortie du logger principal.

### Comportement d’export des journaux

- Les journaux OTLP utilisent les mêmes enregistrements structurés que ceux écrits dans `logging.file`.
- Respectent `logging.level` (niveau des journaux de fichiers). Le masquage console ne s’applique **pas**
  aux journaux OTLP.
- Les installations à fort volume doivent privilégier l’échantillonnage/le filtrage au niveau du collecteur OTLP.

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que la Gateway est en cours d’exécution et écrit dans le chemin de fichier
  défini dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace`, puis réessayez.

## Lié

- [Internes de la journalisation Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture console
- [Diagnostics](/fr/gateway/configuration-reference#diagnostics) — export OpenTelemetry et configuration des traces de cache
