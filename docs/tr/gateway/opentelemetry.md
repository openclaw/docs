---
read_when:
    - OpenClaw model kullanımını, mesaj akışını veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - İzleri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna bağlıyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına veya öznitelik yapılarına ihtiyacınız var
summary: diagnostics-otel Plugin'i (OTLP/HTTP) aracılığıyla OpenClaw tanılamalarını herhangi bir OpenTelemetry toplayıcısına aktarın
title: OpenTelemetry dışa aktarımı
x-i18n:
    generated_at: "2026-05-02T08:55:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, resmi `diagnostics-otel` Plugin'i aracılığıyla tanılamaları **OTLP/HTTP (protobuf)** kullanarak dışa aktarır. OTLP/HTTP kabul eden herhangi bir toplayıcı veya arka uç, kod değişikliği olmadan çalışır. Yerel dosya günlükleri ve bunların nasıl okunacağı için bkz. [Günlük Kaydı](/tr/logging).

## Birlikte nasıl çalışır

- **Tanılama olayları**, model çalıştırmaları, ileti akışı, oturumlar, kuyruklar ve exec için Gateway ve paketlenmiş Plugin'ler tarafından yayılan yapılandırılmış, işlem içi kayıtlardır.
- **`diagnostics-otel` Plugin'i**, bu olaylara abone olur ve bunları OTLP/HTTP üzerinden OpenTelemetry **metrikleri**, **izleri** ve **günlükleri** olarak dışa aktarır.
- **Sağlayıcı çağrıları**, sağlayıcı aktarımı özel üstbilgileri kabul ettiğinde OpenClaw'ın güvenilir model çağrısı span bağlamından bir W3C `traceparent` üstbilgisi alır. Plugin tarafından yayılan iz bağlamı yayılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de Plugin etkin olduğunda bağlanır; bu nedenle işlem içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

Paketli kurulumlar için önce Plugin'i kurun:

```bash
openclaw plugins install @openclaw/diagnostics-otel
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

Plugin'i CLI'dan da etkinleştirebilirsiniz:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
</Note>

## Dışa aktarılan sinyaller

| Sinyal      | İçine ne girer                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrikler** | Token kullanımı, maliyet, çalışma süresi, ileti akışı, kuyruk hatları, oturum durumu, exec ve bellek baskısı için sayaçlar ve histogramlar.          |
| **İzler**  | Model kullanımı, model çağrıları, harness yaşam döngüsü, araç yürütme, exec, Webhook/ileti işleme, bağlam derleme ve araç döngüleri için span'ler. |
| **Günlükler**    | `diagnostics.otel.logs` etkin olduğunda OTLP üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları.                                      |

`traces`, `metrics` ve `logs` ayarlarını bağımsız olarak açıp kapatın. `diagnostics.otel.enabled` true olduğunda üçü de varsayılan olarak açıktır.

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

### Ortam değişkenleri

| Değişken                                                                                                          | Amaç                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` değerini geçersiz kılar. Değer zaten `/v1/traces`, `/v1/metrics` veya `/v1/logs` içeriyorsa olduğu gibi kullanılır.                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta geçersiz kılmaları. Sinyale özgü yapılandırma, sinyale özgü env değerinden; o da paylaşılan uç noktadan önceliklidir.        |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Kablo protokolünü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Eski `gen_ai.system` yerine en son deneysel GenAI span niteliğini (`gen_ai.provider.name`) yayımlamak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrikleri ne olursa olsun sınırlı, düşük kardinaliteli semantik nitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir preload veya ana süreç genel OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar, ancak tanılama dinleyicilerini yine de bağlar ve `traces`/`metrics`/`logs` ayarlarına uyar. |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak dışa aktarılmaz. Span'ler sınırlı tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi, yalnızca hash içeren istek kimlikleri) ve asla prompt metni, yanıt metni, araç girdileri, araç çıktıları veya oturum anahtarları içermez.

Giden model istekleri bir W3C `traceparent` üstbilgisi içerebilir. Bu üstbilgi yalnızca etkin model çağrısı için OpenClaw'a ait tanılama iz bağlamından üretilir. Mevcut çağıran tarafından sağlanan `traceparent` üstbilgileri değiştirilir; böylece Plugin'ler veya özel sağlayıcı seçenekleri servisler arası iz atalarını taklit edemez.

`diagnostics.otel.captureContent.*` ayarını yalnızca toplayıcınız ve saklama politikanız prompt, yanıt, araç veya sistem promptu metni için onaylandığında `true` yapın. Her alt anahtar bağımsız olarak isteğe bağlıdır:

- `inputMessages` — kullanıcı prompt içeriği.
- `outputMessages` — model yanıt içeriği.
- `toolInputs` — araç argüman yükleri.
- `toolOutputs` — araç sonuç yükleri.
- `systemPrompt` — derlenmiş sistem/geliştirici promptu.

Herhangi bir alt anahtar etkinleştirildiğinde, model ve araç span'leri yalnızca o sınıf için sınırlı, redakte edilmiş `openclaw.content.*` nitelikleri alır.

## Örnekleme ve boşaltma

- **İzler:** `diagnostics.otel.sampleRate` (yalnızca kök span, `0.0` tümünü düşürür, `1.0` tümünü tutar).
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Günlükler:** OTLP günlükleri `logging.level` (dosya günlük seviyesi) değerine uyar. Konsol biçimlendirmesini değil, tanılama günlük kaydı redaksiyon yolunu kullanırlar. Yüksek hacimli kurulumlar, yerel örnekleme yerine OTLP toplayıcı örnekleme/filtrelemeyi tercih etmelidir.
- **Dosya günlüğü korelasyonu:** JSONL dosya günlükleri, günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında üst düzey `traceId`, `spanId`, `parentSpanId` ve `traceFlags` içerir; bu da günlük işleyicilerinin yerel günlük satırlarını dışa aktarılan span'lerle birleştirmesini sağlar.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket frame'leri dahili bir istek iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları varsayılan olarak istek izini devralır; agent çalıştırma ve model çağrısı span'leri ise sağlayıcı `traceparent` üstbilgilerinin aynı izde kalması için çocuk olarak oluşturulur.

## Dışa aktarılan metrikler

### Model kullanımı

- `openclaw.tokens` (sayaç, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (sayaç, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantik kuralları metriği, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI semantik kuralları metriği, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ayrıca sınıflandırılmış hatalarda `openclaw.errorCategory` ve `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, son model istek yükünün UTF-8 bayt boyutu; ham yük içeriği yok)
- `openclaw.model_call.response_bytes` (histogram, akışla gelen model yanıt olaylarının UTF-8 bayt boyutu; ham yanıt içeriği yok)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, akışla gelen ilk yanıt olayından önce geçen süre)

### İleti akışı

- `openclaw.webhook.received` (sayaç, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (sayaç, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (sayaç, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (sayaç, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (sayaç, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (sayaç, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (sayaç, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, attrs: `openclaw.state`; yalnızca etkin iş olmayan bayat oturum kayıt tutma için yayımlanır)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`; yalnızca etkin iş olmayan bayat oturum kayıt tutma için yayımlanır)
- `openclaw.run.attempt` (sayaç, attrs: `openclaw.attempt`)

### Oturum canlılığı telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme olmayan yaş eşiğidir. Bir `processing` oturumu, OpenClaw yanıt, araç, durum, blok veya ACP çalışma zamanı ilerlemesi gözlemlediği sürece bu eşik doğrultusunda yaşlanmaz. Yazıyor keepalive'ları ilerleme sayılmaz; bu nedenle sessiz bir model veya harness yine de algılanabilir.

OpenClaw, oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü iş, model çağrıları veya araç çağrıları
  hâlâ ilerleme kaydediyor.
- `session.stalled`: etkin iş var, ancak etkin çalıştırma yakın zamanda
  ilerleme bildirmedi.
- `session.stuck`: etkin iş olmadan eskimiş oturum kayıt tutma durumu. Etkilenen
  oturum hattını serbest bırakan tek canlılık sınıflandırması budur.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını,
`openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck`
span'ini yayar. Yinelenen `session.stuck` tanılamaları, oturum değişmeden
kaldığı sürece geri çekilir; bu nedenle panolar her Heartbeat işaretinde değil,
sürekli artışlarda uyarı vermelidir. Yapılandırma düğmesi ve varsayılanlar için
[Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) bölümüne
bakın.

### Harness yaşam döngüsü

- `openclaw.harness.duration_ms` (histogram, öznitelikler: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, hatalarda `openclaw.harness.phase`)

### Exec

- `openclaw.exec.duration_ms` (histogram, öznitelikler: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Tanılama iç yapıları (bellek ve araç döngüsü)

- `openclaw.memory.heap_used_bytes` (histogram, öznitelikler: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (sayaç, öznitelikler: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (sayaç, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)

## Dışa aktarılan span'ler

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - varsayılan olarak `gen_ai.system` veya en yeni GenAI semantik kuralları seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - varsayılan olarak `gen_ai.system` veya en yeni GenAI semantik kuralları seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - hatalarda `openclaw.errorCategory` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (yukarı akış sağlayıcı istek kimliğinin sınırlı SHA tabanlı karması; ham kimlikler dışa aktarılmaz)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlandığında: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Hatada: `openclaw.harness.phase`, `openclaw.errorCategory`, isteğe bağlı `openclaw.harness.cleanup_failed`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü iletileri, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span'leri ayrıca
seçtiğiniz belirli içerik sınıfları için sınırlı, redakte edilmiş
`openclaw.content.*` özniteliklerini de içerebilir.

## Tanılama olay kataloğu

Aşağıdaki olaylar, yukarıdaki metrikleri ve span'leri destekler. Plugin'ler
bunlara OTLP dışa aktarımı olmadan da doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` — token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal,
  oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/tur
  muhasebesidir; `context.used` ise mevcut istem/bağlam anlık görüntüsüdür ve
  önbelleğe alınmış girdi veya araç döngüsü çağrıları söz konusu olduğunda
  sağlayıcı `usage.total` değerinden daha düşük olabilir.

**İleti akışı**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kuyruk ve oturum**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (toplu sayaçlar: webhook'lar/kuyruk/oturum)

**Harness yaşam döngüsü**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  aracı harness'i için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe
  bağlı `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir.
  Tamamlama `durationMs`, `outcome`, isteğe bağlı `resultClassification`,
  `yieldDetected` ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve
  isteğe bağlı `cleanupFailed` değerlerini ekler.

**Exec**

- `exec.process.completed` — terminal sonucu, süre, hedef, mod, çıkış
  kodu ve hata türü. Komut metni ve çalışma dizinleri dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan da tanılama olaylarını Plugin'ler veya özel
hedefler için kullanılabilir tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` değerini yükseltmeden hedefli hata ayıklama çıktısı için
tanılama bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarsızdır ve joker
karakterleri destekler (ör. `telegram.*` veya `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Veya tek seferlik bir ortam geçersiz kılması olarak:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Bayrak çıktısı standart günlük dosyasına (`logging.file`) gider ve yine de
`logging.redactSensitive` tarafından redakte edilir. Tam kılavuz:
[Tanılama bayrakları](/tr/diagnostics/flags).

## Devre dışı bırakma

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ayrıca `diagnostics-otel` öğesini `plugins.allow` dışında bırakabilir veya
`openclaw plugins disable diagnostics-otel` çalıştırabilirsiniz.

## İlgili

- [Günlükleme](/tr/logging) — dosya günlükleri, konsol çıktısı, CLI ile takip ve Control UI Günlükler sekmesi
- [Gateway günlükleme iç yapıları](/tr/gateway/logging) — WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) — operatör destek paketi aracı (OTEL dışa aktarımından ayrıdır)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
