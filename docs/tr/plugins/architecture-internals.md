---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırasını veya kayıt defteri durumunu hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisi iç yapıları: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisi iç yapıları
x-i18n:
    generated_at: "2026-04-26T11:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Genel yetenek modeli, Plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin architecture](/tr/plugins/architecture). Bu sayfa,
iç mekanizmaların başvurusudur: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları,
Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme işlem hattı

Başlangıçta OpenClaw kabaca şunu yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifest'lerini ve paket meta verilerini okur
3. güvensiz adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel bir yükleyici kullanır;
   derlenmemiş yerel Plugin'ler jiti kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komut/çalışma zamanı yüzeylerine açığa çıkarır

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi mevcutsa onu çözümler (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik geçitleri çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
girdi Plugin kökünden kaçtığında, yol dünya tarafından yazılabilir olduğunda veya
paketlenmemiş Plugin'ler için yol sahipliği şüpheli göründüğünde engellenir.

### Manifest öncelikli davranış

Manifest, kontrol düzlemi için doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills/yapılandırma şemasını veya bundle yeteneklerini keşfetmek
- `plugins.entries.<id>.config` doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Bu, kancalar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` veya `setupEntry`'nin yerini almazlar.
İlk canlı etkinleştirme tüketicileri artık manifest komut, kanal ve sağlayıcı ipuçlarını
daha geniş kayıt defteri gerçekleştiriminden önce Plugin yüklemeyi daraltmak için kullanır:

- CLI yüklemesi, istenen birincil komuta sahip Plugin'lere daralır
- kanal kurulumu/Plugin çözümlemesi, istenen
  kanal kimliğine sahip Plugin'lere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen
  sağlayıcı kimliğine sahip Plugin'lere daralır

Etkinleştirme planlayıcısı hem mevcut çağıranlar için yalnızca kimliklerden oluşan bir API hem de
yeni tanılama için bir plan API'si sunar. Plan girdileri, bir Plugin'in neden seçildiğini bildirir,
açık `activation.*` planlayıcı ipuçlarını
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hooks gibi manifest sahipliği geri dönüşlerinden ayırır. Bu neden ayrımı
uyumluluk sınırıdır: mevcut Plugin meta verileri çalışmaya devam ederken,
yeni kod çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını
veya geri dönüş davranışını algılayabilir.

Kurulum keşfi artık
`setup-api`'ye geri dönmeden önce aday Plugin'leri daraltmak için `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder; bu, kurulum zamanında çalışma zamanı kancalarına
hâlâ ihtiyaç duyan Plugin'ler içindir. Sağlayıcı kurulum listeleri, sağlayıcı çalışma zamanını yüklemeden
manifest `providerAuthChoices`, tanımlayıcıdan türetilmiş kurulum seçimleri ve kurulum-katalog meta verilerini kullanır.
Açık `setup.requiresRuntime: false`, yalnızca tanımlayıcıya ait bir kesme noktasıdır; atlanmış
`requiresRuntime`, uyumluluk için eski setup-api geri dönüşünü korur. Keşfedilen
birden fazla Plugin aynı normalize edilmiş kurulum sağlayıcısını veya CLI
arka uç kimliğini talep ederse, kurulum araması keşif sırasına güvenmek yerine belirsiz
sahibi reddeder. Kurulum çalışma zamanı yürütüldüğünde kayıt defteri tanılamaları,
eski Plugin'leri engellemeden `setup.providers` / `setup.cliBackends` ile
setup-api tarafından kaydedilen sağlayıcılar veya CLI arka uçları arasındaki kaymayı bildirir.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw, süreç içinde kısa ömürlü önbellekler tutar:

- keşif sonuçları
- manifest kayıt defteri verileri
- yüklenmiş Plugin kayıt defterleri

Bu önbellekler ani başlangıç yükünü ve tekrarlanan komut ek yükünü azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt defteri modeli

Yüklenmiş Plugin'ler rastgele çekirdek küresellerini doğrudan değiştirmez. Merkezi bir
Plugin kayıt defterine kayıt yaparlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılama)
- araçlar
- eski kancalar ve türlendirilmiş kancalar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin sahipli komutlar

Çekirdek özellikler daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden okur.
Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu çekirdek yüzeyin
yalnızca tek bir entegrasyon noktasına ihtiyacı olduğu anlamına gelir: "kayıt defterini oku",
"her Plugin modülü için özel durum yaz" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler bir onay çözüldüğünde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Bu Plugin + konuşma için artık bir bağlama mevcut.
        console.log(event.binding?.conversationId);
        return;
      }

      // İstek reddedildi; tüm yerel bekleyen durumu temizleyin.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağrı yük alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanmış istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Kimin bir konuşmayı bağlamasına izin verildiğini değiştirmez ve çekirdek onay işleme bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinin üç katmanı vardır:

- Ucuz ön çalışma zamanı araması için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski `discovery`) artı
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: auth, model çözümleme,
  akış sarmalama, düşünme düzeyleri, yeniden oynatma ilkesi ve kullanım uç noktalarını kapsayan 40+ isteğe bağlı kanca. Tam liste için
  [Kanca sırası ve kullanım] bölümüne bakın.

OpenClaw yine de genel aracı döngüsünün, geri dönüşün, transcript işlemenin ve
araç ilkesinin sahibidir. Bu kancalar, tümüyle özel bir çıkarım taşıması gerektirmeden
sağlayıcıya özgü davranışlar için genişletme yüzeyidir.

Sağlayıcının env tabanlı kimlik bilgileri varsa ve genel auth/durum/model seçici yollarının bunları sağlayıcı çalışma zamanını yüklemeden görmesi gerekiyorsa
manifest `setup.providers[].envVars` kullanın. Kullanımdan kaldırılmış `providerAuthEnvVars`,
kullanımdan kaldırma penceresi sırasında uyumluluk bağdaştırıcısı tarafından hâlâ okunur ve
bunu kullanan paketlenmemiş Plugin'ler bir manifest tanılaması alır. Bir sağlayıcı kimliğinin
başka bir sağlayıcı kimliğinin env değişkenlerini, auth profillerini,
config destekli auth'ını ve API anahtarı eşleştirme seçimini yeniden kullanması gerektiğinde manifest `providerAuthAliases` kullanın. Eşleştirme/auth-choice CLI yüzeylerinin sağlayıcının seçim kimliğini,
grup etiketlerini ve basit tek bayraklı auth kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde manifest
`providerAuthChoices` kullanın. Operatör odaklı ipuçları, örneğin eşleştirme etiketleri veya OAuth
istemci kimliği/istemci gizlisi kurulum değişkenleri için sağlayıcı çalışma zamanı
`envVars` kullanmaya devam edin.

Bir kanalın env güdümlü auth'ı veya kurulumu varsa ve genel kabuk-env geri dönüşü, config/durum denetimleri veya kurulum istemlerinin bunu kanal çalışma zamanını yüklemeden görmesi gerekiyorsa
manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanımı

Model/sağlayıcı Plugin'leri için OpenClaw kancaları kabaca şu sırayla çağırır.
"Ne zaman kullanılır" sütunu hızlı karar kılavuzudur.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayınlar                  | Sağlayıcı bir katalog veya temel URL varsayılanlarının sahibiyse                                                                               |
| 2   | `applyConfigDefaults`             | Yapılandırma gerçekleştirme sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular             | Varsayılanlar auth modu, env veya sağlayıcı model ailesi semantiğine bağlıysa                                                                  |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                       | _(bir Plugin kancası değildir)_                                                                                                                |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğinin sahibiyse                                                                  |
| 4   | `normalizeTransport`              | Genel model birleştirmesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir             | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibiyse                                               |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyuyorsa; paketli Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini burada arka durak olarak destekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanımı uyumluluk yeniden yazımlarını uygular                       | Sağlayıcı, uç nokta güdümlü yerel akış kullanımı meta verisi düzeltmelerine ihtiyaç duyuyorsa                                                 |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env-marker auth'ı çözümler            | Sağlayıcı, sağlayıcıya ait env-marker API anahtarı çözümlemesine sahipse; `amazon-bedrock` da burada yerleşik bir AWS env-marker çözümleyicisine sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/self-hosted veya config destekli auth'ı yüzeye çıkarır                     | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini bindirir; CLI/uygulama sahipli kimlik bilgileri için varsayılan `persistence` değeri `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme token'larını kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa; manifest içinde `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/config destekli auth'ın arkasına düşürür                       | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profilleri saklıyorsa                                                              |
| 11  | `resolveDynamicModel`             | Yerel kayıt defterinde henüz olmayan sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş sağlar       | Sağlayıcı rastgele yukarı akış model kimliklerini kabul ediyorsa                                                                               |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, sonra `resolveDynamicModel` yeniden çalışır                                           | Sağlayıcı bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyaç duyuyorsa                                                           |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenmiş modeli kullanmadan önce son yeniden yazımı yapar                               | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı var ama yine de çekirdek bir taşıma kullanıyorsa                                              |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları sağlar                     | Sağlayıcı, sağlayıcıyı devralmadan proxy taşımaları üzerinde kendi modellerini tanıyorsa                                                       |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcıya ait transcript/araçlama meta verileri           | Sağlayıcının transcript/sağlayıcı ailesi tuhaflıklarına ihtiyacı varsa                                                                         |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalleştirir                                               | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı varsa                                                                                     |
| 17  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcıya ait şema tanılamalarını yüzeye çıkarır                                    | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları istiyorsa                                                  |
| 18  | `resolveReasoningOutputMode`      | Yerel ile etiketlenmiş reasoning-output sözleşmesi arasında seçim yapar                                       | Sağlayıcının yerel alanlar yerine etiketlenmiş reasoning/final çıktıya ihtiyacı varsa                                                          |
| 19  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi yapar                         | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                      |
| 20  | `createStreamFn`                  | Normal akış yolunu tamamen özel bir taşımayla değiştirir                                                      | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir hat üstü protokole ihtiyacı varsa                                                      |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                   | Sağlayıcının özel bir taşıma olmadan istek başlıkları/gövde/model uyumluluk sarmalayıcılarına ihtiyacı varsa                                  |
| 22  | `resolveTransportTurnState`       | Yerel dönüş başına taşıma başlıkları veya meta veriler ekler                                                  | Sağlayıcı, genel taşımaların sağlayıcıya özgü yerel dönüş kimliği göndermesini istiyorsa                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum bekleme süresi politikasını ekler                                      | Sağlayıcı, genel WS taşımalarının oturum başlıklarını veya geri dönüş politikasını ayarlamasını istiyorsa                                     |
| 24  | `formatApiKey`                    | Auth profil biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesi olur                             | Sağlayıcı ek auth meta verileri saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                           |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı politikası için OAuth yenileme geçersiz kılması       | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                        |
| 26  | `buildAuthDoctorHint`             | OAuth yenileme başarısız olduğunda eklenen onarım ipucu                                                       | Sağlayıcının yenileme başarısızlığından sonra sağlayıcıya ait auth onarım rehberliğine ihtiyacı varsa                                         |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleştiricisi                                                        | Sağlayıcının, genel sezgilerin kaçıracağı ham taşma hataları varsa                                                                             |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait geri dönüş nedeni sınıflandırması                                                             | Sağlayıcı ham API/taşıma hatalarını oran sınırı/aşırı yük/vb. nedenlere eşleyebiliyorsa                                                       |
| 29  | `isCacheTtlEligible`              | Proxy/arka taşıma sağlayıcıları için istem önbelleği politikası                                               | Sağlayıcının proxy'ye özgü önbellek TTL geçitlemesine ihtiyacı varsa                                                                           |
| 30  | `buildMissingAuthMessage`         | Genel eksik auth kurtarma iletisinin yerine geçer                                                             | Sağlayıcının sağlayıcıya özgü eksik auth kurtarma ipucuna ihtiyacı varsa                                                                       |
| 31  | `suppressBuiltInModel`            | Eski yukarı akış model bastırması ve isteğe bağlı kullanıcıya dönük hata ipucu                                | Sağlayıcının eski yukarı akış satırlarını gizlemesi veya bunları satıcı ipucuyla değiştirmesi gerekiyorsa                                     |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları eklenir                                                       | Sağlayıcının `models list` ve seçiciler içinde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                            |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntü etiketleri ve varsayılan                                           | Sağlayıcı seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                         |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning geçiş uyumluluk kancası                                                                 | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                         |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk kancası                                                                   | Sağlayıcı `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                     |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                  | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesinin sahibiyse                                                                        |
| 37  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                        | Sağlayıcı canlı/smoke tercih edilen model eşleştirmesinin sahibiyse                                                                          |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token'ına/anahtarına dönüştürür | Sağlayıcının bir token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                    |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                        | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                               |
| 40  | `fetchUsageSnapshot`              | Auth çözüldükten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalleştirir           | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı varsa                                             |
| 41  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir embedding bağdaştırıcısı oluşturur                                      | Bellek embedding davranışı sağlayıcı Plugin'iyle birlikte yaşamalıdır                                                                        |
| 42  | `buildReplayPolicy`               | Sağlayıcı için transcript işlemeyi denetleyen bir yeniden oynatma ilkesi döndürür                              | Sağlayıcının özel transcript ilkesine ihtiyacı varsa (örneğin, düşünme bloklarını çıkarma)                                                  |
| 43  | `sanitizeReplayHistory`           | Genel transcript temizliğinden sonra yeniden oynatma geçmişini yeniden yazar                                   | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı varsa             |
| 44  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma dönüşü doğrulaması veya yeniden şekillendirmesi yapar          | Sağlayıcı taşımasının genel temizlemeden sonra daha katı dönüş doğrulamasına ihtiyacı varsa                                                  |
| 45  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                          | Bir model etkin hâle geldiğinde sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı varsa                                         |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini denetler, sonra model kimliğini veya taşıma/yapılandırmayı gerçekten değiştirene kadar
kanca destekli diğer sağlayıcı Plugin'lerine düşer. Bu,
çağıranın hangi paketli Plugin'in yeniden yazımın sahibi olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcı şimlerinin çalışmasını sağlar. Hiçbir sağlayıcı kancası desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa, paketli Google yapılandırma normalleştiricisi yine de
bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol'e veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir genişletme sınıfıdır. Bu kancalar, hâlâ OpenClaw'ın normal çıkarım döngüsü üzerinde çalışan sağlayıcı davranışları içindir.

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

Paketli sağlayıcı Plugin'leri, her satıcının katalog,
auth, düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uyacak şekilde yukarıdaki kancaları birleştirir. Yetkili kanca kümesi
her Plugin ile birlikte `extensions/` altında yaşar; bu sayfa,
listeyi yansıtmak yerine şekilleri örnekler.

<AccordionGroup>
  <Accordion title="Geçişli katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI; yukarı akış
    model kimliklerini OpenClaw'ın statik kataloğundan önce yüzeye çıkarabilmek için `catalog` artı
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai;
    token değişimi ve `/usage` entegrasyonunun sahibi olmak için
    `prepareRuntimeAuth` veya `formatApiKey` kancalarını `resolveUsageAuth` +
    `fetchUsageSnapshot` ile eşler.
  </Accordion>
  <Accordion title="Yeniden oynatma ve transcript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin'in
    temizlemeyi yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` aracılığıyla
    transcript ilkesine katılmasına izin verir.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü akış yardımcıları">
    Beta başlıkları, `/fast` / `serviceTier` ve `context1m`,
    genel SDK içinde değil, Anthropic Plugin'inin genel `api.ts` / `contract-api.ts` sınırında
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) yaşar.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler `api.runtime` aracılığıyla seçili çekirdek yardımcılarına erişebilir. TTS için:

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
- PCM ses arabelleği + örnekleme oranı döndürür. Plugin'ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Satıcıya ait ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkında seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefoni desteği sunuyor. Microsoft sunmuyor.

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

- TTS ilkesini, geri dönüşü ve yanıt teslimatını çekirdekte tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu
  yetenek sözleşmelerini ekledikçe bir satıcı Plugin'i metin, konuşma, görsel ve gelecekteki medya sağlayıcılarının sahibi olabilir.

Görsel/ses/video anlama için Plugin'ler, genel bir anahtar/değer torbası yerine
tek bir türlendirilmiş medya-anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal kablolamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Eklemeli genişleme türlendirilmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı kalıbı izler:
  - çekirdek yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya-anlama çalışma zamanı yardımcıları için Plugin'ler şunları çağırabilir:

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

Ses yazıya dökümü için Plugin'ler medya-anlama çalışma zamanını
veya eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME güvenilir biçimde çıkarılamadığında isteğe bağlı:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görsel/ses/video anlama için
  tercih edilen paylaşılan yüzeydir.
- Çekirdek medya-anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Hiçbir yazıya döküm çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` aracılığıyla arka plan alt aracı çalıştırmaları başlatabilir:

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
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için uygular.
- Plugin'e ait geri dönüş çalıştırmaları için operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile etkinleştirmesi gerekir.
- Güvenilir Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlandırmak için `plugins.entries.<id>.subagent.allowedModels` veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt aracı çalıştırmaları yine de çalışır, ancak geçersiz kılma istekleri sessizce geri dönmek yerine reddedilir.

Web araması için Plugin'ler, aracı araç kablolamasına
doğrudan girmek yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

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

Plugin'ler ayrıca
`api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, arama davranışına aracı araç sarmalayıcısına bağımlı olmadan ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görsel üretim sağlayıcı zincirini kullanarak bir görsel üretir.
- `listProviders(...)`: mevcut görsel üretim sağlayıcılarını ve yeteneklerini listeler.

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
- `auth`: gerekli. Normal gateway kimlik doğrulaması gerektirmek için `"gateway"` veya Plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediyse `true` döndürür.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Onun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` ardıl zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları otomatik olarak işlemci çalışma zamanı kapsamları almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak muhafazakârdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile eklenti rota çalışma zamanı kapsamlarını `operator.write` olarak sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca başlık açıkça mevcut olduğunda uygular
  - bu kimlik taşıyan eklenti rota isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı varsayılan olarak `operator.write` olur
- Pratik kural: gateway auth'lı bir eklenti rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yöneticiye özel davranış gerektiriyorsa, kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` başlık sözleşmesini belgelendirin.

## Plugin SDK içe aktarma yolları

Yeni plugin’ler yazarken tek parça `openclaw/plugin-sdk` kök
barreli yerine dar SDK alt yollarını kullanın. Temel alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt primitifleri                          |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/derleme yardımcıları                   |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşmesi |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal plugin’leri dar bağlantı yüzeylerinden oluşan bir aileden seçim yapar — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, birbiriyle alakasız
plugin alanları arasında karıştırmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal plugin’leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen `*-runtime` alt yolları altında bulunur
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` vb.).

<Info>
`openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır — eski
plugin’ler için bir uyumluluk katmanıdır. Yeni kod bunun yerine daha dar genel primitifleri içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketlenmiş plugin paket kökü başına):

- `index.js` — paketlenmiş plugin girişi
- `api.js` — yardımcı/tür barreli
- `runtime-api.js` — yalnızca çalışma zamanı barreli
- `setup-entry.js` — kurulum plugin girişi

Harici plugin’ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Asla
çekirdekten veya başka bir plugin’den bir başka plugin paketinin `src/*` yolunu içe aktarmayın.
Facade ile yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü
tercih eder; ardından diskte çözümlenen yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding`
ve `speech` gibi yetenek odaklı alt yollar, paketlenmiş plugin’ler bugün bunları kullandığı için vardır. Bunlar
otomatik olarak uzun vadede dondurulmuş harici sözleşmeler değildir — bunlara dayanırken ilgili SDK
referans sayfasını kontrol edin.

## Mesaj araç şemaları

Plugin’ler, tepkiler, okundu bilgileri ve anketler gibi mesaj dışı primitifler için
kanala özgü `describeMessageTool(...)` şema katkılarının sahibi olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine
genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri dönüş kuralları, sağlayıcı eşlemesi ve plugin yazarı kontrol listesi için
bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen plugin’ler, mesaj yetenekleri üzerinden neyi işleyebildiklerini bildirir:

- anlamsal sunum blokları için `presentation` (`text`, `context`, `divider`, `buttons`, `select`)
- sabitlenmiş teslimat istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak işleyip işlememeye veya metne indirgemeye karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış kapıları sunmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları, mevcut
üçüncü taraf plugin’ler için dışa aktarılmaya devam eder, ancak yeni plugin’ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal plugin’leri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden ana makineyi genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, dizin aramasından önce normalize edilmiş bir hedefin
  `direct`, `group` veya `channel` olarak değerlendirilip değerlendirilmeyeceğine karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin
  dizin araması yerine doğrudan kimlik benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden sonra veya
  dizin kaçırmasından sonra sağlayıcıya ait son bir çözümleme gerektirdiğinde plugin geri dönüş yoludur.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü
  oturum rotası oluşturmanın sahibidir.

Önerilen ayrım:

- Eşler/gruplar aranmeden önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "Bunu açık/yerel bir hedef kimliği olarak değerlendir" kontrolleri için `looksLikeId` kullanın.
- Geniş kapsamlı dizin araması için değil, sağlayıcıya özgü normalleştirme geri dönüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, konu kimlikleri, JID’ler, handle’lar ve oda kimlikleri gibi sağlayıcıya özgü kimlikleri
  genel SDK alanlarında değil `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten plugin’ler bu mantığı plugin içinde tutmalı
ve `openclaw/plugin-sdk/directory-runtime`
altındaki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanalın aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın:

- izin listesi odaklı DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulaması
- yineleme kaldırma/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalleştirmesi plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı plugin’leri, çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw’in `models.providers` içine yazdığı aynı şekli döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının
veya kimlik doğrulama korumalı model meta verilerinin sahibi olduğunda `catalog` kullanın.

`catalog.order`, bir plugin’in kataloğunun OpenClaw’in
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API anahtarı veya ortam odaklı sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisini sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra, son geçiş

Daha sonraki sağlayıcılar anahtar çakışmalarında kazanır; böylece plugin’ler aynı
sağlayıcı kimliğine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem de `discovery` kayıtlıysa, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa, `resolveAccount(...)` ile birlikte
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen
  somutlaştırıldığını varsayabilir ve gerekli sırlar eksikse hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  repair akışları gibi salt okunur komut yolları, yalnızca yapılandırmayı
  açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- Uygunsa aşağıdaki gibi kimlik bilgisi kaynak/durum alanlarını ekleyin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerlerini döndürmeniz gerekmez.
  Durum tarzı komutlar için `tokenStatus: "available"` döndürmek (ve eşleşen kaynak alanı)
  yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa
  `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmesi veya hesabı yapılandırılmamış olarak yanlış bildirmesi yerine
"yapılandırılmış ancak bu komut yolunda kullanılamıyor" durumunu raporlamasını sağlar.

## Paket paketleri

Bir plugin dizini, `openclaw.extensions` içeren bir `package.json` içerebilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir plugin’e dönüşür. Paket birden çok extension listeliyorsa, plugin kimliği
`name/<fileBase>` olur.

Plugin’iniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir olacak şekilde
bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik korkuluğu: Her `openclaw.extensions` girdisi, sembolik bağlantı çözümlemesinden sonra
plugin dizini içinde kalmalıdır. Paket dizininden çıkan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, plugin bağımlılıklarını
proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok,
çalışma zamanında geliştirme bağımlılıkları yoktur) ve devralınan genel npm kurulum ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "saf JS/TS" olarak tutun ve
`postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü gösterebilir.
OpenClaw, devre dışı bir kanal plugin’i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal plugin’i etkin ancak hâlâ yapılandırılmamış olduğunda, tam plugin girişi yerine
`setupEntry` yükler. Bu, ana plugin girişiniz araçlar, kancalar veya diğer yalnızca çalışma zamanı
kodlarını da bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
bir kanal plugin’ini, kanal zaten yapılandırılmış olsa bile ağ geçidinin
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, ağ geçidi dinlemeye başlamadan önce mevcut olması gereken
başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girdisinin
başlangıcın bağlı olduğu kanala ait her yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- ağ geçidi dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere sırasında var olması gereken tüm ağ geçidi yöntemleri, araçlar veya hizmetler

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğinin sahibiyse bu bayrağı etkinleştirmeyin.
Plugin’i varsayılan davranışta bırakın ve OpenClaw’in başlangıç sırasında
tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca, çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcılarını da yayımlayabilir. Geçerli kurulum
yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek bu yüzeyi, tam plugin girişini yüklemeden eski bir tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde kullanır.
Matrix mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama adaptörleri, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi modül içe aktarmada paketlenmiş kanal başlangıcına yeniden girmek yerine
yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri ağ geçidi RPC yöntemlerini içerdiğinde, bunları
plugin’e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve
bir plugin daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

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

Kanal plugin’leri, `openclaw.channel` üzerinden kurulum/keşif meta verileri ve
`openclaw.install` üzerinden kurulum ipuçları duyurabilir. Bu, çekirdek katalog verilerini verisiz tutar.

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
      "blurb": "Nextcloud Talk Webhook botları aracılığıyla self-hosted sohbet.",
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
- `docsLabel`: dokümantasyon bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin geride bırakması gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi metni denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown uyumlu olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı dokümantasyon gezinme yüzeyleri için iç/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için eski takma adlar hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlamasını zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: anons hedefleri çözülürken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir MPM
kayıt defteri dışa aktarımı). Aşağıdaki konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı,
`"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulmuş kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri, ham `openclaw.install` bloğunun
yanında normalleştirilmiş kurulum kaynağı bilgilerini de sunar. Bu
normalleştirilmiş bilgiler, npm spesifikasyonunun tam bir sürüm mü yoksa kayan bir
seçici mi olduğunu, beklenen bütünlük meta verisinin mevcut olup olmadığını ve
yerel bir kaynak yolunun da bulunup bulunmadığını belirtir. Katalog/paket kimliği biliniyorsa,
normalleştirilmiş bilgiler ayrıştırılan npm paket adının bu kimlikten sapması durumunda uyarır.
Ayrıca `defaultChoice` geçersizse veya mevcut olmayan bir kaynağa işaret ediyorsa ve geçerli bir npm
kaynağı olmadan npm bütünlük meta verisi mevcutsa da uyarır. Tüketiciler `installSource` alanını
eklemeli ve isteğe bağlı bir alan olarak değerlendirmelidir; böylece elle oluşturulmuş girdiler ve katalog
uyumluluk katmanları bunu sentezlemek zorunda kalmaz.
Bu sayede onboarding ve tanılama, plugin çalışma zamanını içe aktarmadan kaynak düzlemi durumunu
açıklayabilir.

Resmî harici npm girdileri, tercihen tam bir `npmSpec` ile birlikte
`expectedIntegrity` kullanmalıdır. Yalın paket adları ve dist-tag’ler uyumluluk için hâlâ çalışır,
ancak kaynak düzlemi uyarıları gösterir; böylece katalog mevcut plugin’leri bozmadan
sabitlenmiş, bütünlüğü doğrulanmış kurulumlara doğru ilerleyebilir.
Onboarding yerel bir katalog yolundan kurulum yaptığında, mümkün olduğunda
`source: "path"` ve çalışma alanına göreli bir
`sourcePath` ile yönetilen bir plugin dizin girdisi kaydeder. Mutlak işletimsel yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu
yollarını uzun ömürlü yapılandırmaya kopyalamaktan kaçınır. Bu, yerel geliştirme kurulumlarını
ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamalarında görünür tutar.
Kalıcı `plugins/installs.json` plugin dizini, kurulum kaynağının doğruluk kaynağıdır ve
plugin çalışma zamanı modülleri yüklenmeden yenilenebilir.
Buradaki `installRecords` eşlemesi, bir plugin bildirimi eksik veya
geçersiz olduğunda bile kalıcıdır; `plugins` dizisi ise yeniden oluşturulabilir bir bildirim/önbellek görünümüdür.

## Bağlam motoru plugin’leri

Bağlam motoru plugin’leri, alma, birleştirme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları plugin’inizden
`api.registerContextEngine(id, factory)` ile kaydedin, sonra etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin’inizin yalnızca bellek araması veya kancalar eklemek yerine varsayılan bağlam
iş hattını değiştirmesi ya da genişletmesi gerektiğinde kullanın.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça devredin:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

Bir plugin mevcut API’ye uymayan bir davranışa ihtiyaç duyduğunda, özel bir iç erişimle
plugin sistemini baypas etmeyin. Eksik yeteneği ekleyin.

Önerilen sıra:

1. temel sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanal tarafı semantiği ve çalışma zamanı yardımcı şekli.
2. türlendirilmiş plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` alanını en küçük yararlı
   türlendirilmiş yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanal ve özellik plugin’leri yeni yeteneği satıcı uygulamasını doğrudan içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Ardından satıcı plugin’leri arka uçlarını bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw bu şekilde görüş sahibi kalır ama tek bir
sağlayıcının dünya görüşüne sabit kodlanmış hâle gelmez. Somut bir dosya denetim listesi ve
işlenmiş örnek için [Yetenek Yemek Kitabı](/tr/plugins/architecture) sayfasına bakın.

### Yetenek denetim listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt defteri bağlantısı
- özellik/kanal plugin’lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin dokümantasyonu

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin henüz tam olarak
entegre edilmediğinin bir işaretidir.

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

// feature/channel plugin'leri için paylaşılan çalışma zamanı yardımcısı
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Robotun laboratuvarda yürüdüğünü göster.",
  cfg,
});
```

Sözleşme testi deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesi + orkestrasyonun sahibidir
- satıcı plugin’leri satıcı uygulamalarının sahibidir
- özellik/kanal plugin’leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel yetenek modeli ve şekilleri
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
