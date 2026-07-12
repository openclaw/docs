---
read_when:
    - clawhub package validate komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor
    - ClawHub, bir plugin paketi yayımlanırken paketi reddetti veya uyarı verdi
    - Sürümden önce plugin paketi meta verilerini güncelliyorsunuz.
summary: Yayımlamadan önce ClawHub Plugin paketi doğrulama bulgularını düzeltin
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-07-12T12:08:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, Plugin paketlerini yayımlanmadan önce doğrular ve otomatik paket taramalarından elde edilen bulguları da gösterebilir. Bu sayfa, Plugin yazarının paket meta verilerinde, manifestte, SDK içe aktarımlarında veya yayımlanan yapıtta düzeltebileceği, yazara yönelik bulgıları kapsar.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam rapor, yazarın uygulayabileceği düzeltme yönergeleri olmadan tarayıcı bakım kodları içeriyorsa bunlar Plugin yazarlarına değil, OpenClaw bakımcılarına yöneliktir.

Herhangi bir düzeltmeyi uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazara yönelik bulgular

| Kod                                     | Buradan başlayın                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket meta verilerini ekleyin](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Paketin openclaw bloğunu ekleyin](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildirin](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayımlayın](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Kurulum meta verilerini tamamlayın](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildirin](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü uyumlu hâle getirin](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini uyumlu hâle getirin](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verilerini kaldırın](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm yapıtını paketlenebilir hâle getirin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm paketleme çıktısına ekleyin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Meta verileri npm paketleme çıktısına ekleyin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Manifeste bir görünen ad ekleyin](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarımlarını değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarımlarını kaldırın](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Oturum deposunun tamamına erişimi değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Oturum deposunun tamamına yazma işlemlerini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Oturum dosya yolu yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Eski transkript dosyası hedeflerini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Düşük seviyeli transkript yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start değerini değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sağlayıcı ortam değişkenlerini kurulum meta verilerine taşıyın](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Kanal ortam değişkenlerini güncel meta verilere yansıtın](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifesti şema başvurularını kaldırın](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifesti dosyalarını kaldırın](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Paket meta verileri

### package-json-missing

Paket kökü `package.json` dosyasını içermediğinden ClawHub npm paketini, sürümü, giriş noktalarını veya OpenClaw meta verilerini tanımlayamaz.

- `name`, `version` ve `type` alanlarını içeren bir `package.json` ekleyin.
- Paket bir OpenClaw Plugin'i içeriyorsa bir `openclaw` bloğu ekleyin.
- Asgari bir paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins), paket ile manifest ayrımı için [Plugin manifesti](/tr/plugins/manifest#manifest-versus-packagejson) sayfasını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Pakette `package.json` vardır ancak OpenClaw paket meta verileri bildirilmemiştir.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası meta verilerini ekleyin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum meta verilerini ekleyin.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verileri vardır ancak bir OpenClaw çalışma zamanı giriş noktası bildirilmemiştir.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayımlanan paketin derlenmiş JavaScript'i yüklemesi gerekiyorsa `openclaw.runtimeExtensions` ekleyin.
- Tüm giriş noktası yollarını paket dizini içinde tutun.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildirir ancak başvurulan dosya, doğrulanan pakette yoktur.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve `openclaw.runtimeSetupEntry` içindeki her yolu kontrol edin.
- Giriş noktası `dist` dizininde oluşturuluyorsa paketi derleyin.
- Giriş noktası taşındıysa meta verileri güncelleyin.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulması veya güncellenmesi gerektiğini belirleyemiyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı varsa `openclaw.install.defaultChoice` değerini ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion` kullanın.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket, desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` dosyasına `openclaw.compat.pluginApi` ekleyin.
- Derleme ve test işlemlerinde temel aldığınız OpenClaw Plugin API sürümünü veya asgari semver sürümünü kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin sürümünü, `openclaw.compat.pluginApi` ise ana makine API sözleşmesini tanımlar.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paketin minimum ana makine sürümü, paketin temel alınarak derlendiği OpenClaw sürüm meta verileriyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Paketteki, sürüm oluşturulurken kullanılan OpenClaw sürümü gibi tüm OpenClaw derleme meta verilerini kontrol edin.
- Minimum ana makine sürümünü, paketin gerçekten desteklediği ana makine sürümü aralığıyla uyumlu hâle getirin.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifesti sürümü uyuşmuyor.

- Paket sürüm sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` dosyasında da `version` varsa bunu eşleşecek şekilde güncelleyin veya paket meta verileri yetkili kaynaksa eski manifest sürümü meta verilerini kaldırın.
- Yayımlanmış meta verileri değiştirdikten sonra yeni bir paket sürümü yayımlayın.
- Bkz. [Plugin manifesti](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verileri arasında bulunmayan alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verilerini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluk, kurulum, ayarlama ve katalog meta verilerini desteklenen `package.json#openclaw` alanlarında tutun.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanan yapıt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı yapıta paketlenemiyor.

- Paket kökünden `npm pack --dry-run` komutunu çalıştırın.
- Paketlemeyi başarısız kılan geçersiz paket meta verilerini, bozuk yaşam döngüsü betiklerini veya `files` girdilerini düzeltin.
- Bu paket herkese açık olarak yayımlanacaksa `private: true` ayarını kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor ancak paketlenmiş yapıt, `package.json#openclaw` içinde bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` komutunu çalıştırın ve eklenecek dosyaları inceleyin.
- Oluşturulan giriş noktalarını paketlemeden önce derleyin.
- Bildirilen giriş noktalarının eklenmesi için `files`, `.npmignore` veya derleme çıktısını güncelleyin.
- Bkz. [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş yapıtta, kaynak paketinizde bulunan OpenClaw meta verileri eksik.

- `npm pack --dry-run` komutunu çalıştırın ve eklenen meta veri dosyalarını inceleyin.
- Paketlenmiş yapıttaki `package.json` dosyasının `openclaw` bloğunu içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin'iyse `openclaw.plugin.json` dosyasının eklendiğinden emin olun.
- Paket meta verilerinin hariç tutulmaması için `files` veya `.npmignore` dosyasını güncelleyin.
- Bkz. [Plugin oluşturma](/tr/plugins/building-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest meta verileri

### manifest-name-missing

Yerel Plugin manifestosu bir görüntüleme adı içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` değerini insanlar tarafından okunabilir tutun ve `id` değerini kararlı makine kimliği olarak koruyun.
- Bkz. [Plugin manifestosu](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifestosu, OpenClaw tarafından desteklenmeyen üst düzey alanlar içeriyor.

- Her üst düzey alanı
  [manifesto alanı referansı](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum meta verilerini manifesto yerine desteklenen
  `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifesto, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [sözleşmeler referansı](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen sözleşme anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts` alanını
  statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK dışa aktarım noktasından içe aktarıyor:
`openclaw/plugin-sdk`.

- Kök dışa aktarım noktası içe aktarımlarını, belirli genel alt yol içe aktarımlarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar kapsamlı içe aktarımı bulmak için [İçe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) bölümlerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketle birlikte sunulan Pluginler veya dahili uyumluluk için ayrılmış bir SDK yolunu içe aktarıyor.

- Ayrılmış OpenClaw dahili SDK içe aktarımlarını belgelenmiş genel
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranış için genel bir SDK yoksa yardımcıyı paketinizin içinde tutun veya
  genel bir OpenClaw API'si talep edin.
- Desteklenen bir içe aktarım seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) bölümlerini kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin, kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` işlevini hâlâ kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)` kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` işlevini yalnızca bildirdiğiniz uyumluluk aralığı,
  bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklediği sürece kullanın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-store-write

Plugin, `saveSessionStore` veya `updateSessionStore` gibi kullanımdan kaldırılmış bir
tüm oturum deposu yazma yardımcısını hâlâ kullanıyor.

- Mevcut bir oturum girdisindeki alanları güncellerken `patchSessionEntry(...)` kullanın.
- Bir oturum girdisini değiştirirken veya oluştururken `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- Tüm depo yazma yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı,
  bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklediği sürece kullanın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-file-helper

Plugin, `resolveSessionFilePath` veya `resolveAndPersistSessionFile` gibi
kullanımdan kaldırılmış oturum dosya yolu yardımcılarını hâlâ kullanıyor.

- Aracı ve oturum kimliğine göre oturum meta verilerini okumak için `getSessionEntry(...)` kullanın.
- Oturum meta verilerini kalıcı hâle getirmek için `patchSessionEntry(...)` veya
  `upsertSessionEntry(...)` kullanın.
- Kod bir döküm işlemi hazırlarken döküm kimliği veya hedef yardımcılarını kullanın.
- Eski döküm dosyası yollarını kalıcı hâle getirmeyin veya bunlara bağımlı olmayın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-file-target

Plugin, kullanımdan kaldırılmış döküm dosyası hedefi yardımcısı
`resolveSessionTranscriptLegacyFileTarget` işlevini hâlâ kullanıyor.

- Kod yalnızca genel oturum kimliğine ihtiyaç duyduğunda
  `resolveSessionTranscriptIdentity(...)` kullanın.
- Kod yapılandırılmış bir döküm işlemi hedefine ihtiyaç duyduğunda
  `resolveSessionTranscriptTarget(...)` kullanın.
- Eski döküm dosyası hedeflerini doğrudan okumaktan veya oluşturmaktan kaçının.
- Eski yardımcıyı yalnızca bildirdiğiniz uyumluluk aralığı, bunu gerektiren eski
  OpenClaw sürümlerini hâlâ desteklediği sürece kullanın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-low-level

Plugin, `appendSessionTranscriptMessage` veya `emitSessionTranscriptUpdate` gibi
kullanımdan kaldırılmış düşük düzeyli döküm yardımcılarını hâlâ kullanıyor.

- Döküme ekleme işlemleri için `appendSessionTranscriptMessageByIdentity(...)` kullanın.
- Döküm güncelleme bildirimleri için
  `publishSessionTranscriptUpdateByIdentity(...)` kullanın.
- OpenClaw'ın doğru işlem sınırlarını ve kimlik işlemeyi uygulayabilmesi için
  yapılandırılmış döküm çalışma zamanı yüzeyini tercih edin.
- Düşük düzeyli döküm yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı,
  bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklediği sürece kullanın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin, eski `before_agent_start` kancasını hâlâ kullanıyor.

- Model veya sağlayıcı geçersiz kılma işlemlerini `before_model_resolve` kancasına taşıyın.
- İstem veya bağlam değiştirme işlemlerini `before_prompt_build` kancasına taşıyın.
- `before_agent_start` kancasını yalnızca bildirdiğiniz uyumluluk aralığı, bunu
  gerektiren eski OpenClaw sürümlerini hâlâ desteklediği sürece kullanın.
- Bkz. [Kancalar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifesto, eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini hâlâ kullanıyor.

- Sağlayıcı ortam değişkeni meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` alanını yalnızca desteklediğiniz OpenClaw aralığı buna
  hâlâ ihtiyaç duyduğu sürece uyumluluk meta verisi olarak tutun.
- Bkz. [kurulum referansı](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifesto, ClawHub'ın beklediği güncel kurulum veya yapılandırma meta verileri olmadan
eski kanal ortam değişkeni meta verilerini kullanıyor.

- OpenClaw'ın kanal çalışma zamanını yüklemeden kurulum durumunu inceleyebilmesi için
  kanal ortam değişkeni meta verilerini bildirimsel tutun.
- Ortam değişkeniyle yönetilen kanal kurulumunu, Plugin yapınızın kullandığı
  güncel kurulum, kanal yapılandırması veya paket kanal meta verilerine yansıtın.
- `channelEnvVars` alanını yalnızca desteklenen eski OpenClaw sürümleri bunu
  hâlâ gerektirdiği sürece uyumluluk meta verisi olarak tutun.
- Bkz. [Plugin manifestosu](/tr/plugins/manifest) ve
  [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifestosu

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir şema referansına sahip
`openclaw.security.json` dosyasını içeriyor.

- Şema URL'si yalnızca bilgilendirme amaçlıysa kaldırın.
- Yalnızca OpenClaw bir şema yayımladıktan sonra belgelenmiş, sürümlendirilmiş bir şema kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket, desteklenmeyen bir güvenlik manifestosu dosyası içeriyor.

- OpenClaw sürümlendirilmiş bir güvenlik manifestosu şemasını ve ClawHub davranışını
  belgeleyene kadar `openclaw.security.json` dosyasını kaldırın.
- Manifesto sözleşmesi oluşana kadar güvenlik açısından hassas davranışları
  genel paket belgelerinizde veya README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub'da yayımlama](/tr/clawhub/publishing)
- [Plugin geliştirme](/tr/plugins/building-plugins)
- [Plugin manifestosu](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
