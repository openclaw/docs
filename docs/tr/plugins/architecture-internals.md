---
read_when:
    - Sağlayıcı çalışma zamanı hook'larını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırasını veya kayıt defteri durumunu hata ayıklama
    - Yeni bir plugin yeteneği veya bağlam motoru plugin'i ekleme
summary: 'Plugin mimarisi iç yapısı: yükleme hattı, kayıt defteri, çalışma zamanı hook''ları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisi iç yapısı
x-i18n:
    generated_at: "2026-04-24T09:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Genel yetenek modeli, plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin architecture](/tr/plugins/architecture). Bu sayfa
iç mekaniklerin başvurusudur: yükleme hattı, kayıt defteri, çalışma zamanı hook'ları,
Gateway HTTP rotaları, import yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifest'lerini ve package meta verilerini okur
3. güvensiz adayları reddeder
4. plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel bir loader kullanır;
   derlenmemiş yerel plugin'ler jiti kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları plugin kayıt defterinde toplar
8. kayıt defterini komut/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — loader mevcut olanı çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli plugin'ler `register` kullanır; yeni plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
giriş plugin kökünden kaçtığında, yol world-writable olduğunda veya
paketli olmayan plugin'ler için yol sahipliği şüpheli göründüğünde engellenir.

### Önce manifest davranışı

Manifest, control plane doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- plugin'i tanımlamak
- bildirilen kanalları/Skills'i/config şemasını veya bundle yeteneklerini keşfetmek
- `plugins.entries.<id>.config` alanını doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Hook'lar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları control plane üzerinde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` veya `setupEntry`'nin yerini almazlar.
İlk canlı etkinleştirme tüketicileri artık manifest komutu, kanal ve sağlayıcı ipuçlarını
daha geniş kayıt defteri somutlaştırmasından önce plugin yüklemeyi daraltmak için kullanır:

- CLI yükleme, istenen birincil komuta sahip plugin'lere daralır
- kanal kurulumu/plugin çözümlemesi, istenen
  kanal kimliğine sahip plugin'lere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen
  sağlayıcı kimliğine sahip plugin'lere daralır

Etkinleştirme planlayıcısı hem mevcut çağıranlar için yalnızca kimliklerden oluşan bir API hem de yeni tanılamalar için bir
plan API'si açığa çıkarır. Plan girdileri, bir plugin'in neden seçildiğini bildirir ve açık `activation.*` planlayıcı ipuçlarını
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve hook'lar gibi manifest sahipliği fallback'lerinden ayırır. Bu neden ayrımı
uyumluluk sınırıdır: mevcut plugin meta verileri çalışmaya devam ederken,
yeni kodlar çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını
veya fallback davranışını saptayabilir.

Kurulum keşfi artık aday plugin'leri daraltmak için
`setup.providers` ve `setup.cliBackends` gibi descriptor'a ait kimlikleri tercih eder, ancak kurulum zamanı çalışma zamanı hook'larına hâlâ ihtiyaç duyan plugin'ler için
`setup-api`'ye fallback yapar. Keşfedilen birden fazla plugin aynı normalize edilmiş kurulum sağlayıcısını veya CLI backend
kimliğini talep ederse, kurulum araması keşif
sırasına güvenmek yerine belirsiz sahibi reddeder.

### Loader'ın önbelleğe aldıkları

OpenClaw süreç içinde kısa ömürlü önbellekler tutar:

- discovery sonuçları
- manifest kayıt defteri verileri
- yüklenmiş plugin kayıt defterleri

Bu önbellekler patlamalı başlangıçları ve tekrarlanan komut yükünü azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt defteri modeli

Yüklenmiş plugin'ler rastgele çekirdek global'lerini doğrudan değiştirmez. Bunun yerine
merkezi bir plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- plugin kayıtları (kimlik, kaynak, origin, durum, tanılamalar)
- araçlar
- eski hook'lar ve türlenmiş hook'lar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI kayıtçıları
- arka plan servisleri
- plugin'e ait komutlar

Çekirdek özellikler daha sonra plugin modülleriyle doğrudan konuşmak yerine bu kayıt defterinden okur.
Bu, yüklemeyi tek yönlü tutar:

- plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım bakım kolaylığı için önemlidir. Çekirdek yüzeylerin çoğunun yalnızca bir entegrasyon noktasına ihtiyaç duyması anlamına gelir:
"her plugin modülünü özel durum yapmak" değil, "kayıt defterini oku".

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için `api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Bu plugin + konuşma için artık bir bağlama var.
        console.log(event.binding?.conversationId);
        return;
      }

      // İstek reddedildi; yerel bekleyen durumu temizle.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağrı payload alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanmış istekler için çözülmüş bağlama
- `request`: özgün istek özeti, detach ipucu, sender kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim içindir. Kimlerin bir konuşmayı bağlamasına izin verildiğini değiştirmez
ve çekirdek onay işlemesi bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı hook'ları

Sağlayıcı plugin'lerinin üç katmanı vardır:

- Ucuz çalışma zamanı öncesi arama için **Manifest meta verileri**: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı hook'ları**: `catalog` (eski adıyla `discovery`) artı
  `applyConfigDefaults`.
- **Çalışma zamanı hook'ları**: auth, model çözümleme,
  akış sarma, düşünme düzeyleri, yeniden oynatma ilkesi ve kullanım uç noktalarını kapsayan 40+ isteğe bağlı hook. Tam liste için
  [Hook order and usage](#hook-order-and-usage) bölümüne bakın.

OpenClaw yine de genel agent döngüsünün, failover'ın, döküm işlemenin ve
araç ilkesinin sahibidir. Bu hook'lar, tümüyle özel bir çıkarım taşıması gerektirmeden
sağlayıcıya özgü davranış için extension yüzeyidir.

Sağlayıcının, genel auth/status/model-picker yollarının
sağlayıcı çalışma zamanını yüklemeden görmesi gereken env tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın. Bir sağlayıcı kimliği başka bir sağlayıcı kimliğinin env değişkenlerini, auth profillerini, config destekli auth'unu ve API anahtarı onboarding seçimini yeniden kullanacaksa manifest `providerAuthAliases` kullanın. Onboarding/auth-choice
CLI yüzeylerinin sağlayıcının seçim kimliğini, grup etiketlerini ve basit
tek bayraklı auth kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı
`envVars` alanını operatöre dönük onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi ipuçları için koruyun.

Bir kanalın, genel shell-env fallback, config/status denetimleri veya kurulum istemlerinin
kanal çalışma zamanını yüklemeden görmesi gereken env tabanlı auth veya kurulumu varsa manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanım

Model/sağlayıcı plugin'leri için OpenClaw hook'ları kabaca şu sırayla çağırır.
"When to use" sütunu hızlı karar kılavuzudur.

| #   | Hook                              | Ne yapar                                                                                                       | Ne zaman kullanılmalı                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                 | Sağlayıcı bir kataloğa veya `baseUrl` varsayılanlarına sahipse                                                                                 |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar auth moduna, env'ye veya sağlayıcı model ailesi semantiğine bağlıysa                                                             |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal registry/catalog yolunu dener                                                            | _(plugin hook'u değil)_                                                                                                                         |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                  | Sağlayıcı, kanonik model çözümlemeden önce takma ad temizliğinin sahibi ise                                                                    |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalize eder           | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibi ise                                               |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemeden önce `models.providers.<id>` alanını normalize eder                     | Sağlayıcının plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı varsa; paketli Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini burada destekler |
| 6   | `applyNativeStreamingUsageCompat` | Yerel akış kullanım uyumluluğu yeniden yazımlarını config sağlayıcılarına uygular                             | Sağlayıcının uç nokta kaynaklı yerel akış kullanım meta verisi düzeltmelerine ihtiyacı varsa                                                   |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemeden önce config sağlayıcıları için env-marker auth'u çözer                         | Sağlayıcının, sağlayıcıya ait env-marker API anahtarı çözümlemesine ihtiyacı varsa; `amazon-bedrock` da burada yerleşik bir AWS env-marker çözücüsüne sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/self-hosted veya config destekli auth'u yüzeye çıkarır                     | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretleyicisi ile çalışabiliyorsa                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini bindirir; CLI/app sahipli kimlik bilgileri için varsayılan `persistence` değeri `runtime-only`'dir | Sağlayıcı, kopyalanmış yenileme token'larını kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa; manifest'te `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/config destekli auth'un arkasına düşürür                       | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                                |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde olmayan sağlayıcıya ait model kimlikleri için eşzamanlı fallback                | Sağlayıcı, üst akıştan gelen keyfi model kimliklerini kabul ediyorsa                                                                           |
| 12  | `prepareDynamicModel`             | Asenkron ısınma yapar, sonra `resolveDynamicModel` yeniden çalışır                                            | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı varsa                                                           |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözülmüş modeli kullanmadan önce son yeniden yazımı yapar                                  | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı varsa ama yine de çekirdek bir taşıma kullanıyorsa                                            |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları sağlar                     | Sağlayıcı, sağlayıcıyı devralmadan proxy taşımalardaki kendi modellerini tanıyorsa                                                             |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcıya ait döküm/araç meta verileri                     | Sağlayıcının döküm/sağlayıcı ailesi tuhaflıklarına ihtiyacı varsa                                                                               |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı bunları görmeden önce araç şemalarını normalize eder                                       | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı varsa                                                                                      |
| 17  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcıya ait şema tanılamalarını yüzeye çıkarır                                   | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar kelime uyarıları istiyorsa                                                   |
| 18  | `resolveReasoningOutputMode`      | Yerel ile etiketli reasoning-output sözleşmesi arasında seçim yapar                                          | Sağlayıcı, yerel alanlar yerine etiketli reasoning/final output istiyorsa                                                                       |
| 19  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalize etme                                 | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                       |
| 20  | `createStreamFn`                  | Normal akış yolunu tamamen özel bir taşıma ile değiştirir                                                     | Sağlayıcının yalnızca sarmalayıcı değil, özel bir wire protocol'e ihtiyacı varsa                                                               |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                   | Sağlayıcının özel taşıma olmadan istek başlıkları/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyacı varsa                                   |
| 22  | `resolveTransportTurnState`       | Yerel tur başına taşıma başlıkları veya meta verileri ekler                                                   | Sağlayıcı, genel taşımaların sağlayıcıya özgü yerel tur kimliği göndermesini istiyorsa                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum cooldown ilkesi ekler                                                  | Sağlayıcı, genel WS taşımalarının oturum başlıklarını veya fallback ilkesini ayarlamasını istiyorsa                                            |
| 24  | `formatApiKey`                    | Auth-profile biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` string'i olur                         | Sağlayıcı ek auth meta verileri saklıyor ve özel çalışma zamanı token biçimine ihtiyaç duyuyorsa                                                |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme-hatası ilkesi için OAuth yenileme geçersiz kılması                   | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                         |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenecek onarım ipucu                                                  | Sağlayıcının yenileme hatasından sonra sağlayıcıya ait auth onarım rehberliğine ihtiyacı varsa                                                 |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi aşımı eşleştiricisi                                                          | Sağlayıcının, genel sezgilerin kaçıracağı ham aşım hataları varsa                                                                               |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması                                                               | Sağlayıcı, ham API/taşıma hatalarını rate-limit/overload/vb. olarak eşleyebiliyorsa                                                            |
| 29  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için prompt-cache ilkesi                                                         | Sağlayıcının proxy'ye özgü önbellek TTL geçitlemesine ihtiyacı varsa                                                                            |
| 30  | `buildMissingAuthMessage`         | Genel eksik auth kurtarma mesajının yerine geçer                                                              | Sağlayıcının sağlayıcıya özgü eksik auth kurtarma ipucuna ihtiyacı varsa                                                                        |
| 31  | `suppressBuiltInModel`            | Eski üst akış model bastırma ve isteğe bağlı kullanıcıya dönük hata ipucu                                     | Sağlayıcının eski üst akış satırlarını gizlemesi veya bunları satıcı ipucuyla değiştirmesi gerekiyorsa                                         |
| 32  | `augmentModelCatalog`             | Discovery sonrası sentetik/nihai katalog satırları ekler                                                      | Sağlayıcının `models list` ve seçiciler içinde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                             |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görünen etiketler ve varsayılan                                           | Sağlayıcı seçili modeller için özel düşünme basamağı veya ikili etiket sunuyorsa                                                               |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning toggle uyumluluk hook'u                                                                 | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                          |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk hook'u                                                                    | Sağlayıcı `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk hook'u                                                                   | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesinin sahibiyse                                                                         |
| 37  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                        | Sağlayıcı canlı/smoke tercihli model eşleştirmesinin sahibiyse                                                                                |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token'ına/anahtarına dönüştürür | Sağlayıcının token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                          |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözer                         | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                                 |
| 40  | `fetchUsageSnapshot`              | Auth çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini alır ve normalize eder          | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya payload ayrıştırıcısına ihtiyacı varsa                                           |
| 41  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir embedding bağdaştırıcısı oluşturur                                      | Bellek embedding davranışı sağlayıcı plugin'i ile birlikte yaşamalıysa                                                                         |
| 42  | `buildReplayPolicy`               | Sağlayıcı için döküm işlemeyi denetleyen bir yeniden oynatma ilkesi döndürür                                  | Sağlayıcının özel döküm ilkesine ihtiyacı varsa (örneğin düşünme bloğu sıyırma)                                                               |
| 43  | `sanitizeReplayHistory`           | Genel döküm temizliğinden sonra yeniden oynatma geçmişini yeniden yazar                                       | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı varsa               |
| 44  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulaması veya yeniden şekillendirme                    | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı varsa                                                     |
| 45  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                          | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı varsa                                                 |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı plugin'ini kontrol eder, sonra model kimliğini veya taşıma/yapılandırmayı gerçekten değiştirene kadar hook yetenekli diğer sağlayıcı plugin'lerine düşer. Bu, alias/uyumluluk sağlayıcı shim'lerinin çalışmasını sağlar; çağıranın hangi
paketli plugin'in yeniden yazımın sahibi olduğunu bilmesini gerektirmez. Hiçbir sağlayıcı hook'u desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa, paketli Google yapılandırma normalleştiricisi yine de o uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir wire protocol'e veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir extension sınıfıdır. Bu hook'lar, yine de OpenClaw'ın normal çıkarım döngüsü üzerinde çalışan sağlayıcı davranışları içindir.

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

Paketli sağlayıcı plugin'leri, her satıcının katalog,
auth, düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uyması için yukarıdaki hook'ları birleştirir. Yetkili hook kümesi
`extensions/` altında her plugin ile birlikte yaşar; bu sayfa
listeyi aynalamaktan çok şekilleri göstermektedir.

<AccordionGroup>
  <Accordion title="Pass-through catalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI; üst akış
    model kimliklerini OpenClaw'ın statik kataloğundan önce yüzeye çıkarabilmek için `catalog` ile birlikte
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai;
    token değişimini ve `/usage` entegrasyonunu sahiplenmek için `prepareRuntimeAuth` veya `formatApiKey` ile birlikte
    `resolveUsageAuth` +
    `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Yeniden oynatma ve döküm temizleme aileleri">
    Paylaşılan adlı aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) sağlayıcıların
    her plugin'in temizlemeyi yeniden uygulaması yerine `buildReplayPolicy` üzerinden
    döküm ilkesine dahil olmasına izin verir.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsüne biner.
  </Accordion>
  <Accordion title="Anthropic'e özgü akış yardımcıları">
    Beta header'ları, `/fast` / `serviceTier` ve `context1m`,
    genel SDK yerine Anthropic plugin'inin genel `api.ts` / `contract-api.ts` seam'i içinde
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) yaşar.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin'ler, `api.runtime` üzerinden seçili çekirdek yardımcılarına erişebilir. TTS için:

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

- `textToSpeech`, dosya/voice-note yüzeyleri için normal çekirdek TTS çıktı payload'unu döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme oranı döndürür. Plugin'ler bunu sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için dil, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- Telefon desteği bugün OpenAI ve ElevenLabs'ta vardır. Microsoft'ta yoktur.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` ile speech sağlayıcıları kaydedebilir.

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

- TTS ilkesini, fallback'i ve yanıt teslimini çekirdekte tutun.
- Satıcıya ait sentez davranışı için speech sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: bir satıcı plugin'i,
  OpenClaw bu yetenek sözleşmelerini ekledikçe metin, speech, image ve gelecekteki medya sağlayıcılarının sahibi olabilir.

Image/audio/video anlama için plugin'ler, genel key/value çantası yerine
bir türlenmiş medya anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, fallback'i, yapılandırmayı ve kanal kablolamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı plugin'inde tutun.
- Eklemeli genişleme türlenmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya anlama çalışma zamanı yardımcıları için plugin'ler şunları çağırabilir:

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

Ses transkripsiyonu için plugin'ler medya anlama çalışma zamanını
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

- `api.runtime.mediaUnderstanding.*`, image/audio/video anlama için tercih edilen paylaşılan yüzeydir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Hiç transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan alt agent çalıştırmaları da başlatabilir:

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
- Plugin'e ait fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile açık onay vermelidir.
- Güvenilir plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen plugin alt agent çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri sessizce fallback yapmak yerine reddedilir.

Web araması için plugin'ler, agent araç kablolamasına
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
`api.registerWebSearchProvider(...)` ile web-search sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web-search sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, arama davranışına agent araç sarmalayıcısına bağımlı olmadan ihtiyaç duyan özellik/kanal plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü üretimi sağlayıcı zincirini kullanarak görüntü üretir.
- `listProviders(...)`: kullanılabilir görüntü üretimi sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP rotaları

Plugin'ler, `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

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
- `auth`: gerekli. Normal Gateway auth gerektirmek için `"gateway"` veya plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürmelidir.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` alanını açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir plugin başka bir plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları otomatik olarak operatör çalışma zamanı kapsamları almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam bilerek korumacıdır:
  - paylaşılan gizli anahtar bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile plugin-route çalışma zamanı kapsamlarını `operator.write` değerine sabit tutar
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel girişte `gateway.auth.mode = "none"`), `x-openclaw-scopes` alanını yalnızca başlık açıkça mevcutsa dikkate alır
  - bu kimlik taşıyan plugin-route isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri düşer
- Pratik kural: Gateway auth'lu bir plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yöneticiye özel davranış gerektiriyorsa kimlik taşıyan bir auth modu zorunlu kılın ve açık `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK import yolları

Yeni plugin'ler yazarken tek parça `openclaw/plugin-sdk` kök
barrel'ı yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

| Alt yol                              | Amaç                                               |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Plugin kayıt ilkel öğeleri                         |
| `openclaw/plugin-sdk/channel-core`   | Kanal giriş/derleme yardımcıları                   |
| `openclaw/plugin-sdk/core`           | Genel paylaşılan yardımcılar ve şemsiye sözleşme   |
| `openclaw/plugin-sdk/config-schema`  | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal plugin'leri dar seam ailesinden seçim yapar — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı ilgisiz
plugin alanlarına dağılmak yerine tek bir `approvalCapability` sözleşmesinde birleştirilmelidir.
Bkz. [Channel plugins](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları eşleşen `*-runtime` alt yollarında yaşar
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` vb.).

<Info>
`openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır — eski plugin'ler
için bir uyumluluk shim'idir. Yeni kod bunun yerine daha dar genel ilkel öğeleri içe aktarmalıdır.
</Info>

Repo içi giriş noktaları (paketli plugin package kökü başına):

- `index.js` — paketli plugin girişi
- `api.js` — yardımcı/tür barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum plugin girişi

Harici plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir plugin'den
başka bir plugin package'ının `src/*` alanını asla içe aktarmayın.
Facade ile yüklenen giriş noktaları varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü, yoksa diskteki çözülmüş yapılandırma dosyasını tercih eder.

`image-generation`, `media-understanding`
ve `speech` gibi yeteneğe özgü alt yollar bugün paketli plugin'ler tarafından kullanıldığı için vardır. Bunlar
otomatik olarak uzun vadede donmuş harici sözleşmeler değildir — bunlara dayanırken ilgili SDK
başvuru sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler, tepkiler, okumalar ve anketler gibi mesaj olmayan ilkel öğeler için
kanala özgü `describeMessageTool(...)` şema katkılarının sahibi olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları
yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, fallback kuralları, sağlayıcı eşlemesi ve plugin yazar kontrol listesi için
bkz. [Message Presentation](/tr/plugins/message-presentation).

Gönderim yapabilen plugin'ler neyi işleyebildiklerini mesaj yetenekleriyle bildirir:

- anlamsal sunum blokları için `presentation` (`text`, `context`, `divider`, `buttons`, `select`)
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak mı işleyeceğine yoksa metne mi düşüreceğine karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış kapıları açmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut
üçüncü taraf plugin'ler için dışa aktarılmaya devam eder, ancak yeni plugin'ler bunları kullanmamalıdır.

## Kanal hedefi çözümleme

Kanal plugin'leri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden host'u genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak mı ele alınacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin
  dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlayıp atlamayacağını çekirdeğe söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden veya dizin ıskasından sonra son bir sağlayıcıya ait çözümlemeye ihtiyaç duyduğunda kullandığı plugin fallback'idir.
- `messaging.resolveOutboundSessionRoute(...)`, hedef çözümlendikten sonra sağlayıcıya özgü oturum rota oluşturmanın sahibidir.

Önerilen ayrım:

- Eşler/gruplar aranmasından önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "Bunu açık/yerel hedef kimliği olarak ele al" denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme fallback'i için `resolveTarget` kullanın.
- Sohbet kimlikleri, thread kimlikleri, JID'ler, handle'lar ve oda
  kimlikleri gibi sağlayıcıya özgü yerel kimlikleri genel SDK alanlarında değil `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten plugin'ler bu mantığı
plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, kanalın yapılandırma destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın; örneğin:

- allowlist güdümlü DM eşleri
- yapılandırılmış kanal/grup map'leri
- hesap kapsamlı statik dizin fallback'leri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalleştirmesi
plugin uygulaması içinde kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı plugin'leri çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığı ile aynı şekli döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden fazla sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerinin, `baseUrl`
varsayılanlarının veya auth kapılı model meta verilerinin sahibi olduğunda `catalog` kullanın.

`catalog.order`, bir plugin'in kataloğunun OpenClaw'ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env güdümlü sağlayıcılar
- `profile`: auth profilleri olduğunda görünen sağlayıcılar
- `paired`: birden fazla ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece plugin'ler aynı sağlayıcı kimliğine sahip yerleşik bir sağlayıcı girdisini bilerek geçersiz kılabilir.

Uyumluluk:

- `discovery`, eski takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kaydedilmişse OpenClaw `catalog` kullanır

## Salt okunur kanal inceleme

Plugin'iniz bir kanal kaydediyorsa
`resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli secret'lar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yapılandırmayı tanımlamak için çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca betimleyici hesap durumunu döndürün.
- `enabled` ve `configured` alanlarını koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durum alanlarını dahil edin; örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerleri döndürmeniz gerekmez. Status tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak alanı) yeterlidir.
- Bir kimlik bilgisi SecretRef üzerinden yapılandırılmış ama
  geçerli komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı yapılandırılmamış diye yanlış bildirmek veya çökmek yerine
"bu komut yolunda yapılandırılmış ama kullanılamıyor" demesini sağlar.

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

Her girdi bir plugin olur. Paket birden fazla extension listeliyorsa plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa o dizine bunları kurun; böylece
`node_modules` kullanılabilir olur (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi sembolik bağ çözümlemesinden sonra plugin
dizini içinde kalmalıdır. Package dizininden kaçan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirme bağımlılıkları yok). Plugin bağımlılık
ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü gösterebilir.
OpenClaw, devre dışı bir kanal plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal plugin'i etkin olup hâlâ yapılandırılmamışsa tam plugin girişi yerine `setupEntry`
yükler. Bu, ana plugin girişiniz araçları, hook'ları veya diğer yalnızca çalışma zamanı
kodlarını da kabloladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile bir kanal plugin'ini Gateway'in
listen öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce var olması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Uygulamada bu,
setup entry'nin başlangıcın bağımlı olduğu her kanal sahipli yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere sırasında var olması gereken tüm Gateway yöntemleri, araçlar veya servisler

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğinin sahibiyse
bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta bırakın ve başlangıç sırasında
OpenClaw'ın tam girişi yüklemesine izin verin.

Paketli kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları da yayımlayabilir. Geçerli kurulum
promotion yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam plugin girişini yüklemeden eski bir tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` biçimine terfi ettirmesi gerektiğinde bu yüzeyi kullanır.
Matrix mevcut paketli örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış terfi ettirilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış, kanonik olmayan varsayılan hesap anahtarını koruyabilir.

Bu setup patch bağdaştırıcıları, paketli sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; promotion yüzeyi modül içe aktarması sırasında paketli kanal başlangıcına
yeniden girmek yerine ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemleri içerdiğinde bunları
plugin'e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin
daha dar bir kapsam istese bile her zaman `operator.admin` çözümlemesine gider.

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

Kanal plugin'leri, `openclaw.channel` üzerinden kurulum/discovery meta verileri ve
`openclaw.install` üzerinden kurulum ipuçları duyurabilir. Bu, çekirdek kataloğu verisiz tutar.

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
      "blurb": "Nextcloud Talk Webhook botları üzerinden self-hosted sohbet.",
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
- `docsLabel`: belgeler bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin geride bırakması gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: kanalı giden biçimlendirme kararları için markdown yetenekli olarak işaretler
- `exposure.configured`: `false` olduğunda kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olduğunda kanalı etkileşimli setup/configure seçicilerinden gizler
- `exposure.docs`: kanalı docs gezinme yüzeyleri için dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için eski takma adlar hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlamasını zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözülürken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
kayıt defteri dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
şu yapıda olmalıdır:
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Ayrıştırıcı ayrıca `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` da kabul eder.

Üretilmiş kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalize edilmiş kurulum kaynağı gerçeklerini açığa çıkarır. Bu
normalize edilmiş gerçekler npm spec'inin tam sürüm mü yoksa kayan bir seçici mi olduğunu,
beklenen bütünlük meta verisinin mevcut olup olmadığını ve yerel kaynak yolunun da
mevcut olup olmadığını belirtir. Tüketiciler `installSource` alanını eklemeli isteğe bağlı bir alan olarak değerlendirmelidir; böylece eski elle oluşturulmuş girdiler ve uyumluluk shim'leri bunu sentezlemek zorunda kalmaz.
Bu, onboarding ve tanılamaların plugin çalışma zamanını içe aktarmadan
kaynak düzlemi durumunu açıklamasını sağlar.

Resmi harici npm girdileri,
tercihen tam bir `npmSpec` artı `expectedIntegrity` kullanmalıdır.
Çıplak package adları ve dist-tag'ler uyumluluk için hâlâ çalışır, ancak
katalogun mevcut plugin'leri bozmadan sabitlenmiş, bütünlük denetimli kurulumlara doğru ilerleyebilmesi için kaynak düzlemi uyarılarını yüzeye çıkarırlar.
Onboarding yerel bir katalog yolundan kurulum yaptığında,
mümkün olduğunda `source: "path"` ve çalışma alanına göreli bir
`sourcePath` içeren bir `plugins.installs` girdisi kaydeder. Mutlak operasyonel yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu
yollarını uzun ömürlü yapılandırmaya yinelemez. Bu, yerel geliştirme kurulumlarını
ikinci bir ham dosya sistemi yolu ifşa yüzeyi eklemeden kaynak düzlemi tanılamalarında görünür tutar.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri, alma, birleştirme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, sonra etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin'inizin varsayılan bağlam
pipeline'ını yalnızca bellek araması veya hook'lar eklemek yerine değiştirmesi veya genişletmesi gerektiğinde kullanın.

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

Motorunuz Compaction algoritmasının sahibi **değilse** `compact()`
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

Bir plugin mevcut API'ye uymayan davranışa ihtiyaç duyduğunda
plugin sistemini özel bir içeri girme ile atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, fallback, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. türlenmiş plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` alanını en küçük kullanışlı
   türlenmiş yetenek yüzeyi ile genişletin.
3. çekirdek + kanal/özellik tüketicilerini kablolayın
   Kanallar ve özellik plugin'leri yeni yeteneği çekirdek üzerinden tüketmelidir,
   bir satıcı uygulamasını doğrudan içe aktararak değil.
4. satıcı uygulamalarını kaydedin
   Satıcı plugin'leri daha sonra backend'lerini bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahipliğin ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, bir sağlayıcının dünya görüşüne
sabit kodlanmadan bu şekilde tutarlı kalır. Somut bir dosya kontrol listesi ve işlenmiş örnek için [Capability Cookbook](/tr/plugins/architecture)
sayfasına bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt defteri kablolaması
- özellik/kanal
  plugin'leri bunu tüketecekse `src/plugins/runtime/*` içindeki plugin çalışma zamanı yüzeyi
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin belgeleri

Bu yüzeylerden biri eksikse bu genellikle yeteneğin
henüz tam entegre olmadığının işaretidir.

### Yetenek şablonu

Asgari desen:

```ts
// çekirdek sözleşme
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

// özellik/kanal plugin'leri için paylaşılan çalışma zamanı yardımcısı
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

- çekirdek yetenek sözleşmesinin + orkestrasyonun sahibidir
- satıcı plugin'leri satıcı uygulamalarının sahibidir
- özellik/kanal plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin architecture](/tr/plugins/architecture) — genel yetenek modeli ve şekiller
- [Plugin SDK subpaths](/tr/plugins/sdk-subpaths)
- [Plugin SDK setup](/tr/plugins/sdk-setup)
- [Building plugins](/tr/plugins/building-plugins)
