---
read_when:
    - Vous souhaitez envoyer l’utilisation des modèles OpenClaw, le flux de messages ou les métriques de session à un collecteur OpenTelemetry
    - Vous connectez des traces, des métriques ou des journaux à Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des noms de spans ou des structures d’attributs pour créer des tableaux de bord ou des alertes
summary: Exporter les diagnostics OpenClaw vers tout collecteur OpenTelemetry via le Plugin diagnostics-otel (OTLP/HTTP)
title: Export OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:33:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte les diagnostics via le plugin officiel `diagnostics-otel`
avec **OTLP/HTTP (protobuf)**. Tout collecteur ou backend qui accepte OTLP/HTTP
fonctionne sans modification de code. Pour les journaux de fichiers locaux et la façon de les lire, consultez
[Journalisation](/fr/logging).

## Comment l’ensemble s’articule

- Les **événements de diagnostic** sont des enregistrements structurés en processus émis par le
  Gateway et les plugins inclus pour les exécutions de modèles, le flux des messages, les sessions, les files d’attente
  et l’exécution.
- Le **plugin `diagnostics-otel`** s’abonne à ces événements et les exporte sous forme de
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP.
- Les **appels aux fournisseurs** reçoivent un en-tête W3C `traceparent` depuis le
  contexte de span d’appel de modèle de confiance d’OpenClaw lorsque le transport du fournisseur accepte les en-têtes
  personnalisés. Le contexte de trace émis par un plugin n’est pas propagé.
- Les exporteurs ne s’attachent que lorsque la surface de diagnostics et le plugin sont tous deux
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
`protocol` ne prend actuellement en charge que `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal       | Ce qu’il contient                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l’utilisation des jetons, le coût, la durée d’exécution, le flux des messages, les voies de file d’attente, l’état des sessions, l’exécution et la pression mémoire. |
| **Traces**   | Spans pour l’utilisation des modèles, les appels de modèles, le cycle de vie du harnais, l’exécution d’outils, l’exécution, le traitement Webhook/message, l’assemblage du contexte et les boucles d’outils. |
| **Journaux** | Enregistrements structurés `logging.file` exportés via OTLP lorsque `diagnostics.otel.logs` est activé.                                       |

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

| Variable                                                                                                          | Objectif                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements de points de terminaison propres aux signaux, utilisés lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n’est pas définie. La configuration propre au signal prime sur la variable d’environnement propre au signal, qui prime sur le point de terminaison partagé. |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole de transmission (seul `http/protobuf` est pris en compte aujourd’hui).                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre le dernier attribut expérimental de span GenAI (`gen_ai.provider.name`) au lieu de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés et à faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu’un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le plugin ignore alors son propre cycle de vie NodeSDK, mais connecte tout de même les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`. |

## Confidentialité et capture de contenu

Le contenu brut des modèles/outils n’est **pas** exporté par défaut. Les spans portent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, identifiants de requête sous forme de hachage uniquement)
et n’incluent jamais le texte des invites, le texte des réponses, les entrées d’outils, les sorties d’outils ni
les clés de session.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent`. Cet en-tête est
généré uniquement à partir du contexte de trace de diagnostic appartenant à OpenClaw pour l’appel de modèle
actif. Les en-têtes `traceparent` existants fournis par l’appelant sont remplacés, de sorte que les plugins ou
les options de fournisseur personnalisées ne peuvent pas falsifier l’ascendance de trace entre services.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et
votre politique de rétention sont approuvés pour le texte des invites, des réponses, des outils ou des invites système.
Chaque sous-clé est activée indépendamment :

- `inputMessages` — contenu d’invite utilisateur.
- `outputMessages` — contenu de réponse du modèle.
- `toolInputs` — charges utiles d’arguments d’outil.
- `toolOutputs` — charges utiles de résultats d’outil.
- `systemPrompt` — invite système/développeur assemblée.

Lorsqu’une sous-clé est activée, les spans de modèle et d’outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés pour cette classe uniquement.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau de journalisation du fichier). Ils utilisent le
  chemin d’expurgation des enregistrements de journal de diagnostic, et non le formatage console. Les installations à fort volume
  devraient privilégier l’échantillonnage/filtrage du collecteur OTLP plutôt que l’échantillonnage local.
- **Corrélation des journaux de fichiers :** les journaux de fichiers JSONL incluent `traceId`,
  `spanId`, `parentSpanId` et `traceFlags` au niveau supérieur lorsque l’appel de journal porte un contexte de trace
  de diagnostic valide, ce qui permet aux processeurs de journaux de joindre les lignes de journaux locales aux
  spans exportés.
- **Corrélation des requêtes :** les requêtes HTTP du Gateway et les trames WebSocket créent une
  portée de trace de requête interne. Les journaux et événements de diagnostic dans cette portée
  héritent par défaut de la trace de requête, tandis que les spans d’exécution d’agent et d’appel de modèle sont
  créés comme enfants afin que les en-têtes `traceparent` du fournisseur restent sur la même trace.

## Métriques exportées

### Utilisation des modèles

- `openclaw.tokens` (compteur, attrs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attrs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attrs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique de conventions sémantiques GenAI, attrs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique de conventions sémantiques GenAI, attrs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)
- `openclaw.model_call.duration_ms` (histogramme, attrs : `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` et `openclaw.failureKind` pour les erreurs classifiées)
- `openclaw.model_call.request_bytes` (histogramme, taille en octets UTF-8 de la charge utile finale de la requête de modèle ; aucun contenu brut de charge utile)
- `openclaw.model_call.response_bytes` (histogramme, taille en octets UTF-8 des événements de réponse de modèle diffusés ; aucun contenu brut de réponse)
- `openclaw.model_call.time_to_first_byte_ms` (histogramme, temps écoulé avant le premier événement de réponse diffusé)

### Flux des messages

- `openclaw.webhook.received` (compteur, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attrs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (compteur, attrs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attrs : `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attrs : `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Files d’attente et sessions

- `openclaw.queue.lane.enqueue` (compteur, attrs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attrs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attrs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attrs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attrs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attrs : `openclaw.state` ; émis uniquement pour la comptabilité des sessions obsolètes sans travail actif)
- `openclaw.session.stuck_age_ms` (histogramme, attrs : `openclaw.state` ; émis uniquement pour la comptabilité des sessions obsolètes sans travail actif)
- `openclaw.run.attempt` (compteur, attrs : `openclaw.attempt`)

### Télémétrie de disponibilité des sessions

`diagnostics.stuckSessionWarnMs` est le seuil d’âge sans progression pour les diagnostics
de disponibilité des sessions. Une session `processing` ne vieillit pas vers ce seuil
tant qu’OpenClaw observe une progression d’exécution de réponse, d’outil, d’état, de bloc ou d’ACP.
Les keepalives de saisie ne sont pas comptés comme progression, de sorte qu’un modèle ou un harnais silencieux peut
toujours être détecté.

OpenClaw classe les sessions selon le travail qu’il peut encore observer :

- `session.long_running` : travail intégré actif, appels au modèle ou appels d’outils
  encore en progression.
- `session.stalled` : un travail actif existe, mais l’exécution active n’a pas signalé
  de progression récente. Les exécutions intégrées bloquées restent d’abord en observation seule, puis
  passent en abandon-vidange après au moins 10 minutes et 5x `diagnostics.stuckSessionWarnMs`
  sans progression, afin que les tours en file derrière la voie puissent reprendre.
- `session.stuck` : comptabilité de session obsolète sans travail actif. Cela libère
  immédiatement la voie de session concernée.

Seul `session.stuck` émet le compteur `openclaw.session.stuck`, l’histogramme
`openclaw.session.stuck_age_ms` et le span `openclaw.session.stuck`.
Les diagnostics `session.stuck` répétés ralentissent tant que la session reste
inchangée ; les tableaux de bord doivent donc alerter sur des augmentations durables plutôt que sur chaque
tick Heartbeat. Pour le réglage de configuration et les valeurs par défaut, consultez la
[référence de configuration](/fr/gateway/configuration-reference#diagnostics).

### Cycle de vie du harnais

- `openclaw.harness.duration_ms` (histogramme, attributs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en cas d’erreurs)

### Exécution

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
  - `openclaw.tokens.*` (entrée/sortie/lecture_cache/écriture_cache/total)
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` et `openclaw.failureKind` facultatif en cas d’erreurs
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hachage limité basé sur SHA de l’identifiant de requête du fournisseur amont ; les identifiants bruts ne sont pas exportés)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À l’achèvement : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu d’invite, d’historique, de réponse ou de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ou résultat d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture de contenu est explicitement activée, les spans de modèle et d’outil peuvent aussi
inclure des attributs `openclaw.content.*` limités et expurgés pour les classes de
contenu spécifiques auxquelles vous avez souscrit.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et spans ci-dessus. Les Plugins peuvent aussi s’y abonner
directement sans export OTLP.

**Utilisation du modèle**

- `model.usage` — jetons, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilité fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel de l’invite/du contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque des entrées mises en cache ou des appels de boucle d’outils sont impliqués.

**Flux des messages**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**File et session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (compteurs agrégés : webhooks/file/session)

**Cycle de vie du harnais**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cycle de vie par exécution pour le harnais d’agent. Inclut `harnessId`, `pluginId`
  facultatif, le fournisseur/modèle/canal et l’identifiant d’exécution. L’achèvement ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`
  et les décomptes `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` et
  `cleanupFailed` facultatif.

**Exécution**

- `exec.process.completed` — résultat terminal, durée, cible, mode, code de sortie
  et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.

## Sans exportateur

Vous pouvez garder les événements de diagnostic disponibles pour les Plugins ou les collecteurs personnalisés sans
exécuter `diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans relever `logging.level`, utilisez les
indicateurs de diagnostic. Les indicateurs ne tiennent pas compte de la casse et prennent en charge les caractères génériques (par exemple `telegram.*` ou
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

- [Journalisation](/fr/logging) — journaux de fichiers, sortie console, suivi CLI et onglet Journaux de l’interface Control UI
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-systèmes et capture de console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) — indicateurs de journaux de débogage ciblés
- [Export des diagnostics](/fr/gateway/diagnostics) — outil de bundle de support opérateur (séparé de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
