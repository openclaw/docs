---
read_when:
    - Vous souhaitez envoyer les métriques d’utilisation des modèles, de flux de messages ou de sessions d’OpenClaw à un collecteur OpenTelemetry
    - Vous envoyez des traces, des métriques ou des journaux vers Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des spans ou de la structure des attributs pour créer des tableaux de bord ou des alertes
summary: Exportez les diagnostics d’OpenClaw vers des collecteurs OpenTelemetry ou au format JSONL sur la sortie standard grâce au Plugin diagnostics-otel
title: Exportation OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T02:52:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte les données de diagnostic via le plugin officiel `diagnostics-otel`
en utilisant **OTLP/HTTP (protobuf)**. Les journaux peuvent également être écrits au format JSONL sur stdout pour
les pipelines de journaux de conteneurs et de bacs à sable. Tout collecteur ou backend acceptant
OTLP/HTTP fonctionne sans modification du code. Pour les journaux dans des fichiers locaux, consultez
[Journalisation](/fr/logging).

- Les **événements de diagnostic** sont des enregistrements structurés, émis au sein du processus par le
  Gateway et les plugins intégrés pour les exécutions de modèles, le flux de messages, les sessions, les files d’attente
  et les exécutions de commandes.
- **`diagnostics-otel`** s’abonne à ces événements et les exporte sous forme de
  **métriques**, de **traces** et de **journaux** OpenTelemetry via OTLP/HTTP, et peut
  dupliquer les enregistrements de journal au format JSONL sur stdout.
- Les **appels aux fournisseurs** reçoivent un en-tête W3C `traceparent` provenant du
  contexte de segment d’appel de modèle approuvé d’OpenClaw lorsque le transport du fournisseur accepte les
  en-têtes personnalisés. Le contexte de trace émis par les plugins n’est pas propagé.
- Les exportateurs ne sont raccordés que lorsque la surface de diagnostic et le plugin sont tous deux
  activés, de sorte que le coût dans le processus reste presque nul par défaut.

## Démarrage rapide

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

Vous pouvez également activer le plugin depuis la CLI : `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` prend uniquement en charge `http/protobuf`. Comme `traces` et `metrics` sont activés par défaut, toute autre valeur (y compris `grpc`) interrompt l’intégralité de l’abonnement diagnostics-otel avec un avertissement `unsupported protocol` — cela arrête également l’exportation des journaux vers stdout. Définissez explicitement `traces: false` et `metrics: false` si vous souhaitez uniquement utiliser `logsExporter: "stdout"` avec une valeur de protocole non-OTLP.
</Note>

## Signaux exportés

| Signal        | Contenu                                                                                                                                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs/histogrammes pour l’utilisation des jetons, le coût, la durée d’exécution, le basculement, l’utilisation des Skills, le flux de messages, les événements Talk, les voies de file d’attente, l’état/la récupération des sessions, l’exécution des outils et des commandes, la mémoire, l’état de fonctionnement et la santé de l’exportateur. |
| **Traces**    | Segments pour l’utilisation des modèles, les appels de modèles, le cycle de vie du harnais, l’utilisation des Skills, l’exécution des outils et des commandes, le traitement des webhooks/messages, l’assemblage du contexte et les boucles d’outils.       |
| **Journaux**  | Enregistrements structurés `logging.file` exportés via OTLP ou au format JSONL sur stdout lorsque `diagnostics.otel.logs` est activé ; le corps des journaux est omis sauf si la capture du contenu est explicitement activée.                               |

Activez ou désactivez `traces`, `metrics` et `logs` indépendamment. Les traces et les métriques
sont activées par défaut lorsque `diagnostics.otel.enabled` vaut `true` ; les journaux sont désactivés par défaut
et ne sont exportés que lorsque `diagnostics.otel.logs` vaut explicitement `true`. L’exportation des journaux
utilise OTLP par défaut ; définissez `diagnostics.otel.logsExporter` sur `stdout` pour obtenir du JSONL sur
stdout, ou sur `both` pour utiliser les deux.

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
      protocol: "http/protobuf", // grpc désactive l’exportation OTLP
      serviceName: "openclaw-gateway", // si non défini, utilise OTEL_SERVICE_NAME, puis "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // échantillonneur de segments racines, 0.0..1.0
      flushIntervalMs: 60000, // intervalle d’exportation des métriques (min. 1000 ms)
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

| Variable                                                                                                          | Rôle                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valeur de repli pour `diagnostics.otel.endpoint` lorsque la clé de configuration n’est pas définie.                                                                                                                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Valeurs de repli des points de terminaison propres à chaque signal, utilisées lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n’est pas définie. La configuration propre au signal prévaut sur la variable d’environnement propre au signal, qui prévaut elle-même sur le point de terminaison partagé.                                                                                |
| `OTEL_SERVICE_NAME`                                                                                               | Valeur de repli pour `diagnostics.otel.serviceName` lorsque la clé de configuration n’est pas définie. Le nom de service par défaut est `openclaw`.                                                                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valeur de repli pour le protocole de transmission lorsque `diagnostics.otel.protocol` n’est pas défini. Seul `http/protobuf` active l’exportation.                                                                                                                                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez cette variable sur `gen_ai_latest_experimental` pour émettre la forme la plus récente des segments d’inférence GenAI : noms de segment `{gen_ai.operation.name} {gen_ai.request.model}`, type de segment `CLIENT` et `gen_ai.provider.name` à la place de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs bornés et à faible cardinalité.                                      |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez cette variable sur `1` lorsqu’un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le plugin ignore alors son propre cycle de vie NodeSDK, mais raccorde toujours les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`.                                                                                                                                  |

## Confidentialité et capture du contenu

Le contenu brut des modèles et des outils n’est **pas** exporté par défaut. Les segments transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, identifiants de requête sous forme de hachage uniquement,
source de l’outil, propriétaire de l’outil, nom/source de la Skill) et n’incluent jamais le texte des invites,
le texte des réponses, les entrées des outils, les sorties des outils, les chemins de fichiers des Skills ni les clés de session.
Les valeurs ressemblant à des clés de session d’agent délimitées (par exemple, commençant par
`agent:`) sont remplacées par `unknown` dans les attributs à faible cardinalité. Par défaut, les enregistrements de journal
OTLP conservent la gravité, l’enregistreur, l’emplacement dans le code, le contexte de trace approuvé et
les attributs assainis ; le corps brut du message de journal n’est exporté que
lorsque `diagnostics.otel.captureContent` est le booléen `true`. Les sous-clés granulaires
`captureContent.*` n’activent jamais le corps des journaux. Les métriques Talk exportent uniquement
des métadonnées d’événement bornées (mode, transport, fournisseur, type d’événement), sans
transcriptions, charges utiles audio, identifiants de session, identifiants de tour, identifiants d’appel, identifiants de salon ni
jetons de transfert.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent` généré uniquement
à partir du contexte de trace de diagnostic appartenant à OpenClaw pour l’appel de modèle actif.
Les en-têtes `traceparent` existants fournis par l’appelant sont remplacés, de sorte que les plugins ou
les options personnalisées des fournisseurs ne puissent pas usurper l’ascendance des traces entre services.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur
et votre politique de conservation sont approuvés pour le texte des invites, des réponses, des outils ou
des invites système. Chaque sous-clé est indépendante :

- `inputMessages` — contenu de l’invite utilisateur.
- `outputMessages` — contenu de la réponse du modèle.
- `toolInputs` — charges utiles des arguments des outils.
- `toolOutputs` — charges utiles des résultats des outils.
- `systemPrompt` — invite système/développeur assemblée.
- `toolDefinitions` — noms, descriptions et schémas des outils du modèle.

Lorsqu’une sous-clé est activée, les segments de modèle et d’outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés pour cette catégorie uniquement.

<Note>
Le booléen `captureContent: true` active simultanément `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` et le corps des journaux OTLP, mais **pas** `systemPrompt` — définissez explicitement `captureContent.systemPrompt: true` si vous avez également besoin de l’invite système assemblée.
</Note>

Le contenu de `toolInputs`/`toolOutputs` est capturé pour les exécutions d’outils de l’environnement
d’exécution intégré de l’agent (`openclaw.content.tool_input` et
`gen_ai.tool.call.arguments` dans les segments terminés/en erreur ;
`openclaw.content.tool_output` et `gen_ai.tool.call.result` dans les segments terminés).
Les noms `openclaw.content.*` restent les noms d’attributs OpenClaw stables ;
les copies `gen_ai.tool.call.*` les reflètent pour les visualiseurs natifs semconv.
Les appels d’outils de harnais externes (Codex, Claude CLI) émettent des
segments `tool.execution.*` sans charges utiles de contenu. Le contenu capturé transite par un
canal approuvé réservé aux écouteurs et n’est jamais placé sur le bus public des événements
de diagnostic.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` définit un `TraceIdRatioBasedSampler`
  uniquement sur le span racine (`0.0` les ignore tous, `1.0` les conserve tous). Si cette
  option n’est pas définie, la valeur par défaut du SDK OpenTelemetry est utilisée (toujours actif).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (limité à un minimum de
  `1000`) ; si cette option n’est pas définie, la valeur par défaut d’exportation périodique du SDK est utilisée.
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau des journaux de fichier) et utilisent le
  mécanisme de caviardage des enregistrements de journal de diagnostic, et non le formatage de la console. Les installations
  à fort volume devraient privilégier l’échantillonnage ou le filtrage du collecteur OTLP plutôt que
  l’échantillonnage local. Définissez `diagnostics.otel.logsExporter: "stdout"` lorsque votre plateforme
  transmet déjà stdout/stderr à un processeur de journaux et que vous ne disposez d’aucun collecteur de journaux
  OTLP. Les enregistrements stdout contiennent un objet JSON par ligne avec `ts`, `signal`,
  `service.name`, le niveau de gravité, le corps, les attributs caviardés et les champs de trace
  fiables lorsqu’ils sont disponibles.
- **Corrélation des journaux de fichier :** les journaux de fichier JSONL incluent au niveau supérieur `traceId`,
  `spanId`, `parentSpanId` et `traceFlags` lorsque l’appel de journalisation comporte un contexte
  de trace de diagnostic valide, ce qui permet aux processeurs de journaux de relier les lignes de journaux locales aux
  spans exportés.
- **Corrélation des requêtes :** les requêtes HTTP et les trames WebSocket du Gateway créent
  une portée interne de trace de requête. Les journaux et les événements de diagnostic au sein de cette
  portée héritent par défaut de la trace de la requête, tandis que les spans d’exécution d’agent et d’appel
  de modèle sont créés comme enfants afin que les en-têtes `traceparent` du fournisseur restent sur la
  même trace.
- **Corrélation des appels de modèle :** les spans `openclaw.model.call` incluent par défaut la taille sûre
  des composants de l’invite et les attributs de jetons propres à chaque appel lorsque le résultat du fournisseur
  expose l’utilisation. `openclaw.model.usage` reste le span de comptabilisation
  au niveau de l’exécution pour les tableaux de bord agrégés des coûts, du contexte et des canaux, et
  demeure sur la même trace de diagnostic lorsque l’environnement d’exécution émetteur dispose d’un contexte
  de trace fiable.

## Métriques exportées

### Utilisation du modèle

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique des conventions sémantiques GenAI, attributs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique des conventions sémantiques GenAI, attributs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)
- `openclaw.model_call.duration_ms` (histogramme, attributs : `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ainsi que `openclaw.errorCategory` et `openclaw.failureKind` pour les erreurs classifiées)
- `openclaw.model_call.request_bytes` (histogramme, taille en octets UTF-8 de la charge utile finale de la requête au modèle ; aucun contenu brut de la charge utile)
- `openclaw.model_call.response_bytes` (histogramme, taille en octets UTF-8 des charges utiles des fragments de réponse diffusés ; pour le texte à haute fréquence, la réflexion et les deltas d’appel d’outil, seuls les octets `delta` incrémentiels sont comptabilisés ; aucun contenu brut de la réponse)
- `openclaw.model_call.time_to_first_byte_ms` (histogramme, temps écoulé avant le premier événement de réponse diffusé)
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

### Conversation vocale

- `openclaw.talk.event` (compteur, attributs : `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogramme, attributs : identiques à ceux de `openclaw.talk.event` ; émis lorsqu’un événement de conversation vocale indique une durée)
- `openclaw.talk.audio.bytes` (histogramme, attributs : identiques à ceux de `openclaw.talk.event` ; émis pour les événements de trame audio de conversation vocale qui indiquent une longueur en octets)

### Files d’attente et sessions

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state` ; émis pour une comptabilisation obsolète mais récupérable des sessions)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state` ; émis pour une comptabilisation obsolète mais récupérable des sessions)
- `openclaw.session.turn.created` (compteur, attributs : `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (compteur, attributs : `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (compteur, attributs : `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogramme, attributs : identiques à ceux du compteur de récupération correspondant)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

### Télémétrie de disponibilité des sessions

`diagnostics.stuckSessionWarnMs` est le seuil d’ancienneté sans progression pour les diagnostics
de disponibilité des sessions. Une session `processing` ne se rapproche pas de ce
seuil tant qu’OpenClaw observe une progression de la réponse, de l’outil, de l’état, du bloc ou de l’environnement d’exécution
ACP. Les signaux de maintien de la saisie ne comptent pas comme une progression ; un modèle ou
un harnais silencieux peut donc toujours être détecté.

OpenClaw classe les sessions selon le travail qu’il peut encore observer :

- `session.long_running` : le travail intégré actif, les appels de modèle ou les appels d’outil
  progressent encore. Les appels de modèle associés à un propriétaire qui restent silencieux au-delà de
  `diagnostics.stuckSessionWarnMs` sont également signalés comme étant de longue durée avant
  `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs de modèles lents ou sans diffusion
  ne ressemblent pas à des sessions du Gateway bloquées tant qu’une interruption reste observable.
- `session.stalled` : un travail actif existe, mais l’exécution active n’a pas signalé
  de progression récente. Les appels de modèle associés à un propriétaire passent de `session.long_running` à
  `session.stalled` à partir de `diagnostics.stuckSessionAbortMs` ; l’activité
  obsolète de modèle ou d’outil sans propriétaire n’est pas considérée comme un travail de longue durée inoffensif.
  Les exécutions intégrées bloquées restent d’abord en observation seule, puis sont interrompues et vidées après
  `diagnostics.stuckSessionAbortMs` sans progression, afin que les tours mis en file d’attente derrière
  la voie puissent reprendre. Si cette option n’est pas définie, le seuil d’interruption prend par défaut la fenêtre étendue
  plus sûre d’au moins 5 minutes et trois fois
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck` : comptabilisation obsolète de la session sans travail actif, ou session
  inactive en file d’attente avec une activité obsolète de modèle ou d’outil sans propriétaire. Cela libère la
  voie de session concernée immédiatement après la validation des barrières de récupération.

La récupération émet des événements structurés `session.recovery.requested` et
`session.recovery.completed`. L’état de diagnostic de la session n’est marqué comme inactif
qu’après un résultat de récupération modifiant l’état (`aborted` ou `released`) et uniquement si
la même génération de traitement est toujours actuelle.

Seul `session.stuck` émet le compteur `openclaw.session.stuck`, l’histogramme
`openclaw.session.stuck_age_ms` et le span `openclaw.session.stuck`.
Les diagnostics `session.stuck` répétés appliquent une temporisation exponentielle tant que la session reste
inchangée ; les tableaux de bord devraient donc déclencher une alerte en cas d’augmentation durable plutôt qu’à
chaque cycle du Heartbeat. Pour le paramètre de configuration et les valeurs par défaut, consultez la
[référence de configuration](/fr/gateway/configuration-reference#diagnostics).

Les avertissements de disponibilité émettent également :

- `openclaw.liveness.warning` (compteur, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogramme, attributs : `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogramme, attributs : `openclaw.liveness.reason`)

### Cycle de vie du harnais

- `openclaw.harness.duration_ms` (histogramme, attributs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en cas d’erreur)

### Exécution des outils et détection des boucles

- `openclaw.tool.execution.duration_ms` (histogramme, attributs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ainsi que `openclaw.errorCategory` en cas d’erreur)
- `openclaw.tool.execution.blocked` (compteur, attributs : `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (compteur, attributs : `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` facultatif ; émis lorsqu’une boucle répétitive d’appels d’outil est détectée)

### Exec

- `openclaw.exec.duration_ms` (histogramme, attributs : `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Fonctionnement interne des diagnostics (mémoire, charges utiles, état des exportateurs)

- `openclaw.payload.large` (compteur, attributs : `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogramme, attributs : identiques à ceux de `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogrammes, sans attribut ; échantillons de mémoire du processus)
- `openclaw.memory.pressure` (compteur, attributs : `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (compteur, attributs : `openclaw.diagnostic.async_queue.drop_class` ; abandons dus à la contre-pression de la file d’attente interne des diagnostics)
- `openclaw.telemetry.exporter.events` (compteur, attributs : `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` facultatif, `openclaw.errorCategory` facultatif ; autotélémétrie du cycle de vie et des défaillances de l’exportateur)

## Spans exportés

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (entrée/sortie/lecture du cache/écriture dans le cache/total)
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` et, facultativement, `openclaw.failureKind` en cas d’erreur
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (uniquement les tailles sûres des composants, sans texte de l’invite)
  - `openclaw.model_call.usage.*` et `gen_ai.usage.*` lorsque le résultat de l’appel au modèle contient les données d’utilisation du fournisseur pour cet appel individuel
  - Événement d’étendue `openclaw.provider.request` avec l’attribut `openclaw.upstreamRequestIdHash` (de taille limitée et fondé sur un hachage) lorsque le résultat du fournisseur en amont expose un identifiant de requête ; les identifiants bruts ne sont jamais exportés
  - Avec `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, les étendues d’appel au modèle utilisent le dernier nom d’étendue d’inférence GenAI `{gen_ai.operation.name} {gen_ai.request.model}` et le type d’étendue `CLIENT` au lieu de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À la fin : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En cas d’erreur : `openclaw.harness.phase`, `openclaw.errorCategory`, facultativement `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, facultativement `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Facultativement `openclaw.errorCategory`/`openclaw.errorCode` en cas d’erreur, `openclaw.deniedReason` et `openclaw.outcome=blocked` lorsque l’exécution est refusée par une stratégie ou le bac à sable
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu d’invite, d’historique, de réponse ou de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, facultativement `openclaw.loop.paired_tool` (aucun message de boucle, paramètre ou résultat d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, facultativement `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Lorsque la capture du contenu est explicitement activée, les étendues de modèle et d’outil peuvent également
inclure des attributs `openclaw.content.*` de taille limitée et expurgés pour les classes de
contenu spécifiques que vous avez choisi d’inclure.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et les étendues ci-dessus. Les Plugins peuvent également
s’y abonner directement sans exportation OTLP.

**Utilisation du modèle**

- `model.usage` - jetons, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilisation du fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel de l’invite/du contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque des entrées mises en cache ou des appels dans une boucle d’outils sont impliqués.

**Flux des messages**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**File d’attente et session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (compteurs agrégés : Webhooks/file d’attente/session)

**Cycle de vie du dispositif d’exécution**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cycle de vie de chaque exécution du dispositif d’exécution de l’agent. Inclut `harnessId`, facultativement
  `pluginId`, le fournisseur/modèle/canal et l’identifiant d’exécution. L’achèvement ajoute
  `durationMs`, `outcome`, facultativement `resultClassification`, `yieldDetected`
  et les compteurs `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` et
  facultativement `cleanupFailed`.

**Exécution**

- `exec.process.completed` - résultat final du terminal, durée, cible, mode, code
  de sortie et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.
- `exec.approval.followup_suppressed` - suivi d’approbation obsolète abandonné
  après la réassociation d’une session. Inclut `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` ou `gateway_preflight`)
  et l’horodatage du répartiteur. Les clés de session, les routes et le texte de la commande ne sont
  pas inclus.

## Sans exportateur

Conservez les événements de diagnostic à la disposition des Plugins ou des récepteurs personnalisés sans exécuter
`diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans augmenter `logging.level`, utilisez les indicateurs de diagnostic.
Les indicateurs ne sont pas sensibles à la casse et prennent en charge les caractères génériques (`telegram.*` ou
`*`) :

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou comme remplacement ponctuel par une variable d’environnement :

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La sortie des indicateurs est envoyée au fichier journal standard (`logging.file`) et reste
expurgée par `logging.redactSensitive`. Guide complet :
[Indicateurs de diagnostic](/fr/diagnostics/flags).

## Désactivation

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Vous pouvez également omettre `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Pages connexes

- [Journalisation](/fr/logging) - journaux de fichiers, sortie de la console, suivi via la CLI et onglet Journaux de l’interface de contrôle
- [Fonctionnement interne de la journalisation du Gateway](/fr/gateway/logging) - styles de journaux WS, préfixes des sous-systèmes et capture de la console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) - indicateurs ciblés pour les journaux de débogage
- [Exportation des diagnostics](/fr/gateway/diagnostics) - outil de création de paquets d’assistance pour les opérateurs (distinct de l’exportation OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) - référence complète des champs `diagnostics.*`
