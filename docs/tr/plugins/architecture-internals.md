---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırası veya kayıt defteri durumunda hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisinin iç işleyişi: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve referans tabloları'
title: Plugin mimarisinin iç yapısı
x-i18n:
    generated_at: "2026-05-02T20:47:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, Plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
dahili mekanikler için başvuru kaynağıdır: yükleme hattı, kayıt defteri,
çalışma zamanı kancaları, Gateway HTTP rotaları, içe aktarma yolları ve şema
tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketlenmiş modüller yerel bir yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript acil durum Jiti yedeğini kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi varsa onu çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Girdi
Plugin kökünün dışına çıktığında, yol herkes tarafından yazılabilir olduğunda
veya yol sahipliği paketlenmemiş Plugin'ler için şüpheli göründüğünde adaylar
engellenir.

### Manifest öncelikli davranış

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills'i/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri
tanımlayıcılarıdır; çalışma zamanı kaydının, `register(...)` çağrısının veya
`setupEntry` öğesinin yerine geçmezler. İlk canlı etkinleştirme tüketicileri artık
daha geniş kayıt defteri oluşturmasından önce Plugin yüklemesini daraltmak için
manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komuta sahip olan Plugin'lerle sınırlanır
- kanal kurulumu/Plugin çözümlemesi, istenen kanal kimliğine sahip olan Plugin'lerle sınırlanır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen sağlayıcı kimliğine sahip olan Plugin'lerle sınırlanır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıçtan vazgeçmeler için `activation.onStartup` kullanır; başlangıç meta verisi olmayan Plugin'ler yalnızca daha dar etkinleştirme tetikleyicileri üzerinden yüklenir

Geniş `all` kapsamını isteyen istek zamanı çalışma zamanı ön yüklemeleri yine de
yapılandırmadan, başlangıç planlamasından, yapılandırılmış kanallardan, yuvalardan
ve otomatik etkinleştirme kurallarından açık bir etkili Plugin kimliği kümesi
türetir. Bu türetilmiş küme boşsa OpenClaw, keşfedilebilir her Plugin'e
genişletmek yerine boş bir çalışma zamanı kayıt defteri yükler.

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca kimliklerden oluşan
bir API ve yeni tanılama için bir plan API'si sunar. Plan girdileri, bir
Plugin'in neden seçildiğini bildirir; açık `activation.*` planlayıcı ipuçlarını
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve kancalar gibi manifest sahipliği yedeklerinden ayırır. Bu
neden ayrımı uyumluluk sınırıdır: mevcut Plugin meta verileri çalışmaya devam
ederken, yeni kod çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını
veya yedek davranışı algılayabilir.

Kurulum keşfi artık `setup-api` öğesine geri dönmeden önce aday Plugin'leri
daraltmak için `setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait
kimlikleri tercih eder; `setup-api` hâlâ kurulum zamanı çalışma zamanı
kancalarına ihtiyaç duyan Plugin'ler içindir. Sağlayıcı kurulum listeleri,
sağlayıcı çalışma zamanını yüklemeden manifest `providerAuthChoices`,
tanımlayıcıdan türetilen kurulum seçenekleri ve kurulum kataloğu meta verilerini
kullanır. Açık `setup.requiresRuntime: false` yalnızca tanımlayıcıya dayalı bir
kesme noktasıdır; atlanan `requiresRuntime`, uyumluluk için eski setup-api
yedeğini korur. Keşfedilen birden fazla Plugin aynı normalleştirilmiş kurulum
sağlayıcısı veya CLI arka uç kimliğini sahiplenirse kurulum araması keşif
sırasına güvenmek yerine belirsiz sahibi reddeder. Kurulum çalışma zamanı
çalıştığında, kayıt defteri tanılamaları eski Plugin'leri engellemeden
`setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen
sağlayıcılar veya CLI arka uçları arasındaki sapmayı bildirir.

### Plugin önbellek sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri
verilerini duvar saati pencerelerinin arkasında önbelleğe almaz. Kurulumlar,
manifest düzenlemeleri ve yükleme yolu değişiklikleri bir sonraki açık meta veri
okumasında veya anlık görüntü yeniden oluşturmasında görünür olmalıdır.
Manifest dosyası ayrıştırıcısı, açılan manifest yolu, inode, boyut ve zaman
damgalarıyla anahtarlanan sınırlı bir dosya imzası önbelleği tutabilir; bu
önbellek yalnızca değişmemiş baytları yeniden ayrıştırmayı önler ve keşif,
kayıt defteri, sahip veya ilke yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu, gizli bir önbellek değil, açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları mevcut `PluginMetadataSnapshot`, türetilmiş
`PluginLookUpTable` veya açık bir manifest kayıt defterini çağrı zinciri boyunca
iletmelidir. Yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme,
Plugin önyüklemesi ve sağlayıcı seçimi, bu nesneler mevcut yapılandırmayı ve
Plugin envanterini temsil ettiği sürece onları yeniden kullanabilir. Kurulum
araması, ilgili kurulum yolu açık bir manifest kayıt defteri almadığı sürece
manifest meta verilerini hâlâ isteğe bağlı olarak yeniden oluşturur; bunu gizli
arama önbellekleri eklemek yerine soğuk yol yedeği olarak tutun. Girdi
değiştiğinde, anlık görüntüyü değiştirmek veya geçmiş kopyaları tutmak yerine
yeniden oluşturup değiştirin.
Etkin Plugin kayıt defteri üzerindeki görünümler ve paketlenmiş kanal önyükleme
yardımcıları mevcut kayıt defterinden/kökten yeniden hesaplanmalıdır. Kısa
ömürlü haritalar, işi tekilleştirmek veya yeniden girişi korumak için tek bir
çağrı içinde uygundur; süreç meta veri önbelleklerine dönüşmemelidirler.

Plugin yüklemesi için kalıcı önbellek katmanı çalışma zamanı yüklemesidir. Kod
veya kurulu yapıtlar gerçekten yüklendiğinde yükleyici durumunu yeniden
kullanabilir, örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyini tekrar tekrar içe aktarmayı önlemek için kullanılan jiti/modül önbellekleri ve genel yüzey yükleyici önbellekleri
- kurulu Plugin yapıtları için dosya sistemi önbellekleri
- yol normalleştirme veya yinelenen çözümleme için kısa ömürlü çağrı başına haritalar

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran bilerek çalışma
zamanı yüklemesi istemedikçe "bu sağlayıcıya hangi Plugin sahip?" gibi kontrol
düzlemi sorularını yanıtlamamalıdırlar.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- kurulu Plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı ilkesi veya genel yapıt meta verileri
- değişen bir manifestin, kurulu dizinin veya yükleme yolunun bir sonraki meta veri okumasında görünür olması gereken diğer tüm manifestten türetilmiş yanıtlar

Kalıcı kurulu Plugin dizininden manifest meta verilerini yeniden oluşturan
çağıranlar, bu kayıt defterini isteğe bağlı olarak yeniden oluşturur. Kurulu
dizin dayanıklı kaynak düzlemi durumudur; gizli bir süreç içi meta veri önbelleği
değildir.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek genelleri doğrudan değiştirmez. Merkezi
bir Plugin kayıt defterine kayıt yaparlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılamalar)
- araçlar
- eski kancalar ve türlendirilmiş kancalar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin'e ait komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu
kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım bakım yapılabilirlik için önemlidir. Çoğu çekirdek yüzeyin yalnızca tek
bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku",
"her Plugin modülünü özel duruma al" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, bir onay çözümlendiğinde tepki verebilir.

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

Geri çağrı yükü alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenmiş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin
verildiğini değiştirmez ve çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinde üç katman vardır:

- Ucuz çalışma zamanı öncesi arama için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski `discovery`) ve
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme seviyeleri, yeniden oynatma ilkesi ve kullanım
  uç noktalarını kapsayan 40+ isteğe bağlı kanca. Tam liste için
  [Kanca sırası ve kullanımı](#hook-order-and-usage) bölümüne bakın.

OpenClaw genel ajan döngüsünün, yük devretmenin, transkript işlemenin ve araç
ilkesinin sahibi olmaya devam eder. Bu kancalar, tamamen özel bir çıkarım
taşımasına ihtiyaç duymadan sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin çalışma
zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri olduğunda
manifest `setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış
`providerAuthEnvVars`, kullanımdan kaldırma penceresi sırasında uyumluluk
bağdaştırıcısı tarafından hâlâ okunur ve bunu kullanan paketlenmemiş Plugin'ler
manifest tanılaması alır. Bir sağlayıcı kimliğinin başka bir sağlayıcı
kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma
destekli kimlik doğrulamayı ve API anahtarı onboarding seçimini yeniden
kullanması gerektiğinde manifest `providerAuthAliases` kullanın.
Onboarding/kimlik doğrulama seçimi CLI yüzeylerinin sağlayıcının seçim kimliğini,
grup etiketlerini ve basit tek bayraklı kimlik doğrulama bağlantısını sağlayıcı
çalışma zamanını yüklemeden bilmesi gerektiğinde manifest `providerAuthChoices`
kullanın. Sağlayıcı çalışma zamanı `envVars` değerini onboarding etiketleri veya
OAuth istemci kimliği/istemci sırrı kurulum değişkenleri gibi operatöre yönelik
ipuçları için tutun.

Bir kanalın, genel shell ortamı yedeğinin, yapılandırma/durum denetimlerinin veya
kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken ortam
güdümlü kimlik doğrulaması veya kurulumu olduğunda manifest `channelEnvVars`
kullanın.

### Kanca sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw kancaları yaklaşık olarak bu sırayla
çağırır.
"Ne zaman kullanılmalı" sütunu hızlı karar kılavuzudur.
OpenClaw'ın artık çağırmadığı `ProviderPlugin.capabilities` ve
`suppressBuiltInModel` gibi yalnızca uyumluluk amaçlı sağlayıcı alanları burada
bilerek listelenmemiştir.

| #   | Kanca                             | Ne yapar                                                                                                        | Ne zaman kullanılır                                                                                                                                  |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                  | Sağlayıcı bir katalog ya da varsayılan temel URL değerlerine sahipse                                                                                 |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcının sahip olduğu genel yapılandırma varsayılanlarını uygular           | Varsayılanlar auth moduna, env değerlerine veya sağlayıcı model ailesi semantiğine bağlıysa                                                          |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt/katalog yolunu dener                                                                 | _(Plugin kancası değil)_                                                                                                                             |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                     | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğinin sahibiyse                                                                        |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalize eder              | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibiyse                                                      |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                   | Sağlayıcının Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı varsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                         | Sağlayıcının uç nokta odaklı yerel akış kullanım meta verisi düzeltmelerine ihtiyacı varsa                                                          |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env işaretçili auth değerini çözümler    | Sağlayıcının, sağlayıcının sahip olduğu env işaretçili API anahtarı çözümlemesi varsa; `amazon-bedrock` için burada yerleşik bir AWS env işaretçisi çözümleyicisi de vardır |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli auth değerini görünür kılar     | Sağlayıcı sentetik/yerel kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                                |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini katman olarak ekler; CLI/uygulama sahipliğindeki kimlik bilgileri için varsayılan `persistence`, `runtime-only` değeridir | Sağlayıcı, kopyalanmış yenileme tokenlarını kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli auth değerinin arkasına indirir             | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profilleri saklıyorsa                                                                     |
| 11  | `resolveDynamicModel`             | Yerel kayıtta henüz bulunmayan sağlayıcıya ait model kimlikleri için senkron yedek                              | Sağlayıcı rastgele upstream model kimliklerini kabul ediyorsa                                                                                        |
| 12  | `prepareDynamicModel`             | Asenkron ısınma yapar, ardından `resolveDynamicModel` yeniden çalışır                                           | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verilerine ihtiyacı varsa                                                               |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önce son yeniden yazım                                         | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı varsa ama yine de çekirdek taşıma kullanıyorsa                                                     |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları sağlar                        | Sağlayıcı, sağlayıcıyı devralmadan proxy taşımalarında kendi modellerini tanıyorsa                                                                   |
| 15  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalize eder                                                 | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı varsa                                                                                           |
| 16  | `inspectToolSchemas`              | Normalizasyon sonrasında sağlayıcıya ait şema tanılamalarını görünür kılar                                      | Sağlayıcı, çekirdeğe sağlayıcıya özgü kuralları öğretmeden anahtar sözcük uyarıları istiyorsa                                                       |
| 17  | `resolveReasoningOutputMode`      | Yerel ve etiketli reasoning çıktısı sözleşmesi arasında seçim yapar                                             | Sağlayıcının yerel alanlar yerine etiketli reasoning/son çıktıya ihtiyacı varsa                                                                      |
| 18  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalizasyonu                                   | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                            |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir taşıma ile tamamen değiştirir                                                       | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir kablo protokolüne ihtiyacı varsa                                                            |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                    | Sağlayıcının özel taşıma olmadan istek üst bilgileri/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyacı varsa                                      |
| 21  | `resolveTransportTurnState`       | Yerel tur başına taşıma üst bilgileri veya meta verileri ekler                                                  | Sağlayıcı, genel taşımaların sağlayıcıya özgü yerel tur kimliğini göndermesini istiyorsa                                                            |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgileri veya oturum soğuma politikası ekler                                               | Sağlayıcı, genel WS taşımalarının oturum üst bilgilerini veya yedek politikasını ayarlamasını istiyorsa                                             |
| 23  | `formatApiKey`                    | Auth profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür                        | Sağlayıcı ek auth meta verisi saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                                  |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması                 | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                              |
| 25  | `buildAuthDoctorHint`             | OAuth yenileme başarısız olduğunda eklenen onarım ipucu                                                        | Sağlayıcının yenileme hatasından sonra sağlayıcıya ait auth onarım rehberliğine ihtiyacı varsa                                                     |
| 26  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                          | Sağlayıcının, genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                                |
| 27  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması                                                                 | Sağlayıcı ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. durumlara eşleyebiliyorsa                                                              |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği politikası                                                    | Sağlayıcının proxy’ye özgü önbellek TTL geçitlemesine ihtiyacı varsa                                                                                 |
| 29  | `buildMissingAuthMessage`         | Genel eksik auth kurtarma mesajının yerine geçer                                                                | Sağlayıcının sağlayıcıya özgü eksik auth kurtarma ipucuna ihtiyacı varsa                                                                            |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                         | Sağlayıcının `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyacı varsa                                               |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` seviye kümesi, görüntüleme etiketleri ve varsayılan                                        | Sağlayıcı seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                               |
| 32  | `isBinaryThinking`                | Açık/kapalı reasoning geçişi uyumluluk kancası                                                                  | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                               |
| 33  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk kancası                                                                     | Sağlayıcı `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` seviyesi uyumluluk kancası                                                                  | Sağlayıcı bir model ailesi için varsayılan `/think` politikasının sahibiyse                                                                          |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                         | Sağlayıcı canlı/smoke tercih edilen model eşleştirmesinin sahibiyse                                                                                  |
| 36  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı token/anahtarına dönüştürür    | Sağlayıcının token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                                |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı var                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini al ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcıya ihtiyacı var                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcının sahip olduğu bir embedding bağdaştırıcısı oluştur                                                     | Bellek embedding davranışı sağlayıcı Plugin'e aittir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için konuşma dökümü işlemeyi denetleyen bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel konuşma dökümü ilkesine ihtiyacı var (örneğin, düşünme bloğu çıkarma)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel konuşma dökümü temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı var                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulaması veya yeniden şekillendirmesi                                           | Sağlayıcı aktarımının genel temizlemeden sonra daha katı tur doğrulamasına ihtiyacı var                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcının sahip olduğu seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcının sahip olduğu duruma ihtiyacı var                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'i denetler, ardından biri model kimliğini veya aktarım/yapılandırmayı
gerçekten değiştirene kadar diğer hook destekli sağlayıcı Plugin'lerine geçer.
Bu, çağıranın yeniden yazmayı hangi paketlenmiş Plugin'in üstlendiğini bilmesini
gerektirmeden alias/uyumluluk sağlayıcı shim'lerinin çalışmasını sağlar. Hiçbir
sağlayıcı hook'u desteklenen bir Google ailesi yapılandırma girdisini yeniden
yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de bu uyumluluk
temizliğini uygular.

Sağlayıcının tamamen özel bir kablo protokolüne veya özel istek yürütücüsüne
ihtiyacı varsa, bu farklı bir uzantı sınıfıdır. Bu hook'lar, yine de OpenClaw'ın
normal çıkarım döngüsünde çalışan sağlayıcı davranışı içindir.

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

Paketlenmiş sağlayıcı Plugin'leri, her satıcının katalog, kimlik doğrulama,
düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uymak için yukarıdaki
hook'ları birleştirir. Yetkili hook kümesi `extensions/` altında her Plugin ile
birlikte bulunur; bu sayfa listeyi aynalamak yerine biçimleri gösterir.

<AccordionGroup>
  <Accordion title="Doğrudan geçiş katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI, OpenClaw'ın statik kataloğundan önce
    üst kaynak model kimliklerini gösterebilmek için `catalog` ile birlikte
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai,
    token değişimini ve `/usage` entegrasyonunu üstlenmek için
    `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` +
    `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Yeniden oynatma ve transcript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), sağlayıcıların her
    Plugin'de temizliği yeniden uygulaması yerine `buildReplayPolicy` aracılığıyla
    transcript ilkesine katılmasını sağlar.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özel akış yardımcıları">
    Beta üst bilgileri, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine
    Anthropic Plugin'inin genel `api.ts` / `contract-api.ts` sınırında
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) yaşar.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler seçili çekirdek yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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
- PCM ses tamponu + örnekleme hızı döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcıya duyarlı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteği sunar. Microsoft sunmaz.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma sağlayıcıları kaydedebilir.

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
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu yetenek sözleşmelerini ekledikçe tek bir satıcı Plugin'i metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarını sahiplenebilir.

Görüntü/ses/video anlama için Plugin'ler genel bir anahtar/değer torbası yerine tek bir türlendirilmiş medya anlama sağlayıcısı kaydeder:

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
- Eklemeli genişleme türlendirilmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesini ve çalışma zamanı yardımcısını sahiplenir
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
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Hiçbir transkripsiyon çıktısı üretilmediğinde (örneğin atlanan/desteklenmeyen girdi) `{ text: undefined }` döndürür.
- `api.runtime.stt.transcribeAudioFile(...)` uyumluluk alias'ı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan subagent çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait geri dönüş çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça katılmalıdır.
- Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya açıkça herhangi bir hedefe izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin subagent çalıştırmaları yine de çalışır, ancak geçersiz kılma istekleri sessizce geri düşmek yerine reddedilir.
- Plugin tarafından oluşturulan subagent oturumları oluşturan Plugin kimliğiyle etiketlenir. Geri dönüş `api.runtime.subagent.deleteSession(...)` yalnızca bu sahip olunan oturumları silebilir; rastgele oturum silme işlemi yine de yönetici kapsamlı bir Gateway isteği gerektirir.

Web araması için Plugin'ler, ajan araç bağlantılarına erişmek yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

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

Plugin'ler ayrıca `api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemeyi ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özel arama aktarımları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

Plugin'ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

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

- `path`: gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunlu. Normal gateway kimlik doğrulaması gerektirmek için `"gateway"`, Plugin tarafından yönetilen kimlik doğrulama/webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları `replaceExisting: true` olmadığı sürece reddedilir ve bir Plugin başka bir Plugin rotasının yerini alamaz.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` düşüş zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları operator runtime scopes değerlerini otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen webhook’lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway isteği çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak tutucudur:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin özel bir girişte `trusted-proxy` veya `gateway.auth.mode = "none"`), yalnızca başlık açıkça mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - bu kimlik taşıyan Plugin rotası isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yönetici davranışı gerektiriyorsa, kimlik taşıyan bir auth modu zorunlu kılın ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin’ler yazarken monolitik `openclaw/plugin-sdk` kök barrel yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt ilkel öğeleri                         |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/derleme yardımcıları                   |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme   |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal Plugin’leri dar dikişlerden oluşan bir aileden seçim yapar: `channel-setup`, `setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`, `channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`, `channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`, `channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz Plugin alanları arasında karıştırılmak yerine tek bir `approvalCapability` sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen odaklı `*-runtime` alt yolları altında bulunur (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel’i yerine `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime` ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin’ler için kullanımdan kaldırılmış uyumluluk shim’leridir. Yeni kod bunun yerine daha dar genel ilkel öğeleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (pakete dahil Plugin paket kökü başına):

- `index.js` — pakete dahil Plugin girişi
- `api.js` — yardımcı/tür barrel’i
- `runtime-api.js` — yalnızca çalışma zamanı barrel’i
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin’ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir Plugin’den başka bir Plugin paketinin `src/*` içeriğini asla içe aktarmayın. Facade ile yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder, ardından diskteki çözümlenen yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar, pakete dahil Plugin’ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak uzun vadeli donmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK referans sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin’ler, tepkiler, okumalar ve anketler gibi mesaj dışı ilkel öğeler için kanala özgü `describeMessageTool(...)` şema katkılarına sahip olmalıdır. Paylaşılan gönderim sunumu, provider’a özgü düğme, bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır. Sözleşme, geri dönüş kuralları, provider eşlemesi ve Plugin yazarı kontrol listesi için bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin’ler, mesaj yetenekleri üzerinden neleri işleyebildiklerini bildirir:

- anlamsal sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslimat istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak mı işleyeceğine yoksa metne mi düşüreceğine karar verir. Genel mesaj aracından provider’a özgü UI kaçış yolları sunmayın. Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin’ler için dışa aktarılmaya devam eder, ancak yeni Plugin’ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal Plugin’leri kanala özgü hedef semantiklerine sahip olmalıdır. Paylaşılan giden host’u genel tutun ve provider kuralları için mesajlaşma bağdaştırıcısı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin araması yerine doğrudan kimlik benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalizasyondan sonra veya bir dizin kaçırmasından sonra son provider’a ait çözümlemeye ihtiyaç duyduğunda Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra provider’a özgü oturum rotası oluşturmayı sahiplenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- “Bunu açık/yerel hedef kimliği olarak ele al” kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, provider’a özgü normalleştirme geri dönüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID’ler, tanıtıcılar ve oda kimlikleri gibi provider’a özgü yerel kimlikleri genel SDK alanlarında değil, `target` değerleri veya provider’a özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin’ler bu mantığı Plugin içinde tutmalı ve `openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanal aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda kullanın:

- allowlist odaklı DM eşleri
- yapılandırılmış kanal/grup haritaları
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- sınır uygulama
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalleştirmesi Plugin uygulamasında kalmalıdır.

## Provider katalogları

Provider Plugin’leri çıkarım için `registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw’un `models.providers` içine yazdığı aynı şekli döndürür:

- tek bir provider girdisi için `{ provider }`
- birden çok provider girdisi için `{ providers }`

Plugin provider’a özgü model kimliklerine, temel URL varsayılanlarına veya auth ile kısıtlanan model meta verilerine sahipse `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw’un yerleşik örtük provider’larına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env odaklı provider’lar
- `profile`: auth profilleri var olduğunda görünen provider’lar
- `paired`: birden çok ilişkili provider girdisi sentezleyen provider’lar
- `late`: diğer örtük provider’lardan sonra son geçiş

Anahtar çakışmasında daha sonraki provider’lar kazanır; böylece Plugin’ler aynı provider kimliğiyle yerleşik bir provider girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir alias olarak hâlâ çalışır
- hem `catalog` hem de `discovery` kaydedilmişse OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir ve gerekli gizli bilgiler eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve` gibi salt okunur komut yolları ve doctor/yapılandırma onarım akışları, yalnızca yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durumu alanlarını dahil edin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerlerini döndürmeniz gerekmez. Durum tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak alanını) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı çökertmek veya yapılandırılmamış gibi yanlış raporlamak yerine “bu komut yolunda yapılandırılmış ancak kullanılamıyor” olarak raporlamasını sağlar.

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

Her giriş bir Plugin’e dönüşür. Paket birden çok extensions listeliyorsa, Plugin kimliği `name/<fileBase>` olur.

Plugin’iniz npm bağımlılıklarını içe aktarıyorsa, `node_modules` kullanılabilir olacak şekilde bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruma çizgisi: her `openclaw.extensions` girişi, sembolik bağlantı çözümlemesinden sonra Plugin dizininin içinde kalmalıdır. Paket dizininden kaçan girişler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirme bağımlılıkları yok) ve devralınan global npm kurulum ayarlarını yok sayar. Plugin bağımlılık ağaçlarını “pure JS/TS” tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry` hafif, yalnızca kurulum modülünü işaret edebilir. OpenClaw devre dışı bir kanal Plugin’i için kurulum yüzeylerine ihtiyaç duyduğunda veya bir kanal Plugin’i etkin ancak hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry` yükler. Bu, ana Plugin girişiniz araçları, hook’ları veya diğer yalnızca çalışma zamanı kodlarını da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, kanal zaten yapılandırılmış olsa bile bir kanal Plugin’ini Gateway’in dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken başlangıç yüzeyini tamamen kapsadığında kullanın. Pratikte bu, kurulum girişinin başlangıcın bağlı olduğu kanal sahibi her yeteneği kaydetmesi gerektiği anlamına gelir, örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı zaman aralığında var olması gereken tüm Gateway yöntemleri, araçları veya hizmetleri

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğine sahipse bu bayrağı etkinleştirmeyin. Plugin’i varsayılan davranışta tutun ve OpenClaw’un başlangıç sırasında tam girişi yüklemesine izin verin.

Pakete dahil kanallar, tam kanal çalışma zamanı yüklenmeden önce çekirdeğin başvurabileceği yalnızca kurulum sözleşme yüzeyi yardımcılarını da yayımlayabilir. Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam plugin girdisini yüklemeden eski tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten mevcut olduğunda
yalnızca auth/bootstrap anahtarlarını adlandırılmış yükseltilmiş bir hesaba taşır ve
her zaman `accounts.default` oluşturmak yerine yapılandırılmış, kanonik olmayan bir
varsayılan hesap anahtarını koruyabilir.

Bu kurulum yaması adaptörleri, paketlenmiş sözleşme yüzeyi keşfini tembel tutar.
İçe aktarma zamanı hafif kalır; yükseltme yüzeyi, modül içe aktarımında paketlenmiş kanal başlatmasına
yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlatma yüzeyleri Gateway RPC yöntemleri içerdiğinde, bunları
plugin'e özgü bir önekte tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin daha dar
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

Kanal plugin'leri kurulum/keşif meta verilerini `openclaw.channel` üzerinden ve
kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, çekirdek katalog verisiz kalmasını sağlar.

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

Minimal örneğin ötesindeki kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: doküman bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı doküman gezinme yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap mevcut olsa bile açık hesap bağlamayı zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözümlenirken oturum aramayı tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
registry dışa aktarımı). Şunlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ya da `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına yöneltin (virgül/noktalı virgül/`PATH` ile sınırlandırılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve provider kurulum katalog girdileri, ham
`openclaw.install` bloğunun yanında normalleştirilmiş kurulum kaynağı olgularını sunar.
Normalleştirilmiş olgular, npm belirtiminin tam bir sürüm mü yoksa değişken bir
seçici mi olduğunu, beklenen bütünlük meta verisinin mevcut olup olmadığını ve yerel
kaynak yolunun da kullanılabilir olup olmadığını belirler. Katalog/paket kimliği bilindiğinde,
normalleştirilmiş olgular ayrıştırılan npm paket adı bu kimlikten saparsa uyarır.
Ayrıca `defaultChoice` geçersiz olduğunda veya mevcut olmayan bir kaynağa işaret ettiğinde
ve geçerli bir npm kaynağı olmadan npm bütünlük meta verisi mevcut olduğunda uyarırlar.
Tüketiciler `installSource` değerini eklemeli isteğe bağlı bir alan olarak ele almalıdır; böylece
elle oluşturulmuş girdiler ve katalog shim'leri bunu sentezlemek zorunda kalmaz.
Bu, onboarding ve tanılamaların plugin runtime'ını içe aktarmadan
kaynak düzlemi durumunu açıklamasını sağlar.

Resmi harici npm girdileri, tam bir `npmSpec` ile
`expectedIntegrity` değerini tercih etmelidir. Çıplak paket adları ve dist-tag'ler
uyumluluk için çalışmaya devam eder, ancak katalog mevcut plugin'leri bozmadan
sabitlenmiş, bütünlüğü denetlenmiş kurulumlara doğru ilerleyebilsin diye kaynak düzlemi
uyarıları gösterir. Onboarding yerel bir katalog yolundan kurulum yaptığında, mümkün olduğunda
`source: "path"` ve çalışma alanına göreli bir `sourcePath` ile yönetilen bir plugin
plugin dizini girdisi kaydeder. Mutlak operasyonel yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı, yerel iş istasyonu yollarını
uzun ömürlü yapılandırmaya çoğaltmaktan kaçınır. Bu, yerel geliştirme kurulumlarını
ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamalarında görünür tutar.
Kalıcı `plugins/installs.json` plugin dizini, kurulum
kaynağının doğruluk kaynağıdır ve plugin runtime modüllerini yüklemeden yenilenebilir.
Bir plugin manifesti eksik veya geçersiz olsa bile `installRecords` haritası kalıcıdır;
`plugins` dizisi yeniden oluşturulabilir bir manifest görünümüdür.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri alma, birleştirme ve Compaction için oturum bağlamı
orkestrasyonunun sahibidir. Bunları plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin'iniz yalnızca bellek araması veya hook eklemek yerine varsayılan bağlam
pipeline'ını değiştirmesi ya da genişletmesi gerektiğinde kullanın.

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

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()` uygulamasını
koruyun ve açıkça devredin:

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

## Yeni bir capability ekleme

Bir plugin mevcut API'ye uymayan davranışa ihtiyaç duyduğunda, özel bir içeri uzanma ile
plugin sistemini atlamayın. Eksik capability'yi ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, fallback, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve runtime yardımcı şekli.
2. tipli plugin kayıt/runtime yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` değerini en küçük kullanışlı
   tipli capability yüzeyiyle genişletin.
3. çekirdeği + kanal/özellik tüketicilerini bağlayın
   Kanal ve özellik plugin'leri, yeni capability'yi doğrudan bir vendor uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. vendor uygulamalarını kaydedin
   Vendor plugin'leri sonra backend'lerini capability'ye karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw bu şekilde tek bir provider'ın dünya görüşüne sabit kodlanmadan fikir sahibi kalır.
Somut bir dosya kontrol listesi ve işlenmiş örnek için [Capability Yemek Kitabı](/tr/plugins/architecture)
bölümüne bakın.

### Capability kontrol listesi

Yeni bir capability eklediğinizde, uygulama genellikle şu yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/runtime yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin registry bağlantısı
- özellik/kanal plugin'lerinin bunu tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin runtime sunumu
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin dokümanları

Bu yüzeylerden biri eksikse, bu genellikle capability'nin henüz tam olarak
entegre edilmediğinin işaretidir.

### Capability şablonu

Minimal kalıp:

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

Sözleşme testi kalıbı:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek capability sözleşmesi + orkestrasyonun sahibidir
- vendor plugin'leri vendor uygulamalarının sahibidir
- özellik/kanal plugin'leri runtime yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel capability modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
