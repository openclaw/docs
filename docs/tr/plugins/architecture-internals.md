---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket gruplarını uygulama
    - Plugin yükleme sırası veya registry durumunda hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisinin iç yapısı: yükleme işlem hattı, kayıt defteri, çalışma zamanı hook''ları, HTTP rotaları ve referans tabloları'
title: Plugin mimarisinin iç yapısı
x-i18n:
    generated_at: "2026-05-02T09:00:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, plugin biçimleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
iç mekanikler için başvuru kaynağıdır: yükleme hattı, kayıt defteri, çalışma zamanı kancaları,
Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript acil durum Jiti yedeğini kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine sunar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli pluginler `register` kullanır; yeni pluginler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Giriş plugin
kökünün dışına çıktığında, yol herkes tarafından yazılabilir olduğunda veya yol
sahipliği paketli olmayan pluginler için şüpheli göründüğünde adaylar engellenir.

### Manifest öncelikli davranış

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- plugini tanımlamak
- bildirilen kanalları/skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel pluginler için çalışma zamanı modülü veri düzlemi bölümüdür. Kancalar,
araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` veya `setupEntry` yerine geçmezler.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri somutlaştırmasından önce
plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komutun sahibi olan pluginlere daralır
- kanal kurulumu/plugin çözümlemesi, istenen kanal kimliğinin sahibi olan pluginlere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen sağlayıcı kimliğinin sahibi olan
  pluginlere daralır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıçtan çıkışlar için
  `activation.onStartup` kullanır; başlangıç meta verisi olmayan pluginler yalnızca
  daha dar etkinleştirme tetikleyicileriyle yüklenir

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca kimliklerden oluşan bir API ve
yeni tanılama için bir plan API’si sunar. Plan girdileri bir pluginin neden seçildiğini bildirir;
açık `activation.*` planlayıcı ipuçlarını `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve kancalar gibi manifest sahipliği yedeklerinden ayırır. Bu neden ayrımı
uyumluluk sınırıdır: mevcut plugin meta verileri çalışmaya devam ederken, yeni kod çalışma zamanı
yükleme semantiğini değiştirmeden geniş ipuçlarını veya yedek davranışı algılayabilir.

Kurulum keşfi artık `setup-api` yedeğine düşmeden önce aday pluginleri daraltmak için
`setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder; bu yedek,
hâlâ kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyan pluginler içindir. Sağlayıcı
kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden manifest `providerAuthChoices`,
tanımlayıcıdan türetilen kurulum seçenekleri ve kurulum kataloğu meta verilerini kullanır. Açık
`setup.requiresRuntime: false`, yalnızca tanımlayıcıya dayalı bir kesme noktasıdır; atlanan
`requiresRuntime`, uyumluluk için eski setup-api yedeğini korur. Birden fazla keşfedilen plugin
aynı normalleştirilmiş kurulum sağlayıcısı veya CLI arka uç kimliğini talep ederse, kurulum araması
keşif sırasına güvenmek yerine belirsiz sahibi reddeder. Kurulum çalışma zamanı yürütüldüğünde,
kayıt defteri tanılamaları eski pluginleri engellemeden `setup.providers` / `setup.cliBackends` ile
setup-api tarafından kaydedilen sağlayıcılar veya CLI arka uçları arasındaki sapmayı bildirir.

### Plugin önbelleği sınırı

OpenClaw, plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri verilerini duvar saati
pencerelerinin arkasında önbelleğe almaz. Kurulumlar, manifest düzenlemeleri ve yükleme yolu
değişiklikleri bir sonraki açık meta veri okumasında veya anlık görüntü yeniden oluşturmasında
görünür olmalıdır. Manifest dosyası ayrıştırıcısı, açılan manifest yolu, inode, boyut ve zaman
damgalarıyla anahtarlanan sınırlı bir dosya imzası önbelleği tutabilir; bu önbellek yalnızca
değişmemiş baytların yeniden ayrıştırılmasını önler ve keşif, kayıt defteri, sahip veya ilke
yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu, gizli bir önbellek değil, açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları, mevcut `PluginMetadataSnapshot`, türetilmiş
`PluginLookUpTable` veya açık bir manifest kayıt defterini çağrı zinciri boyunca iletmelidir.
Yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme, plugin önyüklemesi ve sağlayıcı
seçimi, mevcut yapılandırmayı ve plugin envanterini temsil ettikleri sürece bu nesneleri yeniden
kullanabilir. Kurulum araması, belirli kurulum yolu açık bir manifest kayıt defteri almadıkça
manifest meta verilerini gerektiğinde yeniden oluşturur; gizli arama önbellekleri eklemek yerine
bunu soğuk yol yedeği olarak tutun. Girdi değiştiğinde, anlık görüntüyü mutasyona uğratmak veya
geçmiş kopyaları tutmak yerine yeniden oluşturup değiştirin.
Etkin plugin kayıt defteri üzerindeki görünümler ve paketli kanal önyükleme yardımcıları mevcut
kayıt defterinden/kökten yeniden hesaplanmalıdır. Kısa ömürlü haritalar, işi tekilleştirmek veya
yeniden girişi korumak için tek bir çağrı içinde uygundur; süreç meta verisi önbelleklerine
dönüşmemelidir.

Plugin yüklemesi için kalıcı önbellek katmanı çalışma zamanı yüklemesidir. Kod veya kurulu
artefaktlar gerçekten yüklendiğinde yükleyici durumunu yeniden kullanabilir, örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyini tekrar tekrar içe aktarmayı önlemek için kullanılan jiti/modül
  önbellekleri ve genel yüzey yükleyici önbellekleri
- kurulu plugin artefaktları için dosya sistemi önbellekleri
- yol normalleştirme veya yinelenen çözümleme için kısa ömürlü çağrı başına haritalar

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran bilinçli olarak çalışma zamanı
yüklemesi istemedikçe, "bu sağlayıcının sahibi hangi plugin?" gibi kontrol düzlemi sorularını
yanıtlamamalıdırlar.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- kurulu plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı ilkesi veya genel artefakt meta verileri
- değişen bir manifest, kurulu dizin veya yükleme yolunun bir sonraki meta veri okumasında görünür
  olması gereken diğer tüm manifest türevi yanıtlar

Kalıcı kurulu plugin dizininden manifest meta verilerini yeniden oluşturan çağıranlar, bu kayıt
defterini gerektiğinde yeniden oluşturur. Kurulu dizin dayanıklı kaynak düzlemi durumudur; gizli
bir süreç içi meta veri önbelleği değildir.

## Kayıt defteri modeli

Yüklenen pluginler rastgele çekirdek globallerini doğrudan mutasyona uğratmaz. Merkezi bir
plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- plugin kayıtları (kimlik, kaynak, köken, durum, tanılamalar)
- araçlar
- eski kancalar ve türlendirilmiş kancalar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI kayıtçıları
- arka plan servisleri
- plugine ait komutlar

Çekirdek özellikler daha sonra plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden
okur. Bu, yüklemeyi tek yönlü tutar:

- plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu çekirdek yüzeyin yalnızca tek bir entegrasyon
noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku"; "her plugin modülünü özel olarak
ele al" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan pluginler, bir onay çözümlendiğinde tepki verebilir.

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
- `binding`: onaylanan istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin verildiğini
değiştirmez ve çekirdek onay işleme bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı pluginlerinin üç katmanı vardır:

- Ucuz çalışma zamanı öncesi arama için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski `discovery`) ve
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme seviyeleri, yeniden oynatma ilkesi ve kullanım uç noktalarını kapsayan
  40’tan fazla isteğe bağlı kanca. Tam liste için [Kanca sırası ve kullanımı](#hook-order-and-usage)
  bölümüne bakın.

OpenClaw genel aracı döngüsüne, yük devretmeye, transkript işlemeye ve araç ilkesine sahip olmaya
devam eder. Bu kancalar, tamamen özel bir çıkarım aktarımına ihtiyaç duymadan sağlayıcıya özgü
davranış için genişletme yüzeyidir.

Sağlayıcının env tabanlı kimlik bilgileri varsa ve genel kimlik doğrulama/durum/model seçici
yollarının bunları plugin çalışma zamanını yüklemeden görmesi gerekiyorsa manifest
`setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış `providerAuthEnvVars`, kullanımdan
kaldırma penceresi boyunca uyumluluk bağdaştırıcısı tarafından hâlâ okunur ve bunu kullanan
paketli olmayan pluginler bir manifest tanısı alır. Bir sağlayıcı kimliği başka bir sağlayıcı
kimliğinin env değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik
doğrulamasını ve API anahtarı katılım seçeneğini yeniden kullanmalıysa manifest
`providerAuthAliases` kullanın. Katılım/kimlik doğrulama seçimi CLI yüzeylerinin, sağlayıcının
seçim kimliğini, grup etiketlerini ve basit tek bayraklı kimlik doğrulama kablolamasını sağlayıcı
çalışma zamanını yüklemeden bilmesi gerekiyorsa manifest `providerAuthChoices` kullanın.
Sağlayıcı çalışma zamanı `envVars` değerlerini, katılım etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi operatöre dönük ipuçları için saklayın.

Bir kanalın genel shell-env yedeği, yapılandırma/durum denetimleri veya kurulum istemlerinin
kanal çalışma zamanını yüklemeden görmesi gereken env güdümlü kimlik doğrulaması veya kurulumu
varsa manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanımı

Model/sağlayıcı pluginleri için OpenClaw kancaları kabaca bu sırayla çağırır.
"Ne zaman kullanılmalı" sütunu hızlı karar kılavuzudur.
OpenClaw’ın artık çağırmadığı yalnızca uyumluluk amaçlı sağlayıcı alanları, örneğin
`ProviderPlugin.capabilities` ve `suppressBuiltInModel`, burada özellikle listelenmemiştir.

| #   | Kanca                             | Ne yapar                                                                                                      | Ne zaman kullanılır                                                                                                                           |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                | Sağlayıcı bir katalog veya varsayılan temel URL değerlerine sahiptir                                                                          |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırma sırasında sağlayıcının sahip olduğu genel yapılandırma varsayılanlarını uygular    | Varsayılanlar kimlik doğrulama moduna, env değerlerine veya sağlayıcı model ailesi semantiğine bağlıdır                                       |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                       | _(bir Plugin kancası değildir)_                                                                                                               |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahiptir                                                                  |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                 | Sağlayıcı, aynı aktarım ailesindeki özel sağlayıcı kimlikleri için aktarım temizliğine sahiptir                                               |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyar; paketlenmiş Google ailesi yardımcıları desteklenen Google yapılandırma girdileri için de yedek güvence sağlar   |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                      | Sağlayıcı, uç nokta odaklı yerel akış kullanım meta verisi düzeltmelerine ihtiyaç duyar                                                      |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için env işaretçisi kimlik doğrulamasını çözümler | Sağlayıcının sahip olduğu env işaretçisi API anahtarı çözümlemesi vardır; `amazon-bedrock` burada yerleşik bir AWS env işaretçisi çözümleyicisine de sahiptir                  |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamayı ortaya çıkar | Sağlayıcı sentetik/yerel kimlik bilgisi işaretçisiyle çalışabilir                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcının sahip olduğu harici kimlik doğrulama profillerini üstüne uygular; CLI/uygulama sahipli kimlik bilgileri için varsayılan `persistence`, `runtime-only` değeridir | Sağlayıcı, kopyalanan yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama kimlik bilgilerini yeniden kullanır; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli kimlik doğrulamanın arkasına düşürür     | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profiller saklar                                                                 |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde bulunmayan sağlayıcı sahipli model kimlikleri için eşzamanlı yedek              | Sağlayıcı rastgele üst akış model kimliklerini kabul eder                                                                                    |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma, ardından `resolveDynamicModel` tekrar çalışır                                             | Sağlayıcı bilinmeyen kimlikleri çözümlemeden önce ağ meta verilerine ihtiyaç duyar                                                           |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önce son yeniden yazım                                       | Sağlayıcı aktarım yeniden yazımlarına ihtiyaç duyar ancak yine de çekirdek aktarım kullanır                                                  |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu aktarımın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı sağlar             | Sağlayıcı, sağlayıcıyı devralmadan proxy aktarımlarında kendi modellerini tanır                                                              |
| 15  | `normalizeToolSchemas`            | Araç şemalarını gömülü çalıştırıcı görmeden önce normalleştirir                                             | Sağlayıcı aktarım ailesi şema temizliğine ihtiyaç duyar                                                                                      |
| 16  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcının sahip olduğu şema tanılarını ortaya çıkar                               | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları ister                                                     |
| 17  | `resolveReasoningOutputMode`      | Yerel veya etiketli akıl yürütme çıktısı sözleşmesini seçer                                                  | Sağlayıcı yerel alanlar yerine etiketli akıl yürütme/nihai çıktıya ihtiyaç duyar                                                            |
| 18  | `prepareExtraParams`              | Genel akış seçenek sarmalayıcılarından önce istek parametresi normalleştirmesi                               | Sağlayıcı varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyar                                         |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir aktarımla tamamen değiştirir                                                     | Sağlayıcı yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyaç duyar                                                           |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                  | Sağlayıcı, özel bir aktarım olmadan istek üst bilgileri/gövdesi/model uyumluluk sarmalayıcılarına ihtiyaç duyar                              |
| 21  | `resolveTransportTurnState`       | Tur başına yerel aktarım üst bilgileri veya meta veri ekler                                                  | Sağlayıcı, genel aktarımların sağlayıcıya özgü tur kimliği göndermesini ister                                                                |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgileri veya oturum soğuma ilkesi ekler                                                | Sağlayıcı, genel WS aktarımlarının oturum üst bilgilerini veya yedek ilkesini ayarlamasını ister                                             |
| 23  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesi olur              | Sağlayıcı ek kimlik doğrulama meta verisi saklar ve özel bir çalışma zamanı belirteç biçimine ihtiyaç duyar                                  |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası ilkesi için OAuth yenileme geçersiz kılma                   | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymaz                                                                                          |
| 25  | `buildAuthDoctorHint`             | OAuth yenileme başarısız olduğunda eklenen onarım ipucu                                                      | Sağlayıcı, yenileme hatasından sonra sağlayıcı sahipli kimlik doğrulama onarım rehberliğine ihtiyaç duyar                                    |
| 26  | `matchesContextOverflowError`     | Sağlayıcının sahip olduğu bağlam penceresi taşması eşleştiricisi                                             | Sağlayıcının, genel sezgisel yöntemlerin kaçıracağı ham taşma hataları vardır                                                               |
| 27  | `classifyFailoverReason`          | Sağlayıcının sahip olduğu yük devretme nedeni sınıflandırması                                                | Sağlayıcı ham API/aktarım hatalarını hız sınırı/aşırı yük/vb. durumlara eşleyebilir                                                          |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için prompt önbelleği ilkesi                                                    | Sağlayıcı, proxy’ye özgü önbellek TTL kapısına ihtiyaç duyar                                                                                 |
| 29  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma mesajının yerine geçer                                                 | Sağlayıcı, sağlayıcıya özgü eksik kimlik doğrulama kurtarma ipucuna ihtiyaç duyar                                                           |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                      | Sağlayıcı, `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyaç duyar                                           |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntüleme etiketleri ve varsayılan                                      | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunar                                                           |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme anahtarı uyumluluk kancası                                                          | Sağlayıcı yalnızca ikili düşünme açık/kapalı seçeneği sunar                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                               | Sağlayıcı `xhigh` değerini yalnızca model alt kümesinde ister                                                                                |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                 | Sağlayıcı, bir model ailesi için varsayılan `/think` ilkesine sahiptir                                                                       |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                      | Sağlayıcı canlı/smoke tercih edilen model eşleştirmesine sahiptir                                                                            |
| 36  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini, çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcı bir belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyar                                                      |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı var                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı var                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcının sahip olduğu bir embedding bağdaştırıcısı oluştur                                                     | Bellek embedding davranışı sağlayıcı Plugin'ine aittir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi denetleyen bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel transkript ilkesine ihtiyacı var (örneğin, düşünme bloğu ayıklama)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı var                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma sırası doğrulaması veya yeniden şekillendirmesi                                           | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı sıra doğrulamasına ihtiyacı var                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcının sahip olduğu seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcının sahip olduğu duruma ihtiyacı var                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'i denetler, ardından başka hook kullanabilen sağlayıcı Plugin'lerine
geçer; bu, bir tanesi gerçekten model kimliğini veya taşıma/config değerini
değiştirene kadar sürer. Bu, çağıranın yeniden yazmayı hangi paketli Plugin'in
sahiplendiğini bilmesini gerektirmeden alias/compat sağlayıcı shim'lerinin
çalışmasını sağlar. Hiçbir sağlayıcı hook'u desteklenen Google ailesi config
girdisini yeniden yazmazsa, paketli Google config normalizer yine de bu
uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol veya özel request executor'a
ihtiyacı varsa, bu farklı bir extension sınıfıdır. Bu hook'lar, yine de
OpenClaw'ın normal inference döngüsünde çalışan sağlayıcı davranışları içindir.

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

Paketli sağlayıcı Plugin'leri, her satıcının katalog, auth, düşünme, replay ve
kullanım ihtiyaçlarına uymak için yukarıdaki hook'ları birleştirir. Yetkili hook
kümesi her Plugin ile birlikte `extensions/` altında bulunur; bu sayfa listeyi
yansıtmak yerine şekilleri gösterir.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI, upstream model kimliklerini OpenClaw'ın
    statik kataloğundan önce sunabilmek için `catalog` ile
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai,
    token exchange ve `/usage` entegrasyonunu sahiplenmek için
    `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` +
    `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), sağlayıcıların her
    Plugin'in temizliği yeniden uygulaması yerine `buildReplayPolicy` üzerinden
    transcript politikasına dahil olmasını sağlar.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan inference döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta başlıkları, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine
    Anthropic Plugin'inin herkese açık `api.ts` / `contract-api.ts` sınırında
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) bulunur.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler seçili core yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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

- `textToSpeech`, file/voice-note yüzeyleri için normal core TTS çıktı payload'unu döndürür.
- Core `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses buffer'ı + sample rate döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Bunu satıcının sahip olduğu ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, provider-aware seçiciler için locale, gender ve personality tag'leri gibi daha zengin metadata içerebilir.
- OpenAI ve ElevenLabs bugün telephony destekler. Microsoft desteklemez.

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
- Konuşma sağlayıcılarını satıcının sahip olduğu synthesis davranışı için kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: tek bir satıcı Plugin'i,
  OpenClaw bu capability contract'ları ekledikçe metin, konuşma, görüntü ve
  gelecekteki medya sağlayıcılarını sahiplenebilir.

Görüntü/ses/video anlama için Plugin'ler genel bir key/value bag yerine
tipli bir media-understanding sağlayıcısı kaydeder:

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

- Orchestration, fallback, config ve channel wiring'i core içinde tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Additive genişleme tipli kalmalıdır: yeni isteğe bağlı metotlar, yeni isteğe
  bağlı sonuç alanları, yeni isteğe bağlı capabilities.
- Video üretimi zaten aynı deseni izler:
  - core capability contract'ı ve çalışma zamanı yardımcısını sahiplenir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/channel Plugin'leri `api.runtime.videoGeneration.*` kullanır

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

Ses transkripsiyonu için Plugin'ler media-understanding çalışma zamanını veya
daha eski STT alias'ını kullanabilir:

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
- Core media-understanding ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen input).
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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı override'lardır.
- OpenClaw bu override alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile opt in yapmalıdır.
- Güvenilir Plugin'leri belirli canonical `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin subagent çalıştırmaları yine çalışır, ancak override istekleri sessizce fallback'e düşmek yerine reddedilir.
- Plugin tarafından oluşturulan subagent oturumları, oluşturan Plugin kimliğiyle etiketlenir. Fallback `api.runtime.subagent.deleteSession(...)` yalnızca bu sahipli oturumları silebilir; rastgele oturum silme hâlâ admin kapsamlı Gateway isteği gerektirir.

Web araması için Plugin'ler agent tool wiring'e erişmek yerine paylaşılan çalışma zamanı yardımcısını kullanabilir:

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

Plugin'ler ayrıca `api.registerWebSearchProvider(...)` üzerinden web-search sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, credential çözümlemeyi ve paylaşılan istek semantiklerini core içinde tutun.
- Web-search sağlayıcılarını satıcıya özgü arama transports için kullanın.
- `api.runtime.webSearch.*`, agent tool wrapper'a bağımlı olmadan arama davranışına ihtiyaç duyan özellik/channel Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış image-generation sağlayıcı zincirini kullanarak bir görüntü üretir.
- `listProviders(...)`: kullanılabilir image-generation sağlayıcılarını ve capabilities değerlerini listeler.

## Gateway HTTP rotaları

Plugin'ler `api.registerHttpRoute(...)` ile HTTP endpoint'leri sunabilir.

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

- `path`: Gateway HTTP sunucusu altındaki rota path'i.
- `auth`: zorunlu. Normal Gateway auth gerektirmek için `"gateway"` veya Plugin tarafından yönetilen auth/webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve bir Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadığı sürece reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` geri düşme zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları, operatör runtime kapsamlarını otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek runtime kapsamı içinde çalışır, ancak bu kapsam bilinçli olarak sınırlıdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran taraf `x-openclaw-scopes` gönderse bile Plugin rotası runtime kapsamlarını `operator.write` değerine sabitler
  - güvenilen kimlik taşıyan HTTP modları (örneğin özel bir ingress üzerinde `trusted-proxy` veya `gateway.auth.mode = "none"`) `x-openclaw-scopes` değerini yalnızca başlık açıkça mevcut olduğunda dikkate alır
  - bu kimlik taşıyan Plugin rotası isteklerinde `x-openclaw-scopes` yoksa runtime kapsamı `operator.write` değerine geri düşer
- Pratik kural: gateway-auth kullanan bir Plugin rotasının örtük bir admin yüzeyi olduğunu varsaymayın. Rotanız admin'e özel davranış gerektiriyorsa, kimlik taşıyan bir auth modu zorunlu kılın ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken tek parça `openclaw/plugin-sdk` kök barrel yerine dar SDK alt yollarını kullanın. Core alt yolları:

| Alt yol                             | Amaç                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt temel parçaları                     |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/oluşturma yardımcıları                        |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve kapsayıcı sözleşme       |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`) |

Kanal Plugin'leri dar arayüzlerden oluşan bir aileden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz Plugin alanları arasında karıştırılmak yerine tek bir `approvalCapability` sözleşmesinde birleştirilmelidir. Sözleşme, geri düşme kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) bölümüne bakın.

Runtime ve yapılandırma yardımcıları eşleşen odaklı `*-runtime` alt yolları altında bulunur
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel'ı yerine `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation` tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış uyumluluk shim'leridir. Yeni kod bunun yerine daha dar genel temel parçaları içe aktarmalıdır.
</Info>

Repo içi giriş noktaları (paketlenen her Plugin paket kökü için):

- `index.js` — paketlenen Plugin girişi
- `api.js` — yardımcılar/türler barrel'ı
- `runtime-api.js` — yalnızca runtime barrel'ı
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Core'dan veya başka bir Plugin'den başka bir Plugin paketinin `src/*` bölümünü asla içe aktarmayın.
Facade ile yüklenen giriş noktaları, varsa aktif runtime yapılandırma anlık görüntüsünü tercih eder, ardından diskte çözümlenen yapılandırma dosyasına geri düşer.

`image-generation`, `media-understanding` ve `speech` gibi capability'ye özel alt yollar, paketlenen Plugin'ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak uzun vadeli donmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK referans sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler tepkiler, okumalar ve anketler gibi mesaj dışı temel parçalar için kanala özel `describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri düşme kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için [Mesaj Sunumu](/tr/plugins/message-presentation) bölümüne bakın.

Gönderim yapabilen Plugin'ler, neleri render edebileceklerini mesaj capability'leri üzerinden bildirir:

- anlamsal sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Core, sunumu yerel olarak render edip etmeyeceğine veya metne indirgemeye karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış yolları açığa çıkarmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin'ler için dışa aktarılmaya devam eder, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal Plugin'leri kanala özel hedef anlamlarına sahip olmalıdır. Paylaşılan outbound host'u genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin araması yerine doğrudan id benzeri çözümlemeye geçip geçmemesi gerektiğini core'a bildirir.
- `messaging.targetResolver.resolveTarget(...)`, core'un normalleştirmeden sonra veya bir dizin kaçırmasından sonra sağlayıcıya ait son çözümlemeye ihtiyaç duyduğu durumlarda Plugin geri düşmesidir.
- `messaging.resolveOutboundSessionRoute(...)`, hedef çözümlendikten sonra sağlayıcıya özel oturum rotası oluşturmayı sahiplenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "bunu açık/yerel bir hedef id olarak ele al" kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özel normalleştirme geri düşmesi için `resolveTarget` kullanın.
- Sohbet id'leri, thread id'leri, JID'ler, handle'lar ve oda id'leri gibi sağlayıcıya özgü id'leri genel SDK alanlarında değil, `target` değerlerinin veya sağlayıcıya özel parametrelerin içinde tutun.

## Yapılandırma destekli dizinler

Dizin girdilerini yapılandırmadan türeten Plugin'ler, bu mantığı Plugin içinde tutmalı ve `openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanal aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda kullanın:

- allowlist tabanlı DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesaba kapsamlı statik dizin geri düşmeleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özel hesap incelemesi ve id normalleştirme Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri, inference için `registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın `models.providers` içine yazdığı şeklin aynısını döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özel model id'lerine, base URL varsayılanlarına veya auth ile kısıtlanan model metadata'sına sahipse `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw'ın yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API anahtarı veya env odaklı sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisini sentezleyen sağlayıcılar
- `late`: son geçiş, diğer örtük sağlayıcılardan sonra

Anahtar çakışmasında daha sonraki sağlayıcılar kazanır; böylece Plugin'ler aynı sağlayıcı id'sine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski alias olarak hâlâ çalışır
- hem `catalog` hem de `discovery` kaydedilirse OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` runtime yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir ve gerekli secret'lar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve` gibi salt okunur komut yolları ve doctor/yapılandırma onarım akışları, yalnızca yapılandırmayı tanımlamak için runtime kimlik bilgilerini somutlaştırmaya ihtiyaç duymamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda aşağıdakiler gibi kimlik bilgisi kaynak/durum alanlarını dahil edin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerleri döndürmeniz gerekmez. Durum tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak alanı) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmesi veya hesabı yapılandırılmamış olarak yanlış raporlaması yerine "bu komut yolunda yapılandırılmış ama kullanılamıyor" raporu vermesini sağlar.

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

Her giriş bir Plugin olur. Paket birden çok extension listeliyorsa Plugin id'si `name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir olacak şekilde bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik sınırı: her `openclaw.extensions` girdisi, symlink çözümlemesinden sonra Plugin dizininin içinde kalmalıdır. Paket dizininden çıkan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (lifecycle script'leri yok, runtime'da dev bağımlılıkları yok) ve devralınan genel npm kurulum ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "pure JS/TS" tutun ve `postinstall` build'leri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülüne işaret edebilir.
OpenClaw devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya bir kanal Plugin'i etkin ama hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry` yükler. Bu, ana Plugin girişiniz araçları, hook'ları veya diğer yalnızca runtime kodlarını da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, kanal zaten yapılandırılmış olsa bile bir kanal Plugin'ini Gateway'in dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken başlangıç yüzeyini tamamen kapsadığında kullanın. Pratikte bu, kurulum girişinin başlangıcın bağlı olduğu kanala ait her capability'yi kaydetmesi gerektiği anlamına gelir, örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken HTTP rotaları
- aynı pencere sırasında var olması gereken Gateway yöntemleri, araçları veya servisleri

Tam girişiniz hâlâ gerekli herhangi bir başlangıç capability'sine sahipse bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenen kanallar ayrıca, tam kanal runtime'ı yüklenmeden önce core'un başvurabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları yayımlayabilir. Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core, eski tek hesaplı kanal yapılandırmasını tam Plugin girdisini yüklemeden `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır. Matrix, mevcut pakete dahil örnektir: adlandırılmış hesaplar zaten mevcut olduğunda yalnızca auth/bootstrap anahtarlarını adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman `accounts.default` oluşturmak yerine yapılandırılmış, kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama adaptörleri, pakete dahil sözleşme yüzeyi keşfini tembel tutar. İçe aktarma süresi hafif kalır; yükseltme yüzeyi, modül içe aktarımında pakete dahil kanal başlatmasına yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemleri içerdiğinde, bunları Plugin'e özgü bir önekte tutun. Core yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

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

Kanal Plugin'leri kurulum/keşif meta verilerini `openclaw.channel` üzerinden ve kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, Core kataloğunu verisiz tutar.

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
- `docsLabel`: docs bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin kontrolleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown uyumlu olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı docs gezinti yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlamayı zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir MPM kayıt dışa aktarımı). Aşağıdakilerden birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ya da `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) değerini bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri, ham `openclaw.install` bloğunun yanında normalleştirilmiş kurulum kaynağı bilgilerini sunar. Normalleştirilmiş bilgiler, npm belirtiminin kesin bir sürüm mü yoksa kayan bir seçici mi olduğunu, beklenen bütünlük meta verilerinin mevcut olup olmadığını ve yerel bir kaynak yolunun da kullanılabilir olup olmadığını belirtir. Katalog/paket kimliği bilindiğinde, normalleştirilmiş bilgiler ayrıştırılan npm paket adı bu kimlikten saparsa uyarır. Ayrıca `defaultChoice` geçersiz olduğunda veya kullanılabilir olmayan bir kaynağa işaret ettiğinde ve geçerli bir npm kaynağı olmadan npm bütünlük meta verileri mevcut olduğunda da uyarırlar. Tüketiciler, elle oluşturulmuş girdilerin ve katalog şimlerinin bunu sentezlemek zorunda kalmaması için `installSource` alanını eklemeli isteğe bağlı bir alan olarak ele almalıdır. Bu, onboarding ve tanılamaların Plugin çalışma zamanını içe aktarmadan kaynak düzlemi durumunu açıklamasını sağlar.

Resmi harici npm girdileri, kesin bir `npmSpec` ile `expectedIntegrity` değerini tercih etmelidir. Çıplak paket adları ve dist-tag'ler uyumluluk için hâlâ çalışır, ancak katalog mevcut Plugin'leri bozmadan sabitlenmiş, bütünlüğü denetlenmiş kurulumlara doğru ilerleyebilsin diye kaynak düzlemi uyarıları gösterirler. Onboarding yerel bir katalog yolundan kurulum yaptığında, mümkün olduğunda `source: "path"` ve çalışma alanına göreli `sourcePath` ile yönetilen bir Plugin Plugin dizin girdisi kaydeder. Mutlak operasyonel yükleme yolu `plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu yollarını uzun ömürlü yapılandırmaya çoğaltmaktan kaçınır. Bu, yerel geliştirme kurulumlarını ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamaları için görünür tutar. Kalıcı `plugins/installs.json` Plugin dizini, kurulumun gerçek kaynağıdır ve Plugin çalışma zamanı modüllerini yüklemeden yenilenebilir. `installRecords` haritası, bir Plugin bildirimi eksik veya geçersiz olduğunda bile kalıcıdır; `plugins` dizisi yeniden oluşturulabilir bir bildirim görünümüdür.

## Bağlam motoru Plugin'leri

Bağlam motoru Plugin'leri, ingest, assembly ve Compaction için oturum bağlamı orkestrasyonuna sahip olur. Bunları Plugin'inizden `api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru `plugins.slots.contextEngine` ile seçin.

Plugin'inizin yalnızca bellek araması veya hook eklemek yerine varsayılan bağlam pipeline'ını değiştirmesi veya genişletmesi gerektiğinde bunu kullanın.

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

Factory `ctx`, yapım zamanı başlatması için isteğe bağlı `config`, `agentDir` ve `workspaceDir` değerlerini sunar.

Motorunuz Compaction algoritmasına sahip **değilse**, `compact()` uygulamasını koruyun ve açıkça devredin:

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

Bir Plugin mevcut API'ye uymayan bir davranışa ihtiyaç duyduğunda, özel bir içeri erişimle Plugin sistemini atlamayın. Eksik capability'yi ekleyin.

Önerilen sıra:

1. Core sözleşmesini tanımlayın
   Core'un sahip olması gereken ortak davranışa karar verin: politika, fallback, yapılandırma birleştirme, lifecycle, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. tipli Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` öğesini en küçük kullanışlı tipli capability yüzeyiyle genişletin.
3. Core + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin'leri, yeni capability'yi bir satıcı uygulamasını doğrudan içe aktararak değil, Core üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı Plugin'leri daha sonra arka uçlarını capability'ye karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir sağlayıcının dünya görüşüne sabit kodlanmadan bu şekilde fikir sahibi kalır. Somut bir dosya kontrol listesi ve çalışılmış örnek için [Capability Cookbook](/tr/plugins/architecture) sayfasına bakın.

### Capability kontrol listesi

Yeni bir capability eklediğinizde, uygulama genellikle şu yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki Core sözleşme tipleri
- `src/<capability>/runtime.ts` içindeki Core runner/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt bağlantıları
- özellik/kanal Plugin'lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki Plugin çalışma zamanı ifşası
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/Plugin docs

Bu yüzeylerden biri eksikse, bu genellikle capability'nin henüz tam entegre olmadığının bir işaretidir.

### Capability şablonu

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

- Core, capability sözleşmesine ve orkestrasyonuna sahip olur
- satıcı Plugin'leri satıcı uygulamalarına sahip olur
- özellik/kanal Plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel capability modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
