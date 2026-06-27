---
read_when:
    - Vous souhaitez envoyer les métriques d’utilisation des modèles, de flux de messages ou de sessions d’OpenClaw à un collecteur OpenTelemetry
    - Vous connectez des traces, des métriques ou des journaux à Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des noms de spans ou de la forme des attributs pour créer des tableaux de bord ou des alertes.
summary: Exporter les diagnostics OpenClaw vers des collecteurs OpenTelemetry ou stdout JSONL via le Plugin diagnostics-otel
title: Exportation OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:32:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte les diagnostics via le plugin officiel `diagnostics-otel`
avec **OTLP/HTTP (protobuf)**. Les journaux peuvent aussi être écrits en JSONL stdout pour
les pipelines de journaux de conteneurs et de bacs à sable. Tout collecteur ou backend qui accepte
OTLP/HTTP fonctionne sans changement de code. Pour les journaux de fichiers locaux et la manière de les lire,
consultez [Journalisation](/fr/logging).

## Comment l'ensemble s'articule

- Les **événements de diagnostic** sont des enregistrements structurés, en cours de processus, émis par le
  Gateway et les plugins groupés pour les exécutions de modèles, le flux de messages, les sessions, les files d'attente,
  et exec.
- Le **plugin `diagnostics-otel`** s'abonne à ces événements et les exporte sous forme de
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP. Il peut
  également répliquer les enregistrements de journaux de diagnostic en JSONL stdout.
- Les **appels de fournisseurs** reçoivent un en-tête W3C `traceparent` provenant du contexte
  de span d'appel de modèle approuvé d'OpenClaw lorsque le transport du fournisseur accepte les en-têtes
  personnalisés. Le contexte de trace émis par un plugin n'est pas propagé.
- Les exportateurs ne s'attachent que lorsque la surface de diagnostics et le plugin sont tous deux
  activés, ce qui maintient le coût en cours de processus proche de zéro par défaut.

## Démarrage rapide

Pour les installations empaquetées, installez d'abord le plugin :

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Vous pouvez aussi activer le plugin depuis la CLI :

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ne prend actuellement en charge que `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal       | Ce qu'il contient                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l'utilisation des jetons, le coût, la durée d'exécution, le basculement, l'utilisation des Skills, le flux de messages, les événements Talk, les voies de file d'attente, l'état/la récupération de session, l'exécution d'outils, les charges utiles surdimensionnées, exec et la pression mémoire. |
| **Traces**   | Spans pour l'utilisation des modèles, les appels de modèles, le cycle de vie du harnais, l'utilisation des Skills, l'exécution d'outils, exec, le traitement des webhooks/messages, l'assemblage du contexte et les boucles d'outils.               |
| **Journaux** | Enregistrements structurés `logging.file` exportés via OTLP ou JSONL stdout lorsque `diagnostics.otel.logs` est activé ; les corps de journaux sont retenus sauf si la capture de contenu est explicitement activée.                              |

Activez ou désactivez `traces`, `metrics` et `logs` indépendamment. Les traces et les métriques
sont activées par défaut lorsque `diagnostics.otel.enabled` vaut true. Les journaux sont désactivés par défaut et
ne sont exportés que lorsque `diagnostics.otel.logs` vaut explicitement `true`. L'exportation des journaux
utilise OTLP par défaut ; définissez `diagnostics.otel.logsExporter` sur `stdout` pour du JSONL sur
stdout, ou sur `both` pour envoyer chaque enregistrement de journal de diagnostic à OTLP et stdout.

## Référence de configuration

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Variables d'environnement

| Variable                                                                                                          | Objectif                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements de point de terminaison propres à un signal, utilisés lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n'est pas définie. La configuration propre au signal prime sur l'env propre au signal, qui prime sur le point de terminaison partagé.                                                                                       |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole filaire (seul `http/protobuf` est pris en compte aujourd'hui).                                                                                                                                                                                                                                                                                      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre la dernière forme expérimentale de span d'inférence GenAI, notamment les noms de span `{gen_ai.operation.name} {gen_ai.request.model}`, le type de span `CLIENT` et `gen_ai.provider.name` au lieu de l'ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés à faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu'un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le plugin ignore alors son propre cycle de vie NodeSDK, mais connecte tout de même les écouteurs de diagnostics et respecte `traces`/`metrics`/`logs`.                                                                                                    |

## Confidentialité et capture de contenu

Le contenu brut des modèles/outils n'est **pas** exporté par défaut. Les spans transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d'erreur, identifiants de requête sous forme de hachage uniquement,
source de l'outil, propriétaire de l'outil et nom/source de Skill) et n'incluent jamais le texte du prompt,
le texte de réponse, les entrées d'outil, les sorties d'outil, les chemins de fichiers de Skill ni les clés de session.
Les enregistrements de journaux OTLP conservent par défaut la gravité, le logger, l'emplacement du code, le contexte de trace approuvé
et les attributs assainis, mais le corps brut du message de journal n'est exporté
que lorsque `diagnostics.otel.captureContent` est défini sur le booléen `true`. Les sous-clés granulaires
`captureContent.*` n'activent pas les corps de journaux. Les libellés qui ressemblent à des
clés de session d'agent délimitées sont remplacés par `unknown`.
Les métriques Talk exportent uniquement des métadonnées d'événement bornées comme le mode, le transport,
le fournisseur et le type d'événement. Elles n'incluent pas de transcriptions, charges audio,
identifiants de session, identifiants de tour, identifiants d'appel, identifiants de salon ni jetons de transfert.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent`. Cet en-tête est
généré uniquement à partir du contexte de trace de diagnostic détenu par OpenClaw pour l'appel de modèle actif.
Les en-têtes `traceparent` fournis par l'appelant existant sont remplacés, de sorte que les plugins ou
options de fournisseur personnalisées ne peuvent pas usurper l'ascendance de trace interservices.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et votre
politique de rétention sont approuvés pour le texte de prompt, de réponse, d'outil ou de prompt système.
Chaque sous-clé est activée indépendamment :

- `inputMessages` - contenu du prompt utilisateur.
- `outputMessages` - contenu de réponse du modèle.
- `toolInputs` - charges utiles d'arguments d'outil.
- `toolOutputs` - charges utiles de résultat d'outil.
- `systemPrompt` - prompt système/développeur assemblé.
- `toolDefinitions` - noms, descriptions et schémas des outils de modèle.

Lorsqu'une sous-clé est activée, les spans de modèle et d'outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés pour cette classe uniquement. Utilisez le booléen
`captureContent: true` uniquement pour les captures de diagnostics larges où les corps de messages de journaux OTLP
sont également approuvés pour l'exportation.

Le contenu `toolInputs`/`toolOutputs` est capturé pour les exécutions d'outils de l'environnement d'exécution d'agent intégré
(`openclaw.content.tool_input` sur les spans terminés/en erreur,
`openclaw.content.tool_output` sur les spans terminés). Les appels d'outils de harnais externes
(Codex, Claude CLI) émettent des spans `tool.execution.*` sans charges utiles de contenu.
Le contenu capturé transite sur un canal approuvé, réservé aux écouteurs, et n'est jamais placé
sur le bus public des événements de diagnostic.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau de journalisation fichier). Ils utilisent le
  chemin d'expurgation des enregistrements de journaux de diagnostic, pas le formatage de console. Les installations
  à fort volume devraient privilégier l'échantillonnage/filtrage du collecteur OTLP plutôt que l'échantillonnage local.
  Définissez `diagnostics.otel.logsExporter: "stdout"` lorsque votre plateforme expédie déjà
  stdout/stderr vers un processeur de journaux et que vous n'avez pas de collecteur de journaux OTLP.
  Les enregistrements stdout sont un objet JSON par ligne avec `ts`, `signal`,
  `service.name`, la gravité, le corps, les attributs expurgés et les champs de trace approuvés
  lorsqu'ils sont disponibles.
- **Corrélation des journaux de fichiers :** les journaux de fichiers JSONL incluent les champs de premier niveau `traceId`,
  `spanId`, `parentSpanId` et `traceFlags` lorsque l'appel de journal transporte un contexte de trace de diagnostic
  valide, ce qui permet aux processeurs de journaux de joindre les lignes de journaux locales aux
  spans exportés.
- **Corrélation des requêtes :** les requêtes HTTP du Gateway et les trames WebSocket créent une
  portée de trace de requête interne. Les journaux et événements de diagnostic à l'intérieur de cette portée
  héritent de la trace de requête par défaut, tandis que les spans d'exécution d'agent et d'appel de modèle sont
  créés comme enfants afin que les en-têtes `traceparent` du fournisseur restent sur la même trace.

## Métriques exportées

### Utilisation des modèles

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique des conventions sémantiques GenAI, attributs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique des conventions sémantiques GenAI, attributs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)
- `openclaw.model_call.duration_ms` (histogramme, attributs : `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` et `openclaw.failureKind` sur les erreurs classifiées)
- `openclaw.model_call.request_bytes` (histogramme, taille en octets UTF-8 de la charge utile finale de requête au modèle ; aucun contenu brut de charge utile)
- `openclaw.model_call.response_bytes` (histogramme, taille en octets UTF-8 des charges utiles des fragments de réponse diffusés en streaming ; le texte haute fréquence, les raisonnements et les deltas d’appel d’outil ne comptent que les octets `delta` incrémentiels ; aucun contenu brut de réponse)
- `openclaw.model_call.time_to_first_byte_ms` (histogramme, temps écoulé avant le premier événement de réponse diffusé en streaming)
- `openclaw.model.failover` (compteur, attributs : `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (compteur, attributs : `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` facultatif, `openclaw.toolName` facultatif)

### Flux des messages

- `openclaw.webhook.received` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attributs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (compteur, attributs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (compteur, attributs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (compteur, attributs : `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (compteur, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attributs : `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Conversation

- `openclaw.talk.event` (compteur, attributs : `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogramme, attributs : identiques à `openclaw.talk.event` ; émis lorsqu’un événement Conversation signale une durée)
- `openclaw.talk.audio.bytes` (histogramme, attributs : identiques à `openclaw.talk.event` ; émis pour les événements de trame audio Conversation qui signalent une longueur en octets)

### Files d’attente et sessions

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state` ; émis pour la comptabilité récupérable de session obsolète)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state` ; émis pour la comptabilité récupérable de session obsolète)
- `openclaw.session.turn.created` (compteur, attributs : `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (compteur, attributs : `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (compteur, attributs : `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogramme, attributs : identiques au compteur de récupération correspondant)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

### Télémétrie de vitalité des sessions

`diagnostics.stuckSessionWarnMs` est le seuil d’âge sans progression pour les diagnostics de vitalité des sessions. Une session `processing` ne vieillit pas vers ce seuil tant qu’OpenClaw observe une progression de réponse, d’outil, d’état, de bloc ou du runtime ACP. Les keepalives de saisie ne sont pas comptés comme une progression, ce qui permet toujours de détecter un modèle ou un harnais silencieux.

OpenClaw classe les sessions selon le travail qu’il peut encore observer :

- `session.long_running` : un travail intégré actif, des appels de modèle ou des appels d’outil continuent de progresser. Les appels de modèle possédés qui restent silencieux au-delà de `diagnostics.stuckSessionWarnMs` sont également signalés comme de longue durée avant `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs de modèles lents ou sans streaming ne ressemblent pas à des sessions Gateway bloquées tant qu’ils restent observables pour abandon.
- `session.stalled` : un travail actif existe, mais l’exécution active n’a pas signalé de progression récente. Les appels de modèle possédés passent de `session.long_running` à `session.stalled` à partir de `diagnostics.stuckSessionAbortMs` ; l’activité obsolète de modèle/outil sans propriétaire n’est pas traitée comme un travail de longue durée inoffensif. Les exécutions intégrées bloquées restent d’abord en observation seule, puis sont abandonnées et drainées après `diagnostics.stuckSessionAbortMs` sans progression afin que les tours en attente derrière la voie puissent reprendre. Lorsqu’il n’est pas défini, le seuil d’abandon utilise par défaut la fenêtre étendue plus sûre d’au moins 5 minutes et 3x `diagnostics.stuckSessionWarnMs`.
- `session.stuck` : comptabilité de session obsolète sans travail actif, ou session inactive en file d’attente avec activité obsolète de modèle/outil sans propriétaire. Cela libère immédiatement la voie de session affectée une fois les barrières de récupération franchies.

La récupération émet des événements structurés `session.recovery.requested` et `session.recovery.completed`. L’état de session de diagnostic est marqué comme inactif seulement après un résultat de récupération modifiant l’état (`aborted` ou `released`) et seulement si la même génération de traitement est toujours actuelle.

Seul `session.stuck` émet le compteur `openclaw.session.stuck`, l’histogramme `openclaw.session.stuck_age_ms` et le span `openclaw.session.stuck`. Les diagnostics `session.stuck` répétés appliquent un délai exponentiel tant que la session reste inchangée ; les tableaux de bord devraient donc alerter sur des augmentations soutenues plutôt que sur chaque tick de Heartbeat. Pour le bouton de configuration et les valeurs par défaut, consultez la [Référence de configuration](/fr/gateway/configuration-reference#diagnostics).

Les avertissements de vitalité émettent également :

- `openclaw.liveness.warning` (compteur, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogramme, attributs : `openclaw.liveness.reason`)

### Cycle de vie du harnais

- `openclaw.harness.duration_ms` (histogramme, attributs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sur les erreurs)

### Exécution des outils

- `openclaw.tool.execution.duration_ms` (histogramme, attributs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` sur les erreurs)
- `openclaw.tool.execution.blocked` (compteur, attributs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogramme, attributs : `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnostics internes (mémoire et boucle d’outils)

- `openclaw.payload.large` (compteur, attributs : `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogramme, attributs : identiques à `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogramme, attributs : `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogramme)
- `openclaw.memory.pressure` (compteur, attributs : `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (compteur, attributs : `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogramme, attributs : `openclaw.toolName`, `openclaw.outcome`)

## Spans exportés

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (entrée/sortie/cache_read/cache_write/total)
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` et `openclaw.failureKind` facultatif en cas d’erreur
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hachage borné basé sur SHA de l’identifiant de requête du fournisseur amont ; les identifiants bruts ne sont pas exportés)
  - Avec `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, les spans d’appel de modèle utilisent le dernier nom de span d’inférence GenAI `{gen_ai.operation.name} {gen_ai.request.model}` et le type de span `CLIENT` au lieu de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À la fin : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En cas d’erreur : `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` facultatif
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu d’invite, d’historique, de réponse ni de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ni sortie d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture de contenu est explicitement activée, les spans de modèle et d’outil peuvent aussi
inclure des attributs `openclaw.content.*` bornés et expurgés pour les classes de
contenu spécifiques que vous avez activées.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et spans ci-dessus. Les Plugins peuvent aussi s’y abonner
directement sans export OTLP.

**Utilisation du modèle**

- `model.usage` - jetons, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilité fournisseur/tour pour les coûts et la télémétrie ;
  `context.used` est l’instantané actuel de l’invite/du contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque des entrées mises en cache ou des appels de boucle d’outils sont impliqués.

**Flux de messages**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**File d’attente et session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (compteurs agrégés : webhooks/file d’attente/session)

**Cycle de vie du harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cycle de vie par exécution pour le harness de l’agent. Inclut `harnessId`, `pluginId` facultatif,
  le fournisseur/modèle/canal et l’identifiant d’exécution. L’achèvement ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`,
  et les compteurs `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, et
  `cleanupFailed` facultatif.

**Exec**

- `exec.process.completed` - résultat terminal, durée, cible, mode, code de sortie
  et type d’échec. Le texte de commande et les répertoires de travail ne sont pas
  inclus.

## Sans exporteur

Vous pouvez garder les événements de diagnostic disponibles pour les Plugins ou les récepteurs personnalisés sans
exécuter `diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans augmenter `logging.level`, utilisez les indicateurs de diagnostic.
Les indicateurs ne sont pas sensibles à la casse et prennent en charge les jokers (par exemple `telegram.*` ou
`*`) :

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou comme surcharge ponctuelle d’environnement :

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La sortie des indicateurs va dans le fichier journal standard (`logging.file`) et reste
expurgée par `logging.redactSensitive`. Guide complet :
[Indicateurs de diagnostic](/fr/diagnostics/flags).

## Désactiver

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Vous pouvez aussi omettre `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Connexe

- [Journalisation](/fr/logging) - journaux de fichier, sortie console, suivi CLI et onglet Journaux de la Control UI
- [Internes de journalisation du Gateway](/fr/gateway/logging) - styles de journaux WS, préfixes de sous-systèmes et capture console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) - indicateurs de journal de débogage ciblé
- [Export de diagnostic](/fr/gateway/diagnostics) - outil de paquet de support opérateur (distinct de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) - référence complète des champs `diagnostics.*`
