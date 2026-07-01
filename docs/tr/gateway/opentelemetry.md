---
read_when:
    - OpenClaw model kullanımı, mesaj akışı veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - İzleri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna bağlıyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına veya öznitelik şekillerine ihtiyacınız vardır
summary: OpenClaw tanılamalarını diagnostics-otel Plugin'i aracılığıyla OpenTelemetry toplayıcılarına veya stdout JSONL'ye dışa aktarın
title: OpenTelemetry dışa aktarımı
x-i18n:
    generated_at: "2026-07-01T08:24:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, resmi `diagnostics-otel` Plugin'i üzerinden **OTLP/HTTP (protobuf)** kullanarak tanılamaları dışa aktarır. Günlükler, container ve sandbox günlük işlem hatları için stdout JSONL olarak da yazılabilir. OTLP/HTTP kabul eden herhangi bir collector veya backend kod değişikliği olmadan çalışır. Yerel dosya günlükleri ve bunların nasıl okunacağı için bkz. [Günlükleme](/tr/logging).

## Birlikte nasıl çalışır

- **Tanılama olayları**, Gateway ve paketle gelen Plugin'ler tarafından model çalıştırmaları, ileti akışı, oturumlar, kuyruklar ve exec için yayılan yapılandırılmış, işlem içi kayıtlardır.
- **`diagnostics-otel` Plugin'i** bu olaylara abone olur ve bunları OTLP/HTTP üzerinden OpenTelemetry **metrikleri**, **trace'leri** ve **günlükleri** olarak dışa aktarır. Ayrıca tanılama günlük kayıtlarını stdout JSONL'ye yansıtabilir.
- **Sağlayıcı çağrıları**, sağlayıcı taşıması özel üstbilgileri kabul ettiğinde OpenClaw'ın güvenilen model çağrısı span bağlamından bir W3C `traceparent` üstbilgisi alır. Plugin tarafından yayılan trace bağlamı aktarılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de Plugin etkinleştirildiğinde bağlanır; bu nedenle işlem içi maliyet varsayılan olarak neredeyse sıfır kalır.

## Hızlı başlangıç

Paketli kurulumlarda önce Plugin'i yükleyin:

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

Plugin'i CLI'dan da etkinleştirebilirsiniz:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` şu anda yalnızca `http/protobuf` destekler. `grpc` yok sayılır.
</Note>

## Dışa aktarılan sinyaller

| Sinyal      | İçeriği                                                                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrikler** | Token kullanımı, maliyet, çalıştırma süresi, failover, Skills kullanımı, ileti akışı, Talk olayları, kuyruk şeritleri, oturum durumu/kurtarma, araç yürütme, büyük boyutlu payload'lar, exec ve bellek baskısı için sayaçlar ve histogramlar. |
| **Trace'ler**  | Model kullanımı, model çağrıları, harness yaşam döngüsü, Skills kullanımı, araç yürütme, exec, webhook/ileti işleme, bağlam derleme ve araç döngüleri için span'ler.                                                            |
| **Günlükler**    | `diagnostics.otel.logs` etkinleştirildiğinde OTLP veya stdout JSONL üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları; içerik yakalama açıkça etkinleştirilmedikçe günlük gövdeleri dışarıda bırakılır.                                |

`traces`, `metrics` ve `logs` ayarlarını birbirinden bağımsız olarak açıp kapatın. `diagnostics.otel.enabled` true olduğunda trace'ler ve metrikler varsayılan olarak açıktır. Günlükler varsayılan olarak kapalıdır ve yalnızca `diagnostics.otel.logs` açıkça `true` olduğunda dışa aktarılır. Günlük dışa aktarma varsayılan olarak OTLP'ye yapılır; stdout üzerinde JSONL için `diagnostics.otel.logsExporter` değerini `stdout`, her tanılama günlük kaydını hem OTLP'ye hem de stdout'a göndermek için `both` olarak ayarlayın.

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
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` değerini geçersiz kılar. Değer zaten `/v1/traces`, `/v1/metrics` veya `/v1/logs` içeriyorsa olduğu gibi kullanılır.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özgü endpoint geçersiz kılmaları. Sinyale özgü yapılandırma, sinyale özgü env üzerinde; o da paylaşılan endpoint üzerinde önceliklidir.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Kablo protokolünü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en son deneysel GenAI çıkarım span biçimini yaymak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrikleri ne olursa olsun her zaman sınırlı, düşük kardinaliteli semantik öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir preload veya ana işlem global OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar ancak yine de tanılama dinleyicilerini bağlar ve `traces`/`metrics`/`logs` ayarlarını dikkate alır.                                                                                                                    |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak dışa aktarılmaz. Span'ler sınırlı tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi, yalnızca hash istek kimlikleri, araç kaynağı, araç sahibi ve Skills adı/kaynağı) ve asla prompt metni, yanıt metni, araç girdileri, araç çıktıları, Skills dosya yolları veya oturum anahtarları içermez. OTLP günlük kayıtları varsayılan olarak önem derecesini, logger'ı, kod konumunu, güvenilen trace bağlamını ve temizlenmiş öznitelikleri tutar; ancak ham günlük ileti gövdesi yalnızca `diagnostics.otel.captureContent` boolean `true` olarak ayarlandığında dışa aktarılır. Ayrıntılı `captureContent.*` alt anahtarları günlük gövdelerini etkinleştirmez. Kapsamlı ajan oturum anahtarlarına benzeyen etiketler `unknown` ile değiştirilir.
Talk metrikleri yalnızca mod, taşıma, sağlayıcı ve olay türü gibi sınırlı olay meta verilerini dışa aktarır. Transkriptler, ses payload'ları, oturum kimlikleri, turn kimlikleri, çağrı kimlikleri, oda kimlikleri veya devir token'ları içermez.

Giden model istekleri bir W3C `traceparent` üstbilgisi içerebilir. Bu üstbilgi yalnızca etkin model çağrısı için OpenClaw'a ait tanılama trace bağlamından oluşturulur. Mevcut çağıran tarafından sağlanmış `traceparent` üstbilgileri değiştirilir; böylece Plugin'ler veya özel sağlayıcı seçenekleri servisler arası trace soyunu taklit edemez.

`diagnostics.otel.captureContent.*` değerini yalnızca collector ve saklama politikanız prompt, yanıt, araç veya sistem prompt metni için onaylanmışsa `true` olarak ayarlayın. Her alt anahtar bağımsız olarak opt-in'dir:

- `inputMessages` - kullanıcı prompt içeriği.
- `outputMessages` - model yanıt içeriği.
- `toolInputs` - araç argümanı payload'ları.
- `toolOutputs` - araç sonucu payload'ları.
- `systemPrompt` - birleştirilmiş sistem/geliştirici prompt'u.
- `toolDefinitions` - model aracı adları, açıklamaları ve şemaları.

Herhangi bir alt anahtar etkinleştirildiğinde, model ve araç span'leri yalnızca o sınıf için sınırlı, redakte edilmiş `openclaw.content.*` öznitelikleri alır. Boolean `captureContent: true` değerini yalnızca OTLP günlük ileti gövdelerinin de dışa aktarım için onaylandığı geniş tanılama yakalamaları için kullanın.

`toolInputs`/`toolOutputs` içeriği, yerleşik ajan runtime'ının araç yürütmeleri için yakalanır (tamamlanan/hatalı span'lerde `openclaw.content.tool_input`, tamamlanan span'lerde `openclaw.content.tool_output`). Harici harness araç çağrıları (Codex, Claude CLI) içerik payload'ları olmadan `tool.execution.*` span'leri yayar. Yakalanan içerik güvenilen, yalnızca dinleyiciye açık bir kanalda taşınır ve asla genel tanılama olay veri yoluna yerleştirilmez.

## Örnekleme ve flush etme

- **İzler:** `diagnostics.otel.sampleRate` (yalnızca kök span, `0.0` tümünü atar,
  `1.0` tümünü tutar).
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Günlükler:** OTLP günlükleri `logging.level` (dosya günlük düzeyi) ayarına uyar. Konsol biçimlendirmesini değil,
  tanılama günlük kaydı redaksiyon yolunu kullanırlar. Yüksek hacimli
  kurulumlar yerel örnekleme yerine OTLP collector örnekleme/filtrelemeyi tercih etmelidir.
  Platformunuz stdout/stderr çıktısını zaten bir günlük işleyicisine
  gönderiyorsa ve bir OTLP günlük
  collector'ınız yoksa `diagnostics.otel.logsExporter: "stdout"` ayarını yapın. Stdout kayıtları satır başına bir JSON nesnesidir ve uygun olduğunda `ts`, `signal`,
  `service.name`, önem derecesi, gövde, redakte edilmiş öznitelikler ve güvenilir iz alanlarını içerir.
- **Dosya günlüğü korelasyonu:** JSONL dosya günlükleri, günlük çağrısı geçerli bir
  tanılama iz bağlamı taşıdığında üst düzey `traceId`,
  `spanId`, `parentSpanId` ve `traceFlags` içerir; bu da günlük işleyicilerinin yerel günlük satırlarını
  dışa aktarılan span'lerle birleştirmesine olanak tanır.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket çerçeveleri
  dahili bir istek iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları
  varsayılan olarak istek izini devralırken, aracı çalıştırma ve model çağrısı span'leri
  alt öğeler olarak oluşturulur, böylece sağlayıcı `traceparent` başlıkları aynı izde kalır.
- **Model çağrısı korelasyonu:** `openclaw.model.call` span'leri varsayılan olarak güvenli istem
  bileşeni boyutlarını içerir ve sağlayıcı sonucu kullanımı açığa çıkarıyorsa çağrı başına token özniteliklerini içerir.
  `openclaw.model.usage`, toplu maliyet, bağlam ve kanal panoları için çalıştırma düzeyi
  muhasebe span'i olarak kalır; yayan çalışma zamanında güvenilir iz
  bağlamı olduğunda aynı tanılama izinde kalır.

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
- `openclaw.model_call.response_bytes` (histogram, akış yanıt parçacığı yüklerinin UTF-8 bayt boyutu; yüksek frekanslı metin, düşünme ve araç çağrısı deltaları yalnızca artımlı `delta` baytlarını sayar; ham yanıt içeriği yok)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, ilk akış yanıt olayından önce geçen süre)
- `openclaw.model.failover` (sayaç, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (sayaç, öznitelikler: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, isteğe bağlı `openclaw.agent`, isteğe bağlı `openclaw.toolName`)

### İleti akışı

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

### Talk

- `openclaw.talk.event` (sayaç, öznitelikler: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bir Talk olayı süre bildirdiğinde yayılır)
- `openclaw.talk.audio.bytes` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bayt uzunluğu bildiren Talk ses çerçevesi olayları için yayılır)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`; kurtarılabilir bayat oturum kayıt tutma için yayılır)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`; kurtarılabilir bayat oturum kayıt tutma için yayılır)
- `openclaw.session.turn.created` (sayaç, öznitelikler: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, öznitelikler: eşleşen kurtarma sayacıyla aynı)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Oturum canlılığı telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme olmayan yaş eşiğidir.
Bir `processing` oturumu, OpenClaw yanıt, araç, durum, blok veya ACP çalışma zamanı ilerlemesi gözlemlediği sürece
bu eşiğe doğru yaşlanmaz.
Yazıyor keepalive'ları ilerleme olarak sayılmaz, bu nedenle sessiz bir model veya harness
yine de algılanabilir.

OpenClaw, oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü iş, model çağrıları veya araç çağrıları
  hâlâ ilerleme kaydediyor. `diagnostics.stuckSessionWarnMs` süresini aşacak kadar sessiz kalan
  sahipli model çağrıları da `diagnostics.stuckSessionAbortMs` öncesinde uzun süren olarak raporlanır;
  böylece yavaş veya akışsız model sağlayıcıları, iptal gözlemlenebilir kaldıkları sürece
  durmuş gateway oturumları gibi görünmez.
- `session.stalled`: etkin iş var, ancak etkin çalıştırma yakın zamanda
  ilerleme bildirmedi. Sahipli model çağrıları `diagnostics.stuckSessionAbortMs` zamanında veya sonrasında
  `session.long_running` durumundan `session.stalled` durumuna geçer; sahipsiz
  bayat model/araç etkinliği zararsız uzun süren iş olarak değerlendirilmez.
  Durmuş gömülü çalıştırmalar önce yalnızca gözlem modunda kalır, ardından
  ilerleme olmadan `diagnostics.stuckSessionAbortMs` sonrasında iptal-boşaltma yapar;
  böylece hattın arkasındaki kuyruğa alınmış dönüşler devam edebilir. Ayarlanmadığında iptal eşiği,
  en az 5 dakika ve `diagnostics.stuckSessionWarnMs` değerinin 3 katı olan daha güvenli
  genişletilmiş pencereye varsayılanlanır.
- `session.stuck`: etkin iş olmayan bayat oturum kayıt tutma veya bayat sahipsiz
  model/araç etkinliğine sahip boşta bekleyen kuyruğa alınmış oturum. Bu,
  kurtarma kapıları geçtikten hemen sonra etkilenen oturum hattını serbest bırakır.

Kurtarma, yapılandırılmış `session.recovery.requested` ve
`session.recovery.completed` olayları yayar. Tanılama oturum durumu yalnızca
değişiklik yapan bir kurtarma sonucu (`aborted` veya `released`) sonrasında ve yalnızca
aynı işleme nesli hâlâ geçerliyse boşta olarak işaretlenir.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını,
`openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck`
span'ini yayar. Tekrarlanan `session.stuck` tanılamaları oturum değişmeden kaldığı sürece
geri çekilir; bu nedenle panolar her
Heartbeat işaretine değil, sürdürülen artışlara alarm vermelidir. Yapılandırma düğmesi ve varsayılanlar için
[Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) bölümüne bakın.

Canlılık uyarıları ayrıca şunları yayar:

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
  - Varsayılan olarak `gen_ai.system` veya en yeni GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Varsayılan olarak `gen_ai.system` veya en yeni GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - Hatalarda `openclaw.errorCategory` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (yalnızca güvenli bileşen boyutları, prompt metni yok)
  - Model çağrısı sonucu ilgili tekil çağrı için sağlayıcı kullanımını taşıdığında `openclaw.model_call.usage.*` ve `gen_ai.usage.*`
  - `openclaw.provider.request_id_hash` (üst sağlayıcı istek kimliğinin sınırlı SHA tabanlı karması; ham kimlikler dışa aktarılmaz)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ile model çağrısı span'leri `openclaw.model.call` yerine en yeni GenAI çıkarım span adı `{gen_ai.operation.name} {gen_ai.request.model}` ve `CLIENT` span türünü kullanır.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (prompt, geçmiş, yanıt veya oturum anahtarı içeriği yok)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü iletileri, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span'leri, etkinleştirdiğiniz belirli içerik sınıfları için sınırlı ve redakte edilmiş `openclaw.content.*` özniteliklerini de içerebilir.

## Tanılama olay kataloğu

Aşağıdaki olaylar, yukarıdaki metrikleri ve span'leri destekler. Plugin'ler bunlara OTLP dışa aktarımı olmadan da doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` - token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal, oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/tur muhasebesidir; `context.used` geçerli prompt/bağlam anlık görüntüsüdür ve önbelleğe alınmış girdi veya araç döngüsü çağrıları söz konusu olduğunda sağlayıcı `usage.total` değerinden düşük olabilir.

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
  ajan harness'ı için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe bağlı `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir. Tamamlama `durationMs`, `outcome`, isteğe bağlı `resultClassification`, `yieldDetected` ve `itemLifecycle` sayılarını ekler. Hatalar `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve isteğe bağlı `cleanupFailed` ekler.

**Exec**

- `exec.process.completed` - terminal sonuç, süre, hedef, mod, çıkış kodu ve hata türü. Komut metni ve çalışma dizinleri dahil edilmez.
- `exec.approval.followup_suppressed` - oturum geri sıçramasından sonra eski onay takip işlemi düşürüldü. `approvalId`, `reason` (`session_rebound`), `phase` (`direct_delivery` veya `gateway_preflight`) ve dağıtıcı zaman damgasını içerir. Oturum anahtarları, rotalar ve komut metni dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan tanılama olaylarını Plugin'ler veya özel havuzlar için kullanılabilir tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` değerini yükseltmeden hedefli hata ayıklama çıktısı için tanılama bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarlı değildir ve joker karakterleri destekler (örn. `telegram.*` veya `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Veya tek seferlik env geçersiz kılması olarak:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Bayrak çıktısı standart günlük dosyasına (`logging.file`) gider ve yine de `logging.redactSensitive` tarafından redakte edilir. Tam kılavuz:
[Tanılama bayrakları](/tr/diagnostics/flags).

## Devre dışı bırakma

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ayrıca `diagnostics-otel` öğesini `plugins.allow` dışında bırakabilir veya `openclaw plugins disable diagnostics-otel` komutunu çalıştırabilirsiniz.

## İlgili

- [Günlükleme](/tr/logging) - dosya günlükleri, konsol çıktısı, CLI ile takip ve Control UI Günlükler sekmesi
- [Gateway günlükleme iç işleyişi](/tr/gateway/logging) - WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) - hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) - operatör destek paketi aracı (OTEL dışa aktarımından ayrıdır)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) - tam `diagnostics.*` alan başvurusu
