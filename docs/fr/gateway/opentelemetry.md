---
read_when:
    - Vous souhaitez envoyer l’utilisation des modèles OpenClaw, le flux de messages ou les métriques de session à un collecteur OpenTelemetry
    - Vous raccordez des traces, des métriques ou des journaux à Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des noms de spans ou des formes d’attributs pour créer des tableaux de bord ou des alertes
summary: Exporter les diagnostics OpenClaw vers des collecteurs OpenTelemetry ou stdout JSONL via le Plugin diagnostics-otel
title: Exportation OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:01:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte les diagnostics via le plugin officiel `diagnostics-otel`
en utilisant **OTLP/HTTP (protobuf)**. Les journaux peuvent aussi être écrits sous forme de JSONL stdout pour
les pipelines de journaux de conteneurs et de sandbox. Tout collecteur ou backend acceptant
OTLP/HTTP fonctionne sans modification du code. Pour les journaux de fichiers locaux et la façon de les lire,
voir [Journalisation](/fr/logging).

## Comment l’ensemble s’articule

- Les **événements de diagnostic** sont des enregistrements structurés en processus émis par le
  Gateway et les plugins intégrés pour les exécutions de modèle, le flux de messages, les sessions, les files d’attente,
  et exec.
- Le **plugin `diagnostics-otel`** s’abonne à ces événements et les exporte sous forme de
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP. Il peut
  aussi dupliquer les enregistrements de journaux de diagnostic vers du JSONL stdout.
- Les **appels fournisseur** reçoivent un en-tête W3C `traceparent` depuis le contexte
  de span d’appel de modèle fiable d’OpenClaw lorsque le transport du fournisseur accepte les en-têtes
  personnalisés. Le contexte de trace émis par le plugin n’est pas propagé.
- Les exportateurs ne s’attachent que lorsque la surface de diagnostic et le plugin sont
  activés, de sorte que le coût en processus reste proche de zéro par défaut.

## Démarrage rapide

Pour les installations empaquetées, installez d’abord le plugin :

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
`protocol` prend actuellement en charge uniquement `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal        | Ce qu’il contient                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l’utilisation des jetons, le coût, la durée d’exécution, le basculement, l’utilisation des Skills, le flux de messages, les événements Talk, les voies de file d’attente, l’état/la récupération de session, l’exécution d’outils, les charges utiles surdimensionnées, exec et la pression mémoire. |
| **Traces**    | Spans pour l’utilisation de modèle, les appels de modèle, le cycle de vie du harness, l’utilisation des Skills, l’exécution d’outils, exec, le traitement webhook/message, l’assemblage du contexte et les boucles d’outils.        |
| **Journaux**  | Enregistrements structurés `logging.file` exportés via OTLP ou JSONL stdout lorsque `diagnostics.otel.logs` est activé ; les corps de journal sont retenus sauf si la capture de contenu est explicitement activée.                |

Activez ou désactivez `traces`, `metrics` et `logs` indépendamment. Les traces et les métriques
sont activées par défaut lorsque `diagnostics.otel.enabled` vaut true. Les journaux sont désactivés par défaut et
ne sont exportés que lorsque `diagnostics.otel.logs` vaut explicitement `true`. L’exportation des journaux
utilise OTLP par défaut ; définissez `diagnostics.otel.logsExporter` sur `stdout` pour du JSONL sur
stdout, ou sur `both` pour envoyer chaque enregistrement de journal de diagnostic vers OTLP et stdout.

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

### Variables d’environnement

| Variable                                                                                                          | Objectif                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements de points de terminaison propres aux signaux utilisés lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n’est pas définie. La configuration propre au signal l’emporte sur l’env propre au signal, qui l’emporte sur le point de terminaison partagé.                                                                                           |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole filaire (seul `http/protobuf` est honoré aujourd’hui).                                                                                                                                                                                                                                                                                                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre la dernière forme expérimentale des spans d’inférence GenAI, y compris les noms de span `{gen_ai.operation.name} {gen_ai.request.model}`, le type de span `CLIENT` et `gen_ai.provider.name` au lieu de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés et de faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu’un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le plugin ignore alors son propre cycle de vie NodeSDK, mais câble tout de même les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`.                                                                                                                     |

## Confidentialité et capture de contenu

Le contenu brut du modèle/de l’outil n’est **pas** exporté par défaut. Les spans transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, ids de requête sous forme de hachage uniquement,
source de l’outil, propriétaire de l’outil et nom/source de Skills) et n’incluent jamais le texte du prompt,
le texte de réponse, les entrées d’outil, les sorties d’outil, les chemins de fichiers de Skills ni les clés de session.
Par défaut, les enregistrements de journaux OTLP conservent la gravité, le logger, l’emplacement dans le code, le contexte de trace fiable
et les attributs nettoyés, mais le corps brut du message de journal n’est exporté
que lorsque `diagnostics.otel.captureContent` est défini sur le booléen `true`. Les sous-clés granulaires
`captureContent.*` n’activent pas les corps de journaux. Les labels qui ressemblent à
des clés de session d’agent à portée sont remplacés par `unknown`.
Les métriques Talk exportent uniquement des métadonnées d’événements bornées telles que le mode, le transport,
le fournisseur et le type d’événement. Elles n’incluent pas les transcriptions, les charges utiles audio,
les ids de session, les ids de tour, les ids d’appel, les ids de salle ni les jetons de transfert.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent`. Cet en-tête est
généré uniquement à partir du contexte de trace de diagnostic détenu par OpenClaw pour l’appel de modèle actif.
Les en-têtes `traceparent` fournis par l’appelant existant sont remplacés, de sorte que les plugins ou
les options de fournisseur personnalisées ne peuvent pas usurper l’ascendance de trace interservices.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et
votre politique de conservation sont approuvés pour le texte de prompt, de réponse, d’outil ou de prompt système.
Chaque sous-clé est activée indépendamment :

- `inputMessages` - contenu du prompt utilisateur.
- `outputMessages` - contenu de la réponse du modèle.
- `toolInputs` - charges utiles des arguments d’outil.
- `toolOutputs` - charges utiles des résultats d’outil.
- `systemPrompt` - prompt système/développeur assemblé.
- `toolDefinitions` - noms, descriptions et schémas des outils du modèle.

Lorsqu’une sous-clé est activée, les spans de modèle et d’outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés pour cette classe uniquement. Utilisez le booléen
`captureContent: true` uniquement pour les captures de diagnostics larges où les corps des messages de journaux OTLP
sont aussi approuvés pour l’exportation.

Le contenu `toolInputs`/`toolOutputs` est capturé pour les exécutions d’outils du runtime d’agent intégré
(`openclaw.content.tool_input` sur les spans terminés/en erreur,
`openclaw.content.tool_output` sur les spans terminés). Les appels d’outils de harness externes
(Codex, Claude CLI) émettent des spans `tool.execution.*` sans charges utiles de contenu.
Le contenu capturé circule sur un canal fiable, réservé aux écouteurs, et n’est jamais placé
sur le bus public d’événements de diagnostic.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau du journal fichier). Ils utilisent le
  chemin de rédaction des enregistrements de journal de diagnostic, pas le formatage console. Les installations à fort volume
  devraient privilégier l’échantillonnage/filtrage du collecteur OTLP plutôt que l’échantillonnage local.
  Définissez `diagnostics.otel.logsExporter: "stdout"` lorsque votre plateforme
  expédie déjà stdout/stderr vers un processeur de journaux et que vous n’avez pas de collecteur de journaux OTLP.
  Les enregistrements stdout sont un objet JSON par ligne avec `ts`, `signal`,
  `service.name`, la sévérité, le corps, les attributs expurgés et les champs de trace fiables
  lorsqu’ils sont disponibles.
- **Corrélation des journaux fichier :** les journaux fichier JSONL incluent `traceId`,
  `spanId`, `parentSpanId` et `traceFlags` au niveau supérieur lorsque l’appel de journal porte un contexte
  de trace de diagnostic valide, ce qui permet aux processeurs de journaux de joindre les lignes de journal locales aux
  spans exportés.
- **Corrélation des requêtes :** les requêtes HTTP Gateway et les trames WebSocket créent une
  portée de trace de requête interne. Les journaux et événements de diagnostic dans cette portée
  héritent par défaut de la trace de requête, tandis que les spans d’exécution d’agent et d’appel de modèle sont
  créés comme enfants afin que les en-têtes `traceparent` du fournisseur restent sur la même trace.
- **Corrélation des appels de modèle :** les spans `openclaw.model.call` incluent par défaut les tailles sûres des composants de prompt
  et incluent les attributs de jetons par appel lorsque le résultat du
  fournisseur expose l’utilisation. `openclaw.model.usage` reste le span de comptabilisation au niveau de l’exécution
  pour les tableaux de bord agrégés de coût, de contexte et de canal ; il reste
  sur la même trace de diagnostic lorsque le runtime émetteur possède un contexte de trace fiable.

## Métriques exportées

### Utilisation du modèle

- `openclaw.tokens` (compteur, attrs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attrs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attrs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique des conventions sémantiques GenAI, attrs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique des conventions sémantiques GenAI, attrs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)
- `openclaw.model_call.duration_ms` (histogramme, attrs : `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` et `openclaw.failureKind` sur les erreurs classifiées)
- `openclaw.model_call.request_bytes` (histogramme, taille en octets UTF-8 de la charge utile finale de requête au modèle ; aucun contenu brut de charge utile)
- `openclaw.model_call.response_bytes` (histogramme, taille en octets UTF-8 des charges utiles des fragments de réponse diffusés ; les deltas de texte, de réflexion et d’appel d’outil à haute fréquence ne comptent que les octets `delta` incrémentiels ; aucun contenu brut de réponse)
- `openclaw.model_call.time_to_first_byte_ms` (histogramme, temps écoulé avant le premier événement de réponse diffusé)
- `openclaw.model.failover` (compteur, attrs : `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (compteur, attrs : `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` facultatif, `openclaw.toolName` facultatif)

### Flux de messages

- `openclaw.webhook.received` (compteur, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attrs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (compteur, attrs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (compteur, attrs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (compteur, attrs : `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (compteur, attrs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attrs : `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (compteur, attrs : `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogramme, attrs : identiques à `openclaw.talk.event` ; émis lorsqu’un événement Talk signale une durée)
- `openclaw.talk.audio.bytes` (histogramme, attrs : identiques à `openclaw.talk.event` ; émis pour les événements de trames audio Talk qui signalent une longueur en octets)

### Files d’attente et sessions

- `openclaw.queue.lane.enqueue` (compteur, attrs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attrs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attrs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attrs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attrs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attrs : `openclaw.state` ; émis pour la comptabilité de session obsolète récupérable)
- `openclaw.session.stuck_age_ms` (histogramme, attrs : `openclaw.state` ; émis pour la comptabilité de session obsolète récupérable)
- `openclaw.session.turn.created` (compteur, attrs : `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (compteur, attrs : `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (compteur, attrs : `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogramme, attrs : identiques au compteur de récupération correspondant)
- `openclaw.run.attempt` (compteur, attrs : `openclaw.attempt`)

### Télémétrie de vivacité de session

`diagnostics.stuckSessionWarnMs` est le seuil d’âge sans progression pour les diagnostics
de vivacité de session. Une session `processing` ne vieillit pas vers ce seuil
tant qu’OpenClaw observe une progression de réponse, d’outil, de statut, de bloc ou de runtime ACP.
Les keepalives de frappe ne sont pas comptés comme une progression, de sorte qu’un modèle ou un harness silencieux peut
toujours être détecté.

OpenClaw classe les sessions selon le travail qu’il peut encore observer :

- `session.long_running` : travail intégré actif, appels de modèle ou appels d’outil
  continuant de progresser. Les appels de modèle possédés qui restent silencieux au-delà de
  `diagnostics.stuckSessionWarnMs` sont également signalés comme longue durée avant
  `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs de modèles lents ou non diffusés ne
  ressemblent pas à des sessions Gateway bloquées tant qu’ils restent observables pour abandon.
- `session.stalled` : un travail actif existe, mais l’exécution active n’a pas signalé
  de progression récente. Les appels de modèle possédés passent de `session.long_running` à
  `session.stalled` à partir de `diagnostics.stuckSessionAbortMs` ; l’activité
  obsolète de modèle/outil sans propriétaire n’est pas traitée comme un travail longue durée inoffensif.
  Les exécutions intégrées bloquées restent d’abord en observation seule, puis passent en abandon-vidange après
  `diagnostics.stuckSessionAbortMs` sans progression afin que les tours en file derrière la
  lane puissent reprendre. Lorsqu’il n’est pas défini, le seuil d’abandon prend par défaut la fenêtre
  étendue plus sûre d’au moins 5 minutes et 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck` : comptabilité de session obsolète sans travail actif, ou session
  en file inactive avec activité obsolète de modèle/outil sans propriétaire. Cela libère la
  lane de session affectée immédiatement après le passage des barrières de récupération.

La récupération émet des événements structurés `session.recovery.requested` et
`session.recovery.completed`. L’état de session de diagnostic est marqué inactif
uniquement après un résultat de récupération mutant (`aborted` ou `released`) et uniquement si la
même génération de traitement est encore actuelle.

Seul `session.stuck` émet le compteur `openclaw.session.stuck`, l’histogramme
`openclaw.session.stuck_age_ms` et le span `openclaw.session.stuck`.
Les diagnostics `session.stuck` répétés appliquent un délai progressif tant que la session reste
inchangée, les tableaux de bord devraient donc alerter sur les augmentations soutenues plutôt qu’à chaque
tick Heartbeat. Pour le réglage de configuration et les valeurs par défaut, consultez
[Référence de configuration](/fr/gateway/configuration-reference#diagnostics).

Les avertissements de vivacité émettent également :

- `openclaw.liveness.warning` (compteur, attrs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogramme, attrs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogramme, attrs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogramme, attrs : `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogramme, attrs : `openclaw.liveness.reason`)

### Cycle de vie du harness

- `openclaw.harness.duration_ms` (histogramme, attrs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sur les erreurs)

### Exécution des outils

- `openclaw.tool.execution.duration_ms` (histogramme, attrs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, plus `openclaw.errorCategory` sur les erreurs)
- `openclaw.tool.execution.blocked` (compteur, attrs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogramme, attrs : `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internes de diagnostics (mémoire et boucle d’outils)

- `openclaw.payload.large` (compteur, attrs : `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogramme, attrs : identiques à `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histogramme, attrs : `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogramme)
- `openclaw.memory.pressure` (compteur, attrs : `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (compteur, attrs : `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogramme, attrs : `openclaw.toolName`, `openclaw.outcome`)

## Spans exportés

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` et `openclaw.failureKind` facultatif en cas d’erreurs
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (tailles de composants sûres uniquement, aucun texte de prompt)
  - `openclaw.model_call.usage.*` et `gen_ai.usage.*` lorsque le résultat de l’appel de modèle contient l’utilisation du fournisseur pour cet appel individuel
  - `openclaw.provider.request_id_hash` (hachage borné basé sur SHA de l’identifiant de requête du fournisseur amont ; les identifiants bruts ne sont pas exportés)
  - Avec `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, les spans d’appel de modèle utilisent le dernier nom de span d’inférence GenAI `{gen_ai.operation.name} {gen_ai.request.model}` et le type de span `CLIENT` au lieu de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À l’achèvement : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu de prompt, d’historique, de réponse ou de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ni sortie d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture du contenu est explicitement activée, les spans de modèle et d’outil peuvent également
inclure des attributs bornés et expurgés `openclaw.content.*` pour les classes de
contenu spécifiques que vous avez activées.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et les spans ci-dessus. Les Plugins peuvent également s’y abonner
directement sans export OTLP.

**Utilisation du modèle**

- `model.usage` - jetons, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilisation fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel du prompt/contexte et peut être inférieur à
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
  cycle de vie par exécution pour le harness d’agent. Inclut `harnessId`, `pluginId`
  facultatif, fournisseur/modèle/canal et identifiant d’exécution. L’achèvement ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`,
  et les compteurs `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, et
  `cleanupFailed` facultatif.

**Exec**

- `exec.process.completed` - résultat terminal, durée, cible, mode, code de
  sortie et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.

## Sans exporter

Vous pouvez garder les événements de diagnostic disponibles pour les Plugins ou des collecteurs personnalisés sans
exécuter `diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans augmenter `logging.level`, utilisez les indicateurs de diagnostic.
Les indicateurs sont insensibles à la casse et prennent en charge les jokers (par exemple `telegram.*` ou
`*`) :

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou comme surcharge d’environnement ponctuelle :

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La sortie des indicateurs est envoyée au fichier journal standard (`logging.file`) et reste
expurgée par `logging.redactSensitive`. Guide complet :
[Indicateurs de diagnostic](/fr/diagnostics/flags).

## Désactiver

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Vous pouvez également retirer `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Connexe

- [Journalisation](/fr/logging) - journaux de fichiers, sortie console, suivi CLI et onglet Logs de Control UI
- [Internes de journalisation du Gateway](/fr/gateway/logging) - styles de journaux WS, préfixes de sous-systèmes et capture de console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) - indicateurs de journaux de débogage ciblés
- [Export des diagnostics](/fr/gateway/diagnostics) - outil de bundle de support opérateur (séparé de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) - référence complète des champs `diagnostics.*`
