---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırası veya kayıt defteri durumunda hata ayıklama
    - Yeni bir plugin yeteneği veya bağlam motoru plugini ekleme
summary: 'Plugin mimarisi iç işleyişi: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve referans tabloları'
title: Plugin mimarisinin iç işleyişi
x-i18n:
    generated_at: "2026-07-12T11:57:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel yetenek modeli, Plugin biçimleri ve sahiplik/yürütme sözleşmeleri için [Plugin mimarisi](/tr/plugins/architecture) sayfasına bakın. Bu sayfa iç işleyişi kapsar: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme işlem hattı

OpenClaw başlangıçta kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her adayın etkinleştirilip etkinleştirilmeyeceğine karar verir
6. etkinleştirilmiş yerel modülleri yükler: derlenmiş paket modülleri yerel bir yükleyici kullanır;
   üçüncü taraf yerel kaynak TypeScript, acil durum Jiti geri dönüşünü kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komutlara/çalışma zamanı yüzeylerine sunar

<Note>
`activate`, `register` için eski bir diğer addır — yükleyici mevcut olanı çözümler (`def.register ?? def.activate`) ve aynı noktada çağırır. Paketlenmiş tüm Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik denetimleri çalışma zamanı yürütmesinden **önce** uygulanır. Keşif şu durumlarda bir adayı engeller:

- çözümlenmiş giriş noktası Plugin kökünün dışına çıkıyorsa
- yolu (veya kök dizini) herkes tarafından yazılabilir durumdaysa
- paketlenmemiş Plugin'lerde yolun sahipliği geçerli uid (veya root) ile eşleşmiyorsa

Herkes tarafından yazılabilir paketlenmiş dizinlerde, denetim yeniden yapılmadan önce yerinde bir `chmod` onarımı denenir (npm/genel kurulumlar paket dizinlerini `0777` olarak dağıtabilir); paketlenmiş kaynaklar için sahiplik denetimleri tamamen atlanır.

Kimliği bilinen engellenmiş adaylar, başka nedenlerle reddedilmiş bir dizinin içindeki manifestten çözümlenen kimlikler de dâhil olmak üzere, yayımlanan tanılamada Plugin kimliklerini taşımaya devam eder. Böylece bu kimliğe başvuran yapılandırma, ilgisiz bir "bilinmeyen Plugin" hatası yerine yol güvenliği uyarısıyla ilişkilendirilmiş engellenmiş bir Plugin görür.

### Önce manifest davranışı

Manifest, denetim düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden düşük maliyetli etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'lerde çalışma zamanı modülü veri düzlemi bileşenidir. Kancalar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları denetim düzleminde kalır. Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri içeren tanımlayıcılardır; çalışma zamanı kaydının, `register(...)` işlevinin veya `setupEntry` değerinin yerini almazlar. Canlı etkinleştirme tüketicileri, daha geniş kayıt defteri oluşturulmadan önce Plugin yüklemesini daraltmak için manifestteki komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komutun sahibi olan Plugin'lerle sınırlandırılır
- kanal kurulumu/Plugin çözümlemesi, istenen kanal kimliğinin sahibi olan Plugin'lerle sınırlandırılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen sağlayıcı kimliğinin sahibi olan Plugin'lerle sınırlandırılır
- Gateway başlangıç planlaması, açık başlangıç içe aktarmaları için `activation.onStartup` kullanır; başlangıç meta verisi olmayan Plugin'ler yalnızca daha dar etkinleştirme tetikleyicileri aracılığıyla yüklenir

Etkinleştirme planlayıcısı, mevcut çağıranlar için yalnızca kimliklerden oluşan bir API ile tanılama amaçlı bir plan API'si sunar. Plan girdileri bir Plugin'in neden seçildiğini bildirir ve açık `activation.*` ipuçlarını manifest sahipliği geri dönüşünden ayırır:

| Neden (`activation.*` ipuçlarından)  | Neden (manifest sahipliğinden)                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                              |
| `activation-capability-hint`         | —                                                                                              |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                          |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                    |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`)   |
| `activation-route-hint`              | —                                                                                              |
| — (kanca tetikleyicisinin ipucu çeşidi yoktur) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)          |

Bu neden ayrımı uyumluluk sınırıdır: mevcut Plugin meta verileri çalışmaya devam ederken yeni kod, çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını veya geri dönüş davranışını algılayabilir.

Geniş `all` kapsamını isteyen istek zamanı çalışma ortamı ön yüklemeleri yine de yapılandırmadan, başlangıç planlamasından, yapılandırılmış kanallardan, yuvalardan ve otomatik etkinleştirme kurallarından açık bir etkin Plugin kimliği kümesi türetir (`src/plugins/effective-plugin-ids.ts` içindeki `resolveEffectivePluginIds`). Türetilen küme boşsa OpenClaw, kapsamı keşfedilebilir her Plugin'i içerecek şekilde genişletmek yerine boş tutar.

Kurulum keşfi, `setup-api` geri dönüşüne geçmeden önce aday Plugin'leri daraltmak için `setup.providers` ve `setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder; `setup-api`, kurulum zamanında hâlâ çalışma zamanı kancalarına ihtiyaç duyan Plugin'ler için kullanılır. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden manifestteki `providerAuthChoices` değerini, tanımlayıcıdan türetilen kurulum seçeneklerini ve kurulum kataloğu meta verilerini kullanır. Açıkça belirtilen `setup.requiresRuntime: false`, yalnızca tanımlayıcı kullanan bir kesme noktasıdır; `requiresRuntime` değerinin belirtilmemesi, uyumluluk için eski setup-api geri dönüşünü korur. Keşfedilen birden fazla Plugin aynı normalleştirilmiş kurulum sağlayıcısı veya CLI arka uç kimliği üzerinde hak iddia ederse kurulum araması, keşif sırasına güvenmek yerine belirsiz sahibi reddeder. Kurulum çalışma zamanı yürütüldüğünde kayıt defteri tanılamaları, eski Plugin'leri engellemeden `setup.providers` / `setup.cliBackends` ile setup-api tarafından gerçekten kaydedilen sağlayıcılar veya CLI arka uçları arasındaki sapmayı bildirir.

### Plugin önbelleği sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest kayıt defteri verilerini duvar saati zaman aralıklarının arkasında önbelleğe almaz. Kurulumlar, manifest düzenlemeleri ve yükleme yolu değişiklikleri bir sonraki açık meta veri okumasında veya anlık görüntü yeniden oluşturmasında görünür hâle gelmelidir. Manifest dosyası ayrıştırıcısı; açılan manifest yolu ile cihaz/inode, boyut ve mtime/ctime değerlerine göre anahtarlanan, sınırlandırılmış bir dosya imzası önbelleği tutar. Bu önbellek yalnızca değişmemiş baytların yeniden ayrıştırılmasını önler ve keşif, kayıt defteri, sahip veya politika yanıtlarını önbelleğe almamalıdır.

Güvenli meta veri hızlı yolu gizli bir önbellek değil, açık nesne sahipliğidir. Gateway başlangıcındaki yoğun kullanılan yollar; geçerli `PluginMetadataSnapshot` değerini, türetilmiş `PluginLookUpTable` değerini veya açık bir manifest kayıt defterini çağrı zinciri boyunca aktarmalıdır. Yapılandırma doğrulaması, başlangıçta otomatik etkinleştirme, Plugin önyüklemesi ve sağlayıcı seçimi, geçerli yapılandırmayı ve Plugin envanterini temsil ettikleri sürece bu nesneleri yeniden kullanabilir. Kurulum araması, ilgili kurulum yolu açık bir manifest kayıt defteri almadığı sürece manifest meta verilerini isteğe bağlı olarak yeniden oluşturur; bunu gizli arama önbellekleri eklemek yerine seyrek kullanılan yol geri dönüşü olarak koruyun. Girdi değiştiğinde anlık görüntüyü değiştirmek veya geçmiş kopyalarını tutmak yerine yeniden oluşturup yerine koyun. Etkin Plugin kayıt defteri üzerindeki görünümler ve paketlenmiş kanal önyükleme yardımcıları geçerli kayıt defterinden/kökten yeniden hesaplanmalıdır. Kısa ömürlü eşlemeler, tek bir çağrı içinde yinelenen işleri kaldırmak veya yeniden girişi önlemek için uygundur; süreç meta verisi önbelleklerine dönüşmemelidir.

Plugin yüklemesinde kalıcı önbellek katmanı çalışma zamanı yüklemesidir. Kod veya kurulu yapılar gerçekten yüklendiğinde yükleyici durumunu yeniden kullanabilir; örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin çalışma zamanı kayıt defterleri
- aynı çalışma zamanı yüzeyinin tekrar tekrar içe aktarılmasını önlemek için kullanılan jiti/modül önbellekleri ve genel yüzey yükleyicisi önbellekleri
- kurulu Plugin yapıları için dosya sistemi önbellekleri
- yol normalleştirme veya yinelenen çözümleme için kısa ömürlü, çağrı başına eşlemeler

Bu önbellekler veri düzlemi uygulama ayrıntılarıdır. Çağıran özellikle çalışma zamanı yüklemesini istemediği sürece "bu sağlayıcının sahibi hangi Plugin?" gibi denetim düzlemi sorularını yanıtlamamalıdır.

Şunlar için kalıcı veya duvar saatine dayalı önbellekler eklemeyin:

- keşif sonuçları
- doğrudan manifest kayıt defterleri
- kurulu Plugin dizininden yeniden oluşturulan manifest kayıt defterleri
- sağlayıcı sahibi araması, model engelleme, sağlayıcı politikası veya genel yapı meta verileri
- değiştirilmiş bir manifestin, kurulu dizinin veya yükleme yolunun bir sonraki meta veri okumasında görünmesi gereken, manifestten türetilmiş diğer tüm yanıtlar

Kalıcı kurulu Plugin dizininden manifest meta verilerini yeniden oluşturan çağıranlar, bu kayıt defterini isteğe bağlı olarak yeniden oluşturur. Kurulu dizin, kalıcı kaynak düzlemi durumudur; gizli bir süreç içi meta veri önbelleği değildir.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek genel değişkenlerini doğrudan değiştirmez. Merkezi bir Plugin kayıt defterine (`src/plugins/registry-types.ts` içindeki `PluginRegistry`) kayıt olurlar. Bu kayıt defteri; Plugin kayıtlarını (kimlik, kaynak, köken, durum, tanılamalar) ve her yetenek için dizileri izler: araçlar, eski kancalar ve türü belirlenmiş kancalar, kanallar, sağlayıcılar, Gateway RPC işleyicileri, HTTP rotaları, CLI kaydedicileri, arka plan hizmetleri, Plugin'e ait komutlar ve türü belirlenmiş onlarca başka sağlayıcı ailesi (konuşma, gömmeler, görüntü/video/müzik üretimi, web getirme/arama, ajan düzenekleri, oturum eylemleri vb.).

Ardından çekirdek özellikler, Plugin modülleriyle doğrudan iletişim kurmak yerine bu kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defterine kayıt
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik açısından önemlidir. Çoğu çekirdek yüzeyin yalnızca tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "her Plugin modülüne özel durum eklemek" yerine "kayıt defterini okumak".

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, onay sonuçlandığında tepki verebilir.

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
- `binding`: onaylanan istekler için çözümlenmiş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin verildiğini değiştirmez ve çekirdek onay işlemesi tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinin üç katmanı vardır:

- **Manifest meta verileri**, çalışma zamanından önce düşük maliyetli arama için:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk öğesi `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski adı `discovery`) ve
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme düzeyleri, yeniden oynatma politikası ve kullanım uç noktalarını kapsayan 40'tan fazla isteğe bağlı kanca. Bkz.
  [Kanca sırası ve kullanımı](#hook-order-and-usage).

OpenClaw genel ajan döngüsünün, yük devretmenin, transkript işlemenin ve araç politikasının sahipliğini sürdürür. Bu kancalar, tamamen özel bir çıkarım aktarımına ihtiyaç duymadan sağlayıcıya özgü davranışlar için genişletme yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin çalışma zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri varsa manifest `setup.providers[].envVars` alanını kullanın. Kullanımdan kaldırılan `providerAuthEnvVars`, kullanımdan kaldırma süresi boyunca uyumluluk bağdaştırıcısı tarafından okunmaya devam eder ve bunu kullanan paketle birlikte gelmeyen Plugin'ler bir manifest tanılaması alır. Bir sağlayıcı kimliğinin başka bir sağlayıcı kimliğine ait ortam değişkenlerini, kimlik doğrulama profillerini, yapılandırma destekli kimlik doğrulamayı ve API anahtarı ilk kurulum seçeneğini yeniden kullanması gerektiğinde manifest `providerAuthAliases` alanını kullanın. İlk kurulum/kimlik doğrulama seçimi CLI yüzeylerinin, sağlayıcı çalışma zamanını yüklemeden sağlayıcının seçim kimliğini, grup etiketlerini ve tek bayraklı basit kimlik doğrulama bağlantısını bilmesi gerektiğinde manifest `providerAuthChoices` alanını kullanın. İlk kurulum etiketleri veya OAuth istemci kimliği/istemci gizli anahtarı kurulum değişkenleri gibi operatöre yönelik ipuçları için sağlayıcı çalışma zamanı `envVars` alanını kullanmaya devam edin.

Bir kanalın, kanal çalışma zamanını yüklemeden genel kabuk ortamı yedeğinin, yapılandırma/durum denetimlerinin veya kurulum istemlerinin görmesi gereken ortam değişkeni tabanlı kimlik doğrulaması ya da kurulumu varsa manifest `channelEnvVars` alanını kullanın.

### Hook sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw, hook'ları yaklaşık olarak şu sırayla çağırır.
"Ne zaman kullanılmalı" sütunu hızlı karar kılavuzudur.
OpenClaw'un artık çağırmadığı `ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi yalnızca uyumluluk amaçlı sağlayıcı alanları burada bilinçli olarak listelenmemiştir.

| Hook                              | Ne yapar                                                                                                   | Ne zaman kullanılır                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` oluşturulurken sağlayıcı yapılandırmasını `models.providers` içine yayımlar                                | Sağlayıcı bir kataloğa veya temel URL varsayılanlarına sahiptir                                                                                                  |
| `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcıya ait genel yapılandırma varsayılanlarını uygular                                      | Varsayılanlar kimlik doğrulama moduna, ortama veya sağlayıcının model ailesi semantiğine bağlıdır                                                                         |
| _(yerleşik model araması)_         | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                          | _(Plugin kancası değildir)_                                                                                                                         |
| `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                                     | Sağlayıcı, standart model çözümlemesinden önce takma ad temizliğini üstlenir                                                                                 |
| `normalizeTransport`              | Genel model birleştirmesinden önce sağlayıcı ailesinin `api` / `baseUrl` değerlerini normalleştirir                                      | Sağlayıcı, aynı aktarım ailesindeki özel sağlayıcı kimliklerinin aktarım temizliğini üstlenir                                                          |
| `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                                           | Sağlayıcı, Plugin ile birlikte bulunması gereken yapılandırma temizliğine ihtiyaç duyar; paketle gelen Google ailesi yardımcıları da desteklenen Google yapılandırma girdileri için güvence sağlar   |
| `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanımı uyumluluk yeniden yazımlarını uygular                                               | Sağlayıcı, uç nokta odaklı yerel akış kullanımı meta verisi düzeltmelerine ihtiyaç duyar                                                                          |
| `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretçisi kimlik doğrulamasını çözümler                                       | Sağlayıcılar kendi ortam işaretçisi API anahtarı çözümleme kancalarını sunar                                                                                |
| `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/kendi sunucusunda barındırılan veya yapılandırma destekli kimlik doğrulamasını sunar                                   | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabilir                                                                                 |
| `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini katman olarak ekler; CLI/uygulamaya ait kimlik bilgileri için varsayılan `persistence`, `runtime-only` değeridir | Sağlayıcı, kopyalanan yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama bilgilerini yeniden kullanır; manifestte `contracts.externalAuthProviders` bildirin |
| `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularının önceliğini ortam/yapılandırma destekli kimlik doğrulamasının altına düşürür                                      | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklar                                                                 |
| `resolveDynamicModel`             | Henüz yerel kayıt defterinde bulunmayan, sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş                                       | Sağlayıcı rastgele üst kaynak model kimliklerini kabul eder                                                                                                 |
| `prepareDynamicModel`             | Eşzamansız hazırlık yapar, ardından `resolveDynamicModel` yeniden çalışır                                                           | Sağlayıcı, bilinmeyen kimlikleri çözümlemeden önce ağ meta verilerine ihtiyaç duyar                                                                                  |
| `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önce son yeniden yazımı gerçekleştirir                                               | Sağlayıcı aktarım yeniden yazımlarına ihtiyaç duyar ancak yine de bir çekirdek aktarımı kullanır                                                                             |
| `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalleştirir                                                    | Sağlayıcı, aktarım ailesine özgü şema temizliğine ihtiyaç duyar                                                                                                |
| `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcıya ait şema tanılamalarını sunar                                                  | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları sağlamak ister                                                                 |
| `resolveReasoningOutputMode`      | Yerel veya etiketli akıl yürütme çıktısı sözleşmesini seçer                                                              | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/nihai çıktı gerektirir                                                                         |
| `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametrelerini normalleştirir                                              | Sağlayıcı, varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyar                                                                           |
| `createStreamFn`                  | Normal akış yolunu özel bir aktarımla tamamen değiştirir                                                   | Sağlayıcı yalnızca bir sarmalayıcıya değil, özel bir kablo protokolüne ihtiyaç duyar                                                                                     |
| `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonraki akış sarmalayıcısı                                                              | Sağlayıcı, özel bir aktarım olmadan istek üst bilgisi/gövdesi/model uyumluluk sarmalayıcılarına ihtiyaç duyar                                                          |
| `resolveTransportTurnState`       | Her tur için yerel aktarım üst bilgilerini veya meta verilerini iliştirir                                                           | Sağlayıcı, genel aktarımların sağlayıcıya özgü tur kimliğini göndermesini ister                                                                       |
| `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgilerini veya oturum bekleme süresi politikasını iliştirir                                                    | Sağlayıcı, genel WS aktarımlarının oturum üst bilgilerini veya geri dönüş politikasını ayarlamasını ister                                                               |
| `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil, çalışma zamanındaki `apiKey` dizesine dönüşür                                     | Sağlayıcı ek kimlik doğrulama meta verileri saklar ve özel bir çalışma zamanı belirteci biçimine ihtiyaç duyar                                                                    |
| `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası politikası için OAuth yenileme geçersiz kılması                                  | Sağlayıcı, paylaşılan OpenClaw yenileyicilerine uymaz                                                                                          |
| `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                                  | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım yönlendirmesine ihtiyaç duyar                                                                      |
| `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                                 | Sağlayıcının, genel sezgisel yöntemlerin kaçıracağı ham taşma hataları vardır                                                                                |
| `classifyFailoverReason`          | Sağlayıcıya ait yük devretme nedeni sınıflandırması                                                                  | Sağlayıcı, ham API/aktarım hatalarını hız sınırı/aşırı yük/vb. nedenlerle eşleyebilir                                                                          |
| `isCacheTtlEligible`              | Proxy/arka taşıma sağlayıcıları için istem önbelleği politikası                                                               | Sağlayıcı, proxy'ye özgü önbellek TTL kısıtlamasına ihtiyaç duyar                                                                                                |
| `buildMissingAuthMessage`         | Genel eksik kimlik doğrulaması kurtarma iletisinin yerine geçer                                                      | Sağlayıcı, sağlayıcıya özgü bir eksik kimlik doğrulaması kurtarma ipucuna ihtiyaç duyar                                                                                 |
| `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları (kullanımdan kaldırıldı, aşağıya bakın)                                  | Sağlayıcı, `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyaç duyar                                                                     |
| `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntüleme etiketleri ve varsayılan değer                                                 | Sağlayıcı, seçilen modeller için özel bir düşünme kademesi veya ikili etiket sunar                                                                 |
| `isBinaryThinking`                | Açık/kapalı akıl yürütme geçişi uyumluluk kancası                                                                     | Sağlayıcı yalnızca ikili düşünme açık/kapalı durumunu sunar                                                                                                  |
| `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                                   | Sağlayıcı yalnızca belirli bir model alt kümesinde `xhigh` kullanmak ister                                                                                             |
| `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                      | Sağlayıcı, bir model ailesi için varsayılan `/think` politikasını üstlenir                                                                                      |
| `isModernModelRef`                | Canlı profil filtreleri ve duman testi seçimi için modern model eşleştiricisi                                              | Sağlayıcı, canlı/duman testi tercih edilen model eşleştirmesini üstlenir                                                                                             |
| `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür                       | Sağlayıcı, belirteç değişimine veya kısa ömürlü bir istek kimlik bilgisine ihtiyaç duyar                                                                             |
| `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümler                                     | Sağlayıcı, özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyaç duyar                                                               |
| `fetchUsageSnapshot`              | Kimlik doğrulaması çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalleştirir                             | Sağlayıcı, sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyaç duyar                                                                           |
| `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir gömme bağdaştırıcısı oluşturur                                                     | Bellek gömme davranışı sağlayıcı Plugin'ine aittir                                                                                    |
| `buildReplayPolicy`               | Sağlayıcının transkript işleme biçimini denetleyen bir yeniden oynatma ilkesi döndürür                                        | Sağlayıcı özel bir transkript ilkesine ihtiyaç duyar (örneğin, düşünme bloklarını kaldırma)                                                               |
| `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra yeniden oynatma geçmişini yeniden yazar                                                        | Sağlayıcı, paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma düzenlemelerine ihtiyaç duyar                                                             |
| `validateReplayTurns`             | Gömülü çalıştırıcıdan önce yeniden oynatma turlarını son kez doğrular veya yeniden şekillendirir                                           | Sağlayıcı aktarımı, genel temizlemeden sonra daha katı tur doğrulamasına ihtiyaç duyar                                                                    |
| `onModelSelected`                 | Seçim sonrasında sağlayıcıya ait yan etkileri çalıştırır                                                                 | Bir model etkinleştiğinde sağlayıcı telemetriye veya sağlayıcıya ait duruma ihtiyaç duyar                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini denetler, ardından bunlardan biri model kimliğini veya
aktarım/yapılandırmayı gerçekten değiştirene kadar kanca özellikli diğer sağlayıcı
Plugin'lerine geçer. Bu, çağıranın yeniden yazmanın hangi paketlenmiş Plugin'e
ait olduğunu bilmesini gerektirmeden sağlayıcı takma adı/uyumluluk adaptörlerinin
çalışmasını sürdürür. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi
yapılandırma girdisini yeniden yazmazsa paketlenmiş Google yapılandırma
normalleştiricisi bu uyumluluk temizliğini yine uygular.

Sağlayıcı tamamen özel bir kablo protokolüne veya özel bir istek yürütücüsüne
ihtiyaç duyuyorsa bu, farklı bir uzantı sınıfıdır. Bu kancalar, OpenClaw'ın
normal çıkarım döngüsünde çalışmaya devam eden sağlayıcı davranışları içindir.

`resolveUsageAuth`, OpenClaw'ın `fetchUsageSnapshot` çağrısı mı yapacağına yoksa
kullanım/durum yüzeyleri için genel kimlik bilgisi çözümlemeye mi geri döneceğine
karar verir. Sağlayıcının bir kullanım kimlik bilgisi olduğunda
`{ token, accountId?, subscriptionType?, rateLimitTier? }` döndürün (isteğe bağlı
plan meta verileri `fetchUsageSnapshot` işlevine aktarılır), sağlayıcının sahip
olduğu kullanım kimlik doğrulaması isteği işlediğinde ve genel API anahtarı/OAuth
geri dönüşünü engellemesi gerektiğinde `{ handled: true }` döndürün; sağlayıcı
kullanım kimlik doğrulamasını işlemediyse `null` veya `undefined` döndürün.

Kuruluş veya faturalandırma kimlik bilgilerini manifestteki
`providerUsageAuthEnvVars` içinde bildirin. Böylece genel keşif ve gizli bilgi
temizleme yüzeyleri, bunları çıkarım kimlik doğrulaması adayları hâline
getirmeden tanıyabilir.

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
düşünme, yeniden oynatma ve kullanım gereksinimlerine uyum sağlamak için
yukarıdaki kancaları birleştirir. Yetkili kanca kümesi `extensions/` altındaki
her Plugin ile birlikte bulunur; bu sayfa listeyi yansıtmak yerine biçimleri
gösterir.

<AccordionGroup>
  <Accordion title="Geçişli katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI ve xAI, yukarı akış model kimliklerini OpenClaw'ın
    statik kataloğundan önce sunabilmek için `catalog` ile birlikte
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi ve z.ai; belirteç
    değişimi ile `/usage` entegrasyonunun sahipliğini üstlenmek için
    `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` +
    `fetchUsageSnapshot` işlevlerini eşleştirir.
  </Accordion>
  <Accordion title="Yeniden oynatma ve döküm temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin'in temizliği
    yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` aracılığıyla
    döküm politikasını etkinleştirmesine olanak tanır.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü
    kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü akış yardımcıları">
    Beta üst bilgileri, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine
    Anthropic Plugin'inin herkese açık `api.ts` / `contract-api.ts` sınırı
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) içinde bulunur.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler seçili çekirdek yardımcılarına `api.runtime` aracılığıyla erişebilir.
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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızını döndürür. Plugin'ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices` her sağlayıcı için isteğe bağlıdır. Satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Çekirdek, sağlayıcı `listVoices` kancalarına çözümlenmiş bir istek son tarihi geçirir; sağlayıcıya özgü zaman aşımı ayarları bunu geçersiz kılabilir.
- Ses listeleri, sağlayıcıya duyarlı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs günümüzde telefon görüşmesini destekler. Microsoft desteklemez.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma
sağlayıcılarını kaydedebilir.

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

- TTS politikasını, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Satıcıya ait sentez davranışları için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi, `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu yetenek
  sözleşmelerini ekledikçe tek bir satıcı Plugin'i metin, konuşma, görüntü ve
  gelecekteki medya sağlayıcılarının sahibi olabilir.

Görüntü/ses/video anlama için Plugin'ler genel bir anahtar/değer paketi yerine
türlü tek bir medya anlama sağlayıcısı kaydeder:

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
- Eklemeli genişletme türlü kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe
  bağlı sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı örüntüyü izler:
  - yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibi çekirdektir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` kullanır

Medya anlama çalışma zamanı yardımcıları için Plugin'ler şunları çağırabilir:

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
  model: "gpt-5.6-sol",
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

Ses dökümü için Plugin'ler medya anlama çalışma zamanını veya eski STT takma
adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görüntü/ses/video anlama için tercih edilen
  paylaşılan yüzeydir.
- `extractStructuredWithModel(...)`, sınırlandırılmış ve sağlayıcıya ait,
  görüntü öncelikli çıkarma için Plugin'e yönelik sınırdır. En az bir görüntü
  girdisi ekleyin; metin girdileri tamamlayıcı bağlamdır. Ürün Plugin'leri
  kendi yollarının ve şemalarının sahibiyken sağlayıcı/çalışma zamanı sınırının
  sahibi OpenClaw'dır.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Hiçbir döküm çıktısı üretilmediğinde (örneğin atlanmış/desteklenmeyen girdi) `{ text: undefined }` döndürür.
- `api.runtime.stt.transcribeAudioFile(...)` uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` aracılığıyla arka plan alt aracı
çalıştırmalarını başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, her çalıştırma için isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait geri dönüş çalıştırmaları için operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça etkinleştirmesi gerekir.
- Güvenilir Plugin'leri belirli standart `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels`, herhangi bir hedefe açıkça izin vermek içinse `"*"` kullanın.
- Güvenilmeyen Plugin alt aracı çalıştırmaları yine çalışır; ancak geçersiz kılma istekleri sessizce geri dönmek yerine reddedilir.
- Plugin tarafından oluşturulan alt aracı oturumları, oluşturan Plugin kimliğiyle etiketlenir. Geri dönüş `api.runtime.subagent.deleteSession(...)` yalnızca sahip olunan bu oturumları silebilir; rastgele oturum silme işlemi hâlâ yönetici kapsamlı bir Gateway isteği gerektirir.

Web araması için Plugin'ler, aracı araç bağlantılarına erişmek yerine paylaşılan
çalışma zamanı yardımcısını kullanabilir:

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

Plugin'ler ayrıca `api.registerWebSearchProvider(...)` aracılığıyla web arama
sağlayıcılarını kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama aktarımları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, aracı araç sarmalayıcısına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü üretme sağlayıcısı zincirini kullanarak bir görüntü üretir.
- `listProviders(...)`: kullanılabilir görüntü üretme sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP yolları

Plugin'ler `api.registerHttpRoute(...)` ile HTTP uç noktalarını kullanıma
sunabilir.

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
- `auth`: zorunludur; `"gateway"` veya `"plugin"`. Normal Gateway kimlik doğrulamasını zorunlu kılmak için `"gateway"`, Plugin tarafından yönetilen kimlik doğrulama/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlıdır. `"exact"` (varsayılan) veya `"prefix"`.
- `handleUpgrade`: aynı rotadaki WebSocket yükseltme istekleri için isteğe bağlı işleyici.
- `replaceExisting`: isteğe bağlıdır. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine olanak tanır.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırılmıştır ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- `replaceExisting: true` olmadığı sürece aynı `path + match` çakışmaları reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` devam zincirlerini yalnızca aynı kimlik doğrulama düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak **almaz**. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır. Varsayılan yüzey (`gatewayRuntimeScopeSurface: "write-default"`) bilinçli olarak kısıtlayıcıdır:
  - paylaşılan gizli anahtar taşıyıcı kimlik doğrulaması (`gateway.auth.mode = "token"` / `"password"`) ve güvenilir proxy dışındaki tüm kimlik doğrulama yöntemleri, çağıran `x-openclaw-scopes` gönderse bile tek bir `operator.write` kapsamı alır
  - açık bir `x-openclaw-scopes` üstbilgisi olmayan `trusted-proxy` çağıranları da yalnızca `operator.write` içeren eski yüzeyi korur
  - `x-openclaw-scopes` gönderen `trusted-proxy` çağıranları bunun yerine bildirilen kapsamları alır
  - bir rota, kimlik taşıyan kimlik doğrulama modlarında `x-openclaw-scopes` değerine her zaman uymak için `gatewayRuntimeScopeSurface: "trusted-operator"` seçeneğini etkinleştirebilir (üstbilgi yoksa tam CLI varsayılan kapsam kümesine geri döner)
- Pratik kural: Gateway kimlik doğrulamalı bir Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yöneticiye özel davranış gerektiriyorsa `trusted-operator` kapsam yüzeyini etkinleştirin, kimlik taşıyan bir kimlik doğrulama modu zorunlu kılın ve açık `x-openclaw-scopes` üstbilgi sözleşmesini belgeleyin.
- Rota eşleştirme ve kimlik doğrulamasından sonra sıradan işleyiciler Gateway kök iş kabul sürecine katılır. Hazırlanmakta veya yeniden başlatılmakta olan bir Gateway, işleyiciyi çağırmadan önce `503` döndürür. Sınırlı istisna, manifest tarafından yetkilendirilmiş ve rotaya özgü `trusted-operator` yüzeyini de etkinleştiren bir `auth: "gateway"` rotasıdır; askıya alma denetimi yönlendirmesinin erişilemez kalmaması için bu rota erişilebilir olmaya devam ederken aynı Plugin'in sıradan kardeş rotaları kabul sınırının arkasında kalır. WebSocket `handleUpgrade` sahipliği aynı atomik kabul sınırını kullanır; işleyici bir soketi kabul ettikten sonra soketin sonraki yaşam döngüsü Plugin'in sorumluluğundadır ve bu sınır tarafından izlenmez.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler geliştirirken tek parça `openclaw/plugin-sdk` kök dışa aktarma noktası
yerine dar kapsamlı SDK alt yollarını kullanın. Temel alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt temel öğeleri                         |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/oluşturma yardımcıları                 |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme   |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal Plugin'leri dar kapsamlı bağlantı noktaları ailesinden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karıştırılmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen odaklanmış `*-runtime` alt yolları
altında bulunur (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş kapsamlı `config-runtime` uyumluluk
dışa aktarma noktası yerine `config-contracts`, `plugin-config-runtime`,
`runtime-config-snapshot` ve `config-mutation` tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
küçük kanal yardımcı cepheleri, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış
uyumluluk ara katmanlarıdır. Yeni kod bunun yerine daha dar kapsamlı genel temel
öğeleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketle birlikte gelen her Plugin paketinin köküne göre):

- `index.js` — paketle birlikte gelen Plugin girişi
- `api.js` — yardımcılar/türler dışa aktarma noktası
- `runtime-api.js` — yalnızca çalışma zamanı dışa aktarma noktası
- `setup-entry.js` — kurulum Plugin'i girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır.
Çekirdekten veya başka bir Plugin'den hiçbir zaman başka bir Plugin paketinin
`src/*` yolunu içe aktarmayın. Cephe üzerinden yüklenen giriş noktaları, mevcut
olduğunda etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder ve
ardından diskte çözümlenen yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar,
paketle birlikte gelen Plugin'ler günümüzde bunları kullandığı için mevcuttur. Bunlar
otomatik olarak uzun vadeli, değişmez harici sözleşmeler değildir; bunlara bağlı
kalırken ilgili SDK başvuru sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler; tepkiler, okuma işlemleri ve anketler gibi mesaj dışı temel öğeler için
kanala özgü `describeMessageTool(...)` şema katkılarının sahibi olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları
yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı denetim listesi
için bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yeteneğine sahip Plugin'ler, mesaj yetenekleri aracılığıyla neleri
işleyebileceklerini bildirir:

- anlamsal sunum blokları (`text`, `context`, `divider`, `chart`, `table`,
  `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumun yerel olarak işlenmesine veya metne indirgenmesine karar verir.
Genel mesaj aracından sağlayıcıya özgü kullanıcı arayüzü kaçış yolları sunmayın.
Eski yerel şemalara yönelik kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü
taraf Plugin'ler için dışa aktarılmaya devam eder, ancak yeni Plugin'ler bunları
kullanmamalıdır.

## Kanal hedefi çözümleme

Kanal Plugin'leri kanala özgü hedef anlamlarının sahibi olmalıdır. Paylaşılan
giden ileti ana makinesini genel tutun ve sağlayıcı kuralları için mesajlaşma
bağdaştırıcısı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, dizin aramasından önce normalleştirilmiş
  bir hedefin `direct`, `group` veya `channel` olarak değerlendirilip
  değerlendirilmeyeceğine karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin
  araması yerine doğrudan kimlik benzeri çözümlemeye geçip geçmemesi gerektiğini
  çekirdeğe bildirir.
- `messaging.targetResolver.reservedLiterals`, bu sağlayıcı için kanal/oturum
  başvuruları olan yalın sözcükleri listeler. Çözümleme, ayrılmış değişmez değerleri
  reddetmeden önce yapılandırılmış dizin girdilerini korur ve ardından bir dizin
  eşleşmediğinde güvenli biçimde başarısız olur.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden veya
  bir dizin eşleşmemesinden sonra sağlayıcının sahip olduğu nihai bir çözümlemeye
  ihtiyaç duyduğu durumlarda Plugin geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, hedef çözümlendikten sonra
  sağlayıcıya özgü oturum rotası oluşturma işleminin sahibidir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için
  `inferTargetChatType` kullanın.
- "Bunu açık/yerel bir hedef kimliği olarak değerlendir" denetimleri için
  `looksLikeId` kullanın.
- Geniş kapsamlı dizin araması için değil, sağlayıcıya özgü normalleştirme geri
  dönüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, ileti dizisi kimlikleri, JID'ler, kullanıcı tanıtıcıları ve oda
  kimlikleri gibi sağlayıcıya özgü kimlikleri genel SDK alanlarında değil, `target`
  değerlerinde veya sağlayıcıya özgü parametrelerde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin'ler bu mantığı Plugin içinde tutmalı
ve `openclaw/plugin-sdk/directory-runtime` yolundaki paylaşılan yardımcıları yeniden
kullanmalıdır.

Bir kanalın aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyacı
olduğunda bunu kullanın:

- izin listesiyle yönetilen doğrudan mesaj eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamındaki statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri
yönetir:

- sorgu filtreleme
- sınır uygulama
- yinelenenleri kaldırma/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap inceleme ve kimlik normalleştirme işlemleri Plugin uygulamasında
kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri, çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları
tanımlayabilir.

`catalog.run(...)`, OpenClaw'un `models.providers` içine yazdığı biçimin aynısını
döndürür:

- tek sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin; sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının veya
kimlik doğrulamasına bağlı model meta verilerinin sahibiyse `catalog` kullanın.

`catalog.order`, bir Plugin kataloğunun OpenClaw'un yerleşik örtük sağlayıcılarına
göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarıyla veya ortam tarafından yönetilen sağlayıcılar
- `profile`: kimlik doğrulama profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birbiriyle ilişkili birden çok sağlayıcı girdisi oluşturan sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonraki son geçiş

Anahtar çakışmasında sonraki sağlayıcılar kazandığından Plugin'ler aynı sağlayıcı
kimliğine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Plugin'ler ayrıca
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` aracılığıyla salt okunur model satırları yayımlayabilir. Bu, liste/yardım/seçici
yüzeyleri için ileriye dönük yoldur ve `text`, `voice`, `image_generation`,
`video_generation` ve `music_generation` satırlarını destekler. Sağlayıcı
Plugin'leri canlı uç nokta çağrılarının, token alışverişinin ve satıcı yanıtı
eşlemesinin sahibi olmaya devam eder; çekirdek ortak satır biçiminin, kaynak
etiketlerinin ve medya aracı yardım biçimlendirmesinin sahibidir. Medya oluşturma
sağlayıcısı kayıtları, `defaultModel`, `models` ve `capabilities` değerlerinden
otomatik olarak statik katalog satırları oluşturur.

Uyumluluk:

- `discovery` eski bir takma ad olarak çalışmaya devam eder ancak kullanımdan
  kaldırma uyarısı verir
- hem `catalog` hem de `discovery` kaydedilirse OpenClaw `catalog` kullanır
  ve bir uyarı verir
- `augmentModelCatalog` kullanımdan kaldırılmıştır; paketle birlikte gelen
  sağlayıcılar ek satırları `registerModelCatalogProvider` aracılığıyla
  yayımlamalıdır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Nedenleri:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen
  somutlaştırıldığını varsayabilir ve gerekli gizli değerler eksik olduğunda
  hızla başarısız olabilir.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`,
  `openclaw channels resolve` gibi salt okunur komut yolları ile doctor/yapılandırma
  onarım akışları, yalnızca yapılandırmayı açıklamak için çalışma zamanı kimlik
  bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` alanlarını koruyun.
- İlgili olduğunda aşağıdakiler gibi kimlik bilgisi kaynağı/durumu alanlarını ekleyin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerlerini döndürmeniz gerekmez. Durum tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak alanı) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmesi veya hesabı yapılandırılmamış olarak yanlış bildirmesi yerine "yapılandırılmış ancak bu komut yolunda kullanılamıyor" durumunu bildirmesine olanak tanır.

## Paket paketleri

Bir plugin dizini, `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir plugin hâline gelir. Paket birden fazla uzantı listeliyorsa plugin kimliği `<manifestOrPackageName>/<fileBase>` olur (varsa manifest kimliği önceliklidir; aksi takdirde kapsam belirtilmemiş `package.json` adı kullanılır).

Plugin'iniz npm bağımlılıklarını içe aktarıyorsa `node_modules` kullanılabilir olacak şekilde bunları ilgili dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruması: Her `openclaw.extensions` girdisi, sembolik bağlantı çözümlemesinden sonra plugin dizini içinde kalmalıdır. Paket dizininin dışına çıkan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, devralınan genel npm kurulum ayarlarını yok sayarak plugin bağımlılıklarını projeye yerel bir `npm install --omit=dev --ignore-scripts` komutuyla kurar (yaşam döngüsü betikleri çalıştırılmaz ve çalışma zamanında geliştirme bağımlılıkları bulunmaz). Plugin bağımlılık ağaçlarını "saf JS/TS" olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, yalnızca kurulum için kullanılan hafif bir modülü gösterebilir. OpenClaw, devre dışı bırakılmış bir kanal plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya bir kanal plugin'i etkinleştirilmiş ancak hâlâ yapılandırılmamış olduğunda tam plugin girdisi yerine `setupEntry` öğesini yükler. Böylece ana plugin girdiniz araçları, kancaları veya yalnızca çalışma zamanına özgü diğer kodları da bağlıyorsa başlangıç ve kurulum daha hafif kalır.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, kanal zaten yapılandırılmış olsa bile bir kanal plugin'inin Gateway'in dinleme öncesi başlangıç aşamasında aynı `setupEntry` yolunu kullanmasını sağlayabilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce bulunması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girdisinin başlangıcın bağlı olduğu kanalın sahipliğindeki tüm yetenekleri kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı zaman aralığında bulunması gereken tüm Gateway yöntemleri, araçları veya hizmetleri

Tam girdiniz hâlâ gerekli bir başlangıç yeteneğine sahipse bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın başlangıç sırasında tam girdiyi yüklemesine izin verin.

Paketle birlikte gelen kanallar, tam kanal çalışma zamanı yüklenmeden önce çekirdeğin başvurabileceği, yalnızca kuruluma yönelik sözleşme yüzeyi yardımcılarını da yayımlayabilir. Mevcut kurulum yükseltme yüzeyi şunlardır:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam plugin girdisini yüklemeden eski bir tek hesaplı kanal yapılandırmasını `channels.<id>.accounts.*` konumuna yükseltmesi gerektiğinde bu yüzeyi kullanır. Matrix, paketle birlikte gelen güncel örnektir: Adlandırılmış hesaplar zaten mevcut olduğunda yalnızca kimlik doğrulama/önyükleme anahtarlarını adlandırılmış ve yükseltilmiş bir hesaba taşır; ayrıca her zaman `accounts.default` oluşturmak yerine yapılandırılmış, standart dışı bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketle birlikte gelen sözleşme yüzeyi keşfini tembel tutar. İçe aktarma süresi hafif kalır; yükseltme yüzeyi, modül içe aktarımında paketle birlikte gelen kanal başlangıcına yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemlerini içerdiğinde bunları plugin'e özgü bir ön ekte tutun. Çekirdek yönetici ad alanları (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış olarak kalır ve bir plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözümlenir.

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

### Kanal kataloğu meta verileri

Kanal plugin'leri, `openclaw.channel` aracılığıyla kurulum/keşif meta verilerini ve `openclaw.install` aracılığıyla kurulum ipuçlarını duyurabilir. Bu, çekirdek kataloğunu veriden bağımsız tutar.

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

Asgari örneğin ötesinde yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: dokümantasyon bağlantısının metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metin denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı Markdown destekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: dokümantasyon gezinme yüzeyleri için kanalı dâhilî/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk amacıyla hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dâhil eder
- `forceAccountBinding`: yalnızca bir hesap mevcut olsa bile açık hesap bağlamayı zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözümlenirken oturum aramasını tercih eder

OpenClaw ayrıca **haricî kanal kataloglarını** (örneğin bir MPM kayıt defteri dışa aktarımını) birleştirebilir. Aşağıdaki konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Alternatif olarak `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini bir ya da daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarının eski takma adları olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal kataloğu girdileri ve sağlayıcı kurulum kataloğu girdileri, ham `openclaw.install` bloğunun yanında normalleştirilmiş kurulum kaynağı bilgilerini sunar. Normalleştirilmiş bilgiler; npm belirtiminin tam bir sürüm mü yoksa değişken bir seçici mi olduğunu, beklenen bütünlük meta verilerinin mevcut olup olmadığını ve yerel bir kaynak yolunun da kullanılabilir olup olmadığını belirtir. Katalog/paket kimliği bilindiğinde normalleştirilmiş bilgiler, ayrıştırılan npm paket adı bu kimlikten farklılaşırsa uyarır. Ayrıca `defaultChoice` geçersiz olduğunda veya kullanılabilir olmayan bir kaynağı gösterdiğinde ve geçerli bir npm kaynağı olmadan npm bütünlük meta verileri bulunduğunda da uyarır. Tüketiciler, elle oluşturulan girdilerin ve katalog uyumluluk katmanlarının bunu sentezlemesi gerekmemesi için `installSource` alanını eklemeli ve isteğe bağlı bir alan olarak ele almalıdır.
Bu, ilk katılım ve tanılamanın plugin çalışma zamanını içe aktarmadan kaynak katmanı durumunu açıklamasına olanak tanır.

Resmî haricî npm girdileri, tam bir `npmSpec` ile `expectedIntegrity` değerini tercih etmelidir. Yalın paket adları ve dağıtım etiketleri uyumluluk için çalışmaya devam eder, ancak katalog mevcut plugin'leri bozmadan sabitlenmiş ve bütünlüğü denetlenen kurulumlara yönelebilsin diye kaynak katmanı uyarıları oluştururlar.
İlk katılım yerel bir katalog yolundan kurulum yaptığında, mümkünse `source: "path"` ve çalışma alanına göreli bir `sourcePath` içeren, yönetilen bir plugin dizini girdisi kaydeder. Mutlak operasyonel yükleme yolu `plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu yollarını uzun ömürlü yapılandırmada çoğaltmaz. Böylece yerel geliştirme kurulumları, ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklenmeden kaynak katmanı tanılamasında görünür kalır. Kalıcı `installed_plugin_index` SQLite tablosu, kurulum kaynağı için tek doğruluk kaynağıdır ve plugin çalışma zamanı modülleri yüklenmeden yenilenebilir. `installRecords` eşlemesi, bir plugin manifesti eksik veya geçersiz olduğunda bile kalıcıdır; `plugins` yükü ise yeniden oluşturulabilir bir manifest görünümüdür.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri; alma, derleme ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları plugin'inizden `api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru `plugins.slots.contextEngine` ile seçin.

Bunu, plugin'inizin yalnızca bellek araması veya kancalar eklemek yerine varsayılan bağlam işlem hattını değiştirmesi ya da genişletmesi gerektiğinde kullanın.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

`factory` bağlamı `ctx`, oluşturma zamanı başlatması için isteğe bağlı `config`, `agentDir` ve `workspaceDir` değerlerini sunar.

Etkin çalıştırma çatısının kalıcı bir arka uç iş parçacığı olduğunda `assemble()`, `contextProjection` döndürebilir. Eski, her dönüşe özel yansıtma için bunu atlayın. Derlenen bağlam bir arka uç iş parçacığına bir kez enjekte edilmeli ve dönem değişene kadar yeniden kullanılmalıysa `{ mode: "thread_bootstrap", epoch }` döndürün. Motorun anlamsal bağlamı değiştikten sonra, örneğin motorun sahip olduğu bir Compaction geçişinin ardından dönemi değiştirin. Ana makineler, yeni arka uç iş parçacıklarının ham ve gizli bilgi içeren yükleri kopyalamadan araç sürekliliğini koruması için iş parçacığı önyükleme yansıtmasında araç çağrısı meta verilerini, girdi şeklini ve gizlenmiş araç sonuçlarını koruyabilir.

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()` uygulamasını koruyun ve açıkça yetkilendirin:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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

Bir plugin mevcut API'ye uymayan bir davranışa ihtiyaç duyduğunda, özel bir iç erişimle plugin sistemini atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. **Çekirdek sözleşmesini tanımlayın.** Çekirdeğin hangi ortak davranışların sahibi olması gerektiğine karar verin: politika, geri dönüş, yapılandırma birleştirme, yaşam döngüsü, kanala yönelik anlamlar ve çalışma zamanı yardımcısının biçimi.
2. **Türü belirlenmiş plugin kayıt/çalışma zamanı yüzeylerini ekleyin.** `OpenClawPluginApi` ve/veya `api.runtime` öğesini, kullanışlı en küçük türü belirlenmiş yetenek yüzeyiyle genişletin.
3. **Çekirdeği ve kanal/özellik tüketicilerini bağlayın.** Kanallar ve özellik pluginleri, doğrudan bir sağlayıcı uygulamasını içe aktarmak yerine yeni yeteneği çekirdek üzerinden tüketmelidir.
4. **Sağlayıcı uygulamalarını kaydedin.** Ardından sağlayıcı pluginleri kendi arka uçlarını yeteneğe kaydeder.
5. **Sözleşme kapsamı ekleyin.** Sahiplik ve kayıt biçiminin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir sağlayıcının dünya görüşüne sabit kodlanmadan bu şekilde belirgin tercihlere sahip kalır. Somut bir dosya kontrol listesi ve ayrıntılı örnek için [Yetenek Tarifleri](/tr/plugins/adding-capabilities) sayfasına bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde uygulama genellikle şu yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt defteri bağlantıları
- özellik/kanal pluginlerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin çalışma zamanı sunumu
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin belgeleri

Bu yüzeylerden biri eksikse bu genellikle yeteneğin henüz tam olarak bütünleştirilmediğinin işaretidir.

### Yetenek şablonu

Asgari kalıp:

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

Sözleşme testi kalıbı (`src/plugins/contracts/registry.ts`, `providerContractPluginIds` gibi sahiplik aramalarını sunar; testler bir pluginin `contracts.videoGenerationProviders` listesinin gerçekten kaydettiği öğelerle eşleştiğini doğrular):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- yetenek sözleşmesinin ve orkestrasyonun sahibi çekirdektir
- sağlayıcı uygulamalarının sahibi sağlayıcı pluginleridir
- özellik/kanal pluginleri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel yetenek modeli ve biçimleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin geliştirme](/tr/plugins/building-plugins)
