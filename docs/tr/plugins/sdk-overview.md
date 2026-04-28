---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK overview
summary: İçe aktarma haritası, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-04-25T13:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK, plugin'ler ile core arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınızın** ve **neleri kaydedebileceğinizin** başvurusudur.

<Tip>
  Bunun yerine bir nasıl yapılır kılavuzu mu arıyorsunuz?

- İlk plugin'iniz mi? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın.
- Kanal plugin'i mi? [Kanal plugin'leri](/tr/plugins/sdk-channel-plugins) sayfasına bakın.
- Sağlayıcı plugin'i mi? [Sağlayıcı plugin'leri](/tr/plugins/sdk-provider-plugins) sayfasına bakın.
- Araç veya yaşam döngüsü kancası plugin'i mi? [Plugin kancaları](/tr/plugins/hooks) sayfasına bakın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük ve kendi içinde yeterli bir modüldür. Bu, başlatmayı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin; daha geniş
çatı yüzeyi ve `buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` yolunu kullanın.

Kanal yapılandırması için, kanala ait JSON Schema'yı
`openclaw.plugin.json#channelConfigs` aracılığıyla yayınlayın.
`plugin-sdk/channel-config-schema` alt yolu, paylaşılan şema ilkel öğeleri ve
genel oluşturucu içindir. Bu alt yoldaki paketlenmiş kanal adlı şema dışa
aktarımları, yeni plugin'ler için bir örüntü değil, eski uyumluluk dışa
aktarımlarıdır.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık katmanlarını içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketlenmiş plugin'ler, kendi `api.ts` / `runtime-api.ts` barrel dosyaları
  içinde genel SDK alt yollarını birleştirir; core tüketicileri ya bu
  plugin-yerel barrel dosyalarını kullanmalı ya da ihtiyaç gerçekten
  kanallar arasıysa dar bir genel SDK sözleşmesi eklemelidir.

Üretilmiş dışa aktarım eşlemesinde küçük bir paketlenmiş-plugin yardımcı katman
kümesi (`plugin-sdk/feishu`, `plugin-sdk/zalo`, `plugin-sdk/matrix*` ve
benzerleri) hâlâ görünür. Bunlar yalnızca paketlenmiş-plugin bakımı için vardır
ve yeni üçüncü taraf plugin'ler için önerilen içe aktarma yolları değildir.
</Warning>

## Alt yol başvurusu

Plugin SDK, alana göre gruplanmış dar alt yol kümeleri olarak sunulur (plugin
girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı, yetenek, bellek ve
paketlenmiş plugin'lere ayrılmış yardımcılar). Tam katalog için — gruplanmış ve
bağlantılı olarak — [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına
bakın.

200'den fazla alt yolun üretilmiş listesi `scripts/lib/plugin-sdk-entrypoints.json`
dosyasında bulunur.

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                   |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli ajan yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu             |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                      |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi            |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon   |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görüntü oluşturma                      |
| `api.registerMusicGenerationProvider(...)`       | Müzik oluşturma                        |
| `api.registerVideoGenerationProvider(...)`       | Video oluşturma                        |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı       |
| `api.registerWebSearchProvider(...)`             | Web arama                              |

### Araçlar ve komutlar

| Yöntem                          | Kaydettiği şey                                 |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

### Altyapı

| Yöntem                                         | Kaydettiği şey                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                     |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu          |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                          |
| `api.registerService(service)`                 | Arka plan hizmeti                       |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                    |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç-sonuç ara katmanı   |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek-komşusu istem bölümü    |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma derlemi     |

<Note>
  Core'a ayrılmış yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir plugin daha dar bir Gateway yöntem kapsamı atamaya çalışsa
  bile her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
  plugin'e özgü önekler tercih edin.
</Note>

<Accordion title="Araç-sonuç ara katmanı ne zaman kullanılmalı">
  Paketlenmiş plugin'ler, bir araç sonucunu yürütmeden sonra ve çalışma zamanı
  bu sonucu modele geri beslemeden önce yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  eşzamansız çıktı azaltıcıları için güvenilir, çalışma zamanı tarafsız
  katmandır.

Paketlenmiş plugin'ler, hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin
`["pi", "codex"]`. Harici plugin'ler bu ara katmanı kaydedemez;
model öncesi araç-sonuç zamanlamasına ihtiyaç duymayan işler için normal
OpenClaw plugin kancalarını kullanın. Eski yalnızca Pi'ye özgü gömülü
extension factory kayıt yolu kaldırılmıştır.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir plugin'in etkin
Gateway'i mDNS/Bonjour gibi yerel bir keşif taşıması üzerinde duyurmasına
olanak tanır. OpenClaw, yerel keşif etkin olduğunda Gateway başlatma sırasında
hizmeti çağırır, geçerli Gateway portlarını ve gizli olmayan TXT ipucu
verilerini geçirir ve Gateway kapatılırken döndürülen `stop` işleyicisini
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

Gateway keşif plugin'leri, duyurulan TXT değerlerini gizli bilgi veya
kimlik doğrulama olarak ele almamalıdır. Keşif bir yönlendirme ipucudur;
güvenin sahibi olmaya Gateway kimlik doğrulaması ve TLS pinleme devam eder.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)`, iki tür üst düzey meta veri kabul eder:

- `commands`: registrar'a ait açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel plugin CLI kaydı için
  ayrıştırma zamanı komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını
istiyorsanız, o registrar tarafından sunulan her üst düzey komut kökünü kapsayan
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
        description: "Matrix hesaplarını, doğrulamayı, cihazları ve profil durumunu yönetin",
        hasSubcommands: true,
      },
    ],
  },
);
```

Tembel kök CLI kaydına ihtiyacınız yoksa `commands` alanını tek başına kullanın.
Bu hevesli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı
tembel yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel bir
AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasına olanak tanır.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce
  plugin varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir arka uç birleştirme sonrasında uyumluluk yeniden yazımlarına ihtiyaç
  duyuyorsa `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalize etmek için).

### Münhasır yuvalar

| Yöntem                                     | Kaydettiği şey                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). `assemble()` geri çağrısı, motorun istem eklerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek temizleme planı çözücüsü                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                       |

### Bellek gömme bağdaştırıcıları

| Yöntem                                         | Kaydettiği şey                                |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek gömme bağdaştırıcısı |

- `registerMemoryCapability`, tercih edilen münhasır bellek-plugin API'sidir.
- `registerMemoryCapability`, eşlik eden plugin'lerin dışa aktarılan bellek
  yapıtlarını belirli bir bellek plugin'inin özel düzenine erişmek yerine
  `openclaw/plugin-sdk/memory-host-core` aracılığıyla tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` da sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu münhasır bellek-plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin'inin bir veya daha
  fazla gömme bağdaştırıcı kimliğini kaydetmesine olanak tanır (örneğin
  `openai`, `gemini` veya plugin tarafından tanımlanmış özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları,
  kaydedilmiş bu bağdaştırıcı kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                    |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

Örnekler, yaygın kanca adları ve koruma semantiği için
[Plugin kancaları](/tr/plugins/hooks) sayfasına bakın.

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar verilmemiş olarak değerlendirilir (`block` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar verilmemiş olarak değerlendirilir (`cancel` alanını hiç vermemekle aynıdır), geçersiz kılma olarak değil.
- `message_received`: gelen ileti dizisi/konu yönlendirmesine ihtiyaç duyduğunuzda türlendirilmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ekler için saklayın.
- `message_sending`: kanala özgü `metadata` alanına geri dönmeden önce türlendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway'e ait başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                               |
| `api.name`               | `string`                  | Görünen ad                                                                                   |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                 |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                             |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                           |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                             |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin'e özgü yapılandırma                             |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                          |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                              |

## Dahili modül kuralı

Plugin'iniz içinde, dahili içe aktarımlar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici tüketiciler için ortak dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kurulum için hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarımları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici
  sözleşmedir.
</Warning>

Cephe üzerinden yüklenen paketlenmiş plugin ortak yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri ortak giriş dosyaları), OpenClaw zaten
çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz bir çalışma zamanı anlık görüntüsü yoksa, diskte çözümlenmiş yapılandırma
dosyasına geri dönerler.

Sağlayıcı plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz
genel bir SDK alt yoluna ait değilse, dar bir plugin-yerel sözleşme barrel'ı
sunabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude beta başlığı ve `service_tier` akış yardımcıları için
  ortak `api.ts` / `contract-api.ts` katmanı.
- **`@openclaw/openai-provider`**: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucuyu artı
  onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu, `openclaw/plugin-sdk/<other-plugin>` içe aktarımlarından da kaçınmalıdır.
  Bir yardımcı gerçekten paylaşılıyorsa, iki plugin'i birbirine bağlamak yerine
  bunu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir
  yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna taşıyın.
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
    Paketleme, manifest'ler ve yapılandırma şemaları.
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
