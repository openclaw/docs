---
read_when:
    - clawhub package validate komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor
    - ClawHub bir Plugin paketinin yayımlanmasını reddetti veya bu konuda uyarı verdi
    - Yayın öncesinde Plugin paket meta verilerini güncelliyorsunuz
summary: Yayımlamadan önce ClawHub Plugin paketi doğrulama bulgularını düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-07-01T08:22:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, yayınlamadan önce Plugin paketlerini doğrular ve otomatik paket
taramalarından gelen bulguları da gösterebilir. Bu sayfa, yazara yönelik
bulguları kapsar; yani Plugin yazarının paket meta verilerinde, manifestinde,
SDK içe aktarmalarında veya yayımlanmış artefaktında düzeltebileceği bulguları.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam bir rapor, yazarın
düzeltmesine yönelik rehberlik olmadan tarayıcı bakım kodları içeriyorsa,
bunlar Plugin yazarları yerine OpenClaw bakımcıları içindir.

Herhangi bir düzeltmeyi uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazara yönelik bulgular

| Kod                                     | Buradan başlayın                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket meta verileri ekleyin](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekleyin](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw paket giriş noktalarını bildirin](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Bildirilen giriş noktasını yayınlayın](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Kurulum meta verilerini tamamlayın](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildirin](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Minimum ana makine sürümünü hizalayın](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini hizalayın](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket meta verilerini kaldırın](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artefaktını paketlenebilir hale getirin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Giriş noktalarını npm paket çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Meta verileri npm paket çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Manifest görünen adı ekleyin](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Desteklenmeyen sözleşme anahtarlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarmalarını kaldırın](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Tüm oturum deposu erişimini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Tüm oturum deposu yazmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Oturum dosya yolu yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Eski transcript dosya hedeflerini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Düşük seviyeli transcript yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start öğesini değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Sağlayıcı env var değerlerini kurulum meta verilerine taşıyın](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Kanal env var değerlerini geçerli meta verilerde yansıtın](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifest şeması başvurularını kaldırın](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifest dosyalarını kaldırın](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Paket meta verileri

### package-json-missing

Paket kökü `package.json` içermiyor, bu yüzden ClawHub npm paketini, sürümünü,
giriş noktalarını veya OpenClaw meta verilerini tanımlayamıyor.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin gönderiyorsa bir `openclaw` bloğu ekleyin.
- Minimum paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins) ve
  paket ile manifest ayrımı için [Plugin manifesti](/tr/plugins/manifest#manifest-versus-packagejson)
  sayfasını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Paket `package.json` içeriyor, ancak OpenClaw paket meta verilerini bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi giriş noktası
  meta verilerini dahil edin.
- Paket ClawHub üzerinden yayınlanacak veya kurulacaksa uyumluluk ve kurulum
  meta verilerini ekleyin.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket meta verileri var, ancak bir OpenClaw çalışma zamanı giriş noktası
bildirmiyor.

- Yerel Plugin giriş noktaları için `openclaw.extensions` ekleyin.
- Yayınlanan paket derlenmiş JavaScript yüklemeliyse `openclaw.runtimeExtensions`
  ekleyin.
- Tüm giriş noktası yollarını paket dizininin içinde tutun.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) ve
  [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery)
  bölümlerine bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw giriş noktası bildiriyor, ancak başvurulan dosya doğrulanan
pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve
  `openclaw.runtimeSetupEntry` içindeki her yolu kontrol edin.
- Giriş noktası `dist` içine oluşturuluyorsa paketi derleyin.
- Giriş noktası taşındıysa meta verileri güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub paketin nasıl kurulacağını veya güncelleneceğini anlayamıyor.

- `openclaw.install` alanını `clawhubSpec`, `npmSpec` veya `localPath` gibi
  desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı varsa `openclaw.install.defaultChoice` değerini
  ayarlayın.
- Minimum OpenClaw ana makine sürümü için `openclaw.install.minHostVersion`
  kullanın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket, desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` içine `openclaw.compat.pluginApi` ekleyin.
- Derleyip test ettiğiniz OpenClaw Plugin API sürümünü veya semver tabanını
  kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin yayınını açıklar;
  `openclaw.compat.pluginApi` ise ana makine API sözleşmesini açıklar.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paketin minimum ana makine sürümü, paketin temel aldığı OpenClaw sürüm meta
verileriyle eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Paketteki, yayın sırasında kullanılan OpenClaw sürümü gibi OpenClaw derleme
  meta verilerini kontrol edin.
- Minimum ana makine sürümünü, paketin gerçekten desteklediği ana makine sürüm
  aralığıyla hizalayın.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ile Plugin manifest sürümü uyuşmuyor.

- Paket yayın sürümü olarak `package.json#version` değerini tercih edin.
- `openclaw.plugin.json` içinde de `version` varsa, eşleşecek şekilde
  güncelleyin veya paket meta verileri yetkiliyse eski manifest sürüm meta
  verilerini kaldırın.
- Yayınlanmış meta verileri değiştirdikten sonra yeni bir paket sürümü
  yayınlayın.
- [Plugin manifesti](/tr/plugins/manifest) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenen OpenClaw paket meta verisi olmayan
alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin meta verilerini `openclaw.plugin.json` içinde tutun.
- Paket giriş noktalarını, uyumluluğu, kurulumu, kurulumu ve katalog meta
  verilerini desteklenen `package.json#openclaw` alanlarında tutun.
- [Keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayınlanmış artefakt

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayınlayacağı artefakta paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemeyi başarısız kılan geçersiz paket meta verilerini, bozuk yaşam
  döngüsü betiklerini veya files girdilerini düzeltin.
- Bu paket herkese açık yayın için tasarlandıysa `private: true` değerini
  kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş artefakt `package.json#openclaw`
içinde bildirilen giriş noktası dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Paketlemeden önce oluşturulan giriş noktalarını derleyin.
- Bildirilen giriş noktaları dahil edilecek şekilde `files`, `.npmignore` veya
  derleme çıktısını güncelleyin.
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş artefakt, kaynak paketinizde bulunan OpenClaw meta verilerinden
yoksun.

- `npm pack --dry-run` çalıştırın ve dahil edilen meta veri dosyalarını
  inceleyin.
- Paketlenmiş artefaktta `package.json` dosyasının `openclaw` bloğunu
  içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin ise `openclaw.plugin.json` dosyasının dahil
  edildiğinden emin olun.
- Paket meta verilerinin hariç tutulmaması için `files` veya `.npmignore`
  değerini güncelleyin.
- [Plugin oluşturma](/tr/plugins/building-plugins) bölümüne bakın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest meta verileri

### manifest-name-missing

Yerel Plugin manifesti bir görüntüleme adı içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` alanını insanlar tarafından okunabilir tutun ve `id` alanını kararlı makine kimliği olarak koruyun.
- Bkz. [Plugin manifesti](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin manifesti, OpenClaw tarafından desteklenmeyen üst düzey alanlar içeriyor.

- Her üst düzey alanı
  [manifest alanı başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum meta verilerini manifest yerine desteklenen `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Manifest, `contracts` içinde desteklenmeyen anahtarlar bildiriyor.

- `contracts` altındaki her anahtarı
  [contracts başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını Plugin kayıt koduna taşıyın ve `contracts` kapsamını statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel'ından içe aktarıyor:
`openclaw/plugin-sdk`.

- Kök barrel içe aktarımlarını odaklanmış herkese açık alt yol içe aktarımlarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar içe aktarımı bulmak için [İçe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş Plugin'ler veya iç uyumluluk için ayrılmış bir SDK yolunu içe aktarıyor.

- Ayrılmış OpenClaw iç SDK içe aktarımlarını belgelenmiş herkese açık
  `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın herkese açık SDK karşılığı yoksa yardımcıyı paketinizin içinde tutun veya herkese açık bir OpenClaw API isteyin.
- Desteklenen bir içe aktarım seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı
`loadSessionStore` kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)` kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` öğesini yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-store-write

Plugin hâlâ `saveSessionStore` veya `updateSessionStore` gibi kullanımdan kaldırılmış tüm oturum deposu yazma yardımcılarını kullanıyor.

- Mevcut bir oturum girdisindeki alanları güncellerken `patchSessionEntry(...)` kullanın.
- Bir oturum girdisini değiştirirken veya oluştururken `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- Tüm depo yazma yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-file-helper

Plugin hâlâ `resolveSessionFilePath` veya `resolveAndPersistSessionFile` gibi kullanımdan kaldırılmış oturum dosya yolu yardımcılarını kullanıyor.

- Oturum meta verilerini aracı ve oturum kimliğine göre okumak için `getSessionEntry(...)` kullanın.
- Oturum meta verilerini kalıcı hale getirmek için `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Kod bir transkript işlemi hazırlıyorsa transkript kimliği veya hedef yardımcılarını kullanın.
- Eski transkript dosya yollarını kalıcı hale getirmeyin veya bunlara bağımlı olmayın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-file-target

Plugin hâlâ kullanımdan kaldırılmış transkript dosya hedefi yardımcısı
`resolveSessionTranscriptLegacyFileTarget` kullanıyor.

- Kod yalnızca herkese açık oturum kimliğine ihtiyaç duyduğunda `resolveSessionTranscriptIdentity(...)` kullanın.
- Kod yapılandırılmış bir transkript işlem hedefine ihtiyaç duyduğunda `resolveSessionTranscriptTarget(...)` kullanın.
- Eski transkript dosya hedeflerini doğrudan okumaktan veya oluşturmaktan kaçının.
- Eski yardımcıyı yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-low-level

Plugin hâlâ `appendSessionTranscriptMessage` veya `emitSessionTranscriptUpdate` gibi kullanımdan kaldırılmış düşük seviyeli transkript yardımcılarını kullanıyor.

- Transkript eklemeleri için `appendSessionTranscriptMessageByIdentity(...)` kullanın.
- Transkript güncelleme bildirimleri için `publishSessionTranscriptUpdateByIdentity(...)` kullanın.
- OpenClaw'ın doğru işlem sınırlarını ve kimlik işlemeyi uygulayabilmesi için yapılandırılmış transkript çalışma zamanı yüzeyini tercih edin.
- Düşük seviyeli transkript yardımcılarını yalnızca bildirdiğiniz uyumluluk aralığı bunları gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` hook'unu kullanıyor.

- Model veya sağlayıcı geçersiz kılma işini `before_model_resolve` öğesine taşıyın.
- İstem veya bağlam değiştirme işini `before_prompt_build` öğesine taşıyın.
- `before_agent_start` öğesini yalnızca bildirdiğiniz uyumluluk aralığı bunu gerektiren eski OpenClaw sürümlerini hâlâ desteklerken koruyun.
- Bkz. [Hook'lar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Manifest hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini kullanıyor.

- Sağlayıcı env-var meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` öğesini yalnızca desteklenen OpenClaw aralığınız hâlâ buna ihtiyaç duyarken uyumluluk meta verisi olarak koruyun.
- Bkz. [setup başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Manifest, ClawHub'ın beklediği güncel setup veya yapılandırma meta verileri olmadan eski ya da daha eski kanal env-var meta verilerini kullanıyor.

- Kanal env-var meta verilerini bildirimsel tutun; böylece OpenClaw kanal çalışma zamanını yüklemeden setup durumunu inceleyebilir.
- Env odaklı kanal setup'ını Plugin şeklinizin kullandığı güncel setup, kanal yapılandırması veya paket kanal meta verilerine yansıtın.
- `channelEnvVars` öğesini yalnızca eski desteklenen OpenClaw sürümleri hâlâ bunu gerektirirken uyumluluk meta verisi olarak koruyun.
- Bkz. [Plugin manifesti](/tr/plugins/manifest) ve
  [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik manifesti

### security-manifest-schema-unavailable

Paket, ClawHub tarafından kullanılabilir olarak tanınmayan bir şema başvurusuyla `openclaw.security.json` gönderiyor.

- Yalnızca öneri amaçlıysa şema URL'sini kaldırın.
- Belgelenmiş sürümlü şemayı yalnızca OpenClaw bir tane yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket desteklenmeyen bir güvenlik manifesti dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik manifesti şemasını ve ClawHub davranışını belgeleyene kadar `openclaw.security.json` dosyasını kaldırın.
- Manifest contract'ı var olana kadar güvenliğe duyarlı davranışı herkese açık paket belgelerinizde veya README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin'ler oluşturma](/tr/plugins/building-plugins)
- [Plugin manifesti](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
