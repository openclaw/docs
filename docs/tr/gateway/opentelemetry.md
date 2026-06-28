---
read_when:
    - OpenClaw model kullanımını, ileti akışını veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - Grafana, Datadog, Honeycomb, New Relic, Tempo veya başka bir OTLP arka ucuna izleri, metrikleri ya da günlükleri bağlıyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına veya öznitelik şekillerine ihtiyacınız vardır
summary: OpenClaw tanılamalarını diagnostics-otel Plugin aracılığıyla OpenTelemetry toplayıcılarına veya stdout JSONL’ye dışa aktarın
title: OpenTelemetry dışa aktarımı
x-i18n:
    generated_at: "2026-06-28T00:37:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, resmi `diagnostics-otel` Plugin'i aracılığıyla **OTLP/HTTP (protobuf)** kullanarak tanılama verilerini dışa aktarır. Günlükler, container ve sandbox günlük hatları için stdout JSONL olarak da yazılabilir. OTLP/HTTP kabul eden herhangi bir collector veya backend, kod değişikliği gerektirmeden çalışır. Yerel dosya günlükleri ve bunların nasıl okunacağı için bkz. [Günlükleme](/tr/logging).

## Nasıl birlikte çalışır

- **Tanılama olayları**, model çalıştırmaları, mesaj akışı, oturumlar, kuyruklar ve exec için Gateway ve paketle birlikte gelen Plugin'ler tarafından yayımlanan yapılandırılmış, süreç içi kayıtlardır.
- **`diagnostics-otel` Plugin'i**, bu olaylara abone olur ve bunları OTLP/HTTP üzerinden OpenTelemetry **metrikleri**, **izleri** ve **günlükleri** olarak dışa aktarır. Tanılama günlük kayıtlarını stdout JSONL'ye de yansıtabilir.
- **Sağlayıcı çağrıları**, sağlayıcı aktarımı özel başlıkları kabul ettiğinde OpenClaw'ın güvenilir model çağrısı span bağlamından bir W3C `traceparent` başlığı alır. Plugin tarafından yayımlanan iz bağlamı yayılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de Plugin etkinleştirildiğinde bağlanır; bu nedenle süreç içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

Paketli kurulumlar için önce Plugin'i kurun:

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

Plugin'i CLI'den de etkinleştirebilirsiniz:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
</Note>

## Dışa aktarılan sinyaller

| Sinyal       | İçeriğine neler girer                                                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrikler** | Token kullanımı, maliyet, çalıştırma süresi, failover, beceri kullanımı, mesaj akışı, Talk olayları, kuyruk hatları, oturum durumu/kurtarma, araç yürütme, aşırı büyük payload'lar, exec ve bellek baskısı için sayaçlar ve histogramlar. |
| **İzler**    | Model kullanımı, model çağrıları, harness yaşam döngüsü, beceri kullanımı, araç yürütme, exec, webhook/mesaj işleme, bağlam derleme ve araç döngüleri için span'ler.                                                   |
| **Günlükler** | `diagnostics.otel.logs` etkinleştirildiğinde OTLP veya stdout JSONL üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları; içerik yakalama açıkça etkinleştirilmedikçe günlük gövdeleri saklı tutulur.       |

`traces`, `metrics` ve `logs` bağımsız olarak açılıp kapatılabilir. `diagnostics.otel.enabled` true olduğunda izler ve metrikler varsayılan olarak açıktır. Günlükler varsayılan olarak kapalıdır ve yalnızca `diagnostics.otel.logs` açıkça `true` olduğunda dışa aktarılır. Günlük dışa aktarımı varsayılan olarak OTLP kullanır; stdout üzerinde JSONL için `diagnostics.otel.logsExporter` değerini `stdout`, her tanılama günlük kaydını hem OTLP'ye hem de stdout'a göndermek için `both` olarak ayarlayın.

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

### Ortam değişkenleri

| Değişken                                                                                                          | Amaç                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` değerini geçersiz kılar. Değer zaten `/v1/traces`, `/v1/metrics` veya `/v1/logs` içeriyorsa olduğu gibi kullanılır.                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü endpoint geçersiz kılmalarıdır. Sinyale özgü yapılandırma, sinyale özgü env değerine; o da paylaşılan endpoint'e göre önceliklidir.                                                                                                      |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Hat protokolünü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en yeni deneysel GenAI çıkarım span şeklini yayımlamak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrikleri ne olursa olsun sınırlı, düşük kardinaliteli semantik öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir preload veya ana süreç global OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar, ancak tanılama dinleyicilerini bağlamaya ve `traces`/`metrics`/`logs` ayarlarına uymaya devam eder.                                                                          |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak **dışa aktarılmaz**. Span'ler sınırlı tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi, yalnızca hash içeren istek id'leri, araç kaynağı, araç sahibi ve skill adı/kaynağı) ve hiçbir zaman prompt metni, yanıt metni, araç girdileri, araç çıktıları, skill dosya yolları veya oturum anahtarları içermez. OTLP günlük kayıtları varsayılan olarak önem derecesini, logger'ı, kod konumunu, güvenilir iz bağlamını ve sanitize edilmiş öznitelikleri korur; ancak ham günlük mesajı gövdesi yalnızca `diagnostics.otel.captureContent` boolean `true` olarak ayarlandığında dışa aktarılır. Ayrıntılı `captureContent.*` alt anahtarları günlük gövdelerini etkinleştirmez. Kapsamlı agent oturum anahtarlarına benzeyen etiketler `unknown` ile değiştirilir.
Talk metrikleri yalnızca mod, transport, sağlayıcı ve olay türü gibi sınırlı olay metadata'sını dışa aktarır. Transcript'leri, ses payload'larını, oturum id'lerini, turn id'lerini, çağrı id'lerini, oda id'lerini veya handoff token'larını içermez.

Giden model istekleri bir W3C `traceparent` başlığı içerebilir. Bu başlık yalnızca etkin model çağrısı için OpenClaw'a ait tanılama iz bağlamından oluşturulur. Mevcut çağıran tarafından sağlanan `traceparent` başlıkları değiştirilir; böylece Plugin'ler veya özel sağlayıcı seçenekleri servisler arası iz soyunu taklit edemez.

`diagnostics.otel.captureContent.*` değerini yalnızca collector ve saklama politikanız prompt, yanıt, araç veya system-prompt metni için onaylıysa `true` olarak ayarlayın. Her alt anahtar bağımsız olarak opt-in'dir:

- `inputMessages` - kullanıcı prompt içeriği.
- `outputMessages` - model yanıt içeriği.
- `toolInputs` - araç argüman payload'ları.
- `toolOutputs` - araç sonuç payload'ları.
- `systemPrompt` - birleştirilmiş system/developer prompt'u.
- `toolDefinitions` - model araç adları, açıklamaları ve şemaları.

Herhangi bir alt anahtar etkinleştirildiğinde, model ve araç span'leri yalnızca o sınıf için sınırlı, redakte edilmiş `openclaw.content.*` öznitelikleri alır. Boolean `captureContent: true` değerini yalnızca OTLP günlük mesajı gövdelerinin de dışa aktarım için onaylandığı geniş tanılama yakalamalarında kullanın.

`toolInputs`/`toolOutputs` içeriği, yerleşik agent runtime'ının araç yürütmeleri için yakalanır (tamamlanan/hatalı span'lerde `openclaw.content.tool_input`, tamamlanan span'lerde `openclaw.content.tool_output`). Harici harness araç çağrıları (Codex, Claude CLI) içerik payload'ları olmadan `tool.execution.*` span'leri yayımlar. Yakalanan içerik güvenilir, yalnızca dinleyiciye açık bir kanalda taşınır ve hiçbir zaman genel tanılama olay veri yoluna yerleştirilmez.

## Örnekleme ve boşaltma

- **İzler:** `diagnostics.otel.sampleRate` (yalnızca root-span, `0.0` tümünü düşürür, `1.0` tümünü tutar).
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Günlükler:** OTLP günlükleri `logging.level` değerine (dosya günlük seviyesi) uyar. Konsol biçimlendirmesini değil, tanılama günlük kaydı redaksiyon yolunu kullanırlar. Yüksek hacimli kurulumlar yerel örnekleme yerine OTLP collector örnekleme/filtrelemeyi tercih etmelidir. Platformunuz stdout/stderr'i zaten bir günlük işleyicisine gönderiyorsa ve OTLP günlük collector'ınız yoksa `diagnostics.otel.logsExporter: "stdout"` olarak ayarlayın. Stdout kayıtları satır başına bir JSON nesnesidir ve mevcut olduğunda `ts`, `signal`, `service.name`, önem derecesi, gövde, redakte edilmiş öznitelikler ve güvenilir iz alanlarını içerir.
- **Dosya günlüğü korelasyonu:** JSONL dosya günlükleri, günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında üst düzey `traceId`, `spanId`, `parentSpanId` ve `traceFlags` içerir; bu da günlük işleyicilerinin yerel günlük satırlarını dışa aktarılan span'lerle birleştirmesini sağlar.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket frame'leri dahili bir istek iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları varsayılan olarak istek izini devralırken, agent çalıştırma ve model çağrısı span'leri alt öğe olarak oluşturulur; böylece sağlayıcı `traceparent` başlıkları aynı izde kalır.

## Dışa aktarılan metrikler

### Model kullanımı

- `openclaw.tokens` (sayaç, öznitelikler: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantik kuralları metriği, öznitelikler: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI semantik kuralları metriği, öznitelikler: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)
- `openclaw.model_call.duration_ms` (histogram, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ayrıca sınıflandırılmış hatalarda `openclaw.errorCategory` ve `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, son model isteği yükünün UTF-8 bayt boyutu; ham yük içeriği yok)
- `openclaw.model_call.response_bytes` (histogram, akışla gönderilen yanıt parçası yüklerinin UTF-8 bayt boyutu; yüksek frekanslı metin, düşünme ve araç çağrısı deltaları yalnızca artımlı `delta` baytlarını sayar; ham yanıt içeriği yok)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, ilk akışlı yanıt olayından önce geçen süre)
- `openclaw.model.failover` (sayaç, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (sayaç, öznitelikler: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, isteğe bağlı `openclaw.agent`, isteğe bağlı `openclaw.toolName`)

### Mesaj akışı

- `openclaw.webhook.received` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Konuşma

- `openclaw.talk.event` (sayaç, öznitelikler: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bir Konuşma olayı süre bildirdiğinde yayınlanır)
- `openclaw.talk.audio.bytes` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bayt uzunluğu bildiren Konuşma ses çerçevesi olayları için yayınlanır)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`; kurtarılabilir eskimiş oturum kayıtları için yayınlanır)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`; kurtarılabilir eskimiş oturum kayıtları için yayınlanır)
- `openclaw.session.turn.created` (sayaç, öznitelikler: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, öznitelikler: eşleşen kurtarma sayacıyla aynı)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Oturum canlılık telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme olmama yaş eşiğidir. Bir `processing` oturumu, OpenClaw yanıt, araç, durum, blok veya ACP çalışma zamanı ilerlemesi gözlemlediği sürece bu eşiğe doğru yaşlanmaz. Yazıyor canlı tutmaları ilerleme olarak sayılmaz; bu nedenle sessiz bir model veya harness yine de algılanabilir.

OpenClaw, oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü iş, model çağrıları veya araç çağrıları hâlâ ilerleme kaydediyordur. `diagnostics.stuckSessionWarnMs` sonrasında sessiz kalan sahipli model çağrıları da `diagnostics.stuckSessionAbortMs` öncesinde uzun süren olarak raporlanır; böylece yavaş veya akışsız model sağlayıcıları, iptal gözlemlenebilir kaldıkları sürece durmuş gateway oturumları gibi görünmez.
- `session.stalled`: etkin iş vardır, ancak etkin çalıştırma yakın zamanda ilerleme bildirmemiştir. Sahipli model çağrıları `diagnostics.stuckSessionAbortMs` anında veya sonrasında `session.long_running` durumundan `session.stalled` durumuna geçer; sahipsiz eskimiş model/araç etkinliği zararsız uzun süren iş olarak değerlendirilmez. Durmuş gömülü çalıştırmalar önce yalnızca gözlemle kalır, sonra `diagnostics.stuckSessionAbortMs` sonrasında ilerleme yoksa iptal-boşaltma yapar; böylece kulvarın arkasındaki kuyruğa alınmış dönüşler sürdürülebilir. Ayarlanmamışsa iptal eşiği, en az 5 dakika ve `diagnostics.stuckSessionWarnMs` değerinin 3 katı olan daha güvenli uzatılmış pencereye varsayılanlanır.
- `session.stuck`: etkin işi olmayan eskimiş oturum kayıtları veya sahipsiz eskimiş model/araç etkinliğine sahip boşta bir kuyruğa alınmış oturum. Bu, kurtarma kapıları geçtikten hemen sonra etkilenen oturum kulvarını serbest bırakır.

Kurtarma, yapılandırılmış `session.recovery.requested` ve `session.recovery.completed` olayları yayınlar. Tanılama oturum durumu yalnızca değiştirici bir kurtarma sonucu (`aborted` veya `released`) sonrasında ve yalnızca aynı işleme nesli hâlâ güncelse boşta olarak işaretlenir.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını, `openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck` span'ini yayınlar. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir; bu nedenle panolar her Heartbeat tikinde değil, kalıcı artışlarda uyarı vermelidir. Yapılandırma düğmesi ve varsayılanlar için bkz. [Yapılandırma referansı](/tr/gateway/configuration-reference#diagnostics).

Canlılık uyarıları ayrıca şunları yayınlar:

- `openclaw.liveness.warning` (sayaç, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, öznitelikler: `openclaw.liveness.reason`)

### Harness yaşam döngüsü

- `openclaw.harness.duration_ms` (histogram, öznitelikler: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, hatalarda `openclaw.harness.phase`)

### Araç yürütme

- `openclaw.tool.execution.duration_ms` (histogram, öznitelikler: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, ayrıca hatalarda `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (sayaç, öznitelikler: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histogram, öznitelikler: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Tanılama iç bileşenleri (bellek ve araç döngüsü)

- `openclaw.payload.large` (sayaç, öznitelikler: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, öznitelikler: `openclaw.payload.large` ile aynı)
- `openclaw.memory.heap_used_bytes` (histogram, öznitelikler: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (sayaç, öznitelikler: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (sayaç, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, öznitelikler: `openclaw.toolName`, `openclaw.outcome`)

## Dışa aktarılan span'ler

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - Varsayılan olarak `gen_ai.system`, veya en son GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Varsayılan olarak `gen_ai.system`, veya en son GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - Hatalarda `openclaw.errorCategory` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (yukarı akış sağlayıcı istek kimliğinin sınırlı SHA tabanlı karması; ham kimlikler dışa aktarılmaz)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ile, model çağrısı span'leri `openclaw.model.call` yerine en son GenAI çıkarım span adı `{gen_ai.operation.name} {gen_ai.request.model}` ve `CLIENT` span türünü kullanır.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlandığında: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Hata durumunda: `openclaw.harness.phase`, `openclaw.errorCategory`, isteğe bağlı `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (istem, geçmiş, yanıt veya oturum anahtarı içeriği yok)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü iletileri, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span'leri ayrıca
etkinleştirdiğiniz belirli içerik sınıfları için sınırlı, redakte edilmiş
`openclaw.content.*` özniteliklerini içerebilir.

## Tanılama olay kataloğu

Aşağıdaki olaylar, yukarıdaki metrikleri ve span'leri destekler. Plugin'ler ayrıca OTLP dışa aktarımı olmadan
bunlara doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` - belirteçler, maliyet, süre, bağlam, sağlayıcı/model/kanal,
  oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/tur muhasebesidir;
  `context.used` geçerli istem/bağlam anlık görüntüsüdür ve önbelleğe alınmış giriş veya araç döngüsü çağrıları söz konusu olduğunda
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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ajan harness'i için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe bağlı
  `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliği içerir. Tamamlanma
  `durationMs`, `outcome`, isteğe bağlı `resultClassification`, `yieldDetected`
  ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve
  isteğe bağlı `cleanupFailed` ekler.

**Exec**

- `exec.process.completed` - terminal sonucu, süre, hedef, mod, çıkış
  kodu ve hata türü. Komut metni ve çalışma dizinleri
  dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan tanılama olaylarını Plugin'ler veya özel havuzlar için kullanılabilir durumda tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` değerini yükseltmeden hedefli hata ayıklama çıktısı için tanılama
bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri destekler (ör. `telegram.*` veya
`*`):

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
`openclaw plugins disable diagnostics-otel` komutunu çalıştırabilirsiniz.

## İlgili

- [Günlükleme](/tr/logging) - dosya günlükleri, konsol çıktısı, CLI ile takip ve Control UI Günlükler sekmesi
- [Gateway günlükleme iç işleyişi](/tr/gateway/logging) - WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) - hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) - operatör destek paketi aracı (OTEL dışa aktarımından ayrı)
- [Yapılandırma referansı](/tr/gateway/configuration-reference#diagnostics) - tam `diagnostics.*` alan referansı
