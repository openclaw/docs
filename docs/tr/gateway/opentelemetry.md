---
read_when:
    - OpenClaw model kullanımını, ileti akışını veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - Trace’leri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna bağlıyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına ya da öznitelik biçimlerine ihtiyacınız vardır
summary: OpenClaw tanılamalarını diagnostics-otel Plugin aracılığıyla OpenTelemetry toplayıcılarına veya stdout JSONL'ye dışa aktar
title: OpenTelemetry dışa aktarma
x-i18n:
    generated_at: "2026-06-30T14:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, tanılamaları resmi `diagnostics-otel` Plugin'i üzerinden
**OTLP/HTTP (protobuf)** kullanarak dışa aktarır. Günlükler, konteyner ve
sandbox günlük işlem hatları için stdout JSONL olarak da yazılabilir. OTLP/HTTP
kabul eden herhangi bir collector veya backend, kod değişikliği olmadan çalışır.
Yerel dosya günlükleri ve bunların nasıl okunacağı için bkz. [Günlükleme](/tr/logging).

## Nasıl birlikte çalışır

- **Tanılama olayları**, model çalıştırmaları, mesaj akışı, oturumlar, kuyruklar
  ve exec için Gateway ve paketle birlikte gelen Plugin'ler tarafından yayılan
  yapılandırılmış, süreç içi kayıtlardır.
- **`diagnostics-otel` Plugin'i** bu olaylara abone olur ve bunları OTLP/HTTP
  üzerinden OpenTelemetry **metrikleri**, **izleri** ve **günlükleri** olarak
  dışa aktarır. Tanılama günlük kayıtlarını stdout JSONL'ye de yansıtabilir.
- **Sağlayıcı çağrıları**, sağlayıcı aktarımı özel header'ları kabul ettiğinde
  OpenClaw'ın güvenilir model çağrısı span bağlamından bir W3C `traceparent`
  header'ı alır. Plugin tarafından yayılan iz bağlamı aktarılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de Plugin etkin olduğunda
  bağlanır; bu nedenle süreç içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

Paketli kurulumlarda önce Plugin'i kurun:

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

| Sinyal      | İçeriği                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrikler** | Token kullanımı, maliyet, çalışma süresi, failover, Skills kullanımı, mesaj akışı, Talk olayları, kuyruk hatları, oturum durumu/kurtarma, araç yürütme, aşırı büyük payload'lar, exec ve bellek baskısı için sayaçlar ve histogramlar. |
| **İzler**  | Model kullanımı, model çağrıları, harness yaşam döngüsü, Skills kullanımı, araç yürütme, exec, webhook/mesaj işleme, bağlam derleme ve araç döngüleri için span'ler.                                                            |
| **Günlükler**    | `diagnostics.otel.logs` etkinleştirildiğinde OTLP veya stdout JSONL üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları; içerik yakalama açıkça etkinleştirilmedikçe günlük gövdeleri saklı tutulur.                                |

`traces`, `metrics` ve `logs` ayarlarını bağımsız olarak açıp kapatın.
`diagnostics.otel.enabled` true olduğunda izler ve metrikler varsayılan olarak
açıktır. Günlükler varsayılan olarak kapalıdır ve yalnızca
`diagnostics.otel.logs` açıkça `true` olduğunda dışa aktarılır. Günlük dışa
aktarımı varsayılan olarak OTLP'dir; stdout üzerinde JSONL için
`diagnostics.otel.logsExporter` değerini `stdout` olarak, her tanılama günlük
kaydını OTLP ve stdout'a göndermek için `both` olarak ayarlayın.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmamışsa kullanılan sinyale özel endpoint geçersiz kılmaları. Sinyale özel yapılandırma, sinyale özel env üzerinde; o da paylaşılan endpoint üzerinde önceliklidir.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` değerini geçersiz kılar.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Kablo protokolünü geçersiz kılar (bugün yalnızca `http/protobuf` dikkate alınır).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name` dahil olmak üzere en yeni deneysel GenAI çıkarım span şeklini yaymak için `gen_ai_latest_experimental` olarak ayarlayın. GenAI metrikleri her durumda sınırlandırılmış, düşük kardinaliteli semantik öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir preload veya host süreci global OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Plugin bu durumda kendi NodeSDK yaşam döngüsünü atlar, ancak tanılama dinleyicilerini yine de bağlar ve `traces`/`metrics`/`logs` ayarlarına uyar.                                                                                                                    |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak dışa aktarılmaz. Span'ler
sınırlandırılmış tanımlayıcılar taşır (kanal, sağlayıcı, model, hata kategorisi,
yalnızca hash istek kimlikleri, araç kaynağı, araç sahibi ve Skills adı/kaynağı)
ve hiçbir zaman prompt metni, yanıt metni, araç girdileri, araç çıktıları,
Skills dosya yolları veya oturum anahtarları içermez. OTLP günlük kayıtları
varsayılan olarak önem derecesi, logger, kod konumu, güvenilir iz bağlamı ve
sanitize edilmiş öznitelikleri korur, ancak ham günlük mesajı gövdesi yalnızca
`diagnostics.otel.captureContent` boolean `true` olarak ayarlandığında dışa
aktarılır. Ayrıntılı `captureContent.*` alt anahtarları günlük gövdelerini
etkinleştirmez. Kapsamlı agent oturum anahtarlarına benzeyen etiketler
`unknown` ile değiştirilir.
Talk metrikleri yalnızca mod, aktarım, sağlayıcı ve olay türü gibi
sınırlandırılmış olay metadata'sını dışa aktarır. Transkriptleri, ses payload'larını,
oturum kimliklerini, turn kimliklerini, çağrı kimliklerini, oda kimliklerini veya
devir token'larını içermez.

Giden model istekleri bir W3C `traceparent` header'ı içerebilir. Bu header
yalnızca etkin model çağrısı için OpenClaw'a ait tanılama iz bağlamından
üretilir. Mevcut çağıran tarafından sağlanan `traceparent` header'ları
değiştirilir; böylece Plugin'ler veya özel sağlayıcı seçenekleri servisler
arası iz soyunu taklit edemez.

`diagnostics.otel.captureContent.*` değerini yalnızca collector'ınız ve saklama
politikanız prompt, yanıt, araç veya sistem prompt'u metni için onaylandığında
`true` olarak ayarlayın. Her alt anahtar bağımsız olarak opt-in'dir:

- `inputMessages` - kullanıcı prompt içeriği.
- `outputMessages` - model yanıt içeriği.
- `toolInputs` - araç argümanı payload'ları.
- `toolOutputs` - araç sonucu payload'ları.
- `systemPrompt` - derlenen sistem/geliştirici prompt'u.
- `toolDefinitions` - model araç adları, açıklamaları ve şemaları.

Herhangi bir alt anahtar etkinleştirildiğinde, model ve araç span'leri yalnızca
o sınıf için sınırlandırılmış, redakte edilmiş `openclaw.content.*`
öznitelikleri alır. Boolean `captureContent: true` değerini yalnızca OTLP günlük
mesajı gövdelerinin de dışa aktarım için onaylandığı geniş tanılama yakalamaları
için kullanın.

`toolInputs`/`toolOutputs` içeriği, yerleşik agent runtime'ının araç yürütmeleri
için yakalanır (tamamlanan/hatalı span'lerde `openclaw.content.tool_input`,
tamamlanan span'lerde `openclaw.content.tool_output`). Harici harness araç
çağrıları (Codex, Claude CLI), içerik payload'ları olmadan `tool.execution.*`
span'leri yayar. Yakalanan içerik güvenilir, yalnızca dinleyiciye açık bir
kanalda taşınır ve hiçbir zaman genel tanılama olay bus'ına yerleştirilmez.

## Örnekleme ve flush etme

- **İzler:** `diagnostics.otel.sampleRate` (yalnızca kök span, `0.0` tümünü bırakır,
  `1.0` tümünü tutar).
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (minimum `1000`).
- **Günlükler:** OTLP günlükleri `logging.level` değerine (dosya günlük düzeyi) uyar. Konsol biçimlendirmesini değil,
  tanılama günlük kaydı redaksiyon yolunu kullanırlar. Yüksek hacimli
  kurulumlar, yerel örnekleme yerine OTLP collector örnekleme/filtrelemeyi tercih etmelidir.
  Platformunuz stdout/stderr akışlarını zaten bir günlük işleyiciye
  gönderiyorsa ve bir OTLP günlükleri collector'ınız yoksa `diagnostics.otel.logsExporter: "stdout"` ayarlayın.
  Stdout kayıtları, mevcut olduğunda `ts`, `signal`,
  `service.name`, önem derecesi, gövde, redakte edilmiş öznitelikler ve güvenilir iz alanları içeren, satır başına bir JSON nesnesidir.
- **Dosya günlüğü korelasyonu:** JSONL dosya günlükleri, günlük çağrısı geçerli
  bir tanılama iz bağlamı taşıdığında üst düzey `traceId`,
  `spanId`, `parentSpanId` ve `traceFlags` alanlarını içerir; bu, günlük işleyicilerinin yerel günlük satırlarını
  dışa aktarılan span'lerle birleştirmesine olanak tanır.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket çerçeveleri dahili
  bir istek iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları
  varsayılan olarak istek izini devralırken, ajan çalıştırması ve model çağrısı span'leri
  alt öğeler olarak oluşturulur; böylece sağlayıcı `traceparent` başlıkları aynı izde kalır.
- **Model çağrısı korelasyonu:** `openclaw.model.call` span'leri varsayılan olarak güvenli prompt
  bileşen boyutlarını içerir ve sağlayıcı sonucu kullanımı açığa çıkarıyorsa çağrı başına token özniteliklerini içerir.
  `openclaw.model.usage`, toplam maliyet, bağlam ve kanal panoları için çalıştırma düzeyi
  muhasebe span'i olarak kalır; yayımlayan runtime güvenilir iz
  bağlamına sahip olduğunda aynı tanılama izinde kalır.

## Dışa aktarılan metrikler

### Model kullanımı

- `openclaw.tokens` (sayaç, öznitelikler: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantik kural metric'i, öznitelikler: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI semantik kural metric'i, öznitelikler: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)
- `openclaw.model_call.duration_ms` (histogram, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, ayrıca sınıflandırılmış hatalarda `openclaw.errorCategory` ve `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, nihai model isteği payload'unun UTF-8 bayt boyutu; ham payload içeriği yok)
- `openclaw.model_call.response_bytes` (histogram, akışla iletilen yanıt chunk payload'larının UTF-8 bayt boyutu; yüksek frekanslı metin, düşünme ve araç çağrısı deltaları yalnızca artımlı `delta` baytlarını sayar; ham yanıt içeriği yok)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, akışla iletilen ilk yanıt olayından önce geçen süre)
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
- `openclaw.talk.event.duration_ms` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bir Talk olayı süre bildirdiğinde yayımlanır)
- `openclaw.talk.audio.bytes` (histogram, öznitelikler: `openclaw.talk.event` ile aynı; bayt uzunluğu bildiren Talk ses çerçevesi olayları için yayımlanır)

### Kuyruklar ve oturumlar

- `openclaw.queue.lane.enqueue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (sayaç, öznitelikler: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, öznitelikler: `openclaw.lane` veya `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, öznitelikler: `openclaw.lane`)
- `openclaw.session.state` (sayaç, öznitelikler: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`; kurtarılabilir eski oturum kayıt tutma için yayımlanır)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`; kurtarılabilir eski oturum kayıt tutma için yayımlanır)
- `openclaw.session.turn.created` (sayaç, öznitelikler: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, öznitelikler: eşleşen recovery sayacıyla aynı)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Oturum canlılığı telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme olmadan geçen süre eşiğidir.
Bir `processing` oturumu, OpenClaw yanıt, araç, durum, blok veya ACP runtime ilerlemesi gözlemlediği sürece
bu eşiğe doğru yaşlanmaz.
Yazıyor keepalive'ları ilerleme olarak sayılmaz; bu nedenle sessiz bir model veya harness
yine de algılanabilir.

OpenClaw, oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü iş, model çağrıları veya araç çağrıları
  hâlâ ilerleme kaydediyor. `diagnostics.stuckSessionWarnMs` süresini aşan şekilde sessiz kalan
  sahipli model çağrıları da `diagnostics.stuckSessionAbortMs` öncesinde uzun süreli olarak raporlanır;
  böylece yavaş veya akışsız model sağlayıcıları, iptal gözlemlenebilir kaldıkları sürece
  takılmış Gateway oturumları gibi görünmez.
- `session.stalled`: etkin iş vardır, ancak etkin çalıştırma yakın zamanda
  ilerleme bildirmemiştir. Sahipli model çağrıları `diagnostics.stuckSessionAbortMs` anında veya sonrasında
  `session.long_running` durumundan `session.stalled` durumuna geçer; sahipsiz
  eski model/araç etkinliği zararsız uzun süreli iş olarak değerlendirilmez.
  Takılmış gömülü çalıştırmalar başlangıçta yalnızca gözlem durumunda kalır, ardından
  `diagnostics.stuckSessionAbortMs` sonrasında ilerleme yoksa abort-drain uygulanır; böylece lane arkasındaki kuyruğa alınmış dönüşler devam edebilir.
  Ayarlanmadığında, iptal eşiği varsayılan olarak en az 5 dakika ve
  `diagnostics.stuckSessionWarnMs` değerinin 3 katı olan daha güvenli
  genişletilmiş pencereye ayarlanır.
- `session.stuck`: etkin iş olmayan eski oturum kayıt tutma veya eski sahipsiz model/araç etkinliği olan
  boşta bir kuyruğa alınmış oturum. Bu, kurtarma kapıları geçtikten hemen sonra
  etkilenen oturum lane'ini serbest bırakır.

Kurtarma, yapılandırılmış `session.recovery.requested` ve
`session.recovery.completed` olaylarını yayımlar. Tanılama oturum durumu yalnızca
değiştirici bir kurtarma sonucu (`aborted` veya `released`) sonrasında ve yalnızca
aynı işleme generation'ı hâlâ güncelse boşta olarak işaretlenir.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını,
`openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck`
span'ini yayımlar. Tekrarlanan `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece
geri çekilir; bu nedenle panolar her Heartbeat tikine değil, sürekli artışlara
uyarı vermelidir. Yapılandırma düğmesi ve varsayılanlar için
[Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) bölümüne bakın.

Canlılık uyarıları ayrıca şunları yayımlar:

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
  - Varsayılan olarak `gen_ai.system`, ya da en son GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - Varsayılan olarak `gen_ai.system`, ya da en son GenAI semantik kuralları etkinleştirildiğinde `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - Hatalarda `openclaw.errorCategory` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (yalnızca güvenli bileşen boyutları, prompt metni yok)
  - Model çağrısı sonucu o tekil çağrı için sağlayıcı kullanımını taşıdığında `openclaw.model_call.usage.*` ve `gen_ai.usage.*`
  - `openclaw.provider.request_id_hash` (yukarı akış sağlayıcı istek kimliğinin sınırlı SHA tabanlı karması; ham kimlikler dışa aktarılmaz)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ile model çağrısı span'leri `openclaw.model.call` yerine en son GenAI çıkarım span adı `{gen_ai.operation.name} {gen_ai.request.model}` ve `CLIENT` span türünü kullanır.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlanmada: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (prompt, geçmiş, yanıt veya oturum anahtarı içeriği yok)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (döngü mesajları, parametreler veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

İçerik yakalama açıkça etkinleştirildiğinde, model ve araç span'leri de
etkinleştirdiğiniz belirli içerik sınıfları için sınırlı, redakte edilmiş
`openclaw.content.*` özniteliklerini içerebilir.

## Tanılama olayı kataloğu

Aşağıdaki olaylar yukarıdaki metrikleri ve span'leri destekler. Plugin'ler de
OTLP dışa aktarımı olmadan bunlara doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` - token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal,
  oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/tur
  hesaplamasıdır; `context.used` mevcut prompt/bağlam anlık görüntüsüdür ve
  önbelleğe alınmış girdi veya araç döngüsü çağrıları söz konusu olduğunda
  sağlayıcı `usage.total` değerinden düşük olabilir.

**Mesaj akışı**

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
  agent harness için çalıştırma başına yaşam döngüsü. `harnessId`, isteğe bağlı
  `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir.
  Tamamlanma `durationMs`, `outcome`, isteğe bağlı `resultClassification`,
  `yieldDetected` ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve
  isteğe bağlı `cleanupFailed` ekler.

**Exec**

- `exec.process.completed` - terminal sonuç, süre, hedef, mod, çıkış kodu ve
  hata türü. Komut metni ve çalışma dizinleri dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan tanılama olaylarını Plugin'ler veya özel
hedefler için kullanılabilir tutabilirsiniz:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` değerini yükseltmeden hedefli hata ayıklama çıktısı için
tanılama bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarlı değildir ve
joker karakterleri destekler (ör. `telegram.*` veya `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ya da tek seferlik bir env geçersiz kılması olarak:

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

- [Günlükleme](/tr/logging) - dosya günlükleri, konsol çıktısı, CLI ile takip ve Control UI Günlükler sekmesi
- [Gateway günlükleme iç yapısı](/tr/gateway/logging) - WS günlük stilleri, alt sistem önekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) - hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) - operatör destek paketi aracı (OTEL dışa aktarımından ayrı)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) - eksiksiz `diagnostics.*` alan başvurusu
