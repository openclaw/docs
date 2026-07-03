---
read_when:
    - clawhub package validate komutunu çalıştırdınız ve Plugin bulgularını düzeltmeniz gerekiyor
    - ClawHub, bir Plugin paketi yayımlamasını reddetti veya uyarı verdi
    - Yayın öncesinde Plugin paket meta verilerini güncelliyorsunuz
summary: Yayımlamadan önce ClawHub Plugin paketi doğrulama bulgularını düzelt
title: Plugin doğrulama düzeltmeleri
x-i18n:
    generated_at: "2026-07-03T02:54:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin doğrulama düzeltmeleri

ClawHub, Plugin paketlerini yayımlamadan önce doğrular ve otomatik paket
taramalarından gelen bulguları da gösterebilir. Bu sayfa, yazarların kendi
paket metadata, manifest, SDK içe aktarımları veya yayımlanmış artifact içinde
düzeltebileceği bulgular anlamına gelen yazar odaklı bulguları kapsar.

Dahili Plugin Inspector kapsam bulgularını kapsamaz. Tam bir rapor, yazarın
düzeltmesine yönelik rehberlik olmadan tarayıcı bakım kodları içeriyorsa, bunlar
Plugin yazarlarından çok OpenClaw bakımcıları içindir.

Herhangi bir düzeltme uyguladıktan sonra yeniden çalıştırın:

```bash
clawhub package validate <path-to-plugin>
```

## Yazar odaklı bulgular

| Kod                                     | Buradan başlayın                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Paket metadata ekleyin](/tr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Paket openclaw bloğunu ekleyin](/tr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw paket entrypoint'lerini bildirin](/tr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Bildirilen entrypoint'i yayımlayın](/tr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Kurulum metadata'sını tamamlayın](/tr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API uyumluluğunu bildirin](/tr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Minimum host sürümünü hizalayın](/tr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Paket ve manifest sürümlerini hizalayın](/tr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Desteklenmeyen OpenClaw paket metadata'sını kaldırın](/tr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artifact'inin paketlenebilir olmasını sağlayın](/tr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [entrypoint'leri npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [metadata'yı npm pack çıktısına dahil edin](/tr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Manifest görünen adı ekleyin](/tr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Desteklenmeyen manifest alanlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Desteklenmeyen contract anahtarlarını kaldırın](/tr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Kök SDK içe aktarımlarını değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Ayrılmış SDK içe aktarımlarını kaldırın](/tr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Tüm session-store erişimini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Tüm session-store yazmalarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Oturum dosya yolu yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Eski transcript dosyası hedeflerini değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Düşük seviyeli transcript yardımcılarını değiştirin](/tr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start değerini değiştirin](/tr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Provider env vars değerlerini kurulum metadata'sına taşıyın](/tr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Channel env vars değerlerini güncel metadata'da yansıtın](/tr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Kullanılamayan güvenlik manifest şeması referanslarını kaldırın](/tr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Desteklenmeyen güvenlik manifest dosyalarını kaldırın](/tr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Paket metadata'sı

### package-json-missing

Paket kökü `package.json` içermiyor, bu nedenle ClawHub npm paketini, sürümünü,
entrypoint'lerini veya OpenClaw metadata'sını tanımlayamaz.

- `name`, `version` ve `type` ile `package.json` ekleyin.
- Paket bir OpenClaw Plugin'i gönderiyorsa bir `openclaw` bloğu ekleyin.
- Minimal paket örneği için [Plugin oluşturma](/tr/plugins/building-plugins) ve
  paket ile manifest ayrımı için [Plugin manifest](/tr/plugins/manifest#manifest-versus-packagejson)
  sayfasını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-metadata-missing

Paket `package.json` içeriyor, ancak OpenClaw paket metadata'sı bildirmiyor.

- `package.json#openclaw` ekleyin.
- `openclaw.extensions` veya `openclaw.runtimeExtensions` gibi entrypoint
  metadata'sını dahil edin.
- Paket ClawHub üzerinden yayımlanacak veya kurulacaksa uyumluluk ve kurulum
  metadata'sı ekleyin.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-entry-missing

Paket metadata'sı mevcut, ancak bir OpenClaw runtime entrypoint'i bildirmiyor.

- Yerel Plugin entrypoint'leri için `openclaw.extensions` ekleyin.
- Yayımlanan paket derlenmiş JavaScript yüklemeliyse `openclaw.runtimeExtensions`
  ekleyin.
- Tüm entrypoint yollarını paket dizininin içinde tutun.
- Bkz. [Plugin entry point'leri](/tr/plugins/sdk-entrypoints) ve
  [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-entrypoint-missing

Paket bir OpenClaw entrypoint'i bildiriyor, ancak başvurulan dosya doğrulanan
pakette eksik.

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` ve
  `openclaw.runtimeSetupEntry` içindeki her yolu kontrol edin.
- entrypoint `dist` içine üretiliyorsa paketi derleyin.
- entrypoint taşındıysa metadata'yı güncelleyin.
- Bkz. [Plugin entry point'leri](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-install-metadata-incomplete

ClawHub, paketin nasıl kurulacağını veya güncelleneceğini anlayamıyor.

- `openclaw.install` değerini `clawhubSpec`, `npmSpec` veya `localPath` gibi
  desteklenen kurulum kaynağıyla doldurun.
- Birden fazla kurulum kaynağı mevcutsa `openclaw.install.defaultChoice`
  ayarlayın.
- Minimum OpenClaw host sürümü için `openclaw.install.minHostVersion` kullanın.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-plugin-api-compat-missing

Paket, desteklediği OpenClaw Plugin API aralığını bildirmiyor.

- `package.json` içine `openclaw.compat.pluginApi` ekleyin.
- Üzerine inşa edip test ettiğiniz OpenClaw Plugin API sürümünü veya semver
  tabanını kullanın.
- Bunu paket sürümünden ayrı tutun. Paket sürümü Plugin yayımını açıklar;
  `openclaw.compat.pluginApi` ise host API contract'ını açıklar.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-min-host-version-drift

Paketin minimum host sürümü, paketin üzerine inşa edildiği OpenClaw sürüm
metadata'sıyla eşleşmiyor.

- `openclaw.install.minHostVersion` değerini kontrol edin.
- Yayım sırasında kullanılan OpenClaw sürümü gibi paketteki tüm OpenClaw derleme
  metadata'sını kontrol edin.
- Minimum host sürümünü, paketin gerçekten desteklediği host sürüm aralığıyla
  hizalayın.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-manifest-version-drift

Paket sürümü ve Plugin manifest sürümü uyuşmuyor.

- Paket yayım sürümü olarak `package.json#version` tercih edin.
- `openclaw.plugin.json` içinde de `version` varsa, paket metadata'sı yetkili
  kaynak olduğunda eşleşecek şekilde güncelleyin veya eski manifest sürüm
  metadata'sını kaldırın.
- Yayımlanmış metadata'yı değiştirdikten sonra yeni bir paket sürümü yayımlayın.
- Bkz. [Plugin manifest](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-openclaw-unsupported-metadata

`package.json#openclaw` bloğu, desteklenmeyen OpenClaw paket metadata'sı olan
alanlar içeriyor.

- `openclaw.bundle` gibi desteklenmeyen alanları kaldırın.
- Yerel Plugin metadata'sını `openclaw.plugin.json` içinde tutun.
- Paket entrypoint'lerini, uyumluluk, kurulum, setup ve catalog metadata'sını
  desteklenen `package.json#openclaw` alanlarında tutun.
- Bkz. [keşfi etkileyen package.json alanları](/tr/plugins/manifest#packagejson-fields-that-affect-discovery).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Yayımlanmış artifact

### package-npm-pack-unavailable

Paket, ClawHub'ın inceleyeceği veya yayımlayacağı artifact içine paketlenemiyor.

- Paket kökünden `npm pack --dry-run` çalıştırın.
- Paketlemeyi başarısız kılan geçersiz paket metadata'sını, bozuk lifecycle
  script'lerini veya files girdilerini düzeltin.
- Bu paket herkese açık yayımlama için tasarlandıysa `private: true` değerini
  kaldırın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-entrypoint-missing

Paket paketlenebiliyor, ancak paketlenmiş artifact `package.json#openclaw`
içinde bildirilen entrypoint dosyalarını içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilecek dosyaları inceleyin.
- Paketlemeden önce üretilen entrypoint'leri derleyin.
- Bildirilen entrypoint'lerin dahil edilmesi için `files`, `.npmignore` veya
  derleme çıktısını güncelleyin.
- Bkz. [Plugin entry point'leri](/tr/plugins/sdk-entrypoints).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### package-npm-pack-metadata-missing

Paketlenmiş artifact, kaynak paketinizde mevcut olan OpenClaw metadata'sını
içermiyor.

- `npm pack --dry-run` çalıştırın ve dahil edilen metadata dosyalarını inceleyin.
- `package.json` dosyasının paketlenmiş artifact içinde `openclaw` bloğunu
  içerdiğinden emin olun.
- Paket yerel bir OpenClaw Plugin'iyse `openclaw.plugin.json` dosyasının dahil
  edildiğinden emin olun.
- Paket metadata'sının hariç tutulmaması için `files` veya `.npmignore`
  değerini güncelleyin.
- Bkz. [Plugin oluşturma](/tr/plugins/building-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Manifest metadata'sı

### manifest-name-missing

Yerel plugin bildirimi bir görünen ad içermiyor.

- `openclaw.plugin.json` dosyasına boş olmayan bir `name` alanı ekleyin.
- `name` alanını insan tarafından okunabilir tutun ve `id` alanını kararlı makine kimliği olarak koruyun.
- Bkz. [Plugin bildirimi](/tr/plugins/manifest).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-fields

Plugin bildirimi, OpenClaw tarafından desteklenmeyen üst düzey alanlar içeriyor.

- Her üst düzey alanı
  [bildirim alanı başvurusu](/tr/plugins/manifest#top-level-field-reference) ile karşılaştırın.
- Özel alanları `openclaw.plugin.json` dosyasından kaldırın.
- Paket veya kurulum meta verilerini bildirim yerine desteklenen `package.json#openclaw` alanlarına taşıyın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### manifest-unknown-contracts

Bildirim, `contracts` içinde desteklenmeyen anahtarlar tanımlıyor.

- `contracts` altındaki her anahtarı
  [contracts başvurusu](/tr/plugins/manifest#contracts-reference) ile karşılaştırın.
- Desteklenmeyen contract anahtarlarını kaldırın.
- Çalışma zamanı davranışını plugin kayıt koduna taşıyın ve `contracts` alanını statik yetenek sahipliği meta verileriyle sınırlı tutun.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## SDK ve uyumluluk geçişi

### legacy-root-sdk-import

Plugin, kullanımdan kaldırılmış kök SDK barrel'ından içe aktarıyor:
`openclaw/plugin-sdk`.

- Kök barrel içe aktarımlarını odaklanmış genel alt yol içe aktarımlarıyla değiştirin.
- `definePluginEntry` için `openclaw/plugin-sdk/plugin-entry` kullanın.
- Kanal giriş yardımcıları için `openclaw/plugin-sdk/channel-core` kullanın.
- Dar içe aktarımı bulmak için [içe aktarma kuralları](/tr/plugins/building-plugins#import-conventions) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### reserved-sdk-import

Plugin, paketlenmiş plugin'ler veya dahili uyumluluk için ayrılmış bir SDK yolundan içe aktarıyor.

- Ayrılmış OpenClaw dahili SDK içe aktarımlarını belgelenmiş genel `openclaw/plugin-sdk/*` alt yollarıyla değiştirin.
- Davranışın genel bir SDK karşılığı yoksa, yardımcıyı paketinizin içinde tutun veya genel bir OpenClaw API'si isteyin.
- Desteklenen bir içe aktarım seçmek için [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths) ve
  [SDK geçişi](/tr/plugins/sdk-migration) sayfalarını kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-load-session-store

Plugin hâlâ kullanımdan kaldırılmış tüm oturum deposu yardımcısı `loadSessionStore` kullanıyor.

- Oturum durumunu okurken `getSessionEntry(...)` veya `listSessionEntries(...)` kullanın.
- Oturum durumunu yazarken `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- `loadSessionStore(...)` öğesini yalnızca beyan ettiğiniz uyumluluk aralığı hâlâ bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-store-write

Plugin hâlâ `saveSessionStore` veya `updateSessionStore` gibi kullanımdan kaldırılmış bir tüm oturum deposu yazma yardımcısı kullanıyor.

- Mevcut bir oturum girdisindeki alanları güncellerken `patchSessionEntry(...)` kullanın.
- Bir oturum girdisini değiştirirken veya oluştururken `upsertSessionEntry(...)` kullanın.
- Tüm oturum deposu nesnesini yüklemekten, değiştirmekten ve kaydetmekten kaçının.
- Tüm depo yazma yardımcılarını yalnızca beyan ettiğiniz uyumluluk aralığı hâlâ bunları gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-file-helper

Plugin hâlâ `resolveSessionFilePath` veya `resolveAndPersistSessionFile` gibi kullanımdan kaldırılmış oturum dosya yolu yardımcıları kullanıyor.

- Oturum meta verilerini aracı ve oturum kimliğine göre okumak için `getSessionEntry(...)` kullanın.
- Oturum meta verilerini kalıcı hale getirmek için `patchSessionEntry(...)` veya `upsertSessionEntry(...)` kullanın.
- Kod bir transkript işlemi hazırlıyorsa transkript kimliği veya hedef yardımcılarını kullanın.
- Eski transkript dosya yollarını kalıcı hale getirmeyin veya bunlara bağımlı olmayın.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-file-target

Plugin hâlâ kullanımdan kaldırılmış transkript dosya hedefi yardımcısı `resolveSessionTranscriptLegacyFileTarget` kullanıyor.

- Kod yalnızca genel oturum kimliğine ihtiyaç duyduğunda `resolveSessionTranscriptIdentity(...)` kullanın.
- Kod yapılandırılmış bir transkript işlem hedefine ihtiyaç duyduğunda `resolveSessionTranscriptTarget(...)` kullanın.
- Eski transkript dosya hedeflerini doğrudan okumaktan veya oluşturmaktan kaçının.
- Eski yardımcıyı yalnızca beyan ettiğiniz uyumluluk aralığı hâlâ bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### sdk-session-transcript-low-level

Plugin hâlâ `appendSessionTranscriptMessage` veya `emitSessionTranscriptUpdate` gibi kullanımdan kaldırılmış düşük düzey transkript yardımcıları kullanıyor.

- Transkript eklemeleri için `appendSessionTranscriptMessageByIdentity(...)` kullanın.
- Transkript güncelleme bildirimleri için `publishSessionTranscriptUpdateByIdentity(...)` kullanın.
- OpenClaw'ın doğru işlem sınırlarını ve kimlik işlemeyi uygulayabilmesi için yapılandırılmış transkript çalışma zamanı yüzeyini tercih edin.
- Düşük düzey transkript yardımcılarını yalnızca beyan ettiğiniz uyumluluk aralığı hâlâ bunları gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Çalışma zamanı API'si](/tr/plugins/sdk-runtime#agent-session-state) ve
  [Plugin SDK alt yolları](/tr/plugins/sdk-subpaths).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### legacy-before-agent-start

Plugin hâlâ eski `before_agent_start` kancasını kullanıyor.

- Model veya sağlayıcı geçersiz kılma işini `before_model_resolve` içine taşıyın.
- İstem veya bağlam değiştirme işini `before_prompt_build` içine taşıyın.
- `before_agent_start` öğesini yalnızca beyan ettiğiniz uyumluluk aralığı hâlâ bunu gerektiren eski OpenClaw sürümlerini desteklerken tutun.
- Bkz. [Kancalar](/tr/plugins/hooks) ve
  [Plugin uyumluluğu](/tr/plugins/compatibility).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### provider-auth-env-vars

Bildirim hâlâ eski `providerAuthEnvVars` sağlayıcı kimlik doğrulama meta verilerini kullanıyor.

- Sağlayıcı ortam değişkeni meta verilerini `setup.providers[].envVars` içine yansıtın.
- `providerAuthEnvVars` öğesini yalnızca desteklenen OpenClaw aralığınız hâlâ buna ihtiyaç duyarken uyumluluk meta verisi olarak tutun.
- Bkz. [setup başvurusu](/tr/plugins/manifest#setup-reference) ve
  [SDK geçişi](/tr/plugins/sdk-migration).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### channel-env-vars

Bildirim, ClawHub'ın beklediği geçerli setup veya yapılandırma meta verileri olmadan eski ya da daha eski kanal ortam değişkeni meta verilerini kullanıyor.

- OpenClaw'ın kanal çalışma zamanını yüklemeden setup durumunu inceleyebilmesi için kanal ortam değişkeni meta verilerini bildirime dayalı tutun.
- Ortam değişkeniyle yönlendirilen kanal setup'ını plugin biçiminiz tarafından kullanılan geçerli setup, kanal yapılandırması veya paket kanal meta verilerine yansıtın.
- `channelEnvVars` öğesini yalnızca desteklenen eski OpenClaw sürümleri hâlâ bunu gerektirirken uyumluluk meta verisi olarak tutun.
- Bkz. [Plugin bildirimi](/tr/plugins/manifest) ve
  [Kanal plugin'leri](/tr/plugins/sdk-channel-plugins).
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## Güvenlik bildirimi

### security-manifest-schema-unavailable

Paket, ClawHub'ın kullanılabilir olarak tanımadığı bir şema başvurusuyla `openclaw.security.json` gönderiyor.

- Yalnızca bilgilendirme amaçlıysa şema URL'sini kaldırın.
- Belgelenmiş sürümlü bir şemayı yalnızca OpenClaw bir tane yayımladıktan sonra kullanın.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

### unrecognized-security-manifest

Paket, desteklenmeyen bir güvenlik bildirimi dosyası gönderiyor.

- OpenClaw sürümlü bir güvenlik bildirimi şeması ve ClawHub davranışı belgeleyene kadar `openclaw.security.json` dosyasını kaldırın.
- Bildirim sözleşmesi mevcut olana kadar güvenlik açısından hassas davranışı genel paket belgelerinizde veya README dosyanızda belgeleyin.
- `clawhub package validate <path-to-plugin>` komutunu yeniden çalıştırın.

## İlgili

- [ClawHub CLI](/tr/clawhub/cli)
- [ClawHub yayımlama](/tr/clawhub/publishing)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin bildirimi](/tr/plugins/manifest)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Plugin uyumluluğu](/tr/plugins/compatibility)
