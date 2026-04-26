---
read_when:
    - Vous souhaitez envoyer l’usage des modèles, le flux de messages ou les métriques de session OpenClaw vers un collecteur OpenTelemetry
    - Vous configurez des traces, métriques ou journaux vers Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des spans ou des formes d’attributs pour créer des tableaux de bord ou des alertes
summary: Exportez les diagnostics OpenClaw vers n’importe quel collecteur OpenTelemetry via le Plugin diagnostics-otel (OTLP/HTTP)
title: Export OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:29:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw exporte les diagnostics via le Plugin intégré `diagnostics-otel`
en utilisant **OTLP/HTTP (protobuf)**. Tout collecteur ou backend qui accepte OTLP/HTTP
fonctionne sans modification de code. Pour les journaux de fichiers locaux et comment les lire, voir
[Journalisation](/fr/logging).

## Comment cela s’articule

- Les **événements de diagnostic** sont des enregistrements structurés en mémoire émis par la
  Gateway et les Plugin intégrés pour les exécutions de modèles, le flux de messages, les sessions,
  les files et exec.
- Le **Plugin `diagnostics-otel`** s’abonne à ces événements et les exporte comme
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP.
- Les **appels fournisseur** reçoivent un en-tête W3C `traceparent` depuis le
  contexte de span d’appel de modèle de confiance d’OpenClaw lorsque le transport fournisseur accepte des
  en-têtes personnalisés. Le contexte de trace émis par les Plugin n’est pas propagé.
- Les exporteurs ne s’attachent que lorsque la surface de diagnostic et le Plugin sont
  activés, de sorte que le coût en mémoire reste proche de zéro par défaut.

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

Vous pouvez également activer le Plugin depuis la CLI :

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` prend actuellement en charge uniquement `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal        | Ce qu’il contient                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l’usage des tokens, le coût, la durée d’exécution, le flux de messages, les files, l’état des sessions, exec et la pression mémoire. |
| **Traces**    | Spans pour l’usage des modèles, les appels de modèles, le cycle de vie du harnais, l’exécution d’outils, exec, le traitement des Webhook/messages, l’assemblage du contexte et les boucles d’outils. |
| **Journaux**  | Enregistrements structurés `logging.file` exportés via OTLP lorsque `diagnostics.otel.logs` est activé.                                   |

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
      protocol: "http/protobuf", // grpc est ignoré
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // échantillonneur de span racine, 0.0..1.0
      flushIntervalMs: 60000, // intervalle d’export des métriques (min 1000ms)
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

| Variable                                                                                                          | Rôle                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements d’endpoint spécifiques au signal, utilisés lorsque la clé de configuration correspondante `diagnostics.otel.*Endpoint` n’est pas définie. La configuration spécifique au signal prime sur la variable d’environnement spécifique au signal, qui prime sur l’endpoint partagé. |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole réseau (seul `http/protobuf` est pris en charge aujourd’hui).                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre le dernier attribut expérimental de span GenAI (`gen_ai.provider.name`) au lieu de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés et à faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu’un autre preload ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le Plugin ignore alors son propre cycle de vie NodeSDK mais branche quand même les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`. |

## Confidentialité et capture de contenu

Le contenu brut des modèles/outils **n’est pas** exporté par défaut. Les spans transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, identifiants de requête hachés uniquement)
et n’incluent jamais le texte du prompt, le texte de réponse, les entrées d’outil, les sorties d’outil,
ni les clés de session.

Les requêtes sortantes de modèle peuvent inclure un en-tête W3C `traceparent`. Cet en-tête
est généré uniquement à partir du contexte de trace de diagnostic appartenant à OpenClaw pour l’appel de modèle
actif. Les en-têtes `traceparent` fournis par l’appelant sont remplacés, afin que les Plugin ou
options de fournisseur personnalisées ne puissent pas usurper une ascendance de trace interservice.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et
votre politique de rétention sont approuvés pour le texte des prompts, réponses, outils ou prompts système.
Chaque sous-clé est activée séparément :

- `inputMessages` — contenu des prompts utilisateur.
- `outputMessages` — contenu des réponses du modèle.
- `toolInputs` — charges utiles des arguments d’outil.
- `toolOutputs` — charges utiles des résultats d’outil.
- `systemPrompt` — prompt système/développeur assemblé.

Lorsqu’une sous-clé est activée, les spans de modèle et d’outil obtiennent des attributs
`openclaw.content.*` bornés et expurgés pour cette classe uniquement.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).
- **Métriques :** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Journaux :** les journaux OTLP respectent `logging.level` (niveau de journal du fichier). L’expurgation
  de la console ne s’applique **pas** aux journaux OTLP. Les installations à fort volume doivent
  préférer l’échantillonnage/le filtrage du collecteur OTLP à l’échantillonnage local.

## Métriques exportées

### Usage des modèles

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogramme, métrique des conventions sémantiques GenAI, attributs : `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogramme, secondes, métrique des conventions sémantiques GenAI, attributs : `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facultatif)

### Flux de messages

- `openclaw.webhook.received` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attributs : `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (compteur, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (compteur, attributs : `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogramme, attributs : `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Files et sessions

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state`)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

### Cycle de vie du harnais

- `openclaw.harness.duration_ms` (histogramme, attributs : `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en cas d’erreurs)

### Exec

- `openclaw.exec.duration_ms` (histogramme, attributs : `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internes de diagnostic (mémoire et boucle d’outils)

- `openclaw.memory.heap_used_bytes` (histogramme, attributs : `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogramme)
- `openclaw.memory.pressure` (compteur, attributs : `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (compteur, attributs : `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogramme, attributs : `openclaw.toolName`, `openclaw.outcome`)

## Spans exportés

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` par défaut, ou `gen_ai.provider.name` lorsque les dernières conventions sémantiques GenAI sont activées
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (hachage borné basé sur SHA de l’identifiant de requête du fournisseur upstream ; les identifiants bruts ne sont pas exportés)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - À la fin : `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En cas d’erreur : `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` facultatif
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu de prompt, historique, réponse ni clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ni sortie d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture de contenu est explicitement activée, les spans de modèle et d’outil peuvent aussi
inclure des attributs `openclaw.content.*` bornés et expurgés pour les classes de
contenu spécifiques que vous avez activées.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et les spans ci-dessus. Les Plugin peuvent aussi s’y abonner
directement sans export OTLP.

**Usage des modèles**

- `model.usage` — tokens, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilité fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel du prompt/contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque des entrées mises en cache ou des appels de boucle d’outil sont impliqués.

**Flux de messages**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**File et session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (compteurs agrégés : Webhook/file/session)

**Cycle de vie du harnais**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  cycle de vie par exécution du harnais d’agent. Inclut `harnessId`, un
  `pluginId` facultatif, le fournisseur/modèle/canal, et l’identifiant d’exécution. La fin ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`,
  et des compteurs `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, et
  `cleanupFailed` facultatif.

**Exec**

- `exec.process.completed` — résultat terminal, durée, cible, mode, code
  de sortie, et type d’échec. Le texte de commande et les répertoires de travail ne sont pas
  inclus.

## Sans exporteur

Vous pouvez conserver les événements de diagnostic disponibles pour les Plugin ou des puits personnalisés sans
exécuter `diagnostics-otel` :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour une sortie de débogage ciblée sans augmenter `logging.level`, utilisez des
flags de diagnostic. Les flags sont insensibles à la casse et prennent en charge les jokers (par ex. `telegram.*` ou
`*`) :

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou comme remplacement ponctuel via variable d’environnement :

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La sortie des flags va dans le fichier journal standard (`logging.file`) et est toujours
expurgée par `logging.redactSensitive`. Guide complet :
[Flags de diagnostic](/fr/diagnostics/flags).

## Désactiver

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Vous pouvez aussi omettre `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Liens connexes

- [Journalisation](/fr/logging) — journaux de fichiers, sortie console, suivi CLI et onglet Logs de l’interface de contrôle
- [Internes de journalisation Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture de console
- [Flags de diagnostic](/fr/diagnostics/flags) — flags de débogage ciblés
- [Export de diagnostics](/fr/gateway/diagnostics) — outil opérateur de bundle de support (séparé de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
