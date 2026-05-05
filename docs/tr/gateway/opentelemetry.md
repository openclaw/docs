---
read_when:
    - OpenClaw model kullanımını, ileti akışını veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - İzleri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna entegre ediyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına ya da öznitelik biçimlerine ihtiyacınız var
summary: diagnostics-otel Plugin aracılığıyla OpenClaw tanılamalarını herhangi bir OpenTelemetry toplayıcısına dışa aktarın
title: OpenTelemetry dışa aktarma
x-i18n:
    generated_at: "2026-05-05T06:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, tanılamaları resmi `diagnostics-otel` plugini üzerinden
**OTLP/HTTP (protobuf)** kullanarak dışa aktarır. OTLP/HTTP kabul eden her
kolektör veya arka uç kod değişikliği olmadan çalışır. Yerel dosya günlükleri
ve bunların nasıl okunacağı için bkz. [Günlükleme](/tr/logging).

## Nasıl birlikte çalışır

- **Tanılama olayları**, model çalıştırmaları, ileti akışı, oturumlar,
  kuyruklar ve exec için Gateway ve paketle gelen pluginler tarafından yayılan
  yapılandırılmış, süreç içi kayıtlardır.
- **`diagnostics-otel` plugini** bu olaylara abone olur ve bunları OTLP/HTTP
  üzerinden OpenTelemetry **metrikleri**, **izleri** ve **günlükleri** olarak
  dışa aktarır.
- **Sağlayıcı çağrıları**, sağlayıcı aktarımı özel başlıkları kabul ettiğinde
  OpenClaw'ın güvenilir model çağrısı span bağlamından bir W3C `traceparent`
  başlığı alır. Plugin tarafından yayılan iz bağlamı yayılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de plugin etkinleştirildiğinde
  bağlanır; bu nedenle süreç içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

Paketlenmiş kurulumlar için önce plugini kurun:

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

Plugini CLI üzerinden de etkinleştirebilirsiniz:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
</Note>

## Dışa aktarılan sinyaller

| Sinyal       | İçeriğine ne girer                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrikler** | Jeton kullanımı, maliyet, çalıştırma süresi, ileti akışı, kuyruk şeritleri, oturum durumu, exec ve bellek baskısı için sayaçlar ve histogramlar.            |
| **İzler**    | Model kullanımı, model çağrıları, harness yaşam döngüsü, araç yürütme, exec, webhook/ileti işleme, bağlam derleme ve araç döngüleri için spanler.           |
| **Günlükler** | `diagnostics.otel.logs` etkinleştirildiğinde OTLP üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları.                                        |

`traces`, `metrics` ve `logs` değerlerini bağımsız olarak açıp kapatın.
`diagnostics.otel.enabled` true olduğunda üçünün tamamı varsayılan olarak açıktır.

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

| Değişken                                                                                                          | Amaç                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` değerini geçersiz kılar. Değer zaten `/v1/traces`, `/v1/metrics` veya `/v1/logs` içeriyorsa olduğu gibi kullanılır.                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü uç nokta geçersiz kılmalarıdır. Sinyale özgü yapılandırma, sinyale özgü env değerine; o da paylaşılan uç noktaya göre önceliklidir. |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Kablo protokolünü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Eski `gen_ai.system` yerine en son deneysel GenAI span özniteliğini (`gen_ai.provider.name`) yaymak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrikleri her durumda sınırlı, düşük kardinaliteli semantik öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir preload veya konak süreç global OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar, ancak tanılama dinleyicilerini bağlamaya ve `traces`/`metrics`/`logs` değerlerini dikkate almaya devam eder. |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak **dışa aktarılmaz**. Spanler sınırlı
tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi, yalnızca hash
içeren istek kimlikleri) ve asla istem metni, yanıt metni, araç girdileri,
araç çıktıları veya oturum anahtarları içermez.

Giden model istekleri bir W3C `traceparent` başlığı içerebilir. Bu başlık
yalnızca etkin model çağrısı için OpenClaw'a ait tanılama iz bağlamından
oluşturulur. Mevcut çağıran tarafından sağlanan `traceparent` başlıkları
değiştirilir; böylece pluginler veya özel sağlayıcı seçenekleri servisler arası
iz soyunu taklit edemez.

`diagnostics.otel.captureContent.*` değerini yalnızca kolektörünüz ve saklama
ilkeniz istem, yanıt, araç veya sistem istemi metni için onaylandığında `true`
olarak ayarlayın. Her alt anahtar bağımsız olarak opt-in'dir:

- `inputMessages` — kullanıcı istemi içeriği.
- `outputMessages` — model yanıtı içeriği.
- `toolInputs` — araç argüman yükleri.
- `toolOutputs` — araç sonuç yükleri.
- `systemPrompt` — derlenmiş sistem/geliştirici istemi.

Herhangi bir alt anahtar etkinleştirildiğinde, model ve araç spanleri yalnızca
o sınıf için sınırlı, redakte edilmiş `openclaw.content.*` öznitelikleri alır.

## Örnekleme ve boşaltma

- **İzler:** `diagnostics.otel.sampleRate` (yalnızca kök span, `0.0` tümünü düşürür,
  `1.0` tümünü tutar).
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Günlükler:** OTLP günlükleri `logging.level` değerine (dosya günlük düzeyi)
  uyar. Konsol biçimlendirmesi yerine tanılama günlük kaydı redaksiyon yolunu
  kullanırlar. Yüksek hacimli kurulumlar, yerel örnekleme yerine OTLP kolektör
  örnekleme/filtrelemesini tercih etmelidir.
- **Dosya günlüğü korelasyonu:** JSONL dosya günlükleri, günlük çağrısı geçerli
  bir tanılama iz bağlamı taşıdığında üst düzey `traceId`, `spanId`,
  `parentSpanId` ve `traceFlags` içerir; bu, günlük işlemcilerinin yerel günlük
  satırlarını dışa aktarılan spanlerle birleştirmesini sağlar.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket frameleri dahili
  bir istek iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları
  varsayılan olarak istek izini devralır; ajan çalıştırma ve model çağrısı
  spanleri ise alt öğeler olarak oluşturulur, böylece sağlayıcı `traceparent`
  başlıkları aynı iz üzerinde kalır.

## Dışa aktarılan metrikler

### Model kullanımı

- `openclaw.tokens` (sayaç, öznitelikler: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metriği, öznitelikler: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI semantic-conventions metriği, öznitelikler: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)
- `openclaw.model_call.duration_ms` (histogram, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ayrıca sınıflandırılmış hatalarda `openclaw.errorCategory` ve `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, son model isteği yükünün UTF-8 bayt boyutu; ham yük içeriği yok)
- `openclaw.model_call.response_bytes` (histogram, akışlı model yanıtı olaylarının UTF-8 bayt boyutu; ham yanıt içeriği yok)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, ilk akışlı yanıt olayından önce geçen süre)

### İleti akışı

- `openclaw.webhook.received` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`; yalnızca etkin iş olmayan bayat oturum defter tutma için yayılır)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`; yalnızca etkin iş olmayan bayat oturum defter tutma için yayılır)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Oturum canlılığı telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme
olmayan yaş eşiğidir. Bir `processing` oturumu, OpenClaw yanıt, araç, durum,
blok veya ACP çalışma zamanı ilerlemesi gözlemlerken bu eşiğe doğru yaşlanmaz.
Yazma keepalive'ları ilerleme olarak sayılmaz; bu nedenle sessiz bir model veya
harness yine de algılanabilir.

OpenClaw oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü çalışma, model çağrıları veya araç çağrıları
  hâlâ ilerleme kaydediyor.
- `session.stalled`: etkin çalışma var, ancak etkin çalıştırma son dönemde
  ilerleme bildirmedi. Takılmış gömülü çalıştırmalar önce yalnızca gözlemde kalır,
  ardından ilerleme olmazsa `diagnostics.stuckSessionAbortMs` sonrasında
  abort-drain yapar; böylece lane arkasında kuyruğa alınmış turn'ler devam edebilir.
  Ayarlanmamışsa iptal eşiği varsayılan olarak en az 10 dakika ve
  `diagnostics.stuckSessionWarnMs` değerinin 5 katı olan daha güvenli genişletilmiş
  pencereye ayarlanır.
- `session.stuck`: etkin çalışma olmadan eski session kayıt durumu. Bu, etkilenen
  session lane'ini hemen serbest bırakır.

Kurtarma, yapılandırılmış `session.recovery.requested` ve
`session.recovery.completed` olayları yayar. Tanılama session durumu yalnızca
değiştirici bir kurtarma sonucu (`aborted` veya `released`) sonrasında ve yalnızca
aynı işleme generation'ı hâlâ geçerliyse idle olarak işaretlenir.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını,
`openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck`
span'ini yayar. Tekrarlanan `session.stuck` tanılamaları, session değişmeden
kaldığı sürece geri çekilir; bu yüzden panolar her Heartbeat tick'i yerine
sürdürülen artışlarda uyarı vermelidir. Yapılandırma ayarı ve varsayılanlar için
bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics).

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
  - `openclaw.tokens.*` (girdi/çıktı/cache_read/cache_write/toplam)
  - Varsayılan olarak `gen_ai.system` veya en son GenAI anlamsal kuralları seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Varsayılan olarak `gen_ai.system` veya en son GenAI anlamsal kuralları seçildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - Hatalarda `openclaw.errorCategory` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (yukarı akış sağlayıcı istek kimliğinin sınırlı SHA tabanlı hash'i; ham kimlikler dışa aktarılmaz)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlandığında: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Hatada: `openclaw.harness.phase`, `openclaw.errorCategory`, isteğe bağlı `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (prompt, geçmiş, yanıt veya session-key içeriği yok)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü mesajları, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span'leri ayrıca seçtiğiniz belirli içerik sınıfları için sınırlı, redakte edilmiş `openclaw.content.*` özniteliklerini de içerebilir.

## Tanılama olay kataloğu

Aşağıdaki olaylar yukarıdaki metrikleri ve span'leri destekler. Plugin'ler OTLP dışa aktarımı olmadan da bunlara doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` — token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal,
  session kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/turn muhasebesidir;
  `context.used` mevcut prompt/bağlam anlık görüntüsüdür ve önbelleğe alınmış girdi
  veya araç döngüsü çağrıları söz konusu olduğunda sağlayıcı `usage.total` değerinden
  daha düşük olabilir.

**Mesaj akışı**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kuyruk ve session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (toplam sayaçlar: webhook'lar/kuyruk/session)

**Harness yaşam döngüsü**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ajan harness'ı için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe bağlı
  `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir. Tamamlanma
  `durationMs`, `outcome`, isteğe bağlı `resultClassification`, `yieldDetected`
  ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve
  isteğe bağlı `cleanupFailed` ekler.

**Exec**

- `exec.process.completed` — terminal sonucu, süre, hedef, mod, çıkış
  kodu ve hata türü. Komut metni ve çalışma dizinleri dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan tanılama olaylarını Plugin'ler veya özel alıcılar için kullanılabilir tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` yükseltmeden hedefli hata ayıklama çıktısı için tanılama
bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri
destekler (ör. `telegram.*` veya `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Veya tek seferlik env geçersiz kılması olarak:

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

- [Günlük kaydı](/tr/logging) — dosya günlükleri, konsol çıktısı, CLI tailing ve Control UI Günlükler sekmesi
- [Gateway günlük kaydı iç yapıları](/tr/gateway/logging) — WS günlük stilleri, alt sistem ön ekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) — hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) — operatör destek paketi aracı (OTEL dışa aktarımından ayrıdır)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) — tam `diagnostics.*` alan başvurusu
