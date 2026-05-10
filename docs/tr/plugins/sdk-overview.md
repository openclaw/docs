---
read_when:
    - Hangi SDK alt yolundan içe aktaracağınızı bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir referans istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-05-10T19:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Pluginler ile çekirdek arasındaki tipli sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için başvurudur.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden ajanları çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini
  kullanın.
</Note>

<Tip>
Bunun yerine nasıl yapılır kılavuzu mu arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal Pluginleri için [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins), sağlayıcı Pluginleri için [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins), yerel yapay zeka CLI arka uçları için [CLI arka uç Pluginleri](/tr/plugins/cli-backend-plugins) ve araç ya da yaşam döngüsü kancası Pluginleri için [Plugin kancaları](/tr/plugins/hooks) sayfalarını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi kendine yeterli bir modüldür. Bu, başlatmayı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin;
`openclaw/plugin-sdk/core` yolunu daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için ayırın.

Kanal yapılandırması için kanalın sahip olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkel değerleri ve genel oluşturucu içindir.
OpenClaw'ın paketli Pluginleri, korunan paketli kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde
kalır; paketli şema alt yollarından hiçbiri yeni Pluginler için bir örüntü
değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık yüzeylerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketli Pluginler, kendi `api.ts` / `runtime-api.ts` varilleri içinde genel
  SDK alt yollarını birleştirir; çekirdek tüketicileri ya bu Plugin yerel
  varillerini kullanmalı ya da ihtiyaç gerçekten kanallar arası olduğunda dar
  bir genel SDK sözleşmesi eklemelidir.

Sahip kullanımı izlenen küçük bir paketli Plugin yardımcı yüzeyi kümesi, üretilen
dışa aktarma haritasında hâlâ görünür. Bunlar yalnızca paketli Plugin bakımı
için vardır ve yeni üçüncü taraf Pluginler için önerilen içe aktarma yolları
değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account` ayrıca
izlenen sahip kullanımı için kullanımdan kaldırılmış uyumluluk cepheleri olarak
tutulur. Bu içe aktarma yollarını yeni Pluginlere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol başvurusu

Plugin SDK, alana göre gruplandırılmış dar alt yollar kümesi olarak sunulur
(Plugin girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı, yetenek,
bellek ve ayrılmış paketli Plugin yardımcıları). Gruplandırılmış ve bağlantılı
tam katalog için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json`
içinde bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json`
içinde listelenen depo yerel test/dahili alt yollar çıkarıldıktan sonra herkese
açık alt kümeden üretilir. Herkese açık dışa aktarma sayısını denetlemek için
`pnpm plugin-sdk:surface` çalıştırın. Yeterince eski olan ve paketli uzantı
üretim kodu tarafından kullanılmayan kullanımdan kaldırılmış herkese açık alt
yollar `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde izlenir;
geniş kullanımdan kaldırılmış yeniden dışa aktarma varilleri
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` içinde izlenir.

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli ajan yürütücü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu            |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi      |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon  |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi             |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                       |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                         |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                         |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı      |
| `api.registerWebSearchProvider(...)`             | Web arama                             |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                      |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (gerekli veya `{ optional: true }`)      |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                          |

Plugin komutları, ajanın kısa ve komuta ait bir yönlendirme ipucuna ihtiyaç
duyduğu durumlarda `agentPromptGuidance` ayarlayabilir. Bu metni komutun
kendisiyle ilgili tutun; çekirdek prompt oluşturucularına sağlayıcıya veya
Plugin'e özgü politika eklemeyin.

### Altyapı

| Yöntem                                         | Kaydettiği şey                               |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                                |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                         |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu              |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                              |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` altında Node özellik CLI'si |
| `api.registerService(service)`                 | Arka plan servisi                           |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                        |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç sonucu ara katmanı      |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli, belleğe komşu prompt bölümü       |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma korpusu         |

### İş akışı Pluginleri için ana makine kancaları

Ana makine kancaları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine
ana makine yaşam döngüsüne katılması gereken Pluginler için SDK yüzeyleridir.
Bunlar genel sözleşmelerdir; Plan Mode bunları kullanabilir, ancak onay iş
akışları, çalışma alanı politika kapıları, arka plan izleyicileri, kurulum
sihirbazları ve UI eşlikçi Pluginleri de kullanabilir.

| Yöntem                                                                   | Sahip olduğu sözleşme                                                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway oturumları üzerinden yansıtılan, Plugin'e ait JSON uyumlu oturum durumu                                                     |
| `api.enqueueNextTurnInjection(...)`                                      | Bir oturum için bir sonraki ajan turuna enjekte edilen, dayanıklı ve tam olarak bir kez kullanılan bağlam                             |
| `api.registerTrustedToolPolicy(...)`                                     | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketli/güvenilir, Plugin öncesi araç politikası                         |
| `api.registerToolMetadata(...)`                                          | Araç uygulamasını değiştirmeden araç kataloğu görüntüleme meta verileri                                                              |
| `api.registerCommand(...)`                                               | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.registerControlUiDescriptor(...)`                                   | Oturum, araç, çalışma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                                   |
| `api.registerRuntimeLifecycle(...)`                                      | Sıfırlama/silme/yeniden yükleme yollarında Plugin'e ait çalışma zamanı kaynakları için temizleme geri çağrıları                      |
| `api.registerAgentEventSubscription(...)`                                | İş akışı durumu ve izleyiciler için temizlenmiş olay abonelikleri                                                                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Terminal çalışma yaşam döngüsünde temizlenen, çalışma başına Plugin geçici durumu                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | Belirleyici temizlemeye sahip, Plugin'e ait oturum zamanlayıcı işi kayıtları                                                         |

Sözleşmeler yetkiyi kasıtlı olarak ayırır:

- Harici Pluginler oturum uzantılarına, UI tanımlayıcılarına, komutlara, araç
  meta verilerine, sonraki tur enjeksiyonlarına ve normal kancalara sahip
  olabilir.
- Güvenilir araç politikaları sıradan `before_tool_call` kancalarından önce
  çalışır ve ana makine güvenlik politikasına katıldıkları için yalnızca
  paketlidir.
- Ayrılmış komut sahipliği yalnızca paketlidir. Harici Pluginler kendi komut
  adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` kaynaklı prompt
  alanları ve `enqueueNextTurnInjection` dahil prompt'u değiştiren kancaları
  devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi             | Kullanılan kancalar                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı               | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                              |
| Bütçe/çalışma alanı politika kapısı | Güvenilir araç politikası, araç meta verileri, oturum projeksiyonu                                                          |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, ajan olay aboneliği, oturum zamanlayıcı sahipliği/temizliği, Heartbeat prompt katkısı, UI tanımlayıcısı |
| Kurulum veya başlangıç sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                     |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir Plugin daha dar bir Gateway yöntemi kapsamı atamaya çalışsa
  bile her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
  Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="When to use tool-result middleware">
  Birlikte gelen plugin'ler, yürütmeden sonra ve runtime bu sonucu modele geri
  beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  asenkron çıktı azaltıcıları için güvenilir, runtime'dan bağımsız bağlantı
  noktasıdır.

Birlikte gelen plugin'ler, hedeflenen her runtime için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`.
Harici plugin'ler bu middleware'i kaydedemez; model öncesi araç sonucu
zamanlamasına ihtiyaç duymayan işler için normal OpenClaw plugin hook'larını
kullanmaya devam edin. Eski, yalnızca Pi'ye özgü gömülü extension factory
kayıt yolu kaldırıldı.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir plugin'in etkin Gateway'i
mDNS/Bonjour gibi yerel bir keşif taşıması üzerinde duyurmasını sağlar.
OpenClaw, yerel keşif etkinleştirildiğinde Gateway başlatma sırasında servisi
çağırır, mevcut Gateway portlarını ve gizli olmayan TXT ipucu verilerini iletir
ve Gateway kapatılırken döndürülen `stop` işleyicisini çağırır.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway keşif plugin'leri, duyurulan TXT değerlerini gizli bilgi veya kimlik
doğrulama olarak ele almamalıdır. Keşif bir yönlendirme ipucudur; güvenin
sahipliği yine Gateway kimlik doğrulamasına ve TLS sabitlemesine aittir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür komut meta verisi kabul eder:

- `commands`: kaydedicinin sahip olduğu açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve tembel plugin CLI kaydı için
  kullanılan ayrıştırma zamanı komut tanımlayıcıları
- `parentPath`: `["nodes"]` gibi iç içe komut grupları için isteğe bağlı üst komut yolu

Eşleştirilmiş düğüm özellikleri için
`api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu,
`api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir sarmalayıcıdır
ve `openclaw nodes canvas` gibi komutları açıkça plugin sahipliğinde düğüm
özellikleri yapar.

Bir plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını
istiyorsanız, o kaydedicinin açığa çıkardığı her üst düzey komut kökünü kapsayan
`descriptors` sağlayın.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

İç içe komutlar, çözümlenmiş üst komutu `program` olarak alır:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` öğesini tek başına yalnızca tembel kök CLI kaydına ihtiyacınız
olmadığında kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak
ayrıştırma zamanı tembel yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel bir AI CLI
backend'i için varsayılan yapılandırmaya sahip olmasını sağlar.

- Backend `id`, `codex-cli/gpt-5` gibi model referanslarında provider öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı biçimi kullanır.
- Kullanıcı yapılandırması yine kazanır. OpenClaw, CLI'yi çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` öğesini plugin varsayılanının üzerine birleştirir.
- Bir backend, birleştirme sonrasında uyumluluk yeniden yazmalarına ihtiyaç
  duyduğunda `normalizeConfig` kullanın (örneğin eski bayrak biçimlerini
  normalleştirmek için).
- OpenClaw düşünme seviyelerini yerel bir çaba bayrağına eşlemek gibi CLI
  lehçesine ait istek kapsamlı argv yeniden yazmaları için `resolveExecutionArgs`
  kullanın.

Uçtan uca yazarlık kılavuzu için bkz.
[CLI backend plugin'leri](/tr/plugins/cli-backend-plugins).

### Özel yuvalar

| Yöntem                                     | Ne kaydeder                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). `assemble()` callback'i `availableTools` ve `citationsMode` alır, böylece motor prompt eklemelerini uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucu                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözücü                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Bellek runtime adaptörü                                                                                                                                 |

### Bellek embedding adaptörleri

| Yöntem                                         | Ne kaydeder                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek embedding adaptörü    |

- `registerMemoryCapability`, tercih edilen özel bellek plugin'i API'sidir.
- `registerMemoryCapability`, tamamlayıcı plugin'lerin belirli bir bellek
  plugin'inin özel düzenine erişmek yerine dışa aktarılan bellek artefaktlarını
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` de açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu özel bellek plugin'i API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin yedek zinciri devralmadan
  `ollama/qwen3:8b` gibi tam bir `provider/model` referansına sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin'inin bir veya daha
  fazla embedding adaptörü kimliği kaydetmesini sağlar (örneğin `openai`,
  `gemini` veya özel plugin tanımlı bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırması, bu
  kayıtlı adaptör kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Türlü yaşam döngüsü hook'u     |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama callback'i     |

Örnekler, yaygın hook adları ve koruma semantiği için bkz.
[Plugin hook'ları](/tr/plugins/hooks).

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici dispatch'i üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model dispatch yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak ele alınır (`cancel` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyacınız olduğunda türlü `threadId` alanını kullanın. `metadata` öğesini kanala özgü ek bilgiler için saklayın.
- `message_sending`: kanala özgü `metadata` öğesine geri dönmeden önce türlü `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` hook'larına güvenmek yerine gateway sahipliğindeki başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: gateway sahipliğindeki cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını senkronize ederken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın ve vade kontrolleri ile yürütme için doğruluk kaynağı olarak OpenClaw'ı tutun.

### API nesne alanları

| Alan                     | Tür                       | Açıklama                                                                                         |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                       |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                     |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                                 |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                               |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                                 |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi runtime anlık görüntüsü)            |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` öğesinden plugin'e özgü yapılandırma                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime yardımcıları](/tr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif, tam giriş öncesi başlatma/kurulum penceresidir    |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                                  |

## Dahili modül kuralı

Plugin'iniz içinde, dahili import'lar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Production kodundan kendi plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden import etmeyin. Dahili import'ları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici kontrattır.
</Warning>

Facade üzerinden yüklenen birlikte gelen Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları), OpenClaw zaten çalışıyorsa
etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı
anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri dönerler.
Paketlenmiş birlikte gelen Plugin facade'ları, OpenClaw'ın Plugin facade
yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` içinden doğrudan içe
aktarımlar, paketlenmiş kurulumların Plugin'e ait kod için kullandığı manifest ve
çalışma zamanı yan yardımcı kontrollerini atlar.

Sağlayıcı Plugin'leri, bir yardımcı özellikle sağlayıcıya özgü olduğunda ve henüz
genel bir SDK alt yoluna ait olmadığında dar, Plugin'e yerel bir sözleşme barrel'ı
sunabilir. Birlikte gelen örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için genel
  `api.ts` / `contract-api.ts` bağlantı noktası.
- **`@openclaw/openai-provider`**: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucusunu ve
  onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu `openclaw/plugin-sdk/<other-plugin>` içe aktarımlarından da
  kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine
  bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared`
  veya başka bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Giriş noktaları" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` ad alanı başvurusu.
  </Card>
  <Card title="Kurulum ve yapılandırma" icon="sliders" href="/tr/plugins/sdk-setup">
    Paketleme, manifestler ve yapılandırma şemaları.
  </Card>
  <Card title="Test etme" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve lint kuralları.
  </Card>
  <Card title="SDK geçişi" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin iç yapıları" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
