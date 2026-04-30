---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırası veya kayıt defteri durumu için hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisinin iç işleyişi: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve referans tabloları'
title: Plugin mimarisinin iç yapısı
x-i18n:
    generated_at: "2026-04-30T09:33:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, Plugin biçimleri ve sahiplik/yürütme sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa, dahili mekanikler için referanstır: yükleme hattı, kayıt defteri, çalışma zamanı kancaları, Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirme durumuna karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel yükleyici kullanır;
   derlenmemiş yerel Plugin'ler jiti kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı çözümler (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları, çalışma zamanı yürütmesinden **önce** gerçekleşir. Giriş Plugin kökünün dışına çıktığında, yol herkes tarafından yazılabilir olduğunda veya yol sahipliği paketlenmemiş Plugin'ler için şüpheli göründüğünde adaylar engellenir.

### Manifest öncelikli davranış

Manifest, denetim düzleminin doğruluk kaynağıdır. OpenClaw bunu şu amaçlarla kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills'i/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Kancalar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları denetim düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` çağrısının veya `setupEntry` değerinin yerine geçmez.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri materyalleştirmesinden önce Plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komuta sahip olan Plugin'lere daralır
- kanal kurulumu/Plugin çözümlemesi, istenen kanal kimliğine sahip olan Plugin'lere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen sağlayıcı kimliğine sahip olan Plugin'lere daralır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıç dışı bırakmaları için `activation.onStartup` kullanır; OpenClaw örtük başlangıç içe aktarmalarından uzaklaşırken her Plugin bunu bildirmelidir, statik yetenek meta verisi olmayan ve `activation.onStartup` içermeyen Plugin'ler ise uyumluluk için kullanımdan kaldırılmış örtük başlangıç sidecar geri dönüşünü kullanmaya devam eder

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca kimliklerden oluşan bir API ve yeni tanılamalar için bir plan API'si sunar. Plan girdileri, bir Plugin'in neden seçildiğini bildirir; açık `activation.*` planlayıcı ipuçlarını `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve kancalar gibi manifest sahipliği geri dönüşlerinden ayırır. Bu neden ayrımı uyumluluk sınırıdır:
mevcut Plugin meta verileri çalışmaya devam ederken, yeni kod çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını veya geri dönüş davranışını algılayabilir.

Kurulum keşfi artık `setup-api` geri dönüşüne geçmeden önce aday Plugin'leri daraltmak için `setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder; bu geri dönüş, hâlâ kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyan Plugin'ler içindir. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden manifest `providerAuthChoices`, tanımlayıcıdan türetilmiş kurulum seçenekleri ve kurulum kataloğu meta verilerini kullanır. Açık `setup.requiresRuntime: false` yalnızca tanımlayıcıya dayalı bir kesme noktasıdır; atlanan `requiresRuntime`, uyumluluk için eski setup-api geri dönüşünü korur. Birden fazla keşfedilen Plugin aynı normalleştirilmiş kurulum sağlayıcısı veya CLI arka uç kimliğini talep ederse, kurulum araması keşif sırasına dayanmak yerine belirsiz sahibi reddeder. Kurulum çalışma zamanı yürütüldüğünde, kayıt defteri tanılamaları `setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen sağlayıcılar veya CLI arka uçları arasındaki sapmayı eski Plugin'leri engellemeden bildirir.

### Plugin önbellek sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri verilerini duvar saati pencerelerinin arkasında önbelleğe almaz. Kurulumlar, manifest düzenlemeleri ve yükleme yolu değişiklikleri bir sonraki açık meta veri okumasında veya anlık görüntü yeniden oluşturmasında görünür olmalıdır.
Manifest dosyası ayrıştırıcısı, açılan manifest yolu, inode, boyut ve zaman damgalarıyla anahtarlanan sınırlı bir dosya imzası önbelleği tutabilir; bu önbellek yalnızca değişmemiş baytların yeniden ayrıştırılmasını önler ve keşif, kayıt defteri, sahip veya ilke yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu, gizli bir önbellek değil açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları, geçerli `PluginMetadataSnapshot`, türetilmiş `PluginLookUpTable` veya açık bir manifest kayıt defterini çağrı zinciri boyunca geçirmelidir. Yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme, Plugin önyüklemesi ve sağlayıcı seçimi, geçerli yapılandırmayı ve Plugin envanterini temsil ettikleri sürece bu nesneleri yeniden kullanabilir. Kurulum araması, ilgili kurulum yolu açık bir manifest kayıt defteri almadıkça manifest meta verilerini hâlâ gerektiğinde yeniden oluşturur; bunu gizli arama önbellekleri eklemek yerine soğuk yol geri dönüşü olarak koruyun. Girdi değiştiğinde, anlık görüntüyü mutasyona uğratmak veya geçmiş kopyaları tutmak yerine yeniden oluşturup değiştirin.
Etkin Plugin kayıt defteri üzerindeki görünümler ve paketli kanal önyükleme yardımcıları, geçerli kayıt defterinden/kökten yeniden hesaplanmalıdır. Kısa ömürlü eşlemeler, işi tekilleştirmek veya yeniden girişi korumak için tek bir çağrı içinde uygundur; süreç meta veri önbelleklerine dönüşmemelidir.

Plugin yüklemesi için kalıcı önbellek katmanı çalışma zamanı yüklemesidir. Kod veya kurulu yapıtlar gerçekten yüklendiğinde yükleyici durumunu yeniden kullanabilir, örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyini tekrar tekrar içe aktarmaktan kaçınmak için kullanılan jiti/modül önbellekleri ve genel yüzey yükleyici önbellekleri
- kurulu Plugin yapıtları için çalışma zamanı bağımlılık aynaları ve dosya sistemi önbellekleri
- yol normalleştirmesi veya yinelenen çözümleme için kısa ömürlü çağrı başına eşlemeler

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran özellikle çalışma zamanı yüklemesi istemedikçe, "bu sağlayıcının sahibi hangi Plugin?" gibi denetim düzlemi sorularını yanıtlamamalıdır.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- kurulu Plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı ilkesi veya genel yapıt meta verileri
- değişen bir manifestin, kurulu dizinin veya yükleme yolunun bir sonraki meta veri okumasında görünür olması gereken manifestten türetilmiş başka herhangi bir yanıt

Kalıcı kurulu Plugin dizininden manifest meta verilerini yeniden oluşturan çağıranlar, bu kayıt defterini gerektiğinde yeniden oluşturur. Kurulu dizin dayanıklı kaynak düzlemi durumudur; gizli bir süreç içi meta veri önbelleği değildir.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek global değerlerini doğrudan mutasyona uğratmaz. Merkezi bir Plugin kayıt defterine kayıt yaparlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılamalar)
- araçlar
- eski kancalar ve tiplenmiş kancalar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin'e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik açısından önemlidir. Çoğu çekirdek yüzeyin yalnızca tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku"; "her Plugin modülünü özel durum olarak ele al" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için `api.onConversationBindingResolved(...)` kullanın:

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

Geri çağrı yükü alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin verildiğini değiştirmez ve çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinde üç katman bulunur:

- Ucuz çalışma zamanı öncesi arama için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski `discovery`) artı
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme seviyeleri, tekrar oynatma ilkesi ve kullanım uç noktalarını kapsayan 40'tan fazla isteğe bağlı kanca. Tam liste için [Kanca sırası ve kullanımı](#hook-order-and-usage) bölümüne bakın.

OpenClaw genel aracı döngüsüne, yük devretmeye, konuşma dökümü işlemeye ve araç ilkesine hâlâ sahiptir. Bu kancalar, tamamen özel bir çıkarım aktarımı gerektirmeden sağlayıcıya özgü davranış için genişletme yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin çalışma zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri olduğunda manifest `setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış `providerAuthEnvVars`, kullanımdan kaldırma penceresi sırasında uyumluluk bağdaştırıcısı tarafından hâlâ okunur ve bunu kullanan paketlenmemiş Plugin'ler bir manifest tanılaması alır. Bir sağlayıcı kimliğinin başka bir sağlayıcı kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı onboarding seçimini yeniden kullanması gerektiğinde manifest `providerAuthAliases` kullanın. Onboarding/kimlik doğrulama seçimi CLI yüzeylerinin sağlayıcının seçim kimliğini, grup etiketlerini ve basit tek bayraklı kimlik doğrulama bağlantılarını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı `envVars` değerlerini, onboarding etiketleri veya OAuth client-id/client-secret kurulum değişkenleri gibi operatöre yönelik ipuçları için tutun.

Bir kanalın, genel kabuk ortamı geri dönüşünün, yapılandırma/durum kontrollerinin veya kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken ortam güdümlü kimlik doğrulaması veya kurulumu olduğunda manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw kancaları kabaca bu sırayla çağırır.
"Ne zaman kullanılır" sütunu hızlı karar rehberidir.
`ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi OpenClaw'ın artık çağırmadığı yalnızca uyumluluk amaçlı sağlayıcı alanları burada bilerek listelenmemiştir.

| #   | Hook                              | Ne yapar                                                                                                      | Ne zaman kullanılır                                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                  | Sağlayıcı bir kataloğa veya varsayılan temel URL değerlerine sahipse                                                                                                 |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcıya ait genel yapılandırma varsayılanlarını uygular                   | Varsayılanlar kimlik doğrulama moduna, env değerlerine veya sağlayıcı model ailesi semantiğine bağlıysa                                                              |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt/katalog yolunu dener                                                               | _(bir plugin hook'u değil)_                                                                                                                                         |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahipse                                                                                           |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalleştirir           | Sağlayıcı, aynı aktarım ailesindeki özel sağlayıcı kimlikleri için aktarım temizliğine sahipse                                                                       |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyuyorsa; paketli Google ailesi yardımcıları desteklenen Google yapılandırma girdilerini de yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                       | Sağlayıcı, uç nokta odaklı yerel akış kullanım meta verisi düzeltmelerine ihtiyaç duyuyorsa                                                                          |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için env işaretleyicili kimlik doğrulamasını çözümler | Sağlayıcıya ait env işaretleyicili API anahtarı çözümlemesi varsa; `amazon-bedrock` burada yerleşik bir AWS env işaretleyici çözümleyicisine de sahiptir             |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamayı yüzeye çıkarır | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretleyicisiyle çalışabiliyorsa                                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini bindirir; CLI/uygulama sahipli kimlik bilgileri için varsayılan `persistence` değeri `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme tokenlarını kalıcılaştırmadan harici kimlik doğrulama kimlik bilgilerini yeniden kullanıyorsa; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli kimlik doğrulamanın arkasına indirir      | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                                                     |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde olmayan sağlayıcıya ait model kimlikleri için eşzamanlı yedek çözümleme sağlar  | Sağlayıcı rastgele üst akış model kimliklerini kabul ediyorsa                                                                                                        |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, ardından `resolveDynamicModel` yeniden çalışır                                       | Sağlayıcı bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyaç duyuyorsa                                                                                 |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenmiş modeli kullanmadan önce son yeniden yazımı yapar                              | Sağlayıcı aktarım yeniden yazımlarına ihtiyaç duyuyor ancak yine de çekirdek aktarım kullanıyorsa                                                                    |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu aktarım arkasındaki satıcı modelleri için uyumluluk bayrakları katkılar                     | Sağlayıcı, sağlayıcıyı devralmadan proxy aktarımlarında kendi modellerini tanıyorsa                                                                                  |
| 15  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalleştirir                                               | Sağlayıcı aktarım ailesi şema temizliğine ihtiyaç duyuyorsa                                                                                                         |
| 16  | `inspectToolSchemas`              | Normalleştirme sonrasında sağlayıcıya ait şema tanılamalarını yüzeye çıkarır                                 | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları istiyorsa                                                                         |
| 17  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                       | Sağlayıcı yerel alanlar yerine etiketli akıl yürütme/nihai çıktıya ihtiyaç duyuyorsa                                                                                 |
| 18  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi yapar                        | Sağlayıcı varsayılan istek parametrelerine veya sağlayıcı bazında parametre temizliğine ihtiyaç duyuyorsa                                                            |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir aktarımla tamamen değiştirir                                                      | Sağlayıcı yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyaç duyuyorsa                                                                               |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                  | Sağlayıcı özel aktarım olmadan istek başlıkları/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyaç duyuyorsa                                                         |
| 21  | `resolveTransportTurnState`       | Yerel tur başına aktarım başlıkları veya meta verisi ekler                                                    | Sağlayıcı genel aktarımların sağlayıcıya özgü tur kimliği göndermesini istiyorsa                                                                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum bekleme politikası ekler                                               | Sağlayıcı genel WS aktarımlarının oturum başlıklarını veya yedek politikayı ayarlamasını istiyorsa                                                                   |
| 23  | `formatApiKey`                    | Kimlik doğrulama profili biçimleyicisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür             | Sağlayıcı ek kimlik doğrulama meta verisi saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                                       |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması              | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                                             |
| 25  | `buildAuthDoctorHint`             | OAuth yenileme başarısız olduğunda eklenen onarım ipucu                                                       | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım rehberliğine ihtiyaç duyuyorsa                                                          |
| 26  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                        | Sağlayıcıda genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                                                  |
| 27  | `classifyFailoverReason`          | Sağlayıcıya ait yük devretme nedeni sınıflandırması                                                           | Sağlayıcı ham API/aktarım hatalarını hız sınırı/aşırı yük/vb. durumlara eşleyebiliyorsa                                                                              |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği politikası                                                  | Sağlayıcı proxy'ye özgü önbellek TTL denetimine ihtiyaç duyuyorsa                                                                                                    |
| 29  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçer                                                 | Sağlayıcı, sağlayıcıya özgü eksik kimlik doğrulama kurtarma ipucuna ihtiyaç duyuyorsa                                                                                |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                       | Sağlayıcı `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyaç duyuyorsa                                                                |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` düzeyi kümesi, görüntüleme etiketleri ve varsayılan                                      | Sağlayıcı seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                                                |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme anahtarı uyumluluk hook'u                                                            | Sağlayıcı yalnızca ikili düşünme açık/kapalı durumu sunuyorsa                                                                                                       |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk hook'u                                                                 | Sağlayıcı `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk hook'u                                                                   | Sağlayıcı bir model ailesi için varsayılan `/think` politikasına sahipse                                                                                            |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                       | Sağlayıcı canlı/smoke tercih edilen model eşleştirmesine sahipse                                                                                                     |
| 36  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı tokenına/anahtarına dönüştürür | Sağlayıcı token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyuyorsa                                                                                |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı vardır                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı vardır                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcının sahip olduğu bir gömme bağdaştırıcısı oluştur                                                     | Bellek gömme davranışı sağlayıcı Plugin ile ilişkilidir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için transcript işlemeyi denetleyen bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel transcript ilkesine ihtiyacı vardır (örneğin, düşünme bloklarının çıkarılması)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel transcript temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı vardır                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulamasını veya yeniden şekillendirmesini yap                                           | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı vardır                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcının sahip olduğu seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcının sahip olduğu duruma ihtiyacı vardır                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini kontrol eder, sonra model kimliğini veya taşıma/yapılandırmayı
gerçekten değiştiren bir tane bulana kadar hook kullanabilen diğer sağlayıcı Plugin'lerine
geçer. Bu, çağıranın yeniden yazmanın hangi paketle gelen Plugin'e ait olduğunu
bilmesini gerektirmeden alias/compat sağlayıcı shim'lerinin çalışmasını sağlar. Hiçbir
sağlayıcı hook'u desteklenen Google ailesi yapılandırma girdisini yeniden yazmazsa,
paketle gelen Google yapılandırma normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protokolüne veya özel istek yürütücüsüne ihtiyacı
varsa, bu farklı bir extension sınıfıdır. Bu hook'lar, yine de OpenClaw'in normal
çıkarım döngüsünde çalışan sağlayıcı davranışları içindir.

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

Paketle gelen sağlayıcı Plugin'leri, yukarıdaki hook'ları her satıcının katalog,
kimlik doğrulama, düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uyacak şekilde
birleştirir. Yetkili hook kümesi, `extensions/` altında her Plugin ile birlikte bulunur;
bu sayfa listeyi yansıtmak yerine şekilleri gösterir.

<AccordionGroup>
  <Accordion title="Doğrudan geçiş katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI; `catalog` ile
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder, böylece upstream
    model kimliklerini OpenClaw'in statik kataloğundan önce gösterebilirler.
  </Accordion>
  <Accordion title="OAuth ve kullanım endpoint sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai;
    belirteç değişimini ve `/usage` entegrasyonunu sahiplenmek için
    `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` +
    `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Yeniden oynatma ve transcript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin'in temizliği
    yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` üzerinden
    transcript politikasına katılmasını sağlar.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü stream yardımcıları">
    Beta header'ları, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine
    Anthropic Plugin'inin herkese açık `api.ts` / `contract-api.ts` seam'i içinde
    bulunur (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`).
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler, seçili core yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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
- PCM ses buffer'ı + örnekleme hızı döndürür. Plugin'ler, sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Satıcının sahip olduğu ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için locale, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefoniyi destekler. Microsoft desteklemez.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` üzerinden konuşma sağlayıcıları kaydedebilir.

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

- TTS politikasını, fallback'i ve yanıt teslimini core içinde tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi, `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu yetenek sözleşmelerini
  ekledikçe, tek bir satıcı Plugin'i metin, konuşma, görüntü ve gelecekteki medya
  sağlayıcılarını sahiplenebilir.

Görüntü/ses/video anlama için Plugin'ler, genel bir anahtar/değer torbası yerine
tek bir türlendirilmiş medya anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, fallback'i, yapılandırmayı ve kanal bağlantılarını core içinde tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Eklemeli genişleme türlendirilmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı kalıbı izler:
  - core, yetenek sözleşmesini ve çalışma zamanı yardımcısını sahiplenir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` kullanır

Medya anlama çalışma zamanı yardımcıları için Plugin'ler şunu çağırabilir:

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

Ses transkripsiyonu için Plugin'ler medya anlama çalışma zamanını veya eski STT alias'ını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görüntü/ses/video anlama için tercih edilen paylaşılan yüzeydir.
- Core medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk alias'ı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan alt ajan çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı override'lardır.
- OpenClaw bu override alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait fallback çalıştırmaları için operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça katılması gerekir.
- Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt ajan çalıştırmaları yine de çalışır, ancak override istekleri sessizce fallback yapmak yerine reddedilir.
- Plugin tarafından oluşturulan alt ajan oturumları, oluşturan Plugin kimliğiyle etiketlenir. Fallback `api.runtime.subagent.deleteSession(...)` yalnızca bu sahipli oturumları silebilir; rastgele oturum silme hâlâ yönetici kapsamlı bir Gateway isteği gerektirir.

Web araması için Plugin'ler, ajan aracı bağlantılarına erişmek yerine paylaşılan çalışma zamanı yardımcısını kullanabilir:

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

Plugin'ler ayrıca `api.registerWebSearchProvider(...)` üzerinden web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemeyi ve paylaşılan istek semantiğini core içinde tutun.
- Satıcıya özgü arama taşıma katmanları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan aracı wrapper'ına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü üretimi sağlayıcı zincirini kullanarak bir görüntü üretir.
- `listProviders(...)`: kullanılabilir görüntü üretimi sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP rotaları

Plugin'ler, `api.registerHttpRoute(...)` ile HTTP endpoint'leri açabilir.

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

Rota alanları:

- `path`: Gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunlu. Normal Gateway kimlik doğrulamasını gerektirmek için `"gateway"` kullanın veya Plugin tarafından yönetilen kimlik doğrulama/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin rotasının yerine geçemez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` düşüş zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen webhooks/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway isteği çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam bilinçli olarak muhafazakardır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran taraf `x-openclaw-scopes` gönderse bile Plugin rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilen kimlik taşıyan HTTP modları (örneğin özel bir girişte `trusted-proxy` veya `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca başlık açıkça mevcut olduğunda dikkate alır
  - bu kimlik taşıyan Plugin rotası isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yöneticiye özel davranış gerektiriyorsa, kimlik taşıyan bir auth modu zorunlu kılın ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken monolitik `openclaw/plugin-sdk` kök barrel yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

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
Plugin alanları arasında karıştırmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen odaklı `*-runtime` alt yolları altında bulunur
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel'i yerine
`config-types`, `plugin-config-runtime`, `runtime-config-snapshot` ve
`config-mutation` kullanmayı tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış
uyumluluk shim'leridir. Yeni kod bunun yerine daha dar genel ilkelleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketlenmiş Plugin paketi kökü başına):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/türler barrel'i
- `runtime-api.js` — yalnızca çalışma zamanı barrel'i
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir Plugin'den başka bir Plugin paketinin `src/*` yolunu asla içe aktarmayın.
Facade tarafından yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder, ardından diskteki çözümlenmiş yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding`
ve `speech` gibi capability'ye özel alt yollar, paketlenmiş Plugin'ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak uzun vadede dondurulmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK referans sayfasını kontrol edin.

## İleti aracı şemaları

Plugin'ler, tepkiler, okumalar ve anketler gibi ileti dışı ilkeller için kanala özel `describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için bkz. [İleti Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin'ler, neleri işleyebildiklerini ileti capability'leriyle bildirir:

- semantik sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak mı işleyeceğine yoksa metne mi düşüreceğine karar verir.
Genel ileti aracından sağlayıcıya özgü UI kaçış yolları açığa çıkarmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin'ler için dışa aktarılmaya devam eder, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümlemesi

Kanal Plugin'leri kanala özel hedef semantiklerine sahip olmalıdır. Paylaşılan giden ana makineyi genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin araması yerine doğrudan id benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, normalleştirmeden sonra veya bir dizin kaçırmasından sonra çekirdeğin son sağlayıcıya ait çözümlemeye ihtiyaç duyduğu durumlarda Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum rotası oluşturmayı üstlenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "bunu açık/yerel hedef id'si olarak ele al" kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme geri dönüşü için `resolveTarget` kullanın.
- Sohbet id'leri, iş parçacığı id'leri, JID'ler, handle'lar ve oda id'leri gibi sağlayıcıya özgü yerel id'leri genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü params içinde tutun.

## Yapılandırma destekli dizinler

Dizin girdilerini yapılandırmadan türeten Plugin'ler bu mantığı Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanalın aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın:

- izin listesi odaklı DM eşleri
- yapılandırılmış kanal/grup haritaları
- hesaba kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulaması
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özel hesap incelemesi ve id normalleştirmesi Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığı aynı şekli döndürür:

- bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model id'lerine, temel URL varsayılanlarına veya auth ile kapılı model meta verilerine sahipse `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw'ın yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API anahtarı veya env odaklı sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: son geçiş, diğer örtük sağlayıcılardan sonra

Anahtar çakışmasında daha sonraki sağlayıcılar kazanır; böylece Plugin'ler aynı sağlayıcı id'sine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak çalışmaya devam eder
- hem `catalog` hem `discovery` kayıtlıysa, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir ve gerekli secrets eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` gibi salt okunur komut yolları ve doctor/yapılandırma onarım akışları, yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmaya ihtiyaç duymamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda credential kaynağı/durumu alanlarını ekleyin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerleri döndürmeniz gerekmez. Durum tarzı komutlar için `tokenStatus: "available"` döndürmek (ve eşleşen kaynak alanı) yeterlidir.
- Bir credential SecretRef aracılığıyla yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı çökertmek veya yapılandırılmamış gibi yanlış raporlamak yerine "bu komut yolunda yapılandırılmış ancak kullanılamıyor" olarak raporlamasını sağlar.

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

Her giriş bir Plugin'e dönüşür. Paket birden çok extensions listeliyorsa, Plugin id'si
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir olacak şekilde bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruma rayı: her `openclaw.extensions` girişi, symlink çözümlemesinden sonra Plugin dizini içinde kalmalıdır. Paket dizininden dışarı çıkan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (lifecycle script'leri yok,
çalışma zamanında dev bağımlılıkları yok) ve devralınan global npm kurulum ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülüne işaret edebilir.
OpenClaw devre dışı bırakılmış bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ancak hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry` yükler. Bu, ana Plugin girişiniz araçları, hooks'ları veya başka yalnızca çalışma zamanı kodlarını da bağladığında başlatmayı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile bir kanal Plugin'ini Gateway'in dinleme öncesi başlatma aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken başlatma yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girişinin başlatmanın bağımlı olduğu kanala ait her capability'yi kaydetmesi gerektiği anlamına gelir, örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı zaman aralığında var olması gereken tüm gateway yöntemleri, araçları veya hizmetleri

Tam girişiniz hâlâ gerekli herhangi bir başlatma capability'sine sahipse, bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın başlatma sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca, tam kanal çalışma zamanı yüklenmeden önce çekirdeğin başvurabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları yayımlayabilir. Mevcut kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, eski tek hesaplı kanal yapılandırmasını tam Plugin girişini yüklemeden
`channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten mevcut olduğunda
yalnızca kimlik doğrulama/önyükleme anahtarlarını adlandırılmış yükseltilmiş bir
hesaba taşır ve her zaman `accounts.default` oluşturmak yerine yapılandırılmış
kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme yüzeyi keşfini tembel
tutar. İçe aktarma süresi hafif kalır; yükseltme yüzeyi, modül içe aktarımında
paketlenmiş kanal başlangıcına yeniden girmek yerine yalnızca ilk kullanımda
yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemleri içerdiğinde, bunları Plugin'e özgü
bir önekte tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar
bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

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

Kanal Plugin'leri kurulum/keşif meta verilerini `openclaw.channel` üzerinden ve
kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, çekirdek katalog
verilerini boş tutar.

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

Asgari örneğin ötesindeki kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: doküman bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin üstüne çıkması gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown uyumlu olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı doküman gezinme yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap mevcut olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözümlenirken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir
MPM kayıt dışa aktarımı). Şunlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir ya da daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile
sınırlandırılmış). Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalleştirilmiş kurulum kaynağı
bilgilerini sunar. Normalleştirilmiş bilgiler npm belirtiminin tam bir sürüm mü
yoksa değişken bir seçici mi olduğunu, beklenen bütünlük meta verilerinin mevcut
olup olmadığını ve yerel bir kaynak yolunun da kullanılabilir olup olmadığını
belirtir. Katalog/paket kimliği bilindiğinde, normalleştirilmiş bilgiler
ayrıştırılan npm paket adı bu kimlikten saparsa uyarır. Ayrıca `defaultChoice`
geçersiz olduğunda veya mevcut olmayan bir kaynağı işaret ettiğinde ve npm
bütünlük meta verileri geçerli bir npm kaynağı olmadan mevcut olduğunda uyarır.
Tüketiciler `installSource` alanını eklemeli isteğe bağlı bir alan olarak ele
almalıdır; böylece elle oluşturulmuş girdiler ve katalog şimleri bunu üretmek
zorunda kalmaz. Bu, başlangıç katılımı ve tanılamaların Plugin çalışma zamanını
içe aktarmadan kaynak düzlemi durumunu açıklamasına olanak tanır.

Resmi harici npm girdileri, tam bir `npmSpec` ile `expectedIntegrity` değerini
tercih etmelidir. Yalın paket adları ve dist-tag'ler uyumluluk için çalışmaya
devam eder, ancak katalog mevcut Plugin'leri bozmadan sabitlenmiş, bütünlüğü
denetlenmiş kurulumlara doğru ilerleyebilsin diye kaynak düzlemi uyarıları
gösterirler. Başlangıç katılımı yerel bir katalog yolundan kurulum yaptığında,
mümkün olduğunda `source: "path"` ve çalışma alanına göreli `sourcePath` ile
yönetilen bir Plugin Plugin dizini girdisi kaydeder. Mutlak operasyonel yükleme
yolu `plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu
yollarının uzun ömürlü yapılandırmaya yinelenerek yazılmasını önler. Bu, yerel
geliştirme kurulumlarını kaynak düzlemi tanılamalarında görünür tutarken ikinci
bir ham dosya sistemi yolu ifşa yüzeyi eklemez. Kalıcı `plugins/installs.json`
Plugin dizini, kurulum kaynağının doğruluk kaynağıdır ve Plugin çalışma zamanı
modülleri yüklenmeden yenilenebilir. `installRecords` haritası, bir Plugin
manifesti eksik veya geçersiz olduğunda bile kalıcıdır; `plugins` dizisi yeniden
oluşturulabilir bir manifest görünümüdür.

## Bağlam motoru Plugin'leri

Bağlam motoru Plugin'leri alım, derleme ve Compaction için oturum bağlamı
orkestrasyonuna sahip olur. Bunları Plugin'inizden `api.registerContextEngine(id, factory)`
ile kaydedin, ardından etkin motoru `plugins.slots.contextEngine` ile seçin.

Bunu, Plugin'inizin yalnızca bellek araması veya hook eklemek yerine varsayılan
bağlam işlem hattını değiştirmesi ya da genişletmesi gerektiğinde kullanın.

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

Fabrika `ctx`, oluşturma zamanı ilklendirmesi için isteğe bağlı `config`,
`agentDir` ve `workspaceDir` değerlerini sunar.

Motorunuz Compaction algoritmasına sahip **değilse**, `compact()` uygulanmış
kalsın ve açıkça devretsin:

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

## Yeni bir yetenek ekleme

Bir Plugin mevcut API'ye uymayan davranışa ihtiyaç duyduğunda, özel bir içeri
erişimle Plugin sistemini atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışa sahip olması gerektiğine karar verin: politika, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı biçimi.
2. tipli Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` öğesini en küçük kullanışlı
   tipli yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin'leri yeni yeteneği, bir satıcı uygulamasını
   doğrudan içe aktarmak yerine çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı Plugin'leri ardından arka uçlarını bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt biçiminin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir sağlayıcının dünya görüşüne sabitlenmeden bu şekilde kanaatli
kalır. Somut bir dosya kontrol listesi ve çalışılmış örnek için
[Capability Cookbook](/tr/plugins/architecture) bölümüne bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle bu yüzeylere birlikte
dokunmalıdır:

- `src/<capability>/types.ts` içinde çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içinde çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içinde Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içinde Plugin kayıt defteri bağlantısı
- özellik/kanal Plugin'lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içinde Plugin çalışma zamanı sunumu
- `src/test-utils/plugin-registration.ts` içinde yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içinde sahiplik/sözleşme doğrulamaları
- `docs/` içinde operatör/Plugin dokümanları

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin henüz tam olarak entegre
edilmediğinin bir işaretidir.

### Yetenek şablonu

Asgari desen:

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

Sözleşme testi deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesine + orkestrasyona sahip olur
- satıcı Plugin'leri satıcı uygulamalarına sahip olur
- özellik/kanal Plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel yetenek modeli ve biçimleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin'ler oluşturma](/tr/plugins/building-plugins)
