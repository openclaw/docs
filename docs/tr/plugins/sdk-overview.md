---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapacağınızı bilmeniz gerekir
    - OpenClawPluginApi'deki tüm kayıt yöntemleri için bir referans istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-05-11T20:34:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Plugin'ler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için başvuru kaynağıdır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden aracıları çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [OpenClaw App SDK](/tr/concepts/openclaw-sdk) ve `@openclaw/sdk` paketini
  kullanın.
</Note>

<Tip>
Bunun yerine bir nasıl yapılır rehberi mi arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal Plugin'leri için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins), sağlayıcı Plugin'leri için [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins), yerel AI CLI arka uçları için [CLI arka uç Plugin'leri](/tr/plugins/cli-backend-plugins) ve araç ya da yaşam döngüsü hook Plugin'leri için [Plugin hook'ları](/tr/plugins/hooks) sayfalarını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük, kendi içinde bağımsız bir modüldür. Bu, başlatmayı hızlı tutar ve
döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/oluşturma yardımcıları için
`openclaw/plugin-sdk/channel-core` tercih edin; daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

Kanal yapılandırması için kanalın sahip olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkelleri ve genel oluşturucu içindir. OpenClaw'ın
paketli Plugin'leri, korunmuş paketli kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde kalır;
paketli şema alt yollarının hiçbiri yeni Plugin'ler için bir kalıp değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık seam'lerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketli Plugin'ler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; çekirdek tüketicileri ya bu
  Plugin'e yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arası
  olduğunda dar kapsamlı genel bir SDK sözleşmesi eklemelidir.

İzlenen sahip kullanımı olduğunda, oluşturulan export map içinde küçük bir
paketli Plugin yardımcı seam kümesi hâlâ görünür. Bunlar yalnızca paketli Plugin
bakımı için vardır ve yeni üçüncü taraf Plugin'leri için önerilen içe aktarma
yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account` ayrıca
izlenen sahip kullanımı için kullanımdan kaldırılmış uyumluluk façade'ları olarak
tutulur. Bu içe aktarma yollarını yeni Plugin'lere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol başvurusu

Plugin SDK; Plugin girişi, kanal, sağlayıcı, auth, çalışma zamanı, yetenek,
bellek ve ayrılmış paketli Plugin yardımcılarına göre gruplanmış dar alt yollar
kümesi olarak sunulur. Gruplanmış ve bağlantılanmış tam katalog için
[Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) bölümüne bakın.

Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json`
içinde bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json`
içinde listelenen repo-yerel test/dahili alt yollar çıkarıldıktan sonra herkese
açık alt kümeden oluşturulur. Herkese açık dışa aktarım sayısını denetlemek için
`pnpm plugin-sdk:surface` çalıştırın. Yeterince eski olan ve paketli uzantı
üretim kodu tarafından kullanılmayan kullanımdan kaldırılmış herkese açık alt
yollar `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde izlenir;
geniş kullanımdan kaldırılmış yeniden dışa aktarma barrel'ları
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` içinde izlenir.

## Kayıt API'si

`register(api)` callback'i, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi
alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                  |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli aracı yürütücü |
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

| Yöntem                         | Kaydettiği şey                                  |
| ------------------------------ | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Aracı aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                      |

Plugin komutları, aracının kısa ve komuta ait bir yönlendirme ipucuna ihtiyaç
duyduğu durumlarda `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisi
hakkında tutun; çekirdek prompt oluşturuculara sağlayıcıya veya Plugin'e özgü
politika eklemeyin.

### Altyapı

| Yöntem                                        | Kaydettiği şey                         |
| --------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                            |
| `api.registerHttpRoute(params)`               | Gateway HTTP uç noktası                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                    |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu         |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` altında Node özelliği CLI |
| `api.registerService(service)`                 | Arka plan servisi                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                   |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç sonucu ara yazılımı |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek komşu prompt bölümü    |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma korpusu    |

### İş akışı Plugin'leri için ana makine hook'ları

Ana makine hook'ları, yalnızca sağlayıcı, kanal veya araç eklemek yerine ana
makine yaşam döngüsüne katılması gereken Plugin'ler için SDK seam'leridir.
Bunlar genel sözleşmelerdir; Plan Mode bunları kullanabilir, ancak onay iş
akışları, çalışma alanı politika kapıları, arka plan izleyicileri, kurulum
sihirbazları ve UI yardımcı Plugin'leri de kullanabilir.

| Yöntem                                                                               | Sahip olduğu sözleşme                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway oturumları üzerinden yansıtılan, Plugin'e ait, JSON uyumlu oturum durumu                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Bir oturum için sonraki aracı turuna enjekte edilen dayanıklı, tam olarak bir kez bağlam                                         |
| `api.registerTrustedToolPolicy(...)`                                                 | Araç parametrelerini engelleyebilen veya yeniden yazabilen paketli/güvenilir ön Plugin araç politikası                            |
| `api.registerToolMetadata(...)`                                                      | Araç uygulamasını değiştirmeden araç katalog görüntüleme meta verileri                                                            |
| `api.registerCommand(...)`                                                           | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Oturum, araç, çalıştırma veya ayarlar yüzeyleri için kontrol UI katkı tanımlayıcıları                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Reset/delete/reload yollarında Plugin'e ait çalışma zamanı kaynakları için temizleme callback'leri                                |
| `api.agent.events.registerAgentEventSubscription(...)`                               | İş akışı durumu ve izleyiciler için sanitize edilmiş olay abonelikleri                                                            |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Terminal çalıştırma yaşam döngüsünde temizlenen, çalıştırma başına Plugin geçici durumu                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin'e ait zamanlayıcı işleri için temizleme meta verileri; işi zamanlamaz veya görev kayıtları oluşturmaz                      |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Etkin doğrudan giden oturum rotasına yalnızca paketli, ana makine aracılı dosya eki teslimi                                       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Yalnızca paketli Cron destekli zamanlanmış oturum turları ve etiket tabanlı temizleme                                             |
| `api.session.controls.registerSessionAction(...)`                                    | İstemcilerin Gateway üzerinden gönderebileceği türlendirilmiş oturum eylemleri                                                    |

Yeni Plugin kodu için gruplanmış namespace'leri kullanın:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Eşdeğer düz yöntemler, mevcut Plugin'ler için kullanımdan kaldırılmış uyumluluk
alias'ları olarak kullanılabilir kalır. Doğrudan
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` veya
`api.unscheduleSessionTurnsByTag` çağıran yeni Plugin kodu eklemeyin.

`scheduleSessionTurn(...)`, Gateway Cron zamanlayıcısı üzerinde oturum kapsamlı bir kolaylık katmanıdır. Cron zamanlamayı sahiplenir ve turn çalıştığında arka plan görev kaydını oluşturur; Plugin SDK yalnızca hedef oturumu, Plugin’e ait adlandırmayı ve temizlemeyi sınırlar. İşin kendisi dayanıklı çok adımlı Task Flow durumu gerektirdiğinde, zamanlanmış turn içinde `api.runtime.tasks.managedFlows` kullanın.

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici Plugin’ler oturum uzantılarını, UI tanımlayıcılarını, komutları, araç meta verilerini, sonraki turn enjeksiyonlarını ve normal hook’ları sahiplenebilir.
- Güvenilir araç ilkeleri sıradan `before_tool_call` hook’larından önce çalışır ve ana makine güvenlik ilkesine katıldıkları için yalnızca paketlenmiş olanlara özeldir.
- Ayrılmış komut sahipliği yalnızca paketlenmiş olanlara özeldir. Harici Plugin’ler kendi komut adlarını veya diğer adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki prompt alanları ve `enqueueNextTurnInjection` dahil olmak üzere prompt’u değiştiren hook’ları devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi              | Kullanılan hook’lar                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı                | Oturum uzantısı, komut devamı, sonraki turn enjeksiyonu, UI tanımlayıcısı                                                            |
| Bütçe/çalışma alanı ilke kapısı | Güvenilir araç ilkesi, araç meta verisi, oturum projeksiyonu                                                                                 |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, agent olay aboneliği, oturum zamanlayıcısı sahipliği/temizliği, Heartbeat prompt katkısı, UI tanımlayıcısı |
| Kurulum veya ilk kullanım sihirbazı | Oturum uzantısı, kapsamlı komutlar, Kontrol UI tanımlayıcısı                                                                              |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir Plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile
  her zaman `operator.admin` olarak kalır. Plugin’e ait yöntemler için Plugin’e
  özgü önekleri tercih edin.
</Note>

<Accordion title="Araç sonucu ara katmanı ne zaman kullanılır">
  Paketlenmiş Plugin’ler, yürütmeden sonra ve çalışma zamanı bu sonucu modele
  geri beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  async çıktı indirgeyicileri için güvenilir, çalışma zamanından bağımsız
  seam’dir.

Paketlenmiş Plugin’ler hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin `["pi", "codex"]`.
Harici Plugin’ler bu ara katmanı kaydedemez; model öncesi araç sonucu
zamanlaması gerektirmeyen işler için normal OpenClaw Plugin hook’larını kullanın.
Eski, yalnızca Pi’ye özgü gömülü uzantı factory kayıt yolu kaldırıldı.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin’in etkin Gateway’i
mDNS/Bonjour gibi yerel bir keşif aktarımı üzerinde duyurmasını sağlar. OpenClaw,
yerel keşif etkin olduğunda Gateway başlatılırken servisi çağırır, geçerli
Gateway portlarını ve gizli olmayan TXT ipucu verilerini iletir ve Gateway
kapatılırken döndürülen `stop` işleyicisini çağırır.

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

Gateway keşif Plugin’leri, duyurulan TXT değerlerini sır veya kimlik doğrulama
olarak ele almamalıdır. Keşif bir yönlendirme ipucudur; Gateway kimlik doğrulaması
ve TLS pinleme hâlâ güveni sahiplenir.

### CLI kayıt meta verisi

`api.registerCli(registrar, opts?)` iki tür komut meta verisi kabul eder:

- `commands`: registrar tarafından sahiplenilen açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve tembel Plugin CLI kaydı için kullanılan ayrıştırma zamanı komut tanımlayıcıları
- `parentPath`: `["nodes"]` gibi iç içe komut grupları için isteğe bağlı üst komut yolu

Eşlenmiş node özellikleri için
`api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu,
`api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir sarmalayıcıdır
ve `openclaw nodes canvas` gibi komutları açıkça Plugin’e ait node özellikleri yapar.

Bir Plugin komutunun normal kök CLI yolunda tembel yüklemeli kalmasını istiyorsanız,
o registrar’ın açığa çıkardığı her üst düzey komut kökünü kapsayan `descriptors`
sağlayın.

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

İç içe komutlar çözümlenmiş üst komutu `program` olarak alır:

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

`commands` değerini tek başına yalnızca tembel kök CLI kaydına ihtiyacınız yoksa
kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder, ancak ayrıştırma
zamanı tembel yükleme için tanımlayıcı destekli yer tutucular kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin’in `codex-cli` gibi yerel bir AI CLI
arka ucu için varsayılan yapılandırmayı sahiplenmesini sağlar.

- Arka uç `id` değeri, `codex-cli/gpt-5` gibi model referanslarında provider öneki olur.
- Arka uç `config` değeri `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması hâlâ önceliklidir. OpenClaw, CLI’ı çalıştırmadan önce `agents.defaults.cliBackends.<id>` değerini Plugin varsayılanının üzerine birleştirir.
- Bir arka uç birleştirme sonrasında uyumluluk yeniden yazımları gerektiriyorsa `normalizeConfig` kullanın (örneğin eski flag şekillerini normalleştirmek için).
- OpenClaw düşünme düzeylerini yerel effort flag’ine eşlemek gibi CLI lehçesine ait istek kapsamlı argv yeniden yazımları için `resolveExecutionArgs` kullanın.

Uçtan uca yazma kılavuzu için
[CLI arka uç Plugin’leri](/tr/plugins/cli-backend-plugins) bölümüne bakın.

### Özel slotlar

| Yöntem                                     | Ne kaydeder                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (tek seferde bir etkin). `assemble()` geri çağrısı `availableTools` ve `citationsMode` alır, böylece engine prompt eklemelerini uyarlayabilir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek capability’si                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Bellek prompt bölümü builder’ı                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek flush plan resolver’ı                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı adapter’ı                                                                                                                                    |

### Bellek embedding adapter’ları

| Yöntem                                         | Ne kaydeder                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek embedding adapter’ı |

- `registerMemoryCapability`, tercih edilen özel bellek Plugin API’sidir.
- `registerMemoryCapability`, eşlik eden Plugin’lerin belirli bir bellek Plugin’inin özel düzenine erişmek yerine dışa aktarılan bellek artifact’lerini `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)` de açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve `registerMemoryRuntime` eskiyle uyumlu özel bellek Plugin API’leridir.
- `MemoryFlushPlan.model`, flush turn’ünü etkin fallback zincirini devralmadan `ollama/qwen3:8b` gibi tam bir `provider/model` referansına sabitleyebilir.
- `registerMemoryEmbeddingProvider`, etkin bellek Plugin’inin bir veya daha fazla embedding adapter kimliği kaydetmesini sağlar (örneğin `openai`, `gemini` veya özel Plugin tanımlı bir kimlik).
- `agents.defaults.memorySearch.provider` ve `agents.defaults.memorySearch.fallback` gibi kullanıcı yapılandırması, bu kayıtlı adapter kimliklerine göre çözümlenir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Türlü yaşam döngüsü hook’u          |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

Örnekler, yaygın hook adları ve guard semantiği için [Plugin hook’ları](/tr/plugins/hooks)
bölümüne bakın.

### Hook karar semantiği

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` değerini atlamakla aynıdır), override olarak değil.
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak ele alınır (`block` değerini atlamakla aynıdır), override olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici dispatch’i üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model dispatch yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak ele alınır (`cancel` değerini atlamakla aynıdır), override olarak değil.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyacınız olduğunda türlü `threadId` alanını kullanın. `metadata` alanını kanala özgü ekler için saklayın.
- `message_sending`: kanala özgü `metadata` değerine dönmeden önce türlü `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: iç `gateway:startup` hook’larına güvenmek yerine gateway’e ait başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: gateway’e ait Cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın; süresi gelen denetimleri ve yürütme için OpenClaw’ı doğruluk kaynağı olarak tutun.

### API nesnesi alanları

| Alan                    | Tür                      | Açıklama                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                   |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                               |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa bellekte etkin çalışma zamanı anlık görüntüsü)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` üzerinden Plugin’e özgü yapılandırma                                   |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif, tam giriş öncesi başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                        |

## Dahili modül kuralı

Plugin’inizin içinde, dahili içe aktarmalar için yerel barrel dosyalarını kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Üretim kodundan kendi Plugin’inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca dış sözleşmedir.
</Warning>

Facade ile yüklenen paketlenmiş Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları), OpenClaw zaten
çalışıyorken etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder.
Henüz çalışma zamanı anlık görüntüsü yoksa, diskte çözümlenen yapılandırma
dosyasına geri dönerler. Paketlenmiş Plugin facade’ları OpenClaw’ın Plugin
facade yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` üzerinden
doğrudan içe aktarmalar, paketli kurulumların Plugin’e ait kod için kullandığı
manifest ve çalışma zamanı sidecar denetimlerini atlar.

Sağlayıcı Plugin’leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz
genel bir SDK alt yoluna ait değilse, dar bir Plugin yerel sözleşme barrel’ı
sunabilir. Paketlenmiş örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için genel `api.ts` / `contract-api.ts` sınırı.
- **`@openclaw/openai-provider`**: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucusunu
  ve onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu da `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin’i
  birbirine bağlamak yerine onu `openclaw/plugin-sdk/speech`,
  `.../provider-model-shared` veya başka bir yetenek odaklı yüzey gibi
  nötr bir SDK alt yoluna taşıyın.
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
  <Card title="Test" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve lint kuralları.
  </Card>
  <Card title="SDK geçişi" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin dahili yapısı" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
