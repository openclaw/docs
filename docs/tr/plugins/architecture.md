---
read_when:
    - Yerel OpenClaw Plugin'lerini derleme veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme işlem hattı veya kayıt defteri üzerinde çalışma
    - Sağlayıcı çalışma zamanı kancalarını veya kanal Plugin'lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç işleyişi: yetenek modeli, sahiplik, sözleşmeler, yükleme işlem hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapısı
x-i18n:
    generated_at: "2026-05-02T09:00:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Bu, OpenClaw Plugin sistemi için **derin mimari başvurusudur**. Pratik kılavuzlar için aşağıdaki odaklı sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugin'leri kurma ve kullanma" icon="plug" href="/tr/tools/plugin">
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

Yetenekler, OpenClaw içindeki herkese açık **yerel Plugin** modelidir. Her yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne göre kaydolur:

| Yetenek                | Kayıt yöntemi                                    | Örnek Plugin'ler                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Metin çıkarımı         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Konuşma                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Görüntü üretimi        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi          | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video üretimi          | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web getirme            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web arama              | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway keşfi          | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Sıfır yetenek kaydeden ancak hook'lar, araçlar, keşif servisleri veya arka plan servisleri sağlayan bir Plugin, **eski yalnızca hook** Plugin'idir. Bu kalıp hâlâ tam olarak desteklenir.
</Note>

### Harici uyumluluk yaklaşımı

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel Plugin'ler tarafından kullanılır, ancak harici Plugin uyumluluğu hâlâ "dışa aktarılmışsa donmuştur" ifadesinden daha sıkı bir çıta gerektirir.

| Plugin durumu                                    | Rehberlik                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mevcut harici Plugin'ler                         | Hook tabanlı entegrasyonları çalışır tutun; uyumluluk tabanı budur.                              |
| Yeni paketlenmiş/yerel Plugin'ler                | Satıcıya özel iç erişimler veya yeni yalnızca hook tasarımları yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen harici Plugin'ler     | İzin verilir, ancak belgeler kararlı olarak işaretlemedikçe yeteneğe özel yardımcı yüzeyleri gelişen yüzeyler olarak ele alın. |

Yetenek kaydı amaçlanan yöndür. Geçiş sırasında harici Plugin'ler için eski hook'lar, kırılma oluşturmayan en güvenli yol olmaya devam eder. Dışa aktarılan yardımcı alt yolların hepsi eşit değildir — rastlantısal yardımcı dışa aktarımlar yerine dar kapsamlı belgelenmiş sözleşmeleri tercih edin.

### Plugin biçimleri

OpenClaw, yüklenen her Plugin'i gerçek kayıt davranışına göre bir biçime sınıflandırır (yalnızca statik meta verilere göre değil):

<AccordionGroup>
  <Accordion title="plain-capability">
    Tam olarak bir yetenek türü kaydeder (örneğin `mistral` gibi yalnızca sağlayıcı olan bir Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    Birden çok yetenek türü kaydeder (örneğin `openai`; metin çıkarımı, konuşma, medya anlama ve görüntü üretiminin sahibidir).
  </Accordion>
  <Accordion title="hook-only">
    Yalnızca hook'lar kaydeder (tipli veya özel); yetenek, araç, komut ya da servis kaydetmez.
  </Accordion>
  <Accordion title="non-capability">
    Araçlar, komutlar, servisler veya rotalar kaydeder ancak yetenek kaydetmez.
  </Accordion>
</AccordionGroup>

Bir Plugin'in biçimini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI başvurusu](/tr/cli/plugins#inspect) bölümüne bakın.

### Eski hook'lar

`before_agent_start` hook'u, yalnızca hook Plugin'leri için uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya Plugin'leri hâlâ buna bağlıdır.

Yön:

- çalışır tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işi için `before_model_resolve` tercih edin
- istem değiştirme işi için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **config geçerli**         | Config düzgün ayrıştırılır ve Plugin'ler çözümlenir          |
| **uyumluluk önerisi**      | Plugin desteklenen ama daha eski bir kalıp kullanıyor (örn. `hook-only`) |
| **eski uyarısı**           | Plugin kullanımdan kaldırılmış olan `before_agent_start` kullanıyor |
| **sert hata**              | Config geçersiz veya Plugin yüklenemedi                      |

Bugün ne `hook-only` ne de `before_agent_start` Plugin'inizi bozar: `hook-only` öneri niteliğindedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimari genel bakışı

OpenClaw'ın Plugin sistemi dört katmana sahiptir:

<Steps>
  <Step title="Manifest + keşif">
    OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden, genel Plugin köklerinden ve paketlenmiş Plugin'lerden aday Plugin'leri bulur. Keşif önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen bundle manifestlerini okur.
  </Step>
  <Step title="Etkinleştirme + doğrulama">
    Çekirdek, keşfedilen bir Plugin'in etkin mi, devre dışı mı, engellenmiş mi yoksa bellek gibi özel bir yuva için seçilmiş mi olduğuna karar verir.
  </Step>
  <Step title="Çalışma zamanı yükleme">
    Yerel OpenClaw Plugin'leri süreç içinde yüklenir ve yetenekleri merkezi bir kayıt defterine kaydeder. Paketlenmiş JavaScript yerel `require` üzerinden yüklenir; üçüncü taraf yerel kaynak TypeScript acil durum Jiti geri dönüşüdür. Uyumlu bundle'lar çalışma zamanı kodu içe aktarılmadan kayıt kayıtlarına normalleştirilir.
  </Step>
  <Step title="Yüzey tüketimi">
    OpenClaw'ın geri kalanı araçları, kanalları, sağlayıcı kurulumunu, hook'ları, HTTP rotalarını, CLI komutlarını ve servisleri sunmak için kayıt defterini okur.
  </Step>
</Steps>

Özellikle Plugin CLI için kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın ayrıştırmadan önce kök komut adlarını ayırmasına yine de olanak tanır.

Önemli tasarım sınırı:

- manifest/config doğrulaması, Plugin kodu çalıştırılmadan **manifest/şema meta verilerinden** çalışmalıdır
- yerel yetenek keşfi, etkinleştirmeyen bir kayıt defteri snapshot'ı oluşturmak için güvenilir Plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, Plugin modülünün `api.registrationMode === "full"` ile `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkin olmadan önce config'i doğrulamasına, eksik/devre dışı Plugin'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Plugin meta veri snapshot'ı ve arama tablosu

Gateway başlangıcı, geçerli config snapshot'ı için bir `PluginMetadataSnapshot` oluşturur. Snapshot yalnızca meta veridir: kurulu Plugin dizinini, manifest kayıt defterini, manifest tanılamalarını, sahip haritalarını, bir Plugin id normalleştiricisini ve manifest kayıtlarını saklar. Yüklenmiş Plugin modüllerini, sağlayıcı SDK'larını, paket içeriklerini veya çalışma zamanı dışa aktarımlarını tutmaz.

Plugin farkındalıklı config doğrulaması, başlangıçta otomatik etkinleştirme ve Gateway Plugin bootstrap'i, manifest/dizin meta verilerini bağımsız olarak yeniden oluşturmak yerine bu snapshot'ı tüketir. `PluginLookUpTable` aynı snapshot'tan türetilir ve geçerli çalışma zamanı config'i için başlangıç Plugin planını ekler.

Başlangıçtan sonra Gateway, geçerli meta veri snapshot'ını değiştirilebilir bir çalışma zamanı ürünü olarak tutar. Tekrarlanan çalışma zamanı sağlayıcı keşfi, her sağlayıcı kataloğu geçişi için kurulu dizini ve manifest kayıt defterini yeniden oluşturmak yerine bu snapshot'ı ödünç alabilir. Snapshot, Gateway kapatıldığında, config/Plugin envanteri değiştiğinde ve kurulu dizin yazımlarında temizlenir veya değiştirilir; uyumlu geçerli snapshot olmadığında çağıranlar soğuk manifest/dizin yoluna geri döner. Uyumluluk denetimleri `plugins.load.paths` ve varsayılan ajan çalışma alanı gibi Plugin keşif köklerini içermelidir, çünkü çalışma alanı Plugin'leri meta veri kapsamının parçasıdır.

Snapshot ve arama tablosu, tekrarlanan başlangıç kararlarını hızlı yolda tutar:

- kanal sahipliği
- ertelenmiş kanal başlangıcı
- başlangıç Plugin id'leri
- sağlayıcı ve CLI arka uç sahipliği
- kurulum sağlayıcısı, komut takma adı, model kataloğu sağlayıcısı ve manifest sözleşmesi sahipliği
- Plugin config şeması ve kanal config şeması doğrulaması
- başlangıçta otomatik etkinleştirme kararları

Güvenlik sınırı mutasyon değil, snapshot değişimidir. Config, Plugin envanteri, kurulum kayıtları veya kalıcı dizin ilkesi değiştiğinde snapshot'ı yeniden oluşturun. Onu geniş kapsamlı değiştirilebilir global kayıt defteri olarak ele almayın ve sınırsız geçmiş snapshot'lar tutmayın. Çalışma zamanı Plugin yüklemesi meta veri snapshot'larından ayrı kalır; böylece eski çalışma zamanı durumu bir meta veri önbelleğinin arkasında gizlenemez.

Önbellek kuralı [Plugin mimarisi iç ayrıntıları](/tr/plugins/architecture-internals#plugin-cache-boundary) içinde belgelenmiştir: bir çağıran geçerli akış için açık bir snapshot, arama tablosu veya manifest kayıt defteri tutmadığı sürece manifest ve keşif meta verileri tazedir. Gizli meta veri önbellekleri ve duvar saati TTL'leri Plugin yüklemenin parçası değildir. Yalnızca çalışma zamanı yükleyici, modül ve bağımlılık yapıtı önbellekleri, kod veya kurulu yapıtlar gerçekten yüklendikten sonra kalıcı olabilir.

Bazı soğuk yol çağırıcıları hâlâ bir Gateway `PluginLookUpTable` almak yerine kalıcı kurulu Plugin dizininden manifest kayıt defterlerini doğrudan yeniden oluşturur. Bu yol artık kayıt defterini ihtiyaç anında yeniden oluşturur; bir çağıranın zaten sahip olduğu durumlarda geçerli arama tablosunu veya açık bir manifest kayıt defterini çalışma zamanı akışlarından geçirmeyi tercih edin.

### Etkinleştirme planlaması

Etkinleştirme planlaması kontrol düzleminin parçasıdır. Çağıranlar, daha geniş çalışma zamanı kayıt defterlerini yüklemeden önce somut bir komut, sağlayıcı, kanal, rota, ajan donanımı veya yetenekle hangi Plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı, geçerli manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar manifest sahipliği geri dönüşü olarak kalır
- yalnızca id'ler planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si neden etiketlerini bildirir; böylece tanılamalar açık ipuçlarını sahiplik geri dönüşünden ayırt edebilir

<Warning>
`activation` öğesini bir yaşam döngüsü hook'u veya `register(...)` yerine geçen bir şey olarak ele almayın. Yüklemeyi daraltmak için kullanılan metadata'dır. İlişkiyi zaten açıklıyorsa sahiplik alanlarını tercih edin; `activation` öğesini yalnızca ek planlayıcı ipuçları için kullanın.
</Warning>

### Kanal Plugin'leri ve paylaşılan mesaj aracı

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönderme/düzenleme/tepki aracı kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message` aracı tutar ve kanal Plugin'leri bunun arkasındaki kanala özgü keşif ve yürütmenin sahibi olur.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` aracı ana makinesinin, prompt kablolamasının, oturum/iş parçacığı defter tutmanın ve yürütme dağıtımının sahibidir
- kanal Plugin'leri kapsamlı eylem keşfinin, yetenek keşfinin ve kanala özgü şema parçalarının sahibidir
- kanal Plugin'leri, konuşma kimliklerinin iş parçacığı kimliklerini nasıl kodladığı veya üst konuşmalardan nasıl devraldığı gibi sağlayıcıya özgü oturum konuşma gramerinin sahibidir
- kanal Plugin'leri son eylemi kendi eylem adaptörleri üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi `ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir Plugin'in görünür eylemlerini, yeteneklerini ve şema katkılarını birlikte döndürmesini sağlar; böylece bu parçalar birbirinden sapmaz.

Kanala özgü bir mesaj aracı parametresi yerel yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında, Plugin ayrıca `describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek, Plugin'e ait parametre adlarını sabit kodlamadan sandbox yol normalleştirmesi ve giden medya erişimi ipuçlarını uygulamak için bu açık listeyi kullanır. Burada kanal genelinde tek bir düz liste yerine eylem kapsamlı eşlemeleri tercih edin; böylece yalnızca profile özgü bir medya parametresi, `send` gibi ilgisiz eylemlerde normalleştirilmez.

Çekirdek, bu keşif adımına çalışma zamanı kapsamını geçirir. Önemli alanlar şunları içerir:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilen gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal, çekirdek `message` aracında kanala özgü dalları sabit kodlamadan etkin hesaba, geçerli odaya/iş parçacığına/mesaja veya güvenilen istekte bulunan kimliğine göre mesaj eylemlerini gizleyebilir ya da gösterebilir.

Bu nedenle embedded-runner yönlendirme değişiklikleri hâlâ Plugin işidir: runner, paylaşılan `message` aracının geçerli tur için doğru kanal sahipliğindeki yüzeyi göstermesi amacıyla geçerli sohbet/oturum kimliğini Plugin keşif sınırına iletmekten sorumludur.

Kanal sahipliğindeki yürütme yardımcıları için paketlenmiş Plugin'ler, yürütme çalışma zamanını kendi extension modüllerinin içinde tutmalıdır. Çekirdek artık `src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj eylemi çalışma zamanlarının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamayız ve paketlenmiş Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan extension sahipliğindeki modüllerinden içe aktarmalıdır.

Aynı sınır, genel olarak sağlayıcı adlandırmalı SDK arayüzleri için de geçerlidir: çekirdek Slack, Discord, Signal, WhatsApp veya benzer extension'lar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır. Çekirdeğin bir davranışa ihtiyacı varsa ya paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketmeli ya da ihtiyacı paylaşılan SDK içinde dar bir genel yeteneğe yükseltmelidir.

Paketlenmiş Plugin'ler de aynı kuralı izler. Paketlenmiş bir Plugin'in `runtime-api.ts` dosyası, kendi markalı `openclaw/plugin-sdk/<plugin-id>` cephesini yeniden dışa aktarmamalıdır. Bu markalı cepheler harici Plugin'ler ve eski tüketiciler için uyumluluk shim'leri olarak kalır, ancak paketlenmiş Plugin'ler yerel dışa aktarımları ve `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` veya `openclaw/plugin-sdk/webhook-ingress` gibi dar genel SDK alt yollarını kullanmalıdır. Yeni kod, mevcut bir harici ekosistem için uyumluluk sınırı gerektirmedikçe Plugin kimliğine özgü SDK cepheleri eklememelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temeldir
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket dağıtımı eylemi reddedene kadar erteler; böylece Plugin sahipliğindeki anket işleyicileri, önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlatma sırası için [Plugin mimarisi iç detayları](/tr/plugins/architecture-internals) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, native bir Plugin'i ilgisiz entegrasyonlardan oluşan bir torba olarak değil, bir **şirket** veya bir **özellik** için sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin'i genellikle tanıttığı tam özellik yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını özel olarak yeniden uygulamak yerine paylaşılan çekirdek yetenekleri tüketmelidir

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` metin çıkarımı, konuşma, gerçek zamanlı ses, medya anlama ve görüntü oluşturmanın sahibidir. `google` metin çıkarımının yanı sıra medya anlama, görüntü oluşturma ve web aramasının sahibidir. `qwen` metin çıkarımının yanı sıra medya anlama ve video oluşturmanın sahibidir.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` ve `microsoft` konuşmanın sahibidir; `firecrawl` web getirme işleminin sahibidir; `minimax` / `mistral` / `moonshot` / `zai` medya anlama backend'lerinin sahibidir.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` çağrı taşımasının, araçların, CLI'ın, rotaların ve Twilio medya akışı köprülemesinin sahibidir; ancak vendor Plugin'lerini doğrudan içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir.
  </Accordion>
</AccordionGroup>

Amaçlanan nihai durum şudur:

- OpenAI metin modellerini, konuşmayı, görüntüleri ve gelecekteki videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir vendor kendi yüzey alanı için aynı şeyi yapabilir
- kanallar sağlayıcının hangi vendor Plugin'ine ait olduğunu önemsemez; çekirdek tarafından sunulan paylaşılan yetenek sözleşmesini tüketir

Temel ayrım şudur:

- **plugin** = sahiplik sınırı
- **capability** = birden çok Plugin'in uygulayabileceği veya tüketebileceği çekirdek sözleşme

Bu nedenle OpenClaw video gibi yeni bir domain eklerse, ilk soru "hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru "çekirdek video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme var olduğunda, vendor Plugin'leri buna kaydolabilir ve kanal/özellik Plugin'leri bunu tüketebilir.

Yetenek henüz yoksa, doğru hamle genellikle şudur:

<Steps>
  <Step title="Define the capability">
    Eksik yeteneği çekirdekte tanımlayın.
  </Step>
  <Step title="Expose through the SDK">
    Bunu Plugin API/çalışma zamanı üzerinden tipli şekilde sunun.
  </Step>
  <Step title="Wire consumers">
    Kanalları/özellikleri bu yeteneğe bağlayın.
  </Step>
  <Step title="Vendor implementations">
    Vendor Plugin'lerinin uygulamaları kaydetmesine izin verin.
  </Step>
</Steps>

Bu, tek bir vendor'a veya tek seferlik Plugin'e özgü bir kod yoluna bağlı çekirdek davranışından kaçınırken sahipliği açık tutar.

### Yetenek katmanları

Kodun nereye ait olduğuna karar verirken bu zihinsel modeli kullanın:

<Tabs>
  <Tab title="Core capability layer">
    Paylaşılan orkestrasyon, politika, fallback, yapılandırma birleştirme kuralları, teslim semantiği ve tipli sözleşmeler.
  </Tab>
  <Tab title="Vendor plugin layer">
    Vendor'a özgü API'ler, kimlik doğrulama, model katalogları, konuşma sentezi, görüntü oluşturma, gelecekteki video backend'leri, kullanım uç noktaları.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Çekirdek yetenekleri tüketen ve bunları bir yüzeyde sunan Slack/Discord/voice-call/vb. entegrasyonu.
  </Tab>
</Tabs>

Örneğin TTS şu şekli izler:

- çekirdek yanıt zamanı TTS politikasının, fallback sırasının, tercihlerin ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft` sentez uygulamalarının sahibidir
- `voice-call`, telefoni TTS çalışma zamanı yardımcısını tüketir

Gelecekteki yetenekler için de aynı kalıp tercih edilmelidir.

### Çok yetenekli şirket Plugin örneği

Bir şirket Plugin'i dışarıdan bakıldığında bütünlüklü hissettirmelidir. OpenClaw modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme ve web araması için paylaşılan sözleşmelere sahipse, bir vendor tüm yüzeylerini tek bir yerde sahiplenebilir:

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

- vendor yüzeyinin sahibi tek bir Plugin'dir
- çekirdek hâlâ yetenek sözleşmelerinin sahibidir
- kanallar ve özellik Plugin'leri vendor kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görüntü/ses/video anlamayı tek bir paylaşılan yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

<Steps>
  <Step title="Core defines the contract">
    Çekirdek medya anlama sözleşmesini tanımlar.
  </Step>
  <Step title="Vendor plugins register">
    Vendor Plugin'leri uygun olduğunda `describeImage`, `transcribeAudio` ve `describeVideo` kaydeder.
  </Step>
  <Step title="Consumers use the shared behavior">
    Kanallar ve özellik Plugin'leri doğrudan vendor koduna bağlanmak yerine paylaşılan çekirdek davranışı tüketir.
  </Step>
</Steps>

Bu, tek bir sağlayıcının video varsayımlarını çekirdeğe gömmekten kaçınır. Plugin vendor yüzeyinin sahibidir; çekirdek yetenek sözleşmesinin ve fallback davranışının sahibidir.

Video oluşturma zaten aynı sırayı kullanır: çekirdek tipli yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir; vendor Plugin'leri de buna karşı `api.registerVideoGenerationProvider(...)` uygulamalarını kaydeder.

Somut bir dağıtım kontrol listesi mi gerekiyor? [Yetenek Cookbook](/tr/plugins/architecture) bölümüne bakın.

## Sözleşmeler ve yaptırım

Plugin API yüzeyi kasıtlı olarak tipli ve `OpenClawPluginApi` içinde merkezîdir. Bu sözleşme, desteklenen kayıt noktalarını ve bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun neden önemli olduğu:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, iki Plugin'in aynı sağlayıcı kimliğini kaydetmesi gibi yinelenen sahipliği reddedebilir
- başlatma, hatalı biçimlendirilmiş kayıt için eyleme geçirilebilir tanılamalar gösterebilir
- sözleşme testleri paketlenmiş Plugin sahipliğini zorunlu kılabilir ve sessiz sapmayı önleyebilir

İki yaptırım katmanı vardır:

<AccordionGroup>
  <Accordion title="Çalışma zamanı kayıt zorlaması">
    Plugin kayıt defteri, pluginler yüklenirken kayıtları doğrular. Örnekler: yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcısı kimlikleri ve hatalı biçimlendirilmiş kayıtlar, tanımsız davranış yerine plugin tanıları üretir.
  </Accordion>
  <Accordion title="Sözleşme testleri">
    Paketlenmiş pluginler, test çalışmaları sırasında sözleşme kayıt defterlerinde yakalanır; böylece OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu; model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt sahipliği için kullanılır.
  </Accordion>
</AccordionGroup>

Pratik etkisi, OpenClaw'ın hangi yüzeyin hangi plugine ait olduğunu baştan bilmesidir. Bu, çekirdek ve kanalların sorunsuz biçimde birleşmesini sağlar; çünkü sahiplik örtük değil, beyan edilmiş, tiplendirilmiş ve test edilebilir durumdadır.

### Bir sözleşmede neler bulunmalı

<Tabs>
  <Tab title="İyi sözleşmeler">
    - tiplendirilmiş
    - küçük
    - yeteneğe özgü
    - çekirdek tarafından sahiplenilen
    - birden çok plugin tarafından yeniden kullanılabilir
    - satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

  </Tab>
  <Tab title="Kötü sözleşmeler">
    - çekirdekte gizlenmiş satıcıya özgü ilke
    - kayıt defterini atlayan tek seferlik plugin kaçış yolları
    - doğrudan bir satıcı uygulamasına erişen kanal kodu
    - `OpenClawPluginApi` veya `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

  </Tab>
</Tabs>

Emin olmadığınızda soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, ardından pluginlerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw pluginleri Gateway ile **işlem içinde** çalışır. Sandbox içinde değildirler. Yüklenmiş bir yerel plugin, çekirdek kodla aynı işlem düzeyi güven sınırına sahiptir.

<Warning>
Yerel plugin sonuçları: bir plugin araçlar, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir; bir plugin hatası gateway'i çökertebilir veya kararsız hale getirebilir; kötü amaçlı bir yerel plugin ise OpenClaw işlemi içinde rastgele kod yürütmeye eşdeğerdir.
</Warning>

Uyumlu paketler varsayılan olarak daha güvenlidir, çünkü OpenClaw şu anda bunları metadata/içerik paketleri olarak ele alır. Geçerli sürümlerde bu çoğunlukla paketlenmiş Skills anlamına gelir.

Paketlenmemiş pluginler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı pluginlerini üretim varsayılanları olarak değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için plugin kimliğini npm adına sabitleyin: varsayılan olarak `@openclaw/<id>` ya da paket özellikle daha dar bir plugin rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi onaylı tiplendirilmiş bir sonek kullanın.

<Note>
**Güven notu:** `plugins.allow`, kaynak kökenine değil **plugin kimliklerine** güvenir. Paketlenmiş bir plugin ile aynı kimliğe sahip bir çalışma alanı plugini, bu çalışma alanı plugini etkinleştirildiğinde/izin listesine alındığında paketlenmiş kopyayı bilinçli olarak gölgeler. Bu, yerel geliştirme, yama testi ve hotfix'ler için normal ve kullanışlıdır. Paketlenmiş-plugin güveni, kurulum metadatasından değil, kaynak anlık görüntüsünden — yükleme anında diskte bulunan manifest ve koddan — çözümlenir. Bozulmuş veya değiştirilmiş bir kurulum kaydı, paketlenmiş bir pluginin güven yüzeyini gerçek kaynağın beyan ettiğinin ötesine sessizce genişletemez.
</Note>

## Dışa aktarım sınırı

OpenClaw, uygulama kolaylığı değil yetenekleri dışa aktarır.

Yetenek kaydını herkese açık tutun. Sözleşme dışı yardımcı dışa aktarımları budayın:

- paketlenmiş-plugine özgü yardımcı alt yollar
- herkese açık API olarak amaçlanmayan çalışma zamanı tesisatı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Ayrılmış paketlenmiş-plugin yardımcı alt yolları, oluşturulan SDK dışa aktarım haritasından emekliye ayrılmıştır. Sahibe özgü yardımcıları sahip plugin paketi içinde tutun; yalnızca yeniden kullanılabilir ana makine davranışını `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` ve `plugin-sdk/plugin-config-runtime` gibi genel SDK sözleşmelerine yükseltin.

## Dahili yapılar ve başvuru

Yükleme hattı, kayıt defteri modeli, sağlayıcı çalışma zamanı hook'ları, Gateway HTTP rotaları, mesaj aracı şemaları, kanal hedef çözümleme, sağlayıcı katalogları, bağlam motoru pluginleri ve yeni bir yetenek ekleme kılavuzu için bkz. [Plugin mimarisi dahili yapıları](/tr/plugins/architecture-internals).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
