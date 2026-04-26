---
read_when:
    - OpenClaw model kullanımı, mesaj akışı veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - İzleri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna bağlıyorsunuz
    - Gösterge panoları veya uyarılar oluşturmak için tam metrik adlarına, span adlarına veya öznitelik biçimlerine ihtiyacınız var
summary: diagnostics-otel Plugin’i üzerinden OpenClaw tanı verilerini herhangi bir OpenTelemetry toplayıcısına aktarın (OTLP/HTTP)
title: OpenTelemetry dışa aktarma
x-i18n:
    generated_at: "2026-04-26T11:30:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw, tanı verilerini paketlenmiş `diagnostics-otel` Plugin’i üzerinden
**OTLP/HTTP (protobuf)** kullanarak dışa aktarır. OTLP/HTTP kabul eden herhangi
bir toplayıcı veya arka uç kod değişikliği olmadan çalışır. Yerel dosya
günlükleri ve bunların nasıl okunacağı için bkz.
[Logging](/tr/logging).

## Nasıl birlikte çalışır

- **Tanı olayları**, model çalıştırmaları, mesaj akışı, oturumlar, kuyruklar
  ve exec için Gateway ve paketlenmiş Plugin’ler tarafından yayılan
  yapılandırılmış süreç içi kayıtlardır.
- **`diagnostics-otel` Plugin’i**, bu olaylara abone olur ve bunları
  OpenTelemetry **metrics**, **traces** ve **logs** olarak OTLP/HTTP üzerinden dışa aktarır.
- **Sağlayıcı çağrıları**, sağlayıcı transport’u özel başlıkları kabul ettiğinde,
  OpenClaw’ın güvenilen model-çağrısı span bağlamından bir W3C `traceparent`
  başlığı alır. Plugin tarafından yayılan iz bağlamı aktarılmaz.
- Dışa aktarıcılar yalnızca hem diagnostics yüzeyi hem de Plugin etkin olduğunda
  eklenir; bu nedenle süreç içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

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

Plugin’i CLI’den de etkinleştirebilirsiniz:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
</Note>

## Dışa aktarılan sinyaller

| Sinyal      | İçeriği                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Token kullanımı, maliyet, çalıştırma süresi, mesaj akışı, kuyruk hatları, oturum durumu, exec ve bellek baskısı için sayaçlar ve histogramlar. |
| **Traces**  | Model kullanımı, model çağrıları, harness yaşam döngüsü, araç yürütme, exec, Webhook/mesaj işleme, bağlam oluşturma ve araç döngüleri için span’lar. |
| **Logs**    | `diagnostics.otel.logs` etkin olduğunda OTLP üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları.                            |

`traces`, `metrics` ve `logs` değerlerini bağımsız olarak açıp kapatın. Üçü de
`diagnostics.otel.enabled` true olduğunda varsayılan olarak açıktır.

## Yapılandırma başvurusu

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
      protocol: "http/protobuf", // grpc yok sayılır
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // kök-span örnekleyici, 0.0..1.0
      flushIntervalMs: 60000, // metric dışa aktarma aralığı (min 1000ms)
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

### Ortam değişkenleri

| Değişken                                                                                                         | Amaç                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                    | `diagnostics.otel.endpoint` değerini geçersiz kılar. Değer zaten `/v1/traces`, `/v1/metrics` veya `/v1/logs` içeriyorsa olduğu gibi kullanılır.                                                                                            |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` config anahtarı ayarlı olmadığında kullanılan sinyal bazlı uç nokta geçersiz kılmaları. Sinyal bazlı config, sinyal bazlı env’den önce gelir; sinyal bazlı env de paylaşılan uç noktadan önce gelir. |
| `OTEL_SERVICE_NAME`                                                                                              | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                    | Hat üzerindeki protokolü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                  | Eski `gen_ai.system` yerine en son deneysel GenAI span özniteliğini (`gen_ai.provider.name`) yayımlamak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrics her zaman sınırlı, düşük kardinaliteli semantik öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                        | Başka bir preload veya ana süreç zaten genel OpenTelemetry SDK’sını kaydettiyse `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar ama yine de tanı dinleyicilerini bağlar ve `traces`/`metrics`/`logs` ayarlarına uyar. |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak **dışa aktarılmaz**. Span’lar sınırlı
tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi, yalnızca hash
olan istek kimlikleri) ve asla istem metni, yanıt metni, araç girdileri, araç
çıktıları veya oturum anahtarlarını içermez.

Giden model istekleri bir W3C `traceparent` başlığı içerebilir. Bu başlık
yalnızca etkin model çağrısı için OpenClaw’a ait tanı iz bağlamından üretilir.
Mevcut çağıran tarafından sağlanan `traceparent` başlıkları değiştirilir; bu
nedenle Plugin’ler veya özel sağlayıcı seçenekleri hizmetler arası iz soyunu
taklit edemez.

İstemi, yanıtı, aracı veya system prompt metnini toplamaya ve saklamaya
toplayıcınız ile elde tutma politikanız onaylıysa yalnızca o zaman
`diagnostics.otel.captureContent.*` değerlerini `true` yapın. Her alt anahtar
bağımsız olarak isteğe bağlıdır:

- `inputMessages` — kullanıcı istem içeriği.
- `outputMessages` — model yanıt içeriği.
- `toolInputs` — araç argüman yükleri.
- `toolOutputs` — araç sonuç yükleri.
- `systemPrompt` — birleştirilmiş system/developer prompt’u.

Herhangi bir alt anahtar etkin olduğunda, model ve araç span’ları yalnızca o
sınıf için sınırlı, sansürlenmiş `openclaw.content.*` öznitelikleri alır.

## Örnekleme ve flush

- **Traces:** `diagnostics.otel.sampleRate` (yalnızca kök-span, `0.0` tümünü
  düşürür, `1.0` tümünü tutar).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (asgari `1000`).
- **Logs:** OTLP günlükleri `logging.level` değerine uyar (dosya günlük
  seviyesi). Konsol sansürleme OTLP günlüklerine uygulanmaz. Yüksek hacimli
  kurulumlar, yerel örnekleme yerine OTLP toplayıcı örnekleme/filtrelemeyi
  tercih etmelidir.

## Dışa aktarılan metrics

### Model kullanımı

- `openclaw.tokens` (counter, öznitelikler: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metriği, öznitelikler: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI semantic-conventions metriği, öznitelikler: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)

### Mesaj akışı

- `openclaw.webhook.received` (counter, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, öznitelikler: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (counter, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (counter, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, öznitelikler: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`)
- `openclaw.run.attempt` (counter, öznitelikler: `openclaw.attempt`)

### Harness yaşam döngüsü

- `openclaw.harness.duration_ms` (histogram, öznitelikler: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, hatalarda `openclaw.harness.phase`)

### Exec

- `openclaw.exec.duration_ms` (histogram, öznitelikler: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Tanı iç bileşenleri (bellek ve araç döngüsü)

- `openclaw.memory.heap_used_bytes` (histogram, öznitelikler: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, öznitelikler: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)

## Dışa aktarılan span’lar

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
  - varsayılan olarak `gen_ai.system`, ya da en son GenAI semantic conventions seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - varsayılan olarak `gen_ai.system`, ya da en son GenAI semantic conventions seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (upstream sağlayıcı istek kimliğinin sınırlı SHA tabanlı hash’i; ham kimlikler dışa aktarılmaz)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlanmada: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Hata durumunda: `openclaw.harness.phase`, `openclaw.errorCategory`, isteğe bağlı `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (istem, geçmiş, yanıt veya oturum anahtarı içeriği yok)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü mesajları, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span’ları ayrıca
katıldığınız belirli içerik sınıfları için sınırlı, sansürlenmiş
`openclaw.content.*` öznitelikleri içerebilir.

## Tanı olay kataloğu

Aşağıdaki olaylar yukarıdaki metrics ve span’ları destekler. Plugin’ler ayrıca
bunlara OTLP dışa aktarma olmadan da doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` — token’lar, maliyet, süre, bağlam, sağlayıcı/model/kanal,
  oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/dönüş
  muhasebesidir; `context.used` ise mevcut istem/bağlam anlık görüntüsüdür ve
  önbelleğe alınmış girdi veya araç-döngüsü çağrıları söz konusu olduğunda
  sağlayıcı `usage.total` değerinden daha düşük olabilir.

**Mesaj akışı**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kuyruk ve oturum**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (toplu sayaçlar: Webhook’lar/kuyruk/oturum)

**Harness yaşam döngüsü**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  aracı harness için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe bağlı
  `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir. Tamamlanma
  kısmı `durationMs`, `outcome`, isteğe bağlı `resultClassification`,
  `yieldDetected` ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve isteğe
  bağlı `cleanupFailed` ekler.

**Exec**

- `exec.process.completed` — terminal sonuç, süre, hedef, mod, çıkış kodu ve
  hata türü. Komut metni ve çalışma dizinleri dahil değildir.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan da tanı olaylarını Plugin’ler veya özel
sink’ler için kullanılabilir tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` yükseltmeden hedeflenmiş hata ayıklama çıktısı için diagnostics
bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakter
destekler (ör. `telegram.*` veya `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Veya tek seferlik bir env geçersiz kılması olarak:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Bayrak çıktısı standart günlük dosyasına gider (`logging.file`) ve yine de
`logging.redactSensitive` tarafından sansürlenir. Tam rehber:
[Diagnostics flags](/tr/diagnostics/flags).

## Devre dışı bırakma

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ayrıca `plugins.allow` içine `diagnostics-otel` eklemeyebilir veya
`openclaw plugins disable diagnostics-otel` çalıştırabilirsiniz.

## İlgili

- [Logging](/tr/logging) — dosya günlükleri, konsol çıktısı, CLI tailing ve Control UI Logs sekmesi
- [Gateway logging internals](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Diagnostics flags](/tr/diagnostics/flags) — hedeflenmiş hata ayıklama günlük bayrakları
- [Diagnostics export](/tr/gateway/diagnostics) — operatör support bundle aracı (OTEL dışa aktarmasından ayrıdır)
- [Configuration reference](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
