---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru kaynağı istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-05-02T09:03:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Plugin'ler ile çekirdek arasındaki tipli sözleşmedir. Bu sayfa
**nelerin içe aktarılacağı** ve **nelerin kaydedilebileceği** için referanstır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden aracıları çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini
  kullanın.
</Note>

<Tip>
Bunun yerine bir nasıl yapılır rehberi mi arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın, kanal Plugin'leri için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins), sağlayıcı Plugin'leri için [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) ve araç ya da yaşam döngüsü kancası Plugin'leri için [Plugin kancaları](/tr/plugins/hooks) sayfasını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi kendine yeterli bir modüldür. Bu, başlangıcı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin;
`openclaw/plugin-sdk/core` daha geniş çatı yüzeyi ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için kalsın.

Kanal yapılandırması için kanalın sahip olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema temel öğeleri ve genel oluşturucu içindir. OpenClaw'ın
paketle gelen Plugin'leri, korunan paketle gelen kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde
kalmaya devam eder; paketle gelen şema alt yollarının hiçbiri yeni Plugin'ler
için bir kalıp değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık yüzeylerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketle gelen Plugin'ler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` çatı dosyaları içinde birleştirir; çekirdek tüketicileri ya
  bu Plugin yerel çatı dosyalarını kullanmalı ya da bir ihtiyaç gerçekten
  kanallar arası olduğunda dar bir genel SDK sözleşmesi eklemelidir.

Paketle gelen Plugin yardımcı yüzeylerinin küçük bir kümesi, izlenen sahip
kullanımı olduğunda oluşturulan dışa aktarma haritasında hâlâ görünür. Bunlar
yalnızca paketle gelen Plugin bakımı için vardır ve yeni üçüncü taraf
Plugin'ler için önerilen içe aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account`, izlenen
sahip kullanımı için kullanımdan kaldırılmış uyumluluk cepheleri olarak da
tutulmaktadır. Bu içe aktarma yollarını yeni Plugin'lere kopyalamayın; bunun
yerine enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt
yollarını kullanın.
</Warning>

## Alt yol referansı

Plugin SDK, alana göre gruplanmış dar alt yollar kümesi olarak sunulur (Plugin
girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı, yetenek, bellek ve
ayrılmış paketle gelen Plugin yardımcıları). Gruplanmış ve bağlantılanmış tam
katalog için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Oluşturulan 200+ alt yol listesi `scripts/lib/plugin-sdk-entrypoints.json` içinde yer alır.

## Kayıt API'si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi`
nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Ne kaydeder                            |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                   |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli aracı yürütücü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu             |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                      |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi            |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon   |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                          |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                          |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı       |
| `api.registerWebSearchProvider(...)`             | Web araması                            |

### Araçlar ve komutlar

| Yöntem                         | Ne kaydeder                                      |
| ------------------------------ | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Aracı aracı (gerekli veya `{ optional: true }`)  |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                        |

Plugin komutları, aracının kısa, komuta ait bir yönlendirme ipucuna ihtiyaç
duyduğu durumlarda `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisi
hakkında tutun; çekirdek prompt oluşturucularına sağlayıcıya veya Plugin'e özgü
politika eklemeyin.

### Altyapı

| Yöntem                                         | Ne kaydeder                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                                  |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                       |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                           |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif ilan edicisi              |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                                |
| `api.registerService(service)`                 | Arka plan hizmeti                             |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                          |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç-sonucu ara yazılımı       |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek-komşu prompt bölümü           |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma derlemi           |

### İş akışı Plugin'leri için ana makine kancaları

Ana makine kancaları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine ana
makine yaşam döngüsüne katılması gereken Plugin'ler için SDK yüzeyleridir.
Bunlar genel sözleşmelerdir; Plan Modu bunları kullanabilir, ancak onay iş
akışları, çalışma alanı politika kapıları, arka plan izleyicileri, kurulum
sihirbazları ve UI eşlikçi Plugin'leri de kullanabilir.

| Yöntem                                                                   | Sahip olduğu sözleşme                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway oturumları üzerinden yansıtılan, Plugin'e ait JSON uyumlu oturum durumu                                                   |
| `api.enqueueNextTurnInjection(...)`                                      | Bir oturum için sonraki aracı turuna enjekte edilen kalıcı tam olarak bir kez bağlam                                               |
| `api.registerTrustedToolPolicy(...)`                                     | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketle gelen/güvenilen Plugin öncesi araç politikası                  |
| `api.registerToolMetadata(...)`                                          | Araç uygulamasını değiştirmeden araç kataloğu görüntüleme meta verileri                                                            |
| `api.registerCommand(...)`                                               | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.registerControlUiDescriptor(...)`                                   | Oturum, araç, çalıştırma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                             |
| `api.registerRuntimeLifecycle(...)`                                      | Sıfırlama/silme/yeniden yükleme yollarında Plugin'e ait çalışma zamanı kaynakları için temizleme geri çağrıları                   |
| `api.registerAgentEventSubscription(...)`                                | İş akışı durumu ve izleyiciler için arındırılmış olay abonelikleri                                                                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Terminal çalıştırma yaşam döngüsünde temizlenen çalıştırma başına Plugin geçici durumu                                            |
| `api.registerSessionSchedulerJob(...)`                                   | Deterministik temizleme ile Plugin'e ait oturum zamanlayıcı iş kayıtları                                                           |

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici Plugin'ler oturum uzantılarına, UI tanımlayıcılarına, komutlara, araç
  meta verilerine, sonraki tur enjeksiyonlarına ve normal kancalara sahip
  olabilir.
- Güvenilen araç politikaları sıradan `before_tool_call` kancalarından önce
  çalışır ve ana makine güvenlik politikasına katıldıkları için yalnızca paketle
  gelenler içindir.
- Ayrılmış komut sahipliği yalnızca paketle gelenler içindir. Harici Plugin'ler
  kendi komut adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki prompt
  alanları ve `enqueueNextTurnInjection` dahil prompt değiştiren kancaları devre
  dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi              | Kullanılan kancalar                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı                | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                           |
| Bütçe/çalışma alanı politika kapısı | Güvenilen araç politikası, araç meta verileri, oturum projeksiyonu                                                         |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, aracı olay aboneliği, oturum zamanlayıcı sahipliği/temizliği, heartbeat prompt katkısı, UI tanımlayıcısı |
| Kurulum veya ilk kullanım sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                               |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`,
  `wizard.*`, `update.*`), bir Plugin daha dar bir Gateway yöntemi kapsamı
  atamaya çalışsa bile her zaman `operator.admin` olarak kalır. Plugin'e ait
  yöntemler için Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="Araç-sonucu ara yazılımı ne zaman kullanılır">
  Paketle gelen Plugin'ler, yürütmeden sonra ve çalışma zamanı bu sonucu modele
  geri beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  eşzamansız çıktı azaltıcıları için güvenilen, çalışma zamanı tarafsız
  yüzeydir.

Paketle gelen Plugin'ler, hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`.
Harici Plugin'ler bu ara yazılımı kaydedemez; model öncesi araç-sonucu
zamanlamasına ihtiyaç duymayan işler için normal OpenClaw Plugin kancalarını
kullanın. Eski yalnızca Pi'ye özgü gömülü uzantı fabrikası kayıt yolu
kaldırılmıştır.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir plugin'in etkin Gateway'i mDNS/Bonjour gibi bir yerel keşif aktarımı üzerinde duyurmasını sağlar. OpenClaw, yerel keşif etkinleştirildiğinde Gateway başlangıcı sırasında servisi çağırır, geçerli Gateway bağlantı noktalarını ve gizli olmayan TXT ipucu verilerini geçirir ve Gateway kapanışı sırasında döndürülen `stop` işleyicisini çağırır.

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

Gateway keşif plugin'leri, duyurulan TXT değerlerini sır veya kimlik doğrulama olarak görmemelidir. Keşif bir yönlendirme ipucudur; Gateway kimlik doğrulaması ve TLS pinleme hâlâ güvenin sahibidir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür üst düzey meta veri kabul eder:

- `commands`: kayıt ediciye ait açık komut kökleri
- `descriptors`: kök CLI yardımı, yönlendirme ve tembel plugin CLI kaydı için kullanılan ayrıştırma zamanı komut tanımlayıcıları

Bir plugin komutunun normal kök CLI yolunda tembel yüklemeli kalmasını istiyorsanız, o kayıt edicinin açığa çıkardığı her üst düzey komut kökünü kapsayan `descriptors` sağlayın.

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

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin'in `codex-cli` gibi yerel bir AI CLI arka ucu için varsayılan yapılandırmanın sahibi olmasını sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model referanslarında sağlayıcı ön eki olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yı çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini plugin varsayılanının üzerine birleştirir.
- Bir arka uç, birleştirme sonrasında uyumluluk yeniden yazımlarına ihtiyaç duyduğunda `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalleştirmek için).

### Tekil slotlar

| Yöntem                                    | Ne kaydeder                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | Bağlam motoru (aynı anda bir etkin). `assemble()` geri çağırması `availableTools` ve `citationsMode` alır, böylece motor prompt eklemelerini özelleştirebilir.      |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü oluşturucusu                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`   | Bellek boşaltma planı çözücüsü                                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`      | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                                |

### Bellek gömme bağdaştırıcıları

| Yöntem                                         | Ne kaydeder                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek gömme bağdaştırıcısı    |

- `registerMemoryCapability`, tercih edilen tekil bellek-plugin API'sidir.
- `registerMemoryCapability` ayrıca, eşlik eden plugin'lerin belirli bir bellek plugin'inin özel düzenine erişmek yerine dışa aktarılan bellek yapıtlarını `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)` açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve `registerMemoryRuntime` eskiyle uyumlu tekil bellek-plugin API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin geri dönüş zincirini devralmadan `ollama/qwen3:8b` gibi kesin bir `provider/model` referansına sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek plugin'inin bir veya daha fazla gömme bağdaştırıcısı kimliği kaydetmesini sağlar (örneğin `openai`, `gemini` veya plugin tarafından tanımlanmış özel bir kimlik).
- `agents.defaults.memorySearch.provider` ve `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırmaları, bu kayıtlı bağdaştırıcı kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                              |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlendirilmiş yaşam döngüsü kancası  |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağırması        |

Örnekler, yaygın kanca adları ve koruma semantiği için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

### Kanca karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` atlamakla aynı), geçersiz kılma olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` atlamakla aynı), geçersiz kılma olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` atlamakla aynı), geçersiz kılma olarak değil.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyaç duyduğunuzda türlendirilmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ekler için saklayın.
- `message_sending`: kanala özgü `metadata` değerine geri dönmeden önce türlendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway'e ait başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'e ait cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın ve vade kontrolleri ile yürütme için OpenClaw'ı doğruluk kaynağı olarak tutun.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                              |
| `api.name`               | `string`                  | Görünen ad                                                                                  |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                            |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden plugin'e özgü yapılandırma                            |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                         |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                             |

## Dahili modül kuralı

Plugin'iniz içinde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Üretim kodundan kendi plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca dış sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları), OpenClaw zaten çalışıyorsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri dönerler. Paketlenmiş plugin facade'ları OpenClaw'ın plugin facade yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` içinden doğrudan içe aktarmalar, paketli kurulumların plugin'e ait kod için kullandığı manifest ve çalışma zamanı sidecar kontrollerini atlar.

Sağlayıcı plugin'leri, bir yardımcı özellikle sağlayıcıya özgü olduğunda ve henüz genel bir SDK alt yoluna ait olmadığında dar bir plugin-yerel sözleşme barrel'ı açığa çıkarabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için genel `api.ts` / `contract-api.ts` sınırı.
- **`@openclaw/openai-provider`**: `api.ts` sağlayıcı oluşturucularını, varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts` sağlayıcı oluşturucusunu ve katılım/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Eklenti üretim kodu ayrıca `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki plugin'i birbirine bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Giriş noktaları" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Çalışma zamanı yardımcıları" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` ad alanı referansı.
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
  <Card title="Plugin iç işleyişi" icon="diagram-project" href="/tr/plugins/architecture">
    Derinlemesine mimari ve yetenek modeli.
  </Card>
</CardGroup>
