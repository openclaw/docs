---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırası veya kayıt durumu için hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisi iç yapıları: yükleme işlem hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisinin iç işleyişi
x-i18n:
    generated_at: "2026-05-11T20:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Genel capability modeli, Plugin şekilleri ve sahiplik/yürütme
sözleşmeleri için bkz. [Plugin mimarisi](/tr/plugins/architecture). Bu sayfa,
iç mekanikler için başvuru kaynağıdır: yükleme işlem hattı, registry, runtime hook'ları,
Gateway HTTP rotaları, import yolları ve schema tabloları.

## Yükleme işlem hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifestlerini ve package metadata'sını okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: derlenmiş paketli modüller yerel bir loader kullanır;
   üçüncü taraf yerel kaynak TypeScript acil durum Jiti fallback'ini kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları Plugin registry'sinde toplar
8. registry'yi komutlara/runtime yüzeylerine açar

<Note>
`activate`, `register` için eski bir alias'tır — loader hangisi mevcutsa onu çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketli Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik kapıları runtime yürütmesinden **önce** gerçekleşir. Entry Plugin kökünden
dışarı çıkıyorsa, path herkes tarafından yazılabilirse veya path sahipliği
paketli olmayan Plugin'ler için şüpheli görünüyorsa adaylar engellenir.

Engellenen adaylar tanılama için kendi Plugin id'lerine bağlı kalır. Yapılandırma
hala o id'ye başvuruyorsa doğrulama Plugin'i mevcut ama engellenmiş olarak bildirir
ve yapılandırma girdisini eski kabul etmek yerine path güvenliği uyarısına geri yönlendirir.

### Manifest öncelikli davranış

Manifest, control-plane için doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen channels/skills/config schema veya bundle capability'lerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/placeholder'larını zenginleştirmek
- kurulum/katalog metadata'sını göstermek
- Plugin runtime'ını yüklemeden ucuz aktivasyon ve kurulum descriptor'larını korumak

Yerel Plugin'ler için runtime modülü data-plane kısmıdır. Hook'lar, tools,
commands veya provider flow'ları gibi gerçek davranışı kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları control plane'de kalır.
Bunlar aktivasyon planlaması ve kurulum keşfi için yalnızca metadata descriptor'larıdır;
runtime registration, `register(...)` veya `setupEntry` yerine geçmezler.
İlk canlı aktivasyon tüketicileri artık daha geniş registry materyalleştirmesinden önce
Plugin yüklemeyi daraltmak için manifest command, channel ve provider ipuçlarını kullanır:

- CLI yüklemesi, istenen primary command'a sahip Plugin'lerle sınırlandırılır
- channel setup/Plugin çözümlemesi, istenen channel id'ye sahip Plugin'lerle
  sınırlandırılır
- açık provider setup/runtime çözümlemesi, istenen provider id'ye sahip Plugin'lerle
  sınırlandırılır
- Gateway başlangıç planlaması, açık başlangıç import'ları ve başlangıç opt-out'ları için
  `activation.onStartup` kullanır; başlangıç metadata'sı olmayan Plugin'ler yalnızca
  daha dar aktivasyon tetikleyicileriyle yüklenir

Geniş `all` scope'unu isteyen request-time runtime preload'ları yine de
yapılandırmadan, başlangıç planlamasından, yapılandırılmış channel'lardan, slot'lardan
ve auto-enable kurallarından açık bir etkili Plugin id kümesi türetir. Bu türetilen küme
boşsa OpenClaw her keşfedilebilir Plugin'e genişletmek yerine boş bir runtime registry yükler.

Aktivasyon planlayıcısı hem mevcut caller'lar için yalnızca id'lerden oluşan bir API
hem de yeni tanılama için bir plan API'si sunar. Plan girdileri, bir Plugin'in neden
seçildiğini bildirir; açık `activation.*` planlayıcı ipuçlarını `providers`,
`channels`, `commandAliases`, `setup.providers`, `contracts.tools` ve hook'lar gibi
manifest sahipliği fallback'inden ayırır. Bu neden ayrımı uyumluluk sınırıdır:
mevcut Plugin metadata'sı çalışmaya devam ederken yeni kod, runtime yükleme
semantiklerini değiştirmeden geniş ipuçlarını veya fallback davranışını algılayabilir.

Setup keşfi artık `setup-api` fallback'ine geçmeden önce aday Plugin'leri daraltmak için
`setup.providers` ve `setup.cliBackends` gibi descriptor'a ait id'leri tercih eder;
`setup-api` yalnızca hala setup-time runtime hook'larına ihtiyaç duyan Plugin'ler için
kullanılır. Provider setup listeleri, provider runtime'ını yüklemeden manifest
`providerAuthChoices`, descriptor'dan türetilmiş setup choice'ları ve install-catalog
metadata'sını kullanır. Açık `setup.requiresRuntime: false`, yalnızca descriptor'a dayalı
bir kesme noktasıdır; atlanan `requiresRuntime`, uyumluluk için eski setup-api fallback'ini
korur. Keşfedilen birden fazla Plugin aynı normalleştirilmiş setup provider veya CLI
backend id'sini sahiplenirse setup lookup, keşif sırasına güvenmek yerine belirsiz owner'ı
reddeder. Setup runtime yürütüldüğünde registry tanılamaları, eski Plugin'leri
engellemeden `setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen
provider'lar veya CLI backend'leri arasındaki drift'i bildirir.

### Plugin cache sınırı

OpenClaw, Plugin keşif sonuçlarını veya doğrudan manifest registry verilerini wall-clock
pencerelerinin arkasında cache'lemez. Kurulumlar, manifest düzenlemeleri ve load-path
değişiklikleri bir sonraki açık metadata okumasında veya snapshot yeniden oluşturmasında
görünür olmalıdır. Manifest dosya parser'ı, açılan manifest path'i, inode, boyut ve
timestamp'ler ile anahtarlanan sınırlı bir dosya imzası cache'i tutabilir; bu cache yalnızca
değişmemiş byte'ları yeniden parse etmeyi önler ve keşif, registry, owner veya policy
yanıtlarını cache'lememelidir.

Güvenli metadata hızlı yolu, gizli bir cache değil, açık object ownership'tir.
Gateway başlangıç hot path'leri geçerli `PluginMetadataSnapshot`, türetilmiş
`PluginLookUpTable` veya açık bir manifest registry'yi call chain boyunca iletmelidir.
Config doğrulama, başlangıç auto-enable, Plugin bootstrap ve provider seçimi bu object'leri
geçerli config ve Plugin inventory'sini temsil ettikleri sürece yeniden kullanabilir.
Setup lookup, belirli setup path'i açık bir manifest registry almadığı sürece manifest
metadata'sını ihtiyaç halinde yeniden oluşturur; bunu gizli lookup cache'leri eklemek
yerine cold-path fallback olarak tutun. Girdi değiştiğinde snapshot'ı mutasyona uğratmak
veya tarihsel kopyalar tutmak yerine yeniden oluşturup değiştirin.
Etkin Plugin registry'si üzerindeki view'lar ve paketli channel bootstrap helper'ları
geçerli registry/root'tan yeniden hesaplanmalıdır. Kısa ömürlü map'ler, işi dedupe etmek
veya reentry'yi korumak için tek bir çağrı içinde uygundur; process metadata cache'lerine
dönüşmemelidir.

Plugin yükleme için kalıcı cache katmanı runtime yüklemedir. Kod veya kurulu artifact'ler
gerçekten yüklendiğinde loader state'i yeniden kullanabilir, örneğin:

- `PluginLoaderCacheState` ve uyumlu etkin runtime registry'leri
- aynı runtime yüzeyini tekrar tekrar import etmekten kaçınmak için kullanılan
  jiti/module cache'leri ve public-surface loader cache'leri
- kurulu Plugin artifact'leri için filesystem cache'leri
- path normalizasyonu veya duplicate çözümlemesi için kısa ömürlü çağrı başına map'ler

Bu cache'ler data-plane uygulama ayrıntılarıdır. Caller özellikle runtime yükleme istemediyse
"bu provider hangi Plugin'e ait?" gibi control-plane sorularını yanıtlamamalıdırlar.

Şunlar için kalıcı veya wall-clock cache eklemeyin:

- keşif sonuçları
- doğrudan manifest registry'leri
- kurulu Plugin index'inden yeniden oluşturulan manifest registry'leri
- provider owner lookup, model suppression, provider policy veya public-artifact metadata'sı
- değişen bir manifest, kurulu index veya load path'in bir sonraki metadata okumasında
  görünür olması gereken manifest'ten türetilmiş diğer herhangi bir yanıt

Kalıcı kurulu Plugin index'inden manifest metadata'sını yeniden oluşturan caller'lar
bu registry'yi ihtiyaç halinde yeniden oluşturur. Kurulu index dayanıklı source-plane
state'idir; gizli bir in-process metadata cache'i değildir.

## Registry modeli

Yüklenen Plugin'ler rastgele core global'larını doğrudan mutasyona uğratmaz. Merkezi bir
Plugin registry'sine kaydolurlar.

Registry şunları izler:

- Plugin kayıtları (identity, source, origin, status, diagnostics)
- tools
- legacy hook'lar ve typed hook'lar
- channels
- providers
- gateway RPC handler'ları
- HTTP rotaları
- CLI registrar'ları
- background service'leri
- Plugin'e ait commands

Core feature'ları daha sonra Plugin modülleriyle doğrudan konuşmak yerine bu registry'den
okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin module -> registry registration
- core runtime -> registry consumption

Bu ayrım sürdürülebilirlik için önemlidir. Çoğu core yüzeyinin yalnızca tek bir
entegrasyon noktasına ihtiyaç duyması anlamına gelir: "registry'yi oku"; "her Plugin
modülünü özel durum olarak ele al" değil.

## Conversation binding callback'leri

Bir conversation bağlayan Plugin'ler, bir approval çözümlendiğinde tepki verebilir.

Bir bind request onaylandıktan veya reddedildikten sonra callback almak için
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

Callback payload alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan request'ler için çözümlenmiş binding
- `request`: özgün request özeti, detach ipucu, sender id ve
  conversation metadata'sı

Bu callback yalnızca bildirim amaçlıdır. Conversation bind etme izni olan kişileri
değiştirmez ve core approval handling tamamlandıktan sonra çalışır.

## Provider runtime hook'ları

Provider Plugin'lerinin üç katmanı vardır:

- Ucuz pre-runtime lookup için **manifest metadata'sı**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Config-time hook'ları**: `catalog` (legacy `discovery`) artı
  `applyConfigDefaults`.
- **Runtime hook'ları**: auth, model resolution, stream wrapping, thinking levels,
  replay policy ve usage endpoint'lerini kapsayan 40+ isteğe bağlı hook. Tam liste için
  [Hook sırası ve kullanımı](#hook-order-and-usage) bölümüne bakın.

OpenClaw hala genel agent loop'unu, failover'ı, transcript handling'i ve tool policy'yi
sahiplenir. Bu hook'lar, tamamen özel bir inference transport'a ihtiyaç duymadan
provider'a özgü davranış için extension yüzeyidir.

Provider'ın, genel auth/status/model-picker path'lerinin Plugin runtime'ını yüklemeden
görmesi gereken env tabanlı credentials'ı olduğunda manifest `setup.providers[].envVars`
kullanın. Kullanımdan kaldırılmış `providerAuthEnvVars`, deprecation penceresi boyunca
uyumluluk adapter'ı tarafından hala okunur ve bunu kullanan paketli olmayan Plugin'ler
manifest diagnostic alır. Bir provider id başka bir provider id'nin env vars'larını,
auth profile'larını, config-backed auth'unu ve API-key onboarding choice'unu yeniden
kullanmalıysa manifest `providerAuthAliases` kullanın. Onboarding/auth-choice CLI
yüzeyleri, provider runtime'ını yüklemeden provider'ın choice id'sini, grup etiketlerini
ve basit tek flag'li auth wiring'ini bilmeliyse manifest `providerAuthChoices` kullanın.
Provider runtime `envVars` değerlerini onboarding etiketleri veya OAuth
client-id/client-secret setup vars gibi operator-facing ipuçları için tutun.

Bir channel'ın, genel shell-env fallback'in, config/status kontrollerinin veya setup
prompt'larının channel runtime'ını yüklemeden görmesi gereken env-driven auth veya
setup'ı olduğunda manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanımı

Model/provider Plugin'leri için OpenClaw hook'ları kabaca şu sırayla çağırır.
"When to use" sütunu hızlı karar rehberidir.
OpenClaw'ın artık çağırmadığı `ProviderPlugin.capabilities` ve `suppressBuiltInModel`
gibi yalnızca uyumluluk amaçlı provider alanları burada bilerek listelenmemiştir.

| #   | Kanca                             | Ne yapar                                                                                                          | Ne zaman kullanılır                                                                                                                                         |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                     | Sağlayıcı bir kataloğa veya temel URL varsayılanlarına sahiptir                                                                                              |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırılırken sağlayıcıya ait genel yapılandırma varsayılanlarını uygular                        | Varsayılanlar kimlik doğrulama moduna, ortama veya sağlayıcı model ailesi semantiklerine bağlıdır                                                            |
| --  | _(built-in model lookup)_         | OpenClaw önce normal kayıt/katalog yolunu dener                                                                    | _(Plugin kancası değildir)_                                                                                                                                 |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                       | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğinden sorumludur                                                                              |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                       | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinden sorumludur                                                            |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                     | Sağlayıcı, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyar; paketli Google ailesi yardımcıları desteklenen Google yapılandırma girdilerini de yedekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                            | Sağlayıcı, uç nokta güdümlü yerel akış kullanım meta verisi düzeltmelerine ihtiyaç duyar                                                                      |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretçisi kimlik doğrulamasını çözümler | Sağlayıcı, sağlayıcıya ait ortam işaretçisi API anahtarı çözümlemesine sahiptir; `amazon-bedrock` için burada yerleşik bir AWS ortam işaretçisi çözümleyicisi de vardır |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamayı yüzeye çıkarır | Sağlayıcı, sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabilir                                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini bindirir; CLI/uygulama sahipli kimlik bilgileri için varsayılan `persistence`, `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama bilgilerini yeniden kullanır; manifestte `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Depolanan sentetik profil yer tutucularını ortam/yapılandırma destekli kimlik doğrulamanın arkasına düşürür       | Sağlayıcı, önceliği kazanmaması gereken sentetik yer tutucu profiller depolar                                                                                 |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde olmayan sağlayıcıya ait model kimlikleri için senkron geri dönüş                      | Sağlayıcı rastgele upstream model kimliklerini kabul eder                                                                                                     |
| 12  | `prepareDynamicModel`             | Asenkron ısınma yapar, ardından `resolveDynamicModel` yeniden çalışır                                              | Sağlayıcı, bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyaç duyar                                                                              |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önceki son yeniden yazım                                          | Sağlayıcı taşıma yeniden yazımlarına ihtiyaç duyar ancak yine de çekirdek taşıma kullanır                                                                     |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı sağlar                  | Sağlayıcı, sağlayıcının kontrolünü devralmadan kendi modellerini proxy taşımalarında tanır                                                                     |
| 15  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalleştirir                                                   | Sağlayıcı, taşıma ailesi şema temizliğine ihtiyaç duyar                                                                                                       |
| 16  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcıya ait şema tanılamalarını yüzeye çıkarır                                        | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları ister                                                                      |
| 17  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                            | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/nihai çıktı gerektirir                                                                                  |
| 18  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalleştirmesi                                   | Sağlayıcı, varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyar                                                         |
| 19  | `createStreamFn`                  | Normal akış yolunu özel bir taşıma ile tamamen değiştirir                                                         | Sağlayıcı yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyaç duyar                                                                             |
| 20  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                       | Sağlayıcı, özel taşıma olmadan istek üst bilgileri/gövdesi/model uyumluluğu sarmalayıcılarına ihtiyaç duyar                                                   |
| 21  | `resolveTransportTurnState`       | Tur başına yerel taşıma üst bilgileri veya meta verileri ekler                                                    | Sağlayıcı, genel taşımaların sağlayıcıya özgü tur kimliğini göndermesini ister                                                                                |
| 22  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgileri veya oturum soğuma ilkesi ekler                                                     | Sağlayıcı, genel WS taşımalarının oturum üst bilgilerini veya geri dönüş ilkesini ayarlamasını ister                                                          |
| 23  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: depolanan profil, çalışma zamanı `apiKey` dizesine dönüşür            | Sağlayıcı ek kimlik doğrulama meta verisi depolar ve özel bir çalışma zamanı belirteci biçimine ihtiyaç duyar                                                  |
| 24  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme hatası ilkesi için OAuth yenileme geçersiz kılması                       | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymaz                                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                         | Sağlayıcı, yenileme hatasından sonra sağlayıcıya ait kimlik doğrulama onarım rehberliğine ihtiyaç duyar                                                       |
| 26  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşma eşleştiricisi                                                              | Sağlayıcının, genel sezgisellerin kaçıracağı ham taşma hataları vardır                                                                                        |
| 27  | `classifyFailoverReason`          | Sağlayıcıya ait yük devretme nedeni sınıflandırması                                                               | Sağlayıcı, ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. durumlara eşleyebilir                                                                           |
| 28  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için istem önbelleği ilkesi                                                          | Sağlayıcı, proxy’ye özgü önbellek TTL sınırlamasına ihtiyaç duyar                                                                                             |
| 29  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçen ileti                                               | Sağlayıcı, sağlayıcıya özgü eksik kimlik doğrulama kurtarma ipucuna ihtiyaç duyar                                                                             |
| 30  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                           | Sağlayıcı, `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyaç duyar                                                                    |
| 31  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görüntüleme etiketleri ve varsayılan                                           | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunar                                                                            |
| 32  | `isBinaryThinking`                | Açık/kapalı akıl yürütme düğmesi uyumluluk kancası                                                               | Sağlayıcı yalnızca ikili düşünme açık/kapalı seçeneği sunar                                                                                                   |
| 33  | `supportsXHighThinking`           | `xhigh` akıl yürütme desteği uyumluluk kancası                                                                   | Sağlayıcı `xhigh` değerini yalnızca modellerin bir alt kümesinde ister                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                     | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesinden sorumludur                                                                                     |
| 35  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                           | Sağlayıcı, canlı/smoke tercih edilen model eşleştirmesinden sorumludur                                                                                        |
| 36  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcı bir belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyaç duyar                                                                        |
| 37  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümle                                     | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı vardır                                                               |
| 38  | `fetchUsageSnapshot`              | Kimlik doğrulama çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getir ve normalleştir                             | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı vardır                                                                           |
| 39  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir gömme bağdaştırıcısı oluştur                                                     | Bellek gömme davranışı sağlayıcı Plugin'ine aittir                                                                                    |
| 40  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi denetleyen bir yeniden oynatma ilkesi döndür                                        | Sağlayıcının özel transkript ilkesine ihtiyacı vardır (örneğin, düşünme bloğu çıkarma)                                                               |
| 41  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra yeniden oynatma geçmişini yeniden yaz                                                        | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı vardır                                                             |
| 42  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulaması veya yeniden şekillendirmesi                                           | Sağlayıcı aktarımının genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı vardır                                                                    |
| 43  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştır                                                                 | Bir model etkin hale geldiğinde sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı vardır                                                                  |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen sağlayıcı Plugin’ini denetler, ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştiren bir tane bulunana kadar diğer kanca destekli sağlayıcı Plugin’lerine düşer. Bu, çağıranın yeniden yazmayı hangi paketli Plugin’in üstlendiğini bilmesini gerektirmeden alias/compat sağlayıcı shim’lerinin çalışmasını sağlar. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, paketli Google yapılandırma normalleştiricisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir kablo protokolüne veya özel istek yürütücüsüne ihtiyacı varsa, bu farklı bir uzantı sınıfıdır. Bu kancalar, hâlâ OpenClaw’ın normal çıkarım döngüsünde çalışan sağlayıcı davranışları içindir.

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

Paketli sağlayıcı Plugin’leri, her tedarikçinin katalog, kimlik doğrulama, düşünme, yeniden oynatma ve kullanım ihtiyaçlarına uymak için yukarıdaki kancaları birleştirir. Yetkili kanca kümesi her Plugin ile birlikte `extensions/` altında bulunur; bu sayfa listeyi yansıtmak yerine biçimleri gösterir.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI, OpenClaw’ın statik kataloğundan önce yukarı akış model kimliklerini gösterebilmek için `catalog` ile birlikte `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai; token değişimini ve `/usage` entegrasyonunu üstlenmek için `prepareRuntimeAuth` veya `formatApiKey` ile `resolveUsageAuth` + `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`, `anthropic-by-model`, `hybrid-anthropic-openai`), her Plugin’in temizliği yeniden uygulaması yerine sağlayıcıların `buildReplayPolicy` aracılığıyla döküm politikalarına dahil olmasını sağlar.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta başlıkları, `/fast` / `serviceTier` ve `context1m`, genel SDK yerine Anthropic Plugin’inin genel `api.ts` / `contract-api.ts` sınırında (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) bulunur.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı yardımcıları

Plugin’ler seçili çekirdek yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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

- `textToSpeech`, dosya/ses notu yüzeyleri için normal çekirdek TTS çıktı yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızı döndürür. Plugin’ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices` sağlayıcı başına isteğe bağlıdır. Tedarikçi tarafından sahip olunan ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcıdan haberdar seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefoniyi destekler. Microsoft desteklemez.

Plugin’ler ayrıca `api.registerSpeechProvider(...)` üzerinden konuşma sağlayıcıları kaydedebilir.

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
- Tedarikçiye ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: tek bir tedarikçi Plugin’i, OpenClaw bu yetenek sözleşmelerini ekledikçe metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarını üstlenebilir.

Görüntü/ses/video anlama için Plugin’ler genel bir anahtar/değer torbası yerine tek bir türlendirilmiş medya anlama sağlayıcısı kaydeder:

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
- Tedarikçi davranışını sağlayıcı Plugin’inde tutun.
- Eklemeli genişleme türlendirilmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı kalıbı izler:
  - çekirdek, yetenek sözleşmesini ve çalışma zamanı yardımcısını üstlenir
  - tedarikçi Plugin’leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin’leri `api.runtime.videoGeneration.*` kullanır

Medya anlama çalışma zamanı yardımcıları için Plugin’ler şunu çağırabilir:

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

Ses dökümü için Plugin’ler medya anlama çalışma zamanını veya eski STT alias’ını kullanabilir:

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
- `extractStructuredWithModel(...)`, sınırlandırılmış sağlayıcıya ait görüntü öncelikli çıkarım için Plugin’e dönük sınırdır. En az bir görüntü girdisi ekleyin; metin girdileri tamamlayıcı bağlamdır. Ürün Plugin’leri kendi rotalarını ve şemalarını üstlenirken OpenClaw sağlayıcı/çalışma zamanı sınırını üstlenir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Hiçbir döküm çıktısı üretilmediğinde (örneğin atlanan/desteklenmeyen girdi) `{ text: undefined }` döndürür.
- `api.runtime.stt.transcribeAudioFile(...)` uyumluluk alias’ı olarak kalır.

Plugin’ler `api.runtime.subagent` üzerinden arka plan alt ajan çalıştırmaları da başlatabilir:

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
- Plugin’e ait geri dönüş çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça kabul etmelidir.
- Güvenilir Plugin’leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt ajan çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri sessizce geri düşmek yerine reddedilir.
- Plugin tarafından oluşturulan alt ajan oturumları, oluşturan Plugin kimliğiyle etiketlenir. Geri dönüş `api.runtime.subagent.deleteSession(...)` yalnızca bu sahip olunan oturumları silebilir; rastgele oturum silme hâlâ yönetici kapsamlı Gateway isteği gerektirir.

Web araması için Plugin’ler, ajan araç kablolamasına erişmek yerine paylaşılan çalışma zamanı yardımcısını kullanabilir:

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

Plugin’ler ayrıca `api.registerWebSearchProvider(...)` üzerinden web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Tedarikçiye özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağlı kalmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin’leri için tercih edilen paylaşılan yüzeydir.

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

Plugin’ler `api.registerHttpRoute(...)` ile HTTP uç noktaları sunabilir.

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
- `auth`: zorunlu. Normal Gateway kimlik doğrulamasını gerektirmek için `"gateway"` veya Plugin tarafından yönetilen kimlik doğrulaması/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin’in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin'in rotasının yerine geçemez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` geri düşüş zincirlerini yalnızca aynı kimlik doğrulama düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak almaz. Bunlar, ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway isteği çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam özellikle tutucu tasarlanmıştır:
  - paylaşılan gizli bearer kimlik doğrulaması (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin özel bir girişte `trusted-proxy` veya `gateway.auth.mode = "none"`), yalnızca üstbilgi açıkça mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - bu kimlik taşıyan Plugin rotası isteklerinde `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri düşer
- Pratik kural: gateway kimlik doğrulamalı bir Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yöneticiye özel davranış gerektiriyorsa, kimlik taşıyan bir kimlik doğrulama modu gerektirin ve açık `x-openclaw-scopes` üstbilgi sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken monolitik `openclaw/plugin-sdk` kök barrel'ı yerine dar SDK alt yolları kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt temelleri                     |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/oluşturma yardımcıları                        |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme       |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`) |

Kanal Plugin'leri dar bağlantı ailelerinden seçim yapar: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karıştırmak yerine tek bir `approvalCapability`
sözleşmesinde birleştirilmelidir. Bkz. [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen odaklı `*-runtime` alt yolları altında bulunur
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` vb.). Geniş `config-runtime` uyumluluk barrel'ı yerine
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` ve `config-mutation`
tercih edin.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
ve `openclaw/plugin-sdk/infra-runtime`, eski Plugin'ler için kullanımdan kaldırılmış
uyumluluk shim'leridir. Yeni kod bunun yerine daha dar genel temelleri içe aktarmalıdır.
</Info>

Repo içi giriş noktaları (paketlenmiş Plugin paket kökü başına):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/tür barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Çekirdekten veya başka bir Plugin'den asla başka bir Plugin paketinin `src/*` dosyalarını
içe aktarmayın. Facade tarafından yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder, ardından diskte çözümlenen yapılandırma dosyasına geri düşer.

`image-generation`, `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar,
paketlenmiş Plugin'ler bugün bunları kullandığı için vardır. Bunlar otomatik olarak
uzun vadeli donmuş harici sözleşmeler değildir; bunlara dayanırken ilgili SDK
başvuru sayfasını kontrol edin.

## Mesaj aracı şemaları

Plugin'ler, tepkiler, okumalar ve anketler gibi mesaj dışı temeller için
kanala özgü `describeMessageTool(...)` şema katkılarına sahip olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü button, component, block veya card alanları yerine
genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, geri düşüş kuralları, sağlayıcı eşlemesi ve Plugin yazarı kontrol listesi için
bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Gönderim yapabilen Plugin'ler, mesaj yetenekleri aracılığıyla ne işleyebileceklerini bildirir:

- semantik sunum blokları (`text`, `context`, `divider`, `buttons`, `select`) için `presentation`
- sabitlenmiş teslim istekleri için `delivery-pin`

Çekirdek, sunumu yerel olarak işleyip işlemeyeceğine veya metne düşürüp düşürmeyeceğine karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış kapıları sunmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut üçüncü taraf Plugin'ler için dışa aktarılmaya devam eder,
ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal Plugin'leri kanala özgü hedef semantiğine sahip olmalıdır. Paylaşılan
giden ana bilgisayarı genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalleştirilmiş bir hedefin dizin aramasından önce
  `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin araması yerine
  doğrudan kimlik benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalleştirmeden sonra veya
  dizin kaçırmasından sonra son sağlayıcıya ait çözümlemeye ihtiyaç duyması halinde
  Plugin geri düşüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, hedef çözümlendikten sonra sağlayıcıya özgü oturum
  rotası oluşturmayı üstlenir.

Önerilen ayrım:

- Eşleri/grupları aramadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "bunu açık/yerel hedef kimliği olarak ele al" kontrolleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme geri düşüşü için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID'ler, tanıtıcılar ve oda kimlikleri gibi sağlayıcıya özgü yerel kimlikleri
  genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin'ler bu mantığı
Plugin içinde tutmalı ve `openclaw/plugin-sdk/directory-runtime`
içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanal aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda kullanın:

- izin listesi odaklı DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesaba kapsamlı statik dizin geri düşüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- sınır uygulaması
- tekilleştirme/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalleştirme
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri, çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın `models.providers` içine yazdığı aynı şekli döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerine, temel URL
varsayılanlarına veya kimlik doğrulama kapılı model meta verilerine sahip olduğunda `catalog` kullanın.

`catalog.order`, bir Plugin'in kataloğunun OpenClaw'ın yerleşik örtük sağlayıcılarına göre
ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env odaklı sağlayıcılar
- `profile`: kimlik doğrulama profilleri olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: son geçiş, diğer örtük sağlayıcılardan sonra

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır, bu yüzden Plugin'ler aynı sağlayıcı kimliğine sahip
yerleşik bir sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Plugin'ler ayrıca
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` aracılığıyla salt okunur model satırları yayımlayabilir. Bu, liste/yardım/seçici yüzeyleri için ileri yoldur ve
`text`, `image_generation`, `video_generation` ve `music_generation` satırlarını destekler.
Sağlayıcı Plugin'leri canlı uç nokta çağrılarına, token değişimine ve satıcı
yanıt eşlemesine sahip olmaya devam eder; çekirdek ortak satır şeklini, kaynak etiketlerini ve medya aracı
yardım biçimlendirmesini üstlenir. Medya üretimi sağlayıcı kayıtları,
`defaultModel`, `models` ve `capabilities` üzerinden statik
katalog satırlarını otomatik olarak sentezler.

Uyumluluk:

- `discovery` eski bir takma ad olarak çalışmaya devam eder, ancak kullanımdan kaldırma uyarısı yayar
- hem `catalog` hem de `discovery` kayıtlıysa, OpenClaw `catalog` kullanır
- `augmentModelCatalog` kullanımdan kaldırılmıştır; paketlenmiş sağlayıcılar ek satırları
  `registerModelCatalogProvider` aracılığıyla yayımlamalıdır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen somutlaştırıldığını varsaymasına izin verilir
  ve gerekli secret'lar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` gibi salt okunur komut yolları ve doctor/yapılandırma
  onarım akışları, yalnızca yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmaya ihtiyaç duymamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda aşağıdakiler gibi kimlik bilgisi kaynağı/durum alanlarını ekleyin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerleri döndürmeniz gerekmez.
  `tokenStatus: "available"` (ve eşleşen kaynak alanı) döndürmek durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda
  kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmesi veya hesabı yapılandırılmamış olarak yanlış bildirmesi yerine
"yapılandırılmış ancak bu komut yolunda kullanılamıyor" raporlamasına olanak tanır.

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

Her girdi bir Plugin olur. Paket birden çok extension listeliyorsa, Plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa,
`node_modules` kullanılabilir olsun diye bunları o dizine kurun (`npm install` / `pnpm install`).

Güvenlik koruma kuralı: her `openclaw.extensions` girdisi, symlink çözümlemesinden sonra Plugin
dizini içinde kalmalıdır. Paket dizininden kaçan girdiler reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
proje yerelinde `npm install --omit=dev --ignore-scripts` ile kurar (lifecycle betikleri yok,
çalışma zamanında dev bağımlılıkları yok) ve devralınan global npm kurulum ayarlarını yok sayar.
Plugin bağımlılık ağaçlarını "saf JS/TS" tutun ve
`postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif ve yalnızca kuruluma yönelik bir modüle işaret edebilir.
OpenClaw devre dışı bırakılmış bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ancak hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry`
yükler. Bu, ana Plugin girişiniz araçları, hook'ları veya yalnızca çalışma zamanına yönelik başka
kodları da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile bir kanal Plugin'ini Gateway'in
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan önce var olması
gereken başlatma yüzeyini tamamen kapsadığında kullanın. Pratikte bu, kurulum
girdisinin başlatmanın bağlı olduğu kanal-sahipli her yeteneği kaydetmesi
gerektiği anlamına gelir, örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken HTTP rotaları
- aynı zaman aralığında var olması gereken gateway yöntemleri, araçları veya hizmetleri

Tam girdiniz hâlâ gerekli herhangi bir başlatma yeteneğine sahipse, bu bayrağı
etkinleştirmeyin. Plugin'i varsayılan davranışta tutun ve OpenClaw'ın
başlatma sırasında tam girdiyi yüklemesine izin verin.

Paketlenmiş kanallar, çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
başvurabileceği yalnızca-kurulum sözleşme-yüzeyi yardımcılarını da yayımlayabilir.
Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam plugin girdisini yüklemeden eski tek-hesaplı kanal yapılandırmasını
`channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix geçerli paketlenmiş örnektir: adlandırılmış hesaplar zaten mevcut
olduğunda yalnızca kimlik doğrulama/önyükleme anahtarlarını adlandırılmış
yükseltilmiş bir hesaba taşır ve her zaman `accounts.default` oluşturmak yerine
yapılandırılmış kanonik olmayan bir varsayılan-hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme-yüzeyi keşfini tembel
tutar. İçe aktarma süresi hafif kalır; yükseltme yüzeyi, modül içe aktarımında
paketlenmiş kanal başlatmasına yeniden girmek yerine yalnızca ilk kullanımda
yüklenir.

Bu başlatma yüzeyleri gateway RPC yöntemleri içerdiğinde, bunları
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

Kanal plugin'leri `openclaw.channel` üzerinden kurulum/keşif meta verilerini ve
`openclaw.install` üzerinden kurulum ipuçlarını duyurabilir. Bu, çekirdek
katalog verisini boş tutar.

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

En küçük örneğin ötesindeki kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: doküman bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli plugin/kanal id'leri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim-yüzeyi metin denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown-yetenekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış-kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: doküman gezinme yüzeyleri için kanalı dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için hâlâ kabul edilen eski takma adlar; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap mevcut olsa bile açık hesap bağlamayı zorunlu kılar
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözümlenirken oturum aramayı tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir
MPM kayıt dışa aktarımı). Aşağıdakilerden birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ya da `OPENCLAW_PLUGIN_CATALOG_PATHS` (veya `OPENCLAW_MPM_CATALOG_PATHS`) öğesini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulan kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalleştirilmiş kurulum-kaynağı
olgularını açığa çıkarır. Normalleştirilmiş olgular npm belirtiminin tam bir
sürüm mü yoksa değişken bir seçici mi olduğunu, beklenen bütünlük meta verisinin
mevcut olup olmadığını ve yerel bir kaynak yolunun da kullanılabilir olup
olmadığını tanımlar. Katalog/paket kimliği bilindiğinde, normalleştirilmiş
olgular ayrıştırılan npm paket adı bu kimlikten saparsa uyarır. Ayrıca
`defaultChoice` geçersiz olduğunda veya kullanılabilir olmayan bir kaynağa
işaret ettiğinde ve npm bütünlük meta verisi geçerli bir npm kaynağı olmadan
mevcut olduğunda da uyarırlar. Tüketiciler `installSource` alanını eklemeli
isteğe bağlı bir alan olarak ele almalıdır; böylece elle oluşturulmuş girdiler
ve katalog köprüleri bunu sentezlemek zorunda kalmaz.
Bu, katılım ve tanılamaların plugin çalışma zamanını içe aktarmadan kaynak
düzlemi durumunu açıklamasını sağlar.

Resmî harici npm girdileri, tam bir `npmSpec` ile `expectedIntegrity` tercih
etmelidir. Çıplak paket adları ve dist-tag'ler uyumluluk için hâlâ çalışır, ancak
katalog mevcut plugin'leri bozmadan sabitlenmiş, bütünlük-kontrollü kurulumlara
ilerleyebilsin diye kaynak-düzlemi uyarıları gösterirler.
Katılım yerel bir katalog yolundan kurulum yaptığında, mümkün olduğunda
`source: "path"` ve çalışma alanına göreli `sourcePath` içeren yönetilen bir
plugin plugin dizin girdisi kaydeder. Mutlak operasyonel yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı, yerel iş istasyonu yollarını
uzun ömürlü yapılandırmaya kopyalamaktan kaçınır. Bu, yerel geliştirme
kurulumlarını kaynak-düzlemi tanılamalarına görünür tutarken ikinci bir ham
dosya sistemi-yolu ifşa yüzeyi eklemez. Kalıcı `plugins/installs.json` plugin
dizini, kurulumun kaynak doğrusu olur ve plugin çalışma zamanı modülleri
yüklenmeden yenilenebilir. `installRecords` haritası, bir plugin bildirimi eksik
veya geçersiz olsa bile kalıcıdır; `plugins` dizisi yeniden oluşturulabilir bir
bildirim görünümüdür.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri, alma, birleştirme ve compaction için oturum bağlamı
orkestrasyonuna sahiptir. Bunları plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin'inizin yalnızca bellek araması veya kancalar eklemek yerine
varsayılan bağlam işlem hattını değiştirmesi ya da genişletmesi gerektiğinde
kullanın.

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

Fabrika `ctx`, oluşturma-zamanı başlatması için isteğe bağlı `config`,
`agentDir` ve `workspaceDir` değerlerini açığa çıkarır.

Motorunuz compaction algoritmasına sahip **değilse**, `compact()` öğesini
uygulanmış tutun ve bunu açıkça devredin:

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

Bir plugin'in mevcut API'ye uymayan bir davranışa ihtiyacı olduğunda, özel bir
içeri uzanmayla plugin sistemini atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmesini tanımlayın
   Çekirdeğin hangi paylaşılan davranışa sahip olması gerektiğine karar verin: ilke, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. tipli plugin kaydı/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` öğesini en küçük kullanışlı
   tipli yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik plugin'leri yeni yeteneği, bir satıcı uygulamasını doğrudan
   içe aktarmak yerine çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Ardından satıcı plugin'leri kendi arka uçlarını yeteneğe kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw, tek bir sağlayıcının dünya görüşüne sabitlenmeden bu şekilde
görüş sahibi kalır. Somut bir dosya denetim listesi ve işlenmiş örnek için
[Capability Cookbook](/tr/plugins/adding-capabilities) bölümüne bakın.

### Yetenek denetim listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle şu yüzeylere birlikte
dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt defteri bağlaması
- özellik/kanal plugin'lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin dokümanları

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin henüz tam olarak entegre
edilmediğinin bir işaretidir.

### Yetenek şablonu

En küçük kalıp:

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

- çekirdek, yetenek sözleşmesine + orkestrasyona sahiptir
- satıcı plugin'leri satıcı uygulamalarına sahiptir
- özellik/kanal plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin mimarisi](/tr/plugins/architecture) — genel yetenek modeli ve şekiller
- [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
