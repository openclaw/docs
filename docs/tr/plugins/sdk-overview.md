---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API referansı ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-07-01T18:18:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Plugin'ler ile core arasındaki tipli sözleşmedir. Bu sayfa,
**neyi içe aktaracağınız** ve **neyi kaydedebileceğiniz** için referanstır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden agent çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [Harici uygulamalar için Gateway entegrasyonları](/tr/gateway/external-apps) kullanın.
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

Her alt yol küçük, kendi kendine yeterli bir modüldür. Bu, başlangıcı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü entry/build
yardımcıları için `openclaw/plugin-sdk/channel-core` tercih edin; daha geniş
şemsiye yüzey ve `buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

Kanal yapılandırması için, kanalın sahip olduğu JSON Schema'yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema ilkel öğeleri ve genel builder içindir. OpenClaw'ın
paketli Plugin'leri, korunan paketli kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarmaları `plugin-sdk/channel-config-schema-legacy` üzerinde kalır;
paketli şema alt yollarından hiçbiri yeni Plugin'ler için bir model değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık dikişlerini içe aktarmayın (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Paketli Plugin'ler, genel SDK alt yollarını kendi `api.ts` /
  `runtime-api.ts` barrel'ları içinde birleştirir; core tüketicileri ya bu
  Plugin'e yerel barrel'ları kullanmalı ya da ihtiyaç gerçekten kanallar arası
  olduğunda dar bir genel SDK sözleşmesi eklemelidir.

Sahip kullanımı izlenen küçük bir paketli Plugin yardımcı dikişleri kümesi,
üretilen export map içinde hâlâ görünür. Bunlar yalnızca paketli Plugin bakımı
için vardır ve yeni üçüncü taraf Plugin'ler için önerilen içe aktarma yolları
değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account` de
izlenen sahip kullanımı için kullanımdan kaldırılmış uyumluluk facade'ları
olarak tutulur. Bu içe aktarma yollarını yeni Plugin'lere kopyalamayın; bunun
yerine enjekte edilen runtime yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol referansı

Plugin SDK, alana göre gruplanmış dar alt yollar kümesi olarak sunulur (Plugin
entry, kanal, sağlayıcı, kimlik doğrulama, runtime, capability, bellek ve
ayrılmış paketli Plugin yardımcıları). Gruplanmış ve bağlantılı tam katalog
için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Derleyici entrypoint envanteri `scripts/lib/plugin-sdk-entrypoints.json` içinde
bulunur; paket dışa aktarmaları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json`
içinde listelenen repo yerel test/dahili alt yolları çıkarıldıktan sonra genel
alt kümeden üretilir. Genel dışa aktarma sayısını denetlemek için
`pnpm plugin-sdk:surface` çalıştırın. Yeterince eski olan ve paketli uzantı
üretim kodu tarafından kullanılmayan kullanımdan kaldırılmış genel alt yollar
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde izlenir; geniş
kullanımdan kaldırılmış yeniden dışa aktarma barrel'ları
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` içinde izlenir.

## Kayıt API'si

`register(api)` callback'i, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Capability kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                   |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli agent yürütücü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu             |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                      |
| `api.registerEmbeddingProvider(...)`             | Yeniden kullanılabilir vektör embedding sağlayıcısı |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT sentezi           |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming gerçek zamanlı transkripsiyon |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                          |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                          |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape sağlayıcısı         |
| `api.registerWebSearchProvider(...)`             | Web arama                              |

`api.registerEmbeddingProvider(...)` ile kaydedilen embedding sağlayıcıları,
Plugin manifestindeki `contracts.embeddingProviders` içinde de listelenmelidir.
Bu, yeniden kullanılabilir vektör üretimi için genel embedding yüzeyidir. Bellek
araması bu genel sağlayıcı yüzeyini tüketebilir. Eski
`api.registerMemoryEmbeddingProvider(...)` ve `contracts.memoryEmbeddingProviders`
dikişi, mevcut belleğe özgü sağlayıcılar taşınırken kullanımdan kaldırılmış
uyumluluktur.

Hâlâ runtime `batchEmbed(...)` sunan belleğe özgü sağlayıcılar, runtime'ları
açıkça `sourceWideBatchEmbed: true` ayarlamadıkça mevcut dosya başına batch
sözleşmesinde kalır. Bu opt-in, bellek host'unun birden çok kirli bellek
dosyasından ve etkin kaynaktan gelen parçaları host batch sınırlarına kadar tek
bir `batchEmbed(...)` çağrısında göndermesine izin verir. JSONL istek dosyaları
yükleyen batch adapter'ları, sağlayıcı işlerini istek sayısı sınırlarının yanı
sıra yükleme boyutu sınırlarından önce de bölmelidir. Sağlayıcı, her input
parçası için `batch.chunks` ile aynı sırada bir embedding döndürmelidir;
sağlayıcı dosya yerel batch'ler bekliyorsa veya daha büyük kaynak geneli bir
işte input sıralamasını koruyamıyorsa flag'i atlayın.

### Araçlar ve komutlar

Sabit araç adlarına sahip basit, yalnızca araç içeren Plugin'ler için
[`defineToolPlugin`](/tr/plugins/tool-plugins) kullanın. Karma Plugin'ler veya
tamamen dinamik araç kaydı için doğrudan `api.registerTool(...)` kullanın.

| Yöntem                         | Kaydettiği şey                                |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`      | Özel komut (LLM'yi atlar)                     |

Plugin komutları, agent kısa, komuta ait bir yönlendirme ipucuna ihtiyaç
duyduğunda `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisiyle
ilgili tutun; core prompt builder'larına sağlayıcıya veya Plugin'e özgü policy
eklemeyin.

Guidance girdileri, her prompt yüzeyine uygulanan legacy string'ler veya
yapılandırılmış girdiler olabilir:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Yapılandırılmış `surfaces`; `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` veya `subagent` içerebilir. `pi_main`,
`openclaw_main` için kullanımdan kaldırılmış bir alias olarak kalır.
Bilinçli olarak tüm yüzeylere yönelik guidance için `surfaces` atlayın. Boş
bir `surfaces` dizisi geçirmeyin; kazara kapsam kaybının global prompt metnine
dönüşmemesi için reddedilir.

Yerel Codex app-server developer instructions, diğer prompt yüzeylerinden daha
katıdır: yalnızca açıkça `codex_app_server` kapsamına alınmış guidance bu daha
yüksek öncelikli şeride yükseltilir. Legacy string guidance ve kapsamsız
yapılandırılmış guidance, uyumluluk için Codex dışı prompt yüzeylerinde
kullanılabilir kalır.

### Altyapı

| Yöntem                                         | Kaydettiği şey                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay hook'u                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint'i                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                    |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif ilanlayıcısı       |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` altında Node özelliği CLI'ı |
| `api.registerService(service)`                 | Arka plan servisi                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli handler                    |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime araç sonucu middleware'i       |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli bellek bitişiği prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma corpus'u   |

### İş akışı Plugin'leri için host hook'ları

Host hook'ları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine host
yaşam döngüsüne katılması gereken Plugin'ler için SDK dikişleridir. Bunlar genel
sözleşmelerdir; Plan Mode bunları kullanabilir, ancak onay iş akışları, çalışma
alanı policy gate'leri, arka plan izleyicileri, kurulum sihirbazları ve UI
yardımcı Plugin'leri de kullanabilir.

| Yöntem                                                                               | Sahip olduğu sözleşme                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway oturumları üzerinden yansıtılan, Plugin'e ait JSON uyumlu oturum durumu                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Bir oturum için sonraki ajan turuna en fazla bir kez enjekte edilen kalıcı bağlam                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Araç parametrelerini engelleyebilen veya yeniden yazabilen, manifest kapılı, güvenilir Plugin öncesi araç politikası                                                                        |
| `api.registerToolMetadata(...)`                                                      | Araç uygulamasını değiştirmeden araç kataloğu görüntüleme meta verileri                                                                                     |
| `api.registerCommand(...)`                                                           | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` veya `suppressReply: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Oturum, araç, çalıştırma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Sıfırlama/silme/yeniden yükleme yollarında Plugin'e ait çalışma zamanı kaynakları için temizlik geri çağrıları                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | İş akışı durumu ve izleyiciler için temizlenmiş olay abonelikleri                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Terminal çalıştırma yaşam döngüsünde temizlenen çalıştırma başına Plugin karalama durumu                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin'e ait zamanlayıcı işleri için temizlik meta verileri; iş zamanlamaz veya görev kayıtları oluşturmaz                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Etkin doğrudan giden oturum rotasına, yalnızca paketli ana bilgisayar aracılı dosya eki teslimi                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Yalnızca paketli Cron destekli zamanlanmış oturum turları ve etiket tabanlı temizlik                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | İstemcilerin Gateway üzerinden gönderebileceği tipli oturum eylemleri                                                                                             |

Yeni Plugin kodu için gruplanmış ad alanlarını kullanın:

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
takma adları olarak kullanılabilir kalır. Doğrudan
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` veya
`api.unscheduleSessionTurnsByTag` çağıran yeni Plugin kodu eklemeyin.

`scheduleSessionTurn(...)`, Gateway Cron zamanlayıcısı üzerinde oturum kapsamlı
bir kolaylıktır. Cron zamanlamaya sahiptir ve tur çalıştığında arka plan görev
kaydını oluşturur; Plugin SDK yalnızca hedef oturumu, Plugin'e ait
adlandırmayı ve temizliği sınırlar. İşin kendisi kalıcı çok adımlı Task Flow
durumu gerektirdiğinde zamanlanmış tur içinde `api.runtime.tasks.managedFlows`
kullanın.

Sözleşmeler yetkiyi kasıtlı olarak böler:

- Harici Plugin'ler oturum uzantılarına, UI tanımlayıcılarına, komutlara, araç
  meta verilerine, sonraki tur enjeksiyonlarına ve normal hook'lara sahip olabilir.
- Güvenilir araç politikaları sıradan `before_tool_call` hook'larından önce çalışır ve
  ana bilgisayar tarafından güvenilirdir. Paketli politikalar önce çalışır; kurulu
  Plugin politikaları açık etkinleştirme ve
  `contracts.trustedToolPolicies` içinde yerel kimliklerini gerektirir ve ardından
  Plugin yükleme sırasına göre çalışır. Politika kimlikleri, kaydeden Plugin'e
  göre kapsamlandırılır.
- Ayrılmış komut sahipliği yalnızca paketlidir. Harici Plugin'ler kendi
  komut adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki istem
  alanları ve `enqueueNextTurnInjection` dahil istemi değiştiren hook'ları
  devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi             | Kullanılan hook'lar                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı            | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                            |
| Bütçe/çalışma alanı politika kapısı | Güvenilir araç politikası, araç meta verileri, oturum projeksiyonu                                                                                 |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, ajan olay aboneliği, oturum zamanlayıcı sahipliği/temizliği, Heartbeat istem katkısı, UI tanımlayıcısı |
| Kurulum veya ilk kullanım sihirbazı   | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                              |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir Plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile
  her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için
  Plugin'e özgü önekleri tercih edin.
</Note>

<Accordion title="When to use tool-result middleware">
  Paketli Plugin'ler ve eşleşen manifest sözleşmeleriyle açıkça etkinleştirilmiş
  kurulu Plugin'ler, yürütmeden sonra ve çalışma zamanı bu sonucu modele geri
  beslemeden önce bir araç sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  eşzamansız çıktı azaltıcıları için güvenilir ve çalışma zamanından bağımsız
  bağlantıdır.

Plugin'ler hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin
`["openclaw", "codex"]`. Bu sözleşme olmadan veya açık etkinleştirme olmadan
kurulu Plugin'ler bu ara yazılımı kaydedemez; model öncesi araç sonucu
zamanlaması gerektirmeyen işler için normal OpenClaw Plugin hook'larını koruyun.
Eski yalnızca gömülü çalıştırıcı uzantı fabrikası kayıt yolu kaldırıldı.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir Plugin'in etkin Gateway'i
mDNS/Bonjour gibi yerel bir keşif taşıması üzerinde duyurmasına izin verir.
OpenClaw, yerel keşif etkinleştirildiğinde Gateway başlatması sırasında hizmeti
çağırır, geçerli Gateway bağlantı noktalarını ve gizli olmayan TXT ipucu
verilerini geçirir ve Gateway kapanışı sırasında döndürülen `stop`
işleyicisini çağırır.

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

Gateway keşif Plugin'leri duyurulan TXT değerlerini gizli bilgi veya kimlik
doğrulama olarak ele almamalıdır. Keşif bir yönlendirme ipucudur; Gateway kimlik
doğrulaması ve TLS sabitlemesi hâlâ güvene sahiptir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür komut meta verisi kabul eder:

- `commands`: kaydedicinin sahip olduğu açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve tembel Plugin CLI kaydı için
  kullanılan ayrıştırma zamanı komut tanımlayıcıları
- `parentPath`: iç içe komut grupları için isteğe bağlı üst komut yolu, örneğin
  `["nodes"]`

Eşleştirilmiş düğüm özellikleri için
`api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu,
`api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir sarmalayıcıdır
ve `openclaw nodes canvas` gibi komutları açıkça Plugin'e ait düğüm özellikleri
haline getirir.

Bir Plugin komutunun normal kök CLI yolunda tembel yüklenmiş kalmasını
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

`commands` değerini tek başına yalnızca tembel kök CLI kaydına ihtiyaç
duymadığınızda kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder,
ancak ayrıştırma zamanı tembel yükleme için tanımlayıcı destekli yer tutucular
kurmaz.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir Plugin'in `claude-cli` veya `my-cli` gibi
yerel bir AI CLI arka ucu için varsayılan yapılandırmaya sahip olmasına izin verir.

- Backend `id` değeri, `my-cli/gpt-5` gibi model referanslarında provider öneki olur.
- Backend `config`, `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'ı çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini Plugin varsayılanının üzerine birleştirir.
- Bir backend, birleştirmeden sonra uyumluluk yeniden yazımlarına ihtiyaç duyduğunda
  `normalizeConfig` kullanın (örneğin eski bayrak şekillerini normalize etmek için).
- CLI lehçesine ait istek kapsamlı argv yeniden yazımları için `resolveExecutionArgs`
  kullanın; örneğin OpenClaw düşünme düzeylerini yerel bir çaba
  bayrağına eşlemek için. Hook `ctx.executionMode` alır; geçici `/btw` çağrıları için
  backend'e özgü yerel izolasyon bayrakları eklemek üzere `"side-question"` kullanın.
  Bu bayraklar aksi halde her zaman açık olan bir CLI için yerel araçları güvenilir biçimde
  devre dışı bırakıyorsa, ayrıca `sideQuestionToolMode: "disabled"` bildirin.

Uçtan uca yazarlık kılavuzu için bkz.
[CLI backend Plugin'leri](/tr/plugins/cli-backend-plugins).

### Özel yuvalar

| Yöntem                                     | Ne kaydeder                                                                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). Yaşam döngüsü geri çağrıları, host model/provider/mod tanılamaları sağlayabildiğinde `runtimeSettings` alır; eski katı motorlar bu anahtar olmadan yeniden denenir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözümleyicisi                                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı adaptörü                                                                                                                                                                                              |

### Kullanımdan kaldırılmış bellek embedding adaptörleri

| Yöntem                                         | Ne kaydeder                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek embedding adaptörü |

- `registerMemoryCapability`, tercih edilen özel bellek-Plugin API'sidir.
- `registerMemoryCapability` ayrıca `publicArtifacts.listArtifacts(...)` sunabilir;
  böylece eşlik eden Plugin'ler, belirli bir bellek Plugin'inin özel düzenine erişmek yerine
  dışa aktarılan bellek yapıtlarını `openclaw/plugin-sdk/memory-host-core`
  üzerinden tüketebilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eskiyle uyumlu özel bellek-Plugin API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin fallback zincirini devralmadan
  `ollama/qwen3:8b` gibi kesin bir `provider/model` referansına sabitleyebilir.
- `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır. Yeni embedding provider'ları
  `api.registerEmbeddingProvider(...)` ve `contracts.embeddingProviders`
  kullanmalıdır.
- Mevcut belleğe özgü provider'lar geçiş penceresi boyunca çalışmaya devam eder,
  ancak Plugin incelemesi bunu paketlenmemiş Plugin'ler için uyumluluk borcu olarak bildirir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Tiplendirilmiş yaşam döngüsü hook'u |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı   |

Örnekler, yaygın hook adları ve guard semantiği için bkz.
[Plugin hook'ları](/tr/plugins/hooks).

### Hook karar semantiği

`before_install`, operatör kurulum ilkesi yüzeyi değil, bir Plugin çalışma zamanı
yaşam döngüsü hook'udur. Bir izin verme/engelleme kararının CLI ve Gateway destekli
kurulum ya da güncelleme yollarını kapsaması gerektiğinde `security.installPolicy`
kullanın.

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir handler bunu ayarladığında daha düşük öncelikli handler'lar atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` değerini atlamakla aynı), override olarak değil.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir handler bunu ayarladığında daha düşük öncelikli handler'lar atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` değerini atlamakla aynı), override olarak değil.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir handler gönderimi üstlendiğinde daha düşük öncelikli handler'lar ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir handler bunu ayarladığında daha düşük öncelikli handler'lar atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` değerini atlamakla aynı), override olarak değil.
- `message_received`: gelen thread/konu yönlendirmesine ihtiyaç duyduğunuzda tiplendirilmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ekler için saklayın.
- `message_sending`: kanala özgü `metadata` değerine düşmeden önce tiplendirilmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` hook'larına dayanmak yerine Gateway'e ait başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın; vade denetimleri ve yürütme için doğruluk kaynağı olarak OpenClaw'u koruyun.

### API nesne alanları

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                  |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                           |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                           |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcut olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içinden Plugin'e özgü yapılandırma                            |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                         |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                             |

## Dahili modül kuralı

Plugin'iniz içinde dahili import'lar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Üretim kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden import etmeyin. Dahili import'ları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketli Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzeri genel giriş dosyaları), OpenClaw zaten çalışıyorsa
etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı
anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına fallback yaparlar.
Paketlenmiş paketli Plugin facade'ları OpenClaw'un Plugin facade yükleyicileri üzerinden
yüklenmelidir; `dist/extensions/...` konumundan doğrudan import'lar, paketlenmiş
kurulumların Plugin'e ait kod için kullandığı manifest ve çalışma zamanı sidecar
denetimlerini atlar.

Provider Plugin'leri, bir yardımcı özellikle provider'a özgü olduğunda ve henüz
genel bir SDK alt yoluna ait olmadığında dar bir Plugin yerel sözleşme barrel'ı
sunabilir. Paketli örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` stream yardımcıları için genel
  `api.ts` / `contract-api.ts` yüzeyi.
- **`@openclaw/openai-provider`**: `api.ts`, provider oluşturucularını,
  varsayılan-model yardımcılarını ve gerçek zamanlı provider oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, provider oluşturucusunu
  ve onboarding/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu da `openclaw/plugin-sdk/<other-plugin>` import'larından
  kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine
  bağlamak yerine onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared`
  veya başka bir yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` ad alanı referansı.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/tr/plugins/sdk-setup">
    Paketleme, manifestler ve yapılandırma şemaları.
  </Card>
  <Card title="Testing" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcı programları ve lint kuralları.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/tr/plugins/architecture">
    Derin mimari ve yetenek modeli.
  </Card>
</CardGroup>
