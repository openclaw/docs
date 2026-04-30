---
read_when:
    - Yerel OpenClaw Plugin'lerini derleme veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme işlem hattı veya kayıt sistemi üzerinde çalışma
    - Sağlayıcı çalışma zamanı hook'larını veya kanal Plugin'lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç işleyişi: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapısı
x-i18n:
    generated_at: "2026-04-30T09:33:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Bu, OpenClaw Plugin sistemi için **derin mimari referansı**dır. Pratik kılavuzlar için aşağıdaki odaklanmış sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugin'leri yükleme ve kullanma" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin oluşturma" icon="rocket" href="/tr/plugins/building-plugins">
    Çalışan en küçük manifest ile ilk Plugin öğreticisi.
  </Card>
  <Card title="Kanal Plugin'leri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun.
  </Card>
  <Card title="SDK genel bakışı" icon="book" href="/tr/plugins/sdk-overview">
    İçeri aktarma eşlemesi ve kayıt API referansı.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki herkese açık **yerel Plugin** modelidir. Her yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne göre kayıt yapar:

| Yetenek                 | Kayıt yöntemi                                    | Örnek Plugin'ler                     |
| ----------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı          | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım arka ucu    | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Konuşma                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı yazıya dökme | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Gerçek zamanlı ses      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Görsel üretimi          | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi           | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video üretimi           | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web arama               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway keşfi           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Sıfır yetenek kaydeden ancak hook'lar, araçlar, keşif hizmetleri veya arka plan hizmetleri sağlayan bir Plugin, **eski yalnızca hook** Plugin'idir. Bu kalıp hâlâ tamamen desteklenir.
</Note>

### Dış uyumluluk yaklaşımı

Yetenek modeli çekirdeğe dahil edilmiştir ve bugün paketlenmiş/yerel Plugin'ler tarafından kullanılır, ancak dış Plugin uyumluluğu hâlâ "dışa aktarılmışsa donmuştur" ifadesinden daha sıkı bir ölçüt gerektirir.

| Plugin durumu                                    | Yönlendirme                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Mevcut dış Plugin'ler                            | Hook tabanlı entegrasyonları çalışır tutun; uyumluluk temeli budur.                              |
| Yeni paketlenmiş/yerel Plugin'ler                | Tedarikçiye özgü iç erişimler veya yeni yalnızca hook tasarımları yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen dış Plugin'ler        | İzin verilir, ancak dokümanlar kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişen kabul edin. |

Yetenek kaydı hedeflenen yöndür. Geçiş sırasında dış Plugin'ler için eski hook'lar en güvenli kırılmasız yol olmaya devam eder. Dışa aktarılmış yardımcı alt yolların hepsi eşit değildir — rastlantısal yardımcı dışa aktarımlar yerine dar, belgelenmiş sözleşmeleri tercih edin.

### Plugin biçimleri

OpenClaw, yüklenen her Plugin'i gerçek kayıt davranışına göre bir biçime sınıflandırır (yalnızca statik metadata'ya göre değil):

<AccordionGroup>
  <Accordion title="plain-capability">
    Tam olarak bir yetenek türü kaydeder (örneğin `mistral` gibi yalnızca sağlayıcı olan bir Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    Birden çok yetenek türü kaydeder (örneğin `openai`, metin çıkarımı, konuşma, medya anlama ve görsel üretiminin sahibidir).
  </Accordion>
  <Accordion title="hook-only">
    Yalnızca hook'lar kaydeder (türlü veya özel), yetenek, araç, komut ya da hizmet kaydetmez.
  </Accordion>
  <Accordion title="non-capability">
    Araçlar, komutlar, hizmetler veya rotalar kaydeder ancak yetenek kaydetmez.
  </Accordion>
</AccordionGroup>

Bir Plugin'in biçimini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI referansı](/tr/cli/plugins#inspect) bölümüne bakın.

### Eski hook'lar

`before_agent_start` hook'u, yalnızca hook Plugin'leri için uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya Plugin'leri hâlâ buna bağlıdır.

Yön:

- çalışır tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işi için `before_model_resolve` tercih edin
- prompt mutasyonu işi için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlam                                                        |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config sorunsuz ayrıştırılır ve Plugin'ler çözümlenir        |
| **compatibility advisory** | Plugin desteklenen ancak daha eski bir kalıp kullanır (örn. `hook-only`) |
| **legacy warning**         | Plugin kullanımdan kaldırılmış olan `before_agent_start` kullanır |
| **hard error**             | Config geçersizdir veya Plugin yüklenememiştir               |

Ne `hook-only` ne de `before_agent_start` bugün Plugin'inizi kırar: `hook-only` danışma niteliğindedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimari genel bakışı

OpenClaw'ın Plugin sistemi dört katmandan oluşur:

<Steps>
  <Step title="Manifest + keşif">
    OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden, global Plugin köklerinden ve paketlenmiş Plugin'lerden aday Plugin'leri bulur. Keşif önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen paket manifestlerini okur.
  </Step>
  <Step title="Etkinleştirme + doğrulama">
    Çekirdek, keşfedilen bir Plugin'in etkin, devre dışı, engellenmiş ya da bellek gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
  </Step>
  <Step title="Çalışma zamanı yükleme">
    Yerel OpenClaw Plugin'leri jiti üzerinden süreç içinde yüklenir ve yetenekleri merkezi bir kayıt defterine kaydeder. Uyumlu paketler, çalışma zamanı kodu içeri aktarılmadan kayıt defteri kayıtlarına normalleştirilir.
  </Step>
  <Step title="Yüzey tüketimi">
    OpenClaw'ın geri kalanı araçları, kanalları, sağlayıcı kurulumunu, hook'ları, HTTP rotalarını, CLI komutlarını ve hizmetleri sunmak için kayıt defterini okur.
  </Step>
</Steps>

Özellikle Plugin CLI için kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı metadata'sı `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek Plugin CLI modülü lazy kalabilir ve ilk çağrıda kayıt yapabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın ayrıştırmadan önce kök komut adlarını ayırmasına yine de olanak tanır.

Önemli tasarım sınırı:

- manifest/config doğrulaması, Plugin kodu yürütülmeden **manifest/schema metadata'sı** üzerinden çalışmalıdır
- yerel yetenek keşfi, etkinleştirme yapmayan bir kayıt defteri anlık görüntüsü oluşturmak için güvenilen Plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, Plugin modülünün `api.registrationMode === "full"` olan `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkin olmadan önce config doğrulamasına, eksik/devre dışı Plugin'leri açıklamasına ve UI/schema ipuçları oluşturmasına olanak tanır.

### Plugin metadata anlık görüntüsü ve arama tablosu

Gateway başlangıcı, geçerli config anlık görüntüsü için bir `PluginMetadataSnapshot` oluşturur. Anlık görüntü yalnızca metadata içerir: kurulu Plugin dizinini, manifest kayıt defterini, manifest tanılarını, sahip haritalarını, bir Plugin kimliği normalleştiricisini ve manifest kayıtlarını saklar. Yüklenmiş Plugin modüllerini, sağlayıcı SDK'larını, paket içeriklerini veya çalışma zamanı dışa aktarımlarını tutmaz.

Plugin farkındalıklı config doğrulaması, başlangıçta otomatik etkinleştirme ve Gateway Plugin önyüklemesi, manifest/dizin metadata'sını bağımsız olarak yeniden oluşturmak yerine bu anlık görüntüyü tüketir. `PluginLookUpTable` aynı anlık görüntüden türetilir ve geçerli çalışma zamanı config'i için başlangıç Plugin planını ekler.

Başlangıçtan sonra Gateway, geçerli metadata anlık görüntüsünü değiştirilebilir bir çalışma zamanı ürünü olarak tutar. Tekrarlanan çalışma zamanı sağlayıcı keşfi, her sağlayıcı katalog geçişi için kurulu dizini ve manifest kayıt defterini yeniden oluşturmak yerine bu anlık görüntüyü ödünç alabilir. Gateway kapatıldığında, config/Plugin envanteri değiştiğinde ve kurulu dizin yazımlarında anlık görüntü temizlenir veya değiştirilir; uyumlu geçerli anlık görüntü yoksa çağıranlar soğuk manifest/dizin yoluna geri döner. Uyumluluk denetimleri, `plugins.load.paths` ve varsayılan ajan çalışma alanı gibi Plugin keşif köklerini içermelidir, çünkü çalışma alanı Plugin'leri metadata kapsamının parçasıdır.

Anlık görüntü ve arama tablosu, tekrarlanan başlangıç kararlarını hızlı yolda tutar:

- kanal sahipliği
- ertelenmiş kanal başlangıcı
- başlangıç Plugin kimlikleri
- sağlayıcı ve CLI arka uç sahipliği
- kurulum sağlayıcısı, komut takma adı, model kataloğu sağlayıcısı ve manifest sözleşmesi sahipliği
- Plugin config schema ve kanal config schema doğrulaması
- başlangıç otomatik etkinleştirme kararları

Güvenlik sınırı mutasyon değil, anlık görüntü değiştirmedir. Config, Plugin envanteri, kurulum kayıtları veya kalıcı dizin ilkesi değiştiğinde anlık görüntüyü yeniden oluşturun. Bunu geniş, değiştirilebilir global kayıt defteri olarak ele almayın ve sınırsız geçmiş anlık görüntüler tutmayın. Çalışma zamanı Plugin yüklemesi metadata anlık görüntülerinden ayrı kalır; böylece eski çalışma zamanı durumu bir metadata cache'inin arkasına gizlenemez.

Cache kuralı [Plugin mimarisi iç ayrıntıları](/tr/plugins/architecture-internals#plugin-cache-boundary) bölümünde belgelenmiştir: bir çağıran geçerli akış için açık bir anlık görüntü, arama tablosu veya manifest kayıt defteri tutmadıkça manifest ve keşif metadata'sı tazedir. Gizli metadata cache'leri ve duvar saati TTL'leri Plugin yüklemesinin parçası değildir. Yalnızca çalışma zamanı yükleyici, modül ve bağımlılık-artifakt cache'leri, kod veya kurulu artifaktlar gerçekten yüklendikten sonra kalıcı olabilir.

Bazı soğuk yol çağıranları, bir Gateway `PluginLookUpTable` almak yerine manifest kayıt defterlerini kalıcı kurulu Plugin dizininden doğrudan yeniden oluşturur. Bu yol artık kayıt defterini istek üzerine yeniden oluşturur; bir çağıranda zaten varsa geçerli arama tablosunu veya açık bir manifest kayıt defterini çalışma zamanı akışları boyunca geçirmeyi tercih edin.

### Etkinleştirme planlaması

Etkinleştirme planlaması kontrol düzleminin parçasıdır. Çağıranlar daha geniş çalışma zamanı kayıt defterlerini yüklemeden önce somut bir komut, sağlayıcı, kanal, rota, ajan çalışma düzeneği veya yetenek için hangi Plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı, geçerli manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar manifest sahipliği geri dönüşü olarak kalır
- yalnızca kimliklerden oluşan planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si neden etiketlerini bildirir; böylece tanılar açık ipuçlarını sahiplik geri dönüşünden ayırt edebilir

<Warning>
`activation` öğesini bir yaşam döngüsü hook'u veya `register(...)` yerine geçecek bir şey olarak ele almayın. Bu, yüklemeyi daraltmak için kullanılan metadatadır. İlişkiyi zaten açıklıyorlarsa sahiplik alanlarını tercih edin; `activation` öğesini yalnızca ek planlayıcı ipuçları için kullanın.
</Warning>

### Channel Plugin'leri ve paylaşılan ileti aracı

Channel Plugin'lerinin normal sohbet eylemleri için ayrı bir gönderme/düzenleme/tepki verme aracı kaydetmesi gerekmez. OpenClaw core içinde tek bir paylaşılan `message` aracını tutar ve Channel Plugin'leri bunun arkasındaki kanala özgü keşif ve yürütmenin sahibidir.

Geçerli sınır şudur:

- core, paylaşılan `message` araç host'unun, prompt bağlamasının, oturum/thread kayıtlarının ve yürütme dispatch'inin sahibidir
- Channel Plugin'leri kapsamlı eylem keşfinin, capability keşfinin ve kanala özgü schema parçalarının sahibidir
- Channel Plugin'leri, conversation id'lerinin thread id'lerini nasıl kodladığı veya üst conversation'lardan nasıl miras aldığı gibi sağlayıcıya özgü oturum conversation gramerinin sahibidir
- Channel Plugin'leri son eylemi kendi action adapter'ları üzerinden yürütür

Channel Plugin'leri için SDK yüzeyi `ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir Plugin'in görünür eylemlerini, capability'lerini ve schema katkılarını birlikte döndürmesine izin verir; böylece bu parçalar birbirinden sapmaz.

Kanala özgü bir message-tool parametresi yerel bir yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında, Plugin ayrıca `describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Core, Plugin'e ait parametre adlarını hardcode etmeden sandbox yol normalizasyonu ve giden medya erişimi ipuçlarını uygulamak için bu açık listeyi kullanır. Burada kanal genelinde tek bir düz liste yerine eylem kapsamlı map'leri tercih edin; böylece yalnızca profile yönelik bir medya parametresi `send` gibi ilgisiz eylemlerde normalize edilmez.

Core, runtime kapsamını bu keşif adımına aktarır. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal, core `message` aracında kanala özgü branch'leri hardcode etmeden etkin hesaba, geçerli oda/thread/iletiye veya güvenilir requester kimliğine göre message eylemlerini gizleyebilir ya da gösterebilir.

Embedded-runner routing değişikliklerinin hâlâ Plugin işi olmasının nedeni budur: runner, geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur; böylece paylaşılan `message` aracı geçerli tur için doğru kanal sahipli yüzeyi gösterir.

Kanal sahipli yürütme yardımcıları için bundled Plugin'ler yürütme runtime'ını kendi extension modüllerinin içinde tutmalıdır. Core artık `src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp message-action runtime'larının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` subpath'leri yayımlamıyoruz ve bundled Plugin'ler kendi yerel runtime kodlarını doğrudan extension sahipli modüllerinden import etmelidir.

Aynı sınır genel olarak sağlayıcı adlı SDK seam'leri için de geçerlidir: core, Slack, Discord, Signal, WhatsApp veya benzer extension'lar için kanala özgü kolaylık barrel'larını import etmemelidir. Core bir davranışa ihtiyaç duyarsa ya bundled Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketmeli ya da ihtiyacı paylaşılan SDK içinde dar bir generic capability'ye yükseltmelidir.

Bundled Plugin'ler de aynı kurala uyar. Bir bundled Plugin'in `runtime-api.ts` dosyası, kendi markalı `openclaw/plugin-sdk/<plugin-id>` facade'ını yeniden export etmemelidir. Bu markalı facade'lar dış Plugin'ler ve eski tüketiciler için uyumluluk shim'leri olarak kalır, ancak bundled Plugin'ler yerel export'ları ve `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` veya `openclaw/plugin-sdk/webhook-ingress` gibi dar generic SDK subpath'lerini kullanmalıdır. Mevcut bir dış ekosistem için uyumluluk sınırı gerektirmedikçe yeni kod Plugin id'ye özgü SDK facade'ları eklememelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan baseline'dır
- `actions.handleAction("poll")`, kanala özgü anket semantikleri veya ek anket parametreleri için tercih edilen yoldur

Core artık paylaşılan anket ayrıştırmasını Plugin anket dispatch'i eylemi reddedene kadar erteler; böylece Plugin sahipli anket handler'ları önce generic anket parser'ı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için bkz. [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals).

## Capability sahiplik modeli

OpenClaw, native bir Plugin'i ilişkisiz entegrasyonlardan oluşan bir torba olarak değil, bir **şirket** veya bir **özellik** için sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin'i genellikle tanıttığı tam özellik yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını ad hoc yeniden uygulamak yerine paylaşılan core capability'lerini tüketmelidir

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai`, metin çıkarımı, konuşma, gerçek zamanlı ses, medya anlama ve görsel üretiminin sahibidir. `google`, metin çıkarımının yanı sıra medya anlama, görsel üretimi ve web aramanın sahibidir. `qwen`, metin çıkarımının yanı sıra medya anlama ve video üretiminin sahibidir.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` ve `microsoft` konuşmanın sahibidir; `firecrawl` web-fetch'in sahibidir; `minimax` / `mistral` / `moonshot` / `zai` medya anlama backend'lerinin sahibidir.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` çağrı aktarımı, araçlar, CLI, route'lar ve Twilio media-stream köprülemesinin sahibidir, ancak vendor Plugin'lerini doğrudan import etmek yerine paylaşılan konuşma, gerçek zamanlı transcription ve gerçek zamanlı ses capability'lerini tüketir.
  </Accordion>
</AccordionGroup>

Hedeflenen son durum şudur:

- OpenAI, metin modellerini, konuşmayı, görselleri ve gelecekteki videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir vendor kendi yüzey alanı için aynısını yapabilir
- kanallar sağlayıcının hangi vendor Plugin'ine ait olduğuyla ilgilenmez; core tarafından açığa çıkarılan paylaşılan capability contract'ını tüketir

Temel ayrım budur:

- **plugin** = sahiplik sınırı
- **capability** = birden çok Plugin'in uygulayabileceği veya tüketebileceği core contract

Yani OpenClaw video gibi yeni bir domain eklerse, ilk soru "hangi provider video handling'i hardcode etmeli?" değildir. İlk soru "core video capability contract'ı nedir?" olmalıdır. Bu contract var olduğunda, vendor Plugin'leri buna karşı register edebilir ve kanal/özellik Plugin'leri bunu tüketebilir.

Capability henüz yoksa, doğru hamle genellikle şudur:

<Steps>
  <Step title="Capability'yi tanımlayın">
    Eksik capability'yi core içinde tanımlayın.
  </Step>
  <Step title="SDK üzerinden açığa çıkarın">
    Bunu Plugin API/runtime üzerinden typed şekilde açığa çıkarın.
  </Step>
  <Step title="Tüketicileri bağlayın">
    Kanalları/özellikleri bu capability'ye karşı bağlayın.
  </Step>
  <Step title="Vendor implementasyonları">
    Vendor Plugin'lerinin implementasyon kaydetmesine izin verin.
  </Step>
</Steps>

Bu, tek bir vendor'a veya tek seferlik Plugin'e özgü bir code path'e bağlı core davranışından kaçınırken sahipliği açık tutar.

### Capability katmanlama

Kodun nereye ait olduğuna karar verirken bu mental modeli kullanın:

<Tabs>
  <Tab title="Core capability katmanı">
    Paylaşılan orchestration, policy, fallback, config merge kuralları, teslim semantikleri ve typed contract'lar.
  </Tab>
  <Tab title="Vendor plugin katmanı">
    Vendor'a özgü API'ler, auth, model katalogları, konuşma sentezi, görsel üretimi, gelecekteki video backend'leri, usage endpoint'leri.
  </Tab>
  <Tab title="Channel/feature plugin katmanı">
    Core capability'lerini tüketen ve bunları bir yüzeyde sunan Slack/Discord/voice-call/vb. entegrasyonu.
  </Tab>
</Tabs>

Örneğin, TTS şu şekli izler:

- core, yanıt zamanı TTS policy'sinin, fallback sırasının, tercihlerin ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft` sentez implementasyonlarının sahibidir
- `voice-call`, telephony TTS runtime helper'ını tüketir

Gelecekteki capability'ler için de aynı pattern tercih edilmelidir.

### Multi-capability şirket Plugin örneği

Bir şirket Plugin'i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw modeller, konuşma, gerçek zamanlı transcription, gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi, web fetch ve web arama için paylaşılan contract'lara sahipse, bir vendor tüm yüzeylerinin sahibi tek bir yerde olabilir:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Önemli olan tam helper adları değildir. Önemli olan şekildir:

- tek bir Plugin vendor yüzeyinin sahibidir
- core yine de capability contract'larının sahibidir
- kanallar ve özellik Plugin'leri vendor kodunu değil, `api.runtime.*` helper'larını tüketir
- contract testleri, Plugin'in sahibi olduğunu iddia ettiği capability'leri kaydettiğini doğrulayabilir

### Capability örneği: video anlama

OpenClaw zaten görsel/ses/video anlamayı tek bir paylaşılan capability olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

<Steps>
  <Step title="Core contract'ı tanımlar">
    Core, media-understanding contract'ını tanımlar.
  </Step>
  <Step title="Vendor Plugin'leri register eder">
    Vendor Plugin'leri uygulanabilir olduğunda `describeImage`, `transcribeAudio` ve `describeVideo` kaydeder.
  </Step>
  <Step title="Tüketiciler paylaşılan davranışı kullanır">
    Kanallar ve özellik Plugin'leri doğrudan vendor koduna bağlanmak yerine paylaşılan core davranışını tüketir.
  </Step>
</Steps>

Bu, tek bir provider'ın video varsayımlarını core içine gömmekten kaçınır. Plugin vendor yüzeyinin sahibidir; core capability contract'ının ve fallback davranışının sahibidir.

Video üretimi zaten aynı sırayı kullanır: core typed capability contract'ının ve runtime helper'ın sahibidir, vendor Plugin'leri ise buna karşı `api.registerVideoGenerationProvider(...)` implementasyonları kaydeder.

Somut bir rollout checklist mi gerekiyor? Bkz. [Capability Cookbook](/tr/plugins/architecture).

## Contract'lar ve enforcement

Plugin API yüzeyi kasıtlı olarak typed ve `OpenClawPluginApi` içinde merkezi hale getirilmiştir. Bu contract, desteklenen registration point'leri ve bir Plugin'in güvenebileceği runtime helper'ları tanımlar.

Bunun önemi:

- Plugin yazarları tek bir stable iç standart elde eder
- core, aynı provider id'yi register eden iki Plugin gibi yinelenen sahiplikleri reddedebilir
- startup, hatalı biçimlendirilmiş registration için actionable diagnostics gösterebilir
- contract testleri bundled-Plugin sahipliğini enforce edebilir ve sessiz drift'i önleyebilir

İki enforcement katmanı vardır:

<AccordionGroup>
  <Accordion title="Çalışma zamanı kayıt yaptırım">
    Plugin kayıt defteri, Plugin'ler yüklenirken kayıtları doğrular. Örnekler: yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve hatalı biçimlendirilmiş kayıtlar, tanımsız davranış yerine Plugin tanılamaları üretir.
  </Accordion>
  <Accordion title="Sözleşme testleri">
    OpenClaw'ın sahipliği açıkça doğrulayabilmesi için paketlenmiş Plugin'ler test çalıştırmaları sırasında sözleşme kayıt defterlerinde yakalanır. Bugün bu; model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt sahipliği için kullanılır.
  </Accordion>
</AccordionGroup>

Bunun pratik etkisi, OpenClaw'ın hangi yüzeyin hangi Plugin'e ait olduğunu en baştan bilmesidir. Bu, sahiplik örtük olmak yerine bildirilmiş, tiplendirilmiş ve test edilebilir olduğu için çekirdek ile kanalların sorunsuzca bileşmesini sağlar.

### Bir sözleşmede neler olmalı

<Tabs>
  <Tab title="İyi sözleşmeler">
    - tiplendirilmiş
    - küçük
    - yeteneğe özgü
    - çekirdek tarafından sahiplenilen
    - birden fazla Plugin tarafından yeniden kullanılabilir
    - satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

  </Tab>
  <Tab title="Kötü sözleşmeler">
    - çekirdekte gizlenmiş satıcıya özgü ilke
    - kayıt defterini atlayan tek seferlik Plugin kaçış yolları
    - doğrudan bir satıcı uygulamasına erişen kanal kodu
    - `OpenClawPluginApi` veya `api.runtime` parçası olmayan plansız çalışma zamanı nesneleri

  </Tab>
</Tabs>

Emin değilseniz soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra Plugin'lerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin'leri Gateway ile **süreç içinde** çalışır. Sandbox'a alınmazlar. Yüklenmiş bir yerel Plugin, çekirdek kodla aynı süreç düzeyi güven sınırına sahiptir.

<Warning>
Yerel Plugin sonuçları: Bir Plugin araçlar, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir; bir Plugin hatası gateway'i çökertebilir veya kararsızlaştırabilir; kötü amaçlı bir yerel Plugin ise OpenClaw sürecinin içinde rastgele kod yürütmeyle eşdeğerdir.
</Warning>

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda bunları meta veri/içerik paketleri olarak ele alır. Güncel sürümlerde bu çoğunlukla paketlenmiş Skills anlamına gelir.

Paketlenmemiş Plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Plugin'lerini üretim varsayılanları olarak değil, geliştirme zamanı kodu olarak ele alın.

Paketlenmiş çalışma alanı paket adları için Plugin kimliğini npm adına sabitlenmiş tutun: varsayılan olarak `@openclaw/<id>` veya paket bilerek daha dar bir Plugin rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding` gibi onaylı tiplendirilmiş bir sonek.

<Note>
**Güven notu:** `plugins.allow`, kaynak kökenini değil **Plugin kimliklerini** güvenilir sayar. Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin'i, bu çalışma alanı Plugin'i etkinleştirildiğinde/izin listesine alındığında bilinçli olarak paketlenmiş kopyanın yerine geçer. Bu normaldir ve yerel geliştirme, yama testi ve hızlı düzeltmeler için kullanışlıdır. Paketlenmiş Plugin güveni, kurulum meta verilerinden değil, yükleme zamanındaki kaynak anlık görüntüsünden — diskteki manifest ve koddan — çözümlenir. Bozulmuş veya yerine geçirilmiş bir kurulum kaydı, paketlenmiş bir Plugin'in güven yüzeyini gerçek kaynağın iddia ettiğinin ötesine sessizce genişletemez.
</Note>

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylığı değil, yetenekler dışa aktarır.

Yetenek kaydını herkese açık tutun. Sözleşme dışı yardımcı dışa aktarımları budayın:

- paketlenmiş Plugin'e özgü yardımcı alt yollar
- herkese açık API olarak amaçlanmayan çalışma zamanı tesisatı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Ayrılmış paketlenmiş Plugin yardımcı alt yolları, oluşturulan SDK dışa aktarma haritasından emekli edilmiştir. Sahibe özgü yardımcıları sahip olan Plugin paketi içinde tutun; yalnızca yeniden kullanılabilir host davranışını `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmelerine yükseltin.

## İç yapılar ve başvuru

Yükleme pipeline'ı, kayıt defteri modeli, sağlayıcı çalışma zamanı hook'ları, Gateway HTTP rotaları, ileti aracı şemaları, kanal hedef çözümleme, sağlayıcı katalogları, bağlam motoru Plugin'leri ve yeni bir yetenek ekleme kılavuzu için bkz. [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
