---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi'deki tüm kayıt yöntemlerine ilişkin bir referans istiyorsunuz.
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-05-04T18:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, pluginler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için referanstır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden ajanları çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini
  kullanın.
</Note>

<Tip>
Bunun yerine bir nasıl yapılır rehberi mi arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal pluginleri için [Kanal pluginleri](/tr/plugins/sdk-channel-plugins), sağlayıcı pluginleri için [Sağlayıcı pluginleri](/tr/plugins/sdk-provider-plugins) ve araç veya yaşam döngüsü kancası pluginleri için [Plugin kancaları](/tr/plugins/hooks) sayfalarını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi kendine yeten bir modüldür. Bu, başlatmayı hızlı tutar
ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/oluşturma
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin;
`openclaw/plugin-sdk/core` yolunu daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için ayırın.

Kanal yapılandırması için kanalın sahibi olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkelleri ve genel oluşturucu içindir. OpenClaw'ın
paketlenmiş pluginleri, korunmuş paketli kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde
kalmaya devam eder; paketli şema alt yollarının hiçbiri yeni pluginler için bir
kalıp değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık bağlantılarını içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketli pluginler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; çekirdek tüketicileri ya bu
  plugin yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arasıysa
  dar bir genel SDK sözleşmesi eklemelidir.

Sahip kullanımı izlenen küçük bir paketli Plugin yardımcı bağlantıları kümesi,
oluşturulan dışa aktarma haritasında hâlâ görünür. Bunlar yalnızca paketli
Plugin bakımı için vardır ve yeni üçüncü taraf pluginler için önerilen içe
aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account` da
izlenen sahip kullanımı için kullanımdan kaldırılmış uyumluluk cepheleri olarak
tutulur. Bu içe aktarma yollarını yeni pluginlere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol referansı

Plugin SDK, alana göre gruplanmış dar alt yollar kümesi olarak sunulur (Plugin
girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı, kabiliyet, bellek ve
ayrılmış paketli Plugin yardımcıları). Gruplanmış ve bağlantılanmış tam katalog
için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Oluşturulan 200+ alt yol listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Kabiliyet kaydı

| Yöntem                                           | Neyi kaydeder                         |
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
| `api.registerWebSearchProvider(...)`             | Web araması                           |

### Araçlar ve komutlar

| Yöntem                         | Neyi kaydeder                                      |
| ------------------------------ | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`)     |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                          |

Plugin komutları, ajanın kısa ve komutun sahibi olduğu bir yönlendirme ipucuna
ihtiyacı olduğunda `agentPromptGuidance` ayarlayabilir. Bu metni komutun
kendisiyle ilgili tutun; çekirdek istem oluşturucularına sağlayıcıya veya
Plugin'e özgü politika eklemeyin.

### Altyapı

| Yöntem                                         | Neyi kaydeder                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                                   |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                        |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                            |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu                 |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                                 |
| `api.registerService(service)`                 | Arka plan hizmeti                              |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                           |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç sonucu ara katmanı         |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli, belleğe bitişik istem bölümü         |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma külliyatı          |

### İş akışı pluginleri için ana makine kancaları

Ana makine kancaları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine ana
makine yaşam döngüsüne katılması gereken pluginler için SDK bağlantılarıdır.
Bunlar genel sözleşmelerdir; Plan Mode bunları kullanabilir, ancak onay iş
akışları, çalışma alanı politika kapıları, arka plan izleyicileri, kurulum
sihirbazları ve UI eşlikçi pluginleri de kullanabilir.

| Yöntem                                                                   | Sahip olduğu sözleşme                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway oturumları üzerinden yansıtılan, Plugin'in sahibi olduğu JSON uyumlu oturum durumu                                       |
| `api.enqueueNextTurnInjection(...)`                                      | Bir oturum için sonraki ajan turuna enjekte edilen dayanıklı, tam olarak bir kezlik bağlam                                        |
| `api.registerTrustedToolPolicy(...)`                                     | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketli/güvenilir Plugin öncesi araç politikası                       |
| `api.registerToolMetadata(...)`                                          | Araç uygulamasını değiştirmeden araç kataloğu görüntüleme meta verisi                                                             |
| `api.registerCommand(...)`                                               | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.registerControlUiDescriptor(...)`                                   | Oturum, araç, çalıştırma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                             |
| `api.registerRuntimeLifecycle(...)`                                      | Sıfırlama/silme/yeniden yükleme yollarında Plugin'in sahibi olduğu çalışma zamanı kaynakları için temizlik geri çağrıları         |
| `api.registerAgentEventSubscription(...)`                                | İş akışı durumu ve izleyiciler için temizlenmiş olay abonelikleri                                                                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Terminal çalıştırma yaşam döngüsünde temizlenen çalıştırma başına Plugin geçici durumu                                           |
| `api.registerSessionSchedulerJob(...)`                                   | Deterministik temizlikle Plugin'in sahibi olduğu oturum zamanlayıcı işi kayıtları                                                 |

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici pluginler oturum uzantılarına, UI tanımlayıcılarına, komutlara, araç
  meta verilerine, sonraki tur enjeksiyonlarına ve normal kancalara sahip
  olabilir.
- Güvenilir araç politikaları sıradan `before_tool_call` kancalarından önce
  çalışır ve ana makine güvenlik politikasına katıldıkları için yalnızca
  paketlidir.
- Ayrılmış komut sahipliği yalnızca paketlidir. Harici pluginler kendi komut
  adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki istem
  alanları ve `enqueueNextTurnInjection` dahil istemi değiştiren kancaları
  devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi              | Kullanılan kancalar                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı                | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                           |
| Bütçe/çalışma alanı politika kapısı | Güvenilir araç politikası, araç meta verisi, oturum projeksiyonu                                                            |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, ajan olay aboneliği, oturum zamanlayıcı sahipliği/temizliği, Heartbeat istem katkısı, UI tanımlayıcısı |
| Kurulum veya ilk kullanım sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                 |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir Plugin daha dar bir Gateway yöntemi kapsamı atamaya çalışsa
  bile her zaman `operator.admin` olarak kalır. Plugin'in sahibi olduğu
  yöntemler için Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="Araç sonucu ara katmanı ne zaman kullanılır">
  Paketli pluginler, yürütmeden sonra ve çalışma zamanı sonucu modele geri
  beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  async çıktı indirgeyicileri için güvenilir, çalışma zamanından bağımsız
  bağlantıdır.

Paketli pluginler, hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`.
Harici pluginler bu ara katmanı kaydedemez; model öncesi araç sonucu
zamanlamasına ihtiyaç duymayan işler için normal OpenClaw Plugin kancalarını
kullanın. Eski yalnızca Pi için olan gömülü uzantı fabrikası kayıt yolu
kaldırılmıştır.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin'in etkin Gateway'i mDNS/Bonjour gibi bir yerel keşif aktarımı üzerinde duyurmasını sağlar. OpenClaw, yerel keşif etkinleştirildiğinde Gateway başlatma sırasında hizmeti çağırır, mevcut Gateway portlarını ve gizli olmayan TXT ipucu verilerini iletir ve döndürülen `stop` işleyicisini Gateway kapatma sırasında çağırır.

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

Gateway keşif Plugin'leri, duyurulan TXT değerlerini sır veya kimlik doğrulama olarak ele almamalıdır. Keşif bir yönlendirme ipucudur; güven Gateway kimlik doğrulaması ve TLS sabitlemesine aittir.

### CLI kayıt üst verileri

`api.registerCli(registrar, opts?)` iki tür üst düzey üst veri kabul eder:

- `commands`: kayıt edene ait açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel Plugin CLI kaydı için kullanılan ayrıştırma zamanı komut tanımlayıcıları

Bir Plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını istiyorsanız, o kayıt edenin açığa çıkardığı her üst düzey komut kökünü kapsayan `descriptors` sağlayın.

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

`commands` öğesini tek başına yalnızca tembel kök CLI kaydına ihtiyacınız olmadığında kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı tembel yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi yerel bir AI CLI backend'i için varsayılan yapılandırmaya sahip olmasını sağlar.

- Backend `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'ı çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini Plugin varsayılanının üzerine birleştirir.
- Bir backend birleştirme sonrasında uyumluluk yeniden yazmalarına ihtiyaç duyduğunda `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalleştirme).
- OpenClaw düşünme düzeylerini yerel bir çaba bayrağına eşlemek gibi CLI lehçesine ait istek kapsamlı argv yeniden yazmaları için `resolveExecutionArgs` kullanın.

### Özel yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir tane etkin). `assemble()` geri çağrısı `availableTools` ve `citationsMode` alır, böylece motor istem eklemelerini uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucu                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözümleyici                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı adaptörü                                                                                                                        |

### Bellek embedding adaptörleri

| Yöntem                                         | Kaydettiği şey                              |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek embedding adaptörü |

- `registerMemoryCapability` tercih edilen özel bellek Plugin'i API'sidir.
- `registerMemoryCapability`, eşlik eden Plugin'lerin dışa aktarılan bellek yapıtlarını belirli bir bellek Plugin'inin özel düzenine erişmek yerine `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)` de açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve `registerMemoryRuntime` eski sürüm uyumlu özel bellek Plugin'i API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin yedek zincirini devralmadan `ollama/qwen3:8b` gibi tam bir `provider/model` başvurusuna sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin'inin bir veya daha fazla embedding adaptörü kimliği kaydetmesini sağlar (örneğin `openai`, `gemini` veya Plugin tarafından tanımlanan özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları bu kayıtlı adaptör kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Yaptığı şey                    |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Tipli yaşam döngüsü kancası    |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı   |

Örnekler, yaygın kanca adları ve koruma semantiği için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynı), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynı), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak ele alınır (`cancel` öğesini atlamakla aynı), geçersiz kılma olarak değil.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyaç duyduğunuzda tipli `threadId` alanını kullanın. `metadata` öğesini kanala özgü ekler için tutun.
- `message_sending`: kanala özgü `metadata` değerine geri dönmeden önce tipli `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway'e ait başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını senkronize ederken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın ve vade denetimleri ile yürütme için doğruluk kaynağı olarak OpenClaw'ı koruyun.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                              |
| `api.name`               | `string`                  | Görünen ad                                                                                  |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                           |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                           |
| `api.config`             | `OpenClawConfig`          | Mevcut yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma                            |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                        |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mevcut yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                             |

## Dahili modül düzeni

Plugin'iniz içinde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Üretim kodunda kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş Plugin ortak yüzeyleri (`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` ve benzer ortak giriş dosyaları), OpenClaw zaten çalışıyorken etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı anlık görüntüsü yoksa, diskte çözümlenen yapılandırma dosyasına geri dönerler. Paketlenmiş paket Plugin facade'ları OpenClaw'ın Plugin facade yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` içinden doğrudan içe aktarmalar, paketli kurulumların Plugin'e ait kod için kullandığı manifest ve çalışma zamanı sidecar denetimlerini atlar.

Sağlayıcı Plugin'leri, bir yardımcı bilerek sağlayıcıya özgü olduğunda ve henüz genel bir SDK alt yoluna ait olmadığında dar bir Plugin yerel sözleşme barrel'ı açığa çıkarabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için ortak `api.ts` / `contract-api.ts` yüzeyi.
- **`@openclaw/openai-provider`**: `api.ts` sağlayıcı oluşturucuları, varsayılan model yardımcılarını ve realtime sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts` sağlayıcı oluşturucusunu ve onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu da `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
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
    Kullanımdan kaldırılan yüzeylerden geçiş.
  </Card>
  <Card title="Plugin iç yapısı" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
