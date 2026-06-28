---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırasını veya kayıt defteri durumunu hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisi iç işleyişi: yükleme hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisi iç yapıları
x-i18n:
    generated_at: "2026-06-28T00:50:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, Plugin biçimleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
iç mekanikler için başvuru kaynağıdır: yükleme hattı, kayıt defteri, runtime hook'ları,
Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript acil durum Jiti fallback'ini kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/runtime yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi mevcutsa onu çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları runtime yürütmesinden **önce** gerçekleşir. Giriş Plugin
kökünün dışına çıktığında, yol herkes tarafından yazılabilir olduğunda veya
paketli olmayan Plugin'ler için yol sahipliği şüpheli göründüğünde adaylar engellenir.

Engellenen adaylar tanılama için Plugin id'lerine bağlı kalır. Yapılandırma
hâlâ bu id'ye başvuruyorsa doğrulama, Plugin'i mevcut ama engellenmiş olarak
raporlar ve yapılandırma girdisini bayat kabul etmek yerine yol güvenliği uyarısına
geri işaret eder.

### Manifest öncelikli davranış

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şu amaçlarla kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin runtime'ını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için runtime modülü veri düzlemi parçasıdır. Hook'lar,
araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri
tanımlayıcılarıdır; runtime kaydının, `register(...)` veya `setupEntry` yerine
geçmezler. İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri
materyalizasyonundan önce Plugin yüklemeyi daraltmak için manifest komut, kanal
ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komuta sahip Plugin'lere daraltılır
- kanal kurulumu/Plugin çözümlemesi, istenen kanal id'sine sahip Plugin'lere
  daraltılır
- açık sağlayıcı kurulumu/runtime çözümlemesi, istenen sağlayıcı id'sine sahip
  Plugin'lere daraltılır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıçtan
  çıkışlar için `activation.onStartup` kullanır; başlangıç meta verisi olmayan
  Plugin'ler yalnızca daha dar etkinleştirme tetikleyicileriyle yüklenir

Geniş `all` kapsamını isteyen istek zamanı runtime ön yüklemeleri yine de
yapılandırma, başlangıç planlaması, yapılandırılmış kanallar, yuvalar ve
otomatik etkinleştirme kurallarından açık bir etkili Plugin id kümesi türetir.
Bu türetilmiş küme boşsa OpenClaw, keşfedilebilir her Plugin'e genişletmek
yerine boş bir runtime kayıt defteri yükler.

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca id'lerden oluşan
bir API ve yeni tanılamalar için bir plan API'si sunar. Plan girdileri bir
Plugin'in neden seçildiğini raporlar; açık `activation.*` planlayıcı ipuçlarını
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hook'lar gibi manifest sahipliği fallback'inden ayırır.
Bu neden ayrımı uyumluluk sınırıdır: mevcut Plugin meta verileri çalışmaya
devam ederken yeni kod, runtime yükleme semantiğini değiştirmeden geniş
ipuçlarını veya fallback davranışını algılayabilir.

Kurulum keşfi artık `setup-api`'ye fallback yapmadan önce aday Plugin'leri
daraltmak için `setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait
id'leri tercih eder; bu fallback hâlâ kurulum zamanı runtime hook'larına ihtiyaç
duyan Plugin'ler içindir. Sağlayıcı kurulum listeleri, sağlayıcı runtime'ını
yüklemeden manifest `providerAuthChoices`, tanımlayıcıdan türetilmiş kurulum
seçenekleri ve kurulum kataloğu meta verilerini kullanır. Açık
`setup.requiresRuntime: false` yalnızca tanımlayıcıya dayalı bir kesme noktasıdır;
atlanmış `requiresRuntime`, uyumluluk için eski setup-api fallback'ini korur.
Birden fazla keşfedilmiş Plugin aynı normalize edilmiş kurulum sağlayıcısını
veya CLI arka uç id'sini sahiplenirse kurulum araması, keşif sırasına dayanmak
yerine belirsiz sahibi reddeder. Kurulum runtime'ı yürütüldüğünde kayıt defteri
tanılamaları, eski Plugin'leri engellemeden `setup.providers` /
`setup.cliBackends` ile setup-api tarafından kaydedilen sağlayıcılar veya CLI
arka uçları arasındaki sapmayı raporlar.

### Plugin önbelleği sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri
verilerini duvar saati pencerelerinin arkasında önbelleğe almaz. Kurulumlar,
manifest düzenlemeleri ve yükleme yolu değişiklikleri bir sonraki açık meta veri
okumasında veya anlık görüntü yeniden oluşturmasında görünür olmalıdır.
Manifest dosya ayrıştırıcısı, açılan manifest yolu, inode, boyut ve zaman
damgalarıyla anahtarlanan sınırlı bir dosya imzası önbelleği tutabilir; bu
önbellek yalnızca değişmemiş baytları yeniden ayrıştırmayı önler ve keşif,
kayıt defteri, sahip veya politika yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu gizli bir önbellek değil, açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları geçerli `PluginMetadataSnapshot` değerini,
türetilmiş `PluginLookUpTable` değerini veya açık bir manifest kayıt defterini
çağrı zinciri boyunca geçirmelidir. Yapılandırma doğrulaması, başlangıç
otomatik etkinleştirmesi, Plugin bootstrap'i ve sağlayıcı seçimi bu nesneleri
geçerli yapılandırmayı ve Plugin envanterini temsil ettikleri sürece yeniden
kullanabilir. Kurulum araması, belirli kurulum yolu açık bir manifest kayıt
defteri almadığı sürece manifest meta verilerini hâlâ isteğe bağlı olarak
yeniden oluşturur; bunu gizli arama önbellekleri eklemek yerine soğuk yol
fallback'i olarak tutun. Girdi değiştiğinde, anlık görüntüyü mutasyona uğratmak
veya geçmiş kopyaları tutmak yerine yeniden oluşturup değiştirin.
Etkin Plugin kayıt defteri üzerindeki görünümler ve paketli kanal bootstrap
yardımcıları geçerli kayıt defterinden/kökten yeniden hesaplanmalıdır. Tek bir
çağrı içinde işi tekilleştirmek veya yeniden girişi korumak için kısa ömürlü
haritalar uygundur; bunlar süreç meta veri önbelleklerine dönüşmemelidir.

Plugin yükleme için kalıcı önbellek katmanı runtime yüklemesidir. Kod veya
kurulu yapıtlar gerçekten yüklendiğinde yükleyici durumunu yeniden kullanabilir,
örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin runtime kayıt defterleri
- aynı runtime yüzeyini tekrar tekrar içe aktarmayı önlemek için kullanılan jiti/modül önbellekleri ve genel yüzey yükleyici önbellekleri
- kurulu Plugin yapıtları için dosya sistemi önbellekleri
- yol normalizasyonu veya yinelenen çözümleme için kısa ömürlü çağrı başına haritalar

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran özellikle runtime
yüklemesi istemedikçe "bu sağlayıcının sahibi hangi Plugin?" gibi kontrol
düzlemi sorularını yanıtlamamalıdırlar.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- kurulu Plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı politikası veya genel yapıt
  meta verileri
- değişen bir manifestin, kurulu dizinin veya yükleme yolunun bir sonraki meta
  veri okumasında görünür olması gereken manifestten türetilmiş diğer yanıtlar

Kalıcı kurulu Plugin dizininden manifest meta verilerini yeniden oluşturan
çağıranlar bu kayıt defterini isteğe bağlı olarak yeniden oluşturur. Kurulu
dizin dayanıklı kaynak düzlemi durumudur; gizli bir süreç içi meta veri
önbelleği değildir.

## Kayıt defteri modeli

Yüklenmiş Plugin'ler rastgele çekirdek global değerleri doğrudan mutasyona
uğratmaz. Merkezi bir Plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılamalar)
- araçlar
- eski hook'lar ve tipli hook'lar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan servisleri
- Plugin'e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu
kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek runtime -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu çekirdek yüzeyinin yalnızca tek
bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku",
"her Plugin modülünü özel ele al" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, onay çözüldüğünde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
`api.onConversationBindingResolved(...)` kullanın:

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

Geri çağrı yük alanı alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanmış istekler için çözümlenmiş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen id'si ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini
değiştirmez ve çekirdek onay işleme bittikten sonra çalışır.

## Sağlayıcı runtime hook'ları

Sağlayıcı Plugin'lerinin üç katmanı vardır:

- Ucuz runtime öncesi arama için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı hook'ları**: `catalog` (eski `discovery`) ve
  `applyConfigDefaults`.
- **Runtime hook'ları**: kimlik doğrulama, model çözümleme, akış sarmalama,
  düşünme seviyeleri, yeniden oynatma politikası ve kullanım uç noktalarını
  kapsayan 40+ isteğe bağlı hook. Tam liste için bkz.
  [Hook sırası ve kullanım](#hook-order-and-usage).

OpenClaw genel agent döngüsüne, failover'a, transcript işlemeye ve araç
politikasına hâlâ sahiptir. Bu hook'lar, tamamen özel bir çıkarım taşımasına
ihtiyaç duymadan sağlayıcıya özgü davranış için genişletme yüzeyidir.

Sağlayıcının, genel auth/durum/model seçici yollarının Plugin runtime'ını
yüklemeden görmesi gereken env tabanlı kimlik bilgileri olduğunda manifest
`setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış
`providerAuthEnvVars`, kullanımdan kaldırma penceresi boyunca uyumluluk
adaptörü tarafından hâlâ okunur ve bunu kullanan paketli olmayan Plugin'ler bir
manifest tanılaması alır. Bir sağlayıcı id'sinin başka bir sağlayıcı id'sinin
env var'larını, auth profillerini, yapılandırma destekli auth değerlerini ve
API anahtarı onboarding seçimini yeniden kullanması gerektiğinde manifest
`providerAuthAliases` kullanın. Onboarding/auth seçimi CLI yüzeylerinin
Plugin runtime'ını yüklemeden sağlayıcının seçim id'sini, grup etiketlerini ve
basit tek bayraklı auth kablolamasını bilmesi gerektiğinde manifest
`providerAuthChoices` kullanın. Sağlayıcı runtime `envVars` değerlerini
onboarding etiketleri veya OAuth client-id/client-secret kurulum değişkenleri
gibi operatöre dönük ipuçları için tutun.

Bir kanalın, genel shell-env fallback'inin, yapılandırma/durum kontrollerinin
veya kurulum istemlerinin kanal runtime'ını yüklemeden görmesi gereken env
odaklı auth veya kurulumu olduğunda manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanım

Model/sağlayıcı Plugin'leri için OpenClaw hook'ları kabaca şu sırayla çağırır.
"When to use" sütunu hızlı karar kılavuzudur.
`ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi OpenClaw'ın artık
çağırmadığı yalnızca uyumluluk amaçlı sağlayıcı alanları kasıtlı olarak burada
listelenmemiştir.

| #   | Kanca                             | Ne yapar                                                                                                      | Ne zaman kullanılır                                                                                                                           |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                  | Sağlayıcı bir katalog veya temel URL varsayılanlarına sahipse                                                                                 |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcının sahip olduğu genel yapılandırma varsayılanlarını uygular  | Varsayılanlar kimlik doğrulama moduna, ortama veya sağlayıcı model ailesi semantiklerine bağlıysa                                             |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt/katalog yolunu dener                                                               | _(bir Plugin kancası değildir)_                                                                                                               |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahipse                                                                    |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                  | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğine sahipse                                                  |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                 | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyarsa; paketli Google ailesi yardımcıları desteklenen Google yapılandırma girdilerini de yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                       | Sağlayıcı, uç nokta kaynaklı yerel akış kullanım meta verisi düzeltmelerine ihtiyaç duyarsa                                                   |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretçisi kimlik doğrulamasını çözümler | Sağlayıcılar kendi ortam işaretçisi API anahtarı çözümleme kancalarını sunarsa                                                                |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamasını görünür kılar | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcının sahip olduğu harici kimlik doğrulama profillerini üst katmana bindirir; CLI/uygulama sahipliğindeki kimlik bilgileri için varsayılan `persistence`, `runtime-only` değeridir | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama kimlik bilgilerini yeniden kullanırsa; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını ortam/yapılandırma destekli kimlik doğrulamasının arkasına düşürür | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profilleri saklıyorsa                                                             |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıtta olmayan, sağlayıcının sahip olduğu model kimlikleri için senkron yedek çözüm              | Sağlayıcı rastgele üst kaynak model kimliklerini kabul ediyorsa                                                                               |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma, ardından `resolveDynamicModel` yeniden çalışır                                             | Sağlayıcı bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyaç duyarsa                                                            |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenmiş modeli kullanmadan önce son yeniden yazım                                      | Sağlayıcı taşıma yeniden yazımlarına ihtiyaç duyar ancak hâlâ bir çekirdek taşıma kullanırsa                                                  |
| 14  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalleştirir                                              | Sağlayıcı taşıma ailesi şema temizliğine ihtiyaç duyarsa                                                                                      |
| 15  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcının sahip olduğu şema tanılarını görünür kılar                              | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları isterse                                                    |
| 16  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                        | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/nihai çıktıya ihtiyaç duyarsa                                                           |
| 17  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi                              | Sağlayıcı varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyarsa                                         |
| 18  | `createStreamFn`                  | Normal akış yolunu özel bir taşıma ile tamamen değiştirir                                                     | Sağlayıcı yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyaç duyarsa                                                           |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonraki akış sarmalayıcısı                                                | Sağlayıcı özel taşıma olmadan istek başlığı/gövde/model uyumluluk sarmalayıcılarına ihtiyaç duyarsa                                           |
| 21  | `resolveTransportTurnState`       | Tur başına yerel taşıma başlıkları veya meta verileri ekler                                                   | Sağlayıcı, genel taşımaların sağlayıcıya yerel tur kimliğini göndermesini isterse                                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum soğuma politikası ekler                                                | Sağlayıcı, genel WS taşımalarının oturum başlıklarını veya yedek politikasını ayarlamasını isterse                                            |
| 23  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür          | Sağlayıcı ek kimlik doğrulama meta verisi saklar ve özel bir çalışma zamanı belirteç şekline ihtiyaç duyarsa                                  |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması              | Sağlayıcı paylaşılan OpenClaw yenileyicilerine uymuyorsa                                                                                      |
| 25  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                     | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım rehberliğine ihtiyaç duyarsa                                     |
| 26  | `matchesContextOverflowError`     | Sağlayıcının sahip olduğu bağlam penceresi taşması eşleştiricisi                                              | Sağlayıcının, genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                         |
| 27  | `classifyFailoverReason`          | Sağlayıcının sahip olduğu yük devretme nedeni sınıflandırması                                                 | Sağlayıcı ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. nedenlere eşleyebiliyorsa                                                        |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği politikası                                                  | Sağlayıcı proxy’ye özgü önbellek TTL kapılamasına ihtiyaç duyarsa                                                                             |
| 29  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçer                                                 | Sağlayıcı, sağlayıcıya özgü eksik kimlik doğrulama kurtarma ipucuna ihtiyaç duyarsa                                                           |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                       | Sağlayıcı `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyaç duyarsa                                                   |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntüleme etiketleri ve varsayılan                                       | Sağlayıcı, seçili modeller için özel bir düşünme basamağı veya ikili etiket sunuyorsa                                                         |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme geçişi uyumluluk kancası                                                             | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                        |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                                | Sağlayıcı yalnızca modellerin bir alt kümesinde `xhigh` isterse                                                                               |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                  | Sağlayıcı bir model ailesi için varsayılan `/think` politikasına sahipse                                                                      |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                       | Sağlayıcı canlı/smoke tercih edilen model eşleştirmesine sahipse                                                                              |
| 36  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcı bir belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyarsa                                                     |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                       | Sağlayıcı özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyaç duyarsa                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı vardır                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir embedding bağdaştırıcısı oluştur                                                     | Bellek embedding davranışı sağlayıcı Plugin'ine aittir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi denetleyen bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel transkript ilkesine ihtiyacı vardır (örneğin, düşünme bloklarının çıkarılması)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı vardır                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulamasını veya yeniden şekillendirmesini yap                                           | Sağlayıcı aktarımı, genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyaç duyar                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı vardır                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen sağlayıcı Plugin'ini denetler, ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştiren bir tane bulana kadar kanca yetenekli diğer sağlayıcı Plugin'lerine geçer. Bu, çağıranın yeniden yazımı hangi paketli Plugin'in sahip olduğunu bilmesini gerektirmeden alias/compat sağlayıcı şimlerinin çalışmasını sağlar. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, paketli Google yapılandırma normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir kablo protokolüne veya özel istek yürütücüsüne ihtiyacı varsa bu farklı bir uzantı sınıfıdır. Bu kancalar, OpenClaw'ın normal çıkarım döngüsünde hâlâ çalışan sağlayıcı davranışı içindir.

`resolveUsageAuth`, OpenClaw'ın kullanım/durum yüzeyleri için `fetchUsageSnapshot` çağırıp çağırmayacağına veya genel kimlik bilgisi çözümlemesine geri dönüp dönmeyeceğine karar verir. Sağlayıcının kullanım kimlik bilgisi varsa `{ token, accountId? }` döndürün, sağlayıcıya ait kullanım kimlik doğrulaması isteği işlediyse ve genel API anahtarı/OAuth geri dönüşünü bastırması gerekiyorsa `{ handled: true }` döndürün, sağlayıcı kullanım kimlik doğrulamasını işlemediyse `null` veya `undefined` döndürün.

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

Paketli sağlayıcı Plugin'leri, her satıcının katalog, kimlik doğrulama, düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uyacak şekilde yukarıdaki kancaları birleştirir. Yetkili kanca kümesi her Plugin ile birlikte `extensions/` altında bulunur; bu sayfa listeyi yansıtmak yerine şekilleri gösterir.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI; OpenClaw'ın statik kataloğundan önce yukarı akış model kimliklerini gösterebilmek için `catalog` ile birlikte `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai; token değişimi ve `/usage` entegrasyonunun sahibi olmak için `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` + `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`, `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin'in temizliği yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` üzerinden transkript ilkesine katılmasını sağlar.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta başlıkları, `/fast` / `serviceTier` ve `context1m`; genel SDK yerine Anthropic Plugin'inin herkese açık `api.ts` / `contract-api.ts` sınırında bulunur (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`).
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler, seçili çekirdek yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızını döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteğini destekler. Microsoft desteklemez.

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

- TTS ilkesini, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Konuşma sağlayıcılarını satıcıya ait sentez davranışı için kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu yetenek sözleşmelerini ekledikçe tek bir satıcı Plugin'i metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarının sahibi olabilir.

Görüntü/ses/video anlama için Plugin'ler genel bir anahtar/değer torbası yerine yazılmış tek bir medya anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal bağlantılarını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Eklemeli genişleme yazılmış kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı kalıbı izler:
  - çekirdek yetenek sözleşmesine ve çalışma zamanı yardımcısına sahiptir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` tüketir

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
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
- `extractStructuredWithModel(...)`, sınırlı sağlayıcıya ait görüntü öncelikli çıkarım için Plugin'e dönük sınırdır. En az bir görüntü girdisi ekleyin; metin girdileri tamamlayıcı bağlamdır. Ürün Plugin'leri kendi rotalarına ve şemalarına sahip olurken OpenClaw sağlayıcı/çalışma zamanı sınırına sahiptir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde (örneğin atlanan/desteklenmeyen girdi) `{ text: undefined }` döndürür.
- `api.runtime.stt.transcribeAudioFile(...)` uyumluluk alias'ı olarak kalır.

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalışma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait geri dönüş çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile katılmalıdır.
- Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt ajan çalıştırmaları hâlâ çalışır, ancak geçersiz kılma istekleri sessizce geri dönmek yerine reddedilir.
- Plugin tarafından oluşturulan alt ajan oturumları, oluşturan Plugin kimliğiyle etiketlenir. Geri dönüş `api.runtime.subagent.deleteSession(...)` yalnızca bu sahip olunan oturumları silebilir; rastgele oturum silme hâlâ yönetici kapsamlı bir Gateway isteği gerektirir.

Web araması için Plugin'ler, ajan aracı bağlantılarına erişmek yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

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

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Web arama sağlayıcılarını satıcıya özgü arama taşımaları için kullanın.
- `api.runtime.webSearch.*`, ajan aracı sarmalayıcısına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

Plugin'ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açabilir.

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
- `auth`: zorunlu. Normal Gateway kimlik doğrulaması gerektirmek için `"gateway"`, Plugin tarafından yönetilen kimlik doğrulaması/webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin’in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadığı sürece reddedilir ve bir Plugin başka bir Plugin’in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` düşüş zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen webhook’lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway isteği çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak kısıtlayıcıdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rota çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin özel bir girişte `trusted-proxy` veya `gateway.auth.mode = "none"`) yalnızca başlık açıkça bulunduğunda `x-openclaw-scopes` değerini kabul eder
  - bu kimlik taşıyan Plugin rota isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yönetici davranışı gerektiriyorsa, kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin’ler yazarken monolitik `openclaw/plugin-sdk` kök barrel yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt temel öğeleri                         |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/oluşturma yardımcıları                 |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme   |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal Plugin’leri dar bağlantı noktalarından oluşan bir aileden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karıştırmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen odaklı `*-runtime` alt yolları
altında bulunur (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel’i yerine
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation`
tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
küçük kanal yardımcı facade’leri, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin’ler için kullanımdan kaldırılmış uyumluluk shim’leridir. Yeni kod bunun yerine daha dar genel temel öğeleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketlenmiş Plugin paket kökü başına):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/tip barrel’i
- `runtime-api.js` — yalnızca çalışma zamanı barrel’i
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin’ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir Plugin’den başka bir Plugin paketinin `src/*` yolunu asla içe aktarmayın.
Facade ile yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder, ardından diskteki çözümlenmiş yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding` ve `speech` gibi yeteneğe özel alt yollar, paketlenmiş Plugin’ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak uzun vadeli donmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK başvuru sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin’ler, tepkiler, okumalar ve anketler gibi mesaj dışı temel öğeler için kanala özel `describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için [Mesaj Sunumu](/tr/plugins/message-presentation) bölümüne bakın.

Gönderim yapabilen Plugin’ler, mesaj yetenekleri aracılığıyla neyi işleyebileceklerini bildirir:

- semantik sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak işleyip işlememeye veya metne düşürmeye karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış yolları açmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin’ler için dışa aktarılmaya devam eder, ancak yeni Plugin’ler bunları kullanmamalıdır.

## Kanal hedef çözümlemesi

Kanal Plugin’leri kanala özel hedef semantiklerine sahip olmalıdır. Paylaşılan giden ana makineyi genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin araması yerine doğrudan id benzeri çözümlemeye atlanıp atlanmayacağını çekirdeğe söyler.
- `messaging.targetResolver.reservedLiterals`, o sağlayıcı için kanal/oturum başvurusu olan yalın sözcükleri listeler. Çözümleme, ayrılmış sabitleri reddetmeden önce yapılandırılmış dizin girdilerini korur, ardından dizin eşleşmesi yoksa kapalı şekilde başarısız olur.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden sonra veya dizin eşleşmesi kaçırıldıktan sonra son sağlayıcıya ait çözümlemeye ihtiyaç duyması durumunda Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, hedef çözümlendikten sonra sağlayıcıya özgü oturum rotası oluşturmayı sahiplenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- “Bunu açık/yerel hedef id olarak ele al” kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme geri dönüşü için `resolveTarget` kullanın.
- Sohbet id’leri, konu id’leri, JID’ler, handle’lar ve oda id’leri gibi sağlayıcıya özgü yerel id’leri genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin’ler, bu mantığı Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bir kanal aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda bunu kullanın:

- izin listesiyle yönetilen DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- yinelenenleri kaldırma/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özel hesap incelemesi ve id normalleştirmesi Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin’leri, çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw’un `models.providers` içine yazdığı şeklin aynısını döndürür:

- tek sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model id’lerine, temel URL varsayılanlarına veya auth korumalı model meta verilerine sahipse `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw’un yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env odaklı sağlayıcılar
- `profile`: auth profilleri olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Sonraki sağlayıcılar anahtar çakışmasında kazanır; bu nedenle Plugin’ler aynı sağlayıcı id’sine sahip yerleşik bir sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Plugin’ler ayrıca salt okunur model satırlarını
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` aracılığıyla yayımlayabilir. Bu, liste/yardım/seçici yüzeyleri için ileri yoldur ve
`text`, `image_generation`, `video_generation` ve `music_generation` satırlarını destekler.
Sağlayıcı Plugin’leri canlı uç nokta çağrılarına, token değişimine ve satıcı yanıt eşlemesine hâlâ sahiptir; çekirdek ortak satır şekline, kaynak etiketlerine ve medya aracı yardım biçimlendirmesine sahiptir. Medya oluşturma sağlayıcı kayıtları, `defaultModel`, `models` ve `capabilities` değerlerinden statik katalog satırlarını otomatik olarak sentezler.

Uyumluluk:

- `discovery` eski bir diğer ad olarak hâlâ çalışır, ancak kullanımdan kaldırma uyarısı yayar
- hem `catalog` hem de `discovery` kayıtlıysa, OpenClaw `catalog` kullanır
- `augmentModelCatalog` kullanımdan kaldırılmıştır; paketlenmiş sağlayıcılar ek satırları `registerModelCatalogProvider` aracılığıyla yayımlamalıdır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir ve gerekli secret’lar eksik olduğunda hızlı şekilde başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` gibi salt okunur komut yolları ve doctor/yapılandırma onarım akışları, yalnızca yapılandırmayı tanımlamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynak/durum alanlarını ekleyin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerleri döndürmeniz gerekmez. `tokenStatus: "available"` (ve eşleşen kaynak alanı) döndürmek durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef ile yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmek veya hesabı yapılandırılmamış olarak yanlış raporlamak yerine “bu komut yolunda yapılandırılmış ancak kullanılamıyor” bilgisini raporlamasını sağlar.

## Paket paketleri

Bir Plugin dizini, `openclaw.extensions` içeren bir `package.json` içerebilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her giriş bir Plugin olur. Paket birden çok extension listeliyorsa, Plugin id’si
`name/<fileBase>` olur.

Plugin’iniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir olsun diye bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik bariyeri: her `openclaw.extensions` girişi, symlink çözümlemesinden sonra Plugin dizini içinde kalmalıdır. Paket dizininden dışarı çıkan girişler reddedilir.

Güvenlik notu: `openclaw plugins install`, plugin bağımlılıklarını proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yoktur, çalışma zamanında geliştirme bağımlılıkları yoktur) ve devralınan global npm kurulum ayarlarını yok sayar. Plugin bağımlılık ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü gösterebilir. OpenClaw devre dışı bırakılmış bir kanal plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya bir kanal plugin'i etkin olup hâlâ yapılandırılmadığında, tam plugin girişinin yerine `setupEntry` yükler. Bu, ana plugin girişiniz araçları, kancaları veya diğer yalnızca çalışma zamanı kodunu da bağladığında başlangıç ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, bir kanal plugin'ini, kanal zaten yapılandırılmış olsa bile gateway'in dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan önce var olması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girişinin başlangıcın bağımlı olduğu kanalın sahip olduğu her yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere sırasında var olması gereken tüm gateway yöntemleri, araçları veya hizmetleri

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğine sahipse bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden önce başvurabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları yayımlayabilir. Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam plugin girişini yüklemeden eski tek hesaplı kanal yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır. Matrix geçerli paketlenmiş örnektir: adlandırılmış hesaplar zaten mevcut olduğunda yalnızca auth/bootstrap anahtarlarını adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman `accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama adaptörleri, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma süresi hafif kalır; yükseltme yüzeyi, modül içe aktarımında paketlenmiş kanal başlangıcına yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemleri içerdiğinde, bunları plugin'e özgü bir önekte tutun. Çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

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

### Kanal katalog metaverileri

Kanal plugin'leri, `openclaw.channel` üzerinden kurulum/keşif metaverilerini ve `openclaw.install` üzerinden kurulum ipuçlarını duyurabilir. Bu, çekirdek kataloğunu verisiz tutar.

Örnek:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (kendi barındırmalı)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk webhook botları üzerinden kendi barındırmalı sohbet.",
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

Minimal örneğin ötesindeki yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: dokümantasyon bağlantısı için bağlantı metnini geçersiz kıl
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin denetimleri
- `markdownCapable`: kanalı giden biçimlendirme kararları için markdown yetenekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizle
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizle
- `exposure.docs`: kanalı dokümantasyon gezinti yüzeyleri için dahili/özel olarak işaretle
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil et
- `forceAccountBinding`: yalnızca bir hesap var olsa bile açık hesap bağlamayı zorunlu kıl
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözerken oturum aramasını tercih et

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM kayıt dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri, ham `openclaw.install` bloğunun yanında normalize edilmiş kurulum kaynağı olgularını açığa çıkarır. Normalize edilmiş olgular, npm belirtiminin kesin bir sürüm mü yoksa değişken bir seçici mi olduğunu, beklenen bütünlük metaverilerinin mevcut olup olmadığını ve yerel kaynak yolunun da kullanılabilir olup olmadığını belirler. Katalog/paket kimliği bilindiğinde, normalize edilmiş olgular ayrıştırılan npm paket adının bu kimlikten sapması durumunda uyarır. Ayrıca `defaultChoice` geçersiz olduğunda veya kullanılabilir olmayan bir kaynağı gösterdiğinde ve geçerli bir npm kaynağı olmadan npm bütünlük metaverileri mevcut olduğunda da uyarırlar. Tüketiciler, elle oluşturulmuş girdilerin ve katalog shim'lerinin bunu sentezlemek zorunda kalmaması için `installSource` alanını eklemeli isteğe bağlı bir alan olarak ele almalıdır. Bu, onboarding ve tanılamanın plugin çalışma zamanını içe aktarmadan kaynak düzlemi durumunu açıklamasını sağlar.

Resmi harici npm girdileri kesin bir `npmSpec` ile `expectedIntegrity` tercih etmelidir. Çıplak paket adları ve dist-tag'ler uyumluluk için hâlâ çalışır, ancak kaynak düzlemi uyarıları gösterirler; böylece katalog, mevcut plugin'leri bozmadan sabitlenmiş, bütünlük denetimli kurulumlara doğru ilerleyebilir. Onboarding yerel katalog yolundan kurulum yaptığında, mümkün olduğunda `source: "path"` ve çalışma alanına göreli `sourcePath` içeren yönetilen bir plugin plugin indeks girdisi kaydeder. Mutlak operasyonel yükleme yolu `plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu yollarını uzun ömürlü yapılandırmaya kopyalamaktan kaçınır. Bu, yerel geliştirme kurulumlarını ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamaları için görünür tutar. Kalıcı `installed_plugin_index` SQLite satırı, kurulum kaynağının doğruluk kaynağıdır ve plugin çalışma zamanı modülleri yüklenmeden yenilenebilir. `installRecords` eşlemesi, bir plugin manifest'i eksik veya geçersiz olduğunda bile dayanıklıdır; `plugins` yükü yeniden oluşturulabilir bir manifest görünümüdür.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri; alım, derleme ve Compaction için oturum bağlamı orkestrasyonuna sahip olur. Bunları plugin'inizden `api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru `plugins.slots.contextEngine` ile seçin.

Bunu, plugin'iniz yalnızca bellek araması veya kancalar eklemek yerine varsayılan bağlam işlem hattını değiştirmeye ya da genişletmeye ihtiyaç duyduğunda kullanın.

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

Factory `ctx`, oluşturma zamanı başlatması için isteğe bağlı `config`, `agentDir` ve `workspaceDir` değerlerini açığa çıkarır.

Etkin harness'ın kalıcı bir backend thread'i olduğunda `assemble()`, `contextProjection` döndürebilir. Eski tur başına projeksiyon için bunu atlayın. Derlenmiş bağlamın bir backend thread'ine bir kez enjekte edilip epoch değişene kadar yeniden kullanılması gerektiğinde `{ mode: "thread_bootstrap", epoch }` döndürün. Motorun anlamsal bağlamı değiştikten sonra, örneğin motorun sahip olduğu bir Compaction geçişinden sonra epoch'u değiştirin. Ana makineler, taze backend thread'lerinin ham gizli veri taşıyan yükleri kopyalamadan araç sürekliliğini koruması için araç çağrısı metaverilerini, girdi şeklini ve redakte edilmiş araç sonuçlarını thread-bootstrap projeksiyonunda koruyabilir.

Motorunuz Compaction algoritmasına sahip **değilse**, `compact()` uygulanmış kalsın ve açıkça devredin:

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

Bir plugin, geçerli API'ye uymayan davranışa ihtiyaç duyduğunda, plugin sistemini özel bir içeri erişimle atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi ortak davranışa sahip olması gerektiğine karar verin: politika, fallback, yapılandırma birleştirme, yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. tipli plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini en küçük yararlı tipli yetenek yüzeyiyle genişletin.
3. çekirdeği + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik plugin'leri, yeni yeteneği bir vendor uygulamasını doğrudan içe aktararak değil, çekirdek üzerinden tüketmelidir.
4. vendor uygulamalarını kaydedin
   Vendor plugin'leri ardından backend'lerini yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir sağlayıcının dünya görüşüne sabit kodlanmadan fikir sahibi kalmayı bu şekilde sürdürür. Somut bir dosya kontrol listesi ve çalışılmış örnek için [Yetenek Yemek Kitabı](/tr/plugins/adding-capabilities) bölümüne bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle bu yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt defteri bağlantısı
- özellik/kanal plugin'lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin dokümantasyonu

Bu yüzeylerden biri eksikse bu genellikle yeteneğin henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

Minimal desen:

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

// feature/channel plugin'leri için paylaşılan runtime yardımcısı
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Contract test deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- core, yetenek sözleşmesine + orkestrasyona sahip olur
- satıcı plugin'leri satıcı uygulamalarına sahip olur
- feature/channel plugin'leri runtime yardımcılarını tüketir
- contract testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel yetenek modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
