---
read_when:
    - Yerel OpenClaw Pluginlerini oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme işlem hattı veya kayıt defteri üzerinde çalışma
    - Sağlayıcı çalışma zamanı kancalarını veya kanal Pluginlerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapısı: yetenek modeli, sahiplik, sözleşmeler, yükleme işlem hattı ve çalışma zamanı yardımcıları'
title: Plugin iç işleyişi
x-i18n:
    generated_at: "2026-07-12T12:30:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Bu, OpenClaw plugin sistemi için **derinlemesine mimari başvuru kaynağıdır**. Uygulamalı kılavuzlar için aşağıdaki odaklanmış sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Pluginleri yükleme ve kullanma" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin geliştirme" icon="rocket" href="/tr/plugins/building-plugins">
    Çalışan en küçük manifesti kullanan ilk Plugin öğreticisi.
  </Card>
  <Card title="Kanal pluginleri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugini geliştirin.
  </Card>
  <Card title="Sağlayıcı pluginleri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugini geliştirin.
  </Card>
  <Card title="SDK'ya genel bakış" icon="book" href="/tr/plugins/sdk-overview">
    İçe aktarma eşlemesi ve kayıt API'si başvuru kaynağı.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her yerel OpenClaw Plugini bir veya daha fazla yetenek türü için kaydolur:

| Yetenek                   | Kayıt yöntemi                                     | Örnek pluginler                    |
| ------------------------- | ------------------------------------------------- | ---------------------------------- |
| Metin çıkarımı            | `api.registerProvider(...)`                       | `anthropic`, `openai`              |
| CLI çıkarım arka ucu      | `api.registerCliBackend(...)`                     | `anthropic`, `openai`              |
| Gömme                     | `api.registerEmbeddingProvider(...)`              | Sağlayıcıya ait vektör pluginleri  |
| Konuşma                   | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`          |
| Gerçek zamanlı yazıya döküm | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Gerçek zamanlı ses        | `api.registerRealtimeVoiceProvider(...)`          | `google`, `openai`                 |
| Medya anlama              | `api.registerMediaUnderstandingProvider(...)`     | `google`, `openai`                 |
| Yazıya döküm kaynağı      | `api.registerTranscriptSourceProvider(...)`       | `discord`                          |
| Görüntü üretimi           | `api.registerImageGenerationProvider(...)`        | `fal`, `google`, `openai`          |
| Müzik üretimi             | `api.registerMusicGenerationProvider(...)`        | `fal`, `google`, `minimax`         |
| Video üretimi             | `api.registerVideoGenerationProvider(...)`        | `fal`, `google`, `qwen`            |
| Web'den getirme           | `api.registerWebFetchProvider(...)`               | `firecrawl`                        |
| Web'de arama              | `api.registerWebSearchProvider(...)`              | `brave`, `firecrawl`, `google`     |
| Kanal / mesajlaşma        | `api.registerChannel(...)`                        | `matrix`, `msteams`                |
| Gateway keşfi             | `api.registerGatewayDiscoveryService(...)`        | `bonjour`                          |

<Note>
Sıfır yetenek kaydeden ancak kancalar, araçlar, keşif hizmetleri veya arka plan hizmetleri sağlayan bir Plugin, **yalnızca eski kancaları kullanan** bir Plugindir. Bu model hâlâ tam olarak desteklenmektedir.
</Note>

### Harici uyumluluk yaklaşımı

Yetenek modeli çekirdeğe eklenmiştir ve bugün paketle birlikte gelen/yerel pluginler tarafından kullanılmaktadır; ancak harici Plugin uyumluluğu için hâlâ "dışa aktarılıyorsa artık sabittir" anlayışından daha katı bir ölçüt gereklidir.

| Plugin durumu                                    | Yönlendirme                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Mevcut harici pluginler                          | Kanca tabanlı entegrasyonları çalışır durumda tutun; uyumluluk için temel ölçüt budur.                             |
| Paketle birlikte gelen/yeni yerel pluginler      | Sağlayıcıya özgü iç erişimler veya yalnızca kanca kullanan yeni tasarımlar yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen harici pluginler      | Buna izin verilir; ancak belgeler kararlı olduklarını belirtmedikçe yeteneğe özgü yardımcı yüzeyleri gelişmekte olan yüzeyler olarak değerlendirin. |

Amaçlanan yön yetenek kaydıdır. Geçiş sırasında harici pluginler için kırılmaya yol açmayan en güvenli yol eski kancalar olmaya devam eder. Dışa aktarılan yardımcı alt yolların tümü eşit değildir — tesadüfi yardımcı dışa aktarımlar yerine dar kapsamlı, belgelenmiş sözleşmeleri tercih edin.

### Plugin biçimleri

OpenClaw, yüklenen her Plugini yalnızca statik meta verilere göre değil, gerçek kayıt davranışına göre bir biçimde sınıflandırır:

<AccordionGroup>
  <Accordion title="yalın-yetenek">
    Tam olarak bir yetenek türü kaydeder (örneğin `arcee` veya `chutes` gibi yalnızca sağlayıcı olan bir Plugin).
  </Accordion>
  <Accordion title="karma-yetenek">
    Birden fazla yetenek türü kaydeder (örneğin `openai`; metin çıkarımı, konuşma, medya anlama ve görüntü üretiminin sahibidir).
  </Accordion>
  <Accordion title="yalnızca-kanca">
    Yalnızca kancaları (türlü veya özel) kaydeder; yetenek, araç, komut ya da hizmet kaydetmez.
  </Accordion>
  <Accordion title="yetenek-dışı">
    Araçları, komutları, hizmetleri veya rotaları kaydeder ancak yetenek kaydetmez.
  </Accordion>
</AccordionGroup>

Bir Pluginin biçimini ve yetenek dağılımını görmek için `openclaw plugins inspect <id>` komutunu kullanın. Ayrıntılar için [CLI başvuru kaynağına](/tr/cli/plugins#inspect) bakın.

### Eski kancalar

`before_agent_start` kancası, yalnızca kanca kullanan pluginler için bir uyumluluk yolu olarak desteklenmeye devam etmektedir. Gerçek dünyada kullanılan eski pluginler hâlâ buna bağımlıdır.

Yön:

- çalışır durumda tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma çalışmaları için `before_model_resolve` kullanmayı tercih edin
- istem değişikliği çalışmaları için `before_prompt_build` kullanmayı tercih edin
- yalnızca gerçek kullanım azaldıktan ve düzenek kapsamı geçişin güvenli olduğunu kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` ve `openclaw plugins doctor` şu uyumluluk bildirimlerini gösterir:

| Sinyal                                         | Anlamı                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **yapılandırma geçerli**                       | Yapılandırma sorunsuz ayrıştırılır ve pluginler çözümlenir                                                               |
| **yalnızca-kanca** (bilgi)                     | Plugin yalnızca kancaları kaydeder; bu desteklenen bir yoldur ancak henüz yetenek kaydına geçirilmemiştir                 |
| **eski `before_agent_start`** (uyarı)           | Plugin, `before_model_resolve`/`before_prompt_build` yerine kullanımdan kaldırılmış `before_agent_start` kancasını kullanır |
| **kullanımdan kaldırılmış bellek gömme API'si** (uyarı) | Paketle birlikte gelmeyen Plugin, `registerEmbeddingProvider` yerine eski belleğe özgü gömme sağlayıcısı API'sini kullanır |
| **kritik hata**                                | Yapılandırma geçersizdir veya Plugin yüklenememiştir                                                                     |

Bilgilendirme/uyarı sinyallerinin hiçbiri bugün Plugininizi bozmaz. Bu sinyaller `openclaw status --all` ve `openclaw plugins doctor` çıktılarında da görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sistemi dört katmandan oluşur:

<Steps>
  <Step title="Manifest + keşif">
    OpenClaw; yapılandırılmış yollardan, çalışma alanı köklerinden, genel Plugin köklerinden ve paketle birlikte gelen pluginlerden aday pluginleri bulur. Keşif önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen paket manifestlerini okur.
  </Step>
  <Step title="Etkinleştirme + doğrulama">
    Çekirdek, keşfedilmiş bir Pluginin etkinleştirildiğine, devre dışı bırakıldığına, engellendiğine veya bellek gibi özel bir yuva için seçildiğine karar verir.
  </Step>
  <Step title="Çalışma zamanı yüklemesi">
    Yerel OpenClaw pluginleri işlem içinde yüklenir ve yetenekleri merkezi bir kayıt defterine kaydeder. Paketlenmiş JavaScript, yerel `require` üzerinden yüklenir; üçüncü taraf yerel TypeScript kaynakları için acil durum yedeği Jiti'dir. Uyumlu paketler, çalışma zamanı kodu içe aktarılmadan kayıt defteri kayıtlarına normalleştirilir.
  </Step>
  <Step title="Yüzeylerin kullanımı">
    OpenClaw'ın geri kalanı; araçları, kanalları, sağlayıcı kurulumunu, kancaları, HTTP rotalarını, CLI komutlarını ve hizmetleri kullanıma sunmak için kayıt defterini okur.
  </Step>
</Steps>

Özellikle Plugin CLI'si için kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verileri `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, OpenClaw'ın ayrıştırmadan önce kök komut adlarını ayırabilmesini sağlarken Plugine ait CLI kodunu Pluginin içinde tutar.

Önemli tasarım sınırı:

- manifest/yapılandırma doğrulaması, Plugin kodunu çalıştırmadan **manifest/şema meta verileri** üzerinden çalışmalıdır
- yerel yetenek keşfi, etkinleştirmeyen bir kayıt defteri anlık görüntüsü oluşturmak için güvenilen Plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, `api.registrationMode === "full"` koşuluyla Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, tam çalışma zamanı etkinleşmeden önce OpenClaw'ın yapılandırmayı doğrulamasına, eksik/devre dışı pluginleri açıklamasına ve kullanıcı arayüzü/şema ipuçları oluşturmasına olanak tanır.

### Plugin meta verisi anlık görüntüsü ve arama tablosu

Gateway başlatılırken geçerli yapılandırma anlık görüntüsü için tek bir `PluginMetadataSnapshot` oluşturulur. Anlık görüntü yalnızca meta verilerden oluşur: yüklü Plugin dizinini, manifest kayıt defterini, manifest tanılamalarını, sahip eşlemelerini, bir Plugin kimliği normalleştiricisini ve manifest kayıtlarını saklar. Yüklenmiş Plugin modüllerini, sağlayıcı SDK'larını, paket içeriklerini veya çalışma zamanı dışa aktarımlarını içermez.

Plugin farkındalıklı yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme ve Gateway Plugin önyüklemesi; manifest/dizin meta verilerini birbirinden bağımsız olarak yeniden oluşturmak yerine bu anlık görüntüyü kullanır. `PluginLookUpTable`, aynı anlık görüntüden türetilir ve geçerli çalışma zamanı yapılandırması için başlangıç Plugin planını ekler.

Başlangıçtan sonra Gateway, geçerli meta veri anlık görüntüsünü değiştirilebilir bir çalışma zamanı ürünü olarak tutar. Yinelenen çalışma zamanı sağlayıcı keşfi, her sağlayıcı kataloğu geçişinde yüklü dizini ve manifest kayıt defterini yeniden oluşturmak yerine bu anlık görüntüyü ödünç alabilir. Gateway kapatıldığında, yapılandırma/Plugin envanteri değiştiğinde ve yüklü dizine yazıldığında anlık görüntü temizlenir veya değiştirilir; uyumlu güncel bir anlık görüntü bulunmadığında çağıranlar soğuk manifest/dizin yoluna geri döner. Uyumluluk denetimleri `plugins.load.paths` ve varsayılan aracı çalışma alanı gibi Plugin keşif köklerini içermelidir; çünkü çalışma alanı pluginleri meta veri kapsamının parçasıdır.

Anlık görüntü ve arama tablosu, yinelenen başlangıç kararlarının hızlı yolda kalmasını sağlar:

- kanal sahipliği
- ertelenmiş kanal başlangıcı
- başlangıç Plugin kimlikleri
- sağlayıcı ve CLI arka ucu sahipliği
- kurulum sağlayıcısı, komut takma adı, model kataloğu sağlayıcısı ve manifest sözleşmesi sahipliği
- Plugin yapılandırma şeması ve kanal yapılandırma şeması doğrulaması
- başlangıçta otomatik etkinleştirme kararları

Güvenlik sınırı, anlık görüntünün değiştirilmesidir; değiştirilmesi değil. Yapılandırma, Plugin envanteri, yükleme kayıtları veya kalıcı dizin ilkesi değiştiğinde anlık görüntüyü yeniden oluşturun. Bunu geniş kapsamlı, değiştirilebilir bir genel kayıt defteri olarak değerlendirmeyin ve sınırsız sayıda geçmiş anlık görüntü tutmayın. Eski çalışma zamanı durumunun bir meta veri önbelleğinin ardına gizlenememesi için çalışma zamanı Plugin yüklemesi, meta veri anlık görüntülerinden ayrı kalır.

Önbellek kuralı [Plugin mimarisinin iç işleyişi](/tr/plugins/architecture-internals#plugin-cache-boundary) bölümünde belgelenmiştir: çağıran geçerli akış için açık bir anlık görüntü, arama tablosu veya manifest kayıt defteri tutmadığı sürece manifest ve keşif meta verileri günceldir. Gizli meta veri önbellekleri ve duvar saati TTL'leri Plugin yüklemesinin parçası değildir. Yalnızca çalışma zamanı yükleyicisi, modül ve bağımlılık yapıtı önbellekleri; kod veya yüklü yapıtlar gerçekten yüklendikten sonra kalıcı olabilir.

Bazı soğuk yol çağıranları, Gateway `PluginLookUpTable` almak yerine manifest kayıt defterlerini kalıcı yüklü Plugin dizininden doğrudan yeniden oluşturmayı sürdürür. Bu yol artık kayıt defterini gerektiğinde yeniden oluşturur; çağıranın elinde zaten bir tablo varsa çalışma zamanı akışları boyunca geçerli arama tablosunu veya açık bir manifest kayıt defterini geçirmeyi tercih edin.

### Etkinleştirme planlaması

Etkinleştirme planlaması, kontrol düzleminin bir parçasıdır. Çağıranlar, daha geniş çalışma zamanı kayıtlarını yüklemeden önce somut bir komut, sağlayıcı, kanal, rota, ajan altyapısı veya yetenekle hangi Plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı, mevcut manifest davranışıyla uyumluluğu korur:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar, manifest sahipliği için yedek mekanizma olmaya devam eder
- yalnızca kimlikleri döndüren planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si, tanılamanın açık ipuçlarını sahiplik yedek mekanizmasından ayırt edebilmesi için neden etiketlerini bildirir

<Warning>
`activation` öğesini bir yaşam döngüsü hook'u veya `register(...)` yerine geçen bir mekanizma olarak değerlendirmeyin. Yüklemeyi daraltmak için kullanılan meta veridir. İlişkiyi zaten tanımlıyorlarsa sahiplik alanlarını tercih edin; `activation` öğesini yalnızca ek planlayıcı ipuçları için kullanın.
</Warning>

### Kanal Plugin'leri ve paylaşılan mesaj aracı

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönderme/düzenleme/tepki verme aracı kaydetmesi gerekmez. OpenClaw, çekirdekte tek bir paylaşılan `message` aracı tutar; kanala özgü keşif ve bunun arkasındaki yürütme kanal Plugin'lerine aittir.

Geçerli sınır şöyledir:

- paylaşılan `message` aracı sunucusu, istem bağlantıları, oturum/ileti dizisi takibi ve yürütme yönlendirmesi çekirdeğe aittir
- kapsamlı eylem keşfi, yetenek keşfi ve kanala özgü şema parçaları kanal Plugin'lerine aittir
- konuşma kimliklerinin ileti dizisi kimliklerini nasıl kodladığı veya üst konuşmalardan nasıl devralındığı gibi sağlayıcıya özgü oturum konuşma dil bilgisi kanal Plugin'lerine aittir
- kanal Plugin'leri son eylemi kendi eylem adaptörleri üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi `ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema katkılarını birlikte döndürmesini sağlayarak bu parçaların birbirinden sapmasını önler.

Kanala özgü bir mesaj aracı parametresi, yerel yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında Plugin, `describeMessageTool(...)` üzerinden ayrıca `mediaSourceParams` döndürmelidir. Çekirdek, Plugin'e ait parametre adlarını sabit kodlamadan korumalı alan yolu normalleştirmesi ve giden medya erişimi ipuçlarını uygulamak için bu açık listeyi kullanır. Profil ile sınırlı bir medya parametresinin `send` gibi ilgisiz eylemlerde normalleştirilmemesi için burada kanal genelinde tek bir düz liste yerine eylem kapsamlı eşlemeleri tercih edin.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına aktarır. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal, çekirdekteki `message` aracına kanala özgü dallar sabit kodlamadan etkin hesaba, geçerli odaya/ileti dizisine/mesaja veya güvenilir istekte bulunan kimliğine göre mesaj eylemlerini gizleyebilir ya da gösterebilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: paylaşılan `message` aracının geçerli tur için doğru, kanala ait yüzeyi sunabilmesi amacıyla geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten çalıştırıcı sorumludur.

Kanala ait yürütme yardımcıları için paketlenmiş Plugin'ler, yürütme çalışma zamanını kendi Plugin modüllerinde tutmalıdır. Çekirdek artık `src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj eylemi çalışma zamanlarının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan Plugin'e ait modüllerinden içe aktarmalıdır.

Aynı sınır, genel olarak sağlayıcı adını taşıyan SDK bağlantıları için de geçerlidir: çekirdek; Discord, Signal, Slack, WhatsApp veya benzer Plugin'lere özgü kolaylık barrel'larını içe aktarmamalıdır. Çekirdek bir davranışa ihtiyaç duyuyorsa ya paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketmeli ya da ihtiyacı paylaşılan SDK'da dar kapsamlı, genel bir yeteneğe yükseltmelidir.

Paketlenmiş Plugin'ler de aynı kurala uyar. Paketlenmiş bir Plugin'in `runtime-api.ts` dosyası, kendi markalı `openclaw/plugin-sdk/<plugin-id>` facade'ını yeniden dışa aktarmamalıdır. Bu markalı facade'lar, harici Plugin'ler ve eski tüketiciler için uyumluluk shim'leri olarak kalır; ancak paketlenmiş Plugin'ler yerel dışa aktarımları ve `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` veya `openclaw/plugin-sdk/webhook-ingress` gibi dar kapsamlı genel SDK alt yollarını kullanmalıdır. Yeni kod, mevcut bir harici ekosistemin uyumluluk sınırı gerektirmedikçe Plugin kimliğine özgü SDK facade'ları eklememelidir.

Anketler için özellikle iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel davranıştır
- `actions.handleAction("poll")`, kanala özgü anket anlamları veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket yönlendirmesi eylemi reddedene kadar erteler; böylece Plugin'e ait anket işleyicileri önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlatma sırası için [Plugin mimarisi iç işleyişi](/tr/plugins/architecture-internals) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir Plugin'i ilgisiz entegrasyonların bir araya toplandığı bir yapı olarak değil, bir **şirketin** veya **özelliğin** sahiplik sınırı olarak değerlendirir.

Bunun anlamı şudur:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük tüm yüzeylerine sahip olmalıdır
- bir özellik Plugin'i genellikle sunduğu özellik yüzeyinin tamamına sahip olmalıdır
- kanallar, sağlayıcı davranışını duruma özel biçimde yeniden uygulamak yerine paylaşılan çekirdek yeteneklerini tüketmelidir

<AccordionGroup>
  <Accordion title="Çok yetenekli tedarikçi">
    `google`; metin çıkarımı, CLI arka ucu, gömmeler, konuşma, gerçek zamanlı ses, medya anlama, görüntü/müzik/video üretimi ve web aramasına sahiptir. `openai`; metin çıkarımı, gömmeler, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama ve görüntü/video üretimine sahiptir. `minimax`; metin çıkarımının yanı sıra medya anlama, konuşma, görüntü/müzik/video üretimi ve web aramasına sahiptir.
  </Accordion>
  <Accordion title="Tek yetenekli tedarikçi">
    `arcee` ve `chutes` yalnızca metin çıkarımına; `microsoft` ise yalnızca konuşmaya sahiptir. Bir tedarikçi Plugin'i, tedarikçinin yüzeyinin daha fazlasını kapsaması gerekene kadar bu kadar dar kapsamlı kalabilir.
  </Accordion>
  <Accordion title="Özellik Plugin'i">
    `voice-call`; çağrı aktarımı, araçlar, CLI, rotalar ve Twilio medya akışı köprülemesine sahiptir ancak tedarikçi Plugin'lerini doğrudan içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir.
  </Accordion>
</AccordionGroup>

Hedeflenen son durum şöyledir:

- bir tedarikçinin OpenClaw'a dönük yüzeyi; metin modelleri, konuşma, görüntüler ve videoyu kapsasa bile tek bir Plugin'de bulunur
- diğer tedarikçiler kendi yüzey alanları için aynısını yapabilir
- kanallar, sağlayıcının hangi tedarikçi Plugin'ine ait olduğunu önemsemez; çekirdek tarafından sunulan paylaşılan yetenek sözleşmesini tüketirler

Temel ayrım şudur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden fazla Plugin'in uygulayabileceği veya tüketebileceği çekirdek sözleşmesi

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse ilk soru "hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru "çekirdek video yeteneği sözleşmesi nedir?" olmalıdır. Bu sözleşme oluşturulduktan sonra tedarikçi Plugin'leri buna kaydolabilir ve kanal/özellik Plugin'leri bunu tüketebilir.

Yetenek henüz mevcut değilse doğru yaklaşım genellikle şöyledir:

<Steps>
  <Step title="Yeteneği tanımlayın">
    Eksik yeteneği çekirdekte tanımlayın.
  </Step>
  <Step title="SDK üzerinden sunun">
    Bunu Plugin API'si/çalışma zamanı üzerinden tür güvenli bir biçimde sunun.
  </Step>
  <Step title="Tüketicileri bağlayın">
    Kanalları/özellikleri bu yeteneğe bağlayın.
  </Step>
  <Step title="Tedarikçi uygulamaları">
    Tedarikçi Plugin'lerinin uygulamaları kaydetmesine izin verin.
  </Step>
</Steps>

Bu yaklaşım, tek bir tedarikçiye veya tek seferlik, Plugin'e özgü bir kod yoluna bağlı çekirdek davranışından kaçınırken sahipliği açık tutar.

### Yetenek katmanları

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

<Tabs>
  <Tab title="Çekirdek yetenek katmanı">
    Paylaşılan orkestrasyon, politika, yedek mekanizma, yapılandırma birleştirme kuralları, teslim semantiği ve tür güvenli sözleşmeler.
  </Tab>
  <Tab title="Tedarikçi Plugin katmanı">
    Tedarikçiye özgü API'ler, kimlik doğrulama, model katalogları, konuşma sentezi, görüntü üretimi, video arka uçları ve kullanım uç noktaları.
  </Tab>
  <Tab title="Kanal/özellik Plugin katmanı">
    Çekirdek yeteneklerini tüketen ve bunları bir yüzeyde sunan Discord/Slack/voice-call/vb. entegrasyonu.
  </Tab>
</Tabs>

Örneğin TTS şu yapıyı izler:

- yanıt sırasındaki TTS politikası, yedek mekanizma sırası, tercihler ve kanal teslimi çekirdeğe aittir
- sentez uygulamaları `elevenlabs`, `google`, `microsoft` ve `openai` öğelerine aittir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Gelecekteki yetenekler için de aynı model tercih edilmelidir.

### Çok yetenekli şirket Plugin'i örneği

Bir şirket Plugin'i dışarıdan tutarlı görünmelidir. OpenClaw'ın modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi, web getirme ve web araması için paylaşılan sözleşmeleri varsa bir tedarikçi tüm yüzeylerine tek bir yerde sahip olabilir:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

Önemli olan yardımcıların tam adları değildir. Önemli olan yapıdır:

- tedarikçi yüzeyinin sahibi tek bir Plugin'dir
- yetenek sözleşmelerinin sahibi yine çekirdektir
- kanallar ve özellik Plugin'leri tedarikçi kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahibi olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw görüntü/ses/video anlamayı zaten tek bir paylaşılan yetenek olarak değerlendirir. Aynı sahiplik modeli burada da geçerlidir:

<Steps>
  <Step title="Çekirdek sözleşmeyi tanımlar">
    Çekirdek, medya anlama sözleşmesini tanımlar.
  </Step>
  <Step title="Tedarikçi Plugin'leri kaydolur">
    Tedarikçi Plugin'leri, uygun olan durumlarda `describeImage`, `transcribeAudio` ve `describeVideo` öğelerini kaydeder.
  </Step>
  <Step title="Tüketiciler paylaşılan davranışı kullanır">
    Kanallar ve özellik Plugin'leri doğrudan tedarikçi koduna bağlanmak yerine paylaşılan çekirdek davranışını tüketir.
  </Step>
</Steps>

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe yerleştirilmesini önler. Tedarikçi yüzeyi Plugin'e; yetenek sözleşmesi ve yedek davranışı ise çekirdeğe aittir.

Video üretimi de aynı sırayı zaten kullanır: tür güvenli yetenek sözleşmesi ve çalışma zamanı yardımcısı çekirdeğe aittir; tedarikçi Plugin'leri ise buna yönelik `api.registerVideoGenerationProvider(...)` uygulamalarını kaydeder.

Somut bir kullanıma sunma kontrol listesine mi ihtiyacınız var? [Yetenek Tarifleri](/tr/plugins/adding-capabilities) bölümüne bakın.

## Sözleşmeler ve uygulama zorunluluğu

Plugin API yüzeyi, `OpenClawPluginApi` içinde bilinçli olarak türlendirilmiş ve merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek ve kararlı bir dahili standarda sahip olur
- çekirdek, aynı sağlayıcı kimliğini kaydeden iki Plugin gibi yinelenen sahiplik durumlarını reddedebilir
- başlatma sırasında hatalı biçimlendirilmiş kayıtlar için uygulanabilir tanılama bilgileri gösterilebilir
- sözleşme testleri, paketle birlikte gelen Plugin'lerin sahipliğini zorunlu kılabilir ve sessiz sapmaları önleyebilir

İki uygulama katmanı vardır:

<AccordionGroup>
  <Accordion title="Çalışma zamanı kayıt denetimi">
    Plugin kayıt defteri, Plugin'ler yüklenirken kayıtları doğrular. Örneğin yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve hatalı biçimlendirilmiş kayıtlar, tanımsız davranış yerine Plugin tanılama bilgileri üretir.
  </Accordion>
  <Accordion title="Sözleşme testleri">
    Paketle birlikte gelen Plugin'ler, OpenClaw'un sahipliği açıkça doğrulayabilmesi için test çalıştırmaları sırasında sözleşme kayıt defterlerine alınır. Günümüzde bu yöntem model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketle birlikte gelen kayıtların sahipliği için kullanılır.
  </Accordion>
</AccordionGroup>

Bunun pratik sonucu, OpenClaw'un hangi yüzeyin hangi Plugin'e ait olduğunu en baştan bilmesidir. Böylece sahiplik örtük olmak yerine bildirilmiş, türlendirilmiş ve test edilebilir olduğundan çekirdek ile kanallar sorunsuz biçimde birlikte çalışabilir.

### Bir sözleşmede neler bulunmalıdır?

<Tabs>
  <Tab title="İyi sözleşmeler">
    - türlendirilmiş
    - küçük
    - yeteneğe özgü
    - çekirdeğe ait
    - birden fazla Plugin tarafından yeniden kullanılabilir
    - satıcı bilgisi gerektirmeden kanallar/özellikler tarafından kullanılabilir

  </Tab>
  <Tab title="Kötü sözleşmeler">
    - çekirdekte gizlenmiş satıcıya özgü politika
    - kayıt defterini atlayan, tek seferlik Plugin kaçış yolları
    - doğrudan bir satıcı uygulamasına erişen kanal kodu
    - `OpenClawPluginApi` veya `api.runtime` kapsamına girmeyen geçici çalışma zamanı nesneleri

  </Tab>
</Tabs>

Şüpheye düştüğünüzde soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, ardından Plugin'lerin buna bağlanmasını sağlayın.

## Yürütme modeli

Yerel OpenClaw Plugin'leri Gateway ile **aynı işlem içinde** çalışır. Korumalı alanda çalıştırılmazlar. Yüklenmiş bir yerel Plugin, çekirdek kodla aynı işlem düzeyindeki güven sınırına sahiptir.

<Warning>
Yerel Plugin'lerin sonuçları: Bir Plugin araçları, ağ işleyicilerini, kancaları ve hizmetleri kaydedebilir; bir Plugin hatası Gateway'in çökmesine veya kararsızlaşmasına neden olabilir; kötü amaçlı bir yerel Plugin ise OpenClaw işlemi içinde rastgele kod yürütmeyle eşdeğerdir.
</Warning>

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda bunları meta veri/içerik paketleri olarak değerlendirir. Güncel sürümlerde bu çoğunlukla paketle birlikte gelen Skills anlamına gelir.

Paketle birlikte gelmeyen Plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Plugin'lerini üretim varsayılanları olarak değil, geliştirme zamanı kodu olarak değerlendirin.

Paketle birlikte gelen çalışma alanı paket adlarında Plugin kimliğini npm adına bağlı tutun: varsayılan olarak `@openclaw/<id>` veya paket bilinçli olarak daha dar bir Plugin rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding` gibi onaylanmış, türlendirilmiş bir sonek kullanın.

<Note>
**Güven notu:** `plugins.allow`, kaynak kökenine değil **Plugin kimliklerine** güvenir. Paketle birlikte gelen bir Plugin ile aynı kimliğe sahip çalışma alanı Plugin'i etkinleştirildiğinde/izin listesine alındığında, bilinçli olarak paketle birlikte gelen kopyanın yerini alır. Bu normaldir ve yerel geliştirme, yama testi ve acil düzeltmeler için kullanışlıdır. Paketle birlikte gelen Plugin'e duyulan güven, kurulum meta verilerinden değil, yükleme anında diskte bulunan manifest ve koddan oluşan kaynak anlık görüntüsünden belirlenir. Bozulmuş veya değiştirilmiş bir kurulum kaydı, paketle birlikte gelen bir Plugin'in güven yüzeyini gerçek kaynağın beyan ettiğinin ötesine sessizce genişletemez.
</Note>

## Dışa aktarma sınırı

OpenClaw uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını herkese açık tutun. Sözleşme kapsamı dışındaki yardımcı dışa aktarımları kaldırın:

- paketle birlikte gelen Plugin'lere özgü yardımcı alt yollar
- herkese açık API olarak tasarlanmamış çalışma zamanı altyapısı alt yolları
- satıcıya özgü kolaylık sağlayan yardımcılar
- uygulama ayrıntısı niteliğindeki kurulum/ilk yapılandırma yardımcıları

Paketle birlikte gelen Plugin'lere ayrılmış yardımcı alt yollar, oluşturulan SDK dışa aktarma eşlemesinden kaldırılmıştır. Sahibe özgü yardımcıları ilgili Plugin paketinin içinde tutun; yalnızca yeniden kullanılabilir ana makine davranışını `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmelerine yükseltin.

## Dahili yapılar ve başvuru

Yükleme işlem hattı, kayıt defteri modeli, sağlayıcı çalışma zamanı kancaları, Gateway HTTP rotaları, mesaj aracı şemaları, kanal hedefi çözümleme, sağlayıcı katalogları, bağlam motoru Plugin'leri ve yeni bir yetenek ekleme kılavuzu için [Plugin mimarisinin dahili yapıları](/tr/plugins/architecture-internals) bölümüne bakın.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
