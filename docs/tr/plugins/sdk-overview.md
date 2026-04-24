---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekiyor
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: SDK overview
summary: Import map, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-04-24T09:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK, Plugin'lerle çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınızın** ve **neyi kaydedebileceğinizin** başvurusudur.

<Tip>
  Bunun yerine bir nasıl yapılır kılavuzu mu arıyorsunuz?

- İlk Plugin mi? [Building plugins](/tr/plugins/building-plugins) ile başlayın.
- Kanal Plugin'i mi? [Channel plugins](/tr/plugins/sdk-channel-plugins) bölümüne bakın.
- Sağlayıcı Plugin'i mi? [Provider plugins](/tr/plugins/sdk-provider-plugins) bölümüne bakın.
  </Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde yeterli bir modüldür. Bu, başlangıcı hızlı tutar
ve döngüsel bağımlılık sorunlarını önler. Kanal özel giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık yüzeylerinden içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketlenmiş Plugin'ler genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; çekirdek tüketiciler ya bu Plugin'e özel
  yerel barrel'ları kullanmalı ya da gereksinim gerçekten
  kanallar arası olduğunda dar bir genel SDK sözleşmesi eklemelidir.

Paketlenmiş-Plugin yardımcı yüzeylerinin küçük bir kümesi (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` ve benzerleri) oluşturulmuş dışa aktarma eşlemesinde hâlâ görünür.
Bunlar yalnızca paketlenmiş Plugin bakımı için vardır ve
yeni üçüncü taraf Plugin'ler için önerilen içe aktarma yolları değildir.
</Warning>

## Alt yol başvurusu

Plugin SDK, alanlara göre gruplanmış (Plugin
girişi, kanal, sağlayıcı, auth, runtime, yetenek, bellek ve ayrılmış
paketlenmiş-Plugin yardımcıları) dar alt yollar kümesi olarak sunulur. Tam katalog — gruplanmış ve bağlantılı — için
bkz.
[Plugin SDK subpaths](/tr/plugins/sdk-subpaths).

200+ alt yoldan oluşan oluşturulmuş liste `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

## Kayıt API'si

`register(api)` geri çağrısı, şu
yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Ne kaydeder                          |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                 |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli aracı yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım backend'i          |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                    |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi     |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görsel/ses/video analizi             |
| `api.registerImageGenerationProvider(...)`       | Görsel üretimi                       |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                        |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                        |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı     |
| `api.registerWebSearchProvider(...)`             | Web araması                          |

### Araçlar ve komutlar

| Yöntem                          | Ne kaydeder                                    |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Aracı aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

### Altyapı

| Yöntem                                          | Ne kaydeder                          |
| ----------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Olay kancası                         |
| `api.registerHttpRoute(params)`                 | Gateway HTTP uç noktası              |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC yöntemi                  |
| `api.registerGatewayDiscoveryService(service)`  | Yerel Gateway keşif yayıncısı        |
| `api.registerCli(registrar, opts?)`             | CLI alt komutu                       |
| `api.registerService(service)`                  | Arka plan hizmeti                    |
| `api.registerInteractiveHandler(registration)`  | Etkileşimli işleyici                 |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi gömülü çalıştırıcı uzantı fabrikası |
| `api.registerMemoryPromptSupplement(builder)`   | Ekleyici bellekle ilişkili prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`   | Ekleyici bellek arama/okuma korpusu  |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bir Plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile
  her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
  Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="registerEmbeddedExtensionFactory ne zaman kullanılmalı">
  Bir Plugin'in OpenClaw gömülü çalıştırmaları sırasında Pi-yerel
  olay zamanlamasına ihtiyacı varsa `api.registerEmbeddedExtensionFactory(...)` kullanın — örneğin son araç-sonucu mesajı yayınlanmadan önce gerçekleşmesi gereken
  eşzamansız `tool_result`
  yeniden yazımları için.

Bu bugün paketlenmiş-Plugin yüzeyidir: yalnızca paketlenmiş Plugin'ler bir tane
kaydedebilir ve
`openclaw.plugin.json` içinde `contracts.embeddedExtensionFactories: ["pi"]` bildirmelidir. Daha düşük seviyeli bu yüzeye ihtiyaç duymayan her şey için normal OpenClaw Plugin kancalarını kullanmaya devam edin.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin'in etkin
Gateway'i mDNS/Bonjour gibi yerel bir keşif taşımasında yayınlamasına izin verir. OpenClaw
yerel keşif etkin olduğunda Gateway başlangıcı sırasında hizmeti çağırır, geçerli Gateway portlarını ve gizli olmayan TXT ipucu verilerini geçirir ve Gateway kapanışı sırasında dönen
`stop` işleyicisini çağırır.

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

Gateway keşif Plugin'leri, yayınlanan TXT değerlerini sır
veya kimlik doğrulama olarak değerlendirmemelidir. Keşif bir yönlendirme ipucudur; güvenin sahibi yine Gateway auth ve TLS sabitlemedir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)`, iki tür üst düzey meta veri kabul eder:

- `commands`: kayıtçının sahip olduğu açık komut kökleri
- `descriptors`: kök CLI yardımı,
  yönlendirme ve tembel Plugin CLI kaydı için ayrıştırma zamanı komut tanımlayıcıları

Bir Plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını istiyorsanız,
o kayıtçı tarafından sunulan her üst düzey komut kökünü kapsayan `descriptors` sağlayın.

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

Yalnızca tembel kök CLI kaydına ihtiyacınız yoksa `commands`'ı tek başına kullanın.
Bu eager uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanı tembel yükleme için
descriptor destekli yer tutucular kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi yerel
AI CLI backend'i için varsayılan config'in sahibi olmasına izin verir.

- Backend `id`, `codex-cli/gpt-5` gibi model ref'lerinde sağlayıcı öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı biçimi kullanır.
- Kullanıcı config'i yine kazanır. OpenClaw, CLI'ı çalıştırmadan önce
  Plugin varsayılanı üzerine `agents.defaults.cliBackends.<id>` değerini birleştirir.
- Bir backend birleştirmeden sonra uyumluluk yeniden yazımları gerektiriyorsa
  (örneğin eski bayrak biçimlerini normalize etmek), `normalizeConfig` kullanın.

### Ayrıcalıklı slot'lar

| Yöntem                                     | Ne kaydeder                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda yalnızca bir etkin). `assemble()` geri çağrısı, motorun prompt eklemelerini uyarlayabilmesi için `availableTools` ve `citationsMode` alır. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucusu                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush planı çözücüsü                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı adaptörü                                                                                                                          |

### Bellek gömme adaptörleri

| Yöntem                                         | Ne kaydeder                                 |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek gömme adaptörü     |

- `registerMemoryCapability`, tercih edilen ayrıcalıklı bellek-Plugin API'sidir.
- `registerMemoryCapability`, eşlik eden Plugin'lerin
  belirli bir bellek Plugin'inin özel düzenine erişmek yerine
  dışa aktarılan bellek yapıtlarını `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` de sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu ayrıcalıklı bellek-Plugin API'leridir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin'inin
  bir veya daha fazla gömme adaptörü kimliği kaydetmesine izin verir (örneğin `openai`, `gemini` veya özel bir Plugin tanımlı kimlik).
- `agents.defaults.memorySearch.provider` ve
  `agents.defaults.memorySearch.fallback` gibi kullanıcı config'leri, kayıtlı bu
  adaptör kimliklerine göre çözülür.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                    |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası |
| `api.onConversationBindingResolved(handler)` | Konuşma binding geri çağrısı |

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` atlamakla aynıdır), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` atlamakla aynıdır), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici gönderimi sahiplendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` atlamakla aynıdır), geçersiz kılma olarak değil.
- `message_received`: gelen thread/topic yönlendirmesine ihtiyacınız olduğunda türlendirilmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ekler için saklayın.
- `message_sending`: kanala özgü `metadata` alanına fallback yapmadan önce türlendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: iç `gateway:startup` kancalarına güvenmek yerine gateway'e ait başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.

### API nesne alanları

| Alan                     | Tür                       | Açıklama                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                               |
| `api.name`               | `string`                  | Görünen ad                                                                                   |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                 |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                             |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                           |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                             |
| `api.config`             | `OpenClawConfig`          | Geçerli config anlık görüntüsü (mevcutsa etkin bellek içi çalışma zamanı anlık görüntüsü)   |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki Plugin'e özgü config                                  |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                          |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif ön tam giriş başlangıç/kurulum penceresidir   |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yol çözümler                                                              |

## İç modül kuralı

Plugin'iniz içinde, iç içe aktarımlar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Harici tüketiciler için genel dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca hafif kurulum girişi (isteğe bağlı)
```

<Warning>
  Üretim kodunda kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarımları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri genel giriş dosyaları), OpenClaw zaten
çalışıyorsa etkin çalışma zamanı config anlık görüntüsünü tercih eder. Henüz çalışma zamanı
anlık görüntüsü yoksa, diskteki çözülmüş config dosyasına fallback yaparlar.

Sağlayıcı Plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgü olduğunda ve henüz genel bir SDK
alt yoluna ait olmadığında dar bir Plugin'e özel sözleşme barrel'ı sunabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude
  beta-header ve `service_tier` akış yardımcıları için genel `api.ts` / `contract-api.ts` yüzeyi.
- **`@openclaw/openai-provider`**: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucusunu
  artı onboarding/config yardımcılarını dışa aktarır.

<Warning>
  Uzantı üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarımlarından da kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine
  onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  bir yetenek odaklı yüzey gibi nötr bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Giriş noktaları" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` ad alanı başvurusu.
  </Card>
  <Card title="Kurulum ve config" icon="sliders" href="/tr/plugins/sdk-setup">
    Paketleme, manifest'ler ve config şemaları.
  </Card>
  <Card title="Test" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve lint kuralları.
  </Card>
  <Card title="SDK taşıma" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden taşıma.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
