---
read_when:
    - Hangi SDK alt yolundan içe aktarım yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma haritası, kayıt API başvurusu ve SDK mimarisi
title: Plugin SDK genel bakışı
x-i18n:
    generated_at: "2026-06-28T01:04:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, pluginler ile çekirdek arasındaki türlendirilmiş sözleşmedir. Bu sayfa,
**nelerin içe aktarılacağı** ve **nelerin kaydedilebileceği** için başvuru kaynağıdır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden ajan çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [Harici uygulamalar için Gateway entegrasyonları](/tr/gateway/external-apps) kullanın.
</Note>

<Tip>
Bunun yerine bir nasıl yapılır kılavuzu mu arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın; kanal pluginleri için [Kanal pluginleri](/tr/plugins/sdk-channel-plugins), sağlayıcı pluginleri için [Sağlayıcı pluginleri](/tr/plugins/sdk-provider-plugins), yerel AI CLI arka uçları için [CLI arka uç pluginleri](/tr/plugins/cli-backend-plugins) ve araç ya da yaşam döngüsü kancası pluginleri için [Plugin kancaları](/tr/plugins/hooks) sayfalarını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük ve kendi kendine yeten bir modüldür. Bu, başlangıcı hızlı tutar ve
döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme yardımcıları için
`openclaw/plugin-sdk/channel-core` kullanmayı tercih edin; daha geniş şemsiye yüzey
ve `buildChannelConfigSchema` gibi paylaşılan yardımcılar için
`openclaw/plugin-sdk/core` kullanın.

Kanal yapılandırması için, kanalın sahibi olduğu JSON Schema’yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın. `plugin-sdk/channel-config-schema`
alt yolu, paylaşılan şema temel öğeleri ve genel oluşturucu içindir. OpenClaw’ın
birlikte gelen pluginleri, korunmuş birlikte gelen kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde kalır;
birlikte gelen şema alt yollarının hiçbiri yeni pluginler için bir kalıp değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık yüzeylerini içe aktarmayın; örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`.
  Birlikte gelen pluginler, kendi `api.ts` / `runtime-api.ts` barrel dosyaları
  içinde genel SDK alt yollarını birleştirir; çekirdek tüketiciler ya bu plugin
  yerelindeki barrel dosyalarını kullanmalı ya da ihtiyaç gerçekten kanallar arası
  olduğunda dar bir genel SDK sözleşmesi eklemelidir.

Birlikte gelen plugin yardımcı yüzeylerinin küçük bir kümesi, izlenen sahip
kullanımı olduğunda oluşturulan export map içinde hâlâ görünür. Bunlar yalnızca
birlikte gelen plugin bakımı için vardır ve yeni üçüncü taraf pluginler için
önerilen içe aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account`, izlenen
sahip kullanımı için kullanımdan kaldırılmış uyumluluk facadeleri olarak da
tutulur. Bu içe aktarma yollarını yeni pluginlere kopyalamayın; bunun yerine
enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt yollarını
kullanın.
</Warning>

## Alt yol başvurusu

Plugin SDK; Plugin girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı,
yetenek, bellek ve ayrılmış birlikte gelen plugin yardımcılarına göre gruplanmış
dar alt yollar kümesi olarak sunulur. Gruplanmış ve bağlantılı tam katalog için
[Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfasına bakın.

Derleyici giriş noktası envanteri `scripts/lib/plugin-sdk-entrypoints.json`
içinde bulunur; paket dışa aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json`
içinde listelenen repo yerelindeki test/dahili alt yollar çıkarıldıktan sonra
genel alt kümeden oluşturulur. Genel dışa aktarım sayısını denetlemek için
`pnpm plugin-sdk:surface` çalıştırın. Yeterince eski olan ve birlikte gelen
uzantı üretim kodu tarafından kullanılmayan, kullanımdan kaldırılmış genel alt
yollar `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` içinde izlenir;
geniş kullanımdan kaldırılmış yeniden dışa aktarma barrel alt yolları
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` içinde izlenir.

## Kayıt API’si

`register(api)` geri çağrısı, şu yöntemlere sahip bir `OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği şey                         |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                   |
| `api.registerAgentHarness(...)`                  | Deneysel düşük seviyeli ajan yürütücüsü |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu             |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                      |
| `api.registerEmbeddingProvider(...)`             | Yeniden kullanılabilir vektör embedding sağlayıcısı |
| `api.registerSpeechProvider(...)`                | Metinden sese / STT sentezi            |
| `api.registerRealtimeTranscriptionProvider(...)` | Akışlı gerçek zamanlı transkripsiyon   |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi              |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                        |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                          |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                          |
| `api.registerWebFetchProvider(...)`              | Web getirme / scrape sağlayıcısı       |
| `api.registerWebSearchProvider(...)`             | Web araması                            |

`api.registerEmbeddingProvider(...)` ile kaydedilen embedding sağlayıcıları,
Plugin manifestosundaki `contracts.embeddingProviders` içinde de listelenmelidir.
Bu, yeniden kullanılabilir vektör üretimi için genel embedding yüzeyidir. Bellek
araması bu genel sağlayıcı yüzeyini tüketebilir. Daha eski
`api.registerMemoryEmbeddingProvider(...)` ve `contracts.memoryEmbeddingProviders`
yüzeyi, mevcut belleğe özgü sağlayıcılar taşınırken kullanımdan kaldırılmış
uyumluluk olarak kalır.

Hâlâ çalışma zamanında `batchEmbed(...)` sunan belleğe özgü sağlayıcılar,
çalışma zamanları açıkça `sourceWideBatchEmbed: true` ayarlamadığı sürece mevcut
dosya başına toplu iş sözleşmesinde kalır. Bu tercih, bellek ana makinesinin
birden çok kirli bellek dosyasından ve etkinleştirilmiş kaynaktan parçaları,
ana makine toplu iş sınırlarına kadar tek bir `batchEmbed(...)` çağrısında
göndermesine izin verir. JSONL istek dosyaları yükleyen toplu iş bağdaştırıcıları,
sağlayıcı işlerini hem yükleme boyutu sınırından hem de istek sayısı sınırından
önce bölmelidir. Sağlayıcı, her giriş parçası için `batch.chunks` ile aynı sırada
bir embedding döndürmelidir; sağlayıcı dosya yerelindeki toplu işleri bekliyorsa
veya daha büyük kaynak genelinde bir işte giriş sıralamasını koruyamıyorsa bayrağı
atlayın.

### Araçlar ve komutlar

Sabit araç adlarına sahip basit, yalnızca araç pluginleri için
[`defineToolPlugin`](/tr/plugins/tool-plugins) kullanın. Karma pluginler veya tamamen
dinamik araç kaydı için doğrudan `api.registerTool(...)` kullanın.

| Yöntem                         | Kaydettiği şey                              |
| ------------------------------ | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ajan aracı (zorunlu veya `{ optional: true }`) |
| `api.registerCommand(def)`     | Özel komut (LLM’yi atlar)                   |

Plugin komutları, ajan kısa ve komutun sahibi olduğu bir yönlendirme ipucuna
ihtiyaç duyduğunda `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisi
hakkında tutun; çekirdek prompt oluşturucularına sağlayıcıya veya plugine özgü
politika eklemeyin.

Yönlendirme girdileri, her prompt yüzeyine uygulanan eski dizeler veya
yapılandırılmış girdiler olabilir:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Yapılandırılmış `surfaces`, `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` veya `subagent` içerebilir. `pi_main`,
`openclaw_main` için kullanımdan kaldırılmış bir takma ad olarak kalır. Bilinçli
olarak tüm yüzeylere yönelik yönlendirme için `surfaces` değerini atlayın. Boş
bir `surfaces` dizisi geçirmeyin; kazara kapsam kaybı genel prompt metnine
dönüşmesin diye reddedilir.

Yerel Codex uygulama sunucusu geliştirici talimatları, diğer prompt yüzeylerinden
daha katıdır: yalnızca açıkça `codex_app_server` kapsamına alınmış yönlendirme,
daha yüksek öncelikli bu yola yükseltilir. Eski dize yönlendirmesi ve kapsamsız
yapılandırılmış yönlendirme, uyumluluk için Codex dışı prompt yüzeylerinde
kullanılabilir kalır.

### Altyapı

| Yöntem                                         | Kaydettiği şey                         |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Olay kancası                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP uç noktası                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC yöntemi                    |
| `api.registerGatewayDiscoveryService(service)` | Yerel Gateway keşif duyurucusu         |
| `api.registerCli(registrar, opts?)`            | CLI alt komutu                         |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` altında Node özellik CLI’si |
| `api.registerService(service)`                 | Arka plan hizmeti                      |
| `api.registerInteractiveHandler(registration)` | Etkileşimli işleyici                   |
| `api.registerAgentToolResultMiddleware(...)`   | Çalışma zamanı araç-sonucu ara katmanı |
| `api.registerMemoryPromptSupplement(builder)`  | Eklemeli belleğe bitişik prompt bölümü |
| `api.registerMemoryCorpusSupplement(adapter)`  | Eklemeli bellek arama/okuma corpus’u   |

### İş akışı pluginleri için ana makine kancaları

Ana makine kancaları, yalnızca bir sağlayıcı, kanal veya araç eklemek yerine ana
makine yaşam döngüsüne katılması gereken pluginler için SDK yüzeyleridir. Bunlar
genel sözleşmelerdir; Plan Mode bunları kullanabilir, ama onay iş akışları,
çalışma alanı politika kapıları, arka plan izleyicileri, kurulum sihirbazları
ve UI tamamlayıcı pluginleri de kullanabilir.

| Yöntem                                                                               | Sahip olduğu sözleşme                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway oturumları üzerinden yansıtılan, Plugin'e ait JSON uyumlu oturum durumu                                                   |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Bir oturum için sonraki agent turuna en fazla bir kez enjekte edilen dayanıklı bağlam                                              |
| `api.registerTrustedToolPolicy(...)`                                                 | Tool parametrelerini engelleyebilen veya yeniden yazabilen, manifest geçitli güvenilir pre-plugin tool politikası                 |
| `api.registerToolMetadata(...)`                                                      | Tool uygulamasını değiştirmeden tool kataloğu görüntüleme meta verileri                                                           |
| `api.registerCommand(...)`                                                           | Kapsamlı plugin komutları; komut sonuçları `continueAgent: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Oturum, tool, çalıştırma veya ayarlar yüzeyleri için Control UI katkı tanımlayıcıları                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Sıfırlama/silme/yeniden yükleme yollarında Plugin'e ait runtime kaynakları için cleanup callback'leri                             |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Workflow durumu ve izleyiciler için temizlenmiş event abonelikleri                                                                |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Terminal çalıştırma yaşam döngüsünde temizlenen, çalıştırma başına Plugin scratch durumu                                          |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin'e ait scheduler işleri için cleanup meta verileri; iş zamanlamaz veya görev kayıtları oluşturmaz                           |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Etkin doğrudan-giden oturum rotasına yalnızca bundled host aracılı dosya eki teslimi                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Yalnızca bundled Cron destekli zamanlanmış oturum turları ve tag tabanlı cleanup                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | İstemcilerin Gateway üzerinden dispatch edebileceği tipli oturum eylemleri                                                        |

Yeni plugin kodu için gruplanmış namespace'leri kullanın:

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

Eşdeğer düz yöntemler, mevcut plugin'ler için kullanımdan kaldırılmış uyumluluk
alias'ları olarak kullanılabilir kalır. Doğrudan
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` veya
`api.unscheduleSessionTurnsByTag` çağıran yeni plugin kodu eklemeyin.

`scheduleSessionTurn(...)`, Gateway Cron scheduler üzerinde oturum kapsamlı bir
kolaylıktır. Zamanlamanın sahibi Cron'dur ve tur çalıştığında arka plan görev
kaydını oluşturur; Plugin SDK yalnızca hedef oturumu, Plugin'e ait adlandırmayı
ve cleanup'ı kısıtlar. İşin kendisi dayanıklı çok adımlı Task Flow durumuna
ihtiyaç duyduğunda zamanlanmış tur içinde `api.runtime.tasks.managedFlows`
kullanın.

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici plugin'ler oturum uzantılarının, UI tanımlayıcılarının, komutların, tool
  meta verilerinin, sonraki tur enjeksiyonlarının ve normal hook'ların sahibi olabilir.
- Güvenilir tool politikaları sıradan `before_tool_call` hook'larından önce çalışır ve
  host tarafından güvenilirdir. Bundled politikalar önce çalışır; kurulu-plugin politikaları
  açık etkinleştirme ve `contracts.trustedToolPolicies` içinde kendi local id'lerini
  gerektirir ve ardından plugin yükleme sırasına göre çalışır. Politika id'leri
  kaydeden Plugin'e göre kapsamlanır.
- Ayrılmış komut sahipliği yalnızca bundled'dır. Harici plugin'ler kendi komut
  adlarını veya alias'larını kullanmalıdır.
- `allowPromptInjection=false`, `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, eski `before_agent_start` içinden prompt alanları ve
  `enqueueNextTurnInjection` dahil prompt'u değiştiren hook'ları devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi              | Kullanılan hook'lar                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Onay workflow'u              | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, UI tanımlayıcısı                                                            |
| Bütçe/çalışma alanı politika geçidi | Güvenilir tool politikası, tool meta verileri, oturum projeksiyonu                                                                 |
| Arka plan yaşam döngüsü izleyicisi | Runtime yaşam döngüsü cleanup'ı, agent event aboneliği, oturum scheduler sahipliği/cleanup'ı, Heartbeat prompt katkısı, UI tanımlayıcısı |
| Kurulum veya onboarding sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                              |

<Note>
  Ayrılmış çekirdek admin namespace'leri (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir plugin daha dar bir gateway yöntem kapsamı atamaya çalışsa bile
  her zaman `operator.admin` olarak kalır. Plugin'e ait yöntemler için plugin'e özgü
  prefix'leri tercih edin.
</Note>

<Accordion title="Tool-result middleware ne zaman kullanılır">
  Bundled plugin'ler ve eşleşen manifest sözleşmeleriyle açıkça etkinleştirilmiş
  kurulu plugin'ler, yürütmeden sonra ve runtime bu sonucu modele geri beslemeden
  önce bir tool sonucunu yeniden yazmaları gerektiğinde
  `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu, tokenjuice gibi
  async çıktı azaltıcıları için güvenilir runtime nötr yüzeydir.

Plugin'ler hedeflenen her runtime için `contracts.agentToolResultMiddleware`
bildirmelidir, örneğin `["openclaw", "codex"]`. Bu sözleşme olmayan veya açık
etkinleştirmesi bulunmayan kurulu plugin'ler bu middleware'i kaydedemez; model öncesi
tool-result zamanlamasına ihtiyaç duymayan işler için normal OpenClaw plugin hook'larını
koruyun. Eski yalnızca embedded-runner uzantı fabrikası kayıt yolu kaldırılmıştır.
</Accordion>

### Gateway discovery kaydı

`api.registerGatewayDiscoveryService(...)`, bir plugin'in etkin Gateway'i
mDNS/Bonjour gibi bir local discovery transport üzerinde duyurmasına olanak tanır.
OpenClaw, local discovery etkin olduğunda Gateway başlatması sırasında servisi çağırır,
geçerli Gateway portlarını ve gizli olmayan TXT ipucu verilerini iletir ve Gateway
kapanışı sırasında döndürülen `stop` handler'ını çağırır.

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

Gateway discovery plugin'leri duyurulan TXT değerlerini secret veya kimlik doğrulama
olarak ele almamalıdır. Discovery bir yönlendirme ipucudur; güvenin sahibi hâlâ
Gateway auth ve TLS pinning'dir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür komut meta verisi kabul eder:

- `commands`: registrar'ın sahip olduğu açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve lazy plugin CLI kaydı için kullanılan
  parse-time komut tanımlayıcıları
- `parentPath`: `["nodes"]` gibi iç içe komut grupları için isteğe bağlı üst komut yolu

Eşleştirilmiş-node özellikleri için
`api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu,
`api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir wrapper'dır ve
`openclaw nodes canvas` gibi komutları açıkça Plugin'e ait node özellikleri haline getirir.

Bir plugin komutunun normal root CLI yolunda lazy-loaded kalmasını istiyorsanız, o
registrar tarafından açığa çıkarılan her üst düzey komut root'unu kapsayan
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

`commands` tek başına yalnızca lazy root CLI kaydına ihtiyacınız olmadığında kullanın.
Bu eager uyumluluk yolu desteklenmeye devam eder, ancak parse-time lazy loading için
descriptor destekli placeholder'lar kurmaz.

### CLI backend kaydı

`api.registerCliBackend(...)`, bir plugin'in `claude-cli` veya `my-cli` gibi local
AI CLI backend'i için varsayılan config'in sahibi olmasına olanak tanır.

- Backend `id`'si `my-cli/gpt-5` gibi model ref'lerinde provider prefix'i olur.
- Backend `config`'i `agents.defaults.cliBackends.<id>` ile aynı şekli kullanır.
- Kullanıcı config'i yine kazanır. OpenClaw, CLI'ı çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini plugin varsayılanı üzerine birleştirir.
- Bir backend merge sonrasında uyumluluk yeniden yazımlarına ihtiyaç duyduğunda
  (örneğin eski flag şekillerini normalleştirme) `normalizeConfig` kullanın.
- CLI lehçesine ait request-scoped argv yeniden yazımları için `resolveExecutionArgs`
  kullanın; örneğin OpenClaw thinking düzeylerini yerel effort flag'ine eşlemek.
  Hook `ctx.executionMode` alır; geçici `/btw` çağrıları için backend-native izolasyon
  flag'leri eklemek üzere `"side-question"` kullanın. Bu flag'ler aksi halde her zaman
  açık olan bir CLI için yerel tool'ları güvenilir biçimde devre dışı bırakıyorsa,
  ayrıca `sideQuestionToolMode: "disabled"` bildirin.

Uçtan uca yazarlık kılavuzu için bkz.
[CLI backend plugin'leri](/tr/plugins/cli-backend-plugins).

### Özel slotlar

| Yöntem                                     | Ne kaydeder                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda bir etkin). Yaşam döngüsü geri çağrıları, ana makine model/sağlayıcı/mod tanılamalarını sağlayabildiğinde `runtimeSettings` alır; eski katı motorlar bu anahtar olmadan yeniden denenir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Bellek istem bölümü oluşturucusu                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözümleyicisi                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                                                                             |

### Kullanımdan kaldırılmış bellek gömme bağdaştırıcıları

| Yöntem                                         | Ne kaydeder                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin Plugin için bellek gömme bağdaştırıcısı |

- `registerMemoryCapability` tercih edilen özel bellek Plugin API'sidir.
- `registerMemoryCapability`, tamamlayıcı Plugin'lerin dışa aktarılan bellek yapıtlarını belirli bir
  bellek Plugin'inin özel düzenine erişmek yerine
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için `publicArtifacts.listArtifacts(...)`
  öğesini de açığa çıkarabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime` eskiyle uyumlu özel bellek Plugin API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin yedek zinciri devralmadan
  `ollama/qwen3:8b` gibi tam bir `provider/model`
  başvurusuna sabitleyebilir.
- `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır. Yeni gömme sağlayıcıları
  `api.registerEmbeddingProvider(...)` ve
  `contracts.embeddingProviders` kullanmalıdır.
- Mevcut belleğe özel sağlayıcılar geçiş penceresi sırasında çalışmaya devam eder,
  ancak Plugin incelemesi bunu paketle birlikte gelmeyen Plugin'ler için
  uyumluluk borcu olarak raporlar.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Ne yapar                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Tipli yaşam döngüsü kancası          |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağrısı |

Örnekler, yaygın kanca adları ve koruma semantiği için [Plugin kancaları](/tr/plugins/hooks)
bölümüne bakın.

### Kanca karar semantiği

`before_install`, operatör kurulum ilkesi yüzeyi değil, bir Plugin çalışma zamanı yaşam döngüsü kancasıdır.
İzin/engelleme kararı CLI ve Gateway destekli kurulum veya güncelleme yollarını kapsamalıysa
`security.installPolicy` kullanın.

- `before_tool_call`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `before_install`: `{ block: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek karar yok olarak değerlendirilir (`block` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `reply_dispatch`: `{ handled: true, ... }` döndürmek terminaldir. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek terminaldir. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek karar yok olarak değerlendirilir (`cancel` öğesini atlamakla aynıdır), geçersiz kılma değildir.
- `message_received`: gelen iş parçacığı/konu yönlendirmesine ihtiyacınız olduğunda tipli `threadId` alanını kullanın. `metadata` öğesini kanala özel ekler için saklayın.
- `message_sending`: kanala özel `metadata` öğesine geri düşmeden önce tipli `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway'e ait başlatma durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın.
- `cron_changed`: Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemleyin. Harici uyandırma zamanlayıcılarını eşitlerken `event.job?.state?.nextRunAtMs` ve `ctx.getCron?.()` kullanın; vade kontrolleri ve yürütme için doğruluk kaynağı olarak OpenClaw'u koruyun.

### API nesnesi alanları

| Alan                    | Tür                      | Açıklama                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                                   |
| `api.name`               | `string`                  | Görünen ad                                                                                |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                   |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                               |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (varsa etkin bellek içi çalışma zamanı anlık görüntüsü)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` öğesinden Plugin'e özel yapılandırma                                   |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"` hafif tam giriş öncesi başlatma/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Plugin köküne göre yolu çözümle                                                        |

## Dahili modül kuralı

Plugin'inizde, dahili içe aktarmalar için yerel barrel dosyaları kullanın:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Üretim kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarmaları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Facade ile yüklenen paketle gelen Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları), OpenClaw zaten çalışıyorsa
etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz çalışma zamanı
anlık görüntüsü yoksa, diskteki çözümlenmiş yapılandırma dosyasına geri düşerler.
Paketlenmiş paketle gelen Plugin facade'ları OpenClaw'un Plugin
facade yükleyicileri üzerinden yüklenmelidir; `dist/extensions/...` üzerinden doğrudan
içe aktarmalar, paketlenmiş kurulumların Plugin'e ait kod için kullandığı manifesti
ve çalışma zamanı yan dosya denetimlerini atlar.

Sağlayıcı Plugin'leri, bir yardımcı bilerek sağlayıcıya özgüyse ve henüz genel bir SDK
alt yoluna ait değilse dar bir Plugin yerel sözleşme barrel'ı açığa çıkarabilir.
Paketle gelen örnekler:

- **Anthropic**: Claude beta-header ve `service_tier` akış yardımcıları için genel `api.ts` / `contract-api.ts` bağlantısı.
- **`@openclaw/openai-provider`**: `api.ts` sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts` sağlayıcı oluşturucusunu
  ve işe başlatma/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Extension üretim kodu da `openclaw/plugin-sdk/<other-plugin>`
  içe aktarmalarından kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa, iki Plugin'i birbirine bağlamak yerine
  onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka
  yetenek odaklı yüzey gibi tarafsız bir SDK alt yoluna yükseltin.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/tr/plugins/sdk-entrypoints">
    `definePluginEntry` ve `defineChannelPluginEntry` seçenekleri.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/tr/plugins/sdk-runtime">
    Tam `api.runtime` ad alanı başvurusu.
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
