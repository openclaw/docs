---
read_when:
    - Yerel OpenClaw Plugin'leri oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme işlem hattı veya kayıt defteri üzerinde çalışma
    - Sağlayıcı çalışma zamanı kancalarını veya kanal Plugin'lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapısı: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapıları
x-i18n:
    generated_at: "2026-06-28T00:50:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Bu, OpenClaw Plugin sistemi için **derin mimari referansıdır**. Pratik kılavuzlar için aşağıdaki odaklanmış sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugin yükleme ve kullanma" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin oluşturma" icon="rocket" href="/tr/plugins/building-plugins">
    En küçük çalışan manifest ile ilk Plugin öğreticisi.
  </Card>
  <Card title="Kanal Plugin'leri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanalı Plugin'i oluşturun.
  </Card>
  <Card title="Sağlayıcı Plugin'leri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı Plugin'i oluşturun.
  </Card>
  <Card title="SDK genel bakışı" icon="book" href="/tr/plugins/sdk-overview">
    İçe aktarma haritası ve kayıt API başvurusu.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içinde herkese açık **yerel Plugin** modelidir. Her yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne karşı kayıt yapar:

| Yetenek                | Kayıt yöntemi                                     | Örnek Plugin'ler                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Gömmeler               | `api.registerEmbeddingProvider(...)`             | Sağlayıcıya ait vektör Plugin'leri   |
| Konuşma                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Transkript kaynağı     | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Görüntü üretimi        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi          | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video üretimi          | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web araması            | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway keşfi          | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Sıfır yetenek kaydeden ancak kancalar, araçlar, keşif servisleri veya arka plan servisleri sağlayan bir Plugin, **eski yalnızca-kanca** Plugin'idir. Bu desen hâlâ tamamen desteklenmektedir.
</Note>

### Dış uyumluluk yaklaşımı

Yetenek modeli çekirdeğe dahil edildi ve bugün paketlenmiş/yerel Plugin'ler tarafından kullanılıyor, ancak dış Plugin uyumluluğu hâlâ "dışa aktarıldı, dolayısıyla donmuştur" ifadesinden daha sıkı bir çıta gerektirir.

| Plugin durumu                                    | Rehberlik                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mevcut dış Plugin'ler                            | Kanca tabanlı entegrasyonları çalışır halde tutun; uyumluluk temeli budur.                      |
| Yeni paketlenmiş/yerel Plugin'ler                | Satıcıya özel içeri uzanışlar veya yeni yalnızca-kanca tasarımları yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen dış Plugin'ler        | İzin verilir, ancak dokümanlar kararlı olarak işaretlemediği sürece yeteneğe özel yardımcı yüzeyleri gelişmekte olan yüzeyler olarak ele alın. |

Yetenek kaydı amaçlanan yöndür. Geçiş sırasında dış Plugin'ler için eski kancalar en güvenli kırılmasız yol olmaya devam eder. Dışa aktarılan yardımcı alt yolların hepsi eşit değildir — rastlantısal yardımcı dışa aktarımları yerine dar kapsamlı belgelenmiş sözleşmeleri tercih edin.

### Plugin şekilleri

OpenClaw, yüklenen her Plugin'i gerçek kayıt davranışına göre bir şekle sınıflandırır (yalnızca statik meta verilere göre değil):

<AccordionGroup>
  <Accordion title="plain-capability">
    Tam olarak bir yetenek türü kaydeder (örneğin `mistral` gibi yalnızca sağlayıcı Plugin'i).
  </Accordion>
  <Accordion title="hybrid-capability">
    Birden fazla yetenek türü kaydeder (örneğin `openai` metin çıkarımı, konuşma, medya anlama ve görüntü üretimini sahiplenir).
  </Accordion>
  <Accordion title="hook-only">
    Yalnızca kancaları (tipli veya özel) kaydeder; yetenek, araç, komut veya servis kaydetmez.
  </Accordion>
  <Accordion title="non-capability">
    Araçlar, komutlar, servisler veya rotalar kaydeder, ancak yetenek kaydetmez.
  </Accordion>
</AccordionGroup>

Bir Plugin'in şeklini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI başvurusu](/tr/cli/plugins#inspect) bölümüne bakın.

### Eski kancalar

`before_agent_start` kancası, yalnızca-kanca Plugin'leri için uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya Plugin'leri hâlâ buna bağımlıdır.

Yön:

- çalışır halde tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işi için `before_model_resolve` tercih edin
- istem mutasyonu işi için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fikstür kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Yapılandırma sorunsuz ayrıştırılır ve Plugin'ler çözülür     |
| **compatibility advisory** | Plugin desteklenen ancak daha eski bir desen kullanır (örn. `hook-only`) |
| **legacy warning**         | Plugin, kullanımdan kaldırılmış olan `before_agent_start` kullanır |
| **hard error**             | Yapılandırma geçersizdir veya Plugin yüklenememiştir         |

Bugün ne `hook-only` ne de `before_agent_start` Plugin'inizi bozar: `hook-only` bilgilendiricidir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sisteminin dört katmanı vardır:

<Steps>
  <Step title="Manifest + keşif">
    OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden, global Plugin köklerinden ve paketlenmiş Plugin'lerden aday Plugin'leri bulur. Keşif önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen paket manifestlerini okur.
  </Step>
  <Step title="Etkinleştirme + doğrulama">
    Çekirdek, keşfedilen bir Plugin'in etkin, devre dışı, engellenmiş veya bellek gibi özel bir slot için seçilmiş olup olmadığına karar verir.
  </Step>
  <Step title="Çalışma zamanı yükleme">
    Yerel OpenClaw Plugin'leri süreç içinde yüklenir ve yetenekleri merkezi bir kayıt defterine kaydeder. Paketlenmiş JavaScript yerel `require` aracılığıyla yüklenir; üçüncü taraf yerel kaynak TypeScript ise acil durum Jiti geri dönüşüdür. Uyumlu paketler, çalışma zamanı kodu içe aktarılmadan kayıt kayıtlarına normalleştirilir.
  </Step>
  <Step title="Yüzey tüketimi">
    OpenClaw'ın geri kalanı, araçları, kanalları, sağlayıcı kurulumunu, kancaları, HTTP rotalarını, CLI komutlarını ve servisleri sunmak için kayıt defterini okur.
  </Step>
</Steps>

Özellikle Plugin CLI için kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verileri `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kayıt yapabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın ayrıştırmadan önce kök komut adlarını ayırmasına yine de olanak tanır.

Önemli tasarım sınırı:

- manifest/yapılandırma doğrulaması, Plugin kodunu çalıştırmadan **manifest/şema meta verilerinden** çalışmalıdır
- yerel yetenek keşfi, etkinleştirmeyen bir kayıt anlık görüntüsü oluşturmak için güvenilir Plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, Plugin modülünün `api.registrationMode === "full"` ile `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkin olmadan önce yapılandırmayı doğrulamasına, eksik/devre dışı Plugin'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Plugin meta veri anlık görüntüsü ve arama tablosu

Gateway başlangıcı, geçerli yapılandırma anlık görüntüsü için bir `PluginMetadataSnapshot` oluşturur. Anlık görüntü yalnızca meta veridir: kurulu Plugin dizinini, manifest kayıt defterini, manifest tanılarını, sahip haritalarını, bir Plugin kimliği normalleştiricisini ve manifest kayıtlarını depolar. Yüklenmiş Plugin modüllerini, sağlayıcı SDK'lerini, paket içeriklerini veya çalışma zamanı dışa aktarımlarını tutmaz.

Plugin farkındalıklı yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme ve Gateway Plugin önyüklemesi, manifest/dizin meta verilerini bağımsız olarak yeniden oluşturmak yerine bu anlık görüntüyü tüketir. `PluginLookUpTable` aynı anlık görüntüden türetilir ve geçerli çalışma zamanı yapılandırması için başlangıç Plugin planını ekler.

Başlangıçtan sonra Gateway geçerli meta veri anlık görüntüsünü değiştirilebilir bir çalışma zamanı ürünü olarak tutar. Yinelenen çalışma zamanı sağlayıcı keşfi, her sağlayıcı-katalog geçişi için kurulu dizini ve manifest kayıt defterini yeniden oluşturmak yerine bu anlık görüntüyü ödünç alabilir. Gateway kapatıldığında, yapılandırma/Plugin envanteri değiştiğinde ve kurulu dizin yazımlarında anlık görüntü temizlenir veya değiştirilir; uyumlu geçerli anlık görüntü yoksa çağıranlar soğuk manifest/dizin yoluna geri döner. Uyumluluk denetimleri `plugins.load.paths` ve varsayılan ajan çalışma alanı gibi Plugin keşif köklerini içermelidir, çünkü çalışma alanı Plugin'leri meta veri kapsamının parçasıdır.

Anlık görüntü ve arama tablosu, yinelenen başlangıç kararlarını hızlı yolda tutar:

- kanal sahipliği
- ertelenmiş kanal başlangıcı
- başlangıç Plugin kimlikleri
- sağlayıcı ve CLI arka uç sahipliği
- kurulum sağlayıcısı, komut takma adı, model katalog sağlayıcısı ve manifest sözleşmesi sahipliği
- Plugin yapılandırma şeması ve kanal yapılandırma şeması doğrulaması
- başlangıçta otomatik etkinleştirme kararları

Güvenlik sınırı mutasyon değil, anlık görüntü değişimidir. Yapılandırma, Plugin envanteri, kurulum kayıtları veya kalıcı dizin ilkesi değiştiğinde anlık görüntüyü yeniden oluşturun. Bunu geniş kapsamlı değiştirilebilir global kayıt defteri olarak ele almayın ve sınırsız geçmiş anlık görüntüler tutmayın. Çalışma zamanı Plugin yüklemesi meta veri anlık görüntülerinden ayrı kalır, böylece eski çalışma zamanı durumu bir meta veri önbelleğinin arkasına gizlenemez.

Önbellek kuralı [Plugin mimarisi iç işleyişi](/tr/plugins/architecture-internals#plugin-cache-boundary) içinde belgelenmiştir: bir çağıran geçerli akış için açık bir anlık görüntü, arama tablosu veya manifest kayıt defteri tutmadığı sürece manifest ve keşif meta verileri tazedir. Gizli meta veri önbellekleri ve duvar saati TTL'leri Plugin yüklemenin parçası değildir. Yalnızca çalışma zamanı yükleyici, modül ve bağımlılık-yapıt önbellekleri, kod veya kurulu yapıtlar gerçekten yüklendikten sonra kalıcı olabilir.

Bazı soğuk yol çağıranları hâlâ bir Gateway `PluginLookUpTable` almak yerine kalıcı kurulu Plugin dizininden doğrudan manifest kayıt defterlerini yeniden oluşturur. Bu yol artık kayıt defterini isteğe bağlı olarak yeniden oluşturur; bir çağıranda zaten varsa çalışma zamanı akışları boyunca geçerli arama tablosunu veya açık bir manifest kayıt defterini geçirmeyi tercih edin.

### Etkinleştirme planlama

Etkinleştirme planlama, kontrol düzleminin parçasıdır. Çağıranlar, daha geniş çalışma zamanı kayıt defterlerini yüklemeden önce somut bir komut, sağlayıcı, kanal, rota, ajan koşum takımı veya yetenek için hangi Plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı mevcut manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar manifest sahipliği geri dönüşü olarak kalır
- yalnızca id'lerden oluşan planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si neden etiketleri bildirir; böylece tanılamalar açık ipuçlarını sahiplik geri dönüşünden ayırt edebilir

<Warning>
`activation` alanını bir yaşam döngüsü hook'u ya da `register(...)` yerine geçen bir mekanizma olarak değerlendirmeyin. Yüklemeyi daraltmak için kullanılan metadata'dır. İlişkiyi zaten açıklıyorlarsa sahiplik alanlarını tercih edin; `activation` alanını yalnızca ek planlayıcı ipuçları için kullanın.
</Warning>

### Kanal Plugin'leri ve paylaşılan ileti aracı

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönderme/düzenleme/tepki aracı kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message` aracı tutar ve kanal Plugin'leri bunun arkasındaki kanala özgü keşif ve yürütmenin sahibidir.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç barındırıcısının, prompt bağlama düzeninin, oturum/iş parçacığı kayıtlarının ve yürütme dağıtımının sahibidir
- kanal Plugin'leri kapsamlı eylem keşfinin, yetenek keşfinin ve kanala özgü tüm şema parçalarının sahibidir
- kanal Plugin'leri, konuşma id'lerinin iş parçacığı id'lerini nasıl kodladığı veya üst konuşmalardan nasıl miras aldığı gibi sağlayıcıya özgü oturum konuşma dilbilgisinin sahibidir
- kanal Plugin'leri son eylemi kendi eylem adaptörleri üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi `ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema katkılarını birlikte döndürmesini sağlar; böylece bu parçalar birbirinden sapmaz.

Kanala özgü bir ileti aracı parametresi yerel yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında, Plugin ayrıca `describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek, Plugin'e ait parametre adlarını sabit kodlamadan sandbox yol normalleştirmesi ve giden medya erişimi ipuçlarını uygulamak için bu açık listeyi kullanır. Burada kanal genelinde tek bir düz liste yerine eylem kapsamlı haritaları tercih edin; böylece yalnızca profile ait bir medya parametresi `send` gibi ilgisiz eylemlerde normalleştirilmez.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunları içerir:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal, çekirdek `message` aracında kanala özgü dalları sabit kodlamadan etkin hesaba, geçerli odaya/iş parçacığına/iletiye veya güvenilir istekte bulunan kimliğine göre ileti eylemlerini gizleyebilir ya da gösterebilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı, mevcut sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur; böylece paylaşılan `message` aracı geçerli tur için doğru kanala ait yüzeyi gösterir.

Kanala ait yürütme yardımcıları için paketlenmiş Plugin'ler, yürütme çalışma zamanını kendi extension modüllerinin içinde tutmalıdır. Çekirdek artık `src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp ileti eylemi çalışma zamanlarının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan extension'a ait modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK dikişleri için de geçerlidir: çekirdek, Slack, Discord, Signal, WhatsApp veya benzer extension'lar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır. Çekirdeğin bir davranışa ihtiyacı varsa ya paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketin ya da ihtiyacı paylaşılan SDK içinde dar ve genel bir yeteneğe yükseltin.

Paketlenmiş Plugin'ler de aynı kuralı izler. Paketlenmiş bir Plugin'in `runtime-api.ts` dosyası kendi markalı `openclaw/plugin-sdk/<plugin-id>` facade'ını yeniden dışa aktarmamalıdır. Bu markalı facade'lar harici Plugin'ler ve eski tüketiciler için uyumluluk shim'leri olarak kalır; ancak paketlenmiş Plugin'ler yerel dışa aktarımları ve `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` veya `openclaw/plugin-sdk/webhook-ingress` gibi dar genel SDK alt yollarını kullanmalıdır. Mevcut bir harici ekosistem için uyumluluk sınırı gerektirmedikçe yeni kod Plugin id'ye özgü SDK facade'ları eklememelidir.

Anketler özelinde iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını Plugin anket dağıtımı eylemi reddedene kadar erteler; böylece Plugin'e ait anket işleyicileri, önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw yerel bir Plugin'i, ilgisiz entegrasyonlardan oluşan bir torba olarak değil, bir **şirket** veya bir **özellik** için sahiplik sınırı olarak değerlendirir.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin'i genellikle tanıttığı tam özellik yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını gelişigüzel yeniden uygulamak yerine paylaşılan çekirdek yetenekleri tüketmelidir

<AccordionGroup>
  <Accordion title="Tedarikçi çoklu yetenek">
    `openai` metin çıkarımı, konuşma, gerçek zamanlı ses, medya anlama ve görüntü üretiminin sahibidir. `google` metin çıkarımının yanı sıra medya anlama, görüntü üretimi ve web aramasının sahibidir. `qwen` metin çıkarımının yanı sıra medya anlama ve video üretiminin sahibidir.
  </Accordion>
  <Accordion title="Tedarikçi tekil yetenek">
    `elevenlabs` ve `microsoft` konuşmanın; `firecrawl` web-getirme işleminin; `minimax` / `mistral` / `moonshot` / `zai` medya anlama arka uçlarının sahibidir.
  </Accordion>
  <Accordion title="Özellik Plugin'i">
    `voice-call` çağrı taşımasının, araçların, CLI'nin, rotaların ve Twilio media-stream köprülemesinin sahibidir; ancak tedarikçi Plugin'lerini doğrudan içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir.
  </Accordion>
</AccordionGroup>

Amaçlanan son durum şudur:

- OpenAI metin modelleri, konuşma, görüntüler ve gelecekteki videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir tedarikçi kendi yüzey alanı için aynı şeyi yapabilir
- kanallar sağlayıcının hangi tedarikçi Plugin'ine ait olduğunu önemsemez; çekirdek tarafından sunulan paylaşılan yetenek sözleşmesini tüketir

Temel ayrım budur:

- **Plugin** = sahiplik sınırı
- **yetenek** = birden çok Plugin'in uygulayabildiği veya tüketebildiği çekirdek sözleşme

Bu nedenle OpenClaw video gibi yeni bir alan eklerse ilk soru "hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru "çekirdek video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme var olduktan sonra tedarikçi Plugin'leri buna karşı kayıt yapabilir ve kanal/özellik Plugin'leri bunu tüketebilir.

Yetenek henüz yoksa doğru hamle genellikle şudur:

<Steps>
  <Step title="Yeteneği tanımlayın">
    Eksik yeteneği çekirdekte tanımlayın.
  </Step>
  <Step title="SDK üzerinden sunun">
    Bunu Plugin API/çalışma zamanı üzerinden tipli bir şekilde sunun.
  </Step>
  <Step title="Tüketicileri bağlayın">
    Kanalları/özellikleri bu yeteneğe bağlayın.
  </Step>
  <Step title="Tedarikçi uygulamaları">
    Tedarikçi Plugin'lerinin uygulamaları kaydetmesine izin verin.
  </Step>
</Steps>

Bu, tek bir tedarikçiye veya tek seferlik Plugin'e özgü kod yoluna bağlı çekirdek davranışından kaçınırken sahipliği açık tutar.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

<Tabs>
  <Tab title="Çekirdek yetenek katmanı">
    Paylaşılan orkestrasyon, policy, geri dönüş, config birleştirme kuralları, teslim semantiği ve tipli sözleşmeler.
  </Tab>
  <Tab title="Tedarikçi Plugin katmanı">
    Tedarikçiye özgü API'ler, auth, model katalogları, konuşma sentezi, görüntü üretimi, gelecekteki video arka uçları, kullanım uç noktaları.
  </Tab>
  <Tab title="Kanal/özellik Plugin katmanı">
    Çekirdek yetenekleri tüketen ve bunları bir yüzeyde sunan Slack/Discord/voice-call/etc. entegrasyonu.
  </Tab>
</Tabs>

Örneğin TTS şu şekli izler:

- çekirdek yanıt zamanı TTS policy'sinin, geri dönüş sırasının, prefs'in ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft` sentez uygulamalarının sahibidir
- `voice-call` telefon TTS çalışma zamanı yardımcısını tüketir

Gelecekteki yetenekler için aynı kalıp tercih edilmelidir.

### Çoklu yetenek şirket Plugin'i örneği

Bir şirket Plugin'i dışarıdan tutarlı hissettirmelidir. OpenClaw modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi, web getirme ve web araması için paylaşılan sözleşmelere sahipse, bir tedarikçi tüm yüzeylerinin sahibi tek bir yerde olabilir:

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

Önemli olan tam yardımcı adları değildir. Önemli olan şekildir:

- bir Plugin tedarikçi yüzeyinin sahibidir
- çekirdek hâlâ yetenek sözleşmelerinin sahibidir
- kanallar ve özellik Plugin'leri tedarikçi kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahibi olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw görüntü/ses/video anlamayı zaten tek bir paylaşılan yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

<Steps>
  <Step title="Çekirdek sözleşmeyi tanımlar">
    Çekirdek medya anlama sözleşmesini tanımlar.
  </Step>
  <Step title="Tedarikçi Plugin'leri kaydeder">
    Tedarikçi Plugin'leri uygun olduğunda `describeImage`, `transcribeAudio` ve `describeVideo` kaydeder.
  </Step>
  <Step title="Tüketiciler paylaşılan davranışı kullanır">
    Kanallar ve özellik Plugin'leri doğrudan tedarikçi koduna bağlanmak yerine paylaşılan çekirdek davranışı tüketir.
  </Step>
</Steps>

Bu, tek bir sağlayıcının video varsayımlarını çekirdeğe gömmeyi önler. Plugin tedarikçi yüzeyinin sahibidir; çekirdek yetenek sözleşmesinin ve geri dönüş davranışının sahibidir.

Video üretimi zaten aynı sırayı kullanır: çekirdek tipli yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir; tedarikçi Plugin'leri de buna karşı `api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir kullanıma alma kontrol listesi mi gerekiyor? [Yetenek Rehberi](/tr/plugins/adding-capabilities) bölümüne bakın.

## Sözleşmeler ve uygulama

Plugin API yüzeyi, `OpenClawPluginApi` içinde bilinçli olarak tipli ve merkezidir. Bu sözleşme, desteklenen kayıt noktalarını ve bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun neden önemli olduğu:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, aynı sağlayıcı id'sini kaydeden iki Plugin gibi yinelenen sahipliği reddedebilir
- başlangıç, hatalı biçimlendirilmiş kayıt için uygulanabilir tanılamalar gösterebilir
- sözleşme testleri paketlenmiş Plugin sahipliğini zorlayabilir ve sessiz sapmayı önleyebilir

İki uygulama katmanı vardır:

<AccordionGroup>
  <Accordion title="Çalışma zamanı kaydı zorlaması">
    Plugin kayıt defteri, Plugin'ler yüklenirken kayıtları doğrular. Örnekler: yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve hatalı biçimlendirilmiş kayıtlar, tanımsız davranış yerine Plugin tanılamaları üretir.
  </Accordion>
  <Accordion title="Sözleşme testleri">
    Paketle birlikte gelen Plugin'ler, test çalıştırmaları sırasında sözleşme kayıt defterlerinde yakalanır; böylece OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu, model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketle birlikte gelen kayıt sahipliği için kullanılır.
  </Accordion>
</AccordionGroup>

Pratik etkisi, OpenClaw'ın hangi yüzeyin hangi Plugin'e ait olduğunu baştan bilmesidir. Bu, sahiplik örtük olmak yerine bildirilmiş, tipli ve test edilebilir olduğu için çekirdek ile kanalların sorunsuzca birleşmesini sağlar.

### Bir sözleşmede neler bulunmalı

<Tabs>
  <Tab title="İyi sözleşmeler">
    - tipli
    - küçük
    - yeteneğe özgü
    - çekirdek tarafından sahiplenilen
    - birden fazla Plugin tarafından yeniden kullanılabilir
    - kanallar/özellikler tarafından satıcı bilgisi olmadan tüketilebilir

  </Tab>
  <Tab title="Kötü sözleşmeler">
    - çekirdekte gizlenmiş satıcıya özgü politika
    - kayıt defterini atlayan tek seferlik Plugin kaçış kapıları
    - doğrudan bir satıcı uygulamasına erişen kanal kodu
    - `OpenClawPluginApi` veya `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

  </Tab>
</Tabs>

Şüphe duyduğunuzda soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, ardından Plugin'lerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin'leri Gateway ile **işlem içinde** çalışır. Bunlar korumalı alana alınmaz. Yüklenmiş bir yerel Plugin, çekirdek kodla aynı süreç düzeyinde güven sınırına sahiptir.

<Warning>
Yerel Plugin etkileri: Bir Plugin araçlar, ağ işleyicileri, kancalar ve hizmetler kaydedebilir; bir Plugin hatası Gateway'in çökmesine veya kararsızlaşmasına neden olabilir; kötü amaçlı bir yerel Plugin ise OpenClaw süreci içinde rastgele kod yürütmeye eşdeğerdir.
</Warning>

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda bunları meta veri/içerik paketleri olarak ele alır. Geçerli sürümlerde bu çoğunlukla paketle birlikte gelen Skills anlamına gelir.

Paketle birlikte gelmeyen Plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Plugin'lerini üretim varsayılanları değil, geliştirme zamanı kodu olarak ele alın.

Paketle birlikte gelen çalışma alanı paket adları için Plugin kimliğini npm adına sabitleyin: varsayılan olarak `@openclaw/<id>` veya paket kasıtlı olarak daha dar bir Plugin rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding` gibi onaylı tipli bir sonek.

<Note>
**Güven notu:** `plugins.allow`, kaynak kökenine değil **Plugin kimliklerine** güvenir. Paketle birlikte gelen bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin'i, o çalışma alanı Plugin'i etkinleştirildiğinde/izin listesine alındığında paketle birlikte gelen kopyayı kasıtlı olarak gölgeler. Bu normaldir ve yerel geliştirme, yama testi ve acil düzeltmeler için kullanışlıdır. Paketle birlikte gelen Plugin güveni, kurulum meta verilerinden değil, yükleme zamanındaki kaynak anlık görüntüsünden — diskteki manifest ve koddan — çözümlenir. Bozulmuş veya değiştirilmiş bir kurulum kaydı, paketle birlikte gelen bir Plugin'in güven yüzeyini gerçek kaynağın iddia ettiğinin ötesine sessizce genişletemez.
</Note>

## Dışa aktarma sınırı

OpenClaw uygulama kolaylığı değil, yetenekleri dışa aktarır.

Yetenek kaydını herkese açık tutun. Sözleşme olmayan yardımcı dışa aktarımları budayın:

- paketle birlikte gelen Plugin'e özgü yardımcı alt yollar
- herkese açık API olarak amaçlanmayan çalışma zamanı tesisatı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/başlatma yardımcıları

Ayrılmış, paketle birlikte gelen Plugin yardımcı alt yolları oluşturulan SDK dışa aktarma haritasından kaldırılmıştır. Sahibe özgü yardımcıları sahip Plugin paketinin içinde tutun; yalnızca yeniden kullanılabilir ana makine davranışını `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmelerine yükseltin.

## Dahili ayrıntılar ve başvuru

Yükleme hattı, kayıt defteri modeli, sağlayıcı çalışma zamanı kancaları, Gateway HTTP rotaları, mesaj aracı şemaları, kanal hedef çözümleme, sağlayıcı katalogları, bağlam motoru Plugin'leri ve yeni bir yetenek ekleme kılavuzu için bkz. [Plugin mimarisi dahili ayrıntıları](/tr/plugins/architecture-internals).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
