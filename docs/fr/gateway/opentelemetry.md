---
read_when:
    - Vous souhaitez envoyer les métriques d’utilisation des modèles, de flux de messages ou de session d’OpenClaw à un collecteur OpenTelemetry
    - Vous connectez des traces, des métriques ou des journaux à Grafana, Datadog, Honeycomb, New Relic, Tempo ou un autre backend OTLP
    - Vous avez besoin des noms exacts des métriques, des noms de spans ou de la forme des attributs pour créer des tableaux de bord ou des alertes
summary: Exporter les diagnostics OpenClaw vers des collecteurs OpenTelemetry ou stdout JSONL via le plugin diagnostics-otel
title: Export OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T05:40:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporte les diagnostics via le Plugin officiel `diagnostics-otel`
en utilisant **OTLP/HTTP (protobuf)**. Les journaux peuvent aussi être écrits sous forme de JSONL stdout pour
les pipelines de journaux de conteneurs et de sandbox. Tout collecteur ou backend qui accepte
OTLP/HTTP fonctionne sans modification du code. Pour les journaux de fichiers locaux et la façon de les lire,
consultez [Journalisation](/fr/logging).

## Fonctionnement global

- Les **événements de diagnostic** sont des enregistrements structurés, en processus, émis par le
  Gateway et les plugins intégrés pour les exécutions de modèles, le flux de messages, les sessions, les files d’attente,
  et l’exécution.
- Le **Plugin `diagnostics-otel`** s’abonne à ces événements et les exporte sous forme de
  **métriques**, **traces** et **journaux** OpenTelemetry via OTLP/HTTP. Il peut
  aussi recopier les enregistrements de journaux de diagnostic vers du JSONL stdout.
- Les **appels fournisseur** reçoivent un en-tête W3C `traceparent` depuis le contexte
  de span d’appel de modèle approuvé d’OpenClaw lorsque le transport du fournisseur accepte les
  en-têtes personnalisés. Le contexte de trace émis par les Plugins n’est pas propagé.
- Les exportateurs ne s’attachent que lorsque la surface de diagnostic et le Plugin sont tous deux
  activés, de sorte que le coût en processus reste proche de zéro par défaut.

## Démarrage rapide

Pour les installations empaquetées, installez d’abord le Plugin :

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

Vous pouvez aussi activer le Plugin depuis la CLI :

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` ne prend actuellement en charge que `http/protobuf`. `grpc` est ignoré.
</Note>

## Signaux exportés

| Signal        | Contenu                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métriques** | Compteurs et histogrammes pour l’utilisation des jetons, les coûts, la durée des exécutions, le basculement, l’utilisation des Skills, le flux de messages, les événements Talk, les voies de file d’attente, l’état/la récupération des sessions, l’exécution d’outils, les charges utiles surdimensionnées, l’exécution et la pression mémoire. |
| **Traces**    | Spans pour l’utilisation de modèles, les appels de modèles, le cycle de vie du harnais, l’utilisation des Skills, l’exécution d’outils, l’exécution, le traitement de webhooks/messages, l’assemblage du contexte et les boucles d’outils. |
| **Journaux**  | Enregistrements `logging.file` structurés exportés via OTLP ou JSONL stdout lorsque `diagnostics.otel.logs` est activé ; les corps de journaux sont retenus sauf si la capture de contenu est explicitement activée. |

Activez ou désactivez `traces`, `metrics` et `logs` indépendamment. Les traces et les métriques
sont activées par défaut lorsque `diagnostics.otel.enabled` vaut true. Les journaux sont désactivés par défaut et
ne sont exportés que lorsque `diagnostics.otel.logs` vaut explicitement `true`. L’exportation des journaux
utilise OTLP par défaut ; définissez `diagnostics.otel.logsExporter` sur `stdout` pour du JSONL sur
stdout, ou sur `both` pour envoyer chaque enregistrement de journal de diagnostic à OTLP et à stdout.

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

| Variable                                                                                                          | Objectif                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Remplace `diagnostics.otel.endpoint`. Si la valeur contient déjà `/v1/traces`, `/v1/metrics` ou `/v1/logs`, elle est utilisée telle quelle.                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Remplacements d’endpoints propres à chaque signal, utilisés lorsque la clé de configuration `diagnostics.otel.*Endpoint` correspondante n’est pas définie. La configuration propre au signal l’emporte sur l’env propre au signal, qui l’emporte sur l’endpoint partagé.                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Remplace `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Remplace le protocole filaire (seul `http/protobuf` est honoré aujourd’hui).                                                                                                                                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Définissez sur `gen_ai_latest_experimental` pour émettre la dernière forme expérimentale des spans d’inférence GenAI, notamment les noms de span `{gen_ai.operation.name} {gen_ai.request.model}`, le type de span `CLIENT` et `gen_ai.provider.name` au lieu de l’ancien `gen_ai.system`. Les métriques GenAI utilisent toujours des attributs sémantiques bornés et à faible cardinalité. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Définissez sur `1` lorsqu’un autre préchargement ou processus hôte a déjà enregistré le SDK OpenTelemetry global. Le Plugin ignore alors son propre cycle de vie NodeSDK, mais câble toujours les écouteurs de diagnostic et respecte `traces`/`metrics`/`logs`.                                                                                  |

## Confidentialité et capture de contenu

Le contenu brut des modèles/outils n’est **pas** exporté par défaut. Les spans transportent des
identifiants bornés (canal, fournisseur, modèle, catégorie d’erreur, identifiants de requête uniquement sous forme de hachage,
source de l’outil, propriétaire de l’outil et nom/source de Skill) et n’incluent jamais le texte du prompt,
le texte de réponse, les entrées d’outil, les sorties d’outil, les chemins de fichiers de Skills ni les clés de session.
Par défaut, les enregistrements de journaux OTLP conservent la sévérité, le logger, l’emplacement du code, le contexte de trace approuvé
et des attributs assainis, mais le corps brut du message de journal n’est exporté
que lorsque `diagnostics.otel.captureContent` est défini sur le booléen `true`. Les sous-clés granulaires
`captureContent.*` n’activent pas les corps de journaux. Les libellés qui ressemblent à des
clés de session d’agent avec portée sont remplacés par `unknown`.
Les métriques Talk n’exportent que des métadonnées d’événement bornées telles que le mode, le transport,
le fournisseur et le type d’événement. Elles n’incluent pas les transcriptions, les charges utiles audio,
les identifiants de session, de tour, d’appel ou de salon, ni les jetons de transfert.

Les requêtes de modèle sortantes peuvent inclure un en-tête W3C `traceparent`. Cet en-tête est
généré uniquement à partir du contexte de trace de diagnostic détenu par OpenClaw pour l’appel de modèle
actif. Les en-têtes `traceparent` existants fournis par l’appelant sont remplacés, de sorte que les Plugins ou
options de fournisseur personnalisées ne peuvent pas falsifier l’ascendance de trace interservices.

Définissez `diagnostics.otel.captureContent.*` sur `true` uniquement lorsque votre collecteur et
votre politique de rétention sont approuvés pour le texte de prompt, de réponse, d’outil ou de prompt système.
Chaque sous-clé est activée indépendamment :

- `inputMessages` - contenu du prompt utilisateur.
- `outputMessages` - contenu de la réponse du modèle.
- `toolInputs` - charges utiles des arguments d’outil.
- `toolOutputs` - charges utiles des résultats d’outil.
- `systemPrompt` - prompt système/développeur assemblé.
- `toolDefinitions` - noms, descriptions et schémas des outils de modèle.

Lorsqu’une sous-clé est activée, les spans de modèle et d’outil reçoivent des attributs
`openclaw.content.*` bornés et expurgés uniquement pour cette classe. Utilisez le booléen
`captureContent: true` seulement pour des captures de diagnostic larges où les corps des messages de journaux OTLP
sont également approuvés pour l’exportation.

Le contenu `toolInputs`/`toolOutputs` est capturé pour les exécutions d’outils du runtime d’agent
intégré (`openclaw.content.tool_input` sur les spans terminés/en erreur,
`openclaw.content.tool_output` sur les spans terminés). Les appels d’outils de harnais externes
(Codex, Claude CLI) émettent des spans `tool.execution.*` sans charges utiles de contenu.
Le contenu capturé transite sur un canal approuvé réservé aux écouteurs et n’est jamais placé
sur le bus public d’événements de diagnostic.

## Échantillonnage et vidage

- **Traces :** `diagnostics.otel.sampleRate` (span racine uniquement, `0.0` supprime tout,
  `1.0` conserve tout).

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
  - `openclaw.errorCategory` et `openclaw.failureKind` facultatif en cas d’erreur
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (uniquement des tailles de composants sûres, aucun texte de prompt)
  - `openclaw.model_call.usage.*` et `gen_ai.usage.*` lorsque le résultat d’appel au modèle contient l’utilisation du fournisseur pour cet appel individuel
  - `openclaw.provider.request_id_hash` (hachage borné basé sur SHA de l’identifiant de requête du fournisseur amont ; les identifiants bruts ne sont pas exportés)
  - Avec `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, les spans d’appel au modèle utilisent le dernier nom de span d’inférence GenAI `{gen_ai.operation.name} {gen_ai.request.model}` et le type de span `CLIENT` au lieu de `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (aucun contenu de prompt, d’historique, de réponse ou de clé de session)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (aucun message de boucle, paramètre ou résultat d’outil)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Lorsque la capture de contenu est explicitement activée, les spans de modèle et d’outil peuvent aussi
inclure des attributs `openclaw.content.*` bornés et expurgés pour les classes de
contenu spécifiques que vous avez activées.

## Catalogue des événements de diagnostic

Les événements ci-dessous alimentent les métriques et spans ci-dessus. Les plugins peuvent également s’y abonner
directement sans export OTLP.

**Utilisation du modèle**

- `model.usage` - jetons, coût, durée, contexte, fournisseur/modèle/canal,
  identifiants de session. `usage` correspond à la comptabilisation fournisseur/tour pour le coût et la télémétrie ;
  `context.used` est l’instantané actuel du prompt/contexte et peut être inférieur à
  `usage.total` du fournisseur lorsque des entrées mises en cache ou des appels de boucle d’outils sont impliqués.

**Flux des messages**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**File d’attente et session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (compteurs agrégés : webhooks/file d’attente/session)

**Cycle de vie du harnais**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  cycle de vie par exécution pour le harnais d’agent. Inclut `harnessId`, `pluginId`
  facultatif, fournisseur/modèle/canal et identifiant d’exécution. La fin ajoute
  `durationMs`, `outcome`, `resultClassification` facultatif, `yieldDetected`
  et les nombres `itemLifecycle`. Les erreurs ajoutent `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` et
  `cleanupFailed` facultatif.

**Exec**

- `exec.process.completed` - résultat terminal, durée, cible, mode, code de
  sortie et type d’échec. Le texte de la commande et les répertoires de travail ne sont pas
  inclus.
- `exec.approval.followup_suppressed` - suivi d’approbation obsolète abandonné après
  un rebond de session. Inclut `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` ou `gateway_preflight`) et l’horodatage du répartiteur.
  Les clés de session, les routes et le texte de commande ne sont pas inclus.

## Sans exportateur

Vous pouvez conserver les événements de diagnostic disponibles pour les plugins ou les récepteurs personnalisés sans
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

Ou comme remplacement d’environnement ponctuel :

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

Vous pouvez également exclure `diagnostics-otel` de `plugins.allow`, ou exécuter
`openclaw plugins disable diagnostics-otel`.

## Associé

- [Journalisation](/fr/logging) - journaux de fichiers, sortie console, suivi CLI et onglet Logs de Control UI
- [Internes de journalisation du Gateway](/fr/gateway/logging) - styles de journal WS, préfixes de sous-système et capture de console
- [Indicateurs de diagnostic](/fr/diagnostics/flags) - indicateurs de journaux de débogage ciblés
- [Export de diagnostics](/fr/gateway/diagnostics) - outil de bundle de support opérateur (séparé de l’export OTEL)
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) - référence complète des champs `diagnostics.*`
