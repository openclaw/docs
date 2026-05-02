---
read_when:
    - Vous souhaitez envoyer l’utilisation des modèles OpenClaw, le flux de messages ou les métriques de session à un collecteur OpenTelemetry
    - Vous connectez des traces, des métriques ou des journaux à Grafana, Datadog, Honeycomb, New Relic, Tempo ou à une autre plateforme OTLP
    - Vous avez besoin des noms exacts des métriques, des noms exacts des portées ou de la structure des attributs pour créer des tableaux de bord ou des alertes
summary: Exporter les diagnostics OpenClaw vers n’importe quel collecteur OpenTelemetry via le plugin diagnostics-otel (OTLP/HTTP)
title: Export OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T07:07:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: be58bb48f06e72b5b08d21bf37c0dcc218be8e4c0030b074523794be01f2611a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte des diagnostics via le Plugin groupé `diagnostics-otel`
en utilisant **OTLP/HTTP (protobuf)**. Tout collecteur ou backend acceptant OTLP/HTTP
fonctionne sans modification de code. Pour les journaux de fichiers locaux et la façon de les lire, consultez
[Journalisation](/fr/logging).

## Comment l’ensemble s’articule

- Les **événements de diagnostic** sont des enregistrements structurés, en processus, émis par le
  Gateway et les plugins groupés pour les exécutions de modèle, le flux de messages, les sessions, les files d’attente
  et l’exécution.
- Le **Plugin `diagnostics-otel`** s’abonne à ces événements et les exporte sous forme de
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP.
- Les **appels fournisseur** reçoivent un en-tête W3C `traceparent` depuis le contexte de span
  d’appel de modèle de confiance d’OpenClaw lorsque le transport du fournisseur accepte les en-têtes
  personnalisés. Le contexte de trace émis par les Plugins n’est pas propagé.
- Les exporteurs ne s’attachent que lorsque la surface de diagnostics et le Plugin sont
  tous deux activés, de sorte que le coût en processus reste proche de zéro par défaut.

## Démarrage rapide

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

Vous pouvez aussi activer le Plugin depuis la CLI :

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` prend actuellement en charge uniquement `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal       | Ce qu’il contient                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l’utilisation des jetons, le coût, la durée d’exécution, le flux de messages, les voies de file d’attente, l’état de session, l’exécution et la pression mémoire. |
| **Traces**   | Spans pour l’utilisation de modèle, les appels de modèle, le cycle de vie du harness, l’exécution d’outils, l’exécution, le traitement des webhooks/messages, l’assemblage du contexte et les boucles d’outils. |
| **Journaux** | Enregistrements structurés `logging.file` exportés via OTLP lorsque `diagnostics.otel.logs` est activé.                                            |

Activez ou désactivez `traces`, `metrics` et `logs` indépendamment. Les trois sont activés par défaut
lorsque `diagnostics.otel.enabled` vaut true.

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
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Variables d’environnement

| Variable                                                                                                          | Objectif                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements de points de terminaison propres aux signaux, utilisés lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n’est pas définie. La configuration propre au signal prévaut sur l’environnement propre au signal, qui prévaut sur le point de terminaison partagé. |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole de transport (seul `http/protobuf` est pris en compte aujourd’hui).                                                                                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre le dernier attribut de span GenAI expérimental (`gen_ai.provider.name`) au lieu de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés et à faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu’un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le Plugin ignore alors son propre cycle de vie NodeSDK, mais câble toujours les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`. |

## Confidentialité et capture de contenu

Le contenu brut de modèle/outil n’est **pas** exporté par défaut. Les spans transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, identifiants de requête sous forme de hachage uniquement)
et n’incluent jamais le texte d’invite, le texte de réponse, les entrées d’outil, les sorties d’outil ni les
clés de session.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent`. Cet en-tête est
généré uniquement à partir du contexte de trace de diagnostic appartenant à OpenClaw pour l’appel de modèle
actif. Les en-têtes `traceparent` fournis par l’appelant existant sont remplacés, afin que les Plugins ou
options de fournisseur personnalisées ne puissent pas usurper une ascendance de trace interservices.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et
votre politique de rétention sont approuvés pour le texte d’invite, de réponse, d’outil ou d’invite système.
Chaque sous-clé est activée indépendamment :

- `inputMessages` — contenu de l’invite utilisateur.
- `outputMessages` — contenu de la réponse du modèle.
- `toolInputs` — charges utiles des arguments d’outil.
- `toolOutputs` — charges utiles des résultats d’outil.
- `systemPrompt` — invite système/développeur assemblée.

Lorsqu’une sous-clé est activée, les spans de modèle et d’outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés uniquement pour cette classe.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau du journal de fichier). Ils utilisent le
  chemin d’expurgation des enregistrements de journal de diagnostic, pas le formatage de console. Les installations à fort volume
  doivent privilégier l’échantillonnage/filtrage du collecteur OTLP plutôt que l’échantillonnage local.
- **Corrélation des journaux de fichiers :** les journaux de fichiers JSONL incluent `traceId`,
  `spanId`, `parentSpanId` et `traceFlags` au niveau supérieur lorsque l’appel de journal transporte un contexte de trace
  de diagnostic valide, ce qui permet aux processeurs de journaux de joindre les lignes de journal locales aux
  spans exportés.
- **Corrélation des requêtes :** les requêtes HTTP Gateway et les frames WebSocket créent une
  portée de trace de requête interne. Les journaux et événements de diagnostic dans cette portée
  héritent de la trace de requête par défaut, tandis que les spans d’exécution d’agent et d’appel de modèle sont
  créés comme enfants afin que les en-têtes `traceparent` du fournisseur restent sur la même trace.

## Métriques exportées

### Utilisation du modèle

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique de conventions sémantiques GenAI, attributs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique de conventions sémantiques GenAI, attributs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)
- `openclaw.model_call.duration_ms` (histogramme, attributs : `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` et `openclaw.failureKind` sur les erreurs classifiées)
- `openclaw.model_call.request_bytes` (histogramme, taille en octets UTF-8 de la charge utile finale de requête de modèle ; aucun contenu brut de charge utile)
- `openclaw.model_call.response_bytes` (histogramme, taille en octets UTF-8 des événements de réponse de modèle diffusés ; aucun contenu brut de réponse)
- `openclaw.model_call.time_to_first_byte_ms` (histogramme, temps écoulé avant le premier événement de réponse diffusé)

### Flux de messages

- `openclaw.webhook.received` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attributs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (compteur, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attributs : `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Files d’attente et sessions

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state` ; émis uniquement pour la comptabilité des sessions obsolètes sans travail actif)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state` ; émis uniquement pour la comptabilité des sessions obsolètes sans travail actif)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

### Télémétrie de disponibilité de session

`diagnostics.stuckSessionWarnMs` est le seuil d’âge sans progression pour les diagnostics de
disponibilité de session. Une session `processing` ne vieillit pas vers ce seuil
tant qu’OpenClaw observe une progression d’exécution de réponse, d’outil, d’état, de bloc ou ACP.
Les keepalives de saisie ne sont pas comptés comme progression, donc un modèle ou harness silencieux peut
toujours être détecté.

OpenClaw classe les sessions selon le travail qu’il peut encore observer :

- `session.long_running` : travail intégré actif, appels de modèle ou appels d’outils
  encore en cours de progression.
- `session.stalled` : un travail actif existe, mais l’exécution active n’a pas signalé
  de progression récente.
- `session.stuck` : comptabilité de session obsolète sans travail actif. C’est la
  seule classification de vivacité qui libère la lane de session affectée.

Seul `session.stuck` émet le compteur `openclaw.session.stuck`, l’histogramme
`openclaw.session.stuck_age_ms` et le span `openclaw.session.stuck`. Les diagnostics
`session.stuck` répétés appliquent un backoff tant que la session reste inchangée ;
les tableaux de bord devraient donc alerter sur des augmentations soutenues plutôt
que sur chaque tick de heartbeat. Pour le réglage de configuration et les valeurs
par défaut, consultez la
[référence de configuration](/fr/gateway/configuration-reference#diagnostics).

### Cycle de vie du harness

- `openclaw.harness.duration_ms` (histogramme, attributs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en cas d’erreurs)

### Exec

- `openclaw.exec.duration_ms` (histogramme, attributs : `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internes des diagnostics (mémoire et boucle d’outils)

- `openclaw.memory.heap_used_bytes` (histogramme, attributs : `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogramme)
- `openclaw.memory.pressure` (compteur, attributs : `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (compteur, attributs : `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogramme, attributs : `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.provider.request_id_hash` (hash borné basé sur SHA de l’id de requête du fournisseur amont ; les ids bruts ne sont pas exportés)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À la fin : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En cas d’erreur : `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` facultatif
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu de prompt, d’historique, de réponse ou de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ou résultat d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture de contenu est explicitement activée, les spans de modèle et
d’outil peuvent également inclure des attributs `openclaw.content.*` bornés et
expurgés pour les classes de contenu spécifiques que vous avez activées.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et spans ci-dessus. Les Plugins
peuvent aussi s’y abonner directement sans export OTLP.

**Utilisation du modèle**

- `model.usage` — jetons, coût, durée, contexte, fournisseur/modèle/canal,
  ids de session. `usage` est la comptabilité fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel du prompt/contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque de l’entrée mise en cache ou des appels de boucle d’outils sont impliqués.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cycle de vie par exécution pour le harness d’agent. Inclut `harnessId`, `pluginId`
  facultatif, fournisseur/modèle/canal, et id d’exécution. La fin ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`,
  et les décomptes `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, et
  `cleanupFailed` facultatif.

**Exec**

- `exec.process.completed` — résultat terminal, durée, cible, mode, code de sortie
  et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.

## Sans exporter

Vous pouvez conserver les événements de diagnostic disponibles pour les Plugins ou
les récepteurs personnalisés sans exécuter `diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans augmenter `logging.level`, utilisez les
indicateurs de diagnostic. Les indicateurs sont insensibles à la casse et prennent
en charge les jokers (par exemple `telegram.*` ou `*`) :

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou sous forme de remplacement ponctuel par variable d’environnement :

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La sortie des indicateurs va dans le fichier de journal standard (`logging.file`) et reste
expurgée par `logging.redactSensitive`. Guide complet :
[indicateurs de diagnostic](/fr/diagnostics/flags).

## Désactiver

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Vous pouvez aussi omettre `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Connexe

- [Journalisation](/fr/logging) — journaux de fichiers, sortie console, suivi CLI et onglet Logs de Control UI
- [Internes de journalisation Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-systèmes et capture de console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) — indicateurs de journaux de débogage ciblés
- [Export de diagnostics](/fr/gateway/diagnostics) — outil de bundle d’assistance opérateur (séparé de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
