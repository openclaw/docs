---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırası veya kayıt deposu durumu üzerinde hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisinin iç işleyişi: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve referans tabloları'
title: Plugin mimarisinin iç yapısı
x-i18n:
    generated_at: "2026-05-10T19:43:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Herkese açık yetenek modeli, Plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
iç mekanikler için başvuru kaynağıdır: yükleme hattı, kayıt defteri, çalışma
zamanı hook'ları, Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket bildirimlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkinleştirilmiş yerel modülleri yükler: yerleşik paketlenmiş modüller yerel yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript, acil durum Jiti yedeğini kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi varsa onu çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm yerleşik Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Girdi
Plugin kökünden çıkıyorsa, yol herkes tarafından yazılabilirse veya yol
sahipliği yerleşik olmayan Plugin'ler için şüpheli görünüyorsa adaylar
engellenir.

Engellenen adaylar tanılama için Plugin kimliklerine bağlı kalır. Yapılandırma
hala bu kimliğe başvuruyorsa doğrulama, yapılandırma girdisini eski kabul etmek
yerine Plugin'i mevcut ama engellenmiş olarak bildirir ve yol güvenliği
uyarısına geri işaret eder.

### Bildirim öncelikli davranış

Bildirim, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills'leri/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi kısmıdır. Hook'lar,
araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı bildirim `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlama ve kurulum keşfi için yalnızca meta veri
tanımlayıcılarıdır; çalışma zamanı kaydının, `register(...)` çağrısının veya
`setupEntry` öğesinin yerine geçmezler.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri
maddeleştirmesinden önce Plugin yüklemeyi daraltmak için bildirim komutu, kanal
ve sağlayıcı ipuçlarını kullanır:

- CLI yükleme, istenen birincil komutun sahibi olan Plugin'lere daraltılır
- kanal kurulumu/Plugin çözümleme, istenen kanal kimliğinin sahibi olan
  Plugin'lere daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümleme, istenen sağlayıcı
  kimliğinin sahibi olan Plugin'lere daraltılır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları ve başlangıç
  devre dışı bırakmaları için `activation.onStartup` kullanır; başlangıç meta
  verisi olmayan Plugin'ler yalnızca daha dar etkinleştirme tetikleyicileri
  üzerinden yüklenir

Geniş `all` kapsamını isteyen istek zamanı çalışma zamanı ön yüklemeleri yine de
yapılandırmadan, başlangıç planlamasından, yapılandırılmış kanallardan,
slot'lardan ve otomatik etkinleştirme kurallarından açık bir etkili Plugin kimlik
kümesi türetir. Bu türetilmiş küme boşsa OpenClaw, her keşfedilebilir Plugin'e
genişlemek yerine boş bir çalışma zamanı kayıt defteri yükler.

Etkinleştirme planlayıcı, mevcut çağıranlar için hem yalnızca kimliklerden
oluşan bir API hem de yeni tanılamalar için bir plan API'si sunar. Plan
girdileri, bir Plugin'in neden seçildiğini bildirir ve açık `activation.*`
planlayıcı ipuçlarını `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` ve hook'lar gibi bildirim sahipliği
yedeklerinden ayırır. Bu neden ayrımı uyumluluk sınırıdır: mevcut Plugin meta
verileri çalışmaya devam ederken, yeni kod çalışma zamanı yükleme anlamlarını
değiştirmeden geniş ipuçlarını veya yedek davranışı algılayabilir.

Kurulum keşfi artık `setup-api` öğesine geri dönmeden önce aday Plugin'leri
daraltmak için `setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait
kimlikleri tercih eder; `setup-api`, kurulum zamanı çalışma zamanı hook'larına
hala ihtiyaç duyan Plugin'ler içindir. Sağlayıcı kurulum listeleri, sağlayıcı
çalışma zamanını yüklemeden bildirim `providerAuthChoices`, tanımlayıcıdan
türetilmiş kurulum seçimleri ve kurulum kataloğu meta verilerini kullanır. Açık
`setup.requiresRuntime: false` yalnızca tanımlayıcı kesme noktasıdır; atlanan
`requiresRuntime`, uyumluluk için eski setup-api yedeğini korur. Birden fazla
keşfedilen Plugin aynı normalleştirilmiş kurulum sağlayıcısı veya CLI arka uç
kimliğini sahiplenirse kurulum araması, keşif sırasına güvenmek yerine belirsiz
sahibi reddeder. Kurulum çalışma zamanı yürütüldüğünde, kayıt defteri tanılaması
`setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen
sağlayıcılar veya CLI arka uçları arasındaki sapmayı, eski Plugin'leri
engellemeden bildirir.

### Plugin önbellek sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan bildirim kayıt defteri
verilerini duvar saati pencerelerinin arkasında önbelleğe almaz. Kurulumlar,
bildirim düzenlemeleri ve yükleme yolu değişiklikleri bir sonraki açık meta veri
okumasında veya anlık görüntü yeniden oluşturmasında görünür olmalıdır.
Bildirim dosyası ayrıştırıcısı, açılan bildirim yoluna, inode değerine, boyuta
ve zaman damgalarına göre anahtarlanan sınırlı bir dosya imzası önbelleği
tutabilir; bu önbellek yalnızca değişmemiş baytların yeniden ayrıştırılmasını
önler ve keşif, kayıt defteri, sahip veya ilke yanıtlarını önbelleğe
almamalıdır.

Güvenli meta veri hızlı yolu gizli bir önbellek değil, açık nesne sahipliğidir.
Gateway başlangıç sıcak yolları, geçerli `PluginMetadataSnapshot` öğesini,
türetilmiş `PluginLookUpTable` öğesini veya açık bir bildirim kayıt defterini
çağrı zinciri boyunca iletmelidir. Yapılandırma doğrulama, başlangıç otomatik
etkinleştirme, Plugin önyükleme ve sağlayıcı seçimi, geçerli yapılandırmayı ve
Plugin envanterini temsil ettikleri sürece bu nesneleri yeniden kullanabilir.
Kurulum araması, belirli kurulum yolu açık bir bildirim kayıt defteri almadıkça
bildirim meta verilerini hala gerektiğinde yeniden oluşturur; bunu gizli arama
önbellekleri eklemek yerine soğuk yol yedeği olarak tutun. Girdi değiştiğinde,
anlık görüntüyü mutasyona uğratmak veya geçmiş kopyaları tutmak yerine yeniden
oluşturup değiştirin.
Etkin Plugin kayıt defteri üzerindeki görünümler ve yerleşik kanal önyükleme
yardımcıları geçerli kayıt defterinden/kökten yeniden hesaplanmalıdır. Tek bir
çağrı içinde işi tekilleştirmek veya yeniden girişi korumak için kısa ömürlü
haritalar kabul edilebilir; bunlar süreç meta veri önbelleklerine
dönüşmemelidir.

Plugin yükleme için kalıcı önbellek katmanı çalışma zamanı yüklemedir. Kod veya
kurulu yapılar gerçekten yüklendiğinde yükleyici durumunu yeniden kullanabilir,
örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyinin tekrar tekrar içe aktarılmasını önlemek için
  kullanılan jiti/modül önbellekleri ve herkese açık yüzey yükleyici önbellekleri
- kurulu Plugin yapıları için dosya sistemi önbellekleri
- yol normalleştirme veya yinelenen çözümleme için kısa ömürlü çağrı başına haritalar

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran özellikle çalışma
zamanı yükleme istemedikçe "bu sağlayıcının sahibi hangi Plugin?" gibi kontrol
düzlemi sorularını yanıtlamamalıdırlar.

Şunlar için kalıcı veya duvar saati önbellekleri eklemeyin:

- keşif sonuçları
- doğrudan bildirim kayıt defterleri
- kurulu Plugin dizininden yeniden oluşturulan bildirim kayıt defterleri
- sağlayıcı sahibi araması, model bastırma, sağlayıcı ilkesi veya herkese açık yapı
  meta verileri
- değiştirilmiş bir bildirimin, kurulu dizinin veya yükleme yolunun bir sonraki
  meta veri okumasında görünür olması gereken diğer tüm bildirimden türetilmiş
  yanıtlar

Kalıcı kurulu Plugin dizininden bildirim meta verilerini yeniden oluşturan
çağıranlar, bu kayıt defterini gerektiğinde yeniden oluşturur. Kurulu dizin
dayanıklı kaynak düzlemi durumudur; gizli bir süreç içi meta veri önbelleği
değildir.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek global değerleri doğrudan mutasyona
uğratmaz. Merkezi bir Plugin kayıt defterine kayıt yaparlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılama)
- araçlar
- eski hook'lar ve türlendirilmiş hook'lar
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

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu çekirdek yüzeyin yalnızca tek
bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku";
"her Plugin modülünü özel duruma al" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, bir onay çözüldüğünde tepki verebilir.

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
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini
değiştirmez ve çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı hook'ları

Sağlayıcı Plugin'lerinin üç katmanı vardır:

- Ucuz çalışma zamanı öncesi arama için **bildirim meta verileri**:
  `setup.providers[].envVars`, kullanım dışı uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı hook'ları**: `catalog` (eski `discovery`) artı
  `applyConfigDefaults`.
- **Çalışma zamanı hook'ları**: kimlik doğrulama, model çözümleme,
  akış sarma, düşünme düzeyleri, yeniden oynatma ilkesi ve kullanım uç
  noktalarını kapsayan 40'tan fazla isteğe bağlı hook. Tam liste için
  [Hook sırası ve kullanımı](#hook-order-and-usage) bölümüne bakın.

OpenClaw genel agent döngüsünün, devretmenin, transkript işlemenin ve araç
ilkesinin sahibi olmaya devam eder. Bu hook'lar, bütünüyle özel bir çıkarım
taşımasına ihtiyaç duymadan sağlayıcıya özgü davranış için genişletme yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin çalışma
zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri varsa
bildirim `setup.providers[].envVars` kullanın. Kullanım dışı
`providerAuthEnvVars`, kullanımdan kaldırma penceresi sırasında uyumluluk
bağdaştırıcısı tarafından hala okunur ve bunu kullanan yerleşik olmayan
Plugin'ler bir bildirim tanılaması alır. Bir sağlayıcı kimliğinin başka bir
sağlayıcı kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini,
yapılandırma destekli kimlik doğrulamayı ve API anahtarı işe başlatma seçimini
yeniden kullanması gerektiğinde bildirim `providerAuthAliases` kullanın. İşe
başlatma/kimlik doğrulama seçimi CLI yüzeylerinin, sağlayıcının seçim
kimliğini, grup etiketlerini ve basit tek bayraklı kimlik doğrulama kablolamasını
sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde bildirim
`providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı `envVars` öğesini,
işe başlatma etiketleri veya OAuth client-id/client-secret kurulum değişkenleri
gibi operatöre dönük ipuçları için tutun.

Bir kanalın, genel kabuk ortamı yedeği, yapılandırma/durum denetimleri veya
kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken ortam
odaklı kimlik doğrulaması veya kurulumu varsa bildirim `channelEnvVars` kullanın.

### Hook sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw hook'ları kabaca bu sırayla çağırır.
"Ne zaman kullanılmalı" sütunu hızlı karar kılavuzudur.
`ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi OpenClaw'ın artık
çağırmadığı yalnızca uyumluluk amaçlı sağlayıcı alanları burada bilinçli olarak
listelenmemiştir.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılmalı                                                                                                                         |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                   | Sağlayıcı bir kataloğa veya temel URL varsayılanlarına sahipse                                                                                |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcının sahip olduğu genel yapılandırma varsayılanlarını uygular          | Varsayılanlar kimlik doğrulama moduna, env'ye veya sağlayıcı model ailesi semantiğine bağlıysa                                                |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                        | _(Plugin kancası değil)_                                                                                                                      |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                   | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahipse                                                                    |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                  | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğine sahipse                                                  |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                 | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyarsa; paketli Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazmalarını uygular                       | Sağlayıcı, uç nokta odaklı yerel akış kullanım meta veri düzeltmelerine ihtiyaç duyarsa                                                      |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için env işaretçisi kimlik doğrulamasını çözümler | Sağlayıcı, sağlayıcıya ait env işaretçisi API anahtarı çözümlemesine sahipse; `amazon-bedrock` burada ayrıca yerleşik bir AWS env işaretçisi çözümleyicisine sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamayı yüzeye çıkarır | Sağlayıcı, sentetik/yerel kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini üst üste uygular; CLI/uygulamaya ait kimlik bilgileri için varsayılan `persistence`, `runtime-only` değeridir | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama kimlik bilgilerini yeniden kullanır; manifestte `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli kimlik doğrulamanın arkasına düşürür      | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                              |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde olmayan sağlayıcıya ait model kimlikleri için eşzamanlı yedek çözümleme           | Sağlayıcı, rastgele yukarı akış model kimliklerini kabul ediyorsa                                                                             |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, ardından `resolveDynamicModel` yeniden çalışır                                        | Sağlayıcı, bilinmeyen kimlikleri çözümlemeden önce ağ meta verilerine ihtiyaç duyarsa                                                         |
| 13  | `normalizeResolvedModel`          | Çözümlenen model gömülü çalıştırıcı tarafından kullanılmadan önce son yeniden yazma                            | Sağlayıcı taşıma yeniden yazmalarına ihtiyaç duyuyor ama yine de çekirdek taşıma kullanıyorsa                                                 |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları sağlar                       | Sağlayıcı, sağlayıcıyı devralmadan vekil taşımalarda kendi modellerini tanıyorsa                                                              |
| 15  | `normalizeToolSchemas`            | Araç şemalarını gömülü çalıştırıcı görmeden önce normalleştirir                                                | Sağlayıcı, taşıma ailesi şema temizliğine ihtiyaç duyarsa                                                                                     |
| 16  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcıya ait şema tanılamalarını yüzeye çıkarır                                    | Sağlayıcı, çekirdeğe sağlayıcıya özel kurallar öğretmeden anahtar sözcük uyarıları istiyorsa                                                  |
| 17  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                         | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/son çıktı kullanmaya ihtiyaç duyarsa                                                    |
| 18  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi                               | Sağlayıcı, varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyarsa                                       |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir taşımayla tamamen değiştirir                                                       | Sağlayıcı, yalnızca sarmalayıcı değil özel bir kablo protokolüne ihtiyaç duyarsa                                                              |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                   | Sağlayıcı, özel taşıma olmadan istek başlıkları/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyaç duyarsa                                    |
| 21  | `resolveTransportTurnState`       | Yerel tur başına taşıma başlıkları veya meta verileri ekler                                                    | Sağlayıcı, genel taşımaların sağlayıcıya özgü tur kimliği göndermesini istiyorsa                                                              |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum soğuma politikası ekler                                                 | Sağlayıcı, genel WS taşımalarında oturum başlıklarını veya yedek politikayı ayarlamak istiyorsa                                               |
| 23  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür           | Sağlayıcı, ek kimlik doğrulama meta verileri saklıyor ve özel bir çalışma zamanı belirteci şekline ihtiyaç duyuyorsa                         |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması               | Sağlayıcı, paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                      |
| 25  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                      | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım rehberliğine ihtiyaç duyarsa                                    |
| 26  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                         | Sağlayıcının, genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                         |
| 27  | `classifyFailoverReason`          | Sağlayıcıya ait yük devretme nedeni sınıflandırması                                                            | Sağlayıcı, ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. ile eşleyebiliyorsa                                                             |
| 28  | `isCacheTtlEligible`              | Vekil/arka taşıma sağlayıcıları için istem önbelleği politikası                                                | Sağlayıcı, vekile özel önbellek TTL kapılamasına ihtiyaç duyarsa                                                                              |
| 29  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçer                                                  | Sağlayıcı, sağlayıcıya özel eksik kimlik doğrulama kurtarma ipucuna ihtiyaç duyarsa                                                          |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/son katalog satırları                                                          | Sağlayıcı, `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyaç duyarsa                                         |
| 31  | `resolveThinkingProfile`          | Modele özel `/think` seviye kümesi, görüntüleme etiketleri ve varsayılan                                       | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                        |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme geçişi uyumluluk kancası                                                              | Sağlayıcı yalnızca ikili düşünme açık/kapalı seçeneği sunuyorsa                                                                               |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                                 | Sağlayıcı, `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` seviyesi uyumluluk kancası                                                                 | Sağlayıcı, bir model ailesi için varsayılan `/think` politikasına sahipse                                                                     |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve duman testi seçimi için modern model eşleştiricisi                                  | Sağlayıcı, canlı/duman testi tercih edilen model eşleştirmesine sahipse                                                                       |
| 36  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcı, belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyarsa                                                       |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı var                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulaması çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı var                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcının sahip olduğu bir gömme bağdaştırıcısı oluştur                                                     | Bellek gömme davranışı sağlayıcı Plugin'ine aittir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi kontrol eden bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel transkript ilkesine ihtiyacı var (örneğin, düşünme bloklarını çıkarma)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı var                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma sırası doğrulamasını veya yeniden şekillendirmesini yap                                           | Sağlayıcı taşıma katmanının genel temizlemeden sonra daha sıkı sıra doğrulamasına ihtiyacı var                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcının sahip olduğu seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcının sahip olduğu duruma ihtiyacı var                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen sağlayıcı plugin'ini denetler, ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştiren bir tanesi bulunana kadar diğer hook destekli sağlayıcı plugin'lerine geçer. Bu, çağıranın yeniden yazmanın hangi paketlenmiş plugin'e ait olduğunu bilmesini gerektirmeden alias/compat sağlayıcı shim'lerinin çalışmasını sağlar. Desteklenen bir Google ailesi yapılandırma girdisini hiçbir sağlayıcı hook'u yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol'e veya özel istek yürütücüsüne ihtiyacı varsa, bu farklı bir extension sınıfıdır. Bu hook'lar, OpenClaw'ın normal çıkarım döngüsünde çalışmaya devam eden sağlayıcı davranışı içindir.

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

Paketlenmiş sağlayıcı plugin'leri, her tedarikçinin katalog, kimlik doğrulama, düşünme, replay ve kullanım ihtiyaçlarına uymak için yukarıdaki hook'ları birleştirir. Yetkili hook kümesi her plugin ile birlikte `extensions/` altında bulunur; bu sayfa listeyi yansıtmak yerine şekilleri gösterir.

<AccordionGroup>
  <Accordion title="Geçişli katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI, yukarı akış model kimliklerini OpenClaw'ın statik kataloğundan önce gösterebilmek için `catalog` ile birlikte `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım endpoint sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai; token değişimini ve `/usage` entegrasyonunu sahiplenmek için `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` + `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Replay ve transcript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`, `anthropic-by-model`, `hybrid-anthropic-openai`), sağlayıcıların her plugin'in temizlemeyi yeniden uygulaması yerine `buildReplayPolicy` üzerinden transcript politikasına katılmasını sağlar.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü stream yardımcıları">
    Beta headers, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine Anthropic plugin'inin herkese açık `api.ts` / `contract-api.ts` seam'i içinde yaşar (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`).
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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı payload'unu döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses buffer'ı + örnekleme hızını döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Tedarikçinin sahip olduğu ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri; locale, cinsiyet ve kişilik etiketleri gibi sağlayıcı farkında seçiciler için daha zengin metadata içerebilir.
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

- TTS politikasını, fallback'i ve yanıt teslimini çekirdekte tutun.
- Tedarikçinin sahip olduğu sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu capability contract'ları ekledikçe tek bir tedarikçi plugin'i metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarını sahiplenebilir.

Görüntü/ses/video anlama için plugin'ler genel bir anahtar/değer çantası yerine tek bir typed media-understanding sağlayıcısı kaydeder:

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

- Orkestrasyonu, fallback'i, yapılandırmayı ve kanal bağlantılarını çekirdekte tutun.
- Tedarikçi davranışını sağlayıcı plugin'inde tutun.
- Eklemeli genişleme typed kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı sonuç alanları, yeni isteğe bağlı capabilities.
- Video oluşturma zaten aynı deseni izler:
  - çekirdek capability contract'ına ve çalışma zamanı yardımcısına sahiptir
  - tedarikçi plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal plugin'leri `api.runtime.videoGeneration.*` tüketir

Media-understanding çalışma zamanı yardımcıları için plugin'ler şunu çağırabilir:

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

Ses transkripsiyonu için plugin'ler media-understanding çalışma zamanını veya eski STT alias'ını kullanabilir:

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
- Çekirdek media-understanding ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)` uyumluluk alias'ı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan alt aracı çalıştırmaları başlatabilir:

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
- Plugin'e ait fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile katılmalıdır.
- Güvenilir plugin'leri belirli canonical `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilir olmayan plugin alt aracı çalıştırmaları yine çalışır, ancak override istekleri sessizce fallback yapmak yerine reddedilir.
- Plugin tarafından oluşturulan alt aracı oturumları, oluşturan plugin kimliğiyle etiketlenir. Fallback `api.runtime.subagent.deleteSession(...)` yalnızca bu sahip olunan oturumları silebilir; rastgele oturum silme yine admin kapsamlı bir Gateway isteği gerektirir.

Web arama için plugin'ler, aracı araç bağlantılarına erişmek yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

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

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Tedarikçiye özgü arama aktarımları için web-search sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, aracı araç wrapper'ına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış image-generation sağlayıcı zincirini kullanarak bir görüntü oluşturun.
- `listProviders(...)`: kullanılabilir image-generation sağlayıcılarını ve capabilities'lerini listeleyin.

## Gateway HTTP rotaları

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

Rota alanları:

- `path`: Gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunludur. Normal gateway kimlik doğrulamasını gerektirmek için `"gateway"` veya plugin tarafından yönetilen kimlik doğrulama/webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlıdır. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlıdır. Aynı plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadığı sürece reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları, operatör çalışma zamanı kapsamlarını otomatik olarak almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway isteği çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam bilinçli olarak tutucudur:
  - paylaşılan-gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin özel bir ingress üzerinde `trusted-proxy` veya `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca başlık açıkça mevcut olduğunda dikkate alır
  - bu kimlik taşıyan Plugin rotası isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yöneticiye özel davranış gerektiriyorsa, kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` başlığı sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken monolitik `openclaw/plugin-sdk` kök
barrel yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt ilkelleri                            |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/derleme yardımcıları                  |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme  |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`) |

Kanal Plugin'leri dar bağlantı ailelerinden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karıştırmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve config yardımcıları eşleşen odaklı `*-runtime` alt yolları
altında bulunur (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel'ı
yerine `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`
ve `config-mutation` kullanmayı tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış uyumluluk shim'leridir. Yeni kod bunun yerine daha dar genel ilkelleri içe aktarmalıdır.
</Info>

Repo içi giriş noktaları (paketlenmiş her Plugin paketi köküne göre):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/tip barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir Plugin'den başka bir Plugin paketinin `src/*` yolunu asla
içe aktarmayın. Facade tarafından yüklenen giriş noktaları, varsa etkin çalışma zamanı config anlık görüntüsünü tercih eder, sonra diskteki çözümlenmiş config dosyasına geri döner.

`image-generation`, `media-understanding` ve `speech` gibi capability'ye özel alt yollar, paketlenmiş Plugin'ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak uzun vadeli dondurulmuş harici sözleşmeler değildir; bunlara güvenirken ilgili SDK referans sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler tepkiler, okumalar ve anketler gibi mesaj dışı ilkeller için kanala özgü `describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, fallback kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin'ler, neyi işleyebildiklerini mesaj capability'leri üzerinden bildirir:

- semantik sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak mı işleyeceğine yoksa metne mi degrade edeceğine karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış yolları açığa çıkarmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin'ler için dışa aktarılmaya devam eder, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedefi çözümleme

Kanal Plugin'leri kanala özgü hedef semantiğine sahip olmalıdır. Paylaşılan
giden host'u genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin dizin aramasından önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, çekirdeğe bir girdinin dizin araması yerine doğrudan id-benzeri çözümlemeye atlanıp atlanmaması gerektiğini bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden sonra veya bir dizin kaçırmasından sonra sağlayıcıya ait nihai bir çözümlemeye ihtiyaç duyduğu durumda Plugin fallback'idir.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum rotası oluşturmayı üstlenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "bunu açık/yerel hedef id olarak ele al" kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme fallback'i için `resolveTarget` kullanın.
- Sohbet id'leri, thread id'leri, JID'ler, handle'lar ve oda id'leri gibi sağlayıcıya özgü yerel id'leri genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Config destekli dizinler

Config'den dizin girdileri türeten Plugin'ler bu mantığı Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanalın aşağıdakiler gibi config destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın:

- allowlist odaklı DM eşleri
- yapılandırılmış kanal/grup haritaları
- hesaba kapsamlı statik dizin fallback'leri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap inceleme ve id normalleştirme Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın `models.providers` içine yazdığı aynı şekli döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model id'lerine, base URL varsayılanlarına veya auth ile kapatılmış model metadata'sına sahip olduğunda `catalog` kullanın.

`catalog.order`, bir Plugin'in kataloğunun OpenClaw'ın yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env odaklı sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Sonraki sağlayıcılar anahtar çakışmasında kazanır, böylece Plugin'ler aynı sağlayıcı id'sine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Plugin'ler ayrıca `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` üzerinden salt okunur model satırları yayımlayabilir. Bu, liste/yardım/seçici yüzeyleri için ileriye dönük yoldur ve `text`, `image_generation`, `video_generation` ve `music_generation` satırlarını destekler.
Sağlayıcı Plugin'leri hâlâ canlı endpoint çağrılarına, token değişimine ve satıcı yanıtı eşlemesine sahiptir; çekirdek ortak satır şeklini, kaynak etiketlerini ve medya aracı yardım biçimlendirmesini üstlenir. Medya üretimi sağlayıcı kayıtları, statik katalog satırlarını `defaultModel`, `models` ve `capabilities` değerlerinden otomatik olarak sentezler.

Uyumluluk:

- `discovery` eski bir alias olarak çalışmaya devam eder, ancak kullanımdan kaldırma uyarısı yayar
- hem `catalog` hem `discovery` kayıtlıysa OpenClaw `catalog` kullanır
- `augmentModelCatalog` kullanımdan kaldırılmıştır; paketlenmiş sağlayıcılar ek satırları `registerModelCatalogProvider` üzerinden yayımlamalıdır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir ve gerekli secret'lar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yalnızca yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda olmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda şu gibi kimlik bilgisi kaynağı/durum alanlarını dahil edin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerlerini döndürmeniz gerekmez. `tokenStatus: "available"` (ve eşleşen kaynak alanını) döndürmek status tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı yapılandırılmamış gibi yanlış raporlamak veya çökme yerine "bu komut yolunda yapılandırılmış ancak kullanılamıyor" bilgisini raporlamasını sağlar.

## Paket pack'leri

Bir Plugin dizini `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir Plugin olur. Pack birden çok extension listelerse, Plugin id'si
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir olsun diye bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi, symlink çözümlemesinden sonra Plugin
dizini içinde kalmalıdır. Paket dizininden kaçan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (lifecycle script'leri yok,
çalışma zamanında dev bağımlılıkları yok) ve devralınan global npm install ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry` hafif, yalnızca kuruluma yönelik bir modülü gösterebilir.
OpenClaw devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ama hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry` yükler. Bu, ana Plugin girişiniz araçları, hook'ları veya yalnızca çalışma zamanına özgü başka kodları da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
bir kanal Plugin'ini, kanal zaten yapılandırılmış olsa bile Gateway'in
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken
başlangıç yüzeyini tamamen kapsadığında kullanın. Pratikte bu, setup entry'nin
başlangıcın bağlı olduğu kanalın sahip olduğu her capability'yi kaydetmesi
gerektiği anlamına gelir, örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı zaman aralığında var olması gereken tüm Gateway yöntemleri, araçları veya hizmetleri

Tam entry'niz hâlâ gerekli herhangi bir başlangıç capability'sine sahipse
bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın
başlangıç sırasında tam entry'yi yüklemesine izin verin.

Paketlenmiş kanallar, çekirdeğin tam kanal runtime'ı yüklenmeden önce
danışabileceği yalnızca-kurulum sözleşme-yüzeyi yardımcılarını da yayımlayabilir.
Geçerli setup promotion yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam Plugin entry'sini yüklemeden eski tek-hesaplı bir kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu
yüzeyi kullanır. Matrix geçerli paketlenmiş örnektir: adlandırılmış hesaplar
zaten mevcut olduğunda yalnızca auth/bootstrap anahtarlarını adlandırılmış
yükseltilmiş bir hesaba taşır ve her zaman `accounts.default` oluşturmak yerine
yapılandırılmış kanonik olmayan bir varsayılan-hesap anahtarını koruyabilir.

Bu setup patch adapter'ları, paketlenmiş sözleşme-yüzeyi keşfini lazy tutar.
Import süresi hafif kalır; promotion yüzeyi, modül import sırasında paketlenmiş
kanal başlangıcına yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemlerini içerdiğinde, bunları
Plugin'e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin daha
dar bir scope istese bile her zaman `operator.admin` olarak çözümlenir.

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

### Kanal katalog metadata'sı

Kanal Plugin'leri setup/discovery metadata'sını `openclaw.channel` üzerinden ve
kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, çekirdek katalog
verisini boş tutar.

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

Minimal örneğin ötesinde kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: docs bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim-yüzeyi metin kontrolleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown-capable olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış-kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli setup/configure seçicilerinden gizler
- `exposure.docs`: kanalı docs gezinme yüzeyleri için internal/private olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski alias'lar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart quickstart `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlamayı zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: announce target'ları çözerken session lookup'ı tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
registry export'u). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ya da `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına (virgül/noktalı virgül/`PATH` ile ayrılmış)
işaret edin. Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Parser, `"entries"` anahtarı için eski alias'lar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve provider kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalize edilmiş install-source
olgularını açığa çıkarır. Normalize edilmiş olgular, npm spec'in tam sürüm mü
yoksa floating selector mü olduğunu, beklenen integrity metadata'sının mevcut
olup olmadığını ve yerel bir kaynak yolunun da kullanılabilir olup olmadığını
tanımlar. Katalog/paket kimliği bilindiğinde, normalize edilmiş olgular ayrıştırılan
npm paket adı bu kimlikten saparsa uyarır. Ayrıca `defaultChoice` geçersiz
olduğunda veya kullanılabilir olmayan bir kaynağa işaret ettiğinde ve geçerli
bir npm kaynağı olmadan npm integrity metadata'sı bulunduğunda uyarır.
Tüketiciler, elle oluşturulmuş girdilerin ve katalog shim'lerinin bunu
sentezlemesi gerekmemesi için `installSource` değerini eklemeli isteğe bağlı bir
alan olarak ele almalıdır.
Bu, onboarding ve diagnostics'in Plugin runtime'ını import etmeden source-plane
durumunu açıklamasını sağlar.

Resmi harici npm girdileri, tam bir `npmSpec` ile `expectedIntegrity` değerini
tercih etmelidir. Çıplak paket adları ve dist-tag'ler uyumluluk için hâlâ çalışır,
ancak katalog mevcut Plugin'leri bozmadan sabitlenmiş, integrity-checked kurulumlara
doğru ilerleyebilsin diye source-plane uyarıları üretir. Onboarding yerel bir
katalog yolundan kurulum yaptığında, mümkün olduğunda `source: "path"` ve
workspace-relative `sourcePath` ile yönetilen bir Plugin Plugin indeks girdisi
kaydeder. Mutlak operasyonel yükleme yolu `plugins.load.paths` içinde kalır;
kurulum kaydı, yerel workstation yollarını uzun ömürlü yapılandırmaya kopyalamaktan
kaçınır. Bu, yerel geliştirme kurulumlarını ikinci bir ham dosya sistemi-yolu
ifşa yüzeyi eklemeden source-plane diagnostics'e görünür tutar. Kalıcı
`plugins/installs.json` Plugin indeksi, kurulum source of truth'udur ve Plugin
runtime modüllerini yüklemeden yenilenebilir. Bir Plugin manifest'i eksik veya
geçersiz olsa bile `installRecords` map'i dayanıklıdır; `plugins` array'i yeniden
oluşturulabilir bir manifest görünümüdür.

## Context engine Plugin'leri

Context engine Plugin'leri ingest, assembly ve Compaction için session context
orkestrasyonuna sahip olur. Bunları Plugin'inizden `api.registerContextEngine(id, factory)`
ile kaydedin, ardından etkin engine'i `plugins.slots.contextEngine` ile seçin.

Bunu, Plugin'iniz yalnızca memory search veya hook eklemek yerine varsayılan context
pipeline'ını değiştirmesi veya genişletmesi gerektiğinde kullanın.

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

Factory `ctx`, construction-time initialization için isteğe bağlı `config`,
`agentDir` ve `workspaceDir` değerlerini açığa çıkarır.

Engine'iniz Compaction algoritmasına sahip **değilse**, `compact()` uygulamasını
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

Bir Plugin mevcut API'ye uymayan bir davranışa ihtiyaç duyduğunda, özel bir
içe erişimle Plugin sistemini atlamayın. Eksik capability'yi ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi ortak davranışa sahip olması gerektiğine karar verin: politika, fallback, config merge,
   lifecycle, kanala dönük semantik ve runtime helper şekli.
2. typed Plugin registration/runtime yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` değerini en küçük kullanışlı
   typed capability yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin'leri, yeni capability'yi doğrudan bir vendor
   uygulamasını import ederek değil, çekirdek üzerinden tüketmelidir.
4. vendor uygulamalarını kaydedin
   Vendor Plugin'leri ardından backend'lerini capability'ye göre kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir provider'ın worldview'üne hardcoded olmadan bu şekilde
opinionated kalır. Somut bir dosya checklist'i ve çalışılmış örnek için
[Capability Yemek Kitabı](/tr/plugins/adding-capabilities) sayfasına bakın.

### Capability checklist'i

Yeni bir capability eklediğinizde, implementation genellikle şu yüzeylere
birlikte dokunmalıdır:

- `src/<capability>/types.ts` içinde çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içinde çekirdek runner/runtime helper
- `src/plugins/types.ts` içinde Plugin API registration yüzeyi
- `src/plugins/registry.ts` içinde Plugin registry wiring
- özellik/kanal Plugin'lerinin bunu tüketmesi gerektiğinde `src/plugins/runtime/*` içinde Plugin runtime exposure
- `src/test-utils/plugin-registration.ts` içinde capture/test helper'ları
- `src/plugins/contracts/registry.ts` içinde ownership/contract assertion'ları
- `docs/` içinde operator/Plugin docs

Bu yüzeylerden biri eksikse bu genellikle capability'nin henüz tam olarak
entegre edilmediğinin işaretidir.

### Capability template'i

Minimal pattern:

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

Contract test pattern'i:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek capability sözleşmesine + orkestrasyona sahiptir
- vendor Plugin'leri vendor uygulamalarına sahiptir
- özellik/kanal Plugin'leri runtime helper'ları tüketir
- contract test'leri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — public capability modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
