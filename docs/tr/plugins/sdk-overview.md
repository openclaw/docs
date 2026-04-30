---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir referans istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-04-30T09:37:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Plugin'ler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için referanstır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden aracıları çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini kullanın.
</Note>

<Tip>
Bunun yerine nasıl yapılır kılavuzu mu arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal Plugin'leri için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins), sağlayıcı Plugin'leri için [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) ve araç ya da yaşam döngüsü hook Plugin'leri için [Plugin hook'ları](/tr/plugins/hooks) sayfalarını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi kendine yeterli bir modüldür. Bu, başlatmayı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` kullanmayı tercih edin;
daha geniş şemsiye yüzey ve `buildChannelConfigSchema` gibi paylaşılan
yardımcılar için `openclaw/plugin-sdk/core` kullanın.

Kanal yapılandırması için kanalın sahibi olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkelleri ve genel oluşturucu içindir. OpenClaw'ın
paketli Plugin'leri, korunmuş paketli kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde
kalmaya devam eder; paketli şema alt yollarından hiçbiri yeni Plugin'ler için
bir örüntü değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık arayüzlerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketli Plugin'ler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; çekirdek tüketicileri ya bu
  Plugin'e yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arası
  olduğunda dar bir genel SDK sözleşmesi eklemelidir.

Paketli Plugin yardımcı arayüzlerinden küçük bir küme, izlenen sahip kullanımı
olduğunda oluşturulan dışa aktarma haritasında hâlâ görünür. Bunlar yalnızca
paketli Plugin bakımı için vardır ve yeni üçüncü taraf Plugin'ler için önerilen
içe aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account`, izlenen
sahip kullanımı için kullanımdan kaldırılmış uyumluluk facade'ları olarak da
korunur. Bu içe aktarma yollarını yeni Plugin'lere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol referansı

Plugin SDK, alana göre gruplandırılmış dar alt yollar kümesi olarak sunulur
(Plugin girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı, yetenek,
bellek ve ayrılmış paketli Plugin yardımcıları). Gruplanmış ve bağlantılanmış
tam katalog için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Oluşturulan 200+ alt yol listesi `scripts/lib/plugin-sdk-entrypoints.json`
içinde bulunur.

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli aracı yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu            |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                     |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi           |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon  |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi             |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                       |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                         |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                         |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı      |
| `api.registerWebSearchProvider(...)`             | Web araması                           |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Aracı aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                     |

Plugin komutları, aracının kısa, komutun sahibi olduğu bir yönlendirme ipucuna
ihtiyacı olduğunda `agentPromptGuidance` ayarlayabilir. Bu metni komutun
kendisiyle ilgili tutun; çekirdek prompt oluşturucularına sağlayıcıya veya
Plugin'e özgü politika eklemeyin.

### Altyapı

| Yöntem                                         | Kaydettiği şey                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                    |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif ilan edicisi       |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerService(service)`                 | Arka plan hizmeti                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                   |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç sonucu middleware'i |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek bitişiği prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma derlemi    |

### İş akışı Plugin'leri için host hook'ları

Host hook'ları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine host
yaşam döngüsüne katılması gereken Plugin'ler için SDK arayüzleridir. Bunlar
genel sözleşmelerdir; Plan Mode bunları kullanabilir, ancak onay iş akışları,
çalışma alanı politika kapıları, arka plan izleyicileri, kurulum sihirbazları
ve UI eşlikçi Plugin'leri de kullanabilir.

| Yöntem                                                                   | Sahip olduğu sözleşme                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway oturumları üzerinden yansıtılan, Plugin'e ait JSON uyumlu oturum durumu   |
| `api.enqueueNextTurnInjection(...)`                                      | Bir oturum için sonraki aracı turuna enjekte edilen dayanıklı tam olarak bir kez bağlam |
| `api.registerTrustedToolPolicy(...)`                                     | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketli/güvenilir ön Plugin araç politikası |
| `api.registerToolMetadata(...)`                                          | Araç uygulamasını değiştirmeden araç kataloğu görüntü meta verileri               |
| `api.registerCommand(...)`                                               | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir    |
| `api.registerControlUiDescriptor(...)`                                   | Oturum, araç, çalıştırma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları |
| `api.registerRuntimeLifecycle(...)`                                      | Sıfırlama/silme/yeniden yükleme yollarında Plugin'e ait çalışma zamanı kaynakları için temizleme geri çağrıları |
| `api.registerAgentEventSubscription(...)`                                | İş akışı durumu ve izleyiciler için sterilize edilmiş olay abonelikleri           |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Terminal çalıştırma yaşam döngüsünde temizlenen çalıştırma başına Plugin geçici durumu |
| `api.registerSessionSchedulerJob(...)`                                   | Belirleyici temizlemeye sahip Plugin'e ait oturum zamanlayıcı iş kayıtları        |

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici Plugin'ler oturum uzantılarının, UI tanımlayıcılarının, komutların,
  araç meta verilerinin, sonraki tur enjeksiyonlarının ve normal hook'ların
  sahibi olabilir.
- Güvenilir araç politikaları sıradan `before_tool_call` hook'larından önce
  çalışır ve host güvenlik politikasına katıldıkları için yalnızca paketlidir.
- Ayrılmış komut sahipliği yalnızca paketlidir. Harici Plugin'ler kendi komut
  adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki prompt
  alanları ve `enqueueNextTurnInjection` dahil prompt'u değiştiren hook'ları
  devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi              | Kullanılan hook'lar                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı                | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                              |
| Bütçe/çalışma alanı politika kapısı | Güvenilir araç politikası, araç meta verileri, oturum projeksiyonu                                                                    |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, aracı olay aboneliği, oturum zamanlayıcı sahipliği/temizliği, Heartbeat prompt katkısı, UI tanımlayıcısı |
| Kurulum veya onboarding sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                          |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`,
  `wizard.*`, `update.*`), bir Plugin daha dar bir Gateway yöntemi kapsamı
  atamaya çalışsa bile her zaman `operator.admin` olarak kalır. Plugin'e ait
  yöntemler için Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="Araç sonucu middleware'i ne zaman kullanılmalı">
  Paketli Plugin'ler, yürütmeden sonra ve çalışma zamanı bu sonucu modele geri
  beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice
  gibi async çıktı indirgeyicileri için güvenilir ve çalışma zamanından bağımsız
  arayüzdür.

Paketli Plugin'ler hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`.
Harici Plugin'ler bu middleware'i kaydedemez; model öncesi araç sonucu
zamanlamasına ihtiyaç duymayan işler için normal OpenClaw Plugin hook'larını
kullanın. Eski yalnızca Pi için gömülü uzantı fabrika kayıt yolu kaldırılmıştır.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin'in etkin Gateway'i
mDNS/Bonjour gibi yerel bir keşif taşıması üzerinde ilan etmesini sağlar.
OpenClaw, yerel keşif etkin olduğunda Gateway başlatması sırasında hizmeti
çağırır, mevcut Gateway bağlantı noktalarını ve gizli olmayan TXT ipucu
verilerini iletir ve Gateway kapatılırken döndürülen `stop` işleyicisini
çağırır.

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

Gateway discovery Plugin'leri, duyurulan TXT değerlerini sır veya kimlik
doğrulama olarak ele almamalıdır. Keşif bir yönlendirme ipucudur; Gateway kimlik doğrulaması ve TLS sabitlemesi güvenin sahibi olmaya devam eder.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür üst düzey meta veriyi kabul eder:

- `commands`: kaydedicinin sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel Plugin CLI kaydı için
  kullanılan ayrıştırma zamanı komut tanımlayıcıları

Bir Plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını istiyorsanız,
o kaydedici tarafından dışa açılan her üst düzey komut kökünü kapsayan
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

Yalnızca tembel kök CLI kaydına ihtiyacınız olmadığında `commands` değerini
tek başına kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak
ayrıştırma zamanı tembel yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi yerel bir
AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasına olanak tanır.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı ön eki olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'ı çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini
  Plugin varsayılanının üzerine birleştirir.
- Bir arka uç, birleştirmeden sonra uyumluluk yeniden yazmalarına ihtiyaç duyduğunda
  `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalleştirmek).

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). `assemble()` geri çağrısı `availableTools` ve `citationsMode` alır, böylece motor istem eklerini uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözümleyicisi                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                                    |

### Bellek gömme bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek gömme bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen özel bellek-Plugin API'sidir.
- `registerMemoryCapability`, eşlik eden Plugin'lerin belirli bir
  bellek Plugin'inin özel düzenine erişmek yerine dışa aktarılan bellek yapıtlarını
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)`
  değerini de dışa açabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu özel bellek-Plugin API'leridir.
- `MemoryFlushPlan.model`, etkin geri dönüş
  zincirini devralmadan boşaltma turunu `ollama/qwen3:8b` gibi kesin bir `provider/model`
  başvurusuna sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin'inin bir veya daha fazla
  gömme bağdaştırıcısı kimliği kaydetmesine olanak tanır (örneğin `openai`, `gemini` veya özel
  Plugin tanımlı bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırması, bu kayıtlı
  bağdaştırıcı kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yaptığı                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası          |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

Örnekler, yaygın kanca adları ve koruma semantiği için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` değerini atlamakla aynı), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` değerini atlamakla aynı), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici dağıtımı üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model dağıtım yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak ele alınır (`cancel` değerini atlamakla aynı), geçersiz kılma olarak değil.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyacınız olduğunda türlendirilmiş `threadId` alanını kullanın. `metadata` değerini kanala özgü ekler için tutun.
- `message_sending`: kanala özgü `metadata` değerine geri dönmeden önce türlendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway'in sahip olduğu başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'in sahip olduğu cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın ve zamanında yapılacak denetimler ile yürütme için OpenClaw'u doğruluk kaynağı olarak tutun.

### API nesne alanları

| Alan                    | Tür                      | Açıklama                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                   |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                               |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcut olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` değerinden Plugin'e özgü yapılandırma                                   |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                        |

## Dahili modül konvansiyonu

Plugin'inizde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Dış tüketiciler için herkese açık dışa aktarmalar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarmaları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Hafif yalnızca kurulum girişi (isteğe bağlı)
```

<Warning>
  Üretim kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca dış sözleşmedir.
</Warning>

Cephe üzerinden yüklenen paketlenmiş Plugin herkese açık yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer herkese açık giriş dosyaları),
OpenClaw zaten çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz çalışma zamanı anlık görüntüsü yoksa, diskteki çözümlenen yapılandırma dosyasına geri dönerler.
Paketlenmiş paket Plugin cepheleri, OpenClaw'un Plugin cephe yükleyicileri
üzerinden yüklenmelidir; `dist/extensions/...` içinden doğrudan içe aktarmalar, paketlenmiş kurulumların
Plugin'in sahip olduğu bağımlılıklar için kullandığı aşamalı çalışma zamanı
bağımlılık aynalarını atlar.

Sağlayıcı Plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgü olduğunda ve henüz genel bir SDK
alt yoluna ait olmadığında dar bir Plugin yerel sözleşme barrel'ı dışa açabilir.
Paketlenmiş örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için herkese açık `api.ts` / `contract-api.ts` arayüzü.
- **`@openclaw/openai-provider`**: `api.ts` sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts` sağlayıcı oluşturucusunu
  ve onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Uzantı üretim kodu da `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine
  onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna taşıyın.
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
  <Card title="Test" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve lint kuralları.
  </Card>
  <Card title="SDK geçişi" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin iç yapısı" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
