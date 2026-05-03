---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket gruplarını uygulama
    - Plugin yükleme sırası veya kayıt durumu için hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin’i ekleme
summary: 'Plugin mimarisi iç ayrıntıları: yükleme hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisinin iç işleyişi
x-i18n:
    generated_at: "2026-05-03T21:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, Plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
iç mekanikler için başvuru kaynağıdır: yükleme hattı, kayıt defteri, çalışma zamanı hook'ları,
Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketlenmiş modüller yerel bir yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript acil durum Jiti yedek yolunu kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine sunar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi varsa onu çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Giriş
Plugin kökünün dışına çıktığında, yol herkes tarafından yazılabilir olduğunda veya yol
sahipliği paketlenmemiş Plugin'ler için şüpheli göründüğünde adaylar engellenir.

Engellenen adaylar tanılama için Plugin kimlikleriyle ilişkili kalır. Yapılandırma
hala bu kimliğe başvuruyorsa doğrulama, Plugin'i mevcut ama engellenmiş
olarak bildirir ve yapılandırma girişini bayat kabul etmek yerine yol güvenliği uyarısına
geri işaret eder.

### Manifest öncelikli davranış

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills'leri/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden düşük maliyetli etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Hook'lar,
araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` çağrısının veya `setupEntry` öğesinin yerine geçmezler.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri materyalleştirmesinden önce
Plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yükleme, istenen birincil komutun sahibi olan Plugin'lerle daraltılır
- kanal kurulumu/Plugin çözümlemesi, istenen kanal kimliğinin sahibi olan Plugin'lerle
  daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen sağlayıcı kimliğinin sahibi olan Plugin'lerle
  daraltılır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıçtan vazgeçmeler için `activation.onStartup` kullanır; başlangıç meta verisi olmayan Plugin'ler yalnızca
  daha dar etkinleştirme tetikleyicileri üzerinden yüklenir

Geniş `all` kapsamını isteyen istek zamanı çalışma zamanı ön yüklemeleri yine de
yapılandırmadan, başlangıç planlamasından, yapılandırılmış kanallardan, slotlardan ve otomatik etkinleştirme kurallarından
açık bir etkili Plugin kimliği kümesi türetir. Bu türetilen küme boşsa OpenClaw,
keşfedilebilir her Plugin'e genişlemek yerine boş bir çalışma zamanı kayıt defteri
yükler.

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca kimliklerden oluşan bir API ve
yeni tanılamalar için bir plan API'si sunar. Plan girişleri bir Plugin'in neden seçildiğini bildirir,
açık `activation.*` planlayıcı ipuçlarını `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hook'lar gibi manifest sahipliği yedeklerinden ayırır.
Bu neden ayrımı uyumluluk sınırıdır:
mevcut Plugin meta verileri çalışmaya devam ederken, yeni kod çalışma zamanı yükleme semantiklerini
değiştirmeden geniş ipuçlarını veya yedek davranışı algılayabilir.

Kurulum keşfi artık aday Plugin'leri daraltmak için önce `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder; ardından hala kurulum zamanı
çalışma zamanı hook'larına ihtiyaç duyan Plugin'ler için `setup-api` yedeğine döner. Sağlayıcı
kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden manifest `providerAuthChoices`, tanımlayıcıdan türetilmiş kurulum
seçenekleri ve kurulum kataloğu meta verilerini kullanır. Açık
`setup.requiresRuntime: false` yalnızca tanımlayıcıya dayalı bir kesme noktasıdır; atlanmış
`requiresRuntime`, uyumluluk için eski setup-api yedek yolunu korur. Birden fazla
keşfedilen Plugin aynı normalleştirilmiş kurulum sağlayıcısı veya CLI arka uç kimliğini talep ederse
kurulum araması, keşif sırasına güvenmek yerine belirsiz sahibi reddeder.
Kurulum çalışma zamanı yürütüldüğünde, kayıt defteri tanılamaları `setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen sağlayıcılar veya CLI
arka uçları arasındaki sapmayı eski Plugin'leri engellemeden bildirir.

### Plugin önbellek sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri
verilerini duvar saati pencerelerinin arkasında önbelleğe almaz. Kurulumlar, manifest düzenlemeleri ve yükleme yolu değişiklikleri
bir sonraki açık meta veri okumasında veya anlık görüntü yeniden oluşturmasında görünür olmalıdır.
Manifest dosyası ayrıştırıcısı, açılan manifest yolu, inode, boyut ve zaman damgalarıyla anahtarlanan
sınırlı bir dosya imzası önbelleği tutabilir; bu önbellek yalnızca
değişmemiş baytların yeniden ayrıştırılmasını önler ve keşif, kayıt defteri, sahip veya
ilke yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu, gizli bir önbellek değil açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları, geçerli `PluginMetadataSnapshot`, türetilmiş
`PluginLookUpTable` veya açık bir manifest kayıt defterini çağrı zinciri üzerinden iletmelidir.
Yapılandırma doğrulama, başlangıçta otomatik etkinleştirme, Plugin önyükleme ve sağlayıcı
seçimi, geçerli yapılandırmayı ve Plugin envanterini temsil ettikleri sürece bu nesneleri
yeniden kullanabilir. Kurulum araması, belirli kurulum yolu açık bir manifest kayıt defteri almadığı sürece
manifest meta verilerini talep üzerine yeniden oluşturur; bunu gizli arama önbellekleri eklemek yerine
soğuk yol yedeği olarak tutun. Girdi değiştiğinde, anlık görüntüyü mutasyona uğratmak veya
geçmiş kopyaları tutmak yerine yeniden oluşturup değiştirin.
Etkin Plugin kayıt defteri üzerindeki görünümler ve paketlenmiş kanal önyükleme yardımcıları
geçerli kayıt defterinden/kökten yeniden hesaplanmalıdır. Kısa ömürlü haritalar,
işi tekilleştirmek veya yeniden girişi korumak için tek bir çağrı içinde uygundur; süreç
meta veri önbelleklerine dönüşmemelidir.

Plugin yükleme için kalıcı önbellek katmanı çalışma zamanı yüklemesidir. Kod veya kurulu yapılar gerçekten
yüklendiğinde yükleyici durumunu yeniden kullanabilir, örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyini tekrar tekrar içe aktarmaktan kaçınmak için kullanılan jiti/modül önbellekleri ve genel yüzey yükleyici önbellekleri
- kurulu Plugin yapıları için dosya sistemi önbellekleri
- yol normalleştirme veya yinelenen çözümleme için kısa ömürlü çağrı başına haritalar

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran bilinçli olarak
çalışma zamanı yükleme istemediği sürece "bu sağlayıcının sahibi hangi Plugin?" gibi
kontrol düzlemi sorularını yanıtlamamalıdırlar.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- yüklü Plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı ilkesi veya herkese açık yapıt
  metadata
- değiştirilmiş bir manifest, yüklü dizin veya yükleme yolunun bir sonraki metadata okumasında görünür olması gereken diğer tüm manifest türevli yanıtlar

Kalıcı yüklü Plugin dizininden manifest metadata'sını yeniden oluşturan çağıranlar, bu kayıt defterini istek üzerine yeniden oluşturur. Yüklü dizin dayanıklı kaynak düzlemi durumudur; gizli bir süreç içi metadata önbelleği değildir.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek globallerini doğrudan değiştirmez. Merkezi bir Plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılama)
- araçlar
- eski hook'lar ve tipli hook'lar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan servisleri
- Plugin'e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu çekirdek yüzeyin yalnızca tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku"; "her Plugin modülünü özel olarak ele al" değil.

## Konuşma bağlama callback'leri

Bir konuşmayı bağlayan Plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra callback almak için `api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Callback yükü alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma metadata'sı

Bu callback yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin verildiğini değiştirmez ve çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı hook'ları

Sağlayıcı Plugin'lerinin üç katmanı vardır:

- Ucuz çalışma zamanı öncesi arama için **manifest metadata'sı**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı hook'ları**: `catalog` (eski `discovery`) artı
  `applyConfigDefaults`.
- **Çalışma zamanı hook'ları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme seviyeleri, yeniden oynatma ilkesi ve kullanım uç noktalarını kapsayan 40+ isteğe bağlı hook. Tam liste için
  [Hook sırası ve kullanımı](#hook-order-and-usage) bölümüne bakın.

OpenClaw genel ajan döngüsünü, failover'ı, transcript işlemeyi ve araç ilkesini hâlâ kendisi yönetir. Bu hook'lar, tamamen özel bir çıkarım taşımasına ihtiyaç duymadan sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin çalışma zamanını yüklemeden görmesi gereken env tabanlı kimlik bilgileri olduğunda manifest `setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış `providerAuthEnvVars`, kullanımdan kaldırma penceresi boyunca uyumluluk adaptörü tarafından hâlâ okunur ve bunu kullanan paketlenmemiş Plugin'ler bir manifest tanılaması alır. Bir sağlayıcı kimliği başka bir sağlayıcı kimliğinin env var'larını, auth profillerini, yapılandırma destekli auth'u ve API anahtarı onboarding seçimini yeniden kullanmalıysa manifest `providerAuthAliases` kullanın. Onboarding/auth-choice CLI yüzeyleri sağlayıcının seçim kimliğini, grup etiketlerini ve basit tek bayraklı auth kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmeliyse manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı `envVars` alanını onboarding etiketleri veya OAuth client-id/client-secret kurulum değişkenleri gibi operatöre dönük ipuçları için tutun.

Bir kanalın, genel shell-env fallback, yapılandırma/durum kontrolleri veya kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken env güdümlü auth ya da kurulumu olduğunda manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw hook'ları kabaca bu sırayla çağırır.
"Ne zaman kullanılmalı" sütunu hızlı karar kılavuzudur.
OpenClaw'ın artık çağırmadığı `ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi yalnızca uyumluluk amaçlı sağlayıcı alanları burada özellikle listelenmez.

| #   | Kanca                             | Ne yapar                                                                                                      | Ne zaman kullanılır                                                                                                                           |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                | Sağlayıcı bir kataloğa veya varsayılan temel URL değerlerine sahiptir                                                                         |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcıya ait genel yapılandırma varsayılanlarını uygular                   | Varsayılanlar auth moduna, ortama veya sağlayıcı model ailesi semantiklerine bağlıdır                                                         |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt/katalog yolunu dener                                                               | _(Plugin kancası değil)_                                                                                                                      |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahiptir                                                                  |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                  | Sağlayıcı, aynı aktarım ailesindeki özel sağlayıcı kimlikleri için aktarım temizliğine sahiptir                                               |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` öğesini normalleştirir                 | Sağlayıcının Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı vardır; paketli Google ailesi yardımcıları desteklenen Google yapılandırma girişlerini de yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                      | Sağlayıcının uç nokta odaklı yerel akış kullanımı meta veri düzeltmelerine ihtiyacı vardır                                                   |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için ortam işaretçisi auth değerini çözer   | Sağlayıcının sağlayıcıya ait ortam işaretçisi API anahtarı çözümlemesi vardır; `amazon-bedrock` burada yerleşik bir AWS ortam işaretçisi çözümleyicisine de sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli auth değerini yüzeye çıkarır | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabilir                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini bindirir; varsayılan `persistence`, CLI/uygulama sahipliğindeki kimlik bilgileri için `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanır; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını ortam/yapılandırma destekli auth arkasına düşürür                  | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profilleri saklar                                                                  |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıtta olmayan sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş                       | Sağlayıcı keyfi upstream model kimliklerini kabul eder                                                                                        |
| 12  | `prepareDynamicModel`             | Asenkron ısıtma, ardından `resolveDynamicModel` yeniden çalışır                                               | Sağlayıcının bilinmeyen kimlikleri çözmeden önce ağ meta verilerine ihtiyacı vardır                                                           |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önce son yeniden yazım                                       | Sağlayıcının aktarım yeniden yazımlarına ihtiyacı vardır ama yine de çekirdek bir aktarım kullanır                                            |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu aktarım arkasındaki tedarikçi modelleri için uyumluluk bayrakları sağlar                    | Sağlayıcı, sağlayıcıyı devralmadan proxy aktarımlarında kendi modellerini tanır                                                               |
| 15  | `normalizeToolSchemas`            | Araç şemalarını gömülü çalıştırıcı görmeden önce normalleştirir                                              | Sağlayıcının aktarım ailesi şema temizliğine ihtiyacı vardır                                                                                  |
| 16  | `inspectToolSchemas`              | Normalleştirme sonrasında sağlayıcıya ait şema tanılarını yüzeye çıkarır                                     | Sağlayıcı, çekirdeğe sağlayıcıya özgü kuralları öğretmeden anahtar sözcük uyarıları ister                                                     |
| 17  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                       | Sağlayıcının yerel alanlar yerine etiketli akıl yürütme/son çıktı kullanması gerekir                                                         |
| 18  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi                              | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı vardır                                     |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir aktarımla tamamen değiştirir                                                     | Sağlayıcının yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyacı vardır                                                       |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonraki akış sarmalayıcısı                                                | Sağlayıcının özel aktarım olmadan istek başlığı/gövde/model uyumluluk sarmalayıcılarına ihtiyacı vardır                                       |
| 21  | `resolveTransportTurnState`       | Yerel tur başına aktarım başlıkları veya meta verileri ekler                                                 | Sağlayıcı, genel aktarımların sağlayıcıya özgü yerel tur kimliği göndermesini ister                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum bekleme politikası ekler                                              | Sağlayıcı, genel WS aktarımlarının oturum başlıklarını veya geri dönüş politikasını ayarlamasını ister                                        |
| 23  | `formatApiKey`                    | Auth profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür                     | Sağlayıcı ek auth meta verileri saklar ve özel bir çalışma zamanı belirteci biçimine ihtiyaç duyar                                            |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması              | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymaz                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                    | Sağlayıcının yenileme hatasından sonra sağlayıcıya ait auth onarım rehberliğine ihtiyacı vardır                                               |
| 26  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                       | Sağlayıcının, genel sezgisellerin kaçıracağı ham taşma hataları vardır                                                                        |
| 27  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması                                                              | Sağlayıcı ham API/aktarım hatalarını hız sınırı/aşırı yük vb. değerlerle eşleyebilir                                                          |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği politikası                                                 | Sağlayıcının proxy'ye özgü önbellek TTL kapılamasına ihtiyacı vardır                                                                          |
| 29  | `buildMissingAuthMessage`         | Genel eksik auth kurtarma mesajının yerine geçer                                                             | Sağlayıcının sağlayıcıya özgü eksik auth kurtarma ipucuna ihtiyacı vardır                                                                     |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                      | Sağlayıcının `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyacı vardır                                        |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntüleme etiketleri ve varsayılan                                      | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunar                                                            |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme anahtarı uyumluluk kancası                                                          | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunar                                                                                            |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                               | Sağlayıcı `xhigh` değerini yalnızca model alt kümesinde ister                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                 | Sağlayıcı bir model ailesi için varsayılan `/think` politikasına sahiptir                                                                     |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve duman testi seçimi için modern model eşleştiricisi                                | Sağlayıcı canlı/duman testi için tercih edilen model eşleştirmesine sahiptir                                                                  |
| 36  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcının belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı vardır                                                      |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı var                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı var                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcının sahip olduğu bir gömme bağdaştırıcısı oluştur                                                     | Bellek gömme davranışı sağlayıcı Plugin'i ile birlikte yer alır                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için döküm işlemeyi denetleyen bir yeniden oynatma politikası döndür                                        | Sağlayıcının özel döküm politikasına ihtiyacı var (örneğin, düşünme bloğunu kaldırma)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel döküm temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının, paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı var                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma dönüşü doğrulaması veya yeniden şekillendirmesi                                           | Sağlayıcı aktarımının, genel temizlemeden sonra daha sıkı dönüş doğrulamasına ihtiyacı var                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcının sahip olduğu seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı var                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini kontrol eder, ardından model kimliğini veya
taşıma/config değerini gerçekten değiştiren bir tane bulunana kadar diğer hook
destekli sağlayıcı Plugin'lerine geçer. Bu, çağıranın yeniden yazmayı hangi
paketli Plugin'in sahiplendiğini bilmesini gerektirmeden alias/compat sağlayıcı
shim'lerinin çalışmasını sağlar. Hiçbir sağlayıcı hook'u desteklenen bir
Google ailesi config girdisini yeniden yazmazsa, paketli Google config
normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol'e veya özel request executor'a
ihtiyacı varsa, bu farklı bir extension sınıfıdır. Bu hook'lar, hâlâ
OpenClaw'ın normal çıkarım döngüsünde çalışan sağlayıcı davranışı içindir.

### Sağlayıcı örneği

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Yerleşik örnekler

Paketli sağlayıcı Plugin'leri, her satıcının katalog, auth, thinking, replay ve
kullanım ihtiyaçlarına uymak için yukarıdaki hook'ları birleştirir. Yetkili
hook kümesi her Plugin ile birlikte `extensions/` altında bulunur; bu sayfa
listeyi aynalamak yerine şekilleri gösterir.

<AccordionGroup>
  <Accordion title="Geçişli katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI; upstream model kimliklerini OpenClaw'ın
    statik kataloğundan önce gösterebilmek için `catalog` ile birlikte
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai; token
    exchange ve `/usage` entegrasyonunu sahiplenmek için `prepareRuntimeAuth`
    veya `formatApiKey` değerini `resolveUsageAuth` + `fetchUsageSnapshot` ile
    eşleştirir.
  </Accordion>
  <Accordion title="Replay ve transkript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin'in temizliği
    yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` aracılığıyla
    transkript ilkesine katılmasını sağlar.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü
    kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü akış yardımcıları">
    Beta başlıkları, `/fast` / `serviceTier` ve `context1m`, genel SDK içinde
    değil Anthropic Plugin'inin public `api.ts` / `contract-api.ts` sınırında
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) yer alır.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler seçili core yardımcılarına `api.runtime` aracılığıyla erişebilir.
TTS için:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notlar:

- `textToSpeech`, dosya/sesli not yüzeyleri için normal core TTS çıktı yükünü döndürür.
- Core `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses buffer'ı + örnekleme hızı döndürür. Plugin'ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcıya duyarlı seçiciler için locale, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefoniyi destekler. Microsoft desteklemez.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla speech
sağlayıcıları kaydedebilir.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notlar:

- TTS ilkesini, fallback'i ve yanıt teslimini core içinde tutun.
- Satıcıya ait synthesis davranışı için speech sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu capability
  sözleşmelerini ekledikçe tek bir satıcı Plugin'i text, speech, image ve
  gelecekteki media sağlayıcılarını sahiplenebilir.

Image/audio/video anlama için Plugin'ler, genel key/value bag yerine typed bir
media-understanding sağlayıcısı kaydeder:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notlar:

- Orkestrasyonu, fallback'i, config'i ve kanal bağlantılarını core içinde tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Eklemeli genişleme typed kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe
  bağlı sonuç alanları, yeni isteğe bağlı capability'ler.
- Video generation zaten aynı kalıbı izler:
  - core capability sözleşmesini ve runtime helper'ı sahiplenir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - feature/channel Plugin'leri `api.runtime.videoGeneration.*` tüketir

Media-understanding çalışma zamanı yardımcıları için Plugin'ler şunu çağırabilir:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Ses transkripsiyonu için Plugin'ler media-understanding runtime'ını veya eski
STT alias'ını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, image/audio/video anlama için tercih edilen paylaşılan yüzeydir.
- Core media-understanding audio configuration'ını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)` compatibility alias olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` aracılığıyla arka plan subagent
çalıştırmaları başlatabilir:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notlar:

- `provider` ve `model`, kalıcı session değişiklikleri değil, çalıştırma başına isteğe bağlı override'lardır.
- OpenClaw bu override alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile onay vermelidir.
- Güvenilir Plugin'leri belirli canonical `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin subagent çalıştırmaları yine çalışır, ancak override istekleri sessizce fallback yapmak yerine reddedilir.
- Plugin tarafından oluşturulan subagent session'ları, oluşturan Plugin kimliğiyle etiketlenir. Fallback `api.runtime.subagent.deleteSession(...)` yalnızca bu sahip olunan session'ları silebilir; keyfi session silme hâlâ admin kapsamlı bir Gateway isteği gerektirir.

Web search için Plugin'ler, agent tool bağlantısına girmek yerine paylaşılan
runtime helper'ı tüketebilir:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin'ler ayrıca `api.registerWebSearchProvider(...)` aracılığıyla web-search
sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemeyi ve paylaşılan istek semantiğini core içinde tutun.
- Satıcıya özgü search transports için web-search sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, agent tool wrapper'a bağımlı olmadan search davranışına ihtiyaç duyan feature/channel Plugin'leri için tercih edilen paylaşılan yüzeydir.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: yapılandırılmış image-generation sağlayıcı zincirini kullanarak bir image oluşturur.
- `listProviders(...)`: kullanılabilir image-generation sağlayıcılarını ve capability'lerini listeler.

## Gateway HTTP route'ları

Plugin'ler `api.registerHttpRoute(...)` ile HTTP endpoint'leri açığa çıkarabilir.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Route alanları:

- `path`: Gateway HTTP sunucusunun altındaki route path'i.
- `auth`: zorunlu. Normal Gateway auth gerektirmek için `"gateway"`, Plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut route kaydını değiştirmesine izin verir.
- `handler`: route isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadığı sürece reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` seviyelerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` geçiş zincirlerini yalnızca aynı auth seviyesinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam özellikle tutucudur:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin özel bir girişte `trusted-proxy` veya `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca başlık açıkça mevcut olduğunda dikkate alır
  - kimlik taşıyan bu Plugin rotası isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yöneticiye özel davranış gerektiriyorsa kimlik taşıyan bir auth modu isteyin ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken monolitik `openclaw/plugin-sdk` kök
barrel yerine dar SDK alt yolları kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt ilkelleri                     |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/derleme yardımcıları                        |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme       |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`) |

Kanal Plugin'leri dar bağlantı noktaları ailesinden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karıştırılmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve config yardımcıları eşleşen odaklı `*-runtime` alt yolları
altında yer alır (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel'ı
yerine `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` ve
`config-mutation` tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış
uyumluluk shim'leridir. Yeni kod bunun yerine daha dar genel ilkelleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketlenmiş Plugin paket kökü başına):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/tip barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Asla
çekirdekten veya başka bir Plugin'den başka bir Plugin paketinin `src/*` öğesini
içe aktarmayın. Facade ile yüklenen giriş noktaları, varsa etkin çalışma zamanı
config anlık görüntüsünü tercih eder, ardından diskteki çözümlenen config dosyasına geri döner.

`image-generation`, `media-understanding` ve `speech` gibi yeteneğe özel alt yollar,
paketlenmiş Plugin'ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak
uzun vadeli dondurulmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK
referans sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler, tepkiler, okumalar ve anketler gibi mesaj dışı ilkeller için kanala özgü
`describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları
yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için
bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin'ler, mesaj yetenekleri üzerinden ne işleyebileceklerini bildirir:

- anlamsal sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak işleyip işlemeyeceğine veya metne düşürüp düşürmeyeceğine karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış yolları açmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf
Plugin'ler için dışa aktarılmaya devam eder, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal Plugin'leri kanala özgü hedef semantiğine sahip olmalıdır. Paylaşılan
giden ana bilgisayarı genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcısı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin
  dizin araması yerine doğrudan id benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden sonra veya
  dizin kaçırmasından sonra son bir sağlayıcıya ait çözümlemeye ihtiyaç duyduğunda
  kullanılan Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum
  rotası oluşturmayı üstlenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce yapılması gereken kategori kararları için
  `inferTargetChatType` kullanın.
- "Bunu açık/yerel hedef id olarak ele al" kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme geri dönüşü için
  `resolveTarget` kullanın.
- Sohbet id'leri, iş parçacığı id'leri, JID'ler, tanıtıcılar ve oda
  id'leri gibi sağlayıcıya özgü yerel id'leri genel SDK alanlarında değil,
  `target` değerlerinin veya sağlayıcıya özgü parametrelerin içinde tutun.

## Config destekli dizinler

Config'den dizin girdileri türeten Plugin'ler bu mantığı
Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bir kanal aşağıdakiler gibi config destekli eşlere/gruplara ihtiyaç duyduğunda bunu kullanın:

- izin listesiyle yönetilen DM eşleri
- yapılandırılmış kanal/grup haritaları
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve id normalleştirme
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri, çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın `models.providers` içine yazdığı aynı şekli döndürür:

- bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model id'lerine, temel URL varsayılanlarına veya
auth ile kapılı model meta verilerine sahip olduğunda `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw'ın yerleşik örtük sağlayıcılarına göre
ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env tabanlı sağlayıcılar
- `profile`: auth profilleri bulunduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Anahtar çakışmasında daha sonraki sağlayıcılar kazanır, böylece Plugin'ler aynı sağlayıcı id'sine
sahip yerleşik bir sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski ad olarak çalışmaya devam eder
- hem `catalog` hem de `discovery` kayıtlıysa OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen
  somutlaştırıldığını varsaymasına izin verilir ve gerekli gizli bilgiler eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yalnızca
  yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynak/durum alanlarını ekleyin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerlerini döndürmeniz
  gerekmez. Durum tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak
  alanı) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda
  kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmesi veya hesabı yapılandırılmamış olarak yanlış raporlaması
yerine "yapılandırılmış ancak bu komut yolunda kullanılamıyor" bildirmesini sağlar.

## Paket paketleri

Bir Plugin dizini, `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her giriş bir Plugin olur. Paket birden çok extension listeliyorsa Plugin id'si
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıklarını içe aktarıyorsa, `node_modules` kullanılabilir olsun diye
bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruması: her `openclaw.extensions` girdisi, symlink çözümlemesinden sonra Plugin
dizini içinde kalmalıdır. Paket dizininden çıkan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok,
çalışma zamanında dev bağımlılıkları yok) ve devralınan global npm kurulum ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren
paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü gösterebilir.
OpenClaw devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ancak hâlâ yapılandırılmamış olduğunda, tam Plugin girişi
yerine `setupEntry` yükler. Bu, ana Plugin girişiniz araçları, hook'ları veya diğer yalnızca çalışma zamanı
kodlarını da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile bir kanal Plugin'ini Gateway'in
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna alabilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken
başlangıç yüzeyini tamamen kapsadığında kullanın. Pratikte bu, kurulum girişinin
başlangıcın bağlı olduğu kanala ait her yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı zaman aralığında var olması gereken tüm Gateway yöntemleri, araçları veya hizmetleri

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğine sahipse
bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın
başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar, tam kanal çalışma zamanı yüklenmeden önce çekirdeğin
başvurabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları da yayımlayabilir.
Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core, tam Plugin girişinin tamamını yüklemeden eski tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix mevcut paketlenmiş örnektir: yalnızca auth/bootstrap anahtarlarını, adlandırılmış hesaplar zaten mevcut olduğunda
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yaması bağdaştırıcıları, paketlenmiş sözleşme yüzeyi keşfini lazy tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi, modül içe aktarımında paketlenmiş kanal başlatmasını
yeniden tetiklemek yerine yalnızca ilk kullanımda yüklenir.

Bu başlatma yüzeyleri Gateway RPC yöntemleri içerdiğinde, bunları
Plugin’e özgü bir önekte tutun. Core admin ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar bir kapsam istese bile her zaman
`operator.admin` olarak çözümlenir.

Örnek:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Kanal katalog meta verileri

Kanal Plugin’leri kurulum/keşif meta verilerini `openclaw.channel` üzerinden ve
kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, core kataloğunu verisiz tutar.

Örnek:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

En küçük örneğin ötesindeki yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: docs bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı docs gezinme yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözümlenirken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir MPM
kayıt dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ya da `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalize edilmiş kurulum kaynağı bilgilerini sunar. Bu
normalize edilmiş bilgiler, npm spec’in tam sürüm mü yoksa kayan
seçici mi olduğunu, beklenen bütünlük meta verisinin mevcut olup olmadığını ve yerel bir
kaynak yolunun da kullanılabilir olup olmadığını belirler. Katalog/paket kimliği bilindiğinde,
normalize edilmiş bilgiler ayrıştırılan npm paket adı bu kimlikten saparsa uyarır.
Ayrıca `defaultChoice` geçersiz olduğunda veya
mevcut olmayan bir kaynağa işaret ettiğinde ve geçerli bir npm kaynağı olmadan npm bütünlük meta verisi mevcut olduğunda da uyarır. Tüketiciler, elle oluşturulmuş girdilerin ve katalog shim’lerinin bunu sentezlemek zorunda kalmaması için
`installSource` alanını eklemeli isteğe bağlı bir alan olarak ele almalıdır.
Bu, onboarding ve tanılamaların Plugin runtime’ını içe aktarmadan
kaynak düzlemi durumunu açıklamasını sağlar.

Resmi harici npm girdileri, tam bir `npmSpec` ve
`expectedIntegrity` tercih etmelidir. Çıplak paket adları ve dist-tag’ler uyumluluk için hâlâ çalışır,
ancak katalog mevcut Plugin’leri bozmadan sabitlenmiş, bütünlüğü denetlenmiş kurulumlara doğru ilerleyebilsin diye
kaynak düzlemi uyarıları gösterirler.
Onboarding yerel bir katalog yolundan kurulum yaptığında, yönetilen bir Plugin
Plugin dizin girdisini `source: "path"` ve mümkün olduğunda çalışma alanına göreli
`sourcePath` ile kaydeder. Mutlak operasyonel yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu
yollarını uzun ömürlü yapılandırmaya çoğaltmaktan kaçınır. Bu, yerel geliştirme kurulumlarını
ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamalarında görünür tutar.
Kalıcı `plugins/installs.json` Plugin dizini, kurulum
kaynağının doğruluk kaynağıdır ve Plugin runtime modülleri yüklenmeden yenilenebilir.
`installRecords` haritası, bir Plugin manifesti eksik veya
geçersiz olduğunda bile kalıcıdır; `plugins` dizisi yeniden oluşturulabilir bir manifest görünümüdür.

## Bağlam motoru Plugin’leri

Bağlam motoru Plugin’leri, içe alma, derleme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları Plugin’inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, Plugin’inizin yalnızca bellek araması veya hook eklemek yerine varsayılan bağlam
pipeline’ını değiştirmesi veya genişletmesi gerektiğinde kullanın.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx`, oluşturma zamanı başlatması için isteğe bağlı `config`, `agentDir` ve `workspaceDir`
değerlerini sunar.

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()`
uygulanmış halde tutun ve açıkça devredin:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Yeni capability ekleme

Bir Plugin mevcut API’ye uymayan davranışa ihtiyaç duyduğunda,
özel bir içeri uzanma ile Plugin sistemini atlamayın. Eksik capability’yi ekleyin.

Önerilen sıra:

1. core sözleşmesini tanımlayın
   Core’un hangi paylaşılan davranışa sahip olması gerektiğine karar verin: politika, fallback, config birleştirme,
   yaşam döngüsü, kanala dönük semantik ve runtime yardımcı şekli.
2. tipli Plugin kayıt/runtime yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` öğesini en küçük yararlı
   tipli capability yüzeyiyle genişletin.
3. core + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin’leri yeni capability’yi core üzerinden tüketmelidir,
   doğrudan bir vendor uygulamasını içe aktararak değil.
4. vendor uygulamalarını kaydedin
   Vendor Plugin’leri daha sonra backend’lerini capability’ye göre kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, bir sağlayıcının dünya görüşüne hardcode edilmeden bu şekilde görüş sahibi kalır.
Somut bir dosya kontrol listesi ve işlenmiş örnek için [Capability Cookbook](/tr/plugins/architecture) belgesine bakın.

### Capability kontrol listesi

Yeni bir capability eklediğinizde, uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içinde core sözleşme türleri
- `src/<capability>/runtime.ts` içinde core runner/runtime yardımcısı
- `src/plugins/types.ts` içinde Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içinde Plugin registry bağlantısı
- özellik/kanal Plugin’lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içinde Plugin runtime görünürlüğü
- `src/test-utils/plugin-registration.ts` içinde capture/test yardımcıları
- `src/plugins/contracts/registry.ts` içinde sahiplik/sözleşme doğrulamaları
- `docs/` içinde operatör/Plugin docs

Bu yüzeylerden biri eksikse, bu genellikle capability’nin
henüz tam olarak entegre edilmediğinin işaretidir.

### Capability şablonu

En küçük pattern:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Sözleşme testi pattern’i:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- core capability sözleşmesinin + orkestrasyonun sahibidir
- vendor Plugin’leri vendor uygulamalarının sahibidir
- özellik/kanal Plugin’leri runtime yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel capability modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
