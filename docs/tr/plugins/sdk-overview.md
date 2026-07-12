---
read_when:
    - Hangi SDK alt yolundan içe aktarma yapmanız gerektiğini bilmeniz gerekir
    - OpenClawPluginApi üzerindeki tüm kayıt yöntemleri için bir başvuru kaynağı istiyorsunuz
    - Belirli bir SDK dışa aktarımını arıyorsunuz
sidebarTitle: Plugin SDK overview
summary: İçe aktarma eşlemesi, kayıt API'si referansı ve SDK mimarisi
title: Plugin SDK'ya genel bakış
x-i18n:
    generated_at: "2026-07-12T12:39:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, Plugin’ler ile çekirdek arasındaki tür güvenli sözleşmedir. Bu sayfa,
**nelerin içe aktarılacağı** ve **nelerin kaydedilebileceği** konusunda başvuru kaynağıdır.

<Note>
  Bu sayfa, OpenClaw içinde `openclaw/plugin-sdk/*` kullanan Plugin yazarları
  içindir. Gateway üzerinden ajan çalıştırmak isteyen harici uygulamalar,
  betikler, panolar, CI işleri ve IDE uzantıları için bunun yerine
  [harici uygulamalara yönelik Gateway entegrasyonlarını](/tr/gateway/external-apps) kullanın.
</Note>

<Tip>
Bunun yerine bir uygulama kılavuzu mu arıyorsunuz? [Plugin oluşturma](/tr/plugins/building-plugins) ile başlayın. Kanallar için [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins), model sağlayıcıları için [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins), yerel yapay zekâ CLI arka uçları için [CLI arka uç Plugin’leri](/tr/plugins/cli-backend-plugins), yerel ajan yürütücüleri için [Ajan çalışma düzeneği Plugin’leri](/tr/plugins/sdk-agent-harness) ve araç ya da yaşam döngüsü kancaları için [Plugin kancaları](/tr/plugins/hooks) sayfasını kullanın.
</Tip>

## İçe aktarma kuralı

Her zaman belirli bir alt yoldan içe aktarın:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Her alt yol küçük ve kendi kendine yeterli bir modüldür. Bu, başlangıcı hızlı
tutar ve döngüsel bağımlılık sorunlarını önler. Kanala özgü giriş/derleme
yardımcıları için `openclaw/plugin-sdk/channel-core` yolunu tercih edin;
`openclaw/plugin-sdk/core` yolunu daha geniş şemsiye yüzey ve
`buildChannelConfigSchema` gibi paylaşılan yardımcılar için kullanın.

Kanal yapılandırması için kanala ait JSON Schema’yı
`openclaw.plugin.json#channelConfigs` üzerinden yayımlayın.
`plugin-sdk/channel-config-schema` alt yolu, paylaşılan şema temel öğeleri ve
genel oluşturucu içindir. OpenClaw’ın paketle birlikte gelen Plugin’leri,
korunan paketle birlikte gelen kanal şemaları için
`plugin-sdk/bundled-channel-config-schema` kullanır. Kullanımdan kaldırılmış
uyumluluk dışa aktarımları `plugin-sdk/channel-config-schema-legacy` üzerinde
kalmaya devam eder; paketle birlikte gelen şema alt yollarının hiçbiri yeni
Plugin’ler için örnek değildir.

<Warning>
  Sağlayıcı veya kanal markalı kolaylık yüzeylerinden (örneğin
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)
  içe aktarma yapmayın. Paketle birlikte gelen Plugin’ler, genel SDK alt
  yollarını kendi `api.ts` / `runtime-api.ts` varilleri içinde birleştirir;
  çekirdek tüketicileri ya bu Plugin’e özgü varilleri kullanmalı ya da ihtiyaç
  gerçekten kanallar arası olduğunda dar kapsamlı, genel bir SDK sözleşmesi
  eklemelidir.

Sahip kullanımı izlenen, paketle birlikte gelen Plugin yardımcı yüzeylerinden
küçük bir küme, oluşturulan dışa aktarma eşlemesinde hâlâ görünür. Bunlar yalnızca
paketle birlikte gelen Plugin’lerin bakımı için mevcuttur ve yeni üçüncü taraf
Plugin’ler için önerilen içe aktarma yolları değildir.

`openclaw/plugin-sdk/discord` ve `openclaw/plugin-sdk/telegram-account` da
izlenen sahip kullanımı için kullanımdan kaldırılmış uyumluluk cepheleri olarak
korunmaktadır. Bu içe aktarma yollarını yeni Plugin’lere kopyalamayın; bunun
yerine enjekte edilen çalışma zamanı yardımcılarını ve genel kanal SDK alt
yollarını kullanın.
</Warning>

## Alt yol başvurusu

Plugin SDK; Plugin girişi, kanal, sağlayıcı, kimlik doğrulama, çalışma zamanı,
yetenek, bellek ve paketle birlikte gelen Plugin’lere ayrılmış yardımcılar
şeklinde alanlara göre gruplanmış dar kapsamlı alt yollar kümesi olarak sunulur.
Gruplanmış ve bağlantılı tam katalog için
[Plugin SDK alt yollarına](/tr/plugins/sdk-subpaths) bakın.

Derleyici giriş noktası envanteri
`scripts/lib/plugin-sdk-entrypoints.json` dosyasında bulunur; paket dışa
aktarımları, `scripts/lib/plugin-sdk-private-local-only-subpaths.json`
dosyasında listelenen depoya özgü test/dahili alt yollar çıkarıldıktan sonra
herkese açık alt kümeden oluşturulur. Herkese açık dışa aktarma sayısını
denetlemek için `pnpm plugin-sdk:surface` komutunu çalıştırın. Yeterince eski
olan ve paketle birlikte gelen uzantıların üretim kodu tarafından kullanılmayan,
kullanımdan kaldırılmış herkese açık alt yollar
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` dosyasında; geniş
kapsamlı, kullanımdan kaldırılmış yeniden dışa aktarma varilleri ise
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` dosyasında izlenir.

## Kayıt API’si

`register(api)` geri çağrısı, aşağıdaki yöntemlere sahip bir
`OpenClawPluginApi` nesnesi alır:

### Yetenek kaydı

| Yöntem                                           | Kaydettiği öğe                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Metin çıkarımı (LLM)                                                              |
| `api.registerWorkerProvider(...)`                | Bulut çalışanı yaşam döngüsü kiralamaları                                         |
| `api.registerModelCatalogProvider(...)`          | Metin ve medya üretimi için model kataloğu satırları                              |
| `api.registerAgentHarness(...)`                  | [Deneysel](/tr/plugins/sdk-agent-harness) yerel ajan yürütücüsü (Codex, Copilot)      |
| `api.registerCliBackend(...)`                    | Yerel CLI çıkarım arka ucu                                                        |
| `api.registerChannel(...)`                       | Mesajlaşma kanalı                                                                 |
| `api.registerEmbeddingProvider(...)`             | Yeniden kullanılabilir vektör gömme sağlayıcısı                                   |
| `api.registerSpeechProvider(...)`                | Metinden konuşmaya / STT sentezi                                                  |
| `api.registerRealtimeTranscriptionProvider(...)` | Akış hâlinde gerçek zamanlı yazıya döküm                                          |
| `api.registerRealtimeVoiceProvider(...)`         | Çift yönlü gerçek zamanlı ses oturumları                                          |
| `api.registerMediaUnderstandingProvider(...)`    | Görüntü/ses/video analizi                                                         |
| `api.registerTranscriptSourceProvider(...)`      | Canlı veya içe aktarılmış toplantı dökümü kaynağı                                 |
| `api.registerImageGenerationProvider(...)`       | Görüntü üretimi                                                                   |
| `api.registerMusicGenerationProvider(...)`       | Müzik üretimi                                                                     |
| `api.registerVideoGenerationProvider(...)`       | Video üretimi                                                                     |
| `api.registerWebFetchProvider(...)`              | Web getirme / kazıma sağlayıcısı                                                  |
| `api.registerWebSearchProvider(...)`             | Web araması                                                                       |
| `api.registerCompactionProvider(...)`            | Takılıp çıkarılabilir döküm Compaction arka ucu                                   |

Çalışan sağlayıcıları ayrıca kimliklerini `contracts.workerProviders` içinde bildirmelidir.
Çekirdek, `provision(profile, operationId)` çağrısından önce kalıcı niyeti saklar. Sağlayıcılar, harici kaynak tahsisinden önce ayarları doğrular ve kalıcı profil reddi durumunda `WorkerProviderError` fırlatır. İşlem kimliği tekrarlandığında `provision` aynı kiralamayı benimsemelidir.
Çekirdek, doğrulanmış profil ayarlarını kiralamayla birlikte saklar ve bu anlık görüntüyü eşgüçlü olması gereken `destroy({ leaseId, profile })` ile `active`, `destroyed` veya `unknown` döndüren `inspect({ leaseId, profile })` çağrılarına sağlar. Bu, sağlayıcıların bir Gateway yeniden başlatmasından veya adlandırılmış profil kaldırıldıktan sonra yaşam döngüsü çağrılarını yönlendirebilmesini sağlar. SSH uç noktaları `keyRef` için satır içi anahtar malzemesi yerine bir `SecretRef` kullanır ve güvenilir hazırlama çıktısından, ana bilgisayar adı veya yorum olmadan tam olarak `algorithm base64` biçiminde bir `hostKey` içerir. Çekirdek `hostKey` değerini sabitler ve ilk bağlantıdan gelen bir anahtara asla güvenmez. Dinamik bir `keyRef` oluşturan sağlayıcı `resolveSshIdentity({ leaseId, profile, keyRef })` uygulayabilir; mevcut olduğunda bu çözümleyici belirleyicidir, buna sahip olmayan sağlayıcılar ise yapılandırılmış genel gizli bilgi çözümleyicisini kullanır.
Yenilenebilir kiralamalara sahip sağlayıcılar ayrıca `renew(leaseId)` uygulayabilir.
`inspect`, geçici veya belirsiz hatalarda istisna fırlatmalıdır; yalnızca yetkili biçimde yokluk doğrulandığında `unknown` döndürmelidir. Çekirdek, etkin bir yerel kaydı yetim olarak işaretler veya kalıcı bir yok etme isteğinden sonra yokluğu sökümün tamamlanması olarak değerlendirir.

`api.registerEmbeddingProvider(...)` ile kaydedilen gömme sağlayıcıları, Plugin
manifestindeki `contracts.embeddingProviders` içinde de listelenmelidir. Bu,
yeniden kullanılabilir vektör üretimine yönelik genel gömme yüzeyidir. Bellek
araması bu genel sağlayıcı yüzeyini kullanabilir. Eski
`api.registerMemoryEmbeddingProvider(...)` ve
`contracts.memoryEmbeddingProviders` yüzeyi, mevcut belleğe özgü sağlayıcılar
taşınırken kullanımdan kaldırılmış uyumluluk olarak kalır.

Hâlâ çalışma zamanında `batchEmbed(...)` sunan belleğe özgü sağlayıcılar,
çalışma zamanları açıkça `sourceWideBatchEmbed: true` ayarlamadıkça mevcut dosya
başına toplu işleme sözleşmesinde kalır. Bu isteğe bağlı özellik, bellek ana
makinesinin birden çok kirli bellek dosyasından ve etkin kaynaktan gelen
parçaları, ana makinenin toplu iş sınırlarına kadar tek bir `batchEmbed(...)`
çağrısında göndermesine olanak tanır. JSONL istek dosyaları yükleyen toplu iş
bağdaştırıcıları, sağlayıcı işlerini istek sayısı sınırının yanı sıra yükleme
boyutu üst sınırından önce de bölmelidir. Sağlayıcı, her giriş parçası için
`batch.chunks` ile aynı sırada bir gömme döndürmelidir; sağlayıcı dosya yerelinde
toplu işler bekliyorsa veya daha büyük ve kaynak genelindeki bir işte giriş
sırasını koruyamıyorsa bayrağı kullanmayın.

### Araçlar ve komutlar

Sabit araç adlarına sahip, yalnızca araç içeren basit Plugin’ler için
[`defineToolPlugin`](/tr/plugins/tool-plugins) kullanın. Karma Plugin’ler veya
tamamen dinamik araç kaydı için doğrudan `api.registerTool(...)` kullanın.

| Yöntem                                 | Kaydettiği öğe                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Ajan aracı (zorunlu veya `{ optional: true }`)                                                                                                 |
| `api.registerCommand(def)`             | Özel komut (LLM’yi atlar)                                                                                                                      |
| `api.registerNodeHostCommand(command)` | `openclaw node run` tarafından işlenen komut; isteğe bağlı `agentTool` meta verileri, Node bağlıyken bunu ajanın görebildiği bir araç olarak sunabilir |

Ajanın, komuta ait kısa bir yönlendirme ipucuna ihtiyacı olduğunda Plugin
komutları `agentPromptGuidance` ayarlayabilir. Bu metni komutun kendisiyle ilgili
tutun; çekirdek istem oluşturucularına sağlayıcıya veya Plugin’e özgü politika
eklemeyin.

Yönlendirme girdileri, her istem yüzeyine uygulanan eski dizeler veya
yapılandırılmış girdiler olabilir:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Yapılandırılmış `surfaces`; `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` veya `subagent` içerebilir. `pi_main`,
`openclaw_main` için kullanımdan kaldırılmış bir takma ad olarak kalır. Bilinçli
olarak tüm yüzeylere yönelik yönlendirme için `surfaces` değerini kullanmayın.
Boş bir `surfaces` dizisi geçirmeyin; yanlışlıkla kapsam kaybının genel istem
metnine dönüşmemesi için bu reddedilir.

Yerel Codex uygulama sunucusu geliştirici talimatları diğer istem yüzeylerinden
daha katıdır: yalnızca açıkça `codex_app_server` kapsamına alınmış yönlendirme,
daha yüksek öncelikli kulvara yükseltilir. Eski dize yönlendirmeleri ve kapsamı
belirtilmemiş yapılandırılmış yönlendirmeler, uyumluluk için Codex dışı istem
yüzeylerinde kullanılabilir olmaya devam eder.

Node ana makinesi komutları Gateway işlemi içinde değil, bağlı Node ana makinesinde çalışır. `agentTool` mevcutsa Node, başarılı bir Gateway bağlantısından sonra bir tanımlayıcı yayımlar; Gateway bunu yalnızca söz konusu Node bağlıyken ve tanımlayıcının `command` değeri Node'un onaylanmış komut yüzeyinde yer alıyorsa ajan çalıştırmalarına sunar. Tehlikeli olmayan bir komutu varsayılan Node komut izin listesine dahil etmek için `agentTool.defaultPlatforms` değerini ayarlayın; aksi takdirde açık bir `gateway.nodes.allowCommands` veya Node çağırma ilkesi gerekir. `agentTool.name` sağlayıcı açısından güvenli olmalıdır: bir harfle başlamalı, yalnızca harf, rakam, alt çizgi veya kısa çizgi kullanmalı ve en fazla 64 karakter olmalıdır. MCP destekli Node araçları, katalog ve araç arama yüzeylerinin uzak MCP sunucusu/araç kimliğini gösterebilmesi için `agentTool.mcp` meta verilerini ayarlayabilir; ancak yürütme yine duyurulan Node komutu üzerinden gerçekleşir.

### Altyapı

| Yöntem                                          | Kaydettiği öğe                                                |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | Olay kancası                                                  |
| `api.registerHttpRoute(params)`                 | Gateway HTTP uç noktası                                       |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC yöntemi                                           |
| `api.registerGatewayDiscoveryService(service)`  | Yerel Gateway keşif duyurucusu                                |
| `api.registerCli(registrar, opts?)`             | CLI alt komutu                                                |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` altındaki Node özelliği CLI'si               |
| `api.registerService(service)`                  | Arka plan hizmeti                                             |
| `api.registerInteractiveHandler(registration)`  | Etkileşimli işleyici                                          |
| `api.registerAgentToolResultMiddleware(...)`    | Çalışma zamanı araç sonucu ara katmanı                         |
| `api.registerMemoryPromptSupplement(builder)`   | Ek bellek bağlantılı istem bölümü                             |
| `api.registerMemoryCorpusSupplement(adapter)`   | Ek bellek arama/okuma derlemi                                 |
| `api.registerHostedMediaResolver(resolver)`     | Tarayıcı tarzı barındırılan medya URL'leri için çözümleyici   |
| `api.registerTextTransforms(transforms)`        | Plugin tarafından yönetilen istem/ileti uyumluluk metni yeniden yazımları |
| `api.registerConfigMigration(migrate)`          | Plugin çalışma zamanı yüklenmeden önce çalışan hafif yapılandırma geçişi |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` için içe aktarıcı                          |
| `api.registerAutoEnableProbe(probe)`            | Bu Plugin'i otomatik etkinleştirebilen yapılandırma yoklaması |
| `api.registerReload(registration)`              | Yeniden yükleme işlemi için yeniden başlatma/anında yeniden yükleme/işlemsiz yapılandırma öneki ilkesi |
| `api.registerNodeHostCommand(command)`          | Eşleştirilmiş Node'lara sunulan komut işleyici                |
| `api.registerNodeInvokePolicy(policy)`          | Node tarafından çağrılan komutlar için izin listesi/onay ilkesi |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` için bulgu toplayıcı                |

Bellek istemi ek oluşturucuları isteğe bağlı `agentId`, `agentSessionKey` ve `sandboxed` bağlamını alır. Bellek derlemi eki `search` ve `get` çağrıları isteğe bağlı `agentId` ve `sandboxed` bağlamını alır. Ajan tarafından yönetilen depolamaya sahip Plugin'ler, kayıt sırasında tek bir genel yolu yakalamak yerine her çağrı için bu depolamayı çözümlemelidir. Çok ajanlı bir işlemde ajan kimliği gerekliyse ancak eksikse, rastgele bir ajan seçmek yerine kapalı durumda başarısız olun.

Telegram etkileşimli işleyicileri, işleyici başarılı olduktan sonra metni Telegram'ın normal gelen ajan yolu üzerinden yönlendirmek için `{ submitText }` döndürebilir. Gelen ilkesi metni atladığında veya işleme başarısız olduğunda OpenClaw geri çağırma düğmesini korur; böylece kullanıcı engelleyici koşul değiştikten sonra yeniden deneyebilir. Bu sonuç alanı Telegram'a özeldir; diğer kanallar kendi etkileşimli sonuç sözleşmelerini korur.

### İş akışı Plugin'leri için ana makine kancaları

Ana makine kancaları, yalnızca sağlayıcı, kanal veya araç eklemek yerine ana makine yaşam döngüsüne katılması gereken Plugin'ler için SDK bağlantı noktalarıdır. Bunlar genel sözleşmelerdir; Plan Modu bunları kullanabilir, ancak onay iş akışları, çalışma alanı ilkesi geçitleri, arka plan izleyicileri, kurulum sihirbazları ve kullanıcı arayüzü eşlikçi Plugin'leri de kullanabilir.

| Yöntem                                                                               | Yönettiği sözleşme                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway oturumları üzerinden yansıtılan, Plugin tarafından yönetilen ve JSON ile uyumlu oturum durumu                                                      |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Bir oturumun sonraki ajan turuna eklenen kalıcı, tam olarak bir kez kullanılan bağlam                                                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | Araç parametrelerini engelleyebilen veya yeniden yazabilen, manifest geçitli ve Plugin öncesi güvenilir araç ilkesi                                         |
| `api.registerToolMetadata(...)`                                                      | Araç uygulamasını değiştirmeden araç kataloğu görüntüleme meta verileri                                                                                     |
| `api.registerCommand(...)`                                                           | Kapsamlı Plugin komutları; komut sonuçları `continueAgent: true` veya `suppressReply: true` ayarlayabilir; Discord yerel komutları `descriptionLocalizations` destekler |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Oturum, araç, çalıştırma, ayarlar veya sekme yüzeyleri için Control UI katkı tanımlayıcıları                                                                 |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Sıfırlama/silme/yeniden yükleme yollarında Plugin tarafından yönetilen çalışma zamanı kaynakları için temizleme geri çağrıları                              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | İş akışı durumu ve izleyiciler için arındırılmış olay abonelikleri                                                                                           |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Sonlandırıcı çalıştırma yaşam döngüsünde temizlenen, çalıştırma başına Plugin geçici durumu                                                                  |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin tarafından yönetilen zamanlayıcı işleri için temizleme meta verileri; işi zamanlamaz veya görev kayıtları oluşturmaz                                 |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Etkin doğrudan giden oturum yoluna, yalnızca paketlenmiş Plugin'ler için ana makine aracılı dosya eki teslimi                                                |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Yalnızca paketlenmiş Plugin'ler için Cron destekli zamanlanmış oturum turları ve etiket tabanlı temizleme                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | İstemcilerin Gateway üzerinden gönderebildiği türü belirlenmiş oturum eylemleri                                                                              |

Bir `surface: "tab"` tanımlayıcısı Control UI'ye bir kenar çubuğu sekmesi ekler. Etkin Plugin'lerin sekme tanımlayıcıları, Gateway karşılama iletisinde (`controlUiTabs`) pano istemcilerine duyurulur; böylece sekme yalnızca Plugin etkin olduğu sürece görünür. Paketlenmiş Plugin'ler sekmeleri için birinci sınıf bir pano görünümü sunabilir; diğer Plugin'ler `path` değerini, panonun korumalı bir çerçevede işlediği bir Plugin HTTP rotasına (bkz. `api.registerHttpRoute(...)`) ayarlayabilir. `icon` bir pano simgesi adı ipucudur, `group` kenar çubuğu bölümünü (`control` veya `agent`) seçer, `order` Plugin sekmelerini sıralar ve `requiredScopes`, bu operatör kapsamlarına sahip olmayan bağlantılarda sekmeyi gizler:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Yeni Plugin kodu için gruplandırılmış ad alanlarını kullanın:

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

Eşdeğer düz yöntemler, mevcut Plugin'ler için kullanımdan kaldırılmış uyumluluk takma adları olarak kullanılmaya devam eder. Doğrudan `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` veya `api.unscheduleSessionTurnsByTag` çağıran yeni Plugin kodu eklemeyin.

`scheduleSessionTurn(...)`, Gateway Cron zamanlayıcısı üzerinde oturum kapsamlı bir kolaylık katmanıdır. Cron zamanlamayı yönetir ve tur çalıştığında arka plan görev kaydını oluşturur; Plugin SDK yalnızca hedef oturumu, Plugin tarafından yönetilen adlandırmayı ve temizlemeyi sınırlar. İşin kendisi kalıcı, çok adımlı Task Flow durumu gerektiriyorsa zamanlanmış turun içinde `api.runtime.tasks.managedFlows` kullanın.

Sözleşmeler yetkiyi bilinçli olarak ayırır:

- Harici Plugin'ler oturum uzantılarını, kullanıcı arayüzü tanımlayıcılarını, komutları, araç meta verilerini, sonraki tur eklemelerini ve normal kancaları yönetebilir.
- Güvenilir araç ilkeleri sıradan `before_tool_call` kancalarından önce çalışır ve ana makine tarafından güvenilir kabul edilir. Paketlenmiş ilkeler önce çalışır; kurulu Plugin ilkeleri açık etkinleştirme ve `contracts.trustedToolPolicies` içindeki yerel kimliklerini gerektirir ve ardından Plugin yükleme sırasına göre çalışır. İlke kimlikleri, kaydeden Plugin'in kapsamındadır.
- Ayrılmış komutların sahipliği yalnızca paketlenmiş Plugin'lere aittir. Harici Plugin'ler kendi komut adlarını veya takma adlarını kullanmalıdır.
- `allowPromptInjection=false`; `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, eski `before_agent_start` içindeki istem alanları ve `enqueueNextTurnInjection` dahil olmak üzere istemi değiştiren kancaları devre dışı bırakır.

Plan dışı tüketici örnekleri:

| Plugin arketipi                | Kullanılan kancalar                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onay iş akışı                  | Oturum uzantısı, komut devamı, sonraki tur enjeksiyonu, kullanıcı arayüzü tanımlayıcısı                                                           |
| Bütçe/çalışma alanı ilke kapısı | Güvenilir araç ilkesi, araç meta verileri, oturum izdüşümü                                                                                        |
| Arka plan yaşam döngüsü izleyicisi | Çalışma zamanı yaşam döngüsü temizliği, aracı olay aboneliği, oturum zamanlayıcısı sahipliği/temizliği, Heartbeat istem katkısı, kullanıcı arayüzü tanımlayıcısı |
| Kurulum veya ilk kullanım sihirbazı | Oturum uzantısı, kapsamlı komutlar, Control UI tanımlayıcısı                                                                                       |

<Note>
  Ayrılmış çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`), bir plugin daha dar bir Gateway yöntem kapsamı atamaya çalışsa bile
  her zaman `operator.admin` olarak kalır. Plugin'in sahip olduğu yöntemler için
  plugin'e özgü ön ekleri tercih edin.
</Note>

<Accordion title="Araç sonucu ara yazılımı ne zaman kullanılmalı">
  Paketle birlikte gelen plugin'ler ve eşleşen manifest sözleşmelerine sahip,
  açıkça etkinleştirilmiş kurulu plugin'ler; yürütmeden sonra ve çalışma zamanı
  sonucu modele geri beslemeden önce bir araç sonucunu yeniden yazmaları
  gerektiğinde `api.registerAgentToolResultMiddleware(...)` kullanabilir. Bu,
  tokenjuice gibi eşzamansız çıktı indirgeyicileri için güvenilir ve çalışma
  zamanından bağımsız bağlantı noktasıdır.

Plugin'ler hedeflenen her çalışma zamanı için
`contracts.agentToolResultMiddleware` bildirmelidir; örneğin
`["openclaw", "codex"]`. Bu sözleşmeye veya açık etkinleştirmeye sahip olmayan
kurulu plugin'ler bu ara yazılımı kaydedemez; model öncesi araç sonucu
zamanlamasına ihtiyaç duymayan işler için normal OpenClaw plugin kancalarını
kullanın. Yalnızca eski gömülü çalıştırıcıya yönelik uzantı fabrikası kayıt yolu
kaldırılmıştır.
</Accordion>

### Gateway keşif kaydı

`api.registerGatewayDiscoveryService(...)`, bir plugin'in etkin Gateway'i
mDNS/Bonjour gibi yerel bir keşif aktarımı üzerinden duyurmasını sağlar. Yerel
keşif etkinleştirildiğinde OpenClaw, Gateway başlatılırken hizmeti çağırır;
geçerli Gateway bağlantı noktalarını ve gizli olmayan TXT ipucu verilerini
aktarır ve Gateway kapatılırken döndürülen `stop` işleyicisini çağırır.

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

Gateway keşif plugin'leri, duyurulan TXT değerlerini sır veya kimlik doğrulama
olarak değerlendirmemelidir. Keşif bir yönlendirme ipucudur; güven yönetimi
yine Gateway kimlik doğrulamasına ve TLS sabitlemesine aittir.

### CLI kayıt meta verileri

`api.registerCli(registrar, opts?)` iki tür komut meta verisini kabul eder:

- `commands`: kaydedicinin sahip olduğu açık komut adları
- `descriptors`: CLI yardımı, yönlendirme ve gecikmeli plugin CLI kaydı için
  ayrıştırma zamanında kullanılan komut tanımlayıcıları
- `parentPath`: `["nodes"]` gibi iç içe komut grupları için isteğe bağlı üst
  komut yolu

Eşleştirilmiş Node özellikleri için
`api.registerNodeCliFeature(registrar, opts?)` tercih edin. Bu,
`api.registerCli(..., { parentPath: ["nodes"] })` etrafında küçük bir
sarmalayıcıdır ve `openclaw nodes canvas` gibi komutları açıkça plugin'e ait
Node özellikleri hâline getirir.

Bir plugin komutunun normal kök CLI yolunda gecikmeli yüklenmesini istiyorsanız,
ilgili kaydedicinin sunduğu her üst düzey komut kökünü kapsayan `descriptors`
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
        description: "Matrix hesaplarını, doğrulamayı, cihazları ve profil durumunu yönetin",
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
        description: "Eşleştirilmiş bir Node'dan tuval içeriği yakalayın veya işleyin",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` seçeneğini tek başına yalnızca gecikmeli kök CLI kaydına ihtiyaç
duymadığınızda kullanın. Bu istekli uyumluluk yolu desteklenmeye devam eder,
ancak ayrıştırma zamanında gecikmeli yükleme için tanımlayıcı destekli yer
tutucular yüklemez.

### CLI arka uç kaydı

`api.registerCliBackend(...)`, bir plugin'in `claude-cli` veya `my-cli` gibi
yerel bir yapay zekâ CLI arka ucunun varsayılan yapılandırmasına sahip olmasını
sağlar.

- Arka uç `id` değeri, `my-cli/gpt-5` gibi model başvurularında sağlayıcı ön eki
  olur.
- Arka uç `config` değeri, `agents.defaults.cliBackends.<id>` ile aynı yapıyı
  kullanır.
- Kullanıcı yapılandırması yine önceliklidir. OpenClaw, CLI'yi çalıştırmadan önce
  `agents.defaults.cliBackends.<id>` değerini plugin varsayılanının üzerine
  birleştirir.
- Bir arka uç, birleştirmeden sonra uyumluluk yeniden yazımlarına ihtiyaç
  duyuyorsa `normalizeConfig` kullanın (örneğin eski bayrak yapılarını
  normalleştirmek için).
- CLI lehçesine ait, istek kapsamlı argv yeniden yazımları için
  `resolveExecutionArgs` kullanın; örneğin OpenClaw düşünme düzeylerini yerel
  bir efor bayrağına eşlemek için. Kanca `ctx.executionMode` değerini alır;
  geçici `/btw` çağrılarına arka uca özgü yalıtım bayrakları eklemek için
  `"side-question"` kullanın. Bu bayraklar normalde her zaman açık olan bir
  CLI'nin yerel araçlarını güvenilir biçimde devre dışı bırakıyorsa ayrıca
  `sideQuestionToolMode: "disabled"` bildirin.
- Belirli bir çalıştırmada tüm yerel araçları devre dışı bırakabilen arka uçlar
  `nativeToolMode: "selectable"` bildirebilir. Kısıtlı çağrılar, boş bir
  `ctx.toolAvailability.native` demetiyle birlikte tam bir ana makine
  yalıtımlı MCP izin listesi aktarır; `resolveExecutionArgs`, son yeni veya
  devam ettirme argv'sinde her ikisini de zorunlu kılmalıdır. Arka uç bunu
  yapamıyorsa OpenClaw güvenli biçimde başarısız olur.

Uçtan uca yazım kılavuzu için
[CLI arka uç plugin'leri](/tr/plugins/cli-backend-plugins) bölümüne bakın.

### Özel yuvalar

| Yöntem                                     | Kaydettiği öğe                                                                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Bağlam motoru (aynı anda yalnızca biri etkin). Ana makine model/sağlayıcı/kip tanılamalarını sağlayabildiğinde yaşam döngüsü geri çağırmaları `runtimeSettings` alır; eski katı motorlar bu anahtar olmadan yeniden denenir. |
| `api.registerMemoryCapability(capability)` | Birleşik bellek yeteneği                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Bellek istemi bölümü oluşturucusu                                                                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Bellek boşaltma planı çözümleyicisi                                                                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Bellek çalışma zamanı bağdaştırıcısı                                                                                                                                                                           |

### Kullanımdan kaldırılmış bellek gömme bağdaştırıcıları

| Yöntem                                         | Kaydettiği öğe                                  |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Etkin plugin için bellek gömme bağdaştırıcısı   |

- `registerMemoryCapability`, tercih edilen özel bellek plugin'i API'sidir.
- `registerMemoryCapability`, yardımcı plugin'lerin belirli bir bellek
  plugin'inin özel düzenine erişmek yerine dışa aktarılan bellek yapıtlarını
  `openclaw/plugin-sdk/memory-host-core` üzerinden tüketebilmesi için
  `publicArtifacts.listArtifacts(...)` işlevini de sunabilir.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` ve
  `registerMemoryRuntime`, eski sürümlerle uyumlu özel bellek plugin'i
  API'leridir.
- `MemoryFlushPlan.model`, boşaltma turunu etkin geri dönüş zincirini devralmadan
  `ollama/qwen3:8b` gibi tam bir `provider/model` başvurusuna sabitleyebilir.
- `registerMemoryEmbeddingProvider` kullanımdan kaldırılmıştır. Yeni gömme
  sağlayıcıları `api.registerEmbeddingProvider(...)` ve
  `contracts.embeddingProviders` kullanmalıdır.
- Mevcut belleğe özgü sağlayıcılar geçiş süresi boyunca çalışmaya devam eder,
  ancak plugin incelemesi bunu paketle birlikte gelmeyen plugin'ler için
  uyumluluk borcu olarak bildirir.

### Olaylar ve yaşam döngüsü

| Yöntem                                       | Yaptığı işlem                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Türü belirlenmiş yaşam döngüsü kancası |
| `api.onConversationBindingResolved(handler)` | Konuşma bağlama geri çağırması   |

Örnekler, yaygın kanca adları ve koruma semantiği için
[Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

### Kanca karar semantiği

`before_install`, operatör yükleme ilkesi yüzeyi değil, bir plugin çalışma zamanı
yaşam döngüsü kancasıdır. İzin verme/engelleme kararının CLI ve Gateway destekli
yükleme veya güncelleme yollarını kapsaması gerektiğinde
`security.installPolicy` kullanın.

- `before_tool_call`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`block` alanını belirtmemekle aynıdır).
- `before_install`: `{ block: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`block` alanını belirtmemekle aynıdır).
- `reply_dispatch`: `{ handled: true, ... }` döndürmek sonlandırıcıdır. Herhangi bir işleyici gönderimi üstlendiğinde, daha düşük öncelikli işleyiciler ve varsayılan model gönderim yolu atlanır.
- `message_sending`: `{ cancel: true }` döndürmek sonlandırıcıdır. Herhangi bir işleyici bunu ayarladığında, daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` döndürmek, geçersiz kılma olarak değil, karar verilmemiş olarak değerlendirilir (`cancel` alanını belirtmemekle aynıdır).
- `message_received`: gelen ileti dizisi/konu yönlendirmesine ihtiyaç duyduğunuzda türü belirlenmiş `threadId` alanını kullanın. `metadata` alanını kanala özgü ek bilgiler için ayırın.
- `message_sending`: kanala özgü `metadata` alanına başvurmadan önce türü belirlenmiş `replyToId` / `threadId` yönlendirme alanlarını kullanın.
- `gateway_start`: dahili `gateway:startup` kancalarına güvenmek yerine Gateway tarafından yönetilen başlangıç durumu için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` kullanın. Cron bu noktada hâlâ yükleniyor olabilir.
- `cron_reconciled`: başlangıçtan veya zamanlayıcı yeniden yüklendikten sonra tam bir harici Cron izdüşümünü yeniden oluşturur. `reason` ile `enabled: false` dâhil etkin `enabled` durumunu içerirken `ctx.getCron?.()` tam olarak uzlaştırılmış zamanlayıcıyı döndürür. Kalıcı izdüşüm çalışmasına `ctx.abortSignal` iletin; ilgili zamanlayıcı anlık görüntüsünün yerini yenisi aldığında veya Gateway kapandığında işlem iptal edilir.
- `cron_changed`: Gateway tarafından yönetilen Cron yaşam döngüsü değişikliklerini gözlemler. `scheduled` ve `removed` olayları, sıralı bir fark günlüğü değil, kayıt sonrası uzlaştırma ipuçlarıdır. İşin bir sonraki uyanma zamanı yoksa zamanlanmış olayın `event.nextRunAtMs` alanı bulunmaz; kaldırılmış olay ise silinen iş anlık görüntüsünü taşımaya devam eder.

Harici uyanma zamanlayıcıları `cron_changed` olaylarına gecikmeli tepki vermeli veya bunları birleştirmeli,
ardından `cron_reconciled` tarafından en son yakalanan zamanlayıcıdan tam kalıcı görünümü
yeniden okumalıdır. Zamanlayıcıyı bir `cron_changed` bağlamından devralmayın: eski bir
zamanlayıcıdan ayrılmış bir ipucu, daha sonraki bir yeniden yüklemeyle çakışabilir.

Gateway başlangıcında veya zamanlayıcı değişiminde yüklenen kalıcı durum için tam anlık görüntü
tetikleyicisi olarak `cron_reconciled` kullanın. Yalnızca Plugin'i etkileyen çalışırken yeniden
yüklemede bu olay yeniden oynatılmaz. Gözlem işleyicileri paralel çalışır ve sonucu beklenmeden
başlatılan gönderimler çakışabilir; bu nedenle tüketiciler olayların tamamlanma sırasına bağlı
olmamalıdır. Zamanı gelen işlerin denetlenmesi ve yürütülmesi için doğruluk kaynağı OpenClaw olarak kalmalıdır.

Kalıcı değiştirme, yeniden deneme/geri çekilme ve temiz kapatma özelliklerine sahip tek uçuşlu bir
bağdaştırıcı için [Güvenli harici Cron izdüşümü](/tr/plugins/hooks#safe-external-cron-projection) bölümüne bakın.

### API nesnesi alanları

| Alan                     | Tür                       | Açıklama                                                                                    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin kimliği                                                                              |
| `api.name`               | `string`                  | Görünen ad                                                                                  |
| `api.version`            | `string?`                 | Plugin sürümü (isteğe bağlı)                                                                |
| `api.description`        | `string?`                 | Plugin açıklaması (isteğe bağlı)                                                            |
| `api.source`             | `string`                  | Plugin kaynak yolu                                                                          |
| `api.rootDir`            | `string?`                 | Plugin kök dizini (isteğe bağlı)                                                            |
| `api.config`             | `OpenClawConfig`          | Geçerli yapılandırma anlık görüntüsü (mevcut olduğunda etkin bellek içi çalışma zamanı anlık görüntüsü) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` içindeki Plugin'e özgü yapılandırma                            |
| `api.runtime`            | `PluginRuntime`           | [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)                                         |
| `api.logger`             | `PluginLogger`            | Kapsamlı günlükleyici (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Geçerli yükleme modu; `"setup-runtime"`, tam giriş öncesindeki hafif başlangıç/kurulum penceresidir |
| `api.resolvePath(input)` | `(string) => string`      | Yolu Plugin köküne göre çözümle                                                             |

## Dahili modül düzeni

Plugin'inizde dahili içe aktarımlar için yerel varil dosyaları kullanın:

```text
my-plugin/
  api.ts            # Harici tüketiciler için genel dışa aktarımlar
  runtime-api.ts    # Yalnızca dahili çalışma zamanı dışa aktarımları
  index.ts          # Plugin giriş noktası
  setup-entry.ts    # Yalnızca kuruluma yönelik hafif giriş (isteğe bağlı)
```

<Warning>
  Üretim kodundan kendi Plugin'inizi asla `openclaw/plugin-sdk/<your-plugin>`
  üzerinden içe aktarmayın. Dahili içe aktarımları `./api.ts` veya
  `./runtime-api.ts` üzerinden yönlendirin. SDK yolu yalnızca harici sözleşmedir.
</Warning>

Cephe üzerinden yüklenen paket içi Plugin genel yüzeyleri (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` ve benzer genel giriş dosyaları), OpenClaw zaten çalışıyorsa
etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder. Henüz bir çalışma zamanı
anlık görüntüsü yoksa diskteki çözümlenmiş yapılandırma dosyasına geri dönerler.
Paketlenmiş paket içi Plugin cepheleri, OpenClaw'ın Plugin cephe yükleyicileri üzerinden
yüklenmelidir; `dist/extensions/...` yolundan doğrudan içe aktarımlar, paketlenmiş kurulumların
Plugin tarafından yönetilen kod için kullandığı bildirim ve çalışma zamanı yan dosyası denetimlerini atlar.

Sağlayıcı Plugin'leri, bir yardımcı kasıtlı olarak sağlayıcıya özgüyse ve henüz genel bir SDK
alt yoluna ait değilse, dar kapsamlı ve Plugin'e yerel bir sözleşme varil dosyası sunabilir.
Paket içi örnekler:

- **Anthropic**: Claude beta üstbilgisi ve `service_tier` akış yardımcıları için
  genel `api.ts` / `contract-api.ts` bağlantı yüzeyi.
- **`@openclaw/openai-provider`**: `api.ts`, sağlayıcı oluşturucularını,
  varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır.
- **`@openclaw/openrouter-provider`**: `api.ts`, sağlayıcı oluşturucusunun yanı sıra
  ilk kullanım/yapılandırma yardımcılarını dışa aktarır.

<Warning>
  Uzantı üretim kodu da `openclaw/plugin-sdk/<other-plugin>` içe aktarımlarından
  kaçınmalıdır. Bir yardımcı gerçekten paylaşılıyorsa iki Plugin'i birbirine bağlamak yerine
  onu `openclaw/plugin-sdk/speech`, `.../provider-model-shared` veya başka bir
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
    Paketleme, bildirimler ve yapılandırma şemaları.
  </Card>
  <Card title="Test" icon="vial" href="/tr/plugins/sdk-testing">
    Test yardımcıları ve lint kuralları.
  </Card>
  <Card title="SDK geçişi" icon="arrows-turn-right" href="/tr/plugins/sdk-migration">
    Kullanımdan kaldırılmış yüzeylerden geçiş.
  </Card>
  <Card title="Plugin iç yapısı" icon="diagram-project" href="/tr/plugins/architecture">
    Ayrıntılı mimari ve yetenek modeli.
  </Card>
</CardGroup>
