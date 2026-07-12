---
read_when:
    - OpenClaw model kullanımı, mesaj akışı veya oturum metriklerini bir OpenTelemetry toplayıcısına göndermek istiyorsunuz
    - İzleri, metrikleri veya günlükleri Grafana, Datadog, Honeycomb, New Relic, Tempo ya da başka bir OTLP arka ucuna bağlıyorsunuz
    - Panolar veya uyarılar oluşturmak için tam metrik adlarına, span adlarına ya da öznitelik yapılarına ihtiyacınız vardır
summary: diagnostics-otel Plugin'i aracılığıyla OpenClaw tanılama verilerini OpenTelemetry toplayıcılarına veya stdout JSONL'ye aktarın
title: OpenTelemetry dışa aktarımı
x-i18n:
    generated_at: "2026-07-12T12:18:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw, tanılamaları resmi `diagnostics-otel` Plugin'i aracılığıyla
**OTLP/HTTP (protobuf)** kullanarak dışa aktarır. Günlükler, kapsayıcı ve
sandbox günlük işlem hatları için stdout JSONL olarak da yazılabilir.
OTLP/HTTP kabul eden tüm toplayıcılar veya arka uçlar kod değişikliği
gerektirmeden çalışır. Yerel dosya günlükleri için
[Günlük Kaydı](/tr/logging) bölümüne bakın.

- **Tanılama olayları**, model çalıştırmaları, mesaj akışı, oturumlar,
  kuyruklar ve exec için Gateway ile paketlenmiş Plugin'ler tarafından yayımlanan,
  süreç içi yapılandırılmış kayıtlardır.
- **`diagnostics-otel`**, bu olaylara abone olur ve bunları OTLP/HTTP üzerinden
  OpenTelemetry **metrikleri**, **izleri** ve **günlükleri** olarak dışa aktarır;
  ayrıca günlük kayıtlarını stdout JSONL'ye yansıtabilir.
- **Sağlayıcı çağrıları**, sağlayıcı aktarımı özel üstbilgileri kabul ettiğinde
  OpenClaw'ın güvenilir model çağrısı span bağlamından bir W3C `traceparent`
  üstbilgisi alır. Plugin tarafından yayımlanan izleme bağlamı yayılmaz.
- Dışa aktarıcılar yalnızca hem tanılama yüzeyi hem de Plugin etkinleştirildiğinde
  bağlanır; böylece süreç içi maliyet varsayılan olarak sıfıra yakın kalır.

## Hızlı başlangıç

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

Alternatif olarak Plugin'i CLI üzerinden etkinleştirin: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` yalnızca `http/protobuf` değerini destekler. `traces` ve `metrics` varsayılan olarak etkin olduğundan, diğer tüm değerler (`grpc` dâhil) `unsupported protocol` uyarısıyla diagnostics-otel aboneliğinin tamamını sonlandırır; bu durum stdout günlük dışa aktarımını da durdurur. OTLP olmayan bir protokol değeriyle yalnızca `logsExporter: "stdout"` kullanmak istiyorsanız `traces: false` ve `metrics: false` değerlerini açıkça ayarlayın.
</Note>

## Dışa aktarılan sinyaller

| Sinyal      | İçeriği                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrikler** | Token kullanımı, maliyet, çalıştırma süresi, yük devretme, Skills kullanımı, mesaj akışı, Talk olayları, kuyruk hatları, oturum durumu/kurtarma, araç yürütme, exec, bellek, canlılık ve dışa aktarıcı sağlığı için sayaçlar/histogramlar. |
| **İzler**  | Model kullanımı, model çağrıları, harness yaşam döngüsü, Skills kullanımı, araç yürütme, exec, webhook/mesaj işleme, bağlam oluşturma ve araç döngüleri için span'ler.                                                      |
| **Günlükler**    | `diagnostics.otel.logs` etkinleştirildiğinde OTLP veya stdout JSONL üzerinden dışa aktarılan yapılandırılmış `logging.file` kayıtları; içerik yakalama açıkça etkinleştirilmedikçe günlük gövdeleri dışa aktarılmaz.                          |

`traces`, `metrics` ve `logs` seçeneklerini birbirinden bağımsız olarak
açıp kapatabilirsiniz. `diagnostics.otel.enabled` true olduğunda izler ve
metrikler varsayılan olarak açıktır; günlükler varsayılan olarak kapalıdır ve
yalnızca `diagnostics.otel.logs` açıkça `true` olarak ayarlandığında dışa
aktarılır. Günlük dışa aktarımı varsayılan olarak OTLP kullanır; stdout üzerinde
JSONL için `diagnostics.otel.logsExporter` değerini `stdout`, her ikisi içinse
`both` olarak ayarlayın.

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
      protocol: "http/protobuf", // grpc, OTLP dışa aktarımını devre dışı bırakır
      serviceName: "openclaw-gateway", // ayarlanmazsa önce OTEL_SERVICE_NAME, ardından "openclaw" kullanılır
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // kök span örnekleyicisi, 0.0..1.0
      flushIntervalMs: 60000, // metrik dışa aktarma aralığı (en az 1000 ms)
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

| Değişken                                                                                                          | Amaç                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Yapılandırma anahtarı ayarlanmadığında `diagnostics.otel.endpoint` için yedek değer.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Eşleşen `diagnostics.otel.*Endpoint` yapılandırma anahtarı ayarlanmadığında kullanılan, sinyale özgü uç nokta yedekleri. Sinyale özgü yapılandırma, sinyale özgü ortam değişkenine; sinyale özgü ortam değişkeni de paylaşılan uç noktaya göre önceliklidir.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Yapılandırma anahtarı ayarlanmadığında `diagnostics.otel.serviceName` için yedek değer. Varsayılan hizmet adı `openclaw` değeridir.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol` ayarlanmadığında kablo protokolü için yedek değer. Yalnızca `http/protobuf` dışa aktarımı etkinleştirir.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | En güncel GenAI çıkarım span biçimini yayımlamak için `gen_ai_latest_experimental` olarak ayarlayın: `{gen_ai.operation.name} {gen_ai.request.model}` span adları, `CLIENT` span türü ve eski `gen_ai.system` yerine `gen_ai.provider.name`. GenAI metrikleri bundan bağımsız olarak her zaman sınırlandırılmış, düşük kardinaliteli öznitelikler kullanır. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Başka bir önyükleme veya ana süreç, genel OpenTelemetry SDK'sını zaten kaydettiğinde `1` olarak ayarlayın. Bu durumda Plugin kendi NodeSDK yaşam döngüsünü atlar ancak tanılama dinleyicilerini bağlamaya ve `traces`/`metrics`/`logs` ayarlarına uymaya devam eder.                                                                                    |

## Gizlilik ve içerik yakalama

Ham model/araç içeriği varsayılan olarak **dışa aktarılmaz**. Span'ler
sınırlandırılmış tanımlayıcılar (kanal, sağlayıcı, model, hata kategorisi,
yalnızca karma değerinden oluşan istek kimlikleri, araç kaynağı, araç sahibi,
Skills adı/kaynağı) taşır ve hiçbir zaman istem metni, yanıt metni, araç girdileri,
araç çıktıları, Skills dosya yolları veya oturum anahtarları içermez.
Kapsamlı aracı oturum anahtarlarına benzeyen değerler (örneğin `agent:` ile
başlayanlar), düşük kardinaliteli özniteliklerde `unknown` ile değiştirilir.
OTLP günlük kayıtları varsayılan olarak önem derecesini, günlükçüyü, kod
konumunu, güvenilir izleme bağlamını ve temizlenmiş öznitelikleri korur; ham
günlük mesajı gövdesi yalnızca `diagnostics.otel.captureContent` boolean
`true` olduğunda dışa aktarılır. Ayrıntılı `captureContent.*` alt anahtarları
günlük gövdelerini hiçbir zaman etkinleştirmez. Talk metrikleri yalnızca
sınırlandırılmış olay meta verilerini (mod, aktarım, sağlayıcı, olay türü)
dışa aktarır; transkriptleri, ses yüklerini, oturum kimliklerini, tur kimliklerini,
çağrı kimliklerini, oda kimliklerini veya devir token'larını dışa aktarmaz.

Giden model istekleri, yalnızca etkin model çağrısı için OpenClaw'a ait
tanılama izleme bağlamından oluşturulan bir W3C `traceparent` üstbilgisi
içerebilir. Çağıran tarafından sağlanan mevcut `traceparent` üstbilgileri
değiştirilir; böylece Plugin'ler veya özel sağlayıcı seçenekleri hizmetler arası
izleme kökenini taklit edemez.

`diagnostics.otel.captureContent.*` değerini yalnızca toplayıcınız ve saklama
politikanız istem, yanıt, araç veya sistem istemi metni için onaylanmışsa
`true` olarak ayarlayın. Her alt anahtar bağımsızdır:

- `inputMessages` - kullanıcı istemi içeriği.
- `outputMessages` - model yanıtı içeriği.
- `toolInputs` - araç argümanı yükleri.
- `toolOutputs` - araç sonucu yükleri.
- `systemPrompt` - oluşturulmuş sistem/geliştirici istemi.
- `toolDefinitions` - model aracı adları, açıklamaları ve şemaları.

Herhangi bir alt anahtar etkinleştirildiğinde model ve araç span'leri yalnızca
o sınıfa ait, sınırlandırılmış ve hassas verileri çıkarılmış
`openclaw.content.*` özniteliklerini alır.

<Note>
Boolean `captureContent: true`, `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` ve OTLP günlük gövdelerini birlikte etkinleştirir ancak `systemPrompt` değerini **etkinleştirmez**; oluşturulmuş sistem istemine de ihtiyacınız varsa `captureContent.systemPrompt: true` değerini açıkça ayarlayın.
</Note>

`toolInputs`/`toolOutputs` içeriği, yerleşik aracı çalışma zamanının araç
yürütmeleri için yakalanır (tamamlanan/hatalı span'lerde
`openclaw.content.tool_input` ve `gen_ai.tool.call.arguments`;
tamamlanan span'lerde `openclaw.content.tool_output` ve
`gen_ai.tool.call.result`). `openclaw.content.*` adları kararlı OpenClaw
öznitelik adları olarak kalır; `gen_ai.tool.call.*` kopyaları, semconv yerel
görüntüleyiciler için bunları yansıtır. Harici harness araç çağrıları (Codex,
Claude CLI), içerik yükleri olmadan `tool.execution.*` span'leri yayımlar.
Yakalanan içerik güvenilir, yalnızca dinleyicilere açık bir kanaldan geçer ve
hiçbir zaman herkese açık tanılama olay veri yoluna yerleştirilmez.

## Örnekleme ve boşaltma

- **İzler:** `diagnostics.otel.sampleRate`, yalnızca kök span üzerinde bir `TraceIdRatioBasedSampler`
  ayarlar (`0.0` tümünü atar, `1.0` tümünü tutar). Ayarlanmadığında
  OpenTelemetry SDK varsayılanı (her zaman açık) kullanılır.
- **Metrikler:** `diagnostics.otel.flushIntervalMs` (en az `1000` olacak şekilde
  sınırlandırılır); ayarlanmadığında SDK'nın periyodik dışa aktarma varsayılanı kullanılır.
- **Günlükler:** OTLP günlükleri `logging.level` değerine (dosya günlüğü düzeyi) uyar ve
  konsol biçimlendirmesini değil, tanılama günlük kaydı redaksiyon yolunu kullanır. Yüksek hacimli
  kurulumlar, yerel örnekleme yerine OTLP toplayıcı örneklemesini/filtrelemesini
  tercih etmelidir. Platformunuz stdout/stderr akışını zaten bir günlük işleyicisine
  gönderiyorsa ve OTLP günlük toplayıcınız yoksa `diagnostics.otel.logsExporter: "stdout"`
  ayarını kullanın. Stdout kayıtları; `ts`, `signal`, `service.name`, önem derecesi,
  gövde, redakte edilmiş öznitelikler ve mevcut olduğunda güvenilir iz alanları içeren,
  satır başına bir JSON nesnesidir.
- **Dosya günlüğü korelasyonu:** Günlük çağrısı geçerli bir tanılama iz bağlamı taşıdığında
  JSONL dosya günlükleri üst düzey `traceId`, `spanId`, `parentSpanId` ve `traceFlags`
  alanlarını içerir; böylece günlük işleyicileri yerel günlük satırlarını dışa aktarılan
  span'lerle ilişkilendirebilir.
- **İstek korelasyonu:** Gateway HTTP istekleri ve WebSocket çerçeveleri dahili bir istek
  iz kapsamı oluşturur. Bu kapsamdaki günlükler ve tanılama olayları varsayılan olarak istek
  izini devralırken, ajan çalıştırma ve model çağrısı span'leri alt öğeler olarak oluşturulur;
  böylece sağlayıcı `traceparent` üstbilgileri aynı izde kalır.
- **Model çağrısı korelasyonu:** `openclaw.model.call` span'leri varsayılan olarak güvenli istem
  bileşeni boyutlarını ve sağlayıcı sonucu kullanımı sunduğunda çağrı başına token özniteliklerini
  içerir. `openclaw.model.usage`, toplam maliyet, bağlam ve kanal panoları için çalıştırma düzeyindeki
  hesaplama span'i olmaya devam eder ve olayı yayan çalışma zamanı güvenilir iz bağlamına sahip
  olduğunda aynı tanılama izinde kalır.

## Dışa aktarılan metrikler

### Model kullanımı

- `openclaw.tokens` (sayaç, öznitelikler: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (sayaç, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, öznitelikler: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, öznitelikler: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI anlamsal kurallar metriği, öznitelikler: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, saniye, GenAI anlamsal kurallar metriği, öznitelikler: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, isteğe bağlı `error.type`)
- `openclaw.model_call.duration_ms` (histogram, öznitelikler: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`; ayrıca sınıflandırılmış hatalarda `openclaw.errorCategory` ve `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (histogram, nihai model isteği yükünün UTF-8 bayt boyutu; ham yük içeriği yoktur)
- `openclaw.model_call.response_bytes` (histogram, akışla iletilen yanıt parçası yüklerinin UTF-8 bayt boyutu; yüksek frekanslı metin, düşünme ve araç çağrısı deltalarında yalnızca artımlı `delta` baytları sayılır; ham yanıt içeriği yoktur)
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
- `openclaw.session.stuck` (sayaç, öznitelikler: `openclaw.state`; kurtarılabilir eski oturum kayıtları için yayınlanır)
- `openclaw.session.stuck_age_ms` (histogram, öznitelikler: `openclaw.state`; kurtarılabilir eski oturum kayıtları için yayınlanır)
- `openclaw.session.turn.created` (sayaç, öznitelikler: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (sayaç, öznitelikler: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histogram, öznitelikler: eşleşen kurtarma sayacıyla aynı)
- `openclaw.run.attempt` (sayaç, öznitelikler: `openclaw.attempt`)

### Oturum canlılığı telemetrisi

`diagnostics.stuckSessionWarnMs`, oturum canlılığı tanılamaları için ilerleme
kaydedilmeyen süre eşiğidir. OpenClaw yanıt, araç, durum, blok veya ACP çalışma zamanı
ilerlemesi gözlemlediği sürece bir `processing` oturumu bu eşiğe doğru yaşlanmaz.
Yazıyor durumunu canlı tutma sinyalleri ilerleme sayılmaz; bu nedenle sessiz bir model
veya yürütme düzeneği yine de algılanabilir.

OpenClaw, oturumları hâlâ gözlemleyebildiği işe göre sınıflandırır:

- `session.long_running`: etkin gömülü iş, model çağrıları veya araç çağrıları
  ilerlemeye devam etmektedir. `diagnostics.stuckSessionWarnMs` süresini aşacak kadar
  sessiz kalan sahipli model çağrıları da `diagnostics.stuckSessionAbortMs` öncesinde
  uzun süreli olarak bildirilir; böylece yavaş veya akışsız model sağlayıcıları,
  iptal gözlemlenebilir durumdayken durmuş Gateway oturumları gibi görünmez.
- `session.stalled`: etkin iş vardır ancak etkin çalıştırma yakın zamanda ilerleme
  bildirmemiştir. Sahipli model çağrıları `diagnostics.stuckSessionAbortMs` değerinde
  veya sonrasında `session.long_running` durumundan `session.stalled` durumuna geçer;
  sahipsiz eski model/araç etkinliği zararsız, uzun süreli iş olarak değerlendirilmez.
  Durmuş gömülü çalıştırmalar başlangıçta yalnızca gözlem modunda kalır, ardından
  ilerleme olmadan `diagnostics.stuckSessionAbortMs` süresi geçtiğinde iptal edilip
  boşaltılır; böylece şeritte arkada bekleyen turlar devam edebilir. Ayarlanmadığında,
  iptal eşiği varsayılan olarak en az 5 dakika ve
  `diagnostics.stuckSessionWarnMs` değerinin 3 katı olan daha güvenli genişletilmiş
  pencereye ayarlanır.
- `session.stuck`: etkin iş bulunmayan eski oturum kayıtları veya sahipsiz eski
  model/araç etkinliği bulunan boşta bekleyen kuyruklanmış bir oturum. Kurtarma
  geçitleri başarıyla geçildikten hemen sonra etkilenen oturum şeridi serbest bırakılır.

Kurtarma, yapılandırılmış `session.recovery.requested` ve
`session.recovery.completed` olaylarını yayınlar. Tanılama oturum durumu yalnızca
durumu değiştiren bir kurtarma sonucundan (`aborted` veya `released`) sonra ve yalnızca
aynı işleme nesli hâlâ geçerliyse boşta olarak işaretlenir.

Yalnızca `session.stuck`, `openclaw.session.stuck` sayacını,
`openclaw.session.stuck_age_ms` histogramını ve `openclaw.session.stuck` span'ini
yayınlar. Oturum değişmeden kaldığı sürece yinelenen `session.stuck` tanılamalarının
sıklığı azaltılır; bu nedenle panolar her Heartbeat çevrimi yerine sürekli artışlarda
uyarı vermelidir. Yapılandırma ayarı ve varsayılanlar için
[Yapılandırma referansına](/tr/gateway/configuration-reference#diagnostics) bakın.

Canlılık uyarıları ayrıca şunları yayınlar:

- `openclaw.liveness.warning` (sayaç, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histogram, öznitelikler: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histogram, öznitelikler: `openclaw.liveness.reason`)

### Yürütme düzeneği yaşam döngüsü

- `openclaw.harness.duration_ms` (histogram, öznitelikler: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`; hatalarda `openclaw.harness.phase`)

### Araç yürütme ve döngü algılama

- `openclaw.tool.execution.duration_ms` (histogram, öznitelikler: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`; ayrıca hatalarda `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (sayaç, öznitelikler: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (sayaç, öznitelikler: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, isteğe bağlı `openclaw.loop.paired_tool`; yinelenen bir araç çağrısı döngüsü algılandığında yayınlanır)

### Exec

- `openclaw.exec.duration_ms` (histogram, öznitelikler: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Tanılama iç işleyişi (bellek, yükler, dışa aktarıcı sağlığı)

- `openclaw.payload.large` (sayaç, öznitelikler: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histogram, öznitelikler: `openclaw.payload.large` ile aynı)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramlar, öznitelik yok; işlem belleği örnekleri)
- `openclaw.memory.pressure` (sayaç, öznitelikler: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (sayaç, öznitelikler: `openclaw.diagnostic.async_queue.drop_class`; dahili tanılama kuyruğundaki geri basınç nedeniyle atılan öğeler)
- `openclaw.telemetry.exporter.events` (sayaç, öznitelikler: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, isteğe bağlı `openclaw.reason`, isteğe bağlı `openclaw.errorCategory`; dışa aktarıcı yaşam döngüsü/arıza öz telemetrisi)

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
  - Hatalarda `openclaw.errorCategory`, `error.type` ve isteğe bağlı `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (yalnızca güvenli bileşen boyutları, istem metni yok)
  - Model çağrısı sonucu, söz konusu tekil çağrı için sağlayıcı kullanımını içerdiğinde `openclaw.model_call.usage.*` ve `gen_ai.usage.*`
  - Yukarı akış sağlayıcı sonucu bir istek kimliği sunduğunda `openclaw.upstreamRequestIdHash` özniteliğine sahip `openclaw.provider.request` span olayı (sınırlı, karma tabanlı); ham kimlikler hiçbir zaman dışa aktarılmaz
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ile model çağrısı span'leri, `openclaw.model.call` yerine en yeni GenAI çıkarım span adı `{gen_ai.operation.name} {gen_ai.request.model}` ve `CLIENT` span türünü kullanır.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Tamamlandığında: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Hata durumunda: `openclaw.harness.phase`, `openclaw.errorCategory`, isteğe bağlı `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, isteğe bağlı `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Hatalarda isteğe bağlı `openclaw.errorCategory`/`openclaw.errorCode`; politika veya korumalı alan tarafından reddedildiğinde `openclaw.deniedReason` ve `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, isteğe bağlı `openclaw.loop.paired_tool` (döngü mesajları, parametreleri veya araç çıktısı yok)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, isteğe bağlı `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

İçerik yakalama açıkça etkinleştirildiğinde model ve araç span'leri, etkinleştirdiğiniz belirli içerik sınıfları için sınırlı ve hassas verileri ayıklanmış `openclaw.content.*` özniteliklerini de içerebilir.

## Tanılama olayları kataloğu

Aşağıdaki olaylar, yukarıdaki metrikleri ve span'leri destekler. Plugin'ler bunlara OTLP dışa aktarımı olmadan da doğrudan abone olabilir.

**Model kullanımı**

- `model.usage` - token'lar, maliyet, süre, bağlam, sağlayıcı/model/kanal ve oturum kimlikleri. `usage`, maliyet ve telemetri için sağlayıcı/tur muhasebesidir; `context.used` ise geçerli istem/bağlam anlık görüntüsüdür ve önbelleğe alınmış girdi veya araç döngüsü çağrıları söz konusu olduğunda sağlayıcının `usage.total` değerinden düşük olabilir.

**Mesaj akışı**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Kuyruk ve oturum**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (toplu sayaçlar: webhook'lar/kuyruk/oturum)

**Çalıştırma düzeneği yaşam döngüsü**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ajan çalıştırma düzeneğinin her çalıştırma için yaşam döngüsü. `harnessId`, isteğe bağlı
  `pluginId`, sağlayıcı/model/kanal ve çalıştırma kimliğini içerir. Tamamlanma,
  `durationMs`, `outcome`, isteğe bağlı `resultClassification`, `yieldDetected`
  ve `itemLifecycle` sayılarını ekler. Hatalar `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` ve
  isteğe bağlı `cleanupFailed` değerlerini ekler.

**Komut yürütme**

- `exec.process.completed` - terminal sonucu, süre, hedef, kip, çıkış
  kodu ve hata türü. Komut metni ve çalışma dizinleri
  dahil edilmez.
- `exec.approval.followup_suppressed` - oturum yeniden bağlandıktan sonra güncelliğini yitiren onay takibi bırakıldı.
  `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` veya `gateway_preflight`)
  ve dağıtıcının zaman damgasını içerir. Oturum anahtarları, rotalar ve komut metni
  dahil edilmez.

## Dışa aktarıcı olmadan

`diagnostics-otel` çalıştırmadan tanılama olaylarını Plugin'ler veya özel hedefler için kullanılabilir tutun:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` değerini yükseltmeden hedefli hata ayıklama çıktısı almak için tanılama bayraklarını kullanın. Bayraklar büyük/küçük harfe duyarsızdır ve joker karakterleri (`telegram.*` veya `*`) destekler:

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ya da tek seferlik bir ortam değişkeni geçersiz kılması olarak:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Bayrak çıktısı standart günlük dosyasına (`logging.file`) gider ve yine
`logging.redactSensitive` tarafından hassas verilerden arındırılır. Tam kılavuz:
[Tanılama bayrakları](/tr/diagnostics/flags).

## Devre dışı bırakma

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ya da `diagnostics-otel` öğesini `plugins.allow` dışında bırakın veya
`openclaw plugins disable diagnostics-otel` komutunu çalıştırın.

## İlgili

- [Günlük kaydı](/tr/logging) - dosya günlükleri, konsol çıktısı, CLI ile günlük takibi ve Control UI Günlükler sekmesi
- [Gateway günlük kaydı iç işleyişi](/tr/gateway/logging) - WS günlük biçimleri, alt sistem önekleri ve konsol yakalama
- [Tanılama bayrakları](/tr/diagnostics/flags) - hedefli hata ayıklama günlüğü bayrakları
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) - operatör destek paketi aracı (OTEL dışa aktarımından ayrıdır)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#diagnostics) - eksiksiz `diagnostics.*` alan başvurusu
