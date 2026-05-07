---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapacağınızı bilmeniz gerekir
    - OpenClawPluginApi'deki tüm kayıt yöntemleri için bir referans istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-05-07T13:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, plugins ile çekirdek arasındaki tipli sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için referanstır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan plugin yazarları
  içindir. Gateway üzerinden agent çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini
  kullanın.
</Note>

<Tip>
Bunun yerine bir nasıl yapılır kılavuzu mu arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal pluginleri için [Kanal pluginleri](/tr/plugins/sdk-channel-plugins), sağlayıcı pluginleri için [Sağlayıcı pluginleri](/tr/plugins/sdk-provider-plugins), yerel AI CLI arka uçları için [CLI arka uç pluginleri](/tr/plugins/cli-backend-plugins) ve araç veya yaşam döngüsü hook pluginleri için [Plugin hook'ları](/tr/plugins/hooks) kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, bağımsız bir modüldür. Bu, başlatmayı hızlı tutar ve
döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları
için `openclaw/plugin-sdk/channel-core` tercih edin; `openclaw/plugin-sdk/core`
yolunu daha geniş şemsiye yüzey ve `buildChannelConfigSchema` gibi paylaşılan
yardımcılar için saklayın.

Kanal yapılandırması için, kanalın sahibi olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkelleri ve genel oluşturucu içindir. OpenClaw'ın
paketlenmiş pluginleri, korunmuş paketlenmiş-kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımı kaldırılmış uyumluluk
dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde kalır;
paketlenmiş şema alt yollarının hiçbiri yeni pluginler için bir kalıp değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık seam'lerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketlenmiş pluginler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; çekirdek tüketiciler ya bu
  plugine-yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arasıysa
  dar bir genel SDK sözleşmesi eklemelidir.

Sahip kullanımını takip ettikleri durumlarda, oluşturulan dışa aktarma haritasında
az sayıda paketlenmiş-plugin yardımcı seam'i hâlâ görünür. Bunlar yalnızca
paketlenmiş-plugin bakımı için vardır ve yeni üçüncü taraf pluginler için önerilen
içe aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account`, takip
edilen sahip kullanımı için kullanımı kaldırılmış uyumluluk facade'ları olarak da
tutulur. Bu içe aktarma yollarını yeni pluginlere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol referansı

Plugin SDK; plugin girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı,
capability, bellek ve ayrılmış paketlenmiş-plugin yardımcıları alanlarına göre
gruplandırılmış dar alt yollar kümesi olarak sunulur. Gruplandırılmış ve
bağlantılı tam katalog için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
sayfasına bakın.

Oluşturulan 200+ alt yol listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde bulunur.

## Kayıt API'si

`register(api)` callback'i, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi
alır:

### Capability kaydı

| Yöntem                                           | Neyi kaydeder                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                   |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli agent yürütücü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu             |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                      |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi            |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming gerçek zamanlı transkripsiyon |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                          |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                          |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı         |
| `api.registerWebSearchProvider(...)`             | Web araması                            |

### Araçlar ve komutlar

| Yöntem                         | Neyi kaydeder                                  |
| ------------------------------ | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent aracı (gerekli veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

Plugin komutları, agent kısa ve komuta ait bir yönlendirme ipucuna ihtiyaç
duyduğunda `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisiyle
ilgili tutun; çekirdek istem oluşturucularına sağlayıcıya veya plugine özgü
politika eklemeyin.

### Altyapı

| Yöntem                                         | Neyi kaydeder                            |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint'i                  |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                      |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu           |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                           |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` altında Node özelliği CLI |
| `api.registerService(service)`                 | Arka plan servisi                        |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                     |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç-sonucu middleware'i  |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli belleğe-yakın istem bölümü      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma korpusu      |

### Workflow pluginleri için host hook'ları

Host hook'ları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine host
yaşam döngüsüne katılması gereken pluginler için SDK seam'leridir. Bunlar
genel sözleşmelerdir; Plan Modu bunları kullanabilir, ancak onay workflow'ları,
workspace politika gate'leri, arka plan izleyicileri, kurulum sihirbazları ve UI
yardımcı pluginleri de kullanabilir.

| Yöntem                                                                   | Sahip olduğu sözleşme                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway oturumları üzerinden yansıtılan, plugine ait, JSON uyumlu oturum durumu                                                   |
| `api.enqueueNextTurnInjection(...)`                                      | Tek oturum için sonraki agent turuna enjekte edilen dayanıklı, tam olarak bir kez kullanılan bağlam                                |
| `api.registerTrustedToolPolicy(...)`                                     | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketlenmiş/güvenilir plugin-öncesi araç politikası                    |
| `api.registerToolMetadata(...)`                                          | Araç uygulamasını değiştirmeden araç katalog gösterim metadata'sı                                                                 |
| `api.registerCommand(...)`                                               | Kapsamlı plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.registerControlUiDescriptor(...)`                                   | Oturum, araç, çalışma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                                |
| `api.registerRuntimeLifecycle(...)`                                      | Sıfırlama/silme/yeniden yükleme yollarında plugine ait çalışma zamanı kaynakları için cleanup callback'leri                       |
| `api.registerAgentEventSubscription(...)`                                | Workflow durumu ve izleyiciler için sanitize edilmiş olay abonelikleri                                                            |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Terminal çalışma yaşam döngüsünde temizlenen çalışma-başına plugin geçici durumu                                                  |
| `api.registerSessionSchedulerJob(...)`                                   | Deterministik cleanup ile plugine ait oturum zamanlayıcı iş kayıtları                                                             |

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici pluginler oturum uzantılarına, UI tanımlayıcılarına, komutlara, araç
  metadata'sına, sonraki-tur enjeksiyonlarına ve normal hook'lara sahip olabilir.
- Güvenilir araç politikaları sıradan `before_tool_call` hook'larından önce
  çalışır ve host güvenlik politikasına katıldıkları için yalnızca paketlenmiş
  pluginlere açıktır.
- Ayrılmış komut sahipliği yalnızca paketlenmiş pluginlere açıktır. Harici
  pluginler kendi komut adlarını veya alias'larını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki istem
  alanları ve `enqueueNextTurnInjection` dahil olmak üzere istemi değiştiren
  hook'ları devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi             | Kullanılan hook'lar                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Onay workflow'u             | Oturum uzantısı, komut devamı, sonraki-tur enjeksiyonu, UI tanımlayıcısı                                                            |
| Bütçe/workspace politika gate'i | Güvenilir araç politikası, araç metadata'sı, oturum projeksiyonu                                                                 |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı cleanup'ı, agent olay aboneliği, oturum zamanlayıcı sahipliği/cleanup'ı, Heartbeat istem katkısı, UI tanımlayıcısı |
| Kurulum veya onboarding sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                    |

<Note>
  Ayrılmış çekirdek admin namespace'leri (`config.*`, `exec.approvals.*`,
  `wizard.*`, `update.*`), bir plugin daha dar bir gateway yöntemi kapsamı
  atamaya çalışsa bile her zaman `operator.admin` olarak kalır. Plugine ait
  yöntemler için plugine özgü prefix'ler tercih edin.
</Note>

<Accordion title="Araç-sonucu middleware'i ne zaman kullanılmalı">
  Paketlenmiş pluginler, yürütmeden sonra ve çalışma zamanı bu sonucu modele
  geri beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  async çıktı azaltıcıları için güvenilir ve çalışma zamanından bağımsız seam'dir.

Paketlenmiş Plugin'ler, hedeflenen her runtime için `contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`. Harici Plugin'ler bu middleware'i kaydedemez; model öncesi araç sonucu zamanlamasına ihtiyaç duymayan işler için normal OpenClaw Plugin hook'larını kullanın. Eski, yalnızca Pi'ye yönelik gömülü extension factory kayıt yolu kaldırıldı.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin'in etkin Gateway'i mDNS/Bonjour gibi yerel bir keşif taşıması üzerinde duyurmasını sağlar. OpenClaw, yerel keşif etkinleştirildiğinde Gateway başlatılırken servisi çağırır, geçerli Gateway portlarını ve gizli olmayan TXT ipucu verilerini iletir ve Gateway kapatılırken döndürülen `stop` işleyicisini çağırır.

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

Gateway keşif Plugin'leri, duyurulan TXT değerlerini gizli bilgi veya kimlik doğrulama olarak değerlendirmemelidir. Keşif bir yönlendirme ipucudur; güveni hâlâ Gateway kimlik doğrulaması ve TLS pinning yönetir.

### CLI kayıt metaverisi

`api.registerCli(registrar, opts?)` iki tür komut metaverisi kabul eder:

- `commands`: kayıtçıya ait açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve geç yüklenen Plugin CLI kaydı için kullanılan ayrıştırma zamanı komut tanımlayıcıları
- `parentPath`: `["nodes"]` gibi iç içe komut grupları için isteğe bağlı üst komut yolu

Eşleştirilmiş Node özellikleri için `api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu, `api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir sarmalayıcıdır ve `openclaw nodes canvas` gibi komutları açıkça Plugin'e ait Node özellikleri yapar.

Bir Plugin komutunun normal kök CLI yolunda geç yüklenmiş kalmasını istiyorsanız, o kayıtçının sunduğu her üst düzey komut kökünü kapsayan `descriptors` sağlayın.

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

İç içe komutlar, çözümlenen üst komutu `program` olarak alır:

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

Yalnızca geç kök CLI kaydına ihtiyaç duymadığınızda `commands` öğesini tek başına kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma zamanında geç yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin'in `codex-cli` gibi yerel bir AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasını sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model başvurularında sağlayıcı öneki olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini Plugin varsayılanının üzerine birleştirir.
- Bir arka uç, birleştirme sonrasında uyumluluk yeniden yazımlarına ihtiyaç duyduğunda `normalizeConfig` kullanın (örneğin eski flag şekillerini normalleştirmek için).
- OpenClaw düşünme seviyelerini yerel bir effort flag'ine eşlemek gibi CLI lehçesine ait istek kapsamlı argv yeniden yazımları için `resolveExecutionArgs` kullanın.

Uçtan uca yazarlık kılavuzu için bkz. [CLI arka uç Plugin'leri](/tr/plugins/cli-backend-plugins).

### Özel slotlar

| Yöntem                                    | Neyi kaydeder                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | Bağlam motoru (aynı anda bir etkin). `assemble()` geri çağrısı `availableTools` ve `citationsMode` alır; böylece motor prompt eklemelerini uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucu                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`   | Bellek flush planı çözücü                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`      | Bellek runtime adaptörü                                                                                                                                       |

### Bellek embedding adaptörleri

| Yöntem                                        | Neyi kaydeder                              |
| --------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek embedding adaptörü |

- `registerMemoryCapability`, tercih edilen özel bellek Plugin API'sidir.
- `registerMemoryCapability`, eşlik eden Plugin'lerin belirli bir bellek Plugin'inin özel düzenine erişmek yerine dışa aktarılan bellek artifact'lerini `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)` da sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve `registerMemoryRuntime` eski sürüm uyumlu özel bellek Plugin API'leridir.
- `MemoryFlushPlan.model`, flush turunu etkin fallback zincirini devralmadan `ollama/qwen3:8b` gibi tam bir `provider/model` başvurusuna sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin'inin bir veya daha fazla embedding adaptörü kimliği kaydetmesini sağlar (örneğin `openai`, `gemini` veya Plugin tarafından tanımlanan özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırması, bu kayıtlı adaptör kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                      | Ne yapar                    |
| ------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`          | Tiplenmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

Örnekler, yaygın hook adları ve guard semantiği için bkz. [Plugin hook'ları](/tr/plugins/hooks).

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynı), override olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` öğesini atlamakla aynı), override olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak ele alınır (`cancel` öğesini atlamakla aynı), override olarak değil.
- `message_received`: gelen thread/topic yönlendirmesine ihtiyaç duyduğunuzda tiplenmiş `threadId` alanını kullanın. Kanal özelindeki ekler için `metadata` kullanmaya devam edin.
- `message_sending`: kanal özelindeki `metadata` değerine geri dönmeden önce tiplenmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` hook'larına güvenmek yerine Gateway'e ait başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın; due kontrolleri ve yürütme için doğruluk kaynağı olarak OpenClaw'ı tutun.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                         |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                       |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                     |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                                 |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                               |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                                 |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi runtime anlık görüntüsü)             |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` üzerinden Plugin'e özel yapılandırma                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime yardımcıları](/tr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Kapsamlı logger (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif, tam giriş öncesi başlangıç/kurulum penceresidir |
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
  Production kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden import etmeyin. Dahili import'ları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş Plugin public yüzeyleri (`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` ve benzeri public giriş dosyaları), OpenClaw zaten çalışıyorsa etkin runtime yapılandırma anlık görüntüsünü tercih eder. Henüz runtime anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri dönerler. Paketlenmiş Plugin facade'ları OpenClaw'ın Plugin facade yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` üzerinden doğrudan import'lar, paketlenmiş kurulumların Plugin'e ait kod için kullandığı manifest ve runtime sidecar kontrollerini atlar.

Sağlayıcı Plugin'leri, bir yardımcı özellikle sağlayıcıya özgü olduğunda ve henüz
genel bir SDK alt yoluna ait olmadığında dar bir Plugin yerel sözleşme barrel'ı
sunabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` stream yardımcıları için
  herkese açık `api.ts` / `contract-api.ts` arayüzü.
- **`@openclaw/openai-provider`**: `api.ts` sağlayıcı oluşturucuları,
  varsayılan model yardımcılarını ve realtime sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucusunu
  ve onboarding/config yardımcılarını dışa aktarır.

<Warning>
  Uzantı üretim kodu, `openclaw/plugin-sdk/<other-plugin>` içe aktarımlarından da
  kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine
  bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared`
  veya başka bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna taşıyın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Giriş noktaları" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Runtime yardımcıları" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` namespace başvurusu.
  </Card>
  <Card title="Kurulum ve yapılandırma" icon="sliders" href="/tr/plugins/sdk-setup">
    Paketleme, manifest'ler ve config şemaları.
  </Card>
  <Card title="Test" icon="vial" href="/tr/plugins/sdk-testing">
    Test araçları ve lint kuralları.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin internalleri" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
